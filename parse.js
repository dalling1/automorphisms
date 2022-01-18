function parse(){
// var what = document.getElementById('parsewhat').value; // optional selector for different input formats
 var what = 'localaction';
 var input = document.getElementById('input').value.split('\n').map(X=>X.trim());
 var comments = []
 var output = ''
 var parseReferenceNode = '';
 var parseDestinationNode = '';
 var valencyEstimate = -1;
 /* break the input down by rows and process each one as an element of the automorphism */
 for (var i=0;i<input.length;i++){
  if (what=='mapsto'){ // could be adapted for dot language
   // look for rows in the form "XXX -> YYY"
   var mapstoformat = new RegExp('^\s*(.*?) *-+> *(.*)\s*$','i'); // allow spaces around the "->" and any number of dashes in the "->"
   var tmp = mapstoformat.exec(input[i]); // find matches
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
   // updated to add
   //  0. look for and remove comments (they will be appended at the end of the other tests)

   // REGEXP SECTION: define various patterns which we will need for parsing automorphisms
   //
   // define the comment format: two slashes followed by the comment
   var commentformat = new RegExp('(^[^\s]*?)\s*//\s*(.*)$'); // the '?' makes it right-greedy instead of left (so multiple occurences of // all become part of the comment);
   // define the automorphism entry format: parentheses list, arrow then bracketed list
   var automorphismformat = new RegExp('^ *(\\(.*?\\)) *(?:,|-+>?) *(\\[.*?\\]) *$','i');
   // format for a comma-separated list, with optional spaces around the commas
   var spacedcommas = new RegExp(' *, *','g');
   // format for a list of multiple (alphanumeric) labels, possibly with a terminating comma (followed by no label: used for the root (empty) node)
   var listformat = new RegExp('^ *([0-9a-z]+ *?, *?)*[0-9a-z]+ *?$|^ *[0-9a-z]* *,? *$','i');
   // reference node format:
   var refformat = new RegExp('^\s*?//\\s*?Reference node:\\s*?\\[(.*)\\].*$','i');
   // destination node format:
   var destformat = new RegExp('^\s*?//\\s*?Destination node:\\s*?\\[(.*)\\].*$','i');

   // look for a comment:
   var tmpcomments = commentformat.exec(input[i]);
   if (tmpcomments && tmpcomments.length>2){ // ie. if the row matched (has a comment, even if the comment part is empty)
    // test for two special comments, which define the reference and destination nodes:
    var tmpreference = refformat.exec(input[i]);
    var tmpdestination = destformat.exec(input[i]);

    if (tmpreference && tmpreference.length>0){
     comments[i] = ' <span class="comment refnodecomment">// Set reference node: ['+tmpreference[1].trim()+']</span>';
     parseReferenceNode = tmpreference[1];
    } else if (tmpdestination && tmpdestination.length>0) {
     comments[i] = ' <span class="comment destnodecomment">// Set destination node: ['+tmpdestination[1].trim()+']</span>';
     parseDestinationNode = tmpdestination[1];
    } else {
     // otherwise, found a normal comment, so store it in the comments array
     comments[i] = ' <span class="comment">// '+tmpcomments[2].trim()+'</span>';
    }
    // now remove the comment part and pass the line on to the automorphism parser:
    input[i] = tmpcomments[1].trim();
   } else {
    comments[i] = '';
   }

   // comments have been stored and removed, now look for the ()->[] entries
   var tmp = automorphismformat.exec(input[i].replaceAll('"','')); // find matches, ignore quotation marks
   var EOL = '<br/>'; //  var EOL = '\n';
   if (tmp && tmp[1].length && tmp[2].length){
    // remove the () or [] and spaces around commas
    var term1 = tmp[1].replace(spacedcommas,',').trim().slice(1,-1).trim();
    var term2 = tmp[2].replace(spacedcommas,',').trim().slice(1,-1).trim();
    // check that each term's contents are legal: a list of numbers separated by commas
    // - three options here: a list of comma-separated numbers/letters, and a single number with optional comma, or empty
    var checkterm1 = listformat.exec(term1);
    var checkterm2 = listformat.exec(term2);
    if (checkterm1 && checkterm2){
     // replace empty terms with the empty set symbol (for the root node):
     var showterm1 = (term1.length==0?'\u{d8}':term1);
     var showterm2 = (term2.length==0?'\u{d8}':term2);
     // set the output display as the first term leading to the other with an arrow (\mapsto in Latex)
     output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2">[${showterm2}]</span>`;
     // extract the automorphism entries
     var thelocalaction = term2.split(',').map(x=>parseInt(x)); // empty entries (the root node) become 'NaN'
     if (valencyEstimate==-1){
      // take the valency from the length of the first local action
      var valency = thelocalaction.length;
     } else {
      if (thelocalaction.length != valency){
       var thenode = term1.split(',').map(x=>parseInt(x));
       console.log('ERROR: local action (for node '+thenode.join(',').replace('NaN','\u{d8}')+') is the wrong length (should be '+valency+').');
      }
     }
//     console.log('Node '+thenode.join(',').replace('NaN','\u{d8}')+' (N='+thenode.length+') has local action '+thelocalaction.join(',')+' (N='+thelocalaction.length+')');
    } else {
     output += '<span class="wrongformat" title="Wrong format for lists within (...) and/or [...]">'+input[i]+'</span>';
    }

   } else {
    output += '<span class="nomatch" title="No match for the format (list1),[list2] or (list1)->[list2]">'+input[i]+'</span>';
   }
   output += comments[i]+EOL;
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

 output += '// Reference node: ['+(autoFrom==null?'NOT SET':autoFrom.toString())+']\n';
 output += '// Destination node: ['+(autoTo==null?'NOT SET':autoTo.toString())+']\n';
 if (constantActionEnabled()){
  output += '// constant action enabled\n';
  var t = autoFrom.toString();
  output += `(${t}) -> [${thelocalaction[t]}]\n`;
 } else {
  for (var t in thelocalaction){
   if (thelocalaction[t].length){
    output += `(${t}) -> [${thelocalaction[t]}]\n`;
   }
  }
 }
 document.getElementById('input').value = output;
 parse();
}
