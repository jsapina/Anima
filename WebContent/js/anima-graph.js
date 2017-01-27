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

var myGraph;
var TYPE_RL = "rule";
var TYPE_EQ = "equation";
var TYPE_BI = "builtIn";

AnimaGraph = function (container) {
	this.container = container;
	this.self = this;

	this.offsetLeft = 10;
	this.offsetTop = 50;
	
	this.canvas = document.getElementById("canvas"); 
	this.ctx = this.canvas.getContext("2d");
	
	this.nodes = [];
	this.links = [];
	
	this.dragging = false;
	this.dragHoldX = null;
	this.dragHoldY = null;
	this.dragNode = null;
	this.selectedNode = null;
	
	this.colorDefault = "#FFFFFF";
	this.colorInstrumented = "#8CFFC5";
	this.colorSliced = "#E0E0E0";
	this.colorSelected = "#FBEC5D";
	
	this.showRule = true;
	this.isInstrumented = true;
	
	this.force = null;
	this.isSliced = false;
	this.isPartial = false;
	
	this.zoom = 100;
	this.factor = 1;
	this.top = 0;
	this.left = 0;
};

AnimaGraph.prototype.refresh = function () {
	setWindowName();
	myGraph.loadData();
	myGraph.draw();
};

AnimaGraph.prototype.loadData = function () {
	var data = null;
	if (window != null && window.opener != null)
		data = window.opener.getGraphData(myGraph.isSliced,myGraph.isInstrumented);
	if (data != null){
		this.nodes = data[0];
		this.links = data[1];
	}
	else {
		//Placeholders
		this.nodes = [{name: "S0,S1", type: "root instrumented"},   //0
		              {name: "S2", type: "default"},				//1
		              {name: "S3,S4,S5", type: "instrumented"},		//2
		              {name: "S6", type: "instrumented"},			//3
		              {name: "S7", type: "default"},				//4
		              {name: "S8", type: "default"}];				//5
		this.links = [{"source":  0, "target":  2, type: TYPE_EQ, label: "equation1, equation2"},
		              {"source":  0, "target":  3, type: TYPE_EQ, label: "equation3"},
		              {"source":  2, "target":  4, type: TYPE_BI, label: "toBnf"},
		              {"source":  3, "target":  4, type: TYPE_BI, label: "builtIn"},
		              {"source":  4, "target":  1, type: TYPE_BI, label: "fromBnf"},
		              {"source":  1, "target":  5, type: TYPE_RL, label: "rule1"},
		              {"source":  5, "target":  1, type: TYPE_RL, label: "rule2"},
					  {"source":  5, "target":  5, type: TYPE_RL, label: "rule3"}];
	}
};

AnimaGraph.prototype.resize = function () {
	this.canvas.width = myGraph.container.width();
    this.canvas.height = myGraph.container.height();
    this.draw();
};

AnimaGraph.prototype.draw = function () {
	if (this.force != null)
		this.force.stop();
	this.force = d3.layout.force().nodes(this.nodes).links(this.links).size([this.canvas.width, this.canvas.height]).linkDistance(125).charge(-500).on("tick", tick).start();
    this.canvas.onmousedown = mouseDownListener;
};

AnimaGraph.prototype.drawEdge = function(edge) {
	this.ctx.strokeStyle = "#000000";
	this.ctx.beginPath();
	this.ctx.lineWidth = 2;
	var arrowLength=8;
	var angle = Math.PI/6;
	
	if (edge.source == edge.target) {
		var radius = getRadius(edge.source);
		var centerX = edge.source.x;
		var centerY = edge.source.y - radius - 10;
		
		var arrowX = centerX - (15 * Math.cos(0.25*Math.PI));
		var arrowY = centerY + (15 * Math.sin(0.25*Math.PI));
		
		this.ctx.moveTo(arrowX, arrowY);
		this.ctx.arc(centerX,centerY,15,0.70*Math.PI,0.3*Math.PI,false);
		this.ctx.moveTo(arrowX, arrowY);
		this.ctx.lineTo(arrowX-(8*Math.cos(angle/2)),arrowY-(8*Math.sin(angle/2)));
		this.ctx.moveTo(arrowX, arrowY);
		this.ctx.lineTo(arrowX,arrowY-(8*Math.cos(angle/2)));
		this.ctx.fillStyle = (edge.type == TYPE_BI)?"#929292":((edge.type == TYPE_EQ)?"#0000FF":"#FF0000");
		this.ctx.fillText(edge.label, centerX-(this.ctx.measureText(edge.label).width/2),centerY-22);
		this.ctx.stroke();
		
	}
	else {
		var diffX = edge.target.x - edge.source.x;
		var diffY = edge.target.y - edge.source.y;
		var length = Math.sqrt(diffX * diffX + diffY * diffY);
		var radius = getRadius(edge.target);
		var theta = Math.atan2(diffY, diffX) + Math.PI;
		var targetX = (edge.target.x - ((diffX * radius) / length)) + Math.cos(theta);
		var targetY = (edge.target.y - ((diffY * radius) / length)) + Math.sin(theta);
		
		var angle1=theta+angle;
		var topx=Math.round(targetX+Math.cos(angle1)*arrowLength);
		var topy=Math.round(targetY+Math.sin(angle1)*arrowLength);
	
		var angle2=theta-angle;
		var botx=Math.round(targetX+Math.cos(angle2)*arrowLength);
		var boty=Math.round(targetY+Math.sin(angle2)*arrowLength);
	
		this.ctx.moveTo(edge.source.x, edge.source.y);
		this.ctx.lineTo(targetX, targetY);
		this.ctx.moveTo(topx,topy);
		this.ctx.lineTo(targetX,targetY);
		this.ctx.lineTo(botx,boty);
		this.ctx.stroke();
		if (this.showRule)
			this.drawEdgeText(edge,diffX,diffY);
	}
};

