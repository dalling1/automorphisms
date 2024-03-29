// wrapper function for traceOrbitByAddress which just returns the orbit length ////////////////////////////// fn: calculateOrbitLengthByAddress
function calculateOrbitLengthByAddress(node){
 if (node!=null){
  var tmp = traceOrbitByAddress(node,100,false);
  // check that we have a cycle and return its length
  if (tmp[0]==tmp[tmp.length-1]){
   var Lorbit = tmp.length-1; // -1 since the last entry repeats the first
  } else {
   // otherwise, return -1
   var Lorbit = 0;
  }
  return Lorbit;
 } else {
  return 0;
 }
}

// display orbit cycle lengths in the information area
function reportOrbitLengths(){
 // initialise
 var L=[];
 // get the cycle length for each node
 for (var i=0;i<thenewnodes.length;i++) L[i]=calculateOrbitLengthByAddress(thenewnodes[i]);
 // make a "histogram"
 var Lcount = Array(1+Math.max(...L)).fill(0); // +1 to account for the zero-length orbits (really missing values/non-cycles)
 for (var i=0;i<L.length;i++) Lcount[L[i]]++;
 // make some text for the info area
 var output = '';
 for (var i=1;i<L.length;i++){ // don't report length 0 orbits (really missing values/non-cycles)
  if(Lcount[i]>0) output += ' Orbits of length '+i+': '+Lcount[i]+'; ';
 }
 // put it on the screen
 showInfo(output);
 return Lcount;
}

// wrapper function for calling by address (eg. [0,1,0]) ///////////////////////////////////////////////////// fn: traceOrbitByAddress
function traceOrbitByAddress(node,N=1,drawArrows=false,clearOldArrows=true){
 var path = traceOrbitByLabel(labelNode(node),N,drawArrows,clearOldArrows);
 return path;
}


// find the SVG elements which a given vertex will transfer to upon N applications of the automorphism /////// fn: traceOrbitByLabel
function traceOrbitByLabel(label,N=1,drawArrows=false,clearOldArrows=true){
 // make it easier to pass in the label of the root node: let people use "" instead of "Ø" (O-slash)
 if (label.length==0) label = labelNode([]);

 // initialise the output
 var path = [];
 var iscycle = label+": ";
 document.getElementById("iscycle").innerHTML = iscycle; // reset

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
  if (p!=undefined){
   path.push(p);
   if (path[0] == p && p!=undefined){ // the orbit is a (complete) cycle, so stop tracing it
    if (path[0]==path[1]){
     iscycle += "Fixed-point";
    } else {
     iscycle += (path.length-1).toString()+"-cycle";
    }
    break;
   }
  } else {
   break;
  }
 }

 // have we been requested to draw arrows?
 if (drawArrows){
  if (clearOldArrows){
   clearArrows();
  }
  // add a note about this node's orbit
  document.getElementById("iscycle").innerHTML = iscycle;
  // draw arrows between pairs of the nodes (the arrow functions take care of undefined SVG elements for us)
  for (var i=0;i<path.length-1;i++){
   var A = addArrowBySvg(path[i],path[i+1]);
   if (A==null) break;
   styleArrow(A,6,"#5f5f","#5f58");
   if (A!=null) A.classList.add("animDelay"+i.toString());
  }
 }

 // return the path of nodes traversed by this vertex
 return path; // eg. ["node1", "node5", "node13", "node4", ...] followed by 'undefined' if the vertex maps outside the drawn graph
}

// new approach to finding vertex destinations /////////////////////////////////////////////////////////////// fn: mapVertex
// (for now this uses the current automorphism but in the future this could become a function argument)
function mapVertex(v){
 // work with vertex addresses, eg. [1,0,1], as inputs and outputs.
 // For now, assume a local action-based automorphism rather than a list-to-list transformation; later this can be a flag
 var vdest = null; // initialise output

 // check that the automorphism has been defined
 if (autoFrom==null || autoTo==null || Object.keys(thelocalaction).length==0){
  // the automorphism hasn't been defined, bail out
  return vdest;
 }

 // is this the reference node? easy to return its destination:
 if (labelNode(v)==labelNode(autoFrom)){
  vdest = autoTo;
//  console.log('Mapped the reference node, '+labelNode(v)+' to '+labelNode(vdest));
 } else {
  // otherwise, carry on along the path towards the reference node:
  var p = getPath(v,autoFrom);
  var w = p[1]; // next step from v to ref, since p[0] == v
  var wdest = mapVertex(w); // recursive step
  // now we have the destination of the next vertex in the path towards the reference node

  // find the relevant local action (either constant or assigned to this neighbouring node w)
  var LA = thelocalaction[w.toString()]; // might be undefined
  var constantAuto = document.getElementById("input_constantauto").checked;
  if (constantAuto){
   // use the reference node's local action:
   LA = thelocalaction[autoFrom.toString()];
  }
  if (LA != undefined){
   // good
   // 1. which "colour" neighbour of w is v? ie. which element of the LA do we need?
   var e = getEdge(v,w);
   // 2. which colour does that permute to under the LA?
   if (e==null){
    vdest = null; // not neighbours
   } else {
    vdest = [];
    for (var i=0;i<wdest.length;i++) vdest[i] = wdest[i]; // duplicate wdest...
    vdest.push(LA[e]); // ...then add the next edge, connecting wdest to vdest
    // remove redundant edges from the destination address
    vdest = simplifyAddress(vdest);
   }
  } else {
   // bad: no local action could be found, abort
   vdest = null;
  }
 }
 return vdest;
}

