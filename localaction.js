/*
 Functions relating to the local action editor and its interaction with nodes (saving, loading, etc.)
*/

function initialiseLocalActionEditor(){
 var valency = parseInt(document.getElementById("input_valency").value);

 // create the editor elements
 var theeditor = '';
 for (var i=0;i<colours.length;i++){
  theeditor += ' <div id="editoredge'+i+'" style="background-color:'+colours[i]+';'+(i>=valency?'display:none;':'')+'" class="dest prototype occupied"><span id="chit'+i+'" draggable="true" ondragstart="drag(event)" style="background-color:'+colours[i]+';" class="chit" /></span></div>\n';
 }
 for (var i=0;i<colours.length;i++){
  theeditor += ' <div id="editorfinal'+i+'"class="final dest"'+(i>=valency?' style="display:none;"':'')+'></div>\n';
 }
 document.getElementById("editorwrapper").innerHTML = theeditor;
 document.getElementsByClassName("editorwrapper")[0].style.gridTemplateColumns = "repeat("+valency+",1fr)";

 // set-up the drag behaviour
 var items = document.getElementsByClassName("dest");
 for (var i=0;i<items.length;i++){
  items[i].addEventListener("drop", drop, false);
  items[i].addEventListener("dragover", allowDrop, false);
  items[i].addEventListener("dragenter", handleDragEnter, false);
  items[i].addEventListener("dragleave", handleDragLeave, false);
 }
 // initialise the local action array
 var finalitems = document.getElementsByClassName("final");
 thislocalaction = Array(finalitems.length).fill(null);
}

function allowDrop(ev){
 ev.preventDefault();
}

function drag(ev){
 ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev){
 ev.preventDefault();
 var thechit = ev.dataTransfer.getData("text");
 // check if this chit is constrained: in that case, do not move it
 if (!(document.getElementById(thechit).classList.contains("constrained"))){
  moveChit(thechit,ev.target.id);
 }
 ev.target.classList.remove("over");
}

function occupied(data){
 var c = document.getElementById(data).children;
 return (c.length>0);
}

function handleDragEnter(ev){
 this.classList.add("over");
}

function handleDragLeave(ev){
 this.classList.remove("over");
}

function getItemValency(item){
 // chop off the "item", "editoredge" and "editorfinal" strings from the item id
 var val = item.id.replace("chit","");
 val = val.replace("editoredge","");
 val = val.replace("editorfinal","");
 return val;
}

// test for a suitable target: input is the *id* /////////////////////////////////////////////////// fn: matchDrop
function matchDrop(from,to){
 var dropItem = document.getElementById(from);
 var targetItem = document.getElementById(to);

 if (targetItem.classList.contains("prototype")){
  // only allow the right colour to be dropped onto the "edge" row
  var dropN = getItemValency(dropItem);
  var targetN = getItemValency(targetItem);
  return (dropN == targetN);
 } else {
  if (dropItem!=null){
   // allow chits to be dropped onto visible, empty "final" spots (or "multi" ones, which we are not using at the moment)
   return (targetItem.classList.contains("dest") && (targetItem.classList.contains("multi") || !targetItem.classList.contains("occupied")))
  } else {
   return false;
  }
 }
}

// move a chit: input is the *id* ////////////////////////////////////////////////////////////////// fn: moveChit
function moveChit(from,to){
 var chit = document.getElementById(from);
 var target = document.getElementById(to);
 if (matchDrop(from,to)){
  chit.parentNode.classList.remove("occupied");
  target.appendChild(chit);
  target.classList.add("occupied");
 }

 // run a check (will enable the "Set for node" button if this is a valid (ie. complete) permutation)
 if (testLocalAction()){
  document.getElementById("setactionbutton").removeAttribute("disabled");
 } else {
  document.getElementById("setactionbutton").setAttribute("disabled","disabled");
 }
}

// reset the editor by putting all chits back into the "home" row ////////////////////////////////// fn: resetLocalActionEditor
function resetLocalActionEditor(){
 // puts chits back to their "home" row
 var allchits = document.getElementsByClassName("chit");
 for (var i=0;i<allchits.length;i++){
  moveChit("chit"+i,"editoredge"+i);
 }
}

