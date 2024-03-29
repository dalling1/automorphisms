 // set up some constants
 const Pi = Math.acos(-1);
 const thelabels = "rbgmckyabcdefghijklmnopqrstuvwxyz0123456789".split(""); // used for dot language output [using first three colour initials]
 const EDGESEP = " -- "; // dot language output separator (-- or ->)
 const ROOTNODE = "\u{d8}"; // capital-O-with-stroke symbol https://graphemica.com/%C3%98
// const colours=["red","blue","green","magenta","cyan","black","yellow"];
 const colours=["#ff0000","#0000ff","#00ff00","#ff00ff","#00ffff","#000000","#ffff00"];

 // colour set-up of nodes, edges and labels:
 const thenodecolour = '#999999';  // '#dddd55'; // '#ccaa00'; // was orange, then yellow
 const theautonodecolour = '#dddd55'; // post-automorphism node colour
 const theautonodecolourextended = '#ddaa66'; // post-automorphism node colour for "extended" nodes
 const theautonodenodistcolour = '#999955'; // colour for nodes whose moved distance is not defined
 const theedgecolour = 'black'; // currently a fall-back (each edge's colour is over-ridden individually)
 const thefadednodecolour = '#eaeaea22';
 const thelabelcolour = '#000000';
 const thefadedlabelcolour = '#aaaaaa';
 const thefadeopacity = '44'; // 2-digit hex code
 const thereferencenodecolour = '#55ff5566';
 const thereferencelabelcolour = 'black';
 const thedestinationnodecolour = '#ff555566';
 const thedestinationlabelcolour = 'black';

// function to provide label characters //////////////////////////////////////////////////////////// fn: label
function label(n){
 return (n>=0 && n<thelabels.length ? thelabels[n] : "X"); // return "X" if n is out of range
}

// function to label a whole node ////////////////////////////////////////////////////////////////// fn: labelNode
function labelNode(node){
 if (node!=null){
  thelabel = node.map(label).join("");
  if (thelabel.length==0) thelabel = ROOTNODE;
  return thelabel;
 } else {
  return null;
 }
}

// function to turn nodes and edges into dot output //////////////////////////////////////////////// fn: mkdot
function mkdot(withAutomorphism=false){
 var valency = parseInt(document.getElementById("input_valency").value);
 var maxdepth = parseInt(document.getElementById("input_maxdepth").value);

 var showlabels = document.getElementById("input_labels").checked;
 var showaddresses = true;
 var showoriglabels = document.getElementById("input_xlabels").checked;
 var showdists = document.getElementById("input_showdists").checked;
 var sizebydist = document.getElementById("input_nodesize").checked;


 var thisgraph = 'graph {\n';
 thisgraph += '\t// valency = '+valency+', depth = '+maxdepth+'\n\n';
 thisgraph += '\tbgcolor=gray50\n\n';
 thisgraph += '\tedge [penwidth=1, color='+theedgecolour+']\n';
 thisgraph += '\tnode [shape=circle, fixedsize=true, color=none, style=filled, fillcolor="'+(withAutomorphism?thefadednodecolour:thenodecolour)+'"]\n';
 thisgraph += '\tnode [fontsize=14, fontcolor="'+(withAutomorphism?thefadedlabelcolour:thelabelcolour)+'"]\n';
 thisgraph += '\tnode [fontname = "NotoSerif"]\n';
 thisgraph += '\tranksep=2\n';
 thisgraph += '\n\t// EDGES\n';
 var fromLabel = '';
 var toLabel = '';
 for (var i=0;i<theedges.length;i++){
  var from = thenodes[theedges[i][0]].join("");
  var to = thenodes[theedges[i][1]].join("");
  if (showaddresses){
   if (withAutomorphism){
    fromLabel = labelNode(thenewnodes[theedges[i][0]]);
    toLabel = labelNode(thenewnodes[theedges[i][1]]);
   } else {
    fromLabel = labelNode(thenodes[theedges[i][0]]);
    toLabel = labelNode(thenodes[theedges[i][1]]);
   }
  } else {
   fromLabel = from;
   toLabel = to;
   if (fromLabel.length==0) fromLabel = ROOTNODE;
   if (toLabel.length==0) toLabel = ROOTNODE;
  }

  // some labels might be missing post-automorphism, so use the index instead
  var fadeedge = false;
  if (fromLabel==null || toLabel==null) fadeedge = true;
  if (fromLabel==null) fromLabel = theedges[i][0];
  if (toLabel==null) toLabel = theedges[i][1];

  thiscolour = colours[to[to.length-1]]
//  thisgraph += '\t' + fromLabel + EDGESEP + toLabel + '\n'; // no coloured edges (all black)
//  thisgraph += '\t' + fromLabel + EDGESEP + toLabel + ' [color='+thiscolour+']\n'; // coloured edges
  thisgraph += '\t' + fromLabel + EDGESEP + toLabel + ' [color="'+thiscolour+(fadeedge?thefadeopacity:'')+'"]\n'; // coloured edges, faded if either end is not defined in the automorphism
 }

 if (withAutomorphism){
  thisgraph += '\n\t// POST-AUTOMORPHISM NODES\n';
  for (var i=0;i<thenewnodes.length;i++){
   var thislabel = labelNode(thenewnodes[i]);
   var nodecolour = theautonodecolour;
   var fontcolour = thelabelcolour;
   var xlabel = labelNode(thenodes[i]);
   var thisradius = 0.1;
   var showdist = null; // if requested, this is shown in the xlabel

   // if there is an entry in thenewnodes, set the properties of the node
   if (thislabel!=null){
    if (findNode(thenewnodes[i],thenewnodeindex) >= NoriginalNodes) nodecolour = theautonodecolourextended; // use a different colour for extended nodes
    if (autodistance[thenewnodes[i].toString()]!=undefined){
     showdist = autodistance[thenewnodes[i].toString()];
     thisradius = 1/showdist;
     if (thisradius==Infinity) thisradius = 1.0; // was 1.25
    } else { // try the old label instead?
     if (autodistance[thenodes[i].toString()]!=undefined){
      console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ using original node distance to set radius for "+thenewnodes[i].toString());
      showdist = autodistance[thenodes[i].toString()];
      thisradius = 1/showdist;
      nodecolour = theautonodenodistcolour; // distinguish SVG nodes whose radius is not accurate
     } else {
      // the distance this node moved is not defined (probably it came from outside the original graph)
      console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ undefined distance for node "+thenodes[i].toString());
      showdist = null;
      thisradius = 1;
      nodecolour = "#555555"; // distinguish SVG nodes whose radius is not accurate
     }
    }
    // ("thislabel" not null: these are the transformed nodes)
    thisgraph += '\t' + thislabel + ' ['+(showlabels?'':'label="", ')+'fillcolor="' + nodecolour + '", color=none, fontcolor="' + fontcolour + '", '+(showoriglabels?'xlabel="'+xlabel+((showdists&(showdist!=null))?' ('+showdist+')", ':'" '):((showdists&(showdist!=null))?'label="'+thislabel+' ('+showdist+')", ':'')) + ((sizebydist&(showdist!=null))?'width='+thisradius.toFixed(4):'') + ']\n';
   } else { // otherwise, just add the external label
    // ("thislabel" is null: these are the non-transformed nodes (ie. outside the original graph and not automorphed))
    thislabel = i;
    xlabel = labelNode(thenodes[i]);
    // change the next line to label the unused nodes (eg. with simply a number; there is no "proper" label)
    var dotcontent = 'label=""'+(showoriglabels?', xlabel="'+xlabel+'"':'');
    if (dotcontent.length) thisgraph += '\t' + thislabel + ' ['+ dotcontent + ']\n'; // omit nodes which have no dot style here (ie. "original graph" nodes, post-automorphism)
   }
  }
 } else {
  // show the original graph: do we want labels on the nodes?
  if (!showlabels){
   thisgraph += '\n';
   thisgraph += '\t// HIDE THE LABELS\n';
   for (var i=0;i<thenodes.length;i++){
    thislabel = i;
    thisgraph += '\t' + labelNode(thenodes[i]) + ' [label=""]\n';
   }
  }
 }

 thisgraph += '}\n';
 return thisgraph;
} // end mkdot

