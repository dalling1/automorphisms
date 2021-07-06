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
  document.getElementById("setactionbutton").removeAttribute("disabled");
 } else {
  document.getElementById("setactionbutton").setAttribute("disabled","disabled");
 }
}

function resetLocalActionEditor(){
 // puts chits back to their "home" row, leaving constraints in place
 var allchits = document.getElementsByClassName("chit");
 for (var i=0;i<allchits.length;i++){
  if (!(document.getElementById("chit"+i).classList.contains("constrained"))){
   moveChit("chit"+i,"editoredge"+i);
  }
 }
}

function putLocalAction(perm=[],node=null){
 // default is to not set a local action at all
 for (var i=0;i<perm.length;i++){
  moveChit("chit"+perm[i],"editorfinal"+i);
 }
 // optionally, switch the editor to a particular node (without saving)
 if (node!=null){
  document.getElementById("actionnode").innerHTML = "'"+labelNode(node)+"'"; // show the node in the LA editor
  document.getElementById("actionnode").setAttribute("data-use-node",labelNode(node)); // store the node address
 }
}

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
  console.log("Cannot set the trivial local action due to constraints");
  alert("Cannot set the trivial local action due to constraints");
 }
}

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

function testLocalAction(thislocalaction=null,thisconstraint=null){
 var debug = false;
 var showalert = false;
 if (thislocalaction==null){
  showalert = true; // show a pop-up alert if we are testing the local action in the editor (not one passed in to this function)
  if (debug) console.log("Using editor's local action");
  thislocalaction = getLocalActionFromEditor();
 }

 // we could add code here to get the node being tested (from the editor) and find its constraints using that
 // this would allow us to avoid enabling the "set for node" button by testing constraints when moving chits
 // as well as when clicking the button

 var constraintokay = true;
 // first, test the constraint, if any
 if (thisconstraint!=null && thisconstraint!=undefined){
  constraintokay = (thislocalaction[thisconstraint[0]] == thisconstraint[1])
 } else {
  if (debug) console.log("Constraint is missing or undefined");
 }

 // note that if the constraint is not given then the only test of the local action is whether it is a valid permutation
 if (constraintokay){
  if (testPermutation(thislocalaction)){
   // if there are any "null" entries in the local action, it is not valid (ie. not finished)
   return (thislocalaction.indexOf(null)==-1);
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
 // set the constraint if required
 if (el!=null){ // a constraint has been passed, set it up for the node
  if (el<valency && val<valency){ // sanity check
   thelocalconstraint[node.toString()] = [el,val];
  } else {
   console.log("ERROR: an out-of-range value was passed to the local action constraint");
  }
 }
}

// when clicked, show the node label and action in the local action editor ///////////////////////// fn: loadNodeAction
function loadNodeAction(thisnode=null){
 if (autoFrom!=null){
  if (thisnode==null){
   thisnode = autoFrom;
  }
  var nodestr = thisnode.toString();

  // remove "constrained" class from the editor elements
  clearEditorConstraints();

  // if the local action is "constant", only load and edit the local action of the reference node
  if (constantActionEnabled() && nodestr!=autoFrom.toString()){
   loadNodeAction(autoFrom);
  } else {
   // test whether the requested node is allowed to have its local action edited (it will have an array or empty placeholder)
   if (thelocalaction[nodestr]!=undefined){
    // okay to edit, so set up the editor for this node
    resetLocalActionEditor(); // also sets the chits according to any constraint that exists for this node
    putLocalAction(thelocalaction[nodestr],thisnode);

    // if there is a constraint in place for the node being edited, apply it:
    if (thelocalconstraint[nodestr]!=undefined){
     moveChit("chit"+thelocalconstraint[nodestr][1],"editorfinal"+thelocalconstraint[nodestr][0]);

     // and set the "constrained" class on chits so-limited
     var destid = "editorfinal"+thelocalconstraint[nodestr][0]; // eg. "editorfinal3", the destination for chits which should not be changed
     var chitid = "chit"+thelocalconstraint[nodestr][1]; // eg. "chit0"
     document.getElementById(destid).classList.add("constrained");
     document.getElementById(chitid).classList.add("constrained");
    }
   }
  }
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
 if (testLocalAction(thisaction,thelocalconstraint[nodestr])){
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
   enableLocalAction(thisneighbours[i],i,thisaction[i]);
  }
 } else {
  // the local action in the editor failed the test
  console.log("WARNING: proposed local action is not valid and was not saved");
 }

 // decorate the SVG nodes according to their local action status:
 styleActions();

 // run a check (will enable the "Draw transformed" button if the conditions are all set)
 testAutomorphism();
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

// remove the constraint styling from editor components ////////////////////////////////////////////// fn: clearEditorConstraints
function clearEditorConstraints(){
 var allconstrained = document.getElementsByClassName("constrained");
 // the search result object is dynamic, so work backwards from the end when removing classes (the length changes as we go)
 for (var i=allconstrained.length;i>0;i--){
  document.getElementById(allconstrained[i-1].id).classList.remove("constrained");
 }
}

// manage the behaviour of the "constant" local action switch //////////////////////////////////////// fn: manageConstant
function manageConstant(){
 // manage which local action should be shown in the editor
 loadNodeAction();
 styleActions();

 // and if the transformed graph is shown, re-draw it (toggles the display between constant and individual local actions)
 if (document.getElementById("thesvg").classList.contains("autoGraph")){
  run(true);
 }
}
