
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

 // run a check (will enable the "automorph" button if the conditions are all set)
 testAutomorphism();
// if (testLocalAction() && autoFrom!=null && autoTo!=null){
//  document.getElementById("autobutton").removeAttribute("disabled");
// } else {
//  document.getElementById("autobutton").setAttribute("disabled","disabled");
// }

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
 for (var i=0;i<perm.length;i++){
  moveChit("chit"+perm[i],"editorfinal"+i);
 }
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
   if (x>=valency || y>=valency) console.log("Out-of-range chit has been moved"); // this can happen when hiding some of the boxes, and is okay
   perm[x] = y;
//alt:   perm[getItemValency(place)] = parseInt(i);
  }
 }
 return perm;
}

function showEditor(valency){
 // turn on and off the appropriate local action editor chits and final positions:
 document.getElementsByClassName("editorwrapper")[0].style.gridTemplateColumns = "repeat("+valency+",1fr)";
 for (var i=0;i<valency;i++){ // on
  document.getElementById("chit"+i).style.display = "";
  document.getElementById("editoredge"+i).style.display = "";
  document.getElementById("editorfinal"+i).style.display = "";
 }
 var perm = getLocalAction();
 for (var j=i;j<colours.length;j++){ // off
  document.getElementById("chit"+j).style.display = "none";
  document.getElementById("editoredge"+i).style.display = "none";
  document.getElementById("editorfinal"+i).style.display = "none";
  // put hidden chits back "home"
  moveChit("chit"+j,"editoredge"+i);
  if (perm[j]!=null){ // is there a chit in this "final" position?
   moveChit("chit"+perm[j],"editoredge"+perm[j]); // send it home
  }
 }
}

function testLocalAction(){
 // if there are any "null" entries in the local action, it is not valid (ie. not finished)
 return (getLocalAction().indexOf(null)==-1);
}
