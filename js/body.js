gthing.Body = function ( radius, mass, gravity ) {
  // TODO base body, wrapping threejs functionality, adding gravity and collision.
}

/**
 * A prototype Planet.
 */
gthing.Planet = function ( radius, mass, gravityRadius ) { 
  // Three.js representation
  var material = new THREE.MeshLambertMaterial({
    color:   0xffffff,
    ambient: 0x000000,
    fog:     true
  });

  var geometry = new THREE.CircleGeometry( radius, 64 );
              // new THREE.SphereGeometry( radius, 64, 64 ); 

  this.mesh = new THREE.Mesh( geometry, material );
  
  // Physics
  // TODO right now we just put everything in a blob.
  this.physics = {
    position: this.mesh.position, // reference position in mesh
    velocity: new THREE.Vector3(),
    angle: new THREE.Vector3(),
    angularVelocity: -0.2,
    angularAxis: new THREE.Vector3(0,0,1),
    mass: mass || 1.0,
    inverseMass: ( 1.0 / mass ) || 1.0,
    forces: [],
    // Gravity
    gravity: {
      interactionRadius: gravityRadius || 0.0
    },
    // Collision
    collision: {
      type: 'radius',
      radius: radius || 100.0
    }
  }
}

/**
 * Accumulate applied forces and update position.
 */
gthing.Planet.prototype.updatePosition = function(timedelta) {
  // Accumulate forces
  var netForce = _.reduce(this.physics.forces, function(net, force) {
    return net.add(force);
  }, new THREE.Vector3());
  
  // Clear applied forces
  this.physics.forces = [];
  
  // Update velocity
  var velocityDelta = netForce.clone().multiplyScalar(this.physics.inverseMass * timedelta);
  this.physics.velocity.add(velocityDelta);
  
  // Update position
  var positionDelta = this.physics.velocity.clone().multiplyScalar(timedelta);
  
  // Update rotation
  var rotationDelta = this.physics.angularVelocity * timedelta;
  
  // Update mesh
  this.mesh.translateOnAxis(positionDelta.clone().normalize(), positionDelta.length());
  //this.mesh.rotateOnAxis(this.physics.angularAxis, rotationDelta);
  // FIXME, translation is based on orientation, affected by rotation.
  
  // Update physics
  //this.physics.position = this.mesh.position; // same vector reference
  this.physics.angle += this.physics.rotationDelta;
}