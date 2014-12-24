physthing.Collision = function() {
  this.bodies = [];
}

/**
 * Compute and add collision forces for two interacting bodies [a] and [b].
 */
physthing.Collision.prototype.applyBodyForces = function(a, b) {
  var abVector = b.physics.position.clone().sub(a.physics.position);
  
  // Get collision normal(s)
  var normA = abVector.normalize();   // a->b
  var normB = normA.clone().negate(); // b->a
  
  // Cancel out acceleration along normal
  var netForceA = _.reduce(a.physics.forces, function(net, force) {
    return net.add(force);
  }, new THREE.Vector3());
  
  var netForceB = _.reduce(b.physics.forces, function(net, force) {
    return net.add(force);
  }, new THREE.Vector3());
  
  netForceA.projectOnVector(normA).negate();
  netForceB.projectOnVector(normB).negate();
  
  a.physics.forces.push(netForceA);
  b.physics.forces.push(netForceB);
  
  // Perform elastic collision //
  var ua = a.physics.velocity.clone().projectOnVector(normA);
  var ub = b.physics.velocity.clone().projectOnVector(normB);
  var ma = a.physics.mass;
  var mb = b.physics.mass;
  var M = ma + mb;
  
  var va = ua.clone().multiplyScalar(ma - mb).add(ub.clone().multiplyScalar(2*mb)).multiplyScalar(1/M);
  var vb = ub.clone().multiplyScalar(mb - ma).add(ua.clone().multiplyScalar(2*ma)).multiplyScalar(1/M);
  
  // Remove ua, ub components
  a.physics.velocity.sub(ua);
  b.physics.velocity.sub(ub);
  
  // Replace ua, ub with new velocities va, vb
  a.physics.velocity.add(va);
  b.physics.velocity.add(vb);
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
 *
 */
physthing.Collision.prototype.applyConstraints = function() {
  var that = this;
  _.forEach(this.findInteractingBodies(this.bodies), function(pair) {
    that.applyBodyForces(pair[0], pair[1]);
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

/**
 * Collision test scene (1).
 */
physthing.Collision.testScene1 = function() {
  var n = 5;
  var m = 5;
  var mass = 10e3;
  var radius = 10;
  var collisionRadius = 1e9;
  
  // Add a grid of planets with gravity and collision
  for(var r = -n/2; r < n/2; r++) {
    for(var c = -m/2; c < m/2; c++) {
      // Construct base planet
      var planet = new physthing.Planet(radius, mass, collisionRadius);
      physthing.entities.push(planet);  // tell game loop to handle this object
      physthing.gravity.add(planet);    // tell gravity to handle this object
      physthing.collision.add(planet);  // tell collision to handle this object
      physthing.scene.add(planet.mesh); // put object in scene
      
      // Customize planet
      var grey = (Math.random() + 0.5) / 1.5;
      planet.mesh.material.color = new THREE.Color(grey, grey, grey);
      planet.physics.velocity = new THREE.Vector3(-20*r, 20*c, 0);
      planet.mesh.translateX(c*50);
      planet.mesh.translateY(r*50);
    }
  }
}