// function to run the GraphViz engine to draw the graph on screen ///////////////////////////////// fn: drawGraph
function drawGraph(G=[],doAutomorphism=false){
 var useformat = document.getElementById("input_format").value;
 var useengine = document.getElementById("input_engine").value;

 // skip drawing if the GraphViz engine is "none" or the graph is not defined
 if (useengine=="none" || G.length==0){
  console.log("Skipping GraphViz graph");
 } else {
  graphData = G;
  hpccWasm.graphviz.layout(graphData, useformat, useengine, ).then(svg => {
   const svgdiv = document.getElementById("thegraph"); // the div where the SVG graph should be attached
   svgdiv.innerHTML = svg;
   document.getElementById("thegraph").setAttribute("data-copy-text",svg); // for the clipboard
   document.getElementById("thegraph").querySelector("polygon").remove(); // remove the spurious background polygon
   setupNodes(); // set the onclick function for the nodes (now that they exist)
   setSVGDefs(); // attach the SVG code for the arrow head markers
   decorateNodes(doAutomorphism);

   // make a list of the SVG element ID (eg. "node8") for the vertices
   if (doAutomorphism){
    listOfPostNodeIds = [];
    for (var i=0;i<thenodes.length;i++) listOfPostNodeIds[i] = findSVGNodeByLabel(labelNode(thenodes[i]));
   } else {
    listOfNodeIds = [];
    for (var i=0;i<thenodes.length;i++) listOfNodeIds[i] = findSVGNodeByLabel(labelNode(thenodes[i]));
   }

  });
 }

} // end drawGraph

// function to initiate the original graph and text //////////////////////////////////////////////// fn: run
async function run(doAutomorphism=false){
 // get values from the user controls:
 var valency = parseInt(document.getElementById("input_valency").value);
 var maxdepth = parseInt(document.getElementById("input_maxdepth").value);

 // initialise
 thenodes = [];        // list of nodes by address
 thenodes[0] = [];     // root node
 theedges = [];        // pair-wise edges, using indices
 thenodeindex = [];    // associative array, index by node address
 thenewnodes = [];     // list of nodes by address post-automorphism
 thenewnodeindex = []; // associative array, index by node address, for the post-automorphism graph
 autoprogress = [];    // list of flags indicating which nodes have been determined (processed) under the automorphism
 autodistance = [];    // compute how far each node has moved
 thenodeindex["ROOT"] = 0;

 // loop over all nodes and add children to those at the (current) maximum depth
 for (var d=0;d<maxdepth;d++){
  for (var i=0;i<thenodes.length;i++){
   if (thenodes[i].length==d){
    for (var v=0;v<valency;v++){
     if (thenodes[i][thenodes[i].length-1]!=v){ // but only add this node if it really exists (ie. not doubling back on the path)
      thenodes[thenodes.length] = thenodes[i].concat(v);
      // store the index of each node address as well (to aid searching)
      thenodeindex[thenodes[thenodes.length-1].toString()] = thenodes.length-1; // at this point, this is never the root node (we started there, and are adding children)
      // and add an edge at the same time
      theedges.push([i,thenodes.length-1]);
     }
    }
   }
  }
 }

 // initialise the post-automorphism nodes
 NoriginalNodes = thenodes.length; // we want to know this to limit recursing if we add nodes during the tranformation
 for (var i=0;i<thenodes.length;i++){
  thenewnodes[i] = null; // Note: empty value is reserved for the root node, so use null for unspecified nodes
 }

 if (doAutomorphism && autoFrom!=null && autoTo!=null){
  /* --- start of applying the automorphism --- */


  /* APPLY THE AUTOMORPHISM */
  // find the SVG element where the reference node is moving to, and store it in the index
  var destinationSVGnode = findNode(autoTo,thenodeindex);
  thenewnodeindex[autoFrom.toString()] = destinationSVGnode;
  // set the label which the destination SVG node gets under the automorphism
  thenewnodes[destinationSVGnode] = autoFrom;
  // add the distance between the reference and destination nodes:
  autodistance[autoFrom.toString()] = nodeDistance(autoFrom,autoTo);
  // carry out the automorphism:
  if (testPermutation(thelocalaction[autoFrom.toString()])){
   processnode(autoFrom);
  } else {
   console.log("Error: invalid permutation specified for local action at the reference vertex");
  }


  /*  DECORATION/REPORTING */
  // show the reference node and its destination on the screen (inside the graph area)
  showFromTo();
  // cover up the local action editor (greyed out) by unhiding the "mask" over it
  document.getElementById("editorhider").classList.remove("hiddenElement");


  /* DYNAMICS CONTROLS */
  // set the available dynamic range limits according to the just-drawn graph
  // (note: always use a min and max limits for the slider of 0 and 1+max(D))
  var D = gatherDistances();
  document.getElementById('dynamicrange').noUiSlider.updateOptions({range:{'min':Math.min(...D,0),'max':Math.max(...D,0)+1},start:[D[0], D[1]]});
  // turn off the dynamics when re-drawing the graph (they are not drawn, just need to reset the 'dynamicsShown' flag
  if (dynamicsShown) showDynamics(); // ie. turn them off if they were on

  /* --- end of applying the automorphism --- */
 } else {
//  clearAutomorphism();
  if (autoFrom!=null && autoTo!=null){
   document.getElementById("editorhider").classList.add("hiddenElement"); // enable the local action editor for the original graph (if autoFrom and autoTo are set)
  }
 }

 // generate the dot code (for original or automorphed graph)
 var G = mkdot(doAutomorphism);
 // ...and display it as text:
 document.getElementById("theoutput").innerHTML = "<pre>"+G+"</pre>";
 document.getElementById("theoutput").setAttribute("data-copy-text",G); // for the clipboard

 // ...and draw it on the screen:
 drawGraph(G,doAutomorphism);
 // alternatively, feed it to https://dreampuf.github.io/GraphvizOnline/

 document.body.style.cursor = "";

 return 0;
} // end run()

// random integers ///////////////////////////////////////////////////////////////////////////////// fn: randomInt
function randomInt(n=1){
 return Math.floor(Math.random()*n); // random integer from the set [0, 1, ..., n-1]
}

// find the neighbours of a given node, for a given valency //////////////////////////////////////// fn: findNeighbours
function findNeighbours(node){
 // input is an address, eg. [0,1,0]
 var valency = parseInt(document.getElementById("input_valency").value);
 neighbours = Array(valency); // initialise

 for (var v=0;v<valency;v++){
  if (v==node[node.length-1]){ // check for the "parent" node
   // add the neighbour towards the root node
   neighbours[v] = node.slice(0,node.length-1);
  } else {
   neighbours[v] = node.concat(v);
  }
 }
 return neighbours;
}

// find the common prefix of two nodes ///////////////////////////////////////////////////////////// fn: getPrefix
function getPrefix(node1,node2){
 // pass nodes as arrays, eg [0,1,0]
 var prefix = [];
 for (var i=0;i<Math.min(node1.length,node2.length);i++){
  if (node1[i]==node2[i]){
   prefix.push(node1[i]);
  } else {
   // stop
   break;
  }
 }
 return prefix;
}

// generate the path between two given nodes /////////////////////////////////////////////////////// fn: getPath
function getPath(node1,node2){
 // returns the path from node1 to node2 (inclusive on both ends)
 // pass nodes as arrays, eg [0,1,0]
 var path = [];
 var prefix = getPrefix(node1,node2); // common prefix for both nodes
 // add the nodes from node1 back to the prefix node
 for (var i=node1.length;i>=prefix.length;i--){
  var nextstep=[];
  for (var j=0;j<i;j++){
   nextstep.push(node1[j]); // construct the next node in the path
  }
  path.push(nextstep); // put that node into the path list
 }
 // add the nodes from the prefix node up to node2
 for (var i=prefix.length;i<node2.length;i++){
  var nextstep=[];
  for (var j=0;j<=i;j++){
   nextstep.push(node2[j]); // construct the next node in the path
  }
  path.push(nextstep); // put that node into the path list
 }
 return path;
}

