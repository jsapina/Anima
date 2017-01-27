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

AnimaTree = function (container) {
	this.container = document.getElementById(container);
	this.self = this;
	this.ctx = null;
	this.canvasoffsetTop = 0;
	this.canvasoffsetLeft = 0;

	this.isTree = true;
	this.isInstrumented = false;
	this.isSource = true;
	this.showState = true; 
	this.showRule = true;
	this.showRedex = true;
	this.iMaxDepth = 50000;
	this.iLevelSeparation = 30;
	this.iSiblingSeparation = 5;
	this.iSubtreeSeparation = 5;
	
	this.colorDefault = "#FFFFFF";
	this.colorInstrumented = "#8CFFC5";
	this.colorSliced = "#E0E0E0";
	this.colorParentSelected = "#FFF2A8";
	this.colorSelected = "#FBEC5D";
	
	this.maxLevelHeight = [];
	this.maxLevelWidth = [];
	this.minLevelHeight = [];
	this.minLevelWidth = [];
	this.previousLevelNode = [];
	
	this.rootYOffset = 0;
	this.rootXOffset = 0;
	this.minXPos = 0;
	
	this.dbNodes = [];
	this.tmapIDs = {};
	
	this.root = new AnimaNode(this, -1, null, null, 2, 2);
	this.iSelectedNode = -1;
	this.iLastSearch = 0;
	this.nodeType = null;
	this.kinds = null;
	this.mode = MODE_STEPPER;
	this.root.relevant = true;
	
	this.trusted = true;
};

AnimaTree.prototype._positionTree = function () {	
	this.minXPos = 0;
	this.maxLevelHeight = [];
	this.maxLevelWidth = [];
	this.previousLevelNode = [];		
	AnimaTree._firstWalk(this.self, this.root, 0);
	this.rootXOffset = this.root.XPosition;
	this.rootYOffset = this.root.YPosition;	
	AnimaTree._secondWalk(this.self, this.root, 0, 0, 0);
	if (this.minXPos < 0){
		this.minXPos = Math.abs(this.minXPos)+1;
		for (var i=0; i<this.dbNodes.length; i++)
			this.dbNodes[i].XPosition += this.minXPos;
	}
};

AnimaTree.prototype._setLevelHeight = function (node, level) {	
	if (this.maxLevelHeight[level] == null) 
		this.maxLevelHeight[level] = 0;
	this.maxLevelHeight[level] = Math.max(this.maxLevelHeight[level],this.isSource?node.h:node.hm);    
};

AnimaTree.prototype._setLevelWidth = function (node, level) {
	if (this.maxLevelWidth[level] == null) 
		this.maxLevelWidth[level] = 0;
	this.maxLevelWidth[level] = Math.max(this.maxLevelWidth[level],this.isSource?node.w:node.wm);
};

AnimaTree.prototype._setNeighbors = function(node, level) {
    node.leftNeighbor = this.previousLevelNode[level];
    if(node.leftNeighbor != null)
        node.leftNeighbor.rightNeighbor = node;
    this.previousLevelNode[level] = node;	
};

AnimaTree.prototype._getNodeSize = function (node) {
	return this.isSource?node.w:node.wm;
};

AnimaTree.prototype._getLeftmost = function (node, level, maxlevel) {
    if(level >= maxlevel) return node;
    if(node._getChildrenCount() == 0) return null;
    
    var n = node._getChildrenCount();
    for(var i = 0; i < n; i++) {
        var iChild = node._getChildAt(i);
        var leftmostDescendant = this._getLeftmost(iChild, level + 1, maxlevel);
        if(leftmostDescendant != null)
            return leftmostDescendant;
    }

    return null;	
};