// new approach to finding vertex destinations /////////////////////////////////////////////////////////////// fn: fastmapVertex
// (for now this uses the current automorphism but in the future this could become a function argument)
//  - this 'fast' version caches vertex destinations as they are calculated: this greatly speeds up
//    mapping many vertices (for example, the whole graph)
MAPCACHE=[];
function fastmapVertex(v,startCache=true){
 // work with vertex addresses, eg. [1,0,1], as inputs and outputs.
 // For now, assume a local action-based automorphism rather than a list-to-list transformation; later this can be a flag
 var vdest = null; // initialise output

 /* CHECK CACHE */
 if (MAPCACHE.hasOwnProperty(v)){
  // v is a key in the cache (ie. this vertex has been mapped before)
  // return straight away, there is nothing else to do:
  return MAPCACHE[v];
 }


 // check that the automorphism has been defined
 if (autoFrom==null || autoTo==null || Object.keys(thelocalaction).length==0){
  // the automorphism hasn't been defined, bail out
  return vdest;
 }

 // is this the reference node? easy to return its destination:
 if (labelNode(v)==labelNode(autoFrom)){
  vdest = autoTo;
//  console.log('Mapped the reference node, '+labelNode(v)+' to '+labelNode(vdest));
 } else {
  // otherwise, carry on along the path towards the reference node:
  var p = getPath(v,autoFrom);
  var w = p[1]; // next step from v to ref, since p[0] == v
  var wdest = fastmapVertex(w,false); // recursive step ('false' says don't create cache)
  // now we have the destination of the next vertex in the path towards the reference node

  // find the relevant local action (either constant or assigned to this neighbouring node w)
  var LA = thelocalaction[w.toString()]; // might be undefined
  var constantAuto = document.getElementById("input_constantauto").checked;
  if (constantAuto){
   // use the reference node's local action:
   LA = thelocalaction[autoFrom.toString()];
  }
  if (LA != undefined){
   // good
   // 1. which "colour" neighbour of w is v? ie. which element of the LA do we need?
   var e = getEdge(v,w);
   // 2. which colour does that permute to under the LA?
   if (e==null){
    vdest = null; // not neighbours
   } else {
    vdest = [];
    for (var i=0;i<wdest.length;i++) vdest[i] = wdest[i]; // duplicate wdest...
    vdest.push(LA[e]); // ...then add the next edge, connecting wdest to vdest
    // remove redundant edges from the destination address
    vdest = simplifyAddress(vdest);
   }
  } else {
   // bad: no local action could be found, abort
   vdest = null;
  }
 }

 /* ADD TO CACHE */
 MAPCACHE[v] = vdest;

 // and return the destination of this vertex
 return vdest;
}


// test whether nodes are neighbours ///////////////////////////////////////////////////////////////////////// fn: areNeighbours
function areNeighbours(node1,node2){
 return (Math.abs(node1.length - node2.length) == 1);
}


// find the edge "colour" between two adjacent nodes ///////////////////////////////////////////////////////// fn: getEdge
function getEdge(node1,node2){
 // pass nodes as addresses, eg. [0,1,2,1,2]
 if (areNeighbours(node1,node2)){
  // edge colour is the difference between the neighbours:
  if (node1.length>node2.length){
   return node1[node1.length-1];
  } else {
   return node2[node2.length-1];
  }
 } else {
  // not neighbours
  return null;
 }
}

// "simplify" addresses by removing redundant edges (eg. [0,1,1,2] simplifies to [0,2]) ////////////////////// fn: simplifyAddress
function simplifyAddress(address){
 for (var i=0;i<address.length-1;i++){
  if (address[i]==address[i+1]){
   address.splice(i,2); // remove both duplicated elements (ie. remove 2 elements starting at position i)
  }
 }
 return address;
}
