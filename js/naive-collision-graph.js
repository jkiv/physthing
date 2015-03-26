/*
  NaiveCollisionGraph
  
  Shares interface with other collision graphs but is unoptimized. It tests every combination of every known object for a collision.
*/

var NaiveCollisionGraph = function(collisionTest) {
  this.master = [];
  //this.debug = { nodes: 0, compares: 0 };
  this._collisionTest = collisionTest;
}
  
NaiveCollisionGraph.prototype._collisionTest = function(a, b) {
  //this.debug.compares++;
  return Collision.testOverlappingFOI(a, b);
}

NaiveCollisionGraph.prototype.add = function(data) {
  // Add new node to the master list
  this.master.push(data);
}

NaiveCollisionGraph.prototype.remove = function(data) {
  // Remove node with the same data from the master list
  // (Assuming it remains sorted)
  _.remove(this.master, function(n) {
    n === data;
  });
}

NaiveCollisionGraph.prototype.build = function() {
  // We already have all we need: this.master
  //this.debug.nodes = graph.master.length;
  //this.debug.compares = 0;
}

NaiveCollisionGraph.prototype.update = function() {
  // We already have all we need: this.master
  //this.debug.nodes = graph.master.length;
  //this.debug.compares = 0;
}

NaiveCollisionGraph.prototype.traverse = function(callback) {

  var bodies = this.master;
  
  // Find interacting bodies the dumb way
  // 1. for each body, test against all other bodies
  // 2. skip bodies in inner loop that were seen in outer loop
  
  for (var i = 0; i < bodies.length; i++) {
    for (var j = i+1; j < bodies.length; j++) {
      // Test collision
      if (this._collisionTest(bodies[i], bodies[j])) {
        callback(bodies[i], bodies[j]);
      }
    }
  }

}

//// TESTS

NaiveCollisionGraph.test1 = function() {

  var A = new Body(1);
  A.name = "A";
  A.physics.collision = { radius: 10 };
  A.translate(new THREE.Vector3(-15,0,0));
  
  var B = new Body(1);
  B.name = "B";
  B.physics.collision = { radius: 10 };
  B.translate(new THREE.Vector3(0,0,0));
  
  var C = new Body(1);
  C.name = "C";
  C.physics.collision = { radius: 10 };
  C.translate(new THREE.Vector3(15,0,0));
  
  var D = new Body(1);
  D.name = "D";
  D.physics.collision = { radius: 1 };
  D.translate(new THREE.Vector3(-10,0,0));
  
  var E = new Body(1);
  E.name = "E";
  E.physics.collision = { radius: 10 };
  E.translate(new THREE.Vector3(30,0,0));
  
  var F = new Body(1);
  F.name = "F";
  F.physics.collision = { radius: 1 };
  F.translate(new THREE.Vector3(-1,0,0));

  // TODO expected result
  
  var graph = new NaiveCollisionGraph();
  
  graph.add(A);
  graph.add(B);
  graph.add(C);
  graph.add(D);
  graph.add(E);
  graph.add(F);
  
  return graph;
}