AnimaTree.prototype._selectNodeInt = function (dbindex, flagToggle) {
	if ((this.iSelectedNode != dbindex) && (this.iSelectedNode != -1))
		this.dbNodes[this.iSelectedNode].isSelected = false;
	this.iSelectedNode = (this.dbNodes[dbindex].isSelected && flagToggle) ? -1 : this.dbNodes[dbindex].id;
	this.dbNodes[dbindex].isSelected = (flagToggle) ? !this.dbNodes[dbindex].isSelected : true;
	
	for(var i = 0; i < this.dbNodes.length; i++){
		if (i != dbindex)
			this.dbNodes[i].isSelected = false;
		this.dbNodes[i].isParentSelected = false;
	}
	
	var aux = this.dbNodes[dbindex].nodeParent;
	var flag = this.dbNodes[dbindex].isSelected;
	
	while (aux != null){ 
		aux.isParentSelected = flag;
		aux = aux.nodeParent;
	}
};

AnimaTree.prototype._selectAllInt = function (flag,upd) {
	var node = null;
	for (var k = 0; k < this.dbNodes.length; k++) { 
		node = this.dbNodes[k];
		node.isSelected = flag;
		node.isParentSelected = flag;
	}	
	this.iSelectedNode = -1;
	if (upd)
		this.updateTree();
};

AnimaTree._firstWalk = function (tree, node, level) {
	var leftSibling = null;
	
    node.XPosition = 0;
    node.YPosition = 0;
    node.prelim = 0;
    node.modifier = 0;
    node.leftNeighbor = null;
    node.rightNeighbor = null;
    tree._setLevelHeight(node, level);
    tree._setLevelWidth(node, level);
    tree._setNeighbors(node, level);
    if(node._getChildrenCount() == 0 || level == tree.iMaxDepth) {
        leftSibling = node._getLeftSibling();
        if(leftSibling != null)
        	node.prelim = leftSibling.prelim + tree._getNodeSize(leftSibling) + tree.iSiblingSeparation;
        else
            node.prelim = 0;
    }
    else {
        var n = node._getChildrenCount();
        for(var i = 0; i < n; i++) {
            var iChild = node._getChildAt(i);
            AnimaTree._firstWalk(tree, iChild, level + 1);
        }
        var midPoint = node._getChildrenCenter(tree);
        midPoint -= tree._getNodeSize(node) / 2;
        leftSibling = node._getLeftSibling();
        if(leftSibling != null) {
            node.prelim = leftSibling.prelim + tree._getNodeSize(leftSibling) + tree.iSiblingSeparation;
            node.modifier = node.prelim - midPoint;
            var firstChild = node._getFirstChild();
            var firstChildLeftNeighbor = firstChild.leftNeighbor;
            var j = 1;
            for(var k = tree.iMaxDepth - level; firstChild != null && firstChildLeftNeighbor != null && j <= k;) {
                var modifierSumRight = 0;
                var modifierSumLeft = 0;
                var rightAncestor = firstChild;
                var leftAncestor = firstChildLeftNeighbor;
                for(var l = 0; l < j; l++) {
                    rightAncestor = rightAncestor.getParent();
                    leftAncestor = leftAncestor.getParent();
                    modifierSumRight += rightAncestor.modifier;
                    modifierSumLeft += leftAncestor.modifier;
                }

                var totalGap = (firstChildLeftNeighbor.prelim + modifierSumLeft + tree._getNodeSize(firstChildLeftNeighbor) + tree.iSubtreeSeparation) - (firstChild.prelim + modifierSumRight);
                if(totalGap > 0) {
                    var subtreeAux = node;
                    var numSubtrees = 0;
                    for(; subtreeAux != null && subtreeAux != leftAncestor; subtreeAux = subtreeAux._getLeftSibling())
                        numSubtrees++;
                    if(subtreeAux != null) {
                        var subtreeMoveAux = node;
                        var singleGap = totalGap / numSubtrees;
                        for(; subtreeMoveAux != leftAncestor; subtreeMoveAux = subtreeMoveAux._getLeftSibling()) {
                            subtreeMoveAux.prelim += totalGap;
                            subtreeMoveAux.modifier += totalGap;
                            totalGap -= singleGap;
                        }
                    }
                }
                j++;
                if(firstChild._getChildrenCount() == 0)
                    firstChild = tree._getLeftmost(node, 0, j);
                else
                    firstChild = firstChild._getFirstChild();
                if(firstChild != null)
                    firstChildLeftNeighbor = firstChild.leftNeighbor;
            }
        } 
        else {            	
            node.prelim = midPoint;
        }
    }	
};