// put the given local permutation into the local action editor (if constraints are met) /////////// fn: putLocalAction
function putLocalAction(perm=[],node=null){
 var proceed = true;
 // if a node is given, check that its constraints (if any) are met:
 if (node!=null && thelocalconstraint[node.toString()]!=undefined){
  // constraint exists, test it:
  var constrainedChit = thelocalconstraint[node.toString()][1];
  var constrainedDest = thelocalconstraint[node.toString()][0];
  if (perm[constrainedDest]!=constrainedChit){
   proceed = false; // perm does not match the constraint
  }
 }

 // if all is well, move the chit
 if (proceed){
  for (var i=0;i<perm.length;i++){
   var chit = "chit"+perm[i];
   var dest = "editorfinal"+i;
   moveChit(chit,dest);
  }
 }
}

// test whether the given element has the "constrained" CSS class ////////////////////////////////// fn: isConstrained
function isConstrained(el){
 return document.getElementById(el).classList.contains("constrained");
}

// put the "trivial" local action into the editor (if constraints are met) ///////////////////////// fn: setTrivialLocalAction
function setTrivialLocalAction(){
 var proceed = true;
 // if the node being edited has a constraint, do nothing
 var thisnode = labelToNode(document.getElementById("actionnode").getAttribute("data-use-node"));
 var nodestr = thisnode.toString();
 if (thelocalconstraint[nodestr] != undefined){
  if (thelocalconstraint[nodestr][0] == thelocalconstraint[nodestr][1]){
   // okay, constraint allows the trivial LA
   proceed = true; // still
  } else {
   proceed = false;
  }
 }

 if (proceed){
  // create the "trivial" local action permutation and put it into the editor
  var perm = [];
  var valency = parseInt(document.getElementById("input_valency").value);
  for (var i=0;i<valency;i++){
   perm[i] = i;
  }
  putLocalAction(perm);
 } else {
  console.log("Cannot set the trivial local action, due to constraints");
  alert("Cannot set the trivial local action, due to constraints");
 }
}

// extract the permutation currently represented by the chits in the local action editor /////////// fn: getLocalActionFromEditor
function getLocalActionFromEditor(){
 var valency = parseInt(document.getElementById("input_valency").value);
 var allchits = document.getElementsByClassName("chit");
 var perm = Array(valency).fill(null);
 for (var i=0;i<valency;i++){
  var place = document.getElementById("chit"+i).parentNode;
  // is this chit in a "final" position?
  if (place.id.includes("editorfinal")){
   var x = getItemValency(place);
   var y = i;
   perm[x] = y;
//alt:   perm[getItemValency(place)] = parseInt(i);
  }
 }
 return perm;
}

// show and hide columns of the local action editor according to the desired valency /////////////// fn: showEditor
function showEditor(valency){
 // turn on and off the appropriate local action editor chits and final positions:
 for (var i=0;i<valency;i++){ // on
  document.getElementById("chit"+i).style.display = "";
  document.getElementById("editoredge"+i).style.display = "";
  document.getElementById("editorfinal"+i).style.display = "";
 }
 var perm = getLocalActionFromEditor();
 for (var j=i;j<colours.length;j++){ // off
  document.getElementById("chit"+j).style.display = "none";
  document.getElementById("editoredge"+j).style.display = "none";
  document.getElementById("editorfinal"+j).style.display = "none";
  // put hidden chits back "home"
  moveChit("chit"+j,"editoredge"+j);
  if (perm[j]!=null){ // is there a chit in this "final" position?
   moveChit("chit"+perm[j],"editoredge"+perm[j]); // send it home
  }
 }
 document.getElementsByClassName("editorwrapper")[0].style.gridTemplateColumns = "repeat("+valency+",1fr)";
}

// test a given permutation against a given constraint ///////////////////////////////////////////// fn: testLocalAction
function testLocalAction(perm=null,thisconstraint=null){
 var debug = false;
 var showalert = false;
 if (perm==null){
  showalert = true; // show a pop-up alert if we are testing the local action in the editor (not one passed in to this function)
  if (debug) console.log("Using editor's local action");
  perm = getLocalActionFromEditor();
 }

 // we could add code here to get the node being tested (from the editor) and find its constraints using that
 // this would allow us to avoid enabling the "set for node" button by testing constraints when moving chits
 // as well as when clicking the button

 var constraintokay = true;
 // first, test the constraint, if any
 if (thisconstraint!=null && thisconstraint!=undefined){
  constraintokay = (perm[thisconstraint[0]] == thisconstraint[1])
 } else {
  if (debug) console.log("Constraint is missing or undefined");
 }

 // note that if the constraint is not given then the only test of the local action is whether it is a valid permutation
 if (constraintokay){
  if (testPermutation(perm)){
   // if there are any "null" entries in the local action, it is not valid (ie. not finished)
   return (perm.indexOf(null)==-1);
  } else {
   // permutation failed (wrong number of entries, out-of-range entries, etc.)
   return false;
  }
 } else {
  if (showalert){
   console.log("WARNING: proposed local action failed constraint");
   alert("The proposed local action does not meet the required constraint");
  }
  return false;
 }
}

