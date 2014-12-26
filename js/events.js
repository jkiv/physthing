/**
 * Wrapper for DOM callbacks
 */
physthing.Events = function(dom) {
  this.dom = dom;
  this.callbacks = {};

  // Attach this to DOM events
  this.init();
}

/**
 * Initialize Events system.
 * Attach DOM events to [this].
 */
physthing.Events.prototype.init = function() {
  var that = this;
  
  // Register DOM events
  // ... mouse events
  document.addEventListener('mousemove', function(e) {
    that.dispatchMouseMove(e);
  });
  
  document.addEventListener('mousewheel', function(e) {
    that.dispatchMouseScroll(e);
  }, false); // Chrome
  
  document.addEventListener('DOMMouseScroll', function(e) {
    that.dispatchMouseScroll(e);
  }, false); // Firefox
  
  // ... keyboard events
  document.addEventListener('keydown', function(e) {
    that.dispatchKeyDown(e);
  });
  
  document.addEventListener('keyup', function(e) {
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
physthing.Events.prototype.registerListener = function(type, callback) {
  if (this.callbacks[type] === undefined) {
    this.callbacks[type] = [];
  }
  
  this.callbacks[type] = _.union(this.callbacks[type], [callback]);
}

/**
 * Unregister listener for arbitrary event.
 */
physthing.Events.prototype.unregisterListener = function(type, callback) {
  if (this.callbacks[type] !== undefined) {
    this.callbacks[type] = _.difference(this.callbacks[type], [callback]);
  }
}

/**
 * Dispatch event [e] of type [type] to registered callbacks.
 */
physthing.Events.prototype.dispatch = function(type, e) {
  _.forEach(this.callbacks[type], function(callback) {
    callback(e);
  });
}

/**
 * Dispatcher for mouse move event.
 */
physthing.Events.prototype.dispatchMouseMove = function(e) {
  this.dispatch('mouse.move', e);
}

/**
 * Dispatcher for mouse scroll event.
 */
physthing.Events.prototype.dispatchMouseScroll = function(e) {
  e.delta = e.wheelDelta || -e.detail; // Chrome || Firefox
  this.dispatch('mouse.scroll', e);
}

/**
 * Dispatcher for key down event.
 */
physthing.Events.prototype.dispatchKeyDown = function(e) {
  if (e.repeat === false) {
    this.dispatch('key.down', e);
  }
}

/**
 * Dispatcher for key up event.
 */
physthing.Events.prototype.dispatchKeyUp = function(e) {
  this.dispatch('key.up', e);
}

/**
 * Dispatcher for window resize event.
 */
physthing.Events.prototype.dispatchWindowResize = function(e) {
  this.dispatch('window.resize', e);
}