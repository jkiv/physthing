// TODO Forces in global space???

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
  var mass = 10;
  var interactionRadius = 10e3;
  
  physthing.Body.call(this, mass);
  
  // Create a mesh
  this.setMesh(this.createMesh());
  
  // Set gravity
  this.setGravity(physthing.Gravity.getOptions(interactionRadius))
  
  // Set collision
  // TODO different collision models
  this.setCollision(physthing.Collision.getOptions(5));
  
  // Ship control parameters and state
  this.control = {
    thrust: {
      forward: false,
      magnitude: 1e3
    },
    rotation: {
      cw: false,
      ccw: false,
      magnitude: 2
    }
  }
}

physthing.Ship.prototype = Object.create( physthing.Body.prototype );

/**
 * Conveniently create a Ship-like mesh.
 */
physthing.Ship.prototype.createMesh = function() {
  // TODO use options to change features

  // Create material, geometry, and mesh
  var material = new THREE.MeshLambertMaterial({
    color:   0xff00ff,
    ambient: 0x000000,
    fog:     true
  });

  var geometry = new THREE.BoxGeometry( 10, 10, 1 ); 

  var mesh = new THREE.Mesh( geometry, material );
  
  // Helper for orientation
  this.orientationArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1,0,0), // dir (unit)
    new THREE.Vector3(0,0,0), // origin
    20,                       // length
    0x00ff00,                 // color (green)
    5,                        // head length
    3                         // head width
  );
  
  mesh.add(this.orientationArrow);
  
  return mesh;
}

physthing.Ship.prototype.update = function(timedelta) {
  // TODO Update mesh?
  // TODO Emit some particles?
  
  // Apply thrust before resolving body physics
  this.applyThrust();
  
  // Update body physics
  physthing.Body.prototype.update.call(this, timedelta);
}

/**
 * Apply different forces on Ship given the Ship's state.
 */
physthing.Ship.prototype.applyThrust = function() {
  var thrustMag = this.control.thrust.magnitude;
  var rotateThrustMag = this.control.rotation.magnitude;

  // Apply thrust force if ship is thrusting
  if (this.control.thrust.forward === true) {
    var thrustForce = new THREE.Vector3(thrustMag,0,0);
    thrustForce = this.mesh.localToWorld(thrustForce);
    thrustForce = this.parentMesh.worldToLocal(thrustForce);
    
    this.physics.forces.push(thrustForce);
  }
  
  if (this.control.rotation.ccw === true) {
    var thrustMoment = new THREE.Vector3(0,0,rotateThrustMag);
    this.physics.moments.push(thrustMoment);
  }
  
  if (this.control.rotation.cw === true) {
    var thrustMoment = new THREE.Vector3(0,0,-rotateThrustMag);
    this.physics.moments.push(thrustMoment);
  }
}

physthing.Ship.prototype.startThrust = function() {
  this.control.thrust.forward = true;
}

physthing.Ship.prototype.stopThrust = function() {
  this.control.thrust.forward = false;
}

physthing.Ship.prototype.startRotateLeft = function() {
  this.control.rotation.ccw = true;
}

physthing.Ship.prototype.stopRotateLeft = function() {
  this.control.rotation.ccw = false;
}

physthing.Ship.prototype.startRotateRight = function() {
  this.control.rotation.cw = true;
}

physthing.Ship.prototype.stopRotateRight = function() {
  this.control.rotation.cw = false;
}

physthing.Ship.prototype.bindControls = function(eventRegistry) {
  // TODO better scheme later...
  var that = this;
  
  eventRegistry.registerListener('key.down', function(e) {
    switch(e.keyCode) {
      case 65: // A
        that.startRotateLeft();
        break;
      case 68: // D
        that.startRotateRight();
        break;
      case 87: // W
        that.startThrust();
        break;
      default:
      
    }
  });
  
  eventRegistry.registerListener('key.up', function(e) {
    switch(e.keyCode) {
      case 65: // A
        that.stopRotateLeft();
        break;
      case 68: // D
        that.stopRotateRight();
        break;
      case 87: // W
        that.stopThrust();
        break;
      default:
      
    }
  });
}

/**
 * Gravity test scene (1).
 */
physthing.Ship.testScene1 = function() {
  // Add a planet
  var planet = new physthing.Planet(50e3, 100, 1e6);
  physthing.entities.push(planet);  // tell game loop to handle this object
  physthing.gravity.add(planet);    // tell gravity to handle this object
  physthing.collision.add(planet);  // tell collision to handle this object
  physthing.scene.add(planet.parentMesh); // put object in scene
  planet.translate(new THREE.Vector3(-200,0,0));

  // Add a ship
  var ship = new physthing.Ship();
  physthing.entities.push(ship);    // tell game loop to handle this object
  physthing.gravity.add(ship);    // tell gravity to handle this object
  physthing.collision.add(ship);  // tell collision to handle this object
  physthing.scene.add(ship.parentMesh); // put object in scene
  ship.bindControls(physthing.eventRegistry);

  physthing.scene.remove(physthing.camera);
  ship.parentMesh.add(physthing.camera);
}