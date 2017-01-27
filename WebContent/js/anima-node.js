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

/*-------------------------------------------------------------------------------------------
|     ECOTree.js
|--------------------------------------------------------------------------------------------
| (c) 2006 Emilio Cortegoso Lobato
|     
|     ECOTree is a javascript component for tree drawing. It implements the node positioning
|     algorithm of John Q. Walker II "Positioning nodes for General Trees".
|    
|     Basic features include:
|       - Layout features: Different node sizes, colors, link types, alignments, separations
|                          root node positions, etc...
|       - Nodes can include a title and an hyperlink, and a hidden metadata.
|       - Subtrees can be collapsed and expanded at will.
|       - Single and Multiple selection modes.
|       - Search nodes using title and metadata as well.     
|     
|     This code is free source, but you will be kind if you don't distribute modified versions
|     with the same name, to avoid version collisions. Otherwise, please hack it!
|
|     References:
|                                                                
|     Walker II, J. Q., "A Node-Positioning Algorithm for General Trees"
|	     			   Software Practice and Experience 10, 1980 553-561.    
|                      (Obtained from C++ User's journal. Feb. 1991)                                                                              
|					   
|     Last updated: October 26th, 2006
|     Version: 1.0
\------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------
|   2014 - The ELP Group: HIGHLY Modified version for the Anima Interactive Stepper.
\------------------------------------------------------------------------------------------*/

AnimaNode = function (tree, id, pid, nid, term, slice, rule, sub, subsli, cond, condsli, pos, rdx, ctr, sli, norm, vis, counter,relev) {
	//ID and Parent ID
	this.tree = tree;
    this.id = id;
	this.pid = pid;
	this.nid = nid;
	
    this.term = term;
    this.slice = slice;
	this.orig = slice; 
    this.rule = rule;
	this.sub = sub;
	this.subsli = subsli;
	this.cond = cond;
	this.condsli = condsli;
	this.pos = pos;   		//real pos where rule was applied
    this.redex = rdx;   	//pseudo redex
	this.contractum = ctr;	//pseudo contractum 
	
	this.sli = sli; 
	this.siblingIndex = 0;
	this.dbIndex = 0;
	this.criteria = [];
	
	//dimensions
	this.w = 0;
	this.h = 0;	
	this.wm = 0;
	this.hm = 0;
	
	this.resize();
	
	this.XPosition = 0;
	this.YPosition = 0;
	this.prelim = 0;
	this.modifier = 0;
	this.leftNeighbor = null;
	this.rightNeighbor = null;
	this.nodeParent = null;	
	this.nodeChildren = [];
	
	this.isSliced = false;
	this.isSelected = false;
	this.isParentSelected = false;
	this.canExpand = norm; 	//Anima can expand the node.
	this.isNormalized = norm;
	this.isVisible = vis;
	this.counter = counter;
	this.relevant = relev;
};

AnimaNode.prototype.getTerm = function(sli){
	if (sli)
        return this.tree.isSource?this.slice.source:this.slice.meta;
    else
        return this.tree.isSource?this.term.source:this.term.meta;
};

AnimaNode.prototype.getHTML = function(sli,hide){
	if (sli) {
		if (hide) {
			var builtIn = (this.rule != null && this.rule.label == "builtIn"); 
			return this.tree.isSource?
                hideIrrelevant(convertHTMLSymbols(this.slice.source),true,this.relevant,builtIn):
                hideIrrelevant(colorSlicedStateMeta(this.slice.meta),false,this.relevant,builtIn);
		}
		else
			return this.tree.isSource?convertHTMLSymbols(this.slice.source):colorSlicedStateMeta(this.slice.meta);
	}
	else
		return this.tree.isSource?convertHTMLSymbols(this.term.source):this.term.meta;
};

AnimaNode.prototype.getSize = function(sli){
	if (sli) {
		if (!this.relevant) return 0;
		return revertHTMLSymbols(removeIrrelevant(convertHTMLSymbols(this.slice.source),true)).replace(/[ \s\t]/g,"").length;
	}
	else
		return this.term.source.replace(/[ \s\t]/g,"").length;
};

AnimaNode.prototype.getParent = function () {
	if (this.nodeParent == null)
		return null;
	if (this.nodeParent.isVisible)
		return this.nodeParent;
	return this.nodeParent.getParent();
};

AnimaNode.prototype.getRule = function () {
	if (this.isNormalized && (this.nodeParent != this.getParent())){
		var node = this;
		while(node != null && node.id != 0 && (node.rule.type == "builtIn" || node.rule.type == "equation"))
			node = node.nodeParent;
		return node.rule;
	}
	return this.rule;
};

