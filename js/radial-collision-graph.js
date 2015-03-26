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
  
  Reorganizing graph is dependent on the order things were added. We move around larger objects first to avoid having to swap parents<->children and messing stuff up. Luckily we have RadialCollisionGraph.master, a sorted list of all the nodes.
  
  Each node in the master list is associated with other nodes containing the same data (i.e. having different parents, in the PO case). The node in the master list is the original copy and also the copy of the node added first.
  
  For each node in the master list, we examine whether it is still colliding with its parent. If it is not fully colliding, it needs to become a sibling of its parent. If it's not colliding at all, the node is removed as a child of its parent and its children become children of its parent. (Inserting children into must be done to keep sorted order.)
  
  The children of the children have not been seen in the master list, so their new positions in the graph will be resolved later.
  
*/

var RadialCollisionGraph = function(getNodeRadius, partialCollisionTest, fullCollisionTest) {
  this.master = [];
  this.root = new RadialCollisionGraph.Node(null);
  
  this.dirty = false; // add/remove since last build()?
  
  //this.debug = { nodes: 0, compares: 0 };
  
  this._getNodeRadius = getNodeRadius;
  this._partialCollisionTest = partialCollisionTest;
  this._fullCollisionTest = fullCollisionTest;
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
  
  this.dirty = true; // graph requires a rebuild
}

RadialCollisionGraph.prototype.remove = function(data) {

  // Remove node with the same data from the master list
  // (Assuming it remains sorted)
  _.remove(this.master, function(n) {
    n.data === data;
  });
  
  this.dirty = true; // graph requires a rebuild
}


RadialCollisionGraph.prototype.build = function() {
  var graph = this;
  
  // Clear root node
  graph.root.clearChildren();
  
  //this.debug.nodes = graph.master.length;
  //this.debug.compares = 0;
  
  // Insert each node into the empty graph
  _.forEach(graph.master, function(n) {
      // Clear previous associations
      n.clearParent();
      n.clearChildren();
      
      // Insert into graph
      graph._insertNode(graph.root, n);
  })
  
  // No longer requires rebuild
  this.dirty = false;
}

RadialCollisionGraph.prototype._insertNode = function(parent, node) {
  var graph = this;
  var children = parent.children;
  var fullyOverlapping = false;
  
  _.forEach(children, function(child) {
  
    if (graph._partialCollisionTest(child.data, node.data)) {
    
      // Recursively add node to children of this child
      graph._insertNode(child, node);
    
      if (graph._fullCollisionTest(child.data, node.data)) {
        // Fully-overlapping (FO)
        //  -- no need to continue with siblings
        fullyOverlapping = true;
        return false;
      }
      else {
        // Partially-overlapping (PO)
        //  -- duplicate nodeX
        //  -- continue on with siblings
        
        // Make a copy of [node] (different parent & children, same data)
        var other = new RadialCollisionGraph.Node(node.data);
        node.next = other; // link original for ordered access
        
        // Use copy of node
        node = other;
      }
      
    }
    else {
      // Non-overlapping (NO)
      //  -- continue on with siblings
    }
  
  })
  
  // Make node as child of parent
  if (fullyOverlapping !== true) {
    node.parent = parent;
    children.push(node);
  }
}

RadialCollisionGraph.prototype.traverse = function(callback) {
  var graph = this;
  _.forEach(graph.root.children, function(child) {
      graph._traversalStep(child, child, callback);
  })
}

RadialCollisionGraph.prototype._traversalStep = function(top, parent, node, callback) {
  var graph = this;
  
  _.forEach(node.children, function(child) {
      // Call callback for top<->child pair
      callback(top.data, child.data);
      
      // Call callback for top<->grandchildren pairs
      graph._traversalStep(top, node, child, callback);
      
      // Call callback for child<->grandchildren pairs
      graph._traversalStep(node, node, child, callback);
  })
}