// copy the clicked object's contents ////////////////////////////////////////////////////////////// fn: copy
async function copy(targetId=null){
 // Modified from https://www.jasongaylord.com/blog/2020/05/21/copy-to-clipboard-using-javascript
 if (!navigator.clipboard){
  return;
 }

 try {
  if (targetId==null){
   target = event.srcElement;
  } else {
   target = document.getElementById(targetId);
  }
  var copy_value = target.getAttribute("data-copy-text");
  await navigator.clipboard.writeText(copy_value);
 } catch (error){
  console.error("copy failed", error);
 }
}

// create a GraphViz Online link /////////////////////////////////////////////////////////////////// fn: openGraphVizLink
function openGraphVizLink(){
// var G = mkdot();
 var G = document.getElementById("theoutput").getAttribute("data-copy-text");
 var useengine = document.getElementById("input_engine").value;
 return "https://dreampuf.github.io/GraphvizOnline/#"+encodeURIComponent(G);
// return "https://quickchart.io/graphviz?layout="+useengine+"&graph="+encodeURIComponent(G);
}

// manage the control values and buttons /////////////////////////////////////////////////////////// fn: manageControls
function manageControls(){
 document.getElementById("output_valency").value = parseInt(document.getElementById("input_valency").value);
 document.getElementById("output_maxdepth").value = parseInt(document.getElementById("input_maxdepth").value);
 document.getElementById("output_Nnodes").value = calcSize();

 document.getElementById("output_Nnodes").classList.remove("toobig")
 document.getElementById("output_Nnodes").classList.remove("red","toobig")

 if (calcSize()>5000){
  document.getElementById("output_Nnodes").classList.add("toobig")
 } else if (calcSize()>2000){
  document.getElementById("output_Nnodes").classList.add("red")
 }
}

// how many nodes does the graph have? ///////////////////////////////////////////////////////////// fn: calcSize
function calcSize(valency=null,maxdepth=null){
 // get the valency and maxdepth if they were not provided:
 if (valency==null) valency = parseInt(document.getElementById("input_valency").value);
 if (maxdepth==null) maxdepth = parseInt(document.getElementById("input_maxdepth").value);
 var N = 0;
 var Nnodes = 0;
 for (var d=0;d<=maxdepth;d++){
  if (d==0){
   N = 1;
  } else if (d==1){
   N = valency;
  } else {
   N = N*(valency-1);
  }
  Nnodes += N;
 }
 return Nnodes;
}


// process the automorphism //////////////////////////////////////////////////////////////////////// fn: processnode
function processnode(v){
 // note that v (the node to be processed) is an address, eg. [1,0,1,1]
 var valency = parseInt(document.getElementById("input_valency").value);
 var verbose = false;
 var debug = false;
 if (verbose) console.log("Processing node "+labelNode(v)); // +"                                   ie. "+v.toString()+" (valency="+valency+")");

 var indx = findNode(v,thenodeindex);
 var destindx = thenewnodeindex[v];

 var onlyDrawDrawnNodes = document.getElementById("input_extent").checked;

 // has this node been drawn within the current extent of the graph?
 if (onlyDrawDrawnNodes && indx==undefined){
  if (verbose) console.log("    ... stopping at "+labelNode(v)+" [node not drawn]"); // v is outside the drawn graph
  autoprogress.push(labelNode(v));
 } else if (destindx==undefined){
  if (verbose) console.log("    ... stopping at "+labelNode(v)+" [destination not drawn]"); // w is outside the drawn graph
  autoprogress.push(labelNode(v));
 } else {
  if (autoprogress.indexOf(labelNode(v))>-1){
   if (verbose) console.log("    ... already done node "+labelNode(v));
  } else {
   autoprogress.push(labelNode(v));

   var w = thenodes[destindx]; // address of the destination node
   if (debug) console.log("AUTOMORPHISM: node "+labelNode(v)+" is moving to "+labelNode(w));

   // 1. retrieve the local action, f_v, at this node
   //    The current method is to use the user-defined local action at each node UNLESS the "constant" switch is on
   //    In that case, the reference node's local action is used at every node.
   var thislocalaction = thelocalaction[v.toString()];
   // but check if we are using the "constant" local action option
   var constantAuto = document.getElementById("input_constantauto").checked;
   if (constantAuto){
    thislocalaction = thelocalaction[autoFrom.toString()]; // use the reference node's local action everywhere
   }

   if (thislocalaction==null || thislocalaction==undefined || !testLocalAction(thislocalaction)){
    if (verbose) console.log("    ... no valid local action defined at "+labelNode(v)+", so stopping");
   } else {
    // 2. find this node's neighbours, vi
    var vi = findNeighbours(v); // IN THE ORIGINAL GRAPH
    // 3. permute them according to the local action to give vif (remember that permuteList() takes a list of nodes as its input, not a single node)
    var vif = permuteList(vi,thislocalaction);
    // 4. find the node's destination's neighbours, wi
    var wi = findNeighbours(w); // POST-MOVE


    if (debug) console.log(" +++ The neighbours of "+labelNode(v)+" are "+vi.map(labelNode).toString());
    if (debug) console.log(" +++ Under the local action they are "+vif.map(labelNode).toString());
    if (debug) console.log(" +++ Their destinations are "+wi.map(labelNode).toString());


    // 3. for each permuted neighbour:
    for (var i=0;i<vif.length;i++){
     if (debug) console.log("     +++ Working on "+labelNode(v)+" neighbour "+labelNode(vi[i])+" ("+findNode(vi[i],thenodeindex)+") -> "+labelNode(vif[i])+" ("+findNode(vif[i],thenodeindex)+") -> "+labelNode(wi[i])+" ("+findNode(wi[i],thenodeindex)+")");

     // find the index of this node's destination *in the "new" graph*
     var neighbourdestindx = findNode(wi[i],thenodeindex);

     // can we draw this destination node?
     var doprocess = true;  // process this neighbouring node?
     if (neighbourdestindx==undefined){
      if (debug) console.log("     ... "+labelNode(vi[i])+" node permutes to "+labelNode(vif[i])+" but their destination "+labelNode(wi[i])+" is outside the drawn graph ");
      doprocess = false; // unless....:

      // test whether this neighbour is drawn on the original graph, and whether we want, in that case, to extend the graph:
      var extendGraph = document.getElementById("input_extendgraph").checked;
      if (extendGraph & thenodeindex[vif[i].toString()]<NoriginalNodes){ // note that the < test replaces !=undefined
       if (verbose) console.log("          EXTENDING GRAPH:");
       if (verbose) console.log("          ... using original node "+labelNode(thenodes[thenodeindex[[0].toString()]]));
       // yes, so add the destination node:
       thenodes.push(wi[i]);
       thenodeindex[wi[i].toString()] = thenodes.length - 1;
       // now we do have the neighbour's destination index:
       neighbourdestindx = thenodeindex[wi[i].toString()];
       // and connect it:
       theedges.push([destindx,neighbourdestindx]);
       if (verbose) console.log("          ....... adding edge "+theedges[theedges.length-1][0]+", "+theedges[theedges.length-1][1]);
       if (verbose) console.log("          .......           = "+destindx+", "+neighbourdestindx);
       if (verbose) console.log("          .......           = "+labelNode(thenodes[destindx])+", "+labelNode(thenodes[neighbourdestindx]));
       // then.....
       doprocess = true;
      }
     }

     if (doprocess){
      if (debug) console.log(" ^^^^^^^^^^^^^^^^^^^^ processing node "+labelNode(vif[i]));
      // only process nodes which were drawn in the original graph:
      if (!onlyDrawDrawnNodes|findNode(vif[i],thenodeindex)!=undefined){
       thenewnodes[neighbourdestindx] = vif[i];

       // update the index for the post-automorphism graph (taking care with the root node):
       var thisnodestring = vif[i].toString();
       thenewnodeindex[thisnodestring] = neighbourdestindx;

       // how far did the node move?
       autodistance[vif[i].toString()] = nodeDistance(vif[i],wi[i]);
       if (debug) console.log(" ----------------------------------------------------------------- distance from "+labelNode(vif[i])+" to "+labelNode(wi[i])+" is "+autodistance[vif[i].toString()]);
       if (debug) console.log("   --- setting thenewnodeindex["+vif[i].toString()+"] to "+thenewnodeindex[vif[i].toString()]);

       // now work on this neighbour's neighbours:
       if (debug) console.log("Calling processnode(["+vif[i]+"]), ie. processnode(\""+labelNode(vif[i])+"\")");
       processnode(vif[i]);
      }
     } else {
      if (debug) console.log(" ********************************************************** NOT PROCESSING NODE "+labelNode(vif[i])); // probably because it is off the graph (and the graph is not being extended)
     }

    }
   }
  }
 }
 return 0;
}

