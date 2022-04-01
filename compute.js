// wrapper function for calling by address (eg. [0,1,0]) ///////////////////////////////////////////////////// fn: tracePathByAddress
function tracePathByAddress(node,N=1,drawArrows=false){
 var path = tracePathByLabel(labelNode(node),N,drawArrows);
}


// find the SVG elements which a given vertex will transfer to upon N applications of the automorphism /////// fn: tracePathByLabel
function tracePathByLabel(label,N=1,drawArrows=false){
 // make it easier to pass in the label of the root node: let people use "" instead of "Ø" (O-slash)
 if (label.length==0) label = labelNode([]);

 // initialise the output
 var path = [];

 // find the label in the list of all node labels (which we create on the fly with map())
 var pn = thenodes.map(t=>labelNode(t)).indexOf(label);
 // for nodes not drawn in the original graph, find their location in the transformed graph instead
 if (pn == -1) pn = thenewnodes.map(t=>labelNode(t)).indexOf(label);

 // starting point for this vertex
 var p = listOfNodeIds[pn];

 // add the starting point to the list of traversed SVG nodes
 path.push(p);

 // repeatedly apply the automorphism and track the vertex
 for (var i=0;i<N;i++){
  var pn = listOfNodeIds.indexOf(path[i]); // path[i] is the last entry so far
  var p = listOfPostNodeIds[pn];
  path.push(p);
  if (path[0] == p){ // the orbit is a (complete) cycle, so stop tracing it
   break;
  }
 }

 // have we been requested to draw arrows?
 if (drawArrows){
  clearArrows();
  // draw arrows between pairs of the nodes (the arrow functions take care of undefined SVG elements for us)
  for (var i=0;i<path.length-1;i++){
   var A = addArrowBySvg(path[i],path[i+1]);
   styleArrow(A,6,"#5f58","#5f5f");
  }
 }

 // return the path of nodes traversed by this vertex
 return path; // eg. ["node1", "node5", "node13", "node4", ...] followed by 'undefined' if the vertex maps outside the drawn graph
}