AnimaNode.prototype.getSubstitution = function () {
	if (this.isNormalized && (this.nodeParent != this.getParent())){
		var node = this;
		while(node != null && node.id != 0 && (node.rule.type == "builtIn" || node.rule.type == "equation"))
			node = node.nodeParent;
		return node.sub;
	}
	return this.sub;
};

AnimaNode.prototype.getSubstitutionSlice = function () {
	if (this.isNormalized && (this.nodeParent != this.getParent())){
		var node = this;
		while(node != null && node.id != 0 && (node.rule.type == "builtIn" || node.rule.type == "equation"))
			node = node.nodeParent;
		return node.subsli;
	}
	return this.subsli;
};

AnimaNode.prototype.getSubText = function (isSlice) {
	var sub = isSlice?this.getSubstitutionSlice():this.getSubstitution();
    var res="";
    if (sub == null || sub.length == 0)
    	return "None";
    for(var i = 0; i < sub.length; i++){
        if (this.tree.isSource)
            res += sub[i].vr.source + " / " + sub[i].vl.source + "ELP-SUBSEP";
        else
            res += sub[i].vr.meta + " <- " + sub[i].vl.meta + "ELP-SUBSEP";
    }
    return res;
};

AnimaNode.prototype.getMaudeSub = function() {
	if (this.sub === undefined || this.sub.length == 0)
		return "none";
	var res = this.sub[0].vr.meta + " <- " + this.sub[0].vl.meta
	for (var i = 1 ; i < this.sub.length; i++)
		res += " ; " + this.sub[i].vr.meta + " <- " + this.sub[i].vl.meta;
	return res;
};

AnimaNode.prototype.getCondition = function () {
	if (this.isNormalized && !this.nodeParent.isNormalized && !this.nodeParent.isVisible){
		var node = this;
		while(node != null && node.id != 0 && (node.rule.type == "builtIn" || node.rule.type == "equation"))
			node = node.nodeParent;
		return node.cond;
	}
	return this.cond;
};

AnimaNode.prototype.getConditionSlice = function () {
	if (this.isNormalized && !this.nodeParent.isNormalized && !this.nodeParent.isVisible){
		var node = this;
		while(node != null && node.id != 0 && (node.rule.type == "builtIn" || node.rule.type == "equation"))
			node = node.nodeParent;
		return node.condsli;
	}
	return this.condsli;
};

AnimaNode.prototype.getConditionAt = function (idx) {
	var cond = this.getCondition();
	return (cond == null || cond.length <= idx)?null:cond[idx];
};

AnimaNode.prototype.getConditionSliceAt = function (idx) {
	var cond = this.getConditionSlice();
	return (cond == null || cond.length <= idx)?null:cond[idx];
};

AnimaNode.prototype.getPosition = function () {
	if (this.isNormalized && (this.nodeParent != this.getParent())){
		var node = this;
		while(node != null && node.id != 0 && (node.rule.type == "builtIn" || node.rule.type == "equation"))
			node = node.nodeParent;
		return node.pos;
	}
	return this.pos;
};

AnimaNode.prototype.getNormalized = function () {
	if (this.isNormalized)
		return this;
	return this.nodeChildren[0].getNormalized();
};