// find the index of a node by its address ///////////////////////////////////////////////////////// fn: findNode
function findNode(v,nodeindex){
 if (v.length){
  return nodeindex[v];
 } else {
  return nodeindex["ROOT"];
 }
}

// find the distance between two nodes ///////////////////////////////////////////////////////////// fn: nodeDistance
function nodeDistance(v,w){
 // inputs are node addresses, eg. [0,1,2,1]
 // remove common prefix:
 if (v.length>0 && w.length>0){
  while (v[0]==w[0]){
   v=v.slice(1);
   w=w.slice(1);
   if (v.length==0 | w.length==0){
    break;
   }
  }
 }
 // the count what path length is left
 var dist = v.length+w.length;
 return dist;
}

// HTML input labelling function /////////////////////////////////////////////////////////////////// fn: setOutputValues
// function which looks for inputs and their labels (containing the input value), and sets the label
// (called on page load, to set the initial labels, and when one of the slider controls changes (valency, maxdepth))
function setOutputValues(){
 var debug = false;

 // display the calculated number of nodes that these control choices (valency, depth) will produce:
 document.getElementById("output_Nnodes").value = calcSize();

 // set the max allowed valency to the number of defined colours (add more if we want this to be higher):
 document.getElementById("input_valency").max = colours.length;

 var inputs = document.getElementsByTagName("input"); // get a list of the page inputs
 for (var i=0;i<inputs.length;i++){ // loop over the inputs
  if (inputs[i].id.length && !inputs[i].classList.contains("pickertheme")){ // omit the colour pickers from this process
   if (debug) console.log("examining "+inputs[i].id);
   outputID = inputs[i].id.replace('input_','output_');
   if (!!document.getElementById(outputID)){ // does an output tag for this control exist?
    document.getElementById(outputID).value = inputs[i].value; // set the value of the output to the input
   }
  } else {
   if (debug) console.log("skipping "+inputs[i].id);
  }
 }

 // turn on and off the appropriate colour pickers according to the selected valency:
 var valency = parseInt(document.getElementById("input_valency").value);
 for (var i=1;i<=valency;i++){ // on
  var pickername = "picker"+i;
  if (debug) console.log("Showing "+pickername);
  document.getElementById(pickername).nextSibling.style.display="block";
 }
 for (var j=i;j<=colours.length;j++){ // off
  var pickername = "picker"+j;
  if (debug) console.log("Hiding "+pickername);
  document.getElementById(pickername).nextSibling.style.display="none";
 }

 // display the appropriately-sized local action editor
 showEditor(valency);
}

// set the hover/click functionality of nodes ////////////////////////////////////////////////////// fn: setupNodes
function setupNodes(){
 var debug = false;

 var allnodes = document.getElementsByTagName("g");
 for (var i=0;i<allnodes.length;i++){
  if (allnodes[i].classList.contains("node")){ // only set onclick for the nodes (not edges)
   /*
      HERE WE DEFINE THE ON-CLICK FUNCTION FOR NODES:
      - it will register the reference and destination nodes (previously alternatively, now once each)
      - and add styling to those nodes
      - but how to switch nodes for defining individual local actions? select ref/dest then click for LA
   */
   allnodes[i].onclick = function() {
    var thisnodeid = this.id;
    var thisnodelabel = this.querySelector(Node="title").textContent;
    var thisnode = labelToAddress(thisnodelabel);
    var doautomorphism = document.getElementById("thesvg").classList.contains("autoGraph");
    if (setTo){
     // set the destination node
     autoTo = labelToAddress(thisnodelabel);
     setTo = false;
     showFromTo();
     // now that the reference AND destination nodes are set, enable the local action editor:
     document.getElementById("editorhider").classList.add("hiddenElement");
     decorateNodes(doautomorphism);
     testAutomorphism();
    } else if (setFrom){
     // set the reference node
     autoFrom = labelToAddress(thisnodelabel);
     setFrom = false;
     setTo = true;
     showFromTo();
     enableLocalAction(autoFrom); // turn on the local action editing for the reference node
     // show it in the local action editor
     loadNodeAction(autoFrom);
     decorateNodes(doautomorphism);
     testAutomorphism();
    } else {
     // some other click behaviour... like selecting nodes for defining their local action permutation
     if (debug) console.log("Clicked on node: "+thisnodeid);
     // test if a local action (even an empty one) exists for this node, and if so show it in the editor
     // ... but only if the graph is not the "transformed" one (ie. does not have the autoGraph CSS class)
     if (thelocalaction[thisnode.toString()]!=undefined && !doautomorphism){
      loadNodeAction(thisnode);
     } else if (doautomorphism){
      // the transformed graph is shown, so add orbit tracing as the onclick behaviour
//      var thisnodelabelalt = labelNode(thenodes[listOfNodeIds.indexOf(thisnodeid)]);
      traceOrbitByLabel(thisnodelabel,100,true); // max orbit length 100, draw arrows true
     }
    }

   } // end of node onclick function

   // add hover/mouseover behaviour to trace nodes' orbits
   allnodes[i].onmouseenter = function() {
    var doautomorphism = document.getElementById("thesvg").classList.contains("autoGraph");
    var thisnodeid = this.id;
    var thisnodelabel = this.querySelector(Node="title").textContent;
    if (doautomorphism){
     loadNodeAction(labelToAddress(thisnodelabel)); // show the node's local action in the editor
     traceOrbitByLabel(thisnodelabel,100,true); // max orbit length 100, draw arrows true
    }
   }


   // while we are here, change the font size for the xlabels
   var nodelabels = allnodes[i].querySelectorAll(Node="text");
   if (nodelabels.length>1){
    var xlabel = nodelabels[1]; // the "xlabel" from Graphviz
    xlabel.style.fontSize="8pt";
   }

  }
 }
}

// list the reference and destination nodes in the corner of the graph ///////////////////////////// fn: showFromTo
function showFromTo(){
 // insert the autoFrom and autoTo nodes into the details div
 var fromstring = labelNode(autoFrom);
 var tostring = labelNode(autoTo);
 document.getElementById("fromto").innerHTML = (fromstring==null?"?":fromstring)+" &#8614; "+(tostring==null?"?":tostring);
}

// initialise the automorphism ///////////////////////////////////////////////////////////////////// fn: clearAutomorphism
function clearAutomorphism(){
 autoFrom = null;
 autoTo = null;
 thelocalaction = [];  // list of automorphism permutation at each node (local action)
 thelocalconstraint = []; // list of constraints imposed by neighbouring local actions
 autoprogress = [];    // list of flags indicating which nodes have been determined (processed) under the automorphism
 autodistance = [];    // compute how far each node has moved

 // go back to click-to-set-reference-node
 setFrom = true;

 // remove local actions
 var allnodes=document.getElementsByClassName("node");
 for (var i=0;i<allnodes.length;i++){
  document.getElementById(allnodes[i].id).classList.remove("canhavelocalaction");
  document.getElementById(allnodes[i].id).classList.remove("haslocalaction");
 }

 // reset the local action editor and clear the node being worked on
 resetLocalActionEditor();
 // and "hide" it
 document.getElementById("editorhider").classList.remove("hiddenElement");

 // turn off the "constant" local action switch
 document.getElementById("input_constantauto").checked = false;

 // remove the text from the corner of the graph (the reference node and its destination)
 document.getElementById("fromto").innerHTML = "";
 // remove any text in the infobox below the graph
 showInfo('');

 // draw the original graph
 run();
 decorateNodes();
}