// mark a node as having a local action and prep its neighbours //////////////////////////////////// fn: enableLocalAction
function enableLocalAction(node,constraintElement=null,constraintValue=null){
 var debug = false;
 var setconstraint = false;

 var nodestr = node.toString();
 var thislabel = labelNode(node); // eg. 'rbr'
 var thisID = findSVGNode(thislabel); // eg. node18

 var status = examineLocalActions([node]); // input must be an array of arrays, hence the [...]
 if (debug) console.log("Node \""+thislabel+"\" status: "+status);

 switch (status){
  case "constant":
   // the reference node's local action will be used everywhere, but initialise this node's local action in case that changes
   thelocalaction[nodestr] = [];
  break;
  case "unenabled":
   // enable it!
   thelocalaction[nodestr] = [];
   break;
  case "empty":
   // already enabled, nothing to do
  break;
  case "valid":
   // already enabled and already set, check the constraint
  break;
  case "invalid":
   // already enabled, nothing to do
  break;
  default:
   // the only other option is "error":
   console.log("ERROR: local action status not examined");
 }

 // now add or update the constraint (if any) and take appropriate action:
 // - if the constraint has changed, recurse [put this in the addConstraint() function]
 updateConstraint(node,constraintElement,constraintValue);
}

// set or update the local action constraint on a node ///////////////////////////////////////////// fn: updateConstraint
function updateConstraint(node,el=null,val=null){
 var valency = parseInt(document.getElementById("input_valency").value);
 var constraintChanged = false;
 var debug = false;
 // set the constraint if required
 if (el!=null){ // a constraint has been passed, set it up for the node
  if (el<valency && val<valency){ // sanity check
   if (thelocalconstraint[node.toString()]!=undefined){
    if (thelocalconstraint[node.toString()][0]!=el || thelocalconstraint[node.toString()][1]!=val){
     // the constraint changed, so we need to propagate this to "downstream" nodes
     if (debug) console.log("CONSTRAINT CHANGED FOR NODE "+labelNode(node));
     constraintChanged = true;
    }
   }
   thelocalconstraint[node.toString()] = [el,val];
  } else {
   console.log("ERROR: an out-of-range value was passed to the local action constraint");
  }
 }
 if (constraintChanged){
  // 1. this node's local action (if any) is now invalid and should be cleared
  // 2. any downstream nodes' local actions should be cleared
  pruneLocalAction(node); // this will propagate outwards from the reference node
 }
}

// remove local actions and constraints outwards from the given node (away from reference node) //// fn: pruneLocalAction
function pruneLocalAction(node=null){
 var debug = false;
 if (node!=null){
  var thisneighbours=findNeighbours(node);
  for (var i=0;i<thisneighbours.length;i++){
   var neigh = thisneighbours[i];
   if (thenodeindex[neigh]!=undefined){ // the node exists in the drawn extent of the graph
    if (nodeDistance(neigh,autoFrom)>nodeDistance(node,autoFrom)){ // only act on "downstream" nodes
     if (debug) console.log("downstream exists "+labelNode(neigh));
     delete thelocalaction[neigh];
     delete thelocalconstraint[neigh];
     pruneLocalAction(neigh);
    }
   }
  }
 }
}

// when clicked, show the node label and action in the local action editor ///////////////////////// fn: loadNodeAction
function loadNodeAction(thisnode=null){
 // force editing of the autoFrom node if no argument is passed, or the "constant" switch is turned on:
 if (autoFrom!=null){
  if (thisnode==null || constantActionEnabled()){
   thisnode = autoFrom;
  }
 }
 var nodestr = thisnode.toString();
 var proceedOn = ["constant","empty","valid","invalid"];
 var nodestatus = examineLocalActions([thisnode]); // input must be an array of arrays, hence the [...]

 // test whether the requested node is allowed to have its local action edited:
 if (proceedOn.indexOf(nodestatus)>-1){
  // clear the editor: put chits back "home" and remove "constrained" class
  resetLocalActionEditor(); // clear the editor

  // set the editor's label to this node
  setEditorLabel(thisnode);

  // put constraints in place
  constrainEditor(thelocalconstraint[thisnode]);

  // put this node's local action into the editor (will fail if constraints are not met)
  var result = putLocalAction(thelocalaction[nodestr],thisnode);

 } else {
  // do not proceed:
  // for example, this node is not allowed to have a local action yet
 }
}

