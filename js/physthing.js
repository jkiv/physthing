/**
 * phything Namespace
 */
var physthing = {
  scene: null,
  camera: null,
  renderer: null,
  entities: [],
  gravity: null,
  collision: null,
  input: null,
  clock: null
};

/**
 * Main entry point.
 */
physthing.go = function(container) {
  // Initialize scene components
  physthing.initalizeScene(container);
  
  //physthing.Gravity.testScene1();   // Gravity test scene (1)
  //physthing.Collision.testScene1(); // Collision test scene (1)
  physthing.Ship.testScene1();
  
  // Start game loop
  physthing.loop();
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
physthing.loop = function() {
  // Get time delta since last frame
  var timedelta = physthing.clock.getDelta();
  timedelta = Math.min(1/30., timedelta); // clamp to 30 fps (for physics)
  
  // Perform gravity interactions and apply gravitational forces
  physthing.gravity.update(timedelta);
  
  // Perform collisions and apply constraints
  physthing.collision.update(timedelta);
  
  // TODO we want to apply thrust via keyboard /before/ collision.update()
 
  // Update positions
  _.forEach(physthing.entities, function(entity) {
    entity.update(timedelta);
  });
  
  // Render scene
  requestAnimationFrame(physthing.loop); // using built-in browser animation API
  physthing.renderScene();
}

/**
 * Initializes the base scene, with no bodies.
 */
physthing.initalizeScene = function(container) {

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
      1000
    );
  
  // Create a scene
  var scene = new THREE.Scene();

  // Add camera to scene
  scene.add(camera);
  camera.position.z = 300;
  camera.zoom = 0.7;

  // Add ambient light to scene
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.3 );
  directionalLight.position.set(0,0,1);
  scene.add(directionalLight);
  
  // Put render target into page
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  
  // Hold references for future use
  physthing.scene = scene;
  physthing.renderer = renderer;
  physthing.camera = camera;
  physthing.clock = new THREE.Clock(true);
  physthing.collision = new physthing.Collision();
  physthing.gravity = new physthing.Gravity();
  physthing.input = new physthing.Input(container);
  
  // Set up input callbacks
  physthing.input.registerListener('window.resize', function(e) {
    // Update camera
    physthing.camera.left = -window.innerWidth / 2;
    physthing.camera.right = window.innerWidth / 2;
    physthing.camera.top = window.innerHeight / 2;
    physthing.camera.bottom = -window.innerHeight / 2;
    physthing.camera.updateProjectionMatrix();

    // Update renderer
    physthing.renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  physthing.input.registerListener('mouse.scroll', function(e) {
    // TODO camera.zoomVelocity + drag force + update()
    var maxZoom = 10.;
    var minZoom = 0.1;
    
    var zoom = physthing.camera.zoom;
    var step = 0.05;
    
    // Compute new zoom value
    if (e.delta > 0.0) {
      // Zoom in
      zoom += step;
    }
    else {
      // Zoom out
      zoom -= step;
    }
    
    zoom = Math.min(maxZoom, Math.max(minZoom, zoom));

    // Zoom camera
    physthing.camera.zoom = zoom;
    physthing.camera.updateProjectionMatrix();
  });
}

/**
 * Renders the scene using the current renderer, scene, and camera.
 */
physthing.renderScene = function() {
  physthing.renderer.render(physthing.scene, physthing.camera);
}