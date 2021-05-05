
function initDrag(){
 var valency = parseInt(document.getElementById("input_valency").value);

 // create the editor elements
 var theeditor = '';
 for (var i=0;i<colours.length;i++){
  theeditor += ' <div id="editoredge'+i+'" style="background-color:'+colours[i]+';'+(i>=valency?'display:none;':'')+'" class="dest prototype"><span id="chit'+i+'" draggable="true" ondragstart="drag(event)" style="background-color:'+colours[i]+';" class="chit" /></span></div>\n';
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
 var data = ev.dataTransfer.getData("text");
 if (ev.target.nodeName=="DIV" && (ev.target.classList.contains("multi") || !occupied(ev.target.id))){
  // test the proposed target
  var okayToDrop = matchDrop(document.getElementById(data),ev.target);

  if (okayToDrop){
   document.getElementById(data).parentElement.classList.remove("occupied");
   ev.target.appendChild(document.getElementById(data));
   ev.target.classList.remove("over");
   ev.target.classList.add("occupied");
   // update the local action aarray
   if (ev.target.classList.contains("final")){
    // placed a "editorfinal" chit:
    thislocalaction[getItemValency(ev.target)] = parseInt(getItemValency(document.getElementById(data)));
   } else {
    // put a chit back in its "prototype" position:
    thislocalaction[thislocalaction.indexOf(parseInt(getItemValency(document.getElementById(data))))] = null;
   }
  } else {
   ev.target.classList.remove("over");
  }
// } else {
//  console.log(ev.target.id+"... "+(ev.target.nodeName=="DIV"?"occupied":""));
 }
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

function matchDrop(dropItem,targetItem){
 if (targetItem.classList.contains("prototype")){
  var dropN = getItemValency(dropItem);
  var targetN = getItemValency(targetItem);
  return (dropN == targetN);
 } else {
  return true;
 }
}

// move a chit: input is the *id*
function moveChit(from,to){
 var chit = document.getElementById(from);
 var target = document.getElementById(to);
 if (matchDrop(chit,target)){
  chit.parentNode.classList.remove("occupied");
  target.appendChild(chit);
  target.classList.add("occupied");
 }
}

function resetLocalAction(){
 var allchits = document.getElementsByClassName("chit");
 for (var i=0;i<allchits.length;i++){
  moveChit("chit"+i,"editoredge"+i);
 }
}

function setLocalAction(perm=[]){
 resetLocalAction();
 for (var i=0;i<perm.length;i++){
  if (perm[i]!=null){
   var chit = document.getElementById("chit"+perm[i]);
   var target = document.getElementById("editorfinal"+i);
   chit.parentNode.classList.remove("occupied");
   target.appendChild(chit);
   target.classList.add("occupied");
  }
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
   if (x>=valency || y>=valency) console.log("Out-of-range chit has been moved");
   perm[x] = y;
//alt:   perm[getItemValency(place)] = parseInt(i);
  }
 }
 return perm;
}
