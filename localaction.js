/*
 Functions relating to the local action editor and its interaction with nodes (saving, loading, etc.)
*/

function initDrag(){
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

// test for a suitable target: input is the *id*
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

// move a chit: input is the *id*
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
  document.getElementById("actionbutton").removeAttribute("disabled");
 } else {
  document.getElementById("actionbutton").setAttribute("disabled","disabled");
 }

 // run a check (will enable the "Draw transformed" button if the conditions are all set)
 // Note: on load this will be triggered (and fail) multiple times, as the chits are put into place for the first time)
 testAutomorphism();
}

function resetLocalAction(){
 var allchits = document.getElementsByClassName("chit");
 for (var i=0;i<allchits.length;i++){
  moveChit("chit"+i,"editoredge"+i);
  document.getElementById("editorfinal"+i).classList.remove("occupied");
  document.getElementById("editorfinal"+i).classList.remove("over");
  document.getElementById("editoredge"+i).classList.add("occupied");
 }
}

function setLocalAction(perm=[]){
 resetLocalAction();
 // default is to not set a local action at all
 for (var i=0;i<perm.length;i++){
  moveChit("chit"+perm[i],"editorfinal"+i);
 }
}

function setTrivialLocalAction(){
 // create the "trivial" local action permutation and put it into the editor
 var perm = [];
 var valency = parseInt(document.getElementById("input_valency").value);
 for (var i=0;i<valency;i++){
  perm[i] = i;
 }
 setLocalAction(perm);
}

