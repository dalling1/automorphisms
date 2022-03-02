function parse(){
// var what = document.getElementById('parsewhat').value; // optional selector for different input formats
 var what = 'localaction';
 var rawinput = document.getElementById('theinput').value;
 var input = rawinput.split('\n').map(X=>X.trim());
 var comments = []
 var output = ''
 var parseReferenceNode = '';
 var parseDestinationNode = '';
 var valencyEstimate = -1;

 // global variables for taking the editor's automorphism and putting it into the graph
 editorAutomorphismValid = false;
 editorReferenceNode = null;
 editorDestinationNode = null;
 editorLocalAction = new Array;
 editorConstantLocalAction = false;

 // make the input's content available to the clipboard (for the "copy" button)
 document.getElementById('theinput').setAttribute("data-copy-text",rawinput); // for the clipboard

 // set up the expressions to be recognised, depending on the type of parsing:
 if (what=='mapsto'){ // could be adapted for dot language
  // look for rows in the form "XXX -> YYY"
  var mapstoformat = new RegExp('^\\s*(.*?) *-+> *(.*)\\s*$','i'); // allow spaces around the "->" and any number of dashes in the "->"

  var EOL = '<br/>'; //  var EOL = '\n';
 } else if (what=='localaction'){
  // two-stage approach:
  //  1. look for (...) and [...], separated by comma (could add dash or arrow)
  //  2. test the () and [] terms to check that they are legal
  // updated to add
  //  0. look for and remove comments (they will be appended at the end of the other tests)

  // REGEXP SECTION: define various patterns which we will need for parsing automorphisms
  // Nb. most of these allow arbitrary white-space at the start of the line
  //
  // define the comment format: two slashes followed by the comment
//old  var commentformat = new RegExp('(^[^\\s]*?)\\s*//\\s*(.*)$'); // the '?' makes it right-greedy instead of left (so multiple occurences of // all become part of the comment);
  // this version allows comments following other valid lines (but note that comments are not preserved when the text is processed...)
  var commentformat = new RegExp('(^.*?)\\s*//\\s*(.*)$'); // the '?' makes it right-greedy instead of left (so multiple occurences of // all become part of the comment);
  // define the automorphism entry format: parentheses list, arrow then bracketed list
  var automorphismformat = new RegExp('^ *(\\(.*?\\)) *(?:,|\t+|-+>?) *(\\[.*?\\]) *$','i');
  // format for a comma-separated list, with optional spaces around the commas
  var spacedcommas = new RegExp(' *, *','g');
  // format for a list of multiple (alphanumeric) labels, possibly with a terminating comma (followed by no label: used for the root (empty) node)
  var listformat = new RegExp('^ *([0-9a-z]+ *?, *?)*[0-9a-z]+ *?$|^ *[0-9a-z]* *,? *$','i');
  // reference node format:
  var refformat = new RegExp('^\\s*?//\\s*?Reference node:\\s*?\\((.*)\\).*$','i');
  // destination node format:
  var destformat = new RegExp('^\\s*?//\\s*?Destination node:\\s*?\\((.*)\\).*$','i');
  // special comment for enabling a constant local action: [first version allows trailing characters]
//  var constantactionformat = new RegExp('^\\s*\/\/\\s*constant\\s+(local\\s+)?action\\s+(enabled|on)(\\s+.*)?$','i')
  var constantactionformat = new RegExp('^\\s*\/\/\\s*constant\\s+(local\\s+)?action\\s+(enabled|on)$','i')

  var EOL = '<br/>'; //  var EOL = '\n';
 }

 /* break the input down by rows and process each one as an element of the automorphism */
 for (var i=0;i<input.length;i++){
  if (what=='mapsto'){ // could be adapted for dot language
   var tmp = mapstoformat.exec(input[i]); // find matches
   if (tmp && tmp[1].length && tmp[2].length){
    output += '<span id="term1">'+tmp[1].trim()+'</span> $\\mapsto$ <span id="term2">'+tmp[2].trim()+'</span>'+EOL;
   } else {
    output += '<span class="nomatch" title="No match for [term1] -> [term2]">'+input[i]+'</span>'+EOL;
   }
  } else if (what=='localaction'){
   // look for a comment:
   var tmpcomments = commentformat.exec(input[i]);
   if (tmpcomments && tmpcomments.length>2){ // ie. if the row matched (has a comment, even if the comment part is empty)
    // test for three special comments, which define the reference and destination nodes or set constant local actions:
    var tmpreference = refformat.exec(input[i]);
    var tmpdestination = destformat.exec(input[i]);
    var tmpconstantaction = constantactionformat.exec(input[i]);

    if (tmpreference && tmpreference.length>0){
     comments[i] = ' <span class="comment refnodecomment">// Set reference node: ('+(tmpreference[1].trim()==''?'\u{d8}':tmpreference[1].trim())+')</span>';
     parseReferenceNode = tmpreference[1].trim();
    } else if (tmpdestination && tmpdestination.length>0) {
     comments[i] = ' <span class="comment destnodecomment">// Set destination node: ('+(tmpdestination[1].trim()==''?'\u{d8}':tmpdestination[1].trim())+')</span>';
     parseDestinationNode = tmpdestination[1].trim();
    } else if (tmpconstantaction && tmpconstantaction.length>0) {
     editorConstantLocalAction = true;
     comments[i] = ' <span class="comment constantactioncomment">// Local action is constant</span>';
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
     // extract the automorphism entries
     var parselocalaction = stringListToArray(term2); // empty entries (the root node) become 'NaN'
     if (valencyEstimate==-1){
      // take the valency from the length of the first local action
      var valencyEstimate = parselocalaction.length;
      console.log('Estimating valency, from first local action, as '+valencyEstimate);
      // okay: set the output display for this line as the first term leading to the other with an arrow (\mapsto in Latex)
      output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2">[${showterm2}]</span>`;
     } else {
      if (parselocalaction.length == valencyEstimate){
       // okay: set the output display for this line as the first term leading to the other with an arrow (\mapsto in Latex)
       output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2">[${showterm2}]</span>`;
      } else {
       var thenode = stringListToArray(term1);
       // not okay: show the error in the output xxx
       output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2" class="nomatch" title="Wrong valency for local action">[${showterm2}]</span>`;
      }
     }


//     console.log('Node '+thenode.join(',').replace('NaN','\u{d8}')+' (N='+thenode.length+') has local action '+parselocalaction.join(',')+' (N='+parselocalaction.length+')');
     // add this local action to the global list (but only where the local action is actually defined; 0-length entries are placeholders for the next set of local actions)
     if (parselocalaction.length>0){
      editorLocalAction[term1] = parselocalaction; // array index is a string, entry is an array (with length equal to the valency)
     }

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

 // if the automorphism in the editor (whether read from the graph or typed/pasted in) is complete and legal,
 // then set some global variables which might be used for putting the editor's automorphism into the graph:
 editorReferenceNode = stringListToArray(parseReferenceNode); // store an array of integers, not a string
 editorDestinationNode = stringListToArray(parseDestinationNode);
 if (parseReferenceNode!="NOT SET" && parseDestinationNode!="NOT SET" && Object.keys(editorLocalAction).length>0 && editorLocalAction[parseReferenceNode.toString()]!=undefined){
  editorAutomorphismValid = true;
 } else {
  // not complete
  editorAutomorphismValid = false;
  editorLocalAction = new Array; // remove any entries which might have been added
 }
}

function syncScroll(){
 // keep the output in sync with the input when scrolling the input
 document.getElementById('parsingOutput').scrollTop = document.getElementById('theinput').scrollTop;
}

function actionToEditor(){
 var output = '';

 output += '// Reference node: ('+(autoFrom==null?'NOT SET':autoFrom.toString())+')\n';
 output += '// Destination node: ('+(autoTo==null?'NOT SET':autoTo.toString())+')\n';

 // check that we have some (potentially valid) local actions by making sure that all entries are not
 // empty arrays:
 var haveLAs = false;
 for (L in thelocalaction){
  if (thelocalaction[L].length > 0){
   haveLAs = true;
  }
 }

 // now, if some local actions exist, add them to the editor contents:
 if (haveLAs){
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
 }
 document.getElementById('theinput').value = output;
 parse();
}

function editorToAction(){
 var okayToDraw = false;

 // make sure we are up to date
 parse();

 // temporary reporting
 if (editorAutomorphismValid){
  // show the automorphism details in the console?
  if (false){
   console.log("editorReferenceNode = "+labelNode(editorReferenceNode));
   console.log("editorDestinationNode = "+labelNode(editorDestinationNode));
   console.log("Found local actions for these nodes:");
   for (T in editorLocalAction){
    console.log(labelNode(stringListToArray(T))+" -- "+editorLocalAction[T].toString());
   }
  }

  // we have the parts we need: copy them over to the graph's variables (eg. thelocalaction) and re-draw (re-decorate) the graph
  clearAutomorphism();
  // draw the (untransformed) graph to create the SVG objects (nodes, etc.)
  run(false);
  // set the reference node
  autoFrom = editorReferenceNode;
  setFrom = false;
  // set the destination node
  autoTo = editorDestinationNode;
  setTo = false;
  showFromTo();
  // put the local actions in place (copy them to thelocalaction)
  for (T in editorLocalAction){
   saveLocalAction(stringListToArray(T),editorLocalAction[T]); // calls testAutomorphism() for each one, which might fail until the reference node's local action is copied
  }
  // set the constant local action switch and decorate the graph nodes accordingly
  document.getElementById("input_constantauto").checked = editorConstantLocalAction;
  styleActions();
//  loadNodeAction(autoFrom); // not necessary
  // hide the text editor
  hideTextEditor();
  // re-draw the transformed graph with the automorphism
  run(true);

 } else {
  // not valid, is there anything that should be done?

  // report on a missing local action at the reference node:
  if (editorLocalAction[editorReferenceNode.toString()]==undefined){
   alert('Error: the local action for the reference node must be specified');
  }
 }
}

// function to take a comma-separated string list address for a node (eg. "2,1,2") and return the array version (eg. [2,1,2])
function stringListToArray(str){
 // deal with the empty string first
 if (str.length==0) return [];
 else return str.split(',').map(x=>parseInt(x));
}