AnimaTree._secondWalk = function (tree, node, level, X, Y) {
	if(level <= tree.iMaxDepth) {
		node.XPosition = tree.rootXOffset + node.prelim + X;
		node.YPosition = tree.rootYOffset + Y;

		if(node._getChildrenCount() != 0)
			AnimaTree._secondWalk(tree, node._getFirstChild(), level + 1, X + node.modifier, Y + tree.maxLevelHeight[level] + tree.iLevelSeparation);
		var rightSibling = node._getRightSibling();
		if(rightSibling != null)
			AnimaTree._secondWalk(tree, rightSibling, level, X, Y);
	}
	node.XPosition = 1+node.XPosition;
	node.YPosition = node.YPosition;
	if (node.XPosition < tree.minXPos)
		tree.minXPos = node.XPosition;
};

AnimaTree.prototype._drawTree = function () {
	var s = [];
	var node = null;
	
	for (var n = 0; n < this.dbNodes.length; n++) { 
		node = this.dbNodes[n];
		var wx = this.isSource?node.w:node.wm;
		var hx = this.isSource?node.h:node.hm;
		
		if (node.isVisible) {
			//Canvas part...
			this.ctx.save();
			this.ctx.strokeStyle = (node.isSelected || node.isParentSelected)?"#FF0000":"#000000";
			this.ctx.restore();
			
			//HTML part (minus)...
			if(node.id > 0 && ((node.pid == 0 && !this.getNode(node.pid).isNormalized) || (!node.isNormalized && this.getNode(node.pid).isNormalized))){
				if (node.isSelected || node.isParentSelected)
					s.push("<div id=\"d" + node.id + "\" class=\"animaEdgeInstSel doNotDrag zoomChildren\" onclick=\"showInstrumentedSteps("+ node.nid +",false)\" style=\"top: "+(node.YPosition+this.canvasoffsetTop-24)+"px; left:"+(node.XPosition+this.canvasoffsetLeft+(wx/2)-7)+"px;\" ");
				else
					s.push("<div id=\"d" + node.id + "\" class=\"animaEdgeInst doNotDrag zoomChildren\" onclick=\"showInstrumentedSteps("+ node.nid +",false)\" style=\"top: "+(node.YPosition+this.canvasoffsetTop-24)+"px; left:"+(node.XPosition+this.canvasoffsetLeft+(wx/2)-7)+"px;\" ");
				s.push(">-</div>");
			}
			
			//HTML part (plus)...
			if(node.id > 0 && node.isNormalized && this.getNode(node.pid) != null && this.getNode(node.pid).nid == node.id && !this.getNode(node.pid).isVisible){
				if (node.isSelected || node.isParentSelected)
					s.push("<div id=\"d" + node.id + "\" class=\"animaEdgeInstSel doNotDrag zoomChildren\" onclick=\"showInstrumentedSteps("+ node.id +",true)\" style=\"top: "+(node.YPosition+this.canvasoffsetTop-24)+"px; left:"+(node.XPosition+this.canvasoffsetLeft+(wx/2)-7)+"px;\" ");
				else
					s.push("<div id=\"d" + node.id + "\" class=\"animaEdgeInst doNotDrag zoomChildren\" onclick=\"showInstrumentedSteps("+ node.id +",true)\" style=\"top: "+(node.YPosition+this.canvasoffsetTop-24)+"px; left:"+(node.XPosition+this.canvasoffsetLeft+(wx/2)-7)+"px;\" ");
				s.push(">+</div>");
			}
			
			//HTML part (rule)...
			var rule = node.getRule();
			if (rule != null){
				if (rule.type == "builtIn")
					s.push("<div id=\"e" + node.id + "\" class=\"animaEdge hyphenate doNotDrag zoomChildren\" onclick=\"showRuleInfoWindow("+ node.id +")\" style=\"top: "+(node.YPosition+this.canvasoffsetTop-16)+"px; left:"+(1+node.XPosition+this.canvasoffsetLeft+(wx/2)+8)+"px; color: #929292;\" ");
				s.push("<div id=\"e" + node.id + "\" class=\"animaEdge hyphenate doNotDrag zoomChildren\" onclick=\"showRuleInfoWindow("+ node.id +")\" style=\"top: "+(node.YPosition+this.canvasoffsetTop-16)+"px; left:"+(1+node.XPosition+this.canvasoffsetLeft+(wx/2)+8)+"px; color: #FF0033;\" ");
				if (rule == null || rule.label == null || rule.label.length == 0)
					s.push("></div>");
				else if (rule.label == "flattening")
					s.push(">toBnf</div>");
				else if (rule.label == "unflattening")
					s.push(">fromBnf</div>");
				else if (rule.label == "builtIn")
					s.push(">builtIn</div>");
				else if (rule.type == "equation")
					s.push(">" + (rule.source[0] == "c"?"c":"")+("eq: ")+rule.label+"</div>");
				else
					s.push(">" + (rule.source[0] == "c"?"c":"")+("rl: ")+rule.label+"</div>");
			}
			//HTML part (redex)...
			s.push("<div id=\"" + node.id + "R\" class=\"animaNodeR hyphenate doNotDrag doSelect context-menu-one box menu-1 zoomChildren"+node.getBackgroundClass()+"\" style=\"top: "+(node.YPosition+this.canvasoffsetTop-1)+"px; left:"+(node.XPosition+this.canvasoffsetLeft-1)+"px; width:"+(wx)+"px;\" ");
			s.push(">"+node.getDescription(this.isSource)+"</div>");
			
			//HTML part (state)...
			s.push("<div id=\"" + node.id + "\" class=\"animaNode hyphenate doNotDrag doSelect context-menu-one box menu-1 zoomChildren"+node.getForegroundClass()+node.getBorderClass()+"\" onScroll=\"onScroll("+node.id+")\" style=\"top: "+(node.YPosition+this.canvasoffsetTop-1)+"px; left:"+(node.XPosition+this.canvasoffsetLeft-1)+"px; width:"+(wx)+"px;\" ");
			s.push(">"+node.getDescription(this.isSource)+"</div>");
			
			//HTML part (id)...
			if (node.isNormalized)
				s.push("<div id=\"idnode" + node.id + "\" class=\"animaNodeID"+(node.canExpand?" animaNodeIDExp ":" ")+"doNotDrag zoomChildren\" style=\"top: "+(node.YPosition+this.canvasoffsetTop-16)+"px; left:"+(1+node.XPosition+this.canvasoffsetLeft)+"px;\" ");
			else	
				s.push("<div id=\"idnode" + node.id + "\" class=\"animaNodeID doNotDrag zoomChildren\" style=\"color: #929292; top: "+(node.YPosition+this.canvasoffsetTop-16)+"px; left:"+(1+node.XPosition+this.canvasoffsetLeft)+"px;\" ");
			if (node.canExpand)
				s.push("onclick=\"expandID("+node.id+")\"");
			s.push(">");
			if (node.sli) {
				s.push("<span class=\"doNotDrag sIDNode\">s</span>");
				if (this.mode == MODE_PARTIAL)
					s.push("<span class=\"doNotDrag bIDNode\">◦</span>");
				else
					s.push("<span class=\"doNotDrag bIDNode\">•</span>");
				s.push("<span class=\"doNotDrag nIDNode\">"+node.id+"</span>");
			}
			else {
				s.push("<span class=\"doNotDrag sIDNode\" style=\"left: 0px;\">s</span>");
				s.push("<span class=\"doNotDrag nIDNode\" style=\"left: 0px;\">"+node.id+"</span>");
			}
			s.push("</div>");
			if (node.isNormalized && node.canExpand && wx != 0){
				s.push("<div id=\"arrow" + node.id + "\" class=\"animaDownArrow\" style=\"top: "+ (node.YPosition+this.canvasoffsetTop+hx-3) +"px; left: "+ (node.XPosition+this.canvasoffsetLeft+(wx/2)-5) +"px;\" onclick=\"expandID("+node.id+")\"></div>");
			}
			s.push(node._drawChildrenLinks());
		}
		else if (node.id == 0 && !node.isVisible)
			s.push(node._drawRootLink());
	}	
	return s.join("");	
};

