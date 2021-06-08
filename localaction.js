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
 moveChit(thechit,ev.target.id);
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

function testLocalAction(thislocalaction=null){
 if (thislocalaction==null) thislocalaction = getLocalAction();
 // if there are any "null" entries in the local action, it is not valid (ie. not finished)
 return (thislocalaction.indexOf(null)==-1);
}

// mark a node as having a local action and prep its neighbours //////////////////////////////////// fn: enableLocalAction
function enableLocalAction(node){
 var valency = parseInt(document.getElementById("input_valency").value);
 var debug = false;

 if (node!=null){ // eg. [0,1,0]
  var thislabel = labelNode(node); // eg. 'rbr'
  var thisID = findSVGNode(thislabel); // eg. node18
  if (thisID != null){ // test that the SVG object actually exists (the node might be outside the drawn graph)
   if (document.getElementById(thisID).classList.contains("haslocalaction")){
    // nothing to do
    if (debug) console.log("Local action already set on node ID: "+thisID);
   } else if (document.getElementById(thisID).classList.contains("canhavelocalaction")){
    // nothing to do
    if (debug) console.log("Local action already enabled on node ID: "+thisID);
   } else {
    if (debug) console.log("Enabling local action on node ID: "+thisID);
    document.getElementById(thisID).classList.add("canhavelocalaction");
    thelocalaction[node.toString()] = []; // initialise the local action permutation for this node
   } // end if...
  }
 } // end not null
}

// when clicked, show the node label and action in the local action editor ///////////////////////// fn: loadNodeAction
function loadNodeAction(thisnode){
 // test whether the requested node is allowed to have its local action edited
 if (thelocalaction[thisnode.toString()]!=undefined){
  // okay to edit, so set up the editor for this node
  document.getElementById("actionnode").innerHTML = "'"+labelNode(thisnode)+"'"; // show the node in the LA editor
  document.getElementById("actionnode").setAttribute("data-use-node",labelNode(thisnode)); // store the node address
  setLocalAction(thelocalaction[thisnode.toString()]);
// UNDER CONSTRUCTION also need to:
//    - set up the permutation constraints (should that be done elsewhere?)
 }
}

// function to put the local action (from the editor) into the nodes' local action array /////////// fn: saveLocalAction
function saveLocalAction(){
 var valency = parseInt(document.getElementById("input_valency").value);
 var debug = false;

 // find out which node we are saving the local action for (as an address, eg. [1,0,1,1])
 var thenode = labelToNode(document.getElementById("actionnode").getAttribute("data-use-node"));
 if (debug) console.log("Saving local action for node "+labelNode(thenode));

 // get the permutation from the editor and store it
 thelocalaction[thenode.toString()] = getLocalAction();

 // change the SVG node's style
 var thenodeid = findSVGNode(labelNode(thenode));
 if (thenodeid!=null){ // check that it exists
  document.getElementById(thenodeid).classList.remove("canhavelocalaction");
  document.getElementById(thenodeid).classList.add("haslocalaction");
 }

 // enable local action editing for the node's neighbours
 var thisneighbours = findNeighbours(thenode,valency);
 for (var i=0;i<thisneighbours.length;i++){
  if (debug) console.log("Enabling local action for neighbour: "+labelNode(thisneighbours[i]));
  enableLocalAction(thisneighbours[i]);
 }
}
