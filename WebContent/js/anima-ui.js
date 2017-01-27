/*
Copyright 2014 Extensions of Logic Programming - Universitat Politècnica de València

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to use, 
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the 
Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function initialize(){
	myProgram = CodeMirror.fromTextArea(document.getElementById("taProgram"),{lineNumbers: true, theme: "neat"});
	window.onunload = function(e) { closeGraphWindows(); window.opener = null; };
	bindKeys();
	bindUpload();
	initColorPickers();
	$(".slider").slider({min: 2, max: 5, step: 1, value: 3, tooltip: "hide"}).on("slide", function(e) { MAX_EXPAND = e.value; $("#expandValue").text(MAX_EXPAND); });
	$(window).resize( function(e) { 
		if (myTree != null) 
			centerTree(myTree.iSelectedNode,true);
		resizeModalWindow($("#myStateWindow"),$("#stateWindowWrapper"),$("#stateWindowContent"));
		resizeModalWindow($("#myInfoWindow"),$("#infoWindowWrapper"),$("#infoWindowContent"));
		resizeModalWindow($("#myCondWindow"),$("#condWindowWrapper"),$("#condWindowContent"));
		resizeModalWindow($("#myCondSliceWindow"),$("#condSliceWindowWrapper"),$("#condSliceWindowContent"));
		resizeModalWindow($("#myStatisticsWindow"),$("#statisticsWindowWrapper"),$("#statisticsWindowContent"));
		resizeModalWindow($("#myTraceWindow"),$("#traceWindowWrapper"),$("#traceWindowContent"));
		resizeModalWindow($("#myProgramWindow"),$("#programWindowWrapper"),$("#taProgram2"));
		resizeModalWindow($("#myParseWindow"),$("#parseWindowWrapper"),$("#parseWindowContent2"));
	});
	var clip = new ZeroClipboard($("#bExportTrace"));
	clip.on("dataRequested", function (client, args) { client.setText(exportTrace()); });
	clip.glue($("#bExportTrace"));
	$("#myTreeContainer").draggable({ start: function(event,ui){hideContextMenu();}, cancel: ".doNotDrag" });
	$(".selectpicker").selectpicker();
	$("body").on("contextmenu", "div", function(e) {
		if (this.classList.contains("dropdown") || (this.classList.contains("animaNode") && isWorking))
			return false;
		if (!this.classList.contains("animaNode"))
			return true;
		try {
			menunode = myTree.getNode(parseInt(this.id)); 
			if (!menunode.canExpand){
				$("#menuExpandNode").addClass("disabled");
				$("#menuExpandSubTree").addClass("disabled");
			}
			else {
				$("#menuExpandNode").removeClass("disabled");
				$("#menuExpandSubTree").removeClass("disabled");
			}
			if (!menunode.isNormalized || (menunode.isNormalized && menunode.canExpand))
				$("#menuFoldNode").addClass("disabled");
			else
				$("#menuFoldNode").removeClass("disabled");
			if (menunode.id == 0){
				$("#menuShowTransition").addClass("disabled");
				$("#menuInspectCondition").addClass("disabled");
				$("#menuInspectConditionSlice").addClass("disabled");
				$("#menuShowTrace").addClass("disabled");
				$("#menuExportTrace").addClass("disabled");
			}
			else {
				if (menunode.id == myTree.getNormalizedRoot().id && !myTree.getNode(0).isVisible)
					$("#menuShowTransition").addClass("disabled");
				else
					$("#menuShowTransition").removeClass("disabled");
				
				if (menunode.getCondition(myTree.isSource) == null || menunode.getCondition(myTree.isSource).length == 0)
					$("#menuInspectCondition").addClass("disabled");
				else
					$("#menuInspectCondition").removeClass("disabled");
				
				if (menunode.getCondition(myTree.isSource) == null || menunode.getConditionSlice(myTree.isSource).length == 0)
					$("#menuInspectConditionSlice").addClass("disabled");
				else
					$("#menuInspectConditionSlice").removeClass("disabled");
				$("#menuExportTrace").removeClass("disabled");
			}
			$("#contextMenu").css({
				display: "block",
				left: e.pageX,
				top: (e.pageY-50)
			});
			return false;
		}
		catch (ex){
			console.error("ERROR#1: "+ex);
			return true;
		}
	});
	$("#contextMenu").on("mouseleave", function() { hideContextMenu(); });
	$("#queryInput").keypress(function(event) { if (event.keyCode == 13) {
        query(); 
        
    }});
	if (window.opener != null && (window.opener.document.URL == IJULIENNE_WEBSITE || window.opener.document.URL == ABETS_WEBSITE)){
		from0to1();
		importData();
	}
}

function resizeModalWindow(container,wrapper,content) {
	if (container != null && wrapper != null && content != null){
		var maxH = container.height()-150-(container[0].id == "myTraceWindow"?50:0);
		if (content.attr("id") == "taProgram2")
			content.css("max-height",(maxH-20)+"px");
		else
			content.css("max-height",maxH+"px");
		var top = Math.min(50,(maxH-content.height())/2);
		wrapper.css("top",top+"px");
        if (container[0].id == "myTraceWindow")
            $("#myTableButtons").css("margin-top",(Math.max(0,top)+10)+"px");
	}
}

function closeGraphWindows() {
	if (cgWindow != null)
		cgWindow.close();
	if (sgWindow != null)
		sgWindow.close();
	cgWindow = null;
	sgWindow = null;
}

function initColorPickers() {
	$("#colorDefault").ColorPicker({
		color: "#FFFFFF",
		onShow: function (colpkr) { $(colpkr).fadeIn(500); $("#myTreeWrapper").bind("click",function(){ updateColors(); $(colpkr).fadeOut(500);}); return false; },
		onHide: function (colpkr) { $(colpkr).fadeOut(500); $(document).unbind("click"); updateColors(); return false; },
		onChange: function (hsb, hex, rgb) { $("#colorDefault").css("backgroundColor", "#" + hex); }
	});
	$("#colorInstrumented").ColorPicker({
		color: "#8CFFC5",
		onShow: function (colpkr) { $(colpkr).fadeIn(500); $("#myTreeWrapper").bind("click",function(){ updateColors(); $(colpkr).fadeOut(500);}); return false; },
		onHide: function (colpkr) { $(colpkr).fadeOut(500); $(document).unbind("click"); updateColors(); return false; },
		onChange: function (hsb, hex, rgb) { $("#colorInstrumented").css("backgroundColor", "#" + hex); }
	});
	$("#colorSliced").ColorPicker({
		color: "#E0E0E0",
		onShow: function (colpkr) { $(colpkr).fadeIn(500); $("#myTreeWrapper").bind("click",function(){ updateColors(); $(colpkr).fadeOut(500);}); return false; },
		onHide: function (colpkr) { $(colpkr).fadeOut(500); $(document).unbind("click"); updateColors(); return false; },
		onChange: function (hsb, hex, rgb) { $("#colorSliced").css("backgroundColor", "#" + hex); }
	});
	$("#colorParentSelected").ColorPicker({
		color: "#FFF2A8",
		onShow: function (colpkr) { $(colpkr).fadeIn(500); $("#myTreeWrapper").bind("click",function(){ updateColors(); $(colpkr).fadeOut(500);}); return false; },
		onHide: function (colpkr) { $(colpkr).fadeOut(500); $(document).unbind("click"); updateColors(); return false; },
		onChange: function (hsb, hex, rgb) { $("#colorParentSelected").css("backgroundColor", "#" + hex); }
	});
	$("#colorSelected").ColorPicker({
		color: "#FBEC5D",
		onShow: function (colpkr) { $(colpkr).fadeIn(500); $("#myTreeWrapper").bind("click",function(){ updateColors(); $(colpkr).fadeOut(500);}); return false; },
		onHide: function (colpkr) { $(colpkr).fadeOut(500); $(document).unbind("click"); updateColors(); return false; },
		onChange: function (hsb, hex, rgb) { $("#colorSelected").css("backgroundColor", "#" + hex); }
	});
}

function zoomIn() {
	zoom = Math.max(0,zoom+10);
	applyZoom();
    $("#zoomValue").html(zoom);
		myTree.updateTree();
}

function zoomOut() {
	zoom = Math.max(0,zoom-10);
	applyZoom();
    $("#zoomValue").html(zoom);
		myTree.updateTree();
}

function bindKeys(){
	$(document).keydown(function(e){
		if (e.keyCode == 107) { if (myTree != null && !$("#queryInput").is(":focus")){ zoomIn(); return true; } }	//add
		else if (e.keyCode == 109) { if (myTree != null && !$("#queryInput").is(":focus")){ zoomOut(); return true; } } //subtract
		else if (e.keyCode == 40) { if (myTree != null && !$("#queryInput").is(":focus")){ moveUp(); return true; } } //up (reverse)
		else if (e.keyCode == 38) { if (myTree != null && !$("#queryInput").is(":focus")){ moveDown(); return true; } } //down (reverse)
		else if (e.keyCode == 39) { if (myTree != null && !$("#queryInput").is(":focus")){ moveLeft(); return true; } } //left (reverse)
		else if (e.keyCode == 37) { if (myTree != null && !$("#queryInput").is(":focus")){ moveRight(); return true; } } //right (reverse)
	});
}

/****************************** TRANSITIONS ******************************/
function from0to1() {
	$("#step0").hide();
	$("#step1").show();
	myProgram.setSize(null,503);
	myProgram.refresh();
	myProgram.focus();
}