AnimaTree.prototype.toString = function () {	
	return "<canvas id=\"AnimaCanvas\" class=\"doNotSelect\" width=5000 height=2500></canvas>";
};

// AnimaTree API begins here...
AnimaTree.prototype.add = function(id, pid, nid, term, slice, rule, sub, subsli, cond, condsli, pos, rdx, ctr, sli, norm, vis, counter,relev){
	sub = (sub == null || sub.length == 0)?[]:sub;
	subsli = (subsli == null || subsli.length == 0)?[]:subsli;
	cond = (cond == null || cond.length == 0)?[]:cond;
	condsli = (condsli == null || condsli.length == 0)?[]:condsli;
	pos = (pos.length == 0)?"Lambda":pos;
	ctr = (ctr === undefined || ctr.length == 0)?"Lambda":ctr;
	rdx = (rdx === undefined || rdx.length == 0)?"Lambda":rdx;
	counter = Math.max(0,counter-1);
	    
	var pnode = null; //Search for parent node in database
	if (pid == -1)
		pnode = this.root;
	else {
		for (var k = 0; k < this.dbNodes.length; k++) {
			if (this.dbNodes[k].id == pid) {
				pnode = this.dbNodes[k];
				break;
			}
		}
	}
	var node = new AnimaNode(this, id, pid, nid, term, slice, rule, sub, subsli, cond, condsli, pos, rdx, ctr, sli, norm, vis, counter,relev);
	node.nodeParent = pnode;
	var i = this.dbNodes.length;	//Save it in database
	node.dbIndex = this.tmapIDs[id] = i;	 
	this.dbNodes[i] = node;	
	var h = pnode.nodeChildren.length; //Add it as child of its parent
	node.siblingIndex = h;
	pnode.nodeChildren[h] = node;
	pnode.canExpand = false;
};