// inverse function from label (string, eg. 'grb') to node (address, eg. [2,0,1]) ////////////////// fn: labelToAddress
function labelToAddress(thelabel=""){
 var thenode = [];
 for (var i=0;i<thelabel.length;i++){
  var indx = thelabels.indexOf(thelabel[i]);
  if (indx>-1) thenode.push(indx);
 }
 return thenode;
}

// function to find the SVG for a given node, by label ///////////////////////////////////////////// fn: findSVGNodeByLabel
function findSVGNodeByLabel(nodelabel=null){
 if (nodelabel!=null){
  var allnodes=document.getElementsByClassName("node");
  for (var j=0;j<allnodes.length;j++){
   if (nodelabel==allnodes[j].querySelector(Node="title").textContent){
    return allnodes[j].id;
   }
  }
 }
 return null;
}

// function to get the coordinates of an SVG node on the screen using a vertex label /////////////// fn: findSVGCoordsByLabel
function findSVGCoordsByLabel(nodelabel=null){
 var thisnode = findSVGNodeByLabel(nodelabel); // "thisnode" is the id of the SVG element
 if (thisnode != null){
  return getSVGCoords(thisnode);
 } else {
  return null;
 }
}

// function to get the coordinates of an SVG node using its ID ///////////////////////////////////// fn: getSVGCoords
function getSVGCoords(nodeid=null){
 if (nodeid != null && document.getElementById(nodeid)){
  var x = parseFloat(document.getElementById(nodeid).querySelector(Node="ellipse").attributes.cx.value);
  var y = parseFloat(document.getElementById(nodeid).querySelector(Node="ellipse").attributes.cy.value);
  var r = parseFloat(document.getElementById(nodeid).querySelector(Node="ellipse").attributes.rx.value); // assume equal to ry
  return [x,y,r];
 } else {
  return null;
 }
}

// calculate the Euclidean distance between two points ///////////////////////////////////////////// fn: euclideanDistance
function euclideanDistance(p1,p2){
 return Math.pow(Math.pow(p1[0]-p2[0],2.0)+Math.pow(p1[1]-p2[1],2.0),0.5);
}

// find the midpoint of two coordinates //////////////////////////////////////////////////////////// fn: lineMidPoint
function lineMidPoint(start,end,factor=0.5){
 var alongX = start[0]+factor*(end[0]-start[0]);
 var alongY = start[1]+factor*(end[1]-start[1]);
 return [alongX,alongY];
}

// create an arrow between two nodes specified by their labels ///////////////////////////////////// fn: addArrowByLabel
function addArrowByLabel(startLabel=null,endLabel=null,clearOldArrows=false,doAnimate=true){
 // create an SVG path between the given vertices, using their labels, eg. addArrowByLabel("br","g") )
 startPosition=findSVGCoordsByLabel(startLabel);
 endPosition=findSVGCoordsByLabel(endLabel);

 var A = addArrow(startPosition,endPosition,clearOldArrows,doAnimate);
 return A;
}

// create an arrow between two nodes specified by their addresses ////////////////////////////////// fn: addArrowByAddress
function addArrowByAddress(startAddress=null,endAddress=null,clearOldArrows=false,doAnimate=true){
 // create an SVG path between the given vertices using their addresses, eg. addArrowByAddress([1,0,1],[0,1,0]) )
 startPosition = getSVGCoords(findSVGNodeByLabel(labelNode(startAddress)));
 endPosition = getSVGCoords(findSVGNodeByLabel(labelNode(endAddress)));

 var A = addArrow(startPosition,endPosition,clearOldArrows,doAnimate);
 return A;
}

// create an arrow between two nodes specified by their SVG nodes ////////////////////////////////// fn: addArrowBySvg
function addArrowBySvg(startNodeId,endNodeId,clearOldArrows=false,doAnimate=true){
 // create an SVG path between the given SVG elements using their IDs, eg. addArrowByAddress("node7","node5")
 var startPosition = getSVGCoords(startNodeId);
 var endPosition = getSVGCoords(endNodeId);

 var A = addArrow(startPosition,endPosition,clearOldArrows,doAnimate);
 return A;
}

// create an arrow between two coordinates ///////////////////////////////////////////////////////// fn: addArrow
function addArrow(startPosition,endPosition,clearOldArrows=false,doAnimate=true){
 // create an SVG path between the given coordinates
 if (startPosition == null || endPosition == null){
  return null;
 } else if (startPosition[0]==undefined || endPosition[0]==undefined){
  // not found, don't make the arrow (probably tried to draw an arrow to a node which is not drawn)
  return null;
 } else {

  var arrowPath = createSVGPath(startPosition[0],startPosition[1],endPosition[0],endPosition[1],-1); // -1 for default curvature

  // get the element which we will append the arrow to
  var svg = document.getElementById("graph0"); // this is the main SVG element from GraphViz
  // get the DEFS which we will append the arrow heads to
  var svgdefs = document.getElementById("arrowhead").parentElement

  // remove old arrows?
  if (clearOldArrows) clearArrows();

  // what will the ID of the new arrow (line) be?
  var Narrows = document.getElementsByClassName("graphArrow").length;
  var newarrowid = "arrow"+Narrows.toString();
  // and of the head?
  var newarrowheadid = newarrowid+"head";

  // make a copy of the arrowhead
  var Narrowheads = document.getElementsByClassName("arrowhead").length;
  var newarrowhead = document.getElementById("arrowhead").cloneNode();
  var newarrowheadid = newarrowid+"head";
  newarrowhead.id = newarrowheadid; // set id
  newarrowhead.classList.add("arrowhead"); // set class
  // need to clone the children (including the path) of the original arrowhead too
  var newarrowheadchildren = document.getElementById("arrowhead").children;
  for (var j=0;j<newarrowheadchildren.length;j++){
   var newchild = newarrowheadchildren[j].cloneNode();
//   if (newchild.tagName=="path"){
//    newchild.setAttribute("fill","#f30"); // set the colour while we are cloning?
//   }
   newarrowhead.append(newchild);
  }
  svgdefs.appendChild(newarrowhead);

  // create a new arrow (the line):
  var newarrow = document.createElementNS("http://www.w3.org/2000/svg","path");
  newarrow.style.fill = "none";
  newarrow.style.stroke = "#0003";
  newarrow.setAttribute("stroke-width",3);
  newarrow.setAttribute("d",arrowPath);
  newarrow.setAttribute("id",newarrowid);
//  newarrow.setAttribute("marker-end","url(#arrowhead)"); // use the same head for all arrows
  newarrow.setAttribute("marker-end","url(#"+newarrowheadid+")");
  newarrow.classList.add("graphArrow");
//  "class": "animpath",
//  "fromto": from+" "+to,
  svg.appendChild(newarrow);

  if (doAnimate){
   var L = newarrow.getTotalLength();
   newarrow.setAttribute("stroke-dasharray",L);
   newarrow.setAttribute("stroke-dashoffset",L);
   newarrow.classList.add("animatedArrow");
  }

  return newarrow;
 }
}

// function to style an SVG arrow
function styleArrow(arrow=null,width=4,colour=null,headcolour=null){
 // parameters are an HTML element, integer and colour strings
 if (arrow!=null){
  // set the arrow's colour
  if (colour!=null){
   arrow.style.stroke = colour;
  }
  // set the arrow's width
  arrow.setAttribute("stroke-width",width);
  // use the stroke colour for the arrow's head as well
  if (headcolour==null && colour!=null) headcolour = colour;
  if (headcolour!=null){
   // arrow head IDs are formed from the arrow ID by appending "head"
   document.getElementById(arrow.id+"head").getElementsByTagName("path")[0].setAttribute("fill",headcolour);
  }
 }
}