function from1to2() {
	if (myProgram.getValue().trim().length < 1)
		showErrorMessage1(BAD_PROGRAM);
	else if ($("#taState").val().length < 1)
		showErrorMessage1(BAD_STATE);
	else {
		$("#drawSlicedGraph").hide();
		$("#drawSlicedGraphText").text("");
		disableControls1();
		doInitialization(myProgram.getValue().trim(),$("#taState").val().trim());
	}
}

function from2to1() {
	hideErrorMessages2();
	hideErrorMessages1();
	$("#step2").hide();
	$("#step1").show();
	closeGraphWindows();
	menuInteractive();
	lockMode(false);
	myTree = null;
	autoselect = false;
    autodelete = false;
    drawing = null;
	isWorking = false;
	expanding = 0;
	zoom = 100;
	modName= null;
	isFullMaude = null;
}

function from1to0() {
	hideErrorMessages1();	
	$("#step1").hide();
	$("#step0").show();
	$("#selectExample").val("none");
	$("#selectExample").trigger("change");
}

/****************************** STEP 1 ******************************/
function disableProgram(flag){
	myProgram.setOption("readOnly",flag)
	$(".CodeMirror").css({"background-color":flag?"#EEEEEE":"white"});
}

function enableControls1(){
	$("#bUpload").removeClass("disabled");
	$(".bootstrap-select").find(".dropdown-toggle").removeClass("disabled");
	$("#bBack1").removeClass("disabled");
	$("#bNext1").removeClass("disabled");
	$("#taState").removeAttr("readonly");
	disableProgram(false);
	$("#loader1").hide();
	isWorking = false;
}

function disableControls1(){
	hideErrorMessages1();
	isWorking = true;
	$("#loader1").show();
	$("#taState").attr("readonly","readonly");
	disableProgram(true);
	$("#bNext1").addClass("disabled");
	$("#bBack1").addClass("disabled");
	$(".bootstrap-select").find(".dropdown-toggle").addClass("disabled");
	$("#bUpload").addClass("disabled");
}

