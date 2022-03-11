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
   oldtranslate[0] = parseFloat(translateExpr[1]);
   oldtranslate[1] = parseFloat(translateExpr[2]);
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
   oldscale[0] = parseFloat(scaleExpr[1]);
   oldscale[1] = parseFloat(scaleExpr[2]);
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
   oldrotate[0] = parseFloat(rotateExpr[1]);
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
  el.setAttribute("transform",transform);
 }
}

function setTranslate(objId,translate=null){
 setTransform(objId,translate);
}
function setScale(objId,scale=null){
 var translate = null; // don't change translation
 var rotate = null; // don't change rotation
 setTransform(objId,translate,scale,rotate);
}

function startDragGraph(){
 dragging = true;
 // where is the mouse when dragging starts?
 dragX0 = Math.round(event.clientX);
 dragY0 = Math.round(event.clientY);
 // where is the object when dragging starts?
 dragOrigin = getTranslate("graph0");
}
function dragGraph(){
 if (dragging){
  var dragStrength = 1.5; // perhaps this should scale with the zooming (scale) of the graph
  var offsetX = Math.round(event.clientX-dragX0);
  var offsetY = Math.round(event.clientY-dragY0);
  setTransform("graph0",[dragOrigin[0]+dragStrength*offsetX,dragOrigin[1]+dragStrength*offsetY]); // could add scale, rotate
 }
}
function endDragGraph(){
 if (dragging){
  dragging = false;
 }
}
function wheelZoom(){
 // zoom the graph when the mouse wheel scrolls: note that positive deltaY is turned into "zoom OUT"
 var zoomStrength = 0.25; // change the scroll by this in a step-wise manner
 if (event.deltaY!=0){
  var scale = getScale("graph0");
  scale[0] += (event.deltaY>0? -zoomStrength : zoomStrength);
  scale[0] = Math.min(10.0,Math.max(0.1,scale[0])); // minimum scale 0.1, maximum scale 10.0
  scale[1] = scale[0];
  setScale("graph0",scale);
 }
}

// initialise and set the event listeners on the "thegraph" box:
dragging = false;
document.getElementById("thegraph").addEventListener("mousedown",startDragGraph);
document.getElementById("thegraph").addEventListener("mousemove",dragGraph);
document.getElementById("thegraph").addEventListener("mouseup",endDragGraph);
// use scroll wheel for zooming
document.getElementById("thegraph").addEventListener("wheel",wheelZoom);