// function to remove all SVG arrows from the graph //////////////////////////////////////////////// fn: clearArrows
function clearArrows(){
 var oldarrows = document.getElementsByClassName("graphArrow");
 for (var i=oldarrows.length;i>0;i--){
  oldarrows[i-1].remove();
 }
 // and their arrowheads
 var oldarrowheads = document.getElementsByClassName("arrowhead");
 for (var i=oldarrowheads.length;i>0;i--){
  oldarrowheads[i-1].remove();
 }
 // remove the "iscycle" note as well, for good measure
 document.getElementById("iscycle").innerHTML = '';
}

// function to compute the path between given endpoints [from focusmodels] ///////////////////////// fn: createSVGPath
function createSVGPath(startX,startY,endX,endY,offset=0,relativePath=false){
 var startPos = Array(startX,startY);
 var endPos = Array(endX,endY);
 // startPos and endPos are two-element positions
 // offset is the maximum distance from the line between them that the path should reach
 //  - use offset = -1 for a default curve
 //  - offset = 0 will be a straight line
 var debug = false;
 if (debug) console.log("Making path from "+String(startPos[0])+","+String(startPos[1])+" to "+String(endPos[0])+","+String(endPos[1]));

 if (relativePath){
  for (var d=0;d<startPos.length;d++){ // loop over each dimension
   endPos[d] -= startPos[d]; // subtract the starting coordinate to create a relative path
   startPos[d] = 0;
  }
 } else {
  // else don't subtract the starting point
 }

 // is the path actually a loop back to the same place?
 var selfConnectedPath = true;
 for (var d=0;d<startPos.length;d++){
  if (startPos[d]!=endPos[d]) selfConnectedPath = false; // no, it isn't
 }

 // taken from https://stackoverflow.com/a/49286885
 if (offset==-1){
  // default offset is 0 but if -1 is given, make a nice "long" curve (ie. put the control point fairly far from the line between start and end)
  offset = euclideanDistance(startPos,endPos)*0.25;
 }

 var midpt = lineMidPoint(startPos,endPos);

 var p1x=startPos[0];
 var p1y=startPos[1];
 var p2x=endPos[0];
 var p2y=endPos[1];
 var mpx=midpt[0];
 var mpy=midpt[1];

 if (selfConnectedPath){
  // location of control points:
  var useRandom = false;
  if (useRandom){
   var controlPtRadius = 500; // say
   // a bit more personable but the (looping) arrows are re-generated every time they are drawn
   // ie. whenever the dynamic range slider is moved
   var selfc1X = Math.round(p1x+(Math.random()-0.5)*controlPtRadius);
   var selfc1Y = Math.round(p1y+(Math.random()-0.5)*controlPtRadius);
   var selfc2X = Math.round(p2x+(Math.random()-0.5)*controlPtRadius);
   var selfc2Y = Math.round(p2y+(Math.random()-0.5)*controlPtRadius);
  } else {
   // self-connnecting arrows are drawn the same way every time
   // try +/- 45deg "above" the node (on the screen)
   var angle = 45;
   var controlPtRadius = 250; // say
   var selfc1X = Math.round(p1x-Math.sin(2*Math.PI*(angle/360))*controlPtRadius);
   var selfc1Y = Math.round(p1y+Math.sin(2*Math.PI*(angle/360))*controlPtRadius);
   var selfc2X = Math.round(p1x+Math.sin(2*Math.PI*(angle/360))*controlPtRadius);
   var selfc2Y = Math.round(p1y+Math.sin(2*Math.PI*(angle/360))*controlPtRadius);
  }
  var c1 = [selfc1X,selfc1Y].join(","); // control point 1
  var c2 = [selfc2X,selfc2Y].join(","); // control point 2

  // create a looping path with a cubic Bezier curve
  var thepath = "M "+p1x+","+p1y+" C "+c1+" "+c2+" "+p2x+","+p2y; // "C" for cubic; higher orders are available but require more control points

 } else {
  // angle of the perpendicular to line joining start and end:
  var theta = -Math.atan2(p2y - p1y, p2x - p1x) - Math.PI / 2;

  // location of control point:
  var c1x = Math.round(mpx + offset * Math.cos(theta));
  var c1y = Math.round(mpy - offset * Math.sin(theta)); // fixed

  // location of alternative control point:
  var c1xALT = Math.round(mpx - offset * Math.cos(theta));
  var c1yALT = Math.round(mpy + offset * Math.sin(theta)); // fixed

  // we want arrows to curve away from the centre (always node1), so test which side of the arrow the control point is
  var pCentre = getSVGCoords("node1");
  if (euclideanDistance(pCentre,[c1x,c1y])<euclideanDistance(pCentre,[c1xALT,c1yALT])){
   // swap
   c1x = c1xALT;
   c1y = c1yALT;
  }

  // end points:
  p1x = Math.round(p1x);
  p1y = Math.round(p1y);
  p2x = Math.round(p2x);
  p2y = Math.round(p2y);

  // construct the command to draw a quadratic curve
  var thepath = "M " + p1x + " " + p1y + " Q " + c1x + " " + c1y + " " + p2x + " " + p2y;
 }

 return thepath;
}

// add SVG defs for an arrow-head marker and some fonts //////////////////////////////////////////// fn: setSVGDefs
function setSVGDefs(){
 var arrowcolour = "#0003";
 // insert the marker definition:
 document.getElementById("graph0").insertAdjacentHTML('afterbegin','\
<defs>\
 <marker id="oldarrowhead" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">\
  <path d="M0,0 L0,6 L9,3 z" fill="'+arrowcolour+'" />\
 </marker>\
 <marker id="arrowhead" markerWidth="9" markerHeight="9" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">\
  <path d="M0,0 L0,6 L9,3 z" fill="'+arrowcolour+'" />\
 </marker>\
 <style type="text/css">\
  @import url("https://fonts.googleapis.com/css2?family=Noto+Serif");\
<!--  @import url("https://fonts.googleapis.com/css2?family=Oi"); -->\
 </style>\
</defs>');

// extras, not yet used:
// <marker id="axesarrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">\
//  <path d="M0,0 L0,6 L9,3 z" fill="#f00" />\
// </marker>\
// <marker id="rayarrow" markerWidth="10" markerHeight="10" refX="2" refY="3" orient="auto" markerUnits="strokeWidth">\
//  <path d="M0,0 L3,3 L0,6" stroke-width="0.1" fill="none" stroke="#f00" />\
// </marker>\
// <path id="rayarrowbase" d="M-'+arrowSize+',0 L0,'+(arrowSize*arrowratio)+' L'+arrowSize+',0'+(filledarrows?' z" fill="'+edgeColour+'"':'"')+' stroke-width="0.5" fill="none" stroke="'+edgeColour+'" />\
// <path id="rayarrowbasefaded" d="M-'+arrowSize+',0 L0,'+(arrowSize*arrowratio)+' L'+arrowSize+',0'+(filledarrows?' z" fill="'+edgeColour+'55"':'"')+' stroke-width="0.5" fill="none" stroke="'+edgeColour+'55" />\

}

// set up the colour pickers /////////////////////////////////////////////////////////////////////// fn: setupColours
function setupColours(){
 var valency = parseInt(document.getElementById("input_valency").value);
 var thetable = document.getElementById("colourtable");
 var debug = false;

 // test that there are enough colours, but only warn and then carry on if there aren't
 if (valency>colours.length){
  console.log("WARNING: not enough colours are defined");
 }

 var tablecontent = '  <tbody>\n   <tr>\n';
 for (var i=1;i<=colours.length;i++){
  tablecontent += '    <td><span class="valencycolour" id="valcol'+i+'"></span><br/><input type="text" color="black" class="pickertheme" id="picker'+i+'"/></td>\n';
 }
 tablecontent += '   </tr>\n  </tbody>';

 if (debug) console.log("creating colour pickers");
 thetable.innerHTML = tablecontent;

 // set the colourtable "label" colours:
 // (note: this is not dynamic, since the colour-pickers are not there to change colours, but rather to specify the local actions)
 for (var i=1;i<=colours.length;i++){
  document.getElementById("valcol"+i).style.backgroundColor = colours[i-1];
  if (debug) console.log("labelling valcol"+i);
 }

}

