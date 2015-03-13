/**
 * Handles gravity and body interactions.
 */
Gravity = function(G) {
  this.G = G || 100.0;
  this.bodies = [];
}

/**
 * Compute and add gravitational forces for two interacting bodies [a] and [b].
 */
Gravity.prototype.applyBodyForces = function(a, b) {
    var abVector = new THREE.Vector3();
    abVector.subVectors(b.physics.position, a.physics.position); // from [a] to [b]
    var rSq = abVector.lengthSq();
    var forceMag = (rSq === 0) ? 0.0 : this.G * a.physics.mass * b.physics.mass / rSq;
    var norm = abVector.clone().normalize();
    
    // Force in equal and opposite directions (thx @therealnewton)
    a.physics.forces.push(norm.clone().multiplyScalar(forceMag));
    b.physics.forces.push(norm.clone().multiplyScalar(-forceMag));
}

/**
 * Determine whether two objects are within each other's interacting range.
 */
Gravity.prototype.inInteractionRange = function(a, b) {
  var distance = a.physics.position.distanceTo(b.physics.position);
  var maximumDistance = a.physics.gravity.interactionRadius
                        + b.physics.gravity.interactionRadius;
  
  return distance <= maximumDistance;
}

Gravity.prototype.findInteractingBodies = function(bodies){
  var visitedFrom = [];
  var pairs = [];
  var that = this;
  
  // Find interacting bodies the dumb way
  // 1. for each body, test against all other bodies
  // 2. skip bodies in inner loop that were seen in outer loop
  _.forEach(bodies, function(bodyFrom) {
    // Start remembering who we visited from [bodyFrom]
    visitedFrom.push(bodyFrom);
    
    // Skip body if no gravity present
    if (bodyFrom.physics.gravity === undefined) {
      return;
    }
    
    _.forEach(bodies, function(bodyTo) {
      // Skip body if no gravity present
      if (bodyTo.physics.gravity === undefined) {
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
 * Finds interacting bodies in [bodies] and applies gravitational force
 * to each interacting pair.
 * \see Gravity.findInteractingBodies
 * \see Gravity.applyBodyForces
 */
Gravity.prototype.update = function(timedelta) {
  var that = this;
  
  // Apply body forces between interacting objects
  _.forEach(this.findInteractingBodies(this.bodies), function(pair) {
    that.applyBodyForces(pair[0], pair[1]);
  });
}

/**
 * Put [body] under the guise of this Gravity object.
 */
Gravity.prototype.add = function(body) {
  this.bodies = _.union(this.bodies, [body]);
}

/**
 * Remove [body] from the guise of this Gravity object.
 */
Gravity.prototype.remove = function(body) {
  this.bodies = _.difference(this.bodies, [body]);
}

Gravity.getOptions = function(radius) {
  return {
    interactionRadius: radius || 100.0
  };
}

/**
 * Gravity test scene (1).
 */
Gravity.testScene1 = function(thing) {
  // Add planet one -- like a Sun
  var planet = new Sun(50e3, 100, 1e6);
  thing.entities.push(planet);  // tell game loop to handle this object
  thing.gravity.add(planet);    // tell gravity to handle this object
  thing.collision.add(planet);  // tell collision to handle this object
  scene.add(planet.parentMesh); // put object in scene
  
  thing.scene.remove(camera);
  planet.parentMesh.add(camera);
  
  // Add planet two -- like a Planet
  var planet = new Planet(1e3, 15, 1000);
  planet.mesh.material.color = new THREE.Color(0x0000c0);
  thing.entities.push(planet);  // tell game loop to handle this object
  thing.gravity.add(planet);    // tell gravity to handle this object
  thing.collision.add(planet);  // tell collision to handle this object
  thing.scene.add(planet.parentMesh); // put object in scene
  
  planet.translate(new THREE.Vector3(-400,0,0));
  planet.physics.velocity = new THREE.Vector3(0,-120,0);
  thing.gravity.add(planet);
  
  // Add planet three -- like a Moon
  var planet = new Planet(100, 5, 1000);
  planet.mesh.material.color = new THREE.Color(0xc0c0c0);
  thing.entities.push(planet);  // tell game loop to handle this object
  thing.gravity.add(planet);    // tell gravity to handle this object
  thing.collision.add(planet);  // tell collision to handle this object
  thing.scene.add(planet.parentMesh); // put object in scene
  
  planet.translate(new THREE.Vector3(-400,50,0));
  planet.physics.velocity = new THREE.Vector3(-40,-120,0);
  thing.gravity.add(planet);
}