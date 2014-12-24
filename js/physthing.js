// Requires: lodash.js, three.js, jquery.js

// physthing Namespace
var physthing = {
  scene: null,
  camera: null,
  renderer: null,
  entities: [],
  gravity: null,
  collision: null,
  clock: null
};

// Main entry point
physthing.go = function() {
  // Initialize scene components
  physthing.initalizeScene();
  
  // ADD TEST PLANETS ////
  physthing.Collision.testScene1();
  ////////////////////////
  
  // Start game loop
  physthing.loop();
}

// Render loop
physthing.loop = function() {
  // Get time delta since last frame
  var timedelta = physthing.clock.getDelta();
  timedelta = Math.min(1/30., timedelta); // clamp to 30 fps (for physics)
  
  // Perform gravity interactions and apply gravitational forces
  physthing.gravity.updateForces();
  
  // Perform collisions and apply constraints
  physthing.collision.applyConstraints();
  
  // Accumulate forces and update positions
  _.forEach(physthing.entities, function(entity) {
    entity.updatePosition(timedelta);
  });
  
  // Render scene
  requestAnimationFrame(physthing.loop); // using built-in browser animation API
  physthing.renderScene();
}

// Load scene into physthing.threejs.scene
physthing.initalizeScene = function() {
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
  physthing.scene = scene;
  physthing.renderer = renderer;
  physthing.camera = camera;
  physthing.clock = new THREE.Clock(true);
  physthing.collision = new physthing.Collision();
  physthing.gravity = new physthing.Gravity();
}

// Render the scene using the current renderer, scene, and camera
physthing.renderScene = function() {
  physthing.renderer.render(physthing.scene, physthing.camera);
}