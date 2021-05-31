function simplebounds(obj){
 var b = document.getElementById(obj).getBBox();
 var minX = b.x;
 var maxX = b.x+b.width;
 var minY = b.y;
 var maxY = b.y+b.height;
 return {minX, maxX, minY, maxY};
}

// function to find the bounding box of the extant nodes ///////////////////////////////// fn: bounds
function boundsD3(nodes) {
 var minX = 1000000;
 var maxX = -1000000;
 var minY = 1000000;
 var maxY = -1000000;
 nodes.forEach(function(thisnode) {
  if ((thisnode.x-thisnode.r)<minX) {minX=(thisnode.x-thisnode.r); minXnode=thisnode.index;}
  if ((thisnode.x+thisnode.r)>maxX) {maxX=(thisnode.x+thisnode.r); maxXnode=thisnode.index;}
  if ((thisnode.y-thisnode.r)<minY) {minY=(thisnode.y-thisnode.r); minYnode=thisnode.index;}
  if ((thisnode.y+thisnode.r)>maxY) {maxY=(thisnode.y+thisnode.r); maxYnode=thisnode.index;}
 });
 minX=Math.floor(minX);
 maxX=Math.ceil(maxX);
 minY=Math.floor(minY);
 maxY=Math.ceil(maxY);
 return {minX, maxX, minY, maxY, minXnode, maxXnode, minYnode, maxYnode};
}

// save the DVG graph as a PDF /////////////////////////////////////////////////////////// fn: savePDF
function savePDF(){
 const { jsPDF } = window.jspdf;

 var saveBounds = simplebounds("thesvg");
 var pdfwidth = Math.ceil(saveBounds.maxX-saveBounds.minX);
 var pdfheight = Math.ceil(saveBounds.maxY-saveBounds.minY);
 var xoff = -saveBounds.minX;
 var yoff = -saveBounds.minY;
 var layout = "portrait";

 if (pdfwidth>pdfheight) layout="landscape";
 var thepdf = new jsPDF(layout, "pt", [pdfheight, pdfwidth]);

 // This produces a PDF which is approx. 33% larger than on screen;
 // changing "scale" to 75% broke the offsets and/or width-height.
 svg2pdf(document.getElementById("thesvg"), thepdf, {
       xOffset: xoff,
       yOffset: yoff,
       scale: 1,
 });
 thepdf.save("graph.pdf");
 return 0;
}

// save the current SVG graph as a PNG /////////////////////////////////////////////////// fn: savePNG
function savePNG(){
 // for options see https://github.com/exupero/saveSvgAsPng

 // get the transparency option if there is a control for it:
 if (document.getElementById("input_transparent")!=null){
  var transparentBG = $("#transparency").prop('checked');
 } else { // default to true if there is no control
  var transparentBG = true;
 }
 var saveBounds = simplebounds("thesvg");
 var saveOptions = {
  scale: 2.0, // larger, better quality
  backgroundColor: (transparentBG?"#fff0":"#fff"), // transparent or not
  left: saveBounds.minX,
  top: saveBounds.minY,
  width: saveBounds.maxX-saveBounds.minX,
  height: saveBounds.maxY-saveBounds.minY,
 };

 saveSvgAsPng(document.getElementById("thesvg"), "graph.png", saveOptions);
}