AnimaTree.prototype.updateTree = function () {	
	this._positionTree();
	this.container.innerHTML = this;
	var canvas = document.getElementById("AnimaCanvas");
	if (canvas && canvas.getContext)  {
		this.canvasoffsetLeft = canvas.offsetLeft;
		this.canvasoffsetTop = canvas.offsetTop;
		canvas.width = this.getWidth()+2;
		canvas.height = this.getHeight()+30;
		this.ctx = canvas.getContext("2d");
		var h = this._drawTree();
		var r = this.container.ownerDocument.createRange();
		r.setStartBefore(this.container);
		var parsedHTML = r.createContextualFragment(h);								
		this.container.appendChild(parsedHTML);
	}
	enableHighlighting();
	showRedex(this.iSelectedNode);
	highlightQueryResults();
	refreshVisibleInfo();
};

AnimaTree.prototype.fold = function (id,upd) {
	var node = this.dbNodes[this.tmapIDs[id]];
	if (!node.isSelected)
		myTree.selectNode(id,false,true);
	var children = node._getAllChildren();
	this.tmapIDs = {};
	var aux = [];
	
	for (var i = 0; i < this.dbNodes.length; i++) {
		if (children.indexOf(this.dbNodes[i]) == -1) {
			aux.push(this.dbNodes[i]);
			this.tmapIDs[this.dbNodes[i].id] = aux.length-1;
			this.dbNodes[i].dbindex = aux.length-1;
		}
	}
	this.dbNodes = aux;
	if (id == 0)
		node.sli = false;
	node.canExpand = true;
	node.nodeChildren = [];
	node.resize();
	if (upd) this.updateTree();
	centerTree(id,true);
	if (cgWindow != null && cgWindow.myGraph != null)
		cgWindow.myGraph.refresh();
	if (sgWindow != null && sgWindow.myGraph != null)
		sgWindow.myGraph.refresh();
};

