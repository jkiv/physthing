//

var physthing = function() {
  this.scene = null;
  this.camera = null;
  this.renderer = null;
  this.entities = [];
  this.gravity = null;
  this.collision = null;
  this.eventRegistry = null;
  this.clock = null;
}

/**
 * Main entry point.
 */
physthing.prototype.go = function(container) {
  // Initialize scene components
  this.initializeScene(container);
  
  //Gravity.testScene1(this);   // Gravity test scene (1)
  //Collision.testScene1(this); // Collision test scene (1)
  Ship.testScene1(this);
  
  // Start game loop
  this.loop();
}

/**
 * Render loop.
 * 
 * Loop is broken down as such:
 *   1. Apply forces
 *   2. Apply constraints
 *   3. Accumulate forces and update velocity and position
 *   4. Render frame.
 */
physthing.prototype.loop = function() {
  // Get time delta since last frame
  var timedelta = this.clock.getDelta();
  timedelta = Math.min(1/30., timedelta); // clamp to 30 fps (for physics)
  
  // Perform gravity interactions and apply gravitational forces
  this.gravity.update(timedelta);
  
  // Perform collisions and apply constraints
  this.collision.update(timedelta);
  
  // Update positions
  _.forEach(this.entities, function(entity) {
    entity.update(timedelta);
  })
  
  // Render scene
  var thing = this;
  requestAnimationFrame(function() { thing.loop(); }); // using built-in browser animation API
  this.renderScene();
}

/**
 * Initializes the base scene, with no bodies.
 */
physthing.prototype.initializeScene = function(container) {
  // Create render target
  var renderer = new THREE.WebGLRenderer({
    antialias: true // ...might as well try
  });
  
  // Create camera
  var camera =
    new THREE.OrthographicCamera(
      -window.innerWidth/2,
      window.innerWidth/2,
      window.innerHeight/2,
      -window.innerHeight/2,
      0.1,
      1e9 + 100
    );
  
  // Create a scene
  var scene = new THREE.Scene();

  // Add camera to scene
  scene.add(camera);
  camera.position.z = 1e9;
  camera.zoom = 0.7;

  // Add ambient light to scene
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0. );
  directionalLight.position.set(0,0,1);
  scene.add(directionalLight);
  
  var ambientLight = new THREE.AmbientLight( 0xffffff );
  scene.add(ambientLight);
  
  // Put render target into page
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  
  // Hold references for future use
  this.scene = scene;
  this.renderer = renderer;
  this.camera = camera;
  this.clock = new THREE.Clock(true);
  this.collision = new Collision();
  this.gravity = new Gravity();
  this.eventRegistry = new Events(container);
  
  // Set up input callbacks
  var thing = this;
  
  this.eventRegistry.registerListener('window.resize', function(e) {
    // Update camera
    thing.camera.left = -window.innerWidth / 2;
    thing.camera.right = window.innerWidth / 2;
    thing.camera.top = window.innerHeight / 2;
    thing.camera.bottom = -window.innerHeight / 2;
    thing.camera.updateProjectionMatrix();

    // Update renderer
    thing.renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  this.eventRegistry.registerListener('mouse.scroll', function(e) {
    // TODO camera.zoomVelocity + drag force + update()
    var maxZoom = 10;
    var minZoom = 1e-6;
    var step = 0.1;
    
    var logZoom = thing.camera.logZoom || Math.log10(thing.camera.zoom);
    
    // Compute new zoom value
    if (e.delta > 0.0) {
      // Zoom in
      logZoom += step;
    }
    else {
      // Zoom out
      logZoom -= step;
    }
    
    zoom = Math.pow(10, logZoom);

    // Zoom camera
    if (zoom > minZoom && zoom < maxZoom) {
      thing.camera.zoom = zoom;
      thing.camera.logZoom = logZoom;
      thing.camera.updateProjectionMatrix();
    }
    
  });
  
}

/**
 * Renders the scene using the current renderer, scene, and camera.
 */
physthing.prototype.renderScene = function() {
  this.renderer.render(this.scene, this.camera);
}