// set the name of the node currently being edited in the local action editor ////////////////////// fn: setEditorLabel
function setEditorLabel(node=null){
 if (node!=null){
  var nodelabel = labelNode(node);
 }
 if (nodelabel.length>0){
  document.getElementById("actionnode").innerHTML = "'"+nodelabel+"'"; // show the node in the LA editor
  document.getElementById("actionnode").setAttribute("data-use-node",nodelabel); // store the node address
 }
}

// apply the given constraint to the editor (apply styles and move chits) ////////////////////////// fn: constrainEditor
function constrainEditor(constraint=null){
 clearEditorConstraints();
 // if constraint not given, work it out from the editor's node label (data-use-node)
 if (constraint==null){
  var editornode = labelToNode(document.getElementById("actionnode").getAttribute("data-use-node"));
  constraint = thelocalconstraint[editornode.toString()];
 }

 if (constraint != undefined && constraint != null){
  var dest = constraint[0];
  var chit = constraint[1];
  moveChit("chit"+chit,"editorfinal"+dest);

  // and set the "constrained" class on chits so-limited
  document.getElementById("editorfinal"+dest).classList.add("constrained"); // eg. "editorfinal3", the destination for chits which should not be changed
  document.getElementById("chit"+chit).classList.add("constrained"); // eg. "chit0"
 }
}

// function to put the local action (from the editor) into the nodes' local action array /////////// fn: saveLocalAction
function saveLocalAction(thisnode=null,thisaction=null){
 var valency = parseInt(document.getElementById("input_valency").value);
 var debug = false;

 if (thisnode==null){
  // fetch the node we are saving the local action for (as an address, eg. [1,0,1,1]) from the editor:
  var thisnode = labelToNode(document.getElementById("actionnode").getAttribute("data-use-node"));
 }
 if (thisaction==null){
  // get the permutation from the editor
  thisaction = getLocalActionFromEditor();
 }

 var nodestr = thisnode.toString();

 if (debug) console.log("Saving action "+thisaction.toString()+" for node "+thisnode.toString());

 // test the constraint (for completeness, validity and against any constraints)
 if (thisaction.length==0 || testLocalAction(thisaction,thelocalconstraint[nodestr])){
  if (debug) console.log("Saving local action for node "+labelNode(thisnode));
  thelocalaction[nodestr] = thisaction;

  // change the SVG node's style
  var thenodeid = findSVGNode(labelNode(thisnode));
  if (thenodeid!=null){ // check that it exists
   document.getElementById(thenodeid).classList.remove("canhavelocalaction");
   document.getElementById(thenodeid).classList.add("haslocalaction");
  }

  // enable local action editing for the node's neighbours
  var thisneighbours = findNeighbours(thisnode);
  for (var i=0;i<thisneighbours.length;i++){
   if (debug) console.log("Enabling local action for neighbour: "+labelNode(thisneighbours[i]));
   // findNeighbours returns a list in thelabels (alphabet) order (although really we should test this)
   // thus, the ith neighbour is constrained by the ith element of the local action:
   if (nodeDistance(thisneighbours[i],autoFrom)>nodeDistance(thisnode,autoFrom)){ // only act on "downstream" nodes
    enableLocalAction(thisneighbours[i],i,thisaction[i]);
   }
  }
 } else {
  // not empty, it really failed
  console.log("WARNING: proposed local action is not valid and was not saved");
 }

 // decorate the SVG nodes according to their local action status:
 styleActions();

 // run a check (will enable the "Draw transformed" button if the conditions are all set; if it fails, it won't be enabled)
 testAutomorphism();

 // put the whole set of local actions into the editor -- removed, this is now called when the editor is displayed
// actionToEditor();
}