AnimaTree.prototype.selectNode = function (nodeid, upd, center, fromGraph) {		
	this._selectNodeInt(this.tmapIDs[nodeid], true);
	if (upd) this.updateTree();
	if (center || center === undefined)
		centerTree(nodeid,true);
	if (myTree.showRedex)
		showRedex(nodeid);
	if (!fromGraph && cgWindow != null && cgWindow.myGraph != null){
		var nodes = cgWindow.myGraph.nodes;
		for(var i = 0; i < cgWindow.myGraph.nodes.length; i++){
			var gnode = cgWindow.myGraph.nodes[i]; 
			if (gnode.name == ("S"+nodeid) || gnode.name.includes("S"+nodeid+",") || gnode.name.endsWith("S"+nodeid))
				cgWindow.myGraph.dragNode = gnode;
		}
		cgWindow.myGraph.draw();
	}
	if (!fromGraph && sgWindow != null && sgWindow.myGraph != null){
		var nodes = sgWindow.myGraph.nodes;
		for(var i = 0; i < sgWindow.myGraph.nodes.length; i++){
			var gnode = sgWindow.myGraph.nodes[i]; 
			if (gnode.name == ("S"+nodeid) || gnode.name.includes("S"+nodeid+",") || gnode.name.endsWith("S"+nodeid))
				sgWindow.myGraph.dragNode = gnode;
		}
		sgWindow.myGraph.draw();
	}
};

AnimaTree.prototype.getWidth = function () {
	var res = 0;
	var simple = this.isSource;
	
	for (var i=0; i<this.dbNodes.length; i++)
		if (this.dbNodes[i].isVisible)
			res = Math.max(res,this.dbNodes[i].XPosition + (simple?this.dbNodes[i].w:this.dbNodes[i].wm));
	return res;
};

AnimaTree.prototype.getHeight = function () {
	var res = 0;
	var simple = this.isSource;
	
	for (var i=0; i<this.dbNodes.length; i++)
		if (this.dbNodes[i].isVisible)
			res = Math.max(res,this.dbNodes[i].YPosition + (simple?this.dbNodes[i].h:this.dbNodes[i].hm));
	return res;
};

AnimaTree.prototype.getNode = function (nodeid) {
	return this.dbNodes[this.tmapIDs[parseInt(""+nodeid)]] || null;
};

AnimaTree.prototype.getNewID = function () {
	return Math.floor(Math.max.apply(Math,Object.keys(this.tmapIDs))+1);
};

AnimaTree.prototype.getNormalizedRoot = function () {
	var node = this.root.nodeChildren[0];
	while(!node.isNormalized)
		node = node.nodeChildren[0];
	return node;
};

AnimaTree.prototype.getDistance = function (node) {
	var root = this.getNormalizedRoot();
	var res = 0;
	
	while(node != null && node.id != root.id){
		if (node.isNormalized)
			res++;
		node = node.nodeParent;
	}
	return res;
};

AnimaTree.prototype.getCriteria = function(){
	var criteria = [];
	for (var i=0; i<this.dbNodes.length; i++)
		criteria.push([this.dbNodes[i].id,this.dbNodes[i].criteria.length > 0?this.dbNodes[i].criteria:"noPos"]);
	return criteria;
};

AnimaTree.prototype.clearCriteria = function() {
	for (var i=0; i<this.dbNodes.length; i++)
		this.dbNodes[i].clearCriteria();
};

AnimaTree.prototype.getExpandableNode = function() {
	for (var i=0; i<this.dbNodes.length; i++)
		if (this.dbNodes[i].counter > 0)
			return this.dbNodes[i];
	return null;
};

