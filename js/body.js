// Body (base) ////////////////////////////////////////////////////////

physthing.Body = function ( mass ) {
  // Three.js visual representation
  this.mesh = null;
  
  // Body physics
  this.physics = {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    angle: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(),
    mass: 1.,
    inverseMass: 1.,
    forces: [],
    collision: null, // { type, radius, damping }
    gravity: null    // { interactionRadius }
  };
  
  // Update properties via parameters
  this.setMass(mass);
}

physthing.Body.prototype.setMesh = function( mesh ) {
  mesh.position = this.physics.position.clone(); // maintain local position
  this.physics.position = mesh.position; // keep reference of mesh position
  this.mesh = mesh;
}

/**
 * Get gravity options for this body.
 * \see physthing.Gravity.getOptions
 */
physthing.Body.prototype.setGravity = function( gravity ) {
  this.physics.gravity = gravity; 
}

/**
 * Get collision options for this body.
 * \see physthing.Collision.getOptions
 */
physthing.Body.prototype.setCollision = function( collision ) {
  this.physics.collision = collision;
}

physthing.Body.prototype.setMass = function( mass ) {
  this.physics.mass = mass || this.physics.mass;
  this.physics.inverseMass = 1/mass || this.physics.inverseMass;
}

/**
 * Accumulate applied forces and update position.
 */
physthing.Body.prototype.update = function(timedelta) {
  // Apply constraints
  // TODO constraint callbacks?
  // var that = this;
  //_.forEach(this.physics.constraints, function(constraint) {
  //  constraint(that);
  //});

  // Accumulate forces
  var netForce = _.reduce(this.physics.forces, function(net, force) {
    return net.add(force);
  }, new THREE.Vector3());
  
  // Update velocity
  var velocityDelta = netForce.clone().multiplyScalar(this.physics.inverseMass * timedelta);
  this.physics.velocity.add(velocityDelta);
  
  // Update position
  var positionDelta = this.physics.velocity.clone().multiplyScalar(timedelta);
  this.mesh.translateOnAxis(positionDelta.clone().normalize(), positionDelta.length());

  // TODO rotation (independent of translation)
  
  // Clear force and constraint accumulators
  this.physics.forces = [];
  //this.physics.constraints = [];
}

// Planet /////////////////////////////////////////////////////////////

/**
 * Conveniently create a Planet (Body).
 */
physthing.Planet = function ( mass, radius, interactionRadius ) { 
  physthing.Body.call( this, mass );
  
  // Create a mesh
  this.setMesh(this.createMesh(radius));
  
  // Set gravity
  this.setGravity(physthing.Gravity.getOptions(interactionRadius))
  
  // Set collision
  this.setCollision(physthing.Collision.getOptions(radius));
  
  // Remember the Planet's radius
  this.radius = radius;
}

physthing.Planet.prototype = Object.create( physthing.Body.prototype );

/**
 * Conveniently create a Planet-like mesh.
 */
physthing.Planet.prototype.createMesh = function( radius, options ) {
  // TODO use options to change features
  
  // Create material, geometry, and mesh
  var material = new THREE.MeshLambertMaterial({
    color:   0xffffff,
    ambient: 0x000000,
    fog:     true
  });

  var geometry = new THREE.CircleGeometry( radius, 64 );
  //var geometry = new THREE.SphereGeometry( radius, 32, 32 ); 

  return new THREE.Mesh( geometry, material );
}

physthing.Planet.prototype.setRadius = function( radius ) {
  // TODO update a bunch of unrelated things :(
}

/**
 * Accumulate applied forces and update position.
 */
physthing.Planet.prototype.update = function(timedelta) {
  // Update mesh?
  // Do other things based on state?
  
  // Update body physics
  physthing.Body.prototype.update.call(this, timedelta);
}

// Ship ///////////////////////////////////////////////////////////////

/**
 * Conveniently create a Ship (Body).
 */
physthing.Ship = function() {
  var mass = 5;
  var interactionRadius = 1e3;
  
  physthing.Body.call(this, mass);
  
  // Create a mesh
  this.setMesh(this.createMesh());
  
  // Set gravity
  this.setGravity(physthing.Gravity.getOptions(interactionRadius))
  
  // Set collision
  this.setCollision(physthing.Collision.getOptions(radius));
  
  // Ship state
  this.thrustOn = false;
}

/**
 * Conveniently create a Ship-like mesh.
 */
physthing.Ship.prototype.createMesh = function() {
  // TODO use options to change features

  // Create material, geometry, and mesh
  var material = new THREE.MeshLambertMaterial({
    color:   0xffffff,
    ambient: 0x000000,
    fog:     true
  });

  var geometry = new THREE.BoxGeometry( 10, 10, 1 ); 

  return new THREE.Mesh( geometry, material );
}

physthing.Ship.prototype.update = function(timedelta) {
  // Update mesh?
  // TODO emit some particles?
  
  // Do other things based on state?
  this.applyThrust();
  
  // Update body physics
  physthing.Body.prototype.update.call(this, timedelta);
}

physthing.Ship.prototype.applyThrust = function() {
  // Apply thrust force if ship is thrusting
  if (this.isThrustOn === true) {
    var thrustMag = 10;
    var thrustForce = new Vector3(thrustMag,0,0);
    this.forces.push(thrustForce);
  }
}

physthing.startThrust = function() {
  this.isThrustOn = true;
}

physthing.stopThrust = function() {
  this.isThrustOn = false;
}