AnimaGraph.prototype.drawEdgeText = function(edge,diffX,diffY) {
	this.ctx.save();
	this.ctx.translate(edge.source.x+diffX*1/2,edge.source.y+diffY*1/2);
	this.ctx.rotate(Math.atan2(diffY,diffX) - ((diffX < 0)?Math.PI:0));
	this.ctx.fillStyle = (edge.type == TYPE_BI)?"#929292":((edge.type == TYPE_EQ)?"#0000FF":"#FF0000");
	this.ctx.fillText(edge.label, -(this.ctx.measureText(edge.label).width/2),(diffX < 0)?12:-7);
	this.ctx.restore();
};

AnimaGraph.prototype.drawNode = function(node){
	this.ctx.moveTo(node.x, node.y);
	this.ctx.beginPath();
	this.ctx.lineWidth = 2;
	this.ctx.arc(node.x, node.y, getRadius(node), 0, 2 * Math.PI);
	if (node.type.indexOf("root") != -1)
		this.ctx.lineWidth = 5;
	if (this.dragNode == node){
		this.ctx.fillStyle = myGraph.colorSelected;
		this.ctx.strokeStyle = "#FF0000";
	}
	else {
		this.ctx.strokeStyle = "#000000";
		if (node.type.indexOf("sliced") != -1)
			this.ctx.fillStyle = this.colorSliced;
		else if (node.type.indexOf("instrumented") != -1)
			this.ctx.fillStyle = this.colorInstrumented;
		else
			this.ctx.fillStyle = this.colorDefault;
	}
	this.ctx.fill();
	this.ctx.stroke();
	this.drawNodeText(node);
};

AnimaGraph.prototype.drawNodeText = function(node){
	if (myGraph.dragNode == node)
		this.ctx.fillStyle = idealTextColor(myGraph.colorSelected);
	else if (node.type.indexOf("instrumented") != -1)
		this.ctx.fillStyle = idealTextColor(myGraph.colorInstrumented);
	else
		this.ctx.fillStyle = idealTextColor(myGraph.colorDefault);
	this.ctx.font = "bold 10px arial";
	var text = node.name.split(",");
	var lines = (getRadius(node)*2)/(this.ctx.measureText("S").width);
	var idx = (lines-(text.length/2))/2;
	var height = this.ctx.measureText("S").width/2;
	
	if (text.length == 1)
		this.ctx.fillText(text[0], (node.x - (this.ctx.measureText(text[0]).width/2)) ,(node.y + height));
	else {
		for(var i = 0; i < text.length; i+=2){
			var posy = (node.y - getRadius(node)*2 + ((idx+1) * (10+height)));
			if (i == text.length-1)
				this.ctx.fillText(text[i], (node.x - (this.ctx.measureText(text[i]).width/2)) ,posy);
			else
				this.ctx.fillText(text[i]+","+text[i+1], (node.x - (this.ctx.measureText(text[i]+","+text[i+1]).width/2)) ,posy);
			idx++;
		}
	}
	this.ctx.fillStyle = "#000000";
};

AnimaGraph.prototype.hit = function(posX,posY) {
	var cx = this.canvas.width/2;
	var cy = this.canvas.height/2;
	
	posX = cx - (cx - posX) / this.factor; 
	posY = cy - (cy - posY) / this.factor;
	
	posX -= this.left;
	posY += this.top;
	
	var diffX,diffY,length;
	
	for(var i = this.nodes.length-1; i >= 0 ; i--){
		diffX = posX - this.nodes[i].x;
	    diffY = posY - this.nodes[i].y;
	    length = Math.sqrt(diffX * diffX + diffY * diffY);
		if (length <= getRadius(this.nodes[i]))
			return this.nodes[i];
	}
	return null;
};