function showErrorMessage1(error){
	hideErrorMessages1();
	switch(error) {
		case BAD_FILE:
			error = "Please provide a valid Maude <strong>program</strong> or <strong>zip file</strong>."; 
			break;
		case BAD_PROGRAM:
			error = "Please provide a valid Maude <strong>program</strong>."; 
			break;
		case BAD_STATE: 
			error = "Please provide a valid <strong>initial state</strong> and try again. Notice that <strong>if your initial state contains any variables</strong>, you must specify them with the proper sort (e.g., for variable X of sort Nat write X:Nat), either when in source-level or meta-level representation.";
			break;
		case COMMANDS_DETECTED: 
			error = "<strong>Maude commands detected.</strong> Please refer to the help to provide a valid Maude program and try again.";
			break;
		case ORDER_NOT_FOUND: 
			error = "<strong>File <i>order.ijulienne</i> not found.</strong> Please refer to the help to provide a valid zip file and try again.";
			break;
		case FILE_NOT_FOUND: 
			error = "File listed in order.ijulienne <strong>not found or incorrect.</strong> Please refer to the help to provide a valid file and try again.";
			break;
		default: 
			error = "Please provide a valid Maude <strong>program</strong> and <strong>initial state</strong> and try again."; 
	}
	$("#alertStep1Text").html(error);
	$("#alertStep1").show();
}

function hideErrorMessages1() {
	$("#alertStep1").hide();
	$("#alertStep1").stop(true, true);
}

function helpStep1(){
	window.open("help-provide.html","Anima Help","width=950,height=800");
}

function loadProgram() {
	$("#alertStep1").hide();
	var example = document.getElementById("selectExample").value;
	var state = document.getElementById("taState");
	
	if (example != "none") {
		$("#bUpload").addClass("disabled");
		
		var loadProgram = function(xmlhttp){ myProgram.setValue(xmlhttp.responseText); };
		var loadState = function(xmlhttp){ state.value = xmlhttp.responseText; };

		loadXMLDoc("examples/" + example + ".program", loadProgram);
		loadXMLDoc("examples/" + example + ".state", loadState);
	}
	else {
		$("#bUpload").removeClass("disabled");
		myProgram.setValue("");
		state.value = "";
	}
}

/****************************** STEP 2 ******************************/
function enableControls2(){
	$("#loader2").hide();
	isWorking = false;
}

function disableControls2(){
	hideErrorMessages2();
	isWorking = true;
	$("#loader2").show();
}

function showErrorMessage2(error){
	hideErrorMessages2();
	switch(error){
        case NO_EXPAND: 
        	error = "<strong>No expand possible:</strong> no rule or equation matches the state"; 
        	break;
        case NO_EXPPAR: 
        	error = "<strong>No expand possible:</strong> no rule or equation matches the state with the given criteria"; 
        	break;
        case NO_BULLET: 
        	error = "Only <strong>relevant</strong> information can be selected as a slicing criterion"; 
        	break;
        case QUERY_EMP:
        	error = "No <strong>valid</strong> querying pattern specified"; 
        	break;
        case QUERY_NOR: 
        	error = "<strong>No matches found</strong> for the specified querying pattern"; 
        	break;
        case QUERY_ERR: 
        	error = "There is an <strong>error</strong> in the provided pattern"; 
        	break;
        default: 
        	error = "Ops! something went wrong in Anima.";
	}
	$("#alertStep2").html(error);
	$("#alertStep2").css("width",""+ Math.max(200,(($("#alertStep2").text().length + 1) * 7.2)) +"px");
	$("#alertStep2").show();
	$("#alertStep2").fadeOut(10000);
}

function hideErrorMessages2() {
	$("#alertStep2").hide();
	$("#alertStep2").stop(true, true);
}

function toggleMenuOption(id){
	var flag = $(id).is(":visible");
	flag?$(id).css("display","none"):$(id).css("display","inline");
	return !flag;
}

function setMenuOption(id,flag){
	flag?$(id).css("display","inline"):$(id).css("display","none");
}

function menuInteractive(){
	if (!isLocked && !isWorking){
		if (!$("#opIScheck").is(":visible")){
			$("#opIScheck").css("display","inline");
			$("#opPScheck").css("display","none");
			$("#opFWcheck").css("display","none");
		}
		myTree.mode = MODE_STEPPER;
		$("#drawSlicedGraph").hide();
		$("#drawSlicedGraphText").text("");
	}
}

function menuPartial(){
	if (!isLocked && !isWorking){
		if (!$("#opPScheck").is(":visible")){
			$("#opIScheck").css("display","none");
			$("#opPScheck").css("display","inline");
			$("#opFWcheck").css("display","none");
		}
		myTree.mode = MODE_PARTIAL;
		$("#drawSlicedGraphText").text("Draw Ω-graph");
		try {
			if (sgWindow != null && sgWindow.myGraph != null){
				sgWindow.myGraph.isPartial = true; 
				sgWindow.myGraph.refresh();
			}
		}
		catch(ex){
			console.error("ERROR#2: "+ex);
		}
		$("#drawSlicedGraph").show();
	}
}

function menuForward(){
	if (!isLocked && !isWorking){
		if (!$("#opFWcheck").is(":visible")){
			$("#opIScheck").css("display","none");
			$("#opPScheck").css("display","none");
			$("#opFWcheck").css("display","inline");
		}
		myTree.mode = MODE_FORWARD;
		$("#drawSlicedGraphText").text("Draw sliced graph");
		try {
			if (sgWindow != null && sgWindow.myGraph != null){
				sgWindow.myGraph.isPartial = false; 
				sgWindow.myGraph.refresh();
			}
		} 
		catch(ex){
			console.error("ERROR#3: "+ex);
		}
		$("#drawSlicedGraph").show();
	}
}