// function to initialise the colour-pickers /////////////////////////////////////////////////////// fn: initPickers
function initPickers(){
//  initialise only, setting the options is done in setPickers()
 $(".pickertheme").spectrum({});
}

// function to match the pickers to their "labels" ///////////////////////////////////////////////// fn: setPickers
function setPickers(){
 for (i=1;i<=colours.length;i++){
  var pickername = "picker"+i;
  $("#"+pickername).spectrum({
   color: colours[i-1],
   preferredFormat: "hex3",
   clickoutFiresChange: "true",
   showPalette: true,
   showPaletteOnly: true,
   palette: colours,
//   palette: [['red'],['black'],['white']]
  });
 }
}

// function to add stylings to the SVG objects ///////////////////////////////////////////////////// fn: decorateNodes
function decorateNodes(doAutomorphism=false){
 // remove old decorations
 var old = document.getElementsByClassName("referenceNode");
 for (var j=0;j<old.length;j++) old[j].classList.remove("referenceNode");
 var old = document.getElementsByClassName("destinationNode");
 for (var j=0;j<old.length;j++) old[j].classList.remove("destinationNode");
 clearArrows();

 // if not drawing the post-automorphism graph, apply the reference and destination node classes
 // and mark the nodes with local action functions
 if (!doAutomorphism){
  var fromNode = findSVGNodeByLabel(labelNode(autoFrom));
  var toNode = findSVGNodeByLabel(labelNode(autoTo));
  if (fromNode != null) document.getElementById(fromNode).classList.add("referenceNode");
  if (toNode != null) document.getElementById(toNode).classList.add("destinationNode");
  if (fromNode!=null && toNode!=null){
   var fromstring = labelNode(autoFrom);
   var tostring = labelNode(autoTo);
   addArrowByLabel(fromstring,tostring,true,false); // true: clear old arrows; false: do not animate
  }
  // add local action decorations where warranted: [remove, now done by styleActions]
  for (thenodestr in thelocalaction){
   var thenode = thenodestr.split(","); // turn the string back into an array
   var thenodeid = findSVGNodeByLabel(labelNode(thenode)); // find the corresponding node on the screen
   if (thenodeid != null){ // make sure the node exists
    if (testLocalAction(thelocalaction[thenodestr])){ // if the saved local action is valid, mark the node as "has"
     document.getElementById(thenodeid).classList.add("haslocalaction");
    } else { // if the local action is not valid, mark it as "can have"
     document.getElementById(thenodeid).classList.add("canhavelocalaction");
    }
   }
  }
 }

 // add classes depending on the radius of each node (ie. the distance it has moved)
 rclasses = []; // the set of radius classes used on the page
 var allnodes = document.getElementsByTagName("g");
 for (var i=0;i<allnodes.length;i++){
  if (allnodes[i].classList.contains("node") && allnodes[i].childElementCount==4){ // only want nodes (not edges), and only nodes with a label (4 children instead of 3) (ie. don't add radius class to non-transformed nodes)
   var rr = parseFloat(allnodes[i].querySelector("ellipse").attributes.rx.nodeValue); // get the radius of this node's ellipse
   allnodes[i].classList.add("radius"+rr); // eg. radius36
   if (rclasses.indexOf("radius"+rr)==-1) rclasses.push("radius"+rr);
  }
 }

 if (doAutomorphism){
  // find fixed points and give them a specific class
  for (var eachnode in autodistance){ // loop through all the labels
   if (autodistance[eachnode]==0){
    var svgid = findSVGNodeByLabel(labelNode(stringListToArray(eachnode))); // transform; eg. "2,0" -> [2,0] -> "gr"
    document.getElementById(svgid).classList.add("fixedpoint");
   }
  }
 }

 // give the SVG graph an id (find all SVG elements and then choose the one whose parent is "thegraph"
 var allsvg = document.getElementsByTagName("svg");
 for (var i=0;i<allsvg.length;i++){
  if (allsvg[i].parentElement.id=="thegraph") allsvg[0].id = "thesvg";
  var thesvg = document.getElementById("thesvg");
 }

 // move the SVG to the centre of the graph box:
 if (thesvg!=undefined){
  var thegraph = document.getElementById("thegraph");
  var thepadding = parseInt(window.getComputedStyle(thegraph)["padding-top"]);
  var themargin = parseInt(window.getComputedStyle(thegraph)["margin-top"]);
  var theheight = thegraph.clientHeight;
  var thesvgheight = thesvg.clientHeight;
  thesvg.style.top = parseFloat((theheight-thepadding-themargin-thesvgheight)/2)+"px"
  // if we are not drawing the transformed graph, style nodes according to their local action status
  if (!doAutomorphism) styleActions();
 }
 // add a class to the SVG indicating whether it is the post-automorphism graph
 if (doAutomorphism) document.getElementsByTagName("svg")[0].classList.add("autoGraph");

}

// show/hide the external labels on the SVG graph ////////////////////////////////////////////////// fn: toggleLabels
function toggleLabels(type=0){
 // toggle some labels:  0 all, 1 main, 2 xlabel
 if (type!=1 && type!=2) type=0;
 var allnodes = document.getElementsByTagName("g");
 for (var i=0;i<allnodes.length;i++){
  if (allnodes[i].classList.contains("node")){ // only look at actual nodes (not the g which is the whole graph, say)
   var alllabels = allnodes[i].querySelectorAll(Node="text"); // all the node's labels
   for (var j=0;j<alllabels.length;j++){
    if (type==0 || type==(j+1)){ // either toggle all labels, or just the ones matching (j+1)
     thislabel = alllabels[j]; // [0] is the node label, [1] is the "xlabel"
     if (thislabel.style.display=="none"){
      thislabel.style.display="";
     } else {
      thislabel.style.display="none";
     }
    }
   }
  }
 }
}

// put the requested text into the infobox (below the graph) /////////////////////////////////////// fn: showInfo
function showInfo(text=''){
 var box = document.getElementById("infobox");
 // remove any existing content
 if (box.innerHTML.length>0){
  box.innerHTML = "";
 }
 // add the requested text
 box.innerHTML = text;
 box.classList.add("flashy");
 setTimeout(function(){
  box.classList.remove("flashy");
 }, 1500);
}

// give some information about the local action //////////////////////////////////////////////////// fn: showLAinfo
function showLAinfo(){
 var txt = "The local action is a permutation of the edge colourings at each vertex. If the \"constant\" switch is turned on, the local action at the reference vertex is applied at all vertices. Red and green borders mark vertices at which the local action can be and has been defined, respectively. The coloured squares in the top row represent the edge colours, with markers which can be dragged into the bottom row. The local action permutation is then defined by the order of the markers.";
 showInfo(txt);
}

// check that the automorphism is fully defined //////////////////////////////////////////////////// fn: testAutomorphism
function testAutomorphism(){
 // the conditions for a valid automorphism are:
 //   i. reference and destination nodes are set
 //  ii. at least the reference node has a valid local action defined
 // iii. any local actions defined for other nodes are valid
 var debug = false;
 var pass = false;
 if (autoFrom!=null && autoTo!=null && testPermutation(thelocalaction[autoFrom.toString()])){
  // i and ii pass, now check iii (all local actions are valid or empty)
  pass = true; // okay so far
  for (thenodestr in thelocalaction){
   if (!testPermutation(thelocalaction[thenodestr])){
    if (thelocalaction[thenodestr].length>0){
     if (debug) console.log("Permutation "+thelocalaction[thenodestr].toString()+" failed for node "+thenodestr);
     pass=false; // but fail if any NON-EMPTY local action is invalid
    }
   }
  }
 } else {
  pass=false;
 }

 // enable or disable the "Draw transformed" button according to the results:
 if (pass){
  document.getElementById("drawtransformedbutton").removeAttribute("disabled");
 } else {
  document.getElementById("drawtransformedbutton").setAttribute("disabled","disabled");
 }

 return pass;
}

