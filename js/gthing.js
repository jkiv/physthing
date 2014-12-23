// Requires: lodash.js, three.js, jquery.js

// gthing Namespace
var gthing = {
  scene: null,
  camera: null,
  renderer: null,
  entities: [],
  gravity: null,
  clock: null
};

// Main entry point
gthing.go = function() {
  // Initialize scene components
  gthing.initalizeScene();
  
  // ADD TEST PLANETS ////
  gthing.gravity = new gthing.Gravity();
  gthing.Gravity.testScene1();
  ////////////////////////
  
  // Start game loop
  gthing.loop();
}

// Render loop
gthing.loop = function() {
  // Get time delta since last frame
  var timedelta = gthing.clock.getDelta() / 10;
  timedelta = 1./60.; // fix timestep for consistent physics
  
  // Read input -- dispatch events
  // TODO
  
  // Perform gravity
  gthing.gravity.updateForces();
  
  // Perform collisions and constraints
  // TODO collision system
  
  // Accumulate forces and update positions
  _.forEach(gthing.entities, function(entity) {
    entity.updatePosition(timedelta);
  });
  
  // Render scene
  requestAnimationFrame(gthing.loop); // using built-in browser animation API
  gthing.renderScene();
}

// Load scene into gthing.threejs.scene
gthing.initalizeScene = function() {
  // Grab target DOM object
  var container = $("#container");

  // Create render target
  var renderer = new THREE.WebGLRenderer({
    antialias: true // ...might as well try
  });
  
  // Create camera
  var renderProperties = {
    width: container.width(),
    height: container.height(),
    near: 0.1,
    far: 10000
  };

  console.log(renderProperties);
  
  var camera =
    new THREE.OrthographicCamera(
      renderProperties.width / - 2,
      renderProperties.width / 2,
      renderProperties.height / 2,
      renderProperties.height / - 2,
      renderProperties.near,
      renderProperties.far
    );
  
  // Create a scene
  var scene = new THREE.Scene();

  // Add camera to scene
  scene.add(camera);
  camera.position.z = 300;

  // Add ambient light to scene
  //var ambientLight = new THREE.AmbientLight( 0x606060 );
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
  directionalLight.position.set(0,0,1);
  //scene.add(ambientLight);
  scene.add(directionalLight);
  
  // Put render target into page
  renderer.setSize(renderProperties.width, renderProperties.height);
  container.append(renderer.domElement);
  
  // Resize the renderer on resize of window/div
  container.bind('resize', function(e){
    // TODO resize renderer
  });
  
  // Hold references for future use
  gthing.scene = scene;
  gthing.renderer = renderer;
  gthing.camera = camera;
  gthing.clock = new THREE.Clock(true);
}

// Render the scene using the current renderer, scene, and camera
gthing.renderScene = function() {
  gthing.renderer.render(gthing.scene, gthing.camera);
}