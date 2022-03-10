function toggleEditor(){
 // show or hide the text editor
 var btn = document.getElementById('toggleeditorbutton');
 if (btn.innerHTML == 'Show editor'){
  showTextEditor();
 } else {
  hideTextEditor();
 }
}

function showTextEditor(){
 // show the text editor
 var btn = document.getElementById('toggleeditorbutton');
 btn.innerHTML = 'Hide editor';
 actionToEditor();
 document.getElementById('parsingInput').scrollIntoView({inline:'start',behavior:'smooth'});
 document.getElementById('graphControls').scrollIntoView({inline:'start',behavior:'smooth'});
}

function hideTextEditor(){
 // hide the text editor
 var btn = document.getElementById('toggleeditorbutton');
 btn.innerHTML = 'Show editor';
 document.getElementById('dotContainer').scrollIntoView({inline:'start',behavior:'smooth'});
 document.getElementById('graphControls').scrollIntoView({inline:'start',behavior:'smooth'});
}

function getTranslate(objId){
 // get the translation of the given element from its 'transform' attribute
 var el = document.getElementById(objId);
 if (el!=null){
  var oldtranslate = [];
  var transform = el.getAttribute("transform");
  // match two ints/floats inside parentheses, preceeded by "translate":
  var translateExpr = RegExp(/translate\(([-]?\d+[.]?\d*) ([-]?\d+[.]?\d*)\)/).exec(transform);
  if (translateExpr!=null){
   oldtranslate[0] = parseInt(translateExpr[1]);
   oldtranslate[1] = parseInt(translateExpr[2]);
  }
  return oldtranslate;
 } else {
  return null;
 }
}

function getScale(objId){
 // get the scale of the given element from its 'transform' attribute
 var el = document.getElementById(objId);
 if (el!=null){
  var oldscale = [];
  var transform = el.getAttribute("transform");
  // match two ints/floats inside parentheses, preceeded by "scale":
  var scaleExpr = RegExp(/scale\(([-]?\d+[.]?\d*) ([-]?\d+[.]?\d*)\)/).exec(transform);
  if (scaleExpr!=null){
   oldscale[0] = parseInt(scaleExpr[1]);
   oldscale[1] = parseInt(scaleExpr[2]);
  }
  return oldscale;
 } else {
  return null;
 }
}

function getRotate(objId){
 // get the rotation of the given element from its 'transform' attribute
 var el = document.getElementById(objId);
 if (el!=null){
  var oldrotate = [];
  var transform = el.getAttribute("transform");
  // match two ints/floats inside parentheses, preceeded by "rotate":
  var rotateExpr = RegExp(/rotate\(([-]?\d+[.]?\d*)/).exec(transform);
  if (rotateExpr!=null){
   oldrotate[0] = parseInt(rotateExpr[1]);
  }
  return oldrotate;
 } else {
  return null;
 }
}

function setTransform(objId,translate=null,scale=null,rotate=null){
 // set the translate/rotate/scale transforms of the given element
 var el = document.getElementById(objId);
 if (el!=null){
  // default to no change
  if (translate==null) translate = getTranslate(objId);
  if (scale==null) scale = getScale(objId);
  if (rotate==null) rotate = getRotate(objId);
  // form the 'transform' string
  var transform = `scale(${scale[0]} ${scale[1]}) rotate(${rotate[0]}) translate(${translate[0]} ${translate[1]})`;
  console.log(transform);
  el.setAttribute("transform",transform);
 }
}

function setDeltaTransform(objId,dtranslate=null,dscale=null,drotate=null){
 // set the translate/rotate/scale transforms of the given element, relative to the old value
 var el = document.getElementById(objId);
 if (el!=null){
  // default to no change
  if (dtranslate==null) dtranslate = [0,0];
  if (dscale==null) dscale = [0,0];
  if (drotate==null) drotate = [0];

  // get the current values
  translate = getTranslate(objId);
  scale = getScale(objId);
  rotate = getRotate(objId);

  // add the offsets
  translate[0] += dtranslate[0];
  translate[1] += dtranslate[1];
  scale[0] += dscale[0];
  scale[1] += dscale[1];
  rotate[0] += drotate[0];

  // form the 'transform' string
  var transform = `scale(${scale[0]} ${scale[1]}) rotate(${rotate[0]}) translate(${translate[0]} ${translate[1]})`;
//  console.log(transform);
  el.setAttribute("transform",transform);
 }
}

function setTranslate(objId,translate=null){
 setTransform(objId,translate);
}

function startDragGraph(){
 dragging = true;
 var mouseX = Math.round(event.clientX);
 var mouseY = Math.round(event.clientY);
 dragX0 = mouseX;
 dragY0 = mouseY;
// console.log("Start drag at "+mouseX.toString()+", "+mouseY.toString());
 // where is the object when dragging starts?
 dragOrigin = getTranslate("graph0");
}
function dragGraph(){
 if (dragging){
  var offsetX = Math.round(event.clientX-dragX0);
  var offsetY = Math.round(event.clientY-dragY0);
  console.log("Drag offset is "+offsetX.toString()+", "+offsetY.toString());
  setTransform("graph0",[dragOrigin[0]+offsetX,dragOrigin[1]+offsetY]); // could add scale, rotate
 }
}
function endDragGraph(){
 if (dragging){
  dragging = false;
  var mouseX = Math.round(event.clientX);
  var mouseY = Math.round(event.clientY);
//  console.log("End drag at "+mouseX.toString()+", "+mouseY.toString());
 }
}

// initialise and set the event listeners on the "thegraph" box:
dragging = false;
document.getElementById("thegraph").addEventListener("mousedown",startDragGraph);
document.getElementById("thegraph").addEventListener("mousemove",dragGraph);
document.getElementById("thegraph").addEventListener("mouseup",endDragGraph);