function toggleInstrumentedSteps(flag){
	myTree.isInstrumented = flag;
    if (myTree != null && myTree.dbNodes != null){
		var nodes = myTree.dbNodes;
		for(var i = 0; i < nodes.length; i++){
			if (!nodes[i].isNormalized)
				nodes[i].isVisible = flag;
		}
		var selected = myTree.getNode(myTree.iSelectedNode);
		if (selected == null || !selected.isVisible)
			myTree.selectNode(selected.nid,true,true);	
		else {
			myTree.updateTree();
			centerTree(myTree.iSelectedNode,true);
		}
	}
}

function menuInstrumentedSteps(){
    if (toggleMenuOption("#opINcheck")){
		toggleInstrumentedSteps(true);
		$("#opINcheck").css("display","inline");
	}
	else {
		toggleInstrumentedSteps(false);
		$("#opINcheck").css("display","none");
	}
}

function menuMetaLevelView(){
	var flag = toggleMenuOption("#opVWcheck");
	parseAllCriteria();
	
	restore = null;
	myTree.isSource = !flag;
	myTree.updateTree();
	if (flag)
		$("#opVWcheck").css("display","inline");
	else
		$("#opVWcheck").css("display","none");
	centerTree(myTree.iSelectedNode,true);
}

function menuStateLabels(){
	if (toggleMenuOption("#opSLcheck")){
		myTree.showState = true;
		$(".animaNodeID").show();
		$("#opSLcheck").css("display","inline");
	}
	else {
		myTree.showState = false;
		$(".animaNodeID").hide();
		$("#opSLcheck").css("display","none");
	}
}

function menuRuleLabels(){
	if (!$("#menuRule").hasClass("disabled")){
		if (toggleMenuOption("#opRLcheck")){
			myTree.showRule = true;
			$(".animaEdge").show();
			$("#opRLcheck").css("display","inline");
		}
		else {
			myTree.showRule = false;
			$(".animaEdge").hide();
			$("#opRLcheck").css("display","none");
		}
	}
}

function menuRedexes(){
	if (!$("#menuRedex").hasClass("disabled")){
		if (toggleMenuOption("#opRXcheck")){
			myTree.showRedex = true;
			$(".context").css("visibility","visible");
			$("#opRXcheck").css("display","inline");
		}
		else {
			myTree.showRedex = false;
			$(".context").css("visibility","hidden");
			$("#opRXcheck").css("display","none");
		}
	}
}

function menuRestoreTree() {
	menuClearCriteria();
	var nroot = myTree.getNormalizedRoot();
	lockMode(false);
	nroot.sli = false;
	restorePreviousSlice(nroot.id);
	myTree.fold(nroot.id,true);
}

function menuClearCriteria(){
	for(var i = 0; i < myTree.dbNodes.length; i++)
		myTree.dbNodes[i].criteria = [];
	highlightQueryResults();
}

function menuShowProgram() {
	var ele = document.getElementById("taProgram2");
	var spec = myProgram.getValue().trim().replace(/[ ][ ]/g," ").replace(/\r\n/g,"\n").replace(/\n/g,"ELPNEWLINE");
	$("#taProgram2").text(spec);
	ele.innerHTML = ele.innerHTML.replace(/ELPNEWLINE/g,"<br>");
	$("#myProgramWindow").modal("show");
	resizeModalWindow($("#myProgramWindow"),$("#programWindowWrapper"),$("#taProgram2"));
}

function menuDrawGraph(){
	var title = myTree.isInstrumented?"Instrumented computation graph":"Computation graph";
	cgWindow = window.open("graph.html",title,"width=950,height=800,toolbar=no",false);
}

function menuDrawSlicedGraph(){
	var title = (myTree.mode == MODE_PARTIAL)?(myTree.isInstrumented?"Instrumented Ω-graph":"Ω-graph"):(myTree.isInstrumented?"Instrumented sliced graph":"Sliced graph");
	sgWindow = window.open("graph.html",title,"width=950,height=800,toolbar=no",false);
}

function menuHelp(){
	window.open("help-animate.html","Anima Help","width=950,height=800",false);
}

function refreshVisibleInfo(){
	updateColors();
	if (myTree.showState){
		$(".animaNodeID").show();
		$("#opSLcheck").css("display","inline");
	} 
	else {
		$(".animaNodeID").hide();
		$("#opSLcheck").css("display","none");
	}
	if (myTree.showRule){
		$(".animaEdge").show();
		$("#opRLcheck").css("display","inline");
	} 
	else {
		$(".animaEdge").hide();
		$("#opRLcheck").css("display","none");
	}
	if (myTree.showRedex){
		$(".context").css("visibility","visible");
		$("#opRXcheck").css("display","inline");
	} 
	else {
		$(".context").css("visibility","hidden");
		$("#opRXcheck").css("display","none");
	}
}

/****************************** ANIMA TREE ******************************/
function enableHighlighting(){
	$(".animaNode").each(function() {
    	$("#"+this.id).textHighlighter();
    	$("#"+this.id).removeClass("doNotSelect");
	});
	$("#taSlice").textHighlighter();
}

function restorePreviousSlice(nodeid) {
	var node = myTree.getNode(nodeid);
	node.slice = node.orig;
}

function savePreviousSlice(nodeid) {
	var node = myTree.getNode(nodeid);
	if (node.canExpand){
        node.orig = node.slice;
	}
}

function expandID(nodeid,counter){
	hideContextMenu();
	if (!isWorking){
		disableControls2();
		if (myTree.mode == MODE_PARTIAL)
			doPartial(myProgram.getValue().trim(),nodeid,counter);
		else if (myTree.mode == MODE_FORWARD)
			doForward(myProgram.getValue().trim(),nodeid,counter);
		else
			doInteractive(myProgram.getValue().trim(),nodeid,counter);
	}
}