// cyclically permute a given list (by a specified "distance") ///////////////////////////////////// fn: permutationCyclic
function permutationCyclic(list,dist=0){
 var out = Array(list.length); // initialise
 while (dist>list.length) dist-=list.length; // avoid winding
 while (dist<0) dist+=list.length; // avoid winding
 for (var i=0;i<(list.length-dist);i++) out[i]=list[i+dist]; // 0 ... dist
 for (var i=list.length-dist;i<list.length;i++) out[i]=list[i+dist-list.length]; // dist+1 ... end
 return out;
}

// randomly permute a given list /////////////////////////////////////////////////////////////////// fn: permutationRandom
function permutationRandom(list,fixlist=[]){
 // elements of 'list' whose indices are given in 'fixlist' are not moved

 if (typeof(fixlist=="number")) fixlist = [fixlist]; // in case just an index is given, not as an array

 var inlist = Array(list.length); // initialise
 var outlist = Array(list.length); // initialise
 for (var i=0;i<list.length;i++) inlist[i] = list[i]; // make a copy which will be chopped up to make the output
 for (var i=0;i<outlist.length;i++) outlist[i] = inlist.splice(randomInt(inlist.length),1)[0]; // extract the elements in random order
 // put fixed entries back where they belong (swap them with the random values found in their place)
 for (var i=0;i<fixlist.length;i++){
  var fixvalue = list[fixlist[i]]; // what is the value?
  var indx = outlist.indexOf(fixvalue); // where is it now?
  var swapvalue = outlist[fixlist[i]]; // what is in its place?
  outlist[fixlist[i]] = fixvalue; // put it where it belongs
  outlist[indx] = swapvalue; // but swap with the value in that place
 }
 return outlist;
}

// test a permutation vector for legality ////////////////////////////////////////////////////////// fn: testPermuation
function testPermutation(perm=null,valency=null){
 if (valency==null) valency = parseInt(document.getElementById("input_valency").value);
 var debug = false;

 if (perm!=null){
  // test for a valid permutation
  if (perm.length==valency){ // right size?
   for (var p=0;p<perm.length;p++){
    if (perm[p]<0 || perm[p] >= valency){   // look for out-of-range entries
     if (debug) console.log("ERROR: invalid permutation (out-of-range entries)");
     return false;
    }
    if (perm.indexOf(perm[p])!=p){   // look for repeated entries
     if (debug) console.log("ERROR: invalid permutation (repeated entries)");
     return false;
    }
   }
  } else {
   if (debug) console.log("WARNING: permutation length ("+perm.length+") is not equal to the valency ("+valency+") in "+perm.toString());
   return false;
  }
 } else {
  return false; // perm was null
 }
 return true;
}

// permute a given list using the provided permutation ///////////////////////////////////////////// fn: permute
function permuteList(list,perm){
 // takes a list of a node's neighbours (ie. list length = valency) and permutes them

 if (testPermutation(perm)){
  // legal permutation, so perform the operation
  var out = Array(list.length);
  for (var i=0;i<list.length;i++){
  // permute elements: local action (ie swap the elements of the list around with each other)
   out[perm[i]] = list[i];
//   out[i] = list[perm[i]]; // reverse of standard notation
  }
  return out;
 } else {
  return undefined;
 }
}


// examine status of each node ///////////////////////////////////////////////////////////////////// fn: examineLocalActions
function examineLocalActions(nodelist=[],ignoreConstant=false){
 var debug = false;

 if (nodelist.length==0){ // use all nodes if a list is not provided
  for (var i=0;i<thenodes.length;i++) nodelist.push(thenodes[i]);
 }
 if (debug) console.log(String(nodelist.length)+" node(s) presented for examination:");

 // loop over the nodelist and test the local action status for each one:
 for (var i=0;i<nodelist.length;i++){
  if (debug) console.log("   examining node "+nodelist[i]+" (label \""+labelNode(nodelist[i])+"\")");
  var nodestr = nodelist[i].toString();

  // LA can be: constant, not enabled (undefined), empty, incomplete, invalid, complete
  var la = thelocalaction[nodestr];
  var con = thelocalconstraint[nodestr];
  var localactionStatus = "error"; // initialise the message

  if (constantActionEnabled() && !ignoreConstant){
   localactionStatus = "constant"; // the "constant" switch is on
   // BUT, if the switch is on AND this is the reference node, test it separately:
   if (autoFrom!=null){
    if (nodestr==autoFrom.toString()){
     localactionStatus = examineLocalActions([autoFrom],true);
    }
   } else {
    // autoFrom is not set (and so no local actions should be saved yet)
    examineLocalActions([thenodes[i]],true);
   }
  } else {
   if (la==undefined){
    localactionStatus = "unenabled"; // can't have a local action set
   } else {
    if (la.length==0){
     localactionStatus = "empty"; // exists but awaiting editing
    } else {
     if (testLocalAction(la,con)){
      localactionStatus = "valid"; // exists and valid
     } else {
      localactionStatus = "invalid"; // exists and invalid (including incomplete)
     }
    }
   }
  }

  if (debug) console.log(" Node "+labelNode(nodelist[i])+" local action status: "+localactionStatus);
 }

 // if a single node was examined, return its local action status:
 if (nodelist.length==1){
  return localactionStatus;
 }
}

