// TODO Forces in global space???

Collision = function() {
  this.bodies = [];
  
  this.graph = new RadialCollisionGraph();
  //this.graph = new NaiveCollisionGraph();
}

/**
 * Compute and add collision forces for two interacting bodies [a] and [b].
 */
Collision.prototype.performCollisionConstraints = function(a, b) {
  // TODO avoid exposing collision details
  
  // 1. Perform collision along collision normal
  //    (see http://en.wikipedia.org/wiki/Coefficient_of_restitution#Speeds_after_impact)
  // Get collision normal(s)
  var abVector = b.physics.position.clone().sub(a.physics.position);
  var normA = abVector.clone().normalize(); // a->b
  var normB = normA.clone().negate();       // b->a
  
  var ua = a.physics.velocity.clone().projectOnVector(normA);
  var ub = b.physics.velocity.clone().projectOnVector(normB);
  var ma = a.physics.mass;
  var mb = b.physics.mass;
  var M = ma + mb;
  var Cra = 1 - a.physics.collision.damping;
  var Crb = 1 - b.physics.collision.damping;
  
  if (M === 0) { return; } // avoid divisions by zero TODO more elegantly
 
  var vc = ua.clone().multiplyScalar(ma).add(ub.clone().multiplyScalar(mb)); // common part of va and vb
  var va = vc.clone().add(ua.clone().sub(ub).multiplyScalar(mb*Cra)).multiplyScalar(1/M);
  var vb = vc.clone().add(ub.clone().sub(ua).multiplyScalar(ma*Crb)).multiplyScalar(1/M);
  
  // Completely elastic collision:  
  //var va = ua.clone().multiplyScalar(ma - mb).add(ub.clone().multiplyScalar(2*mb)).multiplyScalar(1/M);
  //var vb = ub.clone().multiplyScalar(mb - ma).add(ua.clone().multiplyScalar(2*ma)).multiplyScalar(1/M);
  
  // Replace ua, ub with new velocities va, vb
  a.physics.velocity.sub(ua).add(va);
  b.physics.velocity.sub(ub).add(vb);
  
  // 2. Remove overlap along collision normal (proportional to mass)
  var overlap = (a.physics.collision.radius + b.physics.collision.radius)
                   - abVector.length();
                   
  a.physics.position.add(normB.clone().multiplyScalar(overlap * mb/M));
  b.physics.position.add(normA.clone().multiplyScalar(overlap * ma/M));
  
  // 3. TODO Transfer angular momentum
  
  // 4. TODO Apply frictional force
  // what is the normal force? from gravity?
  // what is the coeff. of friction?
}

/**
 * Determine whether two objects are within each other's interacting range.
 */
//Collision.prototype.inInteractionRange = function(a, b) {
Collision.testOverlappingFOI = function(a, b) {
  var distance = a.physics.position.distanceTo(b.physics.position);
  var maximumDistance = a.physics.collision.radius
                        + b.physics.collision.radius;
  
  return distance <= maximumDistance;
}

Collision.prototype.testOverlappingFOI = Collision.testOverlappingFOI;

/**
 * Determine whether one object is fully contained by the other.
 */
Collision.testFullyOverlappingFOI = function(a, b) {
    return a.physics.position.distanceTo(b.physics.position)
             <= Math.abs(a.physics.collision.radius - b.physics.collision.radius); 
}

Collision.prototype.testFullyOverlappingFOI = Collision.testFullyOverlappingFOI;

/**
 * Update collision resolver.
 */
Collision.prototype.update = function(timedelta) {
  var that = this;
  
  this.graph.build(); // FIXME TODO rebuilding graph every frame is performant?
  
  // Apply body forces/constraints to colliding objects
  this.graph.traverse(function(a, b) {
    that.performCollisionConstraints(a, b);
  })
}

/**
 * Put [body] under the guise of this Collision object.
 */
Collision.prototype.add = function(body) {
  this.graph.add(body);
}

/**
 * Remove [body] from the guise of this Collision object.
 */
Collision.prototype.remove = function(body) {
  this.graph.remove(body);
}

// TODO make a CollisionComponent?
Collision.getOptions = function(radius, damping) {
  return {
    type: 'radius',
    radius: radius || 0.0,
    damping: damping || 0.6
  };
}

/**
 * Collision test scene (1).
 */
Collision.testScene1 = function(thing) {
  var n = 1;
  var m = 2;
  var mass = 100;
  var radius = 10;
  var collisionRadius = 500;
  var separation = collisionRadius/2;
  
  // Add a grid of planets with gravity and collision
  for(var r = -n/2.0; r < n/2.0; r++) {
    for(var c = -m/2.0; c < m/2.0; c++) {
      // Construct base planet
      var planet = new Planet(mass, radius, collisionRadius);
      
      // Customize planet          
      var grey = (Math.random()*0.1 + 0.8);
      
      var material = new THREE.MeshLambertMaterial({
        color:   new THREE.Color(grey, grey, grey),
        ambient: 0xcccccc,
        fog:     true
      });
      
      var geometry = new THREE.SphereGeometry( radius, radius, 64 );

      var mesh = new THREE.Mesh( geometry, material );
      
      planet.setMesh(mesh);
      
      planet.translate(new THREE.Vector3(c*separation,r*separation,0));
      
      // Add planet to physthing, gravity, collision, ...
      thing.entities.push(planet);  // tell game loop to handle this object
      thing.gravity.add(planet);    // tell gravity to handle this object
      thing.collision.add(planet);  // tell collision to handle this object
      thing.scene.add(planet.parentMesh); // put object in scene
    }
  }
}