function lockMode(flag){
	//Locks current working mode
	if (flag) {
		switch(myTree.mode){
			case MODE_PARTIAL:
				$("#mode1").addClass("disabled");
				$("#mode2").removeClass("disabled");
				$("#mode3").addClass("disabled");
				break;
			case MODE_FORWARD:
				$("#mode1").addClass("disabled");
				$("#mode2").addClass("disabled");
				$("#mode3").removeClass("disabled");
				break;
			default:
				$("#mode1").removeClass("disabled");
				$("#mode2").addClass("disabled");
				$("#mode3").addClass("disabled");
		}
	}
	else {
		$("#mode1").removeClass("disabled");
		$("#mode2").removeClass("disabled");
		$("#mode3").removeClass("disabled");
	}
	isLocked = flag;
}

function restoreZoom() {
	hideContextMenu();
	zoom = 100;
	applyZoom();
    $("#zoomValue").html(zoom);
    myTree.updateTree();
    centerTree(myTree.iSelectedNode>0?myTree.iSelectedNode:0,true);
}

function applyZoom() {
	hideContextMenu();
	$("#myTreeContainer").css("-ms-transform","scale("+(zoom/100)+","+(zoom/100)+")");
	$("#myTreeContainer").css("-webkit-transform","scale("+(zoom/100)+","+(zoom/100)+")");
	$("#myTreeContainer").css("-moz-transform","scale("+(zoom/100)+","+(zoom/100)+")");
	centerTree(myTree.iSelectedNode>0?myTree.iSelectedNode:0,true);
}

function toggleMenu() {
	$("#menu").clearQueue();
	var flag = ($("#menuContainer").css("visibility") == "hidden");
	if (flag) {
		$("#menuContainer").css("visibility","visible");
    	$("#menu").animate({ height: "206px" }, 250, function() { });
    }
    else {
        $("#menu").animate({ height: "0px" }, 250, function() { $("#menuContainer").css("visibility","hidden"); });
    }
}

function centerTree(nodeid,animation) {
	if (myTree != null){
		hideContextMenu();
		if (nodeid == null || nodeid < 0)
			nodeid = 0;
		
		var node = myTree.getNode(nodeid);
		
		if (!node.isVisible)
			node = myTree.getNode(node.nid);
		
		var nodeW = ((myTree.isSource?node.w:node.wm) - 2);
		var nodeH = ((myTree.isSource?node.h:node.hm) - 2);

		var nodeT = parseInt(document.getElementById(node.id).style.top.slice(0,-2));
		var nodeL = parseInt(document.getElementById(node.id).style.left.slice(0,-2));

		var wrapperW = $("#myTreeWrapper").width()-4;
		var wrapperH = $("#myTreeWrapper").height()-4;
		
		var diffW = ((zoom/100) - 1) * ($("#myTreeContainer").width()/2 - (nodeW/2 + nodeL));
		var diffH = ((zoom/100) - 1) * ($("#myTreeContainer").height()/2 - (nodeH/2 + nodeT));
	
		if (animation){
			$("#myTreeContainer").animate({top: (((wrapperH-nodeH)/2 - nodeT + diffH)) +"px", left: (((wrapperW-nodeW)/2 - nodeL + diffW)) +"px"});
		}
		else {
				$("#myTreeContainer").css("top",((wrapperH-nodeH)/2 - nodeT + diffH));
				$("#myTreeContainer").css("left",((wrapperW-nodeW)/2 - nodeL + diffW));
		}
	}
}

function applySubIndexStyle(str) {
	str = str.replace(/•([0-9]+)/g,"<span class=\"bullet\">•<sub>$1</sub></span>");
	str = str.replace(/◦([0-9]+)/g,"<span class=\"bullet\">◦<sub>$1</sub></span>");
	return str;
}

function showRedex(nodeid) {
	if (nodeid === undefined)
		nodeid = myTree.iSelectedNode;
	
	if (nodeid > 0)
		highlightRedexPosition(nodeid);
}

function mIndexOf(res,pos,mpos){
	if (mpos == null)
		return res.indexOf(pos);
	
	for(var i = 0; i < mpos.length; i++)
		if (res == mpos[i] || res.indexOf(mpos[i]+" . ") != -1)
			return 0;
	return -1;
}

function moveLeft() {
	hideContextMenu();
	var pos = parseInt($("#myTreeContainer").css("left").slice(0,-2));
	$("#myTreeContainer").css("left",(pos-20) +"px");
}

function moveRight() {
	hideContextMenu();
	var pos = parseInt($("#myTreeContainer").css("left").slice(0,-2));
	$("#myTreeContainer").css("left",(pos+20) +"px");
}

function moveUp() {
	hideContextMenu();
	var pos = parseInt($("#myTreeContainer").css("top").slice(0,-2));
	$("#myTreeContainer").css("top",(pos-20) +"px");
}

function moveDown() {
	hideContextMenu();
	var pos = parseInt($("#myTreeContainer").css("top").slice(0,-2));
	$("#myTreeContainer").css("top",(pos+20) +"px");
}

function showInstrumentedSteps(nodeid,draw){
	var node = myTree.getNode(nodeid);
	var parent = node.nodeParent;
	while(parent != null && !parent.isNormalized){
		parent.isVisible = draw;
		parent = parent.nodeParent;
	}
	var selected = myTree.getNode(myTree.iSelectedNode);
	if (selected == null || !selected.isVisible)
		myTree.selectNode(node.id,true,true);	
	else {
		myTree.updateTree();
		centerTree(myTree.iSelectedNode,true);
	}
}

function trustedMode() {
	myTree.trusted = !myTree.trusted;
	reloadTrace();		
}

