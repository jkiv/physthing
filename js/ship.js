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
  this.physics.collision.damping = 0.9;
  
  
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
  var planet = new physthing.Planet(1e6, 2000, 1e6);
  physthing.entities.push(planet);  // tell game loop to handle this object
  physthing.gravity.add(planet);    // tell gravity to handle this object
  physthing.collision.add(planet);  // tell collision to handle this object
  physthing.scene.add(planet.parentMesh); // put object in scene
  planet.translate(new THREE.Vector3(-2500,0,0));

  // Add a sun
  var planet = new physthing.Sun(1e9, 10000, 1e6);
  physthing.entities.push(planet);  // tell game loop to handle this object
  physthing.gravity.add(planet);    // tell gravity to handle this object
  physthing.collision.add(planet);  // tell collision to handle this object
  physthing.scene.add(planet.parentMesh); // put object in scene
  planet.translate(new THREE.Vector3(30e3,0,0));
  planet.physics.velocity = new THREE.Vector3(0,2000,0);
  
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