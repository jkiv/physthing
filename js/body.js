// Body (base) ////////////////////////////////////////////////////////

physthing.Body = function ( mass ) {
  // Three.js visual representation
  this.mesh = null; // apply rotations to this
  this.parentMesh = new THREE.Object3D(); // apply translations to this
  
  // Body physics
  this.physics = {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    acceleration: new THREE.Vector3(),
    angle: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(),
    angularAcceleration: new THREE.Vector3(),
    mass: 1.,
    inverseMass: 1.,
    forces: [],
    moments: [],
    collision: null, // { type, radius, damping }
    gravity: null    // { interactionRadius }
  };
  
  // Debug helpers TODO
  this.debug = {
    orientationArrow: null,
    velocityArrow: null,
    accelerationArrow: null
  };
  
  // Update properties via parameters
  this.setMass(mass);
}

physthing.Body.prototype.setMesh = function( mesh ) {
  // Remove previous mesh reference
  if (this.mesh !== null) {
    this.parentMesh.remove(mesh);
  }
  
  if (mesh !== null) {
    this.mesh = mesh;
    this.parentMesh.add(mesh);
    
    this.parentMesh.position = this.physics.position.clone(); // maintain position
    this.physics.position = this.parentMesh.position; // keep position reference in this.physics
  }
  // TODO maintain rotation
}

/**
 * Wrap handling translations (by vector)
 */
physthing.Body.prototype.translate = function(v) {
  this.parentMesh.translateOnAxis(v.clone().normalize(), v.length());
}

/**
 * Wrap handling rotations (angle about z-axis).
 */
physthing.Body.prototype.rotate = function(a) {
  this.mesh.rotateOnAxis(new THREE.Vector3(0,0,1), a);
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
  // TODO forces and whatnot are in global space, but we're altering
  //      local positions/rotations.
  //      Convert things to world and back to local?

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
  
  // Accumulate forces
  var netMoment = _.reduce(this.physics.moments, function(net, moment) {
    return net.add(moment);
  }, new THREE.Vector3());

  // Update rotation velocity
  // TODO moments of inertia
  var angularVelocityDelta = netMoment.clone().multiplyScalar(timedelta);
  this.physics.angularAcceleration.set(
    angularVelocityDelta.x,
    angularVelocityDelta.y,
    angularVelocityDelta.z
  );
  this.physics.angularVelocity.add(angularVelocityDelta);
  
  // Update rotation position
  var angleDelta = this.physics.angularVelocity.clone().multiplyScalar(timedelta);
  this.rotate(angleDelta.z);
  
  // Update velocity
  var velocityDelta = netForce.clone().multiplyScalar(this.physics.inverseMass * timedelta);
  this.physics.acceleration.set(
    velocityDelta.x,
    velocityDelta.y,
    velocityDelta.z
  );
  this.physics.velocity.add(velocityDelta);
  
  // Update position
  var positionDelta = this.physics.velocity.clone().multiplyScalar(timedelta);
  this.translate(positionDelta);
  
  // Clear force and constraint accumulators
  this.physics.forces = [];
  this.physics.moments = [];
  //this.physics.constraints = [];
}