function generateTraceTable(nodeid){
	hideContextMenu();
    idtraced = nodeid;
    myTree.trusted?$("#bTrustedMode").text("Untrusted mode"):$("#bTrustedMode").text("Trusted mode");
	var mode = document.getElementById("selectTraceMode").value;
	var node = myTree.getNode(nodeid);
	$("#traceWindowContent").html(myTree.getTraceHTML(node,(mode == "trace-medium")?TRACE_MEDIUM:((mode == "trace-small")?TRACE_SMALL:TRACE_LARGE)));
	$("#myTraceWindow").modal("show");
	resizeModalWindow($("#myTraceWindow"),$("#traceWindowWrapper"),$("#traceWindowContent"));
	$("#spanTraceWindowTitle").text("Trace information" + (myTree.trusted?" (trusted mode)":""));
}

function reloadTrace() {
	myTree.trusted?$("#bTrustedMode").text("Untrusted mode"):$("#bTrustedMode").text("Trusted mode");
	var mode = document.getElementById("selectTraceMode").value;
    var node = myTree.getNode(idtraced);
	$("#traceWindowContent").html(myTree.getTraceHTML(node,(mode == "trace-medium")?TRACE_MEDIUM:((mode == "trace-small")?TRACE_SMALL:TRACE_LARGE)));
    resizeModalWindow($("#myTraceWindow"),$("#traceWindowWrapper"),$("#traceWindowContent"));
    $("#spanTraceWindowTitle").text("Trace information" + (myTree.trusted?" (trusted mode)":""));
}

function colorSlicedStateMeta(str){
	str = str.replace(/'#\![0-9]+:[a-zA-z][^`{0}\],]+/g,"ELPSINMRK$&ELPSOUMRK");
	while(str.indexOf("`[") != -1)
		str = str.replace("`[","ELPPAIMRK");
	while(str.indexOf("`]") != -1)
		str = str.replace("`]","ELPPAOMRK");
	while(str.indexOf("`,") != -1)
		str = str.replace("`,","ELPCOMMRK");
	while(str.indexOf("`\'") != -1)
		str = str.replace("`\'","ELPAPOMRK");
	
	var bullets = str.match(/ELPSINMRK.*?ELPSOUMRK/g);
	if (bullets != null)
		for(var i = 0; i < bullets.length; i++)
			str = str.replace(/ELPSINMRK.*?ELPSOUMRK/, "ELPBULLET"+i);
	str = str.replace(/'[^\[\]']+\[(ELPBULLET[0-9]+)+(,ELPBULLET[0-9]+)*]/g,"ELPSINMRK$&ELPSOUMRK");
	if (bullets != null)
		for(var i = bullets.length-1; i >= 0; i--)
			str = str.replace("ELPBULLET"+i,bullets[i]);
	
	while(str.indexOf("ELPPAIMRK") != -1)
		str = str.replace("ELPPAIMRK","`[");
	while(str.indexOf("ELPPAOMRK") != -1)
		str = str.replace("ELPPAOMRK","`]");
	while(str.indexOf("ELPCOMMRK") != -1)
		str = str.replace("ELPCOMMRK","`,");
	while(str.indexOf("ELPAPOMRK") != -1)
		str = str.replace("ELPAPOMRK","`\'");
	while(str.indexOf("ELPSINMRK") != -1)
		str = str.replace("ELPSINMRK","<span class=\"bullet\">");
	while(str.indexOf("ELPSOUMRK") != -1)
		str = str.replace("ELPSOUMRK","</span>");
	return str;
}

function exportTrace(){
    var node = myTree.getNode(myTree.iSelectedNode);
    var res = "";
    if (node != null) {
        if (!node.isNormalized)
            node = myTree.getNode(node.nid);
        var rule = (node.rule.type == "builtIn")?null:node.rule.meta;
        var state = null;
        node = node.nodeParent;
        while(node != null && node.pid != -1){
            if (node.isNormalized)
                state = node.term.meta;
            if (rule != null && state != null){
                res = ("{ "+state+",'"+myTree.nodeType+","+rule+"}\n")+res;
                rule = null;
                state = null;
            }
            if (node.rule.type != "builtIn")
                rule = node.rule.meta;
            node = node.nodeParent;
        }
    }
    return res.trim();
}

function showStatistics(nodeid){
	var node = myTree.getNode(nodeid);
	var stats = node.countNodes();
	var titleHTML = node.sli?("<sup>"+(myTree.mode == MODE_PARTIAL?"◦":"•")+"</sup><sub style=\"margin: -4px;\">"+node.id+"</sub>"):("<sub>"+node.id+"</sub>");
	var expandHTML = getExpandText(stats[2].sort(function(a,b){return a-b;}));
	var dist = myTree.getDistance(node);
	
	$("#statisticsState").html(titleHTML);
	$("#dStatistics1").text(dist);
	$("#dStatistics2").text(stats[0]);
	$("#dStatistics3").text(stats[1]);
	$("#dStatistics4").text((stats[0]+stats[1]));
	$("#dStatistics5").html(expandHTML);
	$("#myStatisticsWindow").modal("show");
	resizeModalWindow($("#myStatisticsWindow"),$("#statisticsWindowWrapper"),$("#statisticsWindowContent"));
}

function getExpandText(states){
	if (states == null || states.length == 0)
		return "-";
	
	var res = "";
	for(var i = 0; i < states.length; i++){
		node = myTree.getNode(states[i]);
		if (myTree.getNode(states[i]).sli)
			res+="s<sup>•</sup><sub style=\"margin: -4px;\">"+states[i]+"</sub> , ";
		else
			res+="s<sub>"+states[i]+"</sub>, ";
	}
	if (res.length > 1)
		res = res.slice(0,-2);
	else
		res = "-";
	return res;
}

/* CONTEXT MENU */
function hideContextMenu() {
	$("#contextMenu").hide();
	$(".animaContextMenuOption").each(function() {
    	$("#"+this.id).removeClass("disabled");
	});
}
function menuExpandNode() {
	if (!$("#ctxExpandNode").hasClass("disabled")) {
		expandID(menunode.id,0);
	}
}