RadialCollisionGraph.prototype.update = function() {
  // Perform a complete rebuild if add/remove since last build
  if (this.dirty === true) {
    this.build();
    return;
  }

  //this.build();
  // TODO rearrange nodes that have moved.
  /*
    For each node in the master list (in order):
    
      For each parent (in order):
         
         1. No longer overlapping?
            - disassociate node with parent
            - make all children of node
              children of the node's parents
              (insert in order of size)
            
         1. Partially overlapping?
            - make the node a sibling of its
              parent (insert in order of size,
              ignore if already there.)
              
    Relies on:
      1. Master and children lists are sorted from larger->smaller
      2. Nodes are linked together (via .next) from earlier->later added
  */
  
  var that = this;
  
  // Go through the master list (in order) and update each node
  _.forEach(that.master, function(node) {

    console.log('Looking at ' + ((node.data === null) ? 'root' : node.data.name));
  
    // Traverse node's .next chain
    while (node !== null) {
      
      var parent = node.parent;
      
      console.log(' -- parent: ' + ((parent.data === null) ? 'root' : parent.data.name));

      
      // Skip root node as parent
      if (parent == that.root) {
        console.log(' -- skipped.');
        node = node.next;
        continue;
      }
      
      // Is the node /not/ fully overlapping with parent?
      if (!that._fullCollisionTest(node.data, parent.data)) {
      
        // Is the node not /partially/ overlapping with parent?
        if (!that._partialCollisionTest(node.data, parent.data)) {
          // NO case --
          
          console.log(' -- not overlapping.');
          
          // Disassociate from parent
          node.clearParent();
          parent.children = _.remove(parent.children, function(item) {
            return (item.data === node.data);
          })
          
          // Make children parent's children
          // -- insert using binary insert
          _.forEach(node.children, function(child) {
          
            var at = _.sortedIndex(parent.children, child, function(item) {
              var r = that._getNodeRadius(item);
              return (r === 0.0) ? 0.0 : 1.0/r;
            });
          
            // Make a child of node's parent
            parent.children.splice(at, 0, child);
            
            // Replace parent
            child.parent = parent;
          })
          
          // Disassociate node
          node.clearChildren();
        }
        else {
          // PO case -- no special need to do anything (afiact) 
          console.log(' -- partially overlapping.');
        }
        
        // In both PO and NO case, make the node a sibling of the parent (in order)
        var grandparent = parent.parent; // (should exist, root node at most)
        
        var at = _.sortedIndex(grandparent.children, node, function(item) {
          var r = that._getNodeRadius(item);
          return (r === 0.0) ? 0.0 : 1.0/r;
        });
        
        // Node may already be a child of grandparent (sibling of parent),
        // in which case `at' should point to it already.
        // -- it would be the first as it was added to grandparent.children first
        if (at < grandparent.children.length
            && grandparent.children[at].data === node.data)
        {
          console.log(' -- ' + grandparent.children[at].data.name + ' == ' + node.data.name);

        
          // Already a sibling
          //node.next = grandparent.children[at];
        }
        else
        {
          if ( at < grandparent.children.length )
            console.log(' -- ' + grandparent.children[at].data.name + ' != ' + node.data.name);
          else if (at > 0)
            console.log(' -- ' + grandparent.children[at-1].data.name + ' larger than ' + node.data.name);
          else
            console.log(' -- ' + grandparent.children[at].data.name + ' smaller than ' + node.data.name);
        
          // Not a sibling, clone and insert in node.next chain
          var other = new RadialCollisionGraph.Node(node.data);
          other.next = node.next;
          node.next = other;
          
          // Use clone
          node = other;
          grandparent.children.splice(at, node);
          node.parent = grandparent;
        }
        
      }
      else {
        console.log(' -- fully overlapping.');
      }
      
      // Handle node for next "parent"
      node = node.next;
    }
    
  })
  
}

RadialCollisionGraph.print = function(node, level) {
  var name = (node.data === null) ? "(root)" : node.data.name;
  
  if (node.children.length == 0) {
    return name;
  }
  else {     
    return (name + ': { \n' + _.map(node.children, function(child) { return RadialCollisionGraph.print(child, level+1); }).join(', ') + ' }'); 
  }
}

RadialCollisionGraph.prototype.print = function() {
  console.log(RadialCollisionGraph.print(this.root, 0));
}

//// NODE 

RadialCollisionGraph.Node = function(obj) {
  this.data = obj;
  this.parent = null;
  this.children = [];
  this.next = null; // if a copy is made, next points to the copy (different parent & children, but same data)
}

RadialCollisionGraph.Node.prototype.clearParent = function() {
  this.parent = null;
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
  
  var graph = new RadialCollisionGraph(
    function(node) { return node.data.physics.collision.radius; },
    Collision.testOverlappingFOI,
    Collision.testFullyOverlappingFOI
  );
  
  graph.add(A, false);
  graph.add(B, false);
  graph.add(C, false);
  graph.add(D, false);
  graph.add(E, false);
  graph.add(F, false);
  
  graph.build();
  
  // A B C E D F
  console.log(_.map(graph.master, function(node) { return node.data.name; }));
  
  graph.print();
  
  // Move B out of the way to throw off graph (TODO formal cases)
  B.translate(new THREE.Vector3(100,0,0));
  
  graph.update();
  
  graph.print();
  
  return graph;
}