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
    //emissive: 0xffffff,
    fog:     true
  });

  //var geometry = new THREE.CircleGeometry( radius, 64 );
  var geometry = new THREE.SphereGeometry( radius, 128, 128 ); 

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

// Sun ////////////////////////////////////////////////////////////////

physthing.Sun = function( mass, radius, interactionRadius ) {
  physthing.Planet.call( this, mass, radius, interactionRadius );
  
  
}

physthing.Sun.prototype = Object.create( physthing.Body.prototype );

/**
 * Conveniently create a Planet-like mesh.
 */
physthing.Sun.prototype.createMesh = function( radius, options ) {
  // TODO use options to change features
  
  // Create material, geometry, and mesh
  var material = new THREE.MeshLambertMaterial({
    color:   0xffff00,
    ambient: 0x000000,
    emissive: 0xffff00,
    fog: true
  });
  
  //var geometry = new THREE.CircleGeometry( radius, 64 );
  var geometry = new THREE.SphereGeometry( radius, 128, 128 ); 

  var mesh = new THREE.Mesh( geometry, material );
  
  // Put a point light inside for good measure
  mesh.add(new THREE.PointLight(0xffffff, 0.5, 1e6*radius));
  
  return mesh;
}