function menuExpandSubTree() {
	if (!$("#menuExpandSubTree").hasClass("disabled")) {
		expandID(menunode.id,MAX_EXPAND);
	}
}

function menuFoldNode() {
	if (!$("#menuFoldNode").hasClass("disabled")) {
		var nroot = myTree.getNormalizedRoot();
		if (menunode.id == nroot.id){
			lockMode(false);
			nroot.sli = false;
		}
		restorePreviousSlice(menunode.id);
		myTree.fold(menunode.id,true);
		hideContextMenu();
	}
}

function menuShowState() {
	if (!$("#menuShowState").hasClass("disabled")) {
		showStateInfoWindow(menunode.id);
	}
}

function menuShowTransition() {
	if (!$("#menuShowTransition").hasClass("disabled"))
		showRuleInfoWindow(menunode.id);
}

function menuInspectCondition() {
	if (!$("#menuInspectCondition").hasClass("disabled"))
		showCondInfoWindow(menunode.id);
}

function menuInspectConditionSlice() {
	if (!$("#menuInspectConditionSlice").hasClass("disabled"))
		showCondSliceInfoWindow(menunode.id);
}

function menuShowTrace() {
	if (!$("#menuShowTrace").hasClass("disabled")) {
		if (menunode.id != myTree.iSelectedNode)
			myTree.selectNode(menunode.id,true,true);
		generateTraceTable(menunode.id);
	}
}

function menuExportTrace() {
	inode = myTree.getNode(menunode.id);
	window.open(IJULIENNE_WEBSITE);
}

function menuDrawTerm() {
	drawing = menunode.slice.meta;
	window.open("draw.html");
}

function menuStatistics() {
	if (!$("#menuStatistics").hasClass("disabled"))
		showStatistics(menunode.id);
}

function inspectCondition(nodeid,idx){
	var node = myTree.getNode(nodeid); 
	icond = node.getConditionAt(idx);
	icsli = null;
	window.open(IJULIENNE_WEBSITE);
}

function inspectConditionSlice(nodeid,idx){
	var node = myTree.getNode(nodeid); 
	icond = node.getConditionAt(idx);
	icsli = node.getConditionSliceAt(idx);
	window.open(IJULIENNE_WEBSITE);
}

/* INFO WINDOW */
function showRuleInfoWindow(nodeid) {
	hideContextMenu();
	var node = myTree.getNode(nodeid);
	if (node.id != myTree.iSelectedNode)
		myTree.selectNode(node.id,true,true);	
	
	$("#myInfoWindow").modal("show");
	$("#spanInfoWindowTitle").text("Transition information from state sANIMA-ID1 to sANIMA-ID2");
	$("#spanInfoWindowTitle").html($("#spanInfoWindowTitle").html().replace("sANIMA-ID1","s<sub style=\"font-family: monospace;\">"+node.getParent().id+"</sub>"));
	$("#spanInfoWindowTitle").html($("#spanInfoWindowTitle").html().replace("sANIMA-ID2","s<sub style=\"font-family: monospace;\">"+node.id+"</sub>"));
	
    var rule = node.getRule();
	(myTree.isSource)? $("#dInfoRule").html(convertHTMLSymbols(rule.source)) : $("#dInfoRule").html(convertHTMLSymbols(rule.meta));
    (rule.type == "builtIn" || rule.type =="equation")? $("#dInfoRuleTitle").text("Normalized Equation") : $("#dInfoRuleTitle").text("Normalized Rule");
	
    $("#dInfoSubstitution").html(convertHTMLSymbols(node.getSubText(false)));
	$("#dInfoSubstitution").html($("#dInfoSubstitution").html().replace(/ELP-SUBSEP/g,"<br>").replace(/ELP-SUBSLASH/g," <- "));
	if (node.isNormalized && (node.nodeParent != node.getParent())){
		$("#dInfoPositionTitle").html("");
		$("#dInfoPosition").html("");
	}
	else {
		$("#dInfoPositionTitle").html("Position");
		$("#dInfoPosition").html(convertHTMLSymbols(node.getPosition()));
	}
	$("#dInfoPosition").html($("#dInfoPosition").html().replace("Lambda&nbsp;.&nbsp;",""));
	resizeModalWindow($("#myInfoWindow"),$("#infoWindowWrapper"),$("#infoWindowContent"));
}

function showCondInfoWindow(nodeid) {
	hideContextMenu();
	var node = myTree.getNode(nodeid);
	if (node.id != myTree.iSelectedNode)
		myTree.selectNode(node.id,true,true);	
	
	$("#myCondWindow").modal("show");
	$("#spanCondWindowTitle").text("Condition information from transition sANIMA-ID1 to sANIMA-ID2");
	$("#spanCondWindowTitle").html($("#spanCondWindowTitle").html().replace("sANIMA-ID1","s<sub style=\"font-family: monospace;\">"+node.getParent().id+"</sub>"));
	$("#spanCondWindowTitle").html($("#spanCondWindowTitle").html().replace("sANIMA-ID2","s<sub style=\"font-family: monospace;\">"+node.id+"</sub>"));
	
	var cond = node.getCondition();
	var html = "";
	for(var i = 0; i < cond.length; i++){
    	var lhs = "" + (myTree.isSource?cond[i].lhs:cond[i].lhsmeta);
    	var rhs = "" + (myTree.isSource?cond[i].rhs:cond[i].rhsmeta);
    	var conector = (cond[i].type == TYPE_MB)?" : ":((cond[i].type == TYPE_EQ)?" = ":(cond[i].type == TYPE_MA)?" := ":" => ");
    	html += "<div class=\"condListItemH\">Condition "+(i+1)+" <button type=\"button\" class=\"btn btn-primary pull-right condButton\" onclick=\"inspectCondition("+node.id+","+i+")\">Inspect</button></div>";
    	html += "<div class=\"condListItem\">" + convertHTMLSymbols(lhs + conector + rhs)+"</div><br>";
    }
    $("#dCondList").html(html);
    resizeModalWindow($("#myCondWindow"),$("#condWindowWrapper"),$("#condWindowContent"));
}

