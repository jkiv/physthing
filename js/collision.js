gthing.Collision = function() {
  this.bodies = [];
}

/**
 * Compute and add collision forces for two interacting bodies [a] and [b].
 */
gthing.Collision.prototype.applyBodyForces = function(a, b) {
  // As long as two objects are colliding, a force should exist
  // to prevent the velocity from translating the objects over
  // one another any further. To do this,
  // 1. Apply a force that cancels out acceleration along normal.
  // 2. Apply one force to cancel out velocity along normal.

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
  
  // Cancel out velocity along normal
  // TODO transfer velocity along normal based on masses and velocities
  a.physics.velocity.sub(a.physics.velocity.clone().projectOnVector(normA));
  b.physics.velocity.sub(b.physics.velocity.clone().projectOnVector(normB));
  
  // Cancel out overlap
  
}

/**
 * Determine whether two objects are within each other's interacting range.
 */
gthing.Collision.prototype.inInteractionRange = function(a, b) {
  var distance = a.physics.position.distanceTo(b.physics.position);
  var maximumDistance = a.physics.collision.radius
                        + b.physics.collision.radius;
  
  return distance <= maximumDistance;
}


gthing.Collision.prototype.findInteractingBodies = function(bodies){
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
gthing.Collision.prototype.applyConstraints = function() {
  var that = this;
  _.forEach(this.findInteractingBodies(this.bodies), function(pair) {
    that.applyBodyForces(pair[0], pair[1]);
  });
}

/**
 * Put [body] under the guise of this Collision object.
 */
gthing.Collision.prototype.add = function(body) {
  this.bodies = _.union(this.bodies, [body]);
}

/**
 * Remove [body] from the guise of this Collision object.
 */
gthing.Collision.prototype.remove = function(body) {
  this.bodies = _.difference(this.bodies, [body]);
}

/**
 * Collision test scene (1).
 */
gthing.Collision.testScene1 = function() {
  // Add a grid of planets with gravity and collision
  
  var n = 5;
  var m = 5;
  
  for(var r = -n/2; r < n/2; r++) {
    for(var c = -m/2; c < m/2; c++) {
      var planet = new gthing.Planet(10, 1e3, 1e9);
      var grey = (Math.random() + 0.5) / 1.5;
      planet.mesh.material.color = new THREE.Color(grey,
                                                   grey,
                                                   grey);
      gthing.entities.push(planet);  // tell game loop to handle this object
      gthing.gravity.add(planet);    // tell gravity to handle this object
      gthing.collision.add(planet);  // tell collision to handle this object
      gthing.scene.add(planet.mesh); // put object in scene
      
      planet.mesh.translateX(c*50);
      planet.mesh.translateY(r*50);
    }
  }
}