function tick() {
	myGraph.ctx.clearRect(-2500,-2500,5000,5000);
	myGraph.links.forEach(function(edge) { myGraph.drawEdge(edge); });
	myGraph.nodes.forEach(function(node) { myGraph.drawNode(node); });
}

function getRadius(d){
	var matches = d.name.match(/,/g);
	matches = (matches == null)?0:matches.length;
	return 25+(3*matches);
}

function mouseClick(e) {
	var boundR = myGraph.canvas.getBoundingClientRect();
	var mouseX = (e.clientX - boundR.left)*(myGraph.canvas.width/boundR.width);
	var mouseY = (e.clientY - boundR.top)*(myGraph.canvas.height/boundR.height);
	var node = myGraph.hit(mouseX,mouseY);
	try {
		var selNode = parseInt(node.name.split(',')[0].slice(1));
		if (window.opener.myTree.iSelectedNode != selNode)
			window.opener.myTree.selectNode(selNode,true,true,true);
	}
	catch (ex){	}
}

function mouseDoubleClick(e) {
	var boundR = myGraph.canvas.getBoundingClientRect();
	var mouseX = (e.clientX - boundR.left)*(myGraph.canvas.width/boundR.width);
	var mouseY = (e.clientY - boundR.top)*(myGraph.canvas.height/boundR.height);
	var node = myGraph.hit(mouseX,mouseY);
	if (node != null)
		node.fixed = false;
}

function mouseDownListener(e) {
	var boundR = myGraph.canvas.getBoundingClientRect();
	var mouseX = (e.clientX - boundR.left)*(myGraph.canvas.width/boundR.width);
	var mouseY = (e.clientY - boundR.top)*(myGraph.canvas.height/boundR.height);
	myGraph.dragNode = myGraph.hit(mouseX,mouseY);
	if (myGraph.dragNode != null){
		myGraph.dragNode.fixed = true;
		myGraph.dragging = true;
		myGraph.dragHoldX = mouseX - myGraph.dragNode.px;
		myGraph.dragHoldY = mouseY - myGraph.dragNode.py;
		window.addEventListener("mousemove", mouseMoveListener, false);
	}
	myGraph.canvas.removeEventListener("mousedown", mouseDownListener, false);
	window.addEventListener("mouseup", mouseUpListener, false);
	
	if (e.preventDefault) { e.preventDefault(); }
	else if (e.returnValue) { e.returnValue = false; }
	return false;
}

function mouseUpListener(e) {
	myGraph.canvas.addEventListener("mousedown", mouseDownListener, false);
	window.removeEventListener("mouseup", mouseUpListener, false);
	if (myGraph.dragging) {
		var cx = myGraph.canvas.width;
		var cy = myGraph.canvas.height;
		var boundR = myGraph.canvas.getBoundingClientRect();
		var mouseX = (e.clientX - boundR.left)*(cx/boundR.width);
		var mouseY = (e.clientY - boundR.top)*(cy/boundR.height);
		mouseX = ((cx/2) - ((cx/2) - mouseX) / myGraph.factor) - myGraph.left;
		mouseY = ((cy/2) - ((cy/2) - mouseY) / myGraph.factor) + myGraph.top;
		
		myGraph.dragNode.x = mouseX;
		myGraph.dragNode.px = mouseX;
		myGraph.dragNode.y = mouseY;
		myGraph.dragNode.py = mouseY;
		myGraph.dragging = false;
		window.removeEventListener("mousemove", mouseMoveListener, false);
	}
	myGraph.force.start();
}

function mouseMoveListener(e) {
	if (myGraph.dragNode != null) {
		var cx = myGraph.canvas.width;
		var cy = myGraph.canvas.height;
		var boundR = myGraph.canvas.getBoundingClientRect();
		var mouseX = (e.clientX - boundR.left)*(cx/boundR.width);
		var mouseY = (e.clientY - boundR.top)*(cy/boundR.height);
		mouseX = ((cx/2) - ((cx/2) - mouseX) / myGraph.factor) - myGraph.left;
		mouseY = ((cy/2) - ((cy/2) - mouseY) / myGraph.factor) + myGraph.top;
		myGraph.dragNode.x = mouseX;
		myGraph.dragNode.px = mouseX;
		myGraph.dragNode.y = mouseY;
		myGraph.dragNode.py = mouseY;
		tick();
	}
}