// test whether the "constant local action" switch is turned on or not ///////////////////////////// fn: constantActionEnabled
function constantActionEnabled(){
 return document.getElementById("input_constantauto").checked;
}

// add borders to nodes according to their local action status ///////////////////////////////////// fn: styleActions
function styleActions(){
 if (thenodes!=undefined && autoFrom!=null){
  for (var i=0;i<thenodes.length;i++){
   var thislabel = labelNode(thenodes[i]); // eg. 'rbr'
   var thisID = findSVGNode(thislabel); // eg. node18
   if (thisID!=null){ // the SVG node exists
    var status = examineLocalActions([thenodes[i]]); // input must be an array of arrays, hence the [...]
    // remove styles:
    document.getElementById(thisID).classList.remove("canhavelocalaction");
    document.getElementById(thisID).classList.remove("haslocalaction");
    document.getElementById(thisID).classList.remove("disablelocalaction");

    // add styles:
    switch (status){
     case "constant":
      // using constant local action, need to test whether it is set or not:
      if (examineLocalActions([autoFrom])=="valid"){
       // set, so apply the "has" style:
       document.getElementById(thisID).classList.add("haslocalaction");
      } else {
       // not (validly) set, so apply the "canhave" style:
       document.getElementById(thisID).classList.add("canhavelocalaction");
      }
     break;
     case "empty":
     case "invalid":
      document.getElementById(thisID).classList.add("canhavelocalaction");
     break;
     case "unenabled":
      // not set, not using constant local action or not enabled and so nothing to do (but only if we are NOT setting the from/to nodes)
      if (autoFrom!=null && autoTo!=null) document.getElementById(thisID).classList.add("disablelocalaction");
     break;
     case "valid":
      document.getElementById(thisID).classList.add("haslocalaction");
     break;
     default:
      // the only other option is "error":
      console.log("ERROR: local action status not examined");
    }
   }
  }
 }
}

// remove the constraint styling from editor components //////////////////////////////////////////// fn: clearEditorConstraints
function clearEditorConstraints(){
 var allconstrained = document.getElementsByClassName("constrained");
 // the search result object is dynamic, so work backwards from the end when removing classes (the length changes as we go)
 for (var i=allconstrained.length;i>0;i--){
  document.getElementById(allconstrained[i-1].id).classList.remove("constrained");
 }
}

// manage the behaviour of the "constant" local action switch ////////////////////////////////////// fn: manageConstant
function manageConstant(){
 // manage which local action should be shown in the editor
 loadNodeAction();
 styleActions();

 // and if the transformed graph is shown, re-draw it (toggles the display between constant and individual local actions)
 if (document.getElementById("thesvg").classList.contains("autoGraph")){
  run(true);
 }

 // update the local action editor
 actionToEditor();
}

