/**
 * Wrapper for DOM callbacks
 */
physthing.Input = function(dom) {
  this.dom = dom;
  this.callbacks = {};
  this.keyState = {};
  this.mouseState = {};

  // Attach this to DOM events
  this.init();
}

/**
 * Initialize Input system.
 * Attach DOM events to [this].
 */
physthing.Input.prototype.init = function() {
  var that = this;
  
  // Register DOM events
  // ... mouse events
  this.dom.addEventListener('mousemove', function(e) {
    that.dispatchMouseMove(e);
  });
  
  this.dom.addEventListener('mousewheel', function(e) {
    that.dispatchMouseScroll(e);
  }, false); // Chrome
  
  this.dom.addEventListener('DOMMouseScroll', function(e) {
    that.dispatchMouseScroll(e);
  }, false); // Firefox
  
  // ... keyboard events
  this.dom.addEventListener('keydown', function(e) {
    that.dispatchKeyDown(e);
  });
  
  this.dom.addEventListener('keyup', function(e) {
    that.dispatchKeyUp(e);
  });
  
  // ... window events
  window.addEventListener('resize', function(e) {
    that.dispatchWindowResize(e);
  });
}

/**
 * Register listener for arbitrary event.
 */
physthing.Input.prototype.registerListener = function(type, callback) {
  if (this.callbacks[type] === undefined) {
    this.callbacks[type] = [];
  }
  
  this.callbacks[type] = _.union(this.callbacks[type], [callback]);
}

/**
 * Unregister listener for arbitrary event.
 */
physthing.Input.prototype.unregisterListener = function(type, callback) {
  if (this.callbacks[type] !== undefined) {
    this.callbacks[type] = _.difference(this.callbacks[type], [callback]);
  }
}

/**
 * Dispatch event [e] of type [type] to registered callbacks.
 */
physthing.Input.prototype.dispatch = function(type, e) {
  _.forEach(this.callbacks[type], function(callback) {
    callback(e);
  });
}

/**
 * Dispatcher for mouse move event.
 */
physthing.Input.prototype.dispatchMouseMove = function(e) {
  this.dispatch('mouse.move', e);
}

/**
 * Dispatcher for mouse scroll event.
 */
physthing.Input.prototype.dispatchMouseScroll = function(e) {
  e.delta = e.wheelDelta || -e.detail; // Chrome || Firefox
  this.dispatch('mouse.scroll', e);
}

/**
 * Dispatcher for key down event.
 */
physthing.Input.prototype.dispatchKeyDown = function(e) {
  if (keyState[e.id] === 0) {
    keystate[e.id] = 1;
    this.dispatch('key.down', e);
  }
}

/**
 * Dispatcher for key up event.
 */
physthing.Input.prototype.dispatchKeyUp = function(e) {
  if (keyState[e.id] === 1) {
    keystate[e.id] = 0;
    this.dispatch('key.up', e);
  }
}

/**
 * Dispatcher for window resize event.
 */
physthing.Input.prototype.dispatchWindowResize = function(e) {
  this.dispatch('window.resize', e);
}