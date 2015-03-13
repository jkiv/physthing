/*

  In cases where objects are typically completely inside the test mesh of another object, it may be possible to partition the physical space based entirely on the overlapping of interacting objects. (... maybe.)

  Here is a graph that maintains the "overlappedness" of objects.
  
  This graph aims to have the following properties:

    - a node is overlapping with its parents (its children are overlapping)
    - a node is non-overlapping with its siblings
    
  There are three cases to note:
  
    1. No overlap (NO)      - the two objects are non-overlapping.
    2. Full overlap (FO)    - the smaller object is completely inside the larger
    3. Partial overlap (PO) - there is a partial (non-full) overlap
    
  In the FO case, it is possible to say that the smaller object does not overlap those objects that are non-overlapping with the larger. That is, the NO case of a parent with its siblings extends to its children and its siblings. This is not necessarily true with the PO case.
  
  For now, the PO case is treated as simultaneous NO and FO cases. To avoid an FO traversal exiting elsewhere in the graph, the node is copied in the PO case -- so the graph remains a tree. (Not yet sure if there is a more elegant solution.)
  
  ---
  
  For force interactions, it is imaginable that test meshes are inside one another as they simply represent the field in which the bodies will interact. However, for collisions, the test meshes are typically represented by physical boundaries. In this case, objects are likely all in the NO case with one another.
  
  ---
  
  Currently, the graph is rebuild each frame. It would be more advantageous to move Nodes around the graph when they change, or remove and re-add the node (and its children).
  
*/

var RadialCollisionGraph = function() {
  this.master = [];
  this.root = new RadialCollisionGraph.Node(null);
  
  //this.debug = { buildNodes: 0, buildCompares: 0 };
  
  this._getNodeRadius = function(node) {
    return node.data.physics.collision.radius;
  }
}

  
RadialCollisionGraph.prototype._partialCollisionTest = function(a, b) {
  //this.debug.buildCompares++;
  return Collision.testOverlappingFOI(a.data, b.data);
}
  
RadialCollisionGraph.prototype._fullCollisionTest = function(a, b) {
  //this.debug.buildCompares++;
  return Collision.testFullyOverlappingFOI(a.data, b.data);
}

RadialCollisionGraph.prototype.add = function(data) {

  var graph = this;
    
  // Add new node to the master list
  graph.master.push(new RadialCollisionGraph.Node(data));
  
  // Sort list from largest collision radius to smallest
  graph.master = _.sortBy(graph.master, function(n) {
      var r = graph._getNodeRadius(n);
      return (r === 0.0) ? 0.0 : 1.0/r;
  })
  
  // TODO insert node into graph?
}

RadialCollisionGraph.prototype.remove = function(data) {

  // Remove node with the same data from the master list
  // (Assuming it remains sorted)
  _.remove(this.master, function(n) {
    n.data === data;
  });
  
  // FIXME / TODO -- rebuild vs. remove nodes
  this.build();
}


RadialCollisionGraph.prototype.build = function() {
  var graph = this;
  
  // Clear root node
  graph.root.clearChildren();
  
  //this.debug.buildNodes = graph.master.length;
  //this.debug.buildCompares = 0;
  
  // Insert each node into the empty graph
  _.forEach(graph.master, function(n) {
      // Clear previous associations
      n.clearParents();
      n.clearChildren();
      
      // Insert into graph
      graph._insertNode(n, graph.root);
  })
}

RadialCollisionGraph.prototype._insertNode = function(node, parent) {
  var graph = this;
  var children = parent.children;
  var fullyOverlapping = false;
  
  _.forEach(children, function(child) {
  
    if (graph._partialCollisionTest(child, node)) {
    
      // Recursively add node to children of this child
      graph._insertNode(node, child);
    
      if (graph._fullCollisionTest(child, node)) {
        // Fully-overlapping (FO)
        //  -- no need to continue with siblings
        fullyOverlapping = true;
        return false;
      }
      else {
        // Partially-overlapping (PO)
        //  -- duplicate node
        //  -- continue on with siblings
        
        // Make a copy of [node] (different parent/children, same data)
        node = new RadialCollisionGraph.Node(node.data);
      }
      
    }
    else {
      // Non-overlapping (NO)
      //  -- continue on with siblings
    }
  
  })
  
  // Make node as child of parent
  if (fullyOverlapping !== true) {
    node.parents.push(parent);
    children.push(node);
  }
}

RadialCollisionGraph.prototype.traverse = function(callback) {
  var graph = this;
  _.forEach(graph.root.children, function(child) {
      graph._traversalStep(child, child, callback);
  })
}

RadialCollisionGraph.prototype._traversalStep = function(top, node, callback) {
  var graph = this;
  
  _.forEach(node.children, function(child) {
      // Call callback for top-child pair
      callback(top.data, child.data);
      
      // Call callback for top-grandchildren
      graph._traversalStep(top, child, callback);
      
      // Call callback for child-grandchildren
      graph._traversalStep(node, child, callback);
  })
}

//// NODE 

RadialCollisionGraph.Node = function(obj) {
  this.data = obj;
  this.parents = [];
  this.children = [];
  this.visitedFlag = false;
}

RadialCollisionGraph.Node.prototype.clearParents = function() {
  this.parents.splice(0, this.parents.length);
}

RadialCollisionGraph.Node.prototype.clearChildren = function() {
  this.children.splice(0, this.children.length);
}


//// TESTS

RadialCollisionGraph.test1 = function() {

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

  //
  
  var graph = new RadialCollisionGraph();
  
  graph.add(A);
  graph.add(B);
  graph.add(C);
  graph.add(D);
  graph.add(E);
  graph.add(F);
  
  return graph;
}