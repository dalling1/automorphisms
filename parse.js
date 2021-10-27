function parse(){
// var what = document.getElementById('parsewhat').value; // optional selector for different input formats
 var what = 'localaction';
 var input = document.getElementById('input').value.split('\n').map(X=>X.trim());
 var output = ''
 /* break the input down by rows and process each one as an element of the automorphism */
 for (var i=0;i<input.length;i++){
  if (what=='mapsto'){ // could be adapted for dot language
   // look for rows in the form "XXX -> YYY"
   var format = new RegExp('^\s*(.*?) *-+> *(.*)\s*$','i'); // allow spaces around the "->" and any number of dashes in the "->"
   var tmp = format.exec(input[i]); // find matches
   var EOL = '<br/>'; //  var EOL = '\n';
   if (tmp && tmp[1].length && tmp[2].length){
    output += '<span id="term1">'+tmp[1].trim()+'</span> $\\mapsto$ <span id="term2">'+tmp[2].trim()+'</span>'+EOL;
   } else {
    output += '<span class="nomatch" title="No match for [term1] -> [term2]">'+input[i]+'</span>'+EOL;
   }
  } else if (what=='localaction'){
   // two-stage approach:
   //  1. look for (...) and [...], separated by comma (could add dash or arrow)
   //  2. test the () and [] terms to check that they are legal
   var format = new RegExp('^ *(\\(.*?\\)) *(?:,|-+>?) *(\\[.*?\\]) *$','i');

   var tmp = format.exec(input[i].replaceAll('"','')); // find matches, ignore quotation marks
   var EOL = '<br/>'; //  var EOL = '\n';
   if (tmp && tmp[1].length && tmp[2].length){
    var spacedcommas = new RegExp(' *, *','g');
    // remove the () or [] and spaces around commas
    var term1 = tmp[1].replace(spacedcommas,',').trim().slice(1,-1).trim();
    var term2 = tmp[2].replace(spacedcommas,',').trim().slice(1,-1).trim();
    // check that each term's contents are legal: a list of numbers separated by commas
    // - three options here: a list of comma-separated numbers/letters, and a single number with optional comma, or empty
    var listformat = new RegExp('^ *([0-9a-z]+ *?, *?)*[0-9a-z]+ *?$|^ *[0-9a-z]* *,? *$','i');
    var checkterm1 = listformat.exec(term1);
    var checkterm2 = listformat.exec(term2);
    if (checkterm1 && checkterm2){
     output += `<span id="term1">(${term1})</span> $\\mapsto$ <span id="term2">[${term2}]</span>`+EOL;
     // extract the automorphism entries
     var thenode = term1.split(',').map(x=>parseInt(x));
     var thelocalaction = term2.split(',').map(x=>parseInt(x)); // empty entries (the root node) become 'NaN'
     if (i==0){
      // take the valency from the length of the first local action
      var valency = thelocalaction.length;
     } else {
      if (thelocalaction.length != valency){
       console.log('ERROR: local action (for node '+thenode.join(',').replace('NaN','\u{d8}')+' is the wrong length.');
      }
     }
     console.log('Node '+thenode.join(',').replace('NaN','\u{d8}')+' (N='+thenode.length+') has local action '+thelocalaction.join(',')+' (N='+thelocalaction.length+')');
    } else {
     output += '<span class="wrongformat" title="Wrong format for lists withing (...) and/or [...]">'+input[i]+'</span>'+EOL;
    }

   } else {
    output += '<span class="nomatch" title="No match for the format (list1),[list2] or (list1)->[list2]">'+input[i]+'</span>'+EOL;
   }
  }
 }

 // display
 document.getElementById('parsingOutput').innerHTML = output;
 // scroll
 syncScroll();
 // typeset
 if (typeof(MathJax)) MathJax.typesetPromise([document.getElementById('parsingOutput')]);
}

function syncScroll(){
 // keep the output in sync with the input when scrolling the input
 document.getElementById('parsingOutput').scrollTop = document.getElementById('input').scrollTop;
}

function actionToEditor(){
 var output = '';
 for (var t in thelocalaction){
  if (thelocalaction[t].length){
   output += `(${t}) -> [${thelocalaction[t]}]\n`;
  }
 }
 document.getElementById('input').value = output;
 parse();
}