function getLocalAction(){
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

function showEditor(valency){
 // turn on and off the appropriate local action editor chits and final positions:
 for (var i=0;i<valency;i++){ // on
  document.getElementById("chit"+i).style.display = "";
  document.getElementById("editoredge"+i).style.display = "";
  document.getElementById("editorfinal"+i).style.display = "";
 }
 var perm = getLocalAction();
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

function testLocalAction(thislocalaction=null,thisconstraint=null){
 var debug = false;
 if (thislocalaction==null){
  if (debug) console.log("Using editor's local action");
  thislocalaction = getLocalAction();
 }

 // we could add code here to get the node being tested (from the editor) and find its constraints using that
 // this would allow us to avoid enabling the "set for node" button by testing constraints when moving chits
 // as well as when clicking the button

 var constraintokay = true;
 // first, test the constraint, if any
 if (thisconstraint!=null && thisconstraint!=undefined){
  constraintokay = (thislocalaction[thisconstraint[0]] == thisconstraint[1])
 }

 if (constraintokay){
  if (testPermutation(thislocalaction)){
   // if there are any "null" entries in the local action, it is not valid (ie. not finished)
   return (thislocalaction.indexOf(null)==-1);
  } else {
   // permutation failed (wrong number of entries, out-of-range entries, etc.)
   return false;
  }
 } else {
  alert("The proposed local action does not meet the required constraint");
  console.log("WARNING: proposed local action failed constraint");
 }
}

// mark a node as having a local action and prep its neighbours //////////////////////////////////// fn: enableLocalAction
function enableLocalAction(node,constraintElement=null,constraintValue=null){
 var valency = parseInt(document.getElementById("input_valency").value);
 var debug = false;
 var setconstraint = false;

 if (node!=null){ // eg. [0,1,0]
  var thislabel = labelNode(node); // eg. 'rbr'
  var thisID = findSVGNode(thislabel); // eg. node18
  if (thisID != null){ // test that the SVG object actually exists (the node might be outside the drawn graph)
   if (document.getElementById(thisID).classList.contains("haslocalaction")){
    // nothing to do
    if (debug) console.log("Local action already set on node ID: "+thisID);
   } else if (document.getElementById(thisID).classList.contains("canhavelocalaction")){
    if (debug) console.log("Local action already enabled on node ID: "+thisID);
    // update the local action constraint
    var setconstraint = true;
   } else {
    if (debug) console.log("Enabling local action on node ID: "+thisID);
    document.getElementById(thisID).classList.add("canhavelocalaction");
    thelocalaction[node.toString()] = []; // initialise the local action permutation for this node
    // set the local action constraint
    var setconstraint = true;
   } // end if...

   // set the constraint if required
   if (setconstraint){
    if (constraintElement!=null){ // a constraint has been passed, set it up for the node
     if (constraintElement<valency && constraintValue<valency){ // sanity check
      thelocalconstraint[node.toString()] = [constraintElement,constraintValue];
     } else {
      console.log("ERROR: an out-of-range value was passed to the local action constraint");
     }
    }
   }

  }
 } // end not null
}

// when clicked, show the node label and action in the local action editor ///////////////////////// fn: loadNodeAction
function loadNodeAction(thisnode){
 var nodestr = thisnode.toString();

 // remove "constrained" class from the editor elements
 var allconstrained = document.getElementsByClassName("constrained");
 for (var i=0;i<allconstrained.length;i++){
  document.getElementById(allconstrained[i].id).classList.remove("constrained");
 }
 console.log("Warning: not all elements are having the class removed...");

 // test whether the requested node is allowed to have its local action edited (it will have an array or empty placeholder)
 tmpaction = thelocalaction[nodestr];

 if (tmpaction!=undefined){
  // okay to edit, enforce any constraint which exists
  if (thelocalconstraint[nodestr]!=undefined){
   tmpaction[thelocalconstraint[nodestr][0]] = thelocalconstraint[nodestr][1];
  }

  // okay to edit, so set up the editor for this node
  document.getElementById("actionnode").innerHTML = "'"+labelNode(thisnode)+"'"; // show the node in the LA editor
  document.getElementById("actionnode").setAttribute("data-use-node",labelNode(thisnode)); // store the node address
  setLocalAction(tmpaction);

  // and, finally, set the "constrained" class on chits so-limited
  if (thelocalconstraint[nodestr]!=undefined){
   tmpaction[thelocalconstraint[nodestr][0]] = thelocalconstraint[nodestr][1];

   var destid = "editorfinal"+thelocalconstraint[nodestr][0]; // eg. "editorfinal3", the destination for chits which should not be changed
   document.getElementById(destid).classList.add("constrained");

   var chitid = "chit"+thelocalconstraint[nodestr][1]; // eg. "chit0"
   document.getElementById(chitid).classList.add("constrained");
  }
 }
}

// function to put the local action (from the editor) into the nodes' local action array /////////// fn: saveLocalAction
function saveLocalAction(){
 var valency = parseInt(document.getElementById("input_valency").value);
 var debug = false;

 // find out which node we are saving the local action for (as an address, eg. [1,0,1,1])
 var thisnode = labelToNode(document.getElementById("actionnode").getAttribute("data-use-node"));
 var nodestr = thisnode.toString();

 // get the permutation from the editor
 savelocalaction = getLocalAction();

 // test the constraint (for completeness, validity and against any constraints)
 if (testLocalAction(savelocalaction,thelocalconstraint[nodestr])){
  if (debug) console.log("Saving local action for node "+labelNode(thisnode));
  thelocalaction[nodestr] = savelocalaction;

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
   enableLocalAction(thisneighbours[i],i,savelocalaction[i]); // zzz
  }
 } else {
  // the local action in the editor failed the test
  console.log("WARNING: proposed local action is not valid and was not saved");
 }
}

/*
 Permutation-related functions
*/
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
function permutationRandom(list){
 var inlist = Array(list.length); // initialise
 var out = Array(list.length); // initialise
 for (var i=0;i<list.length;i++) inlist[i] = list[i]; // make a copy
 for (var i=0;i<list.length;i++) out[i] = inlist.splice(randomInt(inlist.length),1); // extract the elements in random order
 return out;
}

// test a permutation vector for legality ////////////////////////////////////////////////////////// fn: testPermuation
function testPermutation(perm){
 var valency = parseInt(document.getElementById("input_valency").value);
 var debug = false;

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

