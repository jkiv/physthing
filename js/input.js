
/**
 * 
 */
physthing.Input = function() {
  this.callbacks = {};
  this.keyState = {};
  this.mouseState = {};
  
  this.onMouseMove = function(e) {
    console.log("mousemove");
    // STUB
  };
  
  this.onKeyDown = function(e) {
    console.log("keydown");
    // STUB
  };
  
  this.onKeyUp = function(e) {
    console.log("keyup");
    // STUB
  };
}

physthing.Input.prototype.init = function(dom) {
  // Register dom events to here.
  dom.addEventListener('mousemove', this.onMouseMove);
  dom.addEventListener('keydown', this.onKeyDown);
  dom.addEventListener('keyup', this.onKeyUp);
}