AnimaTree.prototype.getTraceHTML = function(node,mode) {
	var res = "";
    var steps = 1;
	var sizen = 0;
	var sizes = 0;
	
	if (node.sli){
		while(node != null && node.id != -1){
			if (mode == TRACE_LARGE || node.rule == null || (mode == TRACE_MEDIUM && (node.rule.label!="flattening" && node.rule.label!="unflattening")) || (mode == TRACE_SMALL && (node.rule.label!="flattening" && node.rule.label!="unflattening" && node.rule.label!="builtIn")))
				res = "<tr id=\"tabresANIMA-STEP\"><td>ANIMA-STEP</td><td>"+(node.id==0?"'Start":(node.rule.label=="flattening"?"toBnf":(node.rule.label=="unflattening"?"fromBnf":node.rule.label)))+"</td><td>"+node.getHTML(false,true)+"</td><th class=\"slicedTraceStep\">"+node.getHTML(true,true)+"</th></tr>" + res;
			sizen += node.getSize(false);
			if ((node.relevant && !myTree.trusted) || (node.relevant && myTree.trusted && node.rule != null && node.rule.label != "builtIn")) 
				sizes += node.getSize(true);
			node = node.nodeParent;
			steps++;
		}
		for(var i = 1; i <= steps; i++)
			res = res.replace("ANIMA-STEP",i).replace("ANIMA-STEP",i);
		res = "<table id=resultsTable class=\"gridtable hyphenate\" style=\"width: 100%;\"><tr><th style=\"width: 45px; text-align: center;\">State</th><th style=\"width: 100px; text-align: center;\">Label</th><th style=\"text-align: center;\">Original trace</th><th style=\"text-align: center;\">Sliced trace</th></tr>" + res;
		if (!myTree.isSource)
			res += "<tr><td colspan=2 style=\"text-align: right;\"><b>Compatibility<br>condition: </b></td><td colspan=2>" + myTree.condmeta + "</td></tr>";
		res += "<tr><td class=\"total\" colspan=2><b>Total size: </b></td><td class=\"total\">"+sizen+"&nbsp;bytes</td><td class=\"total\">"+sizes+"&nbsp;bytes</td></tr><tr><td class=reduction colspan=4><b>Reduction Rate: </b>"+Math.ceil((1-(sizes/sizen))*100)+"%</td></tr></table>";
	}
	else {
		while(node != null && node.id != -1){
			if (mode == TRACE_LARGE || node.rule == null || (mode == TRACE_MEDIUM && (node.rule.label!="flattening" && node.rule.label!="unflattening")) || (mode == TRACE_SMALL && (node.rule.label!="flattening" && node.rule.label!="unflattening" && node.rule.label!="builtIn")))
				res = "<tr id=\"tabresANIMA-STEP\"><td style=\"text-align: center;\">ANIMA-STEP</td><td>"+(node.id==0?"'Start":(node.rule.label=="flattening"?"toBnf":(node.rule.label=="unflattening"?"fromBnf":node.rule.label)))+"</td><td>"+node.getHTML(false,true)+"</td></tr>" + res;
			sizen += node.getSize(false);
			node = node.nodeParent;
			steps++;
		}
		for(var i = 1; i <= steps; i++)
			res = res.replace("ANIMA-STEP",i).replace("ANIMA-STEP",i);
		res = "<table id=resultsTable class=\"gridtable hyphenate\" style=\"width: 100%;\"><tr><th style=\"width: 45px; text-align: center;\">State</th><th style=\"width: 100px; text-align: center;\">Label</th><th style=\"text-align: center;\">Trace</th></tr>" + res + "<tr><td class=\"total\" colspan=2 style=\"background-color: #FFA6A6; text-align: right;\"><b>Size: </b></td><td class=\"total\" style=\"background-color: #FFA6A6;\">"+sizen+"&nbsp;bytes</td></tr></table>";		
	}
	return res;
};
