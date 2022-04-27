function parse(what='localaction',rawinput=null){
 // 'what' options are
 //    'localaction' (the default)
 //    'mapsto'
 //    'listtolist'
 // 'rawinput' is the text to parse
 //
 var debug = false;
 if (rawinput==null) rawinput = document.getElementById('theinput').value; // default to the input textarea
 var input = rawinput.split('\n').map(X=>X.trim());
 var comments = []
 var output = ''
 var parseReferenceNodeString = 'NOT SET';
 var parseDestinationNodeString = 'NOT SET';
 var valencyEstimate = -1; // used for testing permutations

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
  var addressformat = new RegExp('^ *([0-9a-z]+ *?, *?)*[0-9a-z]+ *?$|^ *[0-9a-z]* *,? *$','i');
  // reference node format:
  var refformat = new RegExp('^\\s*?//\\s*?Reference node:\\s*?\\((.*)\\).*$','i');
  // destination node format:
  var destformat = new RegExp('^\\s*?//\\s*?Destination node:\\s*?\\((.*)\\).*$','i');
  // special comment for enabling a constant local action: [first version allows trailing characters]
//  var constantactionformat = new RegExp('^\\s*\/\/\\s*constant\\s+(local\\s+)?action\\s+(enabled|on)(\\s+.*)?$','i')
  var constantactionformat = new RegExp('^\\s*\/\/\\s*constant\\s+(local\\s+)?action\\s+(enabled|on)$','i')

  var EOL = '<br/>'; //  var EOL = '\n';
 } else if (what=='listtolist'){
  console.log("Requested list to list parsing");
  var commentformat = new RegExp('(^.*?)\\s*//\\s*(.*)$'); // the '?' makes it right-greedy instead of left (so multiple occurences of // all become part of the comment);
  var addressformat = new RegExp('^ *([0-9a-z]+ *?, *?)*[0-9a-z]+ *?$|^ *[0-9a-z]* *,? *$','i');
  var listlistformat = new RegExp('^ *(\\(.*?\\)) *(?:,|\t+|-+>?) *(\\(.*?\\)) *$','i');
  var EOL = '<br/>';
//alt:  var EOL = '\n';
  // initialise the resulting lists
  listtolistFrom = [];
  listtolistTo = [];
 }

 /* break the input down by rows and process each one as mapping of nodes */
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
    var checkterm1 = addressformat.exec(term1);
    var checkterm2 = addressformat.exec(term2);

    /*
     We will do a series of tests to see if this is a valid local action:
      - check that the overall format is okay: brackets, parentheses, commas, two terms [testlineFormat]
      - check that the permutation is valid [testlinePermutation]
      - no constraint on the first (reference vertex) entry [testlineReference]
      - otherwise, check that we have a local action for the neighbour in the direction of the reference vertex, to provide the constraint [testlineNeighbour]
      - test if the constraint imposed by the neighbour is satisfied [testlineConstraint]
    */
    // initialise
    var testlineFormat = false;
    var testlinePermutation = false;
    var testlineReference = false;
    var testlineNeighbour = false;
    var testlineConstraint = false;


    // 1. valid line format?
    var testlineFormat = (checkterm1 && checkterm2);
    if (testlineFormat){
     // replace empty terms with the empty set symbol (for the root node):
     var showterm1 = (term1.length==0?'\u{d8}':term1);
     var showterm2 = (term2.length==0?'\u{d8}':term2);
     // extract the automorphism entries
     var parselocalaction = stringListToArray(term2); // empty entries (the root node) become 'NaN'
     if (valencyEstimate==-1){
      // take the valency from the length of the first local action
      valencyEstimate = parselocalaction.length;
      console.log('Estimating valency, from first local action, as '+valencyEstimate);
     }
    }

    // 1.5. is this the reference node?
    if (parseReferenceNodeString!="NOT SET" && term1==parseReferenceNodeString){
     testlineReference = true;
    }

    // 2. valid permutation?
    if (testlineFormat) testlinePermutation = testPermutation(parselocalaction,valencyEstimate);

    // 3. find neighbour towards reference node (this test is skipped for the reference node)
    if (testlineFormat && testlinePermutation){
     // 3a. is this the reference vertex? no neighbour required
     if (!testlineReference){
      // 3b. not the reference vertex, find the neighbour towards the reference node
      // find the neighbouring node in the direction of the reference node and check that it has a local action defined for it
      var pathToRef = getPath(node1,parseReferenceNode);
      if (pathToRef.length>1){
       // local action for the constraining vertex must exist!
       if (Object.keys(editorLocalAction).indexOf(pathToRef[1].toString())!=-1){
        testlineNeighbour = true;
       } else {
        var missingneighbour = pathToRef[1].toString();
       }
      }
     }
    }

    // 4. is the constraint satisfied?
    if (testlineFormat && testlinePermutation && testlineNeighbour){
     var failedconstraint = [];
     // get the local action of the constraining neighbour
     var neighbourLocalAction = editorLocalAction[pathToRef[1].toString()]; // from the stored list of local actions which passed all the tests
     // which entry is the constraint? the one corresponding to the edge joining these neighbours
     var thisedge = (node1.length>pathToRef[1].length ? node1.slice(-1)[0] : pathToRef[1].slice(-1)[0] ); // take [0] since slice returns an array
     // so the constraint is neighbourLocalAction[thisedge]
     var thisconstraint = [thisedge , neighbourLocalAction[thisedge]];
/*
console.log("TESTING local action: "+parselocalaction.toString());
console.log("AGAINST: "+neighbourLocalAction.toString());
console.log("TESTING entry (0-indexed): "+thisconstraint[0].toString());
console.log("TESTING entry should be: "+thisconstraint[1].toString());
console.log("TESTING entry is: "+parselocalaction[thisconstraint[0]].toString()+" ("+(testLocalAction(parselocalaction,thisconstraint)?"passed":"failed")+")");
*/
     testlineConstraint = testLocalAction(parselocalaction,thisconstraint); // perform the test
    }

    // 5. report
    if (!testlineFormat){
     // line format is wrong
     output += '<span class="wrongformat" title="Wrong format for lists within (...) and/or [...]">'+input[i]+'</span>';
    } else if (!testlinePermutation){
     // permutation is invalid
     output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2" class="wrongvalency" title="Invalid local action">[${showterm2}]</span> <style="color:#900;">// invalid permutation</span>`;
    } else if (!testlineNeighbour && !testlineReference){
     // required constraining neighbour has no entry (and this isn't the reference node)
     output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2" class="failsconstraint" title="Missing constraint">[${showterm2}]</span> <span style="color:#900;">// LOCAL ACTION OF REQUIRED NEIGHBOUR (`+(missingneighbour.length==0?'\u{d8}':missingneighbour)+`) NOT FOUND ABOVE`;
    } else if (!testlineConstraint && !testlineReference){
     // local action does not meet the required constraint (and this isn't the reference node)
     var Ntmp = 1+parseInt(thisconstraint[0]);
     output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2" class="failsconstraint" title="Permutation fails constraint">[${showterm2}]</span> <span style="color:#900;">// FAILS CONSTRAINT [`+thisedge.toString()+`] FROM (`+(pathToRef[1].length==0?'\u{d8}':pathToRef[1].toString())+`): the `+nth(Ntmp)+` entry must be `+thisconstraint[1]+` not `+parselocalaction[parseInt(thisconstraint[0])]+`</span>`;
    } else {
     // okay! store the local action
     editorLocalAction[term1] = parselocalaction; // array index is a string, entry is an array (with length equal to the valency)
     output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2">[${showterm2}]</span>`+(testlineReference?' <span class="comment refnodecomment">// reference vertex</span>':'');
    }
   } else {
    output += '<span class="nomatch" title="No match for the format (list1),[list2] or (list1)->[list2]">'+input[i]+'</span>';
   }
   output += comments[i]+EOL;

  } else if (what='listtolist'){
   // look for a comment: (note: in the list-to-list format there are no reference or destination nodes (and so no special comments))
   var tmpcomments = commentformat.exec(input[i]);
   if (tmpcomments && tmpcomments.length>2){ // ie. if the row matched (has a comment, even if the comment part is empty)
    // found a (normal) comment, so store it in the comments array
    comments[i] = ' <span class="comment">// '+tmpcomments[2].trim()+'</span>';
    // now remove the comment part and pass the line on to the automorphism parser:
    input[i] = tmpcomments[1].trim();
   } else {
    comments[i] = '';
   }

   // comments have now been stored and removed, next look for the () -> () entries

   var tmp = listlistformat.exec(input[i].replaceAll('"','')); // find matches, ignore quotation marks
   if (tmp && tmp[1].length && tmp[2].length){
    // remove the () or [] and spaces around commas
    var term1 = tmp[1].replace(spacedcommas,',').trim().slice(1,-1).trim();
    var term2 = tmp[2].replace(spacedcommas,',').trim().slice(1,-1).trim();
    // check that each term's contents are legal: a list of numbers separated by commas
    // - three options here: a list of comma-separated numbers/letters, and a single number with optional comma, or empty
    var checkterm1 = addressformat.exec(term1);
    var checkterm2 = addressformat.exec(term2);
    // do any additional parsing and testing here

    var testlineFormat = (checkterm1 && checkterm2);
    if (testlineFormat){
     // replace empty terms with the empty set symbol (for the root node):
     var showterm1 = (term1.length==0?'\u{d8}':term1);
     var showterm2 = (term2.length==0?'\u{d8}':term2);

     // no need to estimate valency (as we are not doing permutation testing)
     // but we could include further parsing and testing here or below
    //   eg. valency estimation: highest address value, eg. 4 in (2,1,4,0,2,3)
    //   eg. depth estimation: length of longest term, eg. 6 for (2,1,4,0,2,3)

     // store the valid entries
     listtolistFrom.push(stringListToArray(term1));
     listtolistTo.push(stringListToArray(term2));
     // report on what was found:
     if (debug) console.log("HHHHH added list-to-list FROM \""+term1+"\" TO \""+term2+"\"");

     // format the output
     output += `<span id="term1">(${showterm1})</span> $\\mapsto$ <span id="term2">(${showterm2})</span>`+(testlineReference?' <span class="comment refnodecomment">// reference vertex</span>':'');
    } else {
     // testlineFormat failed, report
     output += '<span class="wrongformat" title="Wrong format for lists within (...)">'+input[i]+'</span>';
    }
   } else {
    output += '<span class="nomatch" title="Not in the format (term1) -> (term2)">'+input[i]+'</span>';
   }

   // put back any comment that was found on this line
   output += comments[i]+EOL;

  }

 }

 // display
 setEditorOutput(output);

 if (what=='localaction'){
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
 } else if (what=='listtolist'){
  // add futher testing here for listtolist:
  //  - eg. check that the specified from-to pairs form a legal automorphism
  //  - eg. identify any "null region" in an almost-automorphism
  //  - etc.
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

 // check that we have some (potentially valid) local actions by making sure that all entries are not empty arrays (ie. placeholders):
 var haveLAs = false;
 for (L in thelocalaction){
  if (thelocalaction[L].length > 0){
   haveLAs = true;
  }
 }

 // if some local actions exist, add them to the editor contents, ordered by distance from the reference node:
 if (haveLAs){
  if (constantActionEnabled()){
   output += '// constant action enabled\n';
   var t = autoFrom.toString();
   output += `(${t}) -> [${thelocalaction[t]}]\n`;
  } else {
   // calculate the distances of each node from the reference node, and put them into the output in ascending distance order:
   // ie. starting with the reference node and working outwards (so that the required constraints are present for parsing in the text editor)
   var nodeDistances = Object.keys(thelocalaction).map(t=>nodeDistance(autoFrom,stringListToArray(t)));
   var maxDistance = Math.max(...nodeDistances);

   for (var d=0;d<=maxDistance;d++){
    // get nodes at distance d from the reference node:
    var thisball = Object.keys(thelocalaction).filter(t=>nodeDistance(autoFrom,stringListToArray(t))==d);
    for (var i=0;i<thisball.length;i++){
     var thisnodeaddress = thisball[i];
     if (thelocalaction[thisnodeaddress].length){
      output += `(${thisnodeaddress}) -> [${thelocalaction[thisnodeaddress]}]\n`;
     }
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
&nbsp;- <span id="term2" class="wrongvalency">the local action permutation is invalid (eg. repeated entries, wrong length)</span>'+EOL+'\
&nbsp;- <span id="term2" class="failsconstraint">fails to meet constraint of neighbouring local action</span>'+EOL+'\
'+EOL+'\
Erroneous entries will not be added to the list of local actions, which may cause subsequent constraint failures.'+EOL+'\
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
The order of entries must be outwards from the reference vertex, so that constraints are satisfied (that is, each vertex must be connected to the reference vertex by the entries above it). '+EOL+'\
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

// ordinal string function (by kennebec https://stackoverflow.com/a/15810761)
function nth(n){
    if(isNaN(n) || n%1) return n;
    var s= n%100;
    if(s>3 && s<21) return n+'th';
    switch(s%10){
        case 1: return n+'st';
        case 2: return n+'nd';
        case 3: return n+'rd';
        default: return n+'th';
    }
}