// add random local actions (subject to constraints) for all drawn vertices //////////////////////// fn: setRandomLocalActions()
function setRandomLocalActions(){
 /*
  Work outward from the reference node, checking constraints and adding random local actions as we go,
  much like the way that constraints in the text editor are tested.
 */
 var debug = false;
 if (autoFrom!=null && autoTo!=null){ // reference and destination vertices must be defined

 // calculate the distances of each node from the reference node, and put them into the output in ascending distance order:
 // ie. starting with the reference node and working outwards (so that the required constraints are present for parsing in the text editor)
 var nodeDistances = thenodes.map(t=>nodeDistance(autoFrom,t));
 var maxDistance = Math.max(...nodeDistances);
 var valency = parseInt(document.getElementById("input_valency").value);
 var initialperm = [];
 for (var i=0;i<valency;i++) initialperm[i] = i; // make a list which we can (randomly) permute

 // 0. see if there is a local action at the reference node, and generate a random one if there isn't:
 if (thelocalaction[autoFrom.toString()].length==0){
  var newlocalaction = permutationRandom(initialperm);
  if (debug) console.log("RLA: New local action at reference vertex "+labelNode(autoFrom)+": ["+newlocalaction.toString()+"]");
  saveLocalAction(autoFrom,newlocalaction);
 }

 for (var d=0;d<=maxDistance;d++){
  // get nodes at distance d from the reference node:
  var thisball = thenodes.filter(t=>nodeDistance(autoFrom,t)==d);
  // loop through the nodes at distance d from reference node
  for (var t=0;t<thisball.length;t++){
   var thisnode = thisball[t]; // array, not string
   var thisnodeaddress = thisball[t].toString();
   var existencecheck = false;
   try{
    if (thelocalaction[thisnodeaddress].length>0){
     if (debug) console.log("RLA: LA exists at "+labelNode(thisnode));
     existencecheck=true;
    } else {
     if (debug) console.log("RLA: placeholder LA at "+labelNode(thisnode));
    }
   }
   catch(error){
    existencecheck=false;
   }
   if (existencecheck){ // returns true if the entry exists AND has length > 0
    // this node has a local action already, nothing to do
    if (debug) console.log("RLA: Random local actions: skipping node "+labelNode(thisnode)+" (local action already exists)");
   } else {
    // this node either has a placeholder or no local action, so get its constraint and then generate a complying local action
    var neighbourLocalAction = getLocalAction(getNeighbour(thisnode));
    if (debug) console.log("RLA: neighbouring local action is ["+neighbourLocalAction.toString()+"]");
    var thisconstraint = getLocalActionConstraint(thisnode);
    var thisedge = thisconstraint[0];
    if (debug) console.log("RLA: Constraint at "+labelNode(thisnode)+": ["+thisconstraint.toString()+"]");

    // 3. generate a complying random permutation
    var newlocalaction = permutationRandom(neighbourLocalAction,[thisedge]); // fix the value in position 'thisedge'
    // 4. store it in thelocalaction
    if (testPermutation(newlocalaction,valency)){ // make sure it is okay
     if (debug) console.log("RLA: New local action at "+labelNode(thisnode)+": ["+newlocalaction.toString()+"]");
     console.log("Random local action at "+labelNode(thisnode)+": ["+newlocalaction.toString()+"]");
     saveLocalAction(thisnode,newlocalaction);
    } else {
     if (debug) console.log("RLA: Error: an invalid permutation was generated");
    }
   }
  }
 }

 // all done, set the display
 decorateNodes();
 }
}

// get the neighbour of a node towards the reference vertex //////////////////////////////////////// fn: getNeighbour()
// returns null if the reference vertex is not set or the reference vertex is given as the argument
function getNeighbour(node){
 if (autoFrom!=null){
  // find the neighbour in the direction of the reference vertex:
  var pathToRef = getPath(node,autoFrom);

  if (pathToRef.length<2){
   // this IS the reference node
   return null;
  } else {
   var neighbour = pathToRef[1];
   return neighbour;
  }
 } else {
  return null;
 }
}

// get the local action of a node ////////////////////////////////////////////////////////////////// fn: getLocalAction()
// returns null if the local action is not set (undefined or has an empty placeholder local action)
function getLocalAction(node){
 if (node!=null && Object.keys(thelocalaction).indexOf(node.toString())!=-1 && thelocalaction[node.toString()].length>0){
  return thelocalaction[node.toString()];
  } else {
  return null;
 }
}

// get the local action constraint at a given node from its neighbour ////////////////////////////// fn: getLocalActionConstraint()
function getLocalActionConstraint(node){
 var neighbour = getNeighbour(node);
 var neighbourlocalaction = getLocalAction(neighbour);
 if (neighbourlocalaction!=null){
  // which element of the local action is the constraint?
  // the one associated with the edge joining these nodes:
  var edge = (node.length>neighbour.length ? node.slice(-1)[0] : neighbour.slice(-1)[0] ); // take [0] since slice returns an array
  var constraint = [edge, neighbourlocalaction[edge]];
//  console.log("getLA: Nodes "+labelNode(node)+" and "+labelNode(neighbour)+" are connected by the "+labelNode([edge])+" edge (ie. "+edge.toString()+")");
  return constraint;
 } else {
  return null;
 }
}
