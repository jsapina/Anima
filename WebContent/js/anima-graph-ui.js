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

function initialize() {
	window.onunload = function(e) { closeWindow(); };
	bindKeys();
	initColorPickers();
	$(window).resize( function(e) { if (myGraph.canvas != null) myGraph.resize(); });
	myGraph = new AnimaGraph($("#myGraphContainer"));
	myGraph.isInstrumented = window.name.indexOf("Instrumented")!=-1; //Partial is also sliced
	myGraph.isSliced = (window.name.indexOf("Ω")!=-1 || window.name.indexOf("liced")!=-1); //Partial is also sliced
	myGraph.isPartial = window.name.indexOf("Ω")!=-1;
	if (myGraph.isInstrumented)
		menuInstrumentedSteps();
	else {
		$("#opINcheck").css("display","none");
		setWindowName();
		myGraph.loadData();
	}
	myGraph.resize();
	myGraph.canvas.addEventListener("dblclick", mouseDoubleClick, false); 
	myGraph.canvas.addEventListener("click", mouseClick, false);
}

function closeWindow() {
	if (window != null && window.opener != null && myGraph != null){
		if (myGraph.isSliced)
			window.opener.sgWindow = null;
		else
			window.opener.cgWindow = null;
	}
}

function setWindowName(){
	var title = "Anima";
	if (myGraph.isPartial)
		title = myGraph.isInstrumented?"Instrumented Ω-graph":"Ω-graph";
	else if (myGraph.isSliced)
		title = myGraph.isInstrumented?"Instrumented sliced graph":"Sliced graph";
	else 
		title = myGraph.isInstrumented?"Instrumented computation graph":"Computation graph"; 
	$("#animaToolTitle").text(title);
}

function bindKeys(){
	$(document).bind("mousewheel", function(e){
		if (myGraph != null){
			if(e.originalEvent.wheelDelta /120 > 0)
        		zoomIn();
			else
				zoomOut();
		}
    });
	$(document).keydown(function(e){
		if (e.keyCode == 107) { if (myGraph != null){ zoomIn(); return true; } }	//add
		else if (e.keyCode == 109) { if (myGraph != null){ zoomOut(); return true; } } //subtract
		//else if (e.keyCode == 40) { if (myGraph != null){ moveUp(); return true; } } //up (reverse)
		//else if (e.keyCode == 38) { if (myGraph != null){ moveDown(); return true; } } //down (reverse)
		//else if (e.keyCode == 37) { if (myGraph != null){ moveLeft(); return true; } } //left
		//else if (e.keyCode == 39) { if (myGraph != null){ moveRight(); return true; } } //right
	});
}

function initColorPickers() {
	$("#colorDefault").ColorPicker({
		color: "#FFFFFF",
		onShow: function (colpkr) { $(colpkr).fadeIn(500); $("#canvas").bind("click",function(){updateColors(); $(colpkr).fadeOut(500);}); return false; },
		onHide: function (colpkr) { $(colpkr).fadeOut(500); $(document).unbind("click"); updateColors(); return false; },
		onChange: function (hsb, hex, rgb) { $("#colorDefault").css("backgroundColor", "#" + hex); }
	});
	$("#colorInstrumented").ColorPicker({
		color: "#8CFFC5",
		onShow: function (colpkr) { $(colpkr).fadeIn(500); $("#canvas").bind("click",function(){updateColors(); $(colpkr).fadeOut(500);}); return false; },
		onHide: function (colpkr) { $(colpkr).fadeOut(500); $(document).unbind("click"); updateColors(); return false; },
		onChange: function (hsb, hex, rgb) { $("#colorInstrumented").css("backgroundColor", "#" + hex); }
	});
	$("#colorSelected").ColorPicker({
		color: "#FBEC5D",
		onShow: function (colpkr) { $(colpkr).fadeIn(500); $("#canvas").bind("click",function(){updateColors(); $(colpkr).fadeOut(500);}); return false; },
		onHide: function (colpkr) { $(colpkr).fadeOut(500); $(document).unbind("click"); updateColors(); return false; },
		onChange: function (hsb, hex, rgb) { $("#colorSelected").css("backgroundColor", "#" + hex); }
	});
}

function updateColors() {
	myGraph.colorDefault = rgb2hex($("#colorDefault").css("background-color"));
	myGraph.colorInstrumented = rgb2hex($("#colorInstrumented").css("background-color"));
	myGraph.colorSelected = rgb2hex($("#colorSelected").css("background-color"));
	tick();
}

/* OPTIONS MENU */
function toggleMenuOption(id){
	var flag = $(id).is(":visible");
	flag?$(id).css("display","none"):$(id).css("display","inline");
	return !flag;
}

function menuInstrumentedSteps(){
    if (toggleMenuOption("#opINcheck")){
    	myGraph.isInstrumented = true;
		$("#opINcheck").css("display","inline");
	}
	else {
		myGraph.isInstrumented = false;
		$("#opINcheck").css("display","none");
	}
    setWindowName();
    myGraph.refresh();
}

function menuRuleLabels(){
	if (toggleMenuOption("#opRLcheck")){
		myGraph.showRule = true;
		$(".animaEdge").show();
		$("#opRLcheck").css("display","inline");
	}
	else {
		myGraph.showRule = false;
		$(".animaEdge").hide();
		$("#opRLcheck").css("display","none");
	}
	tick();
}

function zoomIn() {
	var zoom = Math.min(300,myGraph.zoom+10);
	var factor = (zoom == myGraph.zoom)?1:1.1;
	myGraph.zoom = zoom;
	applyZoom(factor);
    $("#zoomValue").html(myGraph.zoom);
}

function zoomOut() {
	var zoom = Math.max(10,myGraph.zoom-10);
	var factor = (zoom == myGraph.zoom)?1:(10/11);
	myGraph.zoom = zoom;
	applyZoom(factor);
    $("#zoomValue").html(myGraph.zoom);
}

function restoreZoom() {
	var factor = myGraph.factor;
	applyZoom(1/myGraph.factor);
	myGraph.zoom = 100;
	centerGraph(factor);
	$("#zoomValue").html(myGraph.zoom);
}

function applyZoom(factor) {
	var x = myGraph.canvas.width/2;
	var y = myGraph.canvas.height/2;
	
	myGraph.ctx.translate(x,y);
	myGraph.ctx.scale(factor,factor);
	myGraph.ctx.translate(-x,-y);
	
	myGraph.factor = myGraph.factor * factor;
	tick();
}

function moveUp() {
	myGraph.ctx.translate(0,-10);
	myGraph.top+=10*myGraph.factor;
	tick();
}

function moveDown() {
	myGraph.ctx.translate(0,10);
	myGraph.top-=10*myGraph.factor;
	tick();
}

function moveLeft() {
	myGraph.ctx.translate(-10,0);
	myGraph.left -= 10*myGraph.factor;
	tick();
}

function moveRight() {
	myGraph.ctx.translate(10,0);
	myGraph.left += 10*myGraph.factor;
	tick();
}

function centerGraph(factor) {
	for(var i = 0; i < myGraph.nodes.length; i++)
		myGraph.nodes[i].fixed = false;
	myGraph.ctx.translate(-myGraph.left,myGraph.top);
	myGraph.top = 0;
	myGraph.left = 0;
	tick();
}