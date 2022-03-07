function parse(){
// var what = document.getElementById('parsewhat').value; // optional selector for different input formats
 var what = 'localaction';
 var rawinput = document.getElementById('theinput').value;
 var input = rawinput.split('\n').map(X=>X.trim());
 var comments = []
 var output = ''
 var parseReferenceNodeString = '';
 var parseDestinationNodeString = '';
 var valencyEstimate = -1;

 var debug = false;

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
     parseReferenceNodeString = tmpreference[1].trim();
     parseReferenceNode = stringListToArray(parseReferenceNodeString);
    } else if (tmpdestination && tmpdestination.length>0) {
     comments[i] = ' <span class="comment destnodecomment">// Set destination node: ('+(tmpdestination[1].trim()==''?'\u{d8}':tmpdestination[1].trim())+')</span>';
     parseDestinationNodeString = tmpdestination[1].trim();
     parseDestinationNode = stringListToArray(parseDestinationNodeString);
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
    var node1 = stringListToArray(term1);
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
      // and add the local action for the reference node to the stored list:
      editorLocalAction[term1] = parselocalaction; // array index is a string, entry is an array (with length equal to the valency)
     } else {
      if (parselocalaction.length == valencyEstimate){
       // okay format- and length-wise, now need to test constraints (if any):


       var actionOkay = false;
       if (parselocalaction.length>0){
        if (term1==parseReferenceNodeString){
         // found local action for the reference node, no need to test it
         if (debug) console.log("PARSE: Local action for reference node "+showterm1+": "+parselocalaction.toString());
         actionOkay = true;
        } else {
         // found a local action for a non-reference node: need to make sure it obeys any constraints imposed on it by the node nearer the reference node
         var pathToRef = getPath(node1,parseReferenceNode);
         if (pathToRef.length>1){
          if (debug) console.log("PARSE: Test local action for ["+term1+"]: ["+parselocalaction.toString()+"]");
          var thisEdge = node1.length>pathToRef[1]?node1.slice(-1):pathToRef[1].slice(-1);
          if (debug) console.log("CONSTRAINT: constraint comes from local action at "+pathToRef[1].toString());
          // local action for the constraining vertex must exist!
          if (Object.keys(editorLocalAction).indexOf(pathToRef[1].toString())!=-1){
           var thisconstraint = [thisEdge[0] , editorLocalAction[pathToRef[1]][thisEdge[0]]];
           if (debug) console.log("CONSTRAINT: "+parselocalaction.toString()+" must comply with "+thisconstraint.toString());
           if (testLocalAction(parselocalaction,thisconstraint)){ // test the local action against its constraint
            if (debug) console.log("TEST: passed constraint");
            actionOkay = true;
           } else {
            if (debug) console.log("TEST: failed constraint");
            actionOkay = false; // this local action failed its constraint test
           }
          }
         }
        }
        if (actionOkay){
         // constraints (if any) are satisfied:
         // add this local action to the global list (but only where the local action is actually defined; 0-length entries are placeholders for the next set of local actions)
         editorLocalAction[term1] = parselocalaction; // array index is a string, entry is an array (with length equal to the valency)
         // and set the output display for this line as the first term leading to the other with an arrow (\mapsto in Latex)
         output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2">[${showterm2}]</span>`;
        } else {
         output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2" class="failsconstraint" title="Permutation fails constraint">[${showterm2}]</span> // FAILS CONSTRAINT FROM (`+pathToRef[1].toString()+`)`;
        }
       }



      } else {
       // the valency is wrong (ie. the local action has the wrong length)
       // not okay: show the error in the output
       output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2" class="wrongvalency" title="Wrong valency for local action">[${showterm2}]</span>`;
      }
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
 setEditorOutput(output);

 // if the automorphism in the editor (whether read from the graph or typed/pasted in) is complete and legal,
 // then set some global variables which might be used for putting the editor's automorphism into the graph:
 editorReferenceNode = parseReferenceNode; // this is the array of integers, not the string
 editorDestinationNode = parseDestinationNode;
 if (parseReferenceNodeString!="NOT SET" && parseDestinationNodeString!="NOT SET" && Object.keys(editorLocalAction).length>0 && editorLocalAction[parseReferenceNodeString.toString()]!=undefined){
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

function setEditorOutput(text=''){
 if (text.length!=0){
  // display
  document.getElementById('parsingOutput').innerHTML = text;
  // scroll
  syncScroll();
  // typeset
  if (typeof(MathJax)) MathJax.typesetPromise([document.getElementById('parsingOutput')]);
 } else {
  // is there some default text we should show? probably not
 }
}

// show some help text in the editor's output (this will get overwritten when the text input is changed)
function showEditorHelp(){
 var EOL = '<br/>'; //  var EOL = '\n';
 var helptext = EOL+'\
<b>Summary</b>'+EOL+'\
-------'+EOL+'\
Enter the reference and destination vertices using the special comments (see below), and then a series of vertices and their local actions, in the format "(0,1,2,1)&nbsp;->&nbsp;[2,0,1]", and then click "APPLY".'+EOL+'\
'+EOL+'\
'+EOL+'\
<b>How to use the editor</b>'+EOL+'\
---------------------'+EOL+'\
This is the output for the text editor on the left. You can\'t change the text in this box. \
It is updated when changes are made to the text on the left.'+EOL+'\
'+EOL+'\
Comments are allowed, preceeded by "//", but are not saved when switching between the graph and the text editor. White-space is largely ignored (and removed).'+EOL+'\
'+EOL+'\
Some elements of the output will be coloured, representing:'+EOL+'\
&nbsp;- <span class="comment refnodecomment">a special comment</span> (defining reference/destination node)'+EOL+'\
&nbsp;- <span class="comment">a comment</span>'+EOL+'\
&nbsp;- <span class="nomatch">broken formatting for local action (eg. missing parentheses/bracket)</span>'+EOL+'\
&nbsp;- <span class="wrongformat">broken formatting within vertex/permutation (eg. extra comma)</span>'+EOL+'\
&nbsp;- <span id="term2" class="wrongvalency">the local action has the wrong valency (ie. length)</span>'+EOL+'\
'+EOL+'\
'+EOL+'\
<b>AUTOMORPHISM</b>'+EOL+'\
To define an automorphism, you need to specify the reference vertex and its destination using two special comments,'+EOL+'\
'+EOL+'\
<span class="comment refnodecomment">// Reference node: (0,1,2,1)</span>'+EOL+'\
<span class="comment destnodecomment">// Destination node: (1,0)</span>'+EOL+'\
'+EOL+'\
followed by a list of vertices and their local action permutation, such as'+EOL+'\
'+EOL+'\
&nbsp;&nbsp;&nbsp;&nbsp;(0,1,2,1) -> [2,0,1]'+EOL+'\
'+EOL+'\
'+EOL+'\
<b>FORMATS</b>'+EOL+'\
Vertices are denoted by their address in parentheses, "(...)".'+EOL+'\
Local actions are denoted by a permutation in brackets, "[...]".'+EOL+'\
'+EOL+'\
Each entry in the automorphism should consist of a vertex and its local action, separated by "->". Both of these use zero-indexed integers into the set of valencies. The root vertex should be denoted by "()" (and will be labelled "\u{d8}").'+EOL+'\
'+EOL+'\
For example,'+EOL+'\
'+EOL+'\
&nbsp;&nbsp;&nbsp;&nbsp;(0,1,2,1) -> [2,0,1]'+EOL+'\
'+EOL+'\
which specifies the local action permutation [0,1,2] $\\mapsto$ [2,0,1] for the vertex with address 0,1,2,1.'+EOL+'\
'+EOL+'\
'+EOL+'\
'+EOL+'\
'+EOL+'\
'+EOL+'\
';
//is the address 0,1,2,1 (which might be red,green,blue,green) and the local action permutation [0,1,2]&nbsp;$\\mapsto$&nbsp;[2,0,1] (which might be (red,blue,green)&nbsp;$\\mapsto$&nbsp;(green,red,blue))'+EOL+'\
 setEditorOutput(helptext);
}