AnimaNode.prototype.isEqual = function(node){
    if (this.slice.meta != null && node != null && node.slice != null && node.slice.meta != null)
        return this.slice.meta.replace(/#\![0-9]+:/g,"") == node.slice.meta.replace(/#\![0-9]+:/g,"");
    return false;
};

AnimaNode.prototype.resize = function () {
	var WRNORM = this.id==-1?0:((this.slice.source.length > 1000)?80:42);
	var WRMETA = this.id==-1?0:((this.slice.meta.length > 1000)?80:42);

	//Simple
	if (this.id != -1 && this.slice.source.length < WRNORM){
		this.w = Math.max(140,(this.slice.source.length * 7)+8);
		$("#testHeight").width(this.w-8);
		$("#testHeight").html(this.getDescription(true));
		this.h = $("#testHeight").height()+8;
	}
	else if (this.id != -1){
		this.w = (WRNORM * 7)+8;
		$("#testHeight").width(this.w-8);
		$("#testHeight").html(this.getDescription(true));
		this.h = $("#testHeight").height()+8;
	}
	
	//Advanced
	if (this.id != -1 && this.slice.meta.length < WRMETA){
		this.wm = (this.slice.meta.length * 7)+8;
		$("#testHeight").width(this.wm-8);
		$("#testHeight").html(this.getDescription(false));
		this.hm = $("#testHeight").height()+8;
	}
	else if (this.id != -1){
		this.wm = (WRMETA * 7)+8;
		$("#testHeight").width(this.wm-8);
		$("#testHeight").html(this.getDescription(false));
		this.hm = $("#testHeight").height()+8;
	}
};

AnimaNode.prototype._getAllChildren = function () {
	var children = this.nodeChildren;
	for (var i = 0; i < this.nodeChildren.length; i++)
		children = children.concat(this.nodeChildren[i]._getAllChildren());
	return children;
};

AnimaNode.prototype._getLevel = function () {
	if (this.getParent().id == -1) {return 0;}
	else return this.getParent()._getLevel() + 1;
};

AnimaNode.prototype._getChildrenCount = function () {
    if(this.nodeChildren == null)
        return 0;
    else
        return this.nodeChildren.length;
};

AnimaNode.prototype._getLeftSibling = function () {
	if(this.leftNeighbor != null && this.leftNeighbor.getParent() == this.getParent())
		return this.leftNeighbor;
	return null;
};

AnimaNode.prototype._getRightSibling = function () {
	if(this.rightNeighbor != null && this.rightNeighbor.getParent() == this.getParent())
		return this.rightNeighbor;
	return null;
};

AnimaNode.prototype._getChildAt = function (i) {
	var node = this.nodeChildren[i];
	if (!node.isVisible){
		while(!node.isNormalized)
			node = node.nodeChildren[0];
	}
	return node;
};

AnimaNode.prototype._getChildrenCenter = function () {
    node = this._getFirstChild();
    node1 = this._getLastChild();
    return node.prelim + ((node1.prelim - node.prelim) + this.tree._getNodeSize(node1)) / 2;	
};

AnimaNode.prototype._getFirstChild = function () {
	return this._getChildAt(0);
};

AnimaNode.prototype._getLastChild = function () {
	return this._getChildAt(this._getChildrenCount() - 1);
};

AnimaNode.prototype._countChildren = function() {
	var res = [0,0,new Array()];//normalized,instrumented,canExpand,
	var aux;
	
	if (this.isNormalized)
		res[0]++;
	else
		res[1]++;
	
	if (this.canExpand)
		res[2].push(this.id);
	
	for(var i = 0; i < this.nodeChildren.length; i++){
		aux = this.nodeChildren[i]._countChildren();
		res[0] += aux[0];
		res[1] += aux[1];
		res[2] = res[2].concat(aux[2]);
	}
	return res;
};

AnimaNode.prototype.countNodes = function() {
	var res = [0,0,new Array()];//normalized,instrumented,canExpand
	var aux;
	
	if (this.canExpand)
		res[2].push(this.id);
	
	for(var i = 0; i < this.nodeChildren.length; i++){
		aux = this.nodeChildren[i]._countChildren();
		res[0] += aux[0];
		res[1] += aux[1];
		res[2] = res[2].concat(aux[2]);
	}
	return res;
};

AnimaNode.prototype._drawRootLink = function () {
	var child = this.getNormalized();
	child._drawChildNode(null,null);
};

AnimaNode.prototype._drawChildrenLinks = function () {
	var s = [];
	var xa = 0, ya = 0;
	var last = null;
	var hx = this.isVisible?(this.tree.isSource?this.h:this.hm):10;
	
	xa = this.isVisible?(this.XPosition + ((this.tree.isSource?this.w:this.wm) / 2)):(this.nodeChildren[0].XPosition + ((this.tree.isSource?this.nodeChildren[0].w:this.nodeChildren[0].wm) / 2));
	ya = this.YPosition + hx - 2;
	
	var child;
	if (this.nodeChildren != null && this.nodeChildren.length > 0){
		for (var k = 0; k < this.nodeChildren.length; k++) {
			child = this.nodeChildren[k];
			if (!child.isVisible)
				child = child.getNormalized();
			if (child.isSelected || child.isParentSelected)
				last = child;
			else
				child._drawChildNode(xa,ya);
		}
	}
	else if (this.canExpand)
		this.drawExpandArrow(xa,ya);
	if (last != null)
		last._drawChildNode(xa,ya);
	return s.join("");
};

AnimaNode.prototype.drawExpandArrow = function(xa,ya) {
	var xd = 0, yd = 0;
	xd = this.XPosition + ((this.tree.isSource?this.w:this.wm) / 2);
	yd = this.YPosition + ((this.tree.isSource?this.h:this.hm))+6;
	
	this._drawArrow(xd,yd);
	this.tree.ctx.restore();
};

AnimaNode.prototype._drawChildNode = function(xa,ya) {
	var xb = 0, yb = 0, xc = 0, yc = 0, xd = 0, yd = 0;
	xd = xc = this.XPosition + ((this.tree.isSource?this.w:this.wm) / 2);
	yd = this.YPosition;
	
	if (xa == null){
		xa = xb = xc;
		ya = yb = yc = 10;
	}
	else {
		xb = xa;
		yb = yc = yd - (this.tree.iLevelSeparation / 2) - 2;
	}
	this._drawEdge(xa,xb,xc,xd,ya,yb,yc,yd);
	this._drawArrow(xd,yd);
	this.tree.ctx.restore();
};

AnimaNode.prototype._drawEdge = function(xa,xb,xc,xd,ya,yb,yc,yd){
	this.tree.ctx.save();
	if (this.isSelected || this.isParentSelected)
		this.tree.ctx.strokeStyle = "#FF0000";
	else
		this.tree.ctx.strokeStyle = "#000000";
	this.tree.ctx.beginPath();			
	this.tree.ctx.moveTo(xa,ya);
	this.tree.ctx.lineTo(xb,yb);
	this.tree.ctx.lineTo(xc,yc);
	this.tree.ctx.lineTo(xd,yd);						
	this.tree.ctx.lineWidth = 2;
	this.tree.ctx.stroke();
	this.tree.ctx.strokeStyle = "#000000";
};

AnimaNode.prototype._drawArrow = function(xd,yd){
	if (this.isSelected || this.isParentSelected)
		this.tree.ctx.fillStyle = "#FF0000";
	else
		this.tree.ctx.fillStyle = "#000000";
	this.tree.ctx.beginPath();
	this.tree.ctx.moveTo(xd,yd-1);
	this.tree.ctx.lineTo(xd+4,yd-5);
	this.tree.ctx.lineTo(xd-4,yd-5);
	this.tree.ctx.lineTo(xd,yd-1);
	this.tree.ctx.closePath();
	this.tree.ctx.fill();
};

AnimaNode.prototype._roundedRect = function (width,height,radius) {
	this.tree.ctx.beginPath();
	this.tree.ctx.lineWidth = 2;
	this.tree.ctx.moveTo(this.XPosition,this.YPosition+radius);
	this.tree.ctx.lineTo(this.XPosition,this.YPosition+height-radius);
	this.tree.ctx.quadraticCurveTo(this.XPosition,this.YPosition+height,this.XPosition+radius,this.YPosition+height);
	this.tree.ctx.lineTo(this.XPosition+width-radius,this.YPosition+height);
	this.tree.ctx.quadraticCurveTo(this.XPosition+width,this.YPosition+height,this.XPosition+width,this.YPosition+height-radius);
	this.tree.ctx.lineTo(this.XPosition+width,this.YPosition+radius);
	this.tree.ctx.quadraticCurveTo(this.XPosition+width,this.YPosition,this.XPosition+width-radius,this.YPosition);
	this.tree.ctx.lineTo(this.XPosition+radius,this.YPosition);
	this.tree.ctx.quadraticCurveTo(this.XPosition,this.YPosition,this.XPosition,this.YPosition+radius);
	this.tree.ctx.fill();
	this.tree.ctx.stroke();
};

AnimaNode.prototype.getDescription = function(isSource){
	if (isSource) {
		if (this.sli)
			return applySubIndexStyle(convertHTMLSymbols(this.slice.source));
		else
			return convertHTMLSymbols(this.term.source);
	}
	else {
		if (this.sli)
			return convertHTMLSymbols(this.slice.meta);
		else
			return convertHTMLSymbols(this.term.meta);	
	}
};

AnimaNode.prototype.getBackgroundClass = function(){
	if (this.isSelected)
		return " animaNodeRSelected";
	if (this.isSliced)
		return " animaNodeRSliced";
	if (!this.isNormalized)
		return " animaNodeRInstrumented";
	if (this.isParentSelected)
		return " animaNodeRParentSelected";
	return " animaNodeRDefault";
};

AnimaNode.prototype.getForegroundClass = function(){
	if (this.isSelected)
		return " animaNodeSelected";
	if (this.isSliced)
		return " animaNodeSliced";
	if (!this.isNormalized)
		return " animaNodeInstrumented";
	if (this.isParentSelected)
		return " animaNodeParentSelected";
	return " animaNodeDefault";
};

AnimaNode.prototype.getBorderClass = function(){
	if (this.isSelected || this.isParentSelected || this.getNormalized().isSelected || this.getNormalized().isParentSelected)
		return " animaNodePath";
	return "";
};

AnimaNode.prototype.clearCriteria = function() {
	this.criteria = [];
};

AnimaNode.prototype.addCriteria = function(pos) {
	this.criteria.push(pos);
};

AnimaNode.prototype.delCriteria = function(pos) {
	if (pos instanceof Array){
		for(var i = 0; i < pos.length; i++){
			var idx = this.criteria.indexOf(pos[i]);
			if (idx > -1)
				this.criteria.splice(idx,1);
		}
	}
	else {
		var idx = this.criteria.indexOf("pos");
		if (idx > -1)
			this.criteria.splice(idx,1);
	}
};