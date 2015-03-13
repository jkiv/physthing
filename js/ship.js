// Ship ///////////////////////////////////////////////////////////////

/**
 * Conveniently create a Ship (Body).
 */
Ship = function( mass ) {
  var interactionRadius = 10e3;
  
  Body.call(this, mass);
  
  // Create a mesh
  this.setMesh(this.createMesh());
  
  // Set gravity
  this.setGravity(Gravity.getOptions(interactionRadius))
  
  // Set collision
  // TODO square collision model
  this.setCollision(Collision.getOptions(5));
  this.physics.collision.damping = 0.8;
  
  // Ship control parameters and state
  this.control = {
    thrust: {
      forward: false,
      source: null
    },
    attitude: {
      cw: false,
      ccw: false,
      source: null
    }
  }
  
  // Parts of the ship? Or something...
  this.parts = {
    // Thruster parts? Or something...
    thrust: {
      large: {
        magnitude: 1e6,
        fuel: 100,
        burnRate: 0. // TODO appropriate burn rate
      },
      small: {
        magnitude: 5e3,
        fuel: 100,
        burnRate: 0., // TODO appropriate burn rate
      }
    },
    // Rotator/attitude parts? Or something...
    attitude: {
      basic: {
        magnitude: 2,
        fuel: 100,
        burnRate: 0., // TODO appropriate burn rate
        stabilizaiton: false
      }
    }
  }
  
  // Set up parts
  this.control.thrust.source = this.parts.thrust.large;
  this.control.attitude.source = this.parts.attitude.basic;
}

Ship.prototype = Object.create( Body.prototype );

/**
 * Conveniently create a Ship-like mesh.
 */
Ship.prototype.createMesh = function() {
  // TODO use options to change features

  // Create material, geometry, and mesh
  var material = new THREE.MeshLambertMaterial({
    color:   0xff00ff,
    ambient: 0xff00ff,
    fog:     true
  });

  var geometry = new THREE.BoxGeometry( 10, 10, 1 );
  //var geometry = new THREE.SphereGeometry( 10, 64, 4 );

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

Ship.prototype.update = function(timedelta) {
  // TODO Update mesh?
  // TODO Emit some particles?
  
  // Apply thrust before resolving body physics
  this.applyThrust();
  
  // Update body physics
  Body.prototype.update.call(this, timedelta);
}

/**
 * Apply different forces on Ship given the Ship's state.
 */
Ship.prototype.applyThrust = function() {
  var thrustSrc = this.control.thrust.source;
  var attitudeSrc = this.control.attitude.source;

  // Apply thrust force if ship is thrusting
  if (this.control.thrust.forward === true && thrustSrc.fuel > 0) {
    var thrustForce = new THREE.Vector3(thrustSrc.magnitude,0,0);
    thrustForce = this.mesh.localToWorld(thrustForce);
    thrustForce = this.parentMesh.worldToLocal(thrustForce);
    
    this.physics.forces.push(thrustForce);
    thrustSrc.fuel -= thrustSrc.burnRate;
  }
  
  if (this.control.attitude.ccw === true && attitudeSrc.fuel > 0) {
    var thrustMoment = new THREE.Vector3(0,0,attitudeSrc.magnitude);
    this.physics.moments.push(thrustMoment);
    attitudeSrc.fuel -= attitudeSrc.burnRate;
  }
  
  if (this.control.attitude.cw === true && attitudeSrc.fuel > 0) {
    var thrustMoment = new THREE.Vector3(0,0,-attitudeSrc.magnitude);
    this.physics.moments.push(thrustMoment);
    attitudeSrc.fuel -= attitudeSrc.burnRate;
  }
}

Ship.prototype.startThrust = function() {
  this.control.thrust.forward = true;
}

Ship.prototype.stopThrust = function() {
  this.control.thrust.forward = false;
}

Ship.prototype.startRotateLeft = function() {
  this.control.attitude.ccw = true;
}

Ship.prototype.stopRotateLeft = function() {
  this.control.attitude.ccw = false;
}

Ship.prototype.startRotateRight = function() {
  this.control.attitude.cw = true;
}

Ship.prototype.stopRotateRight = function() {
  this.control.attitude.cw = false;
}

Ship.prototype.bindControls = function(eventRegistry) {
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
Ship.testScene1 = function(thing) {
  // Add a planet
  var planet = new Planet(100e6, 2e3, 1e6);
  thing.entities.push(planet);  // tell game loop to handle this object
  thing.gravity.add(planet);    // tell gravity to handle this object
  thing.collision.add(planet);  // tell collision to handle this object
  thing.scene.add(planet.parentMesh); // put object in scene
  planet.translate(new THREE.Vector3(0,5e3,0));
  planet.physics.velocity = new THREE.Vector3(0,18e3,0);

  // Add a sun
  var planet = new Sun(1e12, 100e3, 100e6);
  thing.entities.push(planet);  // tell game loop to handle this object
  thing.gravity.add(planet);    // tell gravity to handle this object
  thing.collision.add(planet);  // tell collision to handle this object
  thing.scene.add(planet.parentMesh); // put object in scene
  planet.translate(new THREE.Vector3(300e3,0,0));
  
  // Add a ship
  var ship = new Ship(1e3);
  thing.entities.push(ship);    // tell game loop to handle this object
  thing.gravity.add(ship);    // tell gravity to handle this object
  thing.collision.add(ship);  // tell collision to handle this object
  thing.scene.add(ship.parentMesh); // put object in scene
  ship.bindControls(thing.eventRegistry);
  ship.physics.velocity = new THREE.Vector3(1.2e3,18e3,0);

  thing.scene.remove(thing.camera);
  ship.parentMesh.add(thing.camera);
}