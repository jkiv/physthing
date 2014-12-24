/**
 * Handles gravity and body interactions.
 */
physthing.Gravity = function(G) {
  this.G = G || 10.0;
  this.bodies = [];
}

/**
 * Compute and add gravitational forces for two interacting bodies [a] and [b].
 */
physthing.Gravity.prototype.applyBodyForces = function(a, b) {
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
physthing.Gravity.prototype.inInteractionRange = function(a, b) {
  var distance = a.physics.position.distanceTo(b.physics.position);
  var maximumDistance = a.physics.gravity.interactionRadius
                        + b.physics.gravity.interactionRadius;
  
  return distance <= maximumDistance;
}

physthing.Gravity.prototype.findInteractingBodies = function(bodies){
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
 * \see physthing.Gravity.findInteractingBodies
 * \see physthing.Gravity.applyBodyForces
 */
physthing.Gravity.prototype.updateForces = function() {
  var that = this;
  _.forEach(this.findInteractingBodies(this.bodies), function(pair) {
    that.applyBodyForces(pair[0], pair[1]);
  });
}

/**
 * Put [body] under the guise of this Gravity object.
 */
physthing.Gravity.prototype.add = function(body) {
  this.bodies = _.union(this.bodies, [body]);
}

/**
 * Remove [body] from the guise of this Gravity object.
 */
physthing.Gravity.prototype.remove = function(body) {
  this.bodies = _.difference(this.bodies, [body]);
}

/**
 * Gravity test scene (1).
 */
physthing.Gravity.testScene1 = function() {
  // Add planet one -- like a Sun
  var planet = new physthing.Planet(30, 10e3, 1e6);
  physthing.entities.push(planet);  // tell game loop to handle this object
  physthing.gravity.add(planet);    // tell gravity to handle this object
  physthing.collision.add(planet);  // tell collision to handle this object
  physthing.scene.add(planet.mesh); // put object in scene
  
  // ... make it like a sun
  planet.mesh.material.color = new THREE.Color(0xffff00);
  planet.mesh.material.emissive = new THREE.Color(0x606000);
  planet.mesh.add(new THREE.PointLight(0xffffff, 0.5, 1e6));
  
  physthing.scene.remove(physthing.camera);
  planet.mesh.add(physthing.camera);
  
  // Add planet two -- like a Planet
  var planet = new physthing.Planet(10, 1e3, 20);
  planet.mesh.material.color = new THREE.Color(0x0000c0);
  physthing.entities.push(planet);  // tell game loop to handle this object
  physthing.gravity.add(planet);    // tell gravity to handle this object
  physthing.collision.add(planet);  // tell collision to handle this object
  physthing.scene.add(planet.mesh); // put object in scene
  
  planet.mesh.translateX(-100);
  //planet.physics.position = planet.mesh.position;
  planet.physics.velocity = new THREE.Vector3(0,-30,0);
  physthing.gravity.add(planet);
  
  // Add planet three -- like a Moon
  var m3 = 1e3;
  var r3 = 110;
  var planet = new physthing.Planet(4, m3, 10);
  planet.mesh.material.color = new THREE.Color(0xc0c0c0);
  physthing.entities.push(planet);  // tell game loop to handle this object
  physthing.gravity.add(planet);    // tell gravity to handle this object
  physthing.collision.add(planet);  // tell collision to handle this object
  physthing.scene.add(planet.mesh); // put object in scene
  
  planet.mesh.translateX(r3);
  //planet.physics.position = planet.mesh.position;
  planet.physics.velocity = new THREE.Vector3(0,-30,0);
  physthing.gravity.add(planet);
}