function showCondSliceInfoWindow(nodeid) {
	hideContextMenu();
	var node = myTree.getNode(nodeid);
	if (node.id != myTree.iSelectedNode)
		myTree.selectNode(node.id,true,true);	
	
	$("#myCondSliceWindow").modal("show");
	$("#spanCondSliceWindowTitle").text("Condition information from transition sANIMA-BULLETANIMA-ID1 to sANIMA-BULLETANIMA-ID2");
	$("#spanCondSliceWindowTitle").html($("#spanCondSliceWindowTitle").html().replace("ANIMA-ID1","<sub style=\"font-family: monospace; margin-left: -7px;\">"+node.getParent().id+"</sub>"));
	$("#spanCondSliceWindowTitle").html($("#spanCondSliceWindowTitle").html().replace("ANIMA-ID2","<sub style=\"font-family: monospace; margin-left: -7px;\">"+node.id+"</sub>"));
	$("#spanCondSliceWindowTitle").html($("#spanCondSliceWindowTitle").html().replace(/ANIMA-BULLET/g,"<sup style=\"font-family: monospace;\">•</sup>"));
	
	var cond = node.getConditionSlice();
	var html = "";
	var condstr;
	for(var i = 0; i < cond.length; i++){
    	var lhs = "" + (myTree.isSource?cond[i].lhs:cond[i].lhsmeta);
    	var rhs = "" + (myTree.isSource?cond[i].rhs:cond[i].rhsmeta);
    	var conector = (cond[i].type == TYPE_MB)?" : ":((cond[i].type == TYPE_EQ)?" = ":(cond[i].type == TYPE_MA)?" := ":" => ");
    	html += "<div class=\"condListItemH\">Condition "+(i+1)+" <button type=\"button\" class=\"btn btn-primary pull-right condButton\" onclick=\"inspectConditionSlice("+node.id+","+i+")\">Inspect</button></div>";
    	html += "<div class=\"condListItem\">" + convertHTMLSymbols(lhs + conector + rhs)+"</div><br>";
    }
    $("#dCondSliceList").html(html);
    resizeModalWindow($("#myCondSliceWindow"),$("#condSliceWindowWrapper"),$("#condSliceWindowContent"));
}

function showStateInfoWindow(nodeid) {
	hideContextMenu();
	var node = myTree.getNode(nodeid);
	if (node.id != myTree.iSelectedNode)
		myTree.selectNode(node.id,true,true);	
	
	$("#myStateWindow").modal("show");
	$("#spanStateWindowTitle").text("Detailed information of state sANIMA-ID1");
	$("#spanStateWindowTitle").html($("#spanStateWindowTitle").html().replace("sANIMA-ID1","s<sub style=\"font-family: monospace;\">"+node.id+"</sub>"));
	
	if (node.sli){
		$("#taInfoTitle").show();
		$("#taSliceTitle").show();
		$("#taSlice").show();
		$("#taInfo").html(convertHTMLSymbols(myTree.isSource?node.term.source:node.term.meta));
		$("#taSlice").html($("#"+nodeid).html());
	}
	else{
		$("#taInfoTitle").hide();
		$("#taSliceTitle").hide();
		$("#taSlice").hide();
		$("#taInfo").html($("#"+nodeid).html());
	}
	resizeModalWindow($("#myStateWindow"),$("#stateWindowWrapper"),$("#stateWindowContent"));
}

function updateColors() {
	myTree.colorDefault = rgb2hex($("#colorDefault").css("background-color"));
	myTree.colorInstrumented = rgb2hex($("#colorInstrumented").css("background-color"));
	myTree.colorSliced = rgb2hex($("#colorSliced").css("background-color"));
	myTree.colorParentSelected = rgb2hex($("#colorParentSelected").css("background-color"));
	myTree.colorSelected = rgb2hex($("#colorSelected").css("background-color"));
	
	$(".animaNodeRDefault").css("background-color",myTree.colorDefault);
	$(".animaNodeRInstrumented").css("background-color",myTree.colorInstrumented);
	$(".animaNodeRSliced").css("background-color",myTree.colorSliced);
	$(".animaNodeRParentSelected").css("background-color",myTree.colorParentSelected);
	$(".animaNodeRSelected").css("background-color",myTree.colorSelected);

	$(".animaNodeDefault").css("color",idealTextColor(myTree.colorDefault));
	$(".animaNodeInstrumented").css("color",idealTextColor(myTree.colorInstrumented));
	$(".animaNodeSliced").css("color",idealTextColor(myTree.colorSliced));
	$(".animaNodeParentSelected").css("color",idealTextColor(myTree.colorParentSelected));
	$(".animaNodeSelected").css("color",idealTextColor(myTree.colorSelected));	
}

function onScroll(nodeid){
	document.getElementById(""+nodeid+"R").scrollTop = document.getElementById(""+nodeid).scrollTop;
}

function query() {
	if (!isWorking && myTree != null){
		disableControls2();
		hideErrorMessages2();
		var pattern = $("#queryInput").val().trim();
		if (pattern == null || pattern.length == 0) {
			showErrorMessage2(QUERY_EMP);
			enableControls2();
            return false;
		}
		var i = 0;
		while(pattern.indexOf("_") != -1){
			pattern = pattern.replace("_","ELPDISCARD");
			i++;
		}
		while(pattern.indexOf("?") != -1){
			pattern = pattern.replace("?","ELPIDENTIFY");
			i++;
		}
		doQuery(myProgram.getValue().trim(),getListOfStates(),pattern,getTopSorts());
	}
}