// function to run some demos ////////////////////////////////////////////////////////////////////// fn: demo
function demo(n=1){
 n = n-1; // call the function using values 1, 2, etc., but internally use zero-indexing: demos[0], demos[1], etc.
 var demos = [];
 // format is [valency, depth, autoFrom, autoTo, localAction, constantLA, originalNodesOnly, extendGraph]:
 demos.push([3,3,'Ø','r',[0,1,2],true,false,false]);               // 1
 demos.push([3,3,'Ø','r',[2,0,1],true,false,false]);               // 2 as for 1 but with cyclic LA
 demos.push([4,3,'bg','b',[1,0,2,3],true,true,false]);             // 3
 demos.push([3,7,'g','r',[1,2,0],true,true,false]);                // 4 translation
// demos.push([3,7,'gb','r',[1,2,0],true,true,false]);               // 5 reflection?
 demos.push([3,5,'b','r',[0,1,2],true,false,false]);
 demos.push([3,5,'g','g',[1,2,0],true,true,false]);                // 6 rotation
// demos.push([7,4,'bkyk','kmck',[1,0,2,4,3,5,6],true,false]);  // 6 pretty but too slow
 demos.push([4,3,'bm','mg',[0,1,2,3],true,false,false]);           // 7 translation
 demos.push([3,5,'','r',[0,1,2],true,false,true]);                 // 8 reflection - draw with twopi and turn on dynamics


 if (n<demos.length){
  clearAutomorphism();
  console.log("Requested demo #"+String(n+1));
  waitCursor();
  document.getElementById("input_valency").value = demos[n][0]; // set valency
  document.getElementById("input_maxdepth").value = demos[n][1]; // set depth
  document.getElementById("input_constantauto").checked = demos[n][5]; // turn constantauto on or off
  document.getElementById("input_extent").checked = demos[n][6]; // turn "original nodes only" on or off
  document.getElementById("input_extendgraph").checked = demos[n][7]; // turn "extend graph" on or off
  setOutputValues();
  manageControls();
  run(false); // create the original (non-transformed) graph
  autoFrom = labelToAddress(demos[n][2]);
  autoTo = labelToAddress(demos[n][3]);
  setTo = false;
  setFrom = false;
  showFromTo();
  saveLocalAction(autoFrom,demos[n][4]); // set the local action for the reference node
  loadNodeAction(autoFrom); // show the reference node's local action in the editor as well
  if (testPermutation(thelocalaction[autoFrom.toString()])){
   run(true); // draw the transformed graph
  }
 }
}

// set the "wait" cursor /////////////////////////////////////////////////////////////////////////// fn: waitCursor
function waitCursor(){
 document.body.style.cursor = "wait";
}

// show the help (animated GIF) //////////////////////////////////////////////////////////////////// fn: toggleHelp
function toggleHelp(show=null){
 var forceHide = false;
 var forceShow = false;
 // if an input is given, use that (true=show, false=hide):
 if (show!=null){
  if (show){
   forceShow = true;
  } else {
   forceHide = true;
  }
 }
 if (document.getElementById("instructions").classList.contains("hiddenElement") || forceShow){
  // show the element (CSS display property)
  document.getElementById("instructions").classList.remove("hiddenElement");
  // insert the image: this way, the animation will start from the beginning each time
  document.getElementById("helpimage").setAttribute('src','annotated_instructions.gif');
 } else if (!document.getElementById("instructions").classList.contains("hiddenElement") || forceHide){
  // hide the element (CSS display property)
  document.getElementById("instructions").classList.add("hiddenElement");
  // remove the image
  document.getElementById("helpimage").setAttribute('src','');
 }
}

// gather all distances between original and transformed nodes ///////////////////////////////////// fn: waitCursor
function gatherDistances(){
 var allDistances = [];
 for (T in autodistance){
  allDistances.push(autodistance[T]);
 }
 return allDistances;
}

// count the occurences of the minimum of an array ///////////////////////////////////////////////// fn: countMinima
function countMinima(A){
 // firstly, find the minimum value in the array
 var m = Infinity; // initialise search
 for (T in A){
  if (A[T]<m) m=A[T]; // found new minimum value
 }
 // secondly, check how many occurrences of the minimum there are
 var n = 0;
 for (T in A){
  if (A[T]==m) n++;
 }
 return n;
}

// assess the automorphism's type ////////////////////////////////////////////////////////////////// fn: autoType
function autoType(){
 var D = gatherDistances();
 var N = D.length;
 var C = countMinima(D);
 var T = 'unknown';
 if (C==N && N>2){
  T = 'trivial';
 } else if (C==1){
  T = 'rotational';
 } else if (C==2){
  T = 'reflecting';
 } else if (C>2){
  T = 'translational';
 }
 return T;
}

// function to show the movement of vertices /////////////////////////////////////////////////////// fn: showDynamics
function showDynamics(useDistance=null,forceShow=false){
 if (dynamicsShown){
  clearArrows();
  dynamicsShown = false;
  // hide the slider controls:
  document.getElementById("dynamicrangecontainer").classList.add("hiddencontainer");
  if (forceShow) showDynamics(useDistance); // arrows were cleared, now show them again
 } else {
  // if no distance is provided, use the minimum distance moved by any node
  if (useDistance==null){
//   var D = gatherDistances();
//   var useDistance = Math.min(...D);
//or:
//   var useDistance = [0, 10];
//or:
   useDistance = document.getElementById('dynamicrange').noUiSlider.get(true).map(t=>Math.round(t));
  }

  // make useDistance a range (even if it is zero-length (ie. two equal values)):
  var showRange = useDistance;
  if (useDistance.length==1){
   showRange = [useDistance, useDistance];
  }

  // for each node which moved the specified distance, draw an arrow between its starting and finishing locations
  for (var eachnode in autodistance){ // loop through all the node addresses as strings (eg. "2,1,0")
   if (autodistance[eachnode]>=showRange[0] && autodistance[eachnode]<=showRange[1]){
    traceOrbitByLabel(labelNode(stringListToArray(eachnode)),1,true,false);
//want:    styleArrow(A,4,"#fff8","#ffff");
   }
  }
  dynamicsShown = true;
  // unhide the slider controls:
  document.getElementById("dynamicrangecontainer").classList.remove("hiddencontainer")
 }
}

// function to draw a listtolist-parsed list of nodes and their destinations /////////////////////// fn: drawListGraph
function drawListGraph(listFrom,listTo){
 // reuse the global variables 'thenodes' and 'thenewnodes'
 // previously (for local-action-defined automorphisms), 'thenodes' was the list of (already) drawn nodes: now this might not be the case
 // but (for now) leave it up to the user to draw an 'original' graph large enough to cover their 'from' nodes

 // copy the destinations over 'thenewnodes' and calculate the distance they moved
 thenewnodes = [];
 autodistance = [];
 for (var i=0;i<listFrom.length;i++){
  thenewnodes[i] = listTo[i];
  autodistance[listFrom[i].toString()] = nodeDistance(listFrom[i],listTo[i]);
 }

 // set up the dynamic range for the show dynamics control:
 //   set the available dynamic range limits according to the just-drawn graph
 //   (note: always use a min and max limits for the slider of 0 and 1+max(D))
 var D = gatherDistances();
 document.getElementById('dynamicrange').noUiSlider.updateOptions({range:{'min':Math.min(...D,0),'max':Math.max(...D,0)+1},start:[D[0], D[1]]});
 // turn off the dynamics when re-drawing the graph (they are not drawn, just need to reset the 'dynamicsShown' flag
 if (dynamicsShown) showDynamics(); // ie. turn them off if they were on

 // generate the dot code for these nodes and edges
 var listG=mkdot(true);

 // draw it
 drawGraph(listG,true);

 // Note that distances have been calculated, but the indices (eg. 'thenewnodeindex') have not
}


/*
   INITIAL FUNCTIONS TO RUN WHEN THE PAGE LOADS:
*/

thelocalaction = [];  // list of automorphism permutation at each node (local action)
thelocalconstraint = []; // list of constraints imposed by neighbouring local actions
setFrom = true;       // initial clicks on nodes will select the reference node
setTo = false;        // after that the clicks will select the destination node
dynamicsShown = false;

setupColours();
initPickers();
clearAutomorphism();
setPickers();
initialiseLocalActionEditor();
setOutputValues();
testAutomorphism();
