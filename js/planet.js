// Planet /////////////////////////////////////////////////////////////

/**
 * Conveniently create a Planet (Body).
 */
Planet = function ( mass, radius, interactionRadius ) { 
  Body.call( this, mass );
  
  // Create a mesh
  this.setMesh(this.createMesh(radius));
  
  // Set gravity
  this.setGravity(Gravity.getOptions(interactionRadius))
  
  // Set collision
  this.setCollision(Collision.getOptions(radius));
  
  // Remember the Planet's radius
  this.radius = radius;
}

Planet.prototype = Object.create( Body.prototype );

/**
 * Conveniently create a Planet-like mesh.
 */
Planet.prototype.createMesh = function( radius, options ) {
  // TODO use options to change features
  
  // Create material, geometry, and mesh
  var material = new THREE.MeshLambertMaterial({
    color:   0xffffff,
    ambient: 0x000000,
    //emissive: 0xffffff,
    fog:     true
  });

  //var geometry = new THREE.CircleGeometry( radius, 64 );
  var geometry = new THREE.SphereGeometry( radius, 64, 64 );

  return new THREE.Mesh( geometry, material );
}

Planet.prototype.setRadius = function( radius ) {
  // TODO update a bunch of unrelated things :(
}

/**
 * Accumulate applied forces and update position.
 */
Planet.prototype.update = function(timedelta) {
  // Update mesh?
  // Do other things based on state?
  
  // Update body physics
  Body.prototype.update.call(this, timedelta);
}

// Sun ////////////////////////////////////////////////////////////////

Sun = function( mass, radius, interactionRadius ) {
  Planet.call( this, mass, radius, interactionRadius );
}

Sun.prototype = Object.create( Body.prototype );

/**
 * Conveniently create a Planet-like mesh.
 */
Sun.prototype.createMesh = function( radius, options ) {
  // TODO use options to change features
  
  // Create material, geometry, and mesh
  var material = new THREE.MeshLambertMaterial({
    color:   0xffffff,
    ambient: 0x000000,
    emissive: 0xffff00,
    fog: true
  });
  
  //var geometry = new THREE.CircleGeometry( radius, 64 );
  var geometry = new THREE.SphereGeometry( radius, 64, 64 ); 

  var mesh = new THREE.Mesh( geometry, material );
  
  // Put a point light inside for good measure
  mesh.add(new THREE.PointLight(0xffff90, 0.5, 1e6*radius));
  
  return mesh;
}