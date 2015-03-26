/**
 * Handles gravity and body interactions.
 */
Gravity = function(G, graph) {
  this.G = G || 100.0;
  
  // Callback to map node->radius for RadialCollisionGraph
  var getNodeCollisionRadius = function(node) {
    return node.data.physics.gravity.interactionRadius;
  }
  
  // Use the "complicated" (i.e. not necessarily more optimal)
  // RadialCollisionGraph for collisions.
  this.graph = new RadialCollisionGraph(getNodeCollisionRadius,
                                        this.testOverlappingFOI,
                                        this.testFullyOverlappingFOI);
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
Gravity.prototype.testOverlappingFOI = function(a, b) {
  var distance = a.physics.position.distanceTo(b.physics.position);
  var maximumDistance = a.physics.gravity.interactionRadius
                        + b.physics.gravity.interactionRadius;
  
  return distance <= maximumDistance;
}

/**
 * Determine whether one object is fully contained by the other.
 */
Gravity.prototype.testFullyOverlappingFOI = function(a, b) {
    return a.physics.position.distanceTo(b.physics.position)
             <= Math.abs(a.physics.gravity.interactionRadius - b.physics.gravity.interactionRadius); 
}

/**
 * Finds interacting bodies in [bodies] and applies gravitational force
 * to each interacting pair.
 * \see Gravity.applyBodyForces
 */
Gravity.prototype.update = function(timedelta) {
  // Update the graph
  this.graph.update();
  //this.graph.build(); // brute-force update
  
  // Apply body forces to interacting objects
  var that = this;
  this.graph.traverse(function(a, b) {
    that.applyBodyForces(a, b);
  })
}

/**
 * Put [body] under the guise of this Gravity object.
 */
Gravity.prototype.add = function(body) {
  this.graph.add(body);
}

/**
 * Remove [body] from the guise of this Gravity object.
 */
Gravity.prototype.remove = function(body) {
  this.graph.remove(body);
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