// Requires: lodash.js, three.js, jquery.js

// Create gthing namespace
var gthing = {};

// Main entry point
gthing.go = function() {
  // set the scene size
  var WIDTH = 400,
    HEIGHT = 300;

  // set some camera attributes
  var VIEW_ANGLE = 45,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000;

  // Create a WebGL renderer
  var renderer = new THREE.WebGLRenderer();
  
  // Create a camera
  var camera =
    new THREE.PerspectiveCamera(
      VIEW_ANGLE,
      ASPECT,
      NEAR,
      FAR);

  // Create a scene
  var scene = new THREE.Scene();

  // add the camera to the scene
  scene.add(camera);

  // the camera starts at 0,0,0
  // so pull it back
  camera.position.z = 300;

  // start the renderer
  renderer.setSize(WIDTH, HEIGHT);

  // attach the render-supplied DOM element
  $("#container").append(renderer.domElement);
}