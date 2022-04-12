// wrapper function for tracePathByAddress which just returns the orbit length /////////////////////////////// fn: calculateOrbitLengthByAddress
function calculateOrbitLengthByAddress(node){
 if (node!=null){
  var tmp = tracePathByAddress(node,100,false);
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

// wrapper function for calling by address (eg. [0,1,0]) ///////////////////////////////////////////////////// fn: tracePathByAddress
function tracePathByAddress(node,N=1,drawArrows=false,clearOldArrows=true){
 var path = tracePathByLabel(labelNode(node),N,drawArrows,clearOldArrows);
 return path;
}


// find the SVG elements which a given vertex will transfer to upon N applications of the automorphism /////// fn: tracePathByLabel
function tracePathByLabel(label,N=1,drawArrows=false,clearOldArrows=true){
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
