// TODO Forces in global space???

physthing.Collision = function() {
  this.bodies = [];
}

/**
 * Compute and add collision forces for two interacting bodies [a] and [b].
 */
physthing.Collision.prototype.performCollisionConstraints = function(a, b) {
  // TODO avoid exposing collision details
  
  // 1. Perform elastic collision along collision normal
  // Get collision normal(s)
  var abVector = b.physics.position.clone().sub(a.physics.position);
  var normA = abVector.clone().normalize(); // a->b
  var normB = normA.clone().negate();       // b->a
  
  var ua = a.physics.velocity.clone().projectOnVector(normA);
  var ub = b.physics.velocity.clone().projectOnVector(normB);
  var ma = a.physics.mass;
  var mb = b.physics.mass;
  var M = ma + mb;
  
  if (M === 0) { return; } // avoid divisions by zero TODO more elegantly
  
  var va = ua.clone().multiplyScalar(ma - mb).add(ub.clone().multiplyScalar(2*mb)).multiplyScalar(1/M);
  var vb = ub.clone().multiplyScalar(mb - ma).add(ua.clone().multiplyScalar(2*ma)).multiplyScalar(1/M);
  
  // Replace ua, ub with new velocities va, vb
  a.physics.velocity.sub(ua);
  b.physics.velocity.sub(ub);
  
  a.physics.velocity.add(va.multiplyScalar(1-a.physics.collision.damping));
  b.physics.velocity.add(vb.multiplyScalar(1-b.physics.collision.damping));
  
  // 2. Remove overlap along collision normal (proportional to mass)
  var overlap = (a.physics.collision.radius + b.physics.collision.radius)
                   - abVector.length(); 

  a.physics.position.add(normB.clone().multiplyScalar(overlap * mb/M));
  b.physics.position.add(normA.clone().multiplyScalar(overlap * ma/M));
  
  // 3. TODO Transfer angular momentum
}

/**
 * Determine whether two objects are within each other's interacting range.
 */
physthing.Collision.prototype.inInteractionRange = function(a, b) {
  var distance = a.physics.position.distanceTo(b.physics.position);
  var maximumDistance = a.physics.collision.radius
                        + b.physics.collision.radius;
  
  return distance <= maximumDistance;
}

physthing.Collision.prototype.findInteractingBodies = function(bodies){
  var visitedFrom = [];
  var pairs = [];
  var that = this;
  
  // Find interacting bodies the dumb way
  // 1. for each body, test against all other bodies
  // 2. skip bodies in inner loop that were seen in outer loop
  _.forEach(bodies, function(bodyFrom) {
    // Start remembering who we visited from [bodyFrom]
    visitedFrom.push(bodyFrom);
    
    // Skip body if no collision present
    if (bodyFrom.physics.collision === undefined) {
      return;
    }
    
    _.forEach(bodies, function(bodyTo) {
      // Skip body if no collision present
      if (bodyTo.physics.collision === undefined) {
        return;
      }
      
      // Have we seen this pair before?
      if (_.contains(visitedFrom, bodyTo) === false) {
        // We have not seen this pair before. Test interaction.
        if (that.inInteractionRange(bodyTo, bodyFrom)) {
           // Interacting pair, remember pair
           pairs.push([bodyTo, bodyFrom]);
        }
      }
    }); 
  });
  
  return pairs;
}

/**
 * Update collision resolver.
 */
physthing.Collision.prototype.update = function(timedelta) {
  var that = this;
  
  // Apply body forces/constraints to colliding objects
  _.forEach(this.findInteractingBodies(this.bodies), function(pair) {
    that.performCollisionConstraints(pair[0], pair[1]);
  });
}

/**
 * Put [body] under the guise of this Collision object.
 */
physthing.Collision.prototype.add = function(body) {
  this.bodies = _.union(this.bodies, [body]);
}

/**
 * Remove [body] from the guise of this Collision object.
 */
physthing.Collision.prototype.remove = function(body) {
  this.bodies = _.difference(this.bodies, [body]);
}

physthing.Collision.getOptions = function(radius, damping) {
  return {
    type: 'radius',
    radius: radius || 0.0,
    damping: damping || 0.1
  };
}

/**
 * Collision test scene (1).
 */
physthing.Collision.testScene1 = function() {
  var n = 5;
  var m = 5;
  var mass = 10;
  var radius = 10;
  var collisionRadius = 1e9;
  
  // Add a grid of planets with gravity and collision
  for(var r = -n/2; r < n/2; r++) {
    for(var c = -m/2; c < m/2; c++) {
      // Construct base planet
      var planet = new physthing.Planet(mass, radius, collisionRadius);
      physthing.entities.push(planet);  // tell game loop to handle this object
      physthing.gravity.add(planet);    // tell gravity to handle this object
      physthing.collision.add(planet);  // tell collision to handle this object
      physthing.scene.add(planet.parentMesh); // put object in scene
      
      // Customize planet
      var grey = (Math.random()*0.25 + 0.75);
      planet.mesh.material.color = new THREE.Color(grey+(0.1*Math.random()),
                                                   grey+(0.1*Math.random()),
                                                   grey+(0.1*Math.random()));
      //planet.physics.velocity = new THREE.Vector3(-20*r, 20*c, 0);
      planet.translate(new THREE.Vector3(c*50,r*50,0));
    }
  }
}