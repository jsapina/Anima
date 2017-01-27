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

function fnSelect(ele, node, offS, offE) {
	fnDeSelect();
	if (node != null){
		var range = document.createRange();
		range.setStart(node,offS);
		range.setEnd(node, offE);
		window.getSelection().addRange(range);
		$("#"+ele.id).getHighlighter().doHighlight();
	}
	fnDeSelect();
}

function fnDeSelect() {
	if (document.selection) document.selection.empty(); 
	else if (window.getSelection)
		window.getSelection().removeAllRanges();
}

function getStringIndices(map,pos){
	var res = new Array();
	var aux = 0;
	
	for(var i = 0; i < map.length; i++){
		if (map[i][1].split(" , ")[0] == pos && map[i][0] != 0)
			res.push(new Array(aux, map[i][0]));
		aux += map[i][0];
	}
	return res;
}

function highlightCriteria(ele,map,criteria){
	if (criteria != null && criteria.length != 0 && criteria != "noPos"){
		var offsets = new Array();
		for(var i = 0; i < criteria.length; i++){
			var aux = offsets.concat(getStringIndices(map,criteria[i]));
			offsets = aux;
		}
		offsets = mergeOffsets(offsets.sort(function(a,b){return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;}));
		for(var i = 0; i < offsets.length; i++)
			if (offsets[i] != null && offsets[i].length > 1)
				doAutomaticSelection(ele, offsets[i][0],offsets[i][1]);
	}
}

function highlightCriteriaMeta(ele,criteria){
	if (criteria != null && criteria.length != 0 && criteria != "noPos"){
		var str = ele.text();
		var pos = 1;
		var res = new Array();
		var offsets = new Array();
		var off = 0;
		var len = 0;
	
		for (var i = 0; i < str.length; i++) {
			if(str.charAt(i)=='[' && str.charAt(i-1) != '`') {
				if (criteria.indexOf((res.length > 0? "Lambda . "+res.join(" . ") : "Lambda")) != -1) {
					offsets.push([off,len+1]);
				}
				off = i+1;
				len = -1;
				res.push(pos);
				pos = 1;
			}
			else if (str.charAt(i) == ']' && str.charAt(i-1) != '`') {
				if (criteria.indexOf((res.length > 0? "Lambda . "+res.join(" . ") : "Lambda")) != -1 && len > 0) {
					offsets.push([off,len]);
				}
				off = i+1;
				len = -1;
				pos = res.pop();
				if (criteria.indexOf((res.length > 0? "Lambda . "+res.join(" . ") : "Lambda")) != -1)
					offsets.push([off-1,1]);
			}
			else if (str.charAt(i) == ',' && str.charAt(i-1) != '`') {
				if (criteria.indexOf((res.length > 0? "Lambda . "+res.join(" . ") : "Lambda")) != -1 && len > 0) {
					offsets.push([off,len]);
				}
				off = i+1;
				len = -1;
				pos = res.pop();
				if (criteria.indexOf((res.length > 0? "Lambda . "+res.join(" . ") : "Lambda")) != -1)
					offsets.push([off-1,1]);
				pos++;			
				res.push(pos);
				pos = 1;
			}
			len++;
		}
		if (str.charAt(str.length-1) != "]")
			offsets.push([off,len]);
		offsets = mergeOffsets(offsets.sort(function(a,b){return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;}));
		for(var i = 0; i < offsets.length; i++)
            doAutomaticSelection(ele.get(0), offsets[i][0],offsets[i][1]);
	}
}

function doAutomaticSelection(ele, pos,len){
	if (ele == null) return;
	autoselect = true;
	var dataS = getRangeDataS(ele,pos); 		//nodeS,offS,i 
	var dataE = getRangeDataE(ele,(pos+len)); 	//nodeE,offE,j
	var children = [];
	
	for(var i = 0; i < ele.childNodes.length; i++)
		children.push(ele.childNodes[i]);
	
	if (dataS[0] != dataE[0]){
		if (dataS[0].className != "bullet")
			fnSelect(ele, dataS[0],dataS[1], (dataS[0].textContent.length));
		for (var i = dataS[2]+1; i < dataE[2]; i++)
			if (children[i].className != "bullet")
				fnSelect(ele, children[i],0,children[i].textContent.length);
		if (dataE[0].className != "bullet")
			fnSelect(ele, dataE[0],0, dataE[1]);
	}
	else
		if (dataS[0].className != "bullet")
			fnSelect(ele, dataS[0],dataS[1], dataE[1]);
	autoselect = false;
}

function getRangeDataS(ele,pos){
	for (var i = 0 ; i < ele.childNodes.length; i++){
		// Greater or equal
		if (pos >= ele.childNodes[i].textContent.length)
			pos -= ele.childNodes[i].textContent.length;
		else
			return [ele.childNodes[i],pos,i];
	}
}

function getRangeDataE(ele,pos){
	for (var i = 0 ; i < ele.childNodes.length; i++){
		// Only greater
		if (pos > ele.childNodes[i].textContent.length)
			pos -= ele.childNodes[i].textContent.length;
		else
			return [ele.childNodes[i],pos,i];
	}
}

function metaBulletSelected(range){
	if (range != null && range.commonAncestorContainer != null){
		if (range.commonAncestorContainer.parentElement != null && range.commonAncestorContainer.parentElement.className == "bullet")
			return true;
		if (range.commonAncestorContainer.children != null){
			for(var i = 0; i < range.commonAncestorContainer.children.length; i++){
				if (range.commonAncestorContainer.children[i].className == "bullet")
					return true;
			}
		}
	}
	return false;
}

function clearHighlighting() {
	if (myTree != null && myTree.dbNodes != null){
		var nodes = myTree.dbNodes;
		autodelete = true;
		for(var i = 0; i < nodes.length; i++){
			if ($("#"+nodes[i].id) != null && $("#"+nodes[i].id).length > 0)
				$("#"+nodes[i].id).getHighlighter().removeHighlights();
		}
		autodelete = false;
	}
}

function getDeletedPosition(nodeid,flag) {
	var SPAN_HIGHLIGHTED = "<span class=\"highlighted hyphenate\">";
    var SPAN_NO_HIGHLIGHTED = "<span class=\"delhighlighted\">";
    var SPAN_BULLET = "<span class=\"bullet\">";
    var CLOSE_SPAN = "</span>";
    
	var map = myTree.getNode(nodeid).slice.map;
	var html = revertHTMLSymbols(flag?$("#taSlice").html():$("#"+nodeid).html()).replace(/\<sub\>/g,"").replace(/[0-9]+\<\/sub\>/g,"");
	if (html.indexOf(SPAN_NO_HIGHLIGHTED) == -1)
		return "noPos";
	var inside = false;
	var mask = "";
	var criteria = new Array();
	var record = false;
	
	for (var i = 0; i < html.length; i++){
		if (i+SPAN_HIGHLIGHTED.length < html.length && html.substring(i,i+SPAN_HIGHLIGHTED.length) == SPAN_HIGHLIGHTED) {
			inside = true;
			i+=(SPAN_HIGHLIGHTED.length-1);
		}
		else if (i+SPAN_NO_HIGHLIGHTED.length < html.length && html.substring(i,i+SPAN_NO_HIGHLIGHTED.length) == SPAN_NO_HIGHLIGHTED) {
			inside = true;
			record = true;
			i+=(SPAN_NO_HIGHLIGHTED.length-1);
		}
		else if (inside && !record && i+CLOSE_SPAN.length < html.length && html.substring(i,i+CLOSE_SPAN.length) == CLOSE_SPAN) {
			inside = false;
			i+=(CLOSE_SPAN.length-1);
		}
		else if (inside && record && i+CLOSE_SPAN.length < html.length && html.substring(i,i+CLOSE_SPAN.length) == CLOSE_SPAN) {
			inside = false;
			record = false;
			i+=(CLOSE_SPAN.length-1);
		}
		else if (i+SPAN_BULLET.length < html.length && html.substring(i,i+SPAN_BULLET.length) == SPAN_BULLET)
			i+=(SPAN_BULLET.length-1);
		else if (i+CLOSE_SPAN.length < html.length && html.substring(i,i+CLOSE_SPAN.length) == CLOSE_SPAN)
			i+=(CLOSE_SPAN.length-1);
		else if (inside && record)
			mask += "S";
		else
			mask += "n";
	}
	
	var pos = 0;
	for(var i = 0; i < map.length; i++){
		if(pos+map[i][0] < mask.length && (mask.substring(pos, pos+map[i][0])).indexOf("S") != -1){
			if (map[i][1].indexOf(",") != -1){
				criteria.push(map[i][1].split(",")[0].trim());
				criteria.push(map[i][1].split(",")[1].trim());
			}
			else
				criteria.push(map[i][1]);
		}
		pos+=map[i][0];
	}
	return criteria.unique();
}

function getDeletedPositionMeta(nodeid,flag) {
	var SPAN_HIGHLIGHTED = "<span class=\"highlighted hyphenate\">";
    var SPAN_NO_HIGHLIGHTED = "<span class=\"delhighlighted\">";
    var SPAN_BULLET = "<span class=\"bullet\">";
    var CLOSE_SPAN = "</span>";
    
	var html = revertHTMLSymbols(flag?$("#taSlice").html():$("#"+nodeid).html());
	if (html.indexOf(SPAN_NO_HIGHLIGHTED) == -1)
		return "noPos";
	
	var inside = false;
	var bullet = false;
	var record = false;
	var pos = 1;
	var res = new Array();
	var criteria = new Array();
	
    for (var i = 0; i < html.length-1; i++) {
		if (i+SPAN_HIGHLIGHTED.length < html.length && html.substring(i,i+SPAN_HIGHLIGHTED.length) == SPAN_HIGHLIGHTED){
			inside = true;
			i+=(SPAN_HIGHLIGHTED.length-1);
		}
		if (i+SPAN_NO_HIGHLIGHTED.length < html.length && html.substring(i,i+SPAN_NO_HIGHLIGHTED.length) == SPAN_NO_HIGHLIGHTED){
			inside = true;
			record = true;
			i+=(SPAN_NO_HIGHLIGHTED.length-1);
		}
		else if (i+SPAN_BULLET.length < html.length && html.substring(i,i+SPAN_BULLET.length) == SPAN_BULLET){
			bullet = true;
			i+=(SPAN_BULLET.length-1);
		}
		else if (bullet && i+7 < html.length && html.substring(i,i+CLOSE_SPAN.length) == CLOSE_SPAN){
			bullet = false;
			i+=(CLOSE_SPAN.length-1);
		}
		else if (inside && !record && i+7 < html.length && html.substring(i,i+CLOSE_SPAN.length) == CLOSE_SPAN){
			inside = false;
			i+=(CLOSE_SPAN.length-1);
		}
		else if (inside && record && i+7 < html.length && html.substring(i,i+7) == CLOSE_SPAN){
			inside = false;
			record = false;
			i+=6;
		}
		else if(html.charAt(i)=='[' && !((html.charAt(i-1) == '`') || (i > SPAN_HIGHLIGHTED.length && html.substring(i-SPAN_HIGHLIGHTED.length,i-1) == SPAN_HIGHLIGHTED && html.charAt(i-SPAN_HIGHLIGHTED.length+1) == '`') || (i > SPAN_BULLET.length && html.substring(i-SPAN_BULLET.length,i-1) == SPAN_BULLET && html.charAt(i-SPAN_BULLET.length+1) == '`'))) {
			if (inside && record)
				criteria.push(res.length > 0? "Lambda . "+res.join(" . ") : "Lambda");
			res.push(pos);
			pos = 1;
		}
		else if (html.charAt(i) == ']' && !((html.charAt(i-1) == '`') || (i > SPAN_HIGHLIGHTED.length && html.substring(i-SPAN_HIGHLIGHTED.length,i-1) == SPAN_HIGHLIGHTED && html.charAt(i-SPAN_HIGHLIGHTED.length+1) == '`') || (i > SPAN_BULLET.length && html.substring(i-SPAN_BULLET.length,i-1) == SPAN_BULLET && html.charAt(i-SPAN_BULLET.length+1) == '`'))) {
			pos = res.pop();
			if (inside && record)
				criteria.push(res.length > 0? "Lambda . "+res.join(" . ") : "Lambda");
		}
		else if (html.charAt(i) == ',' && !((html.charAt(i-1) == '`') || (i > SPAN_HIGHLIGHTED.length && html.substring(i-SPAN_HIGHLIGHTED.length,i-1) == SPAN_HIGHLIGHTED && html.charAt(i-SPAN_HIGHLIGHTED.length+1) == '`') || (i > SPAN_BULLET.length && html.substring(i-SPAN_BULLET.length,i-1) == SPAN_BULLET && html.charAt(i-SPAN_BULLET.length+1) == '`'))) {
			pos = res.pop();
			pos++;
			if (inside && record)
				criteria.push(res.length > 0? "Lambda . "+res.join(" . ") : "Lambda");
			res.push(pos);
			pos = 1;
		}
		else if (inside && record)
			criteria.push(res.length > 0? "Lambda . "+res.join(" . ") : "Lambda");
	}
	return criteria.unique();
}

function highlightRedex(pos,map,id,text){
	pos = pos.split(",");
	var str = "";
	var count = 0;
	var flag = false;
	for(var i = 0; i < map.length; i++){
		for(var j = 0; j < pos.length; j++){
			if (map[i][1] == pos[j] || map[i][1].indexOf(pos[j]+" . ") != -1)
				flag = true;
		}
		if (flag)
			str+="ANIMA-OPENSPAN"+text.slice(count,(count+map[i][0]))+"ANIMA-CLOSESPAN";
		else
			str+=text.slice(count,(count+map[i][0]));
		count += map[i][0];
		flag = false;
	}
	str = str.replace(/ANIMA-CLOSESPANANIMA-OPENSPAN/g,"");
    
    if (id < 0) {
        $("#dInfoTerm").text(str);
        $("#dInfoTerm").html($("#dInfoTerm").html().replace(/ /g,"&nbsp;"));
        $("#dInfoTerm").html($("#dInfoTerm").html().replace(/ANIMA-OPENSPAN/g,"<span class=\"context\">"));
        $("#dInfoTerm").html($("#dInfoTerm").html().replace(/ANIMA-CLOSESPAN/g,"</span>"));
    }
    else {
        $("#"+id+"R").text(str);
        $("#"+id+"R").html($("#"+id+"R").html().replace(/ /g,"&nbsp;"));
        $("#"+id+"R").html($("#"+id+"R").html().replace(/ANIMA-OPENSPAN/g,"<span class=\"context\">"));
        $("#"+id+"R").html($("#"+id+"R").html().replace(/ANIMA-CLOSESPAN/g,"</span>"));
    }
}

function highlightRedexMeta(pos,txt,id){
	var str,open,aux;
	var mpos = null;
	
	if (pos.indexOf(", ") != -1){
		mpos = pos.split(", ");
		str = (mpos.indexOf("Lambda") != -1)?"ANIMA-OPENSPAN":"";
		open = (mpos.indexOf("Lambda") != -1)?true:false;
	}
	else {
		str = pos=="Lambda"?"ANIMA-OPENSPAN":"";
		open = pos=="Lambda"?true:false;
	}
	var res = new Array("Lambda");
	
	for (var i = 0; i < txt.length; i++) {
		if(txt.charAt(i)=="[" && !(txt.charAt(i-1) == "`")) {
			str+= txt.charAt(i);
			if (open){
				str+="ANIMA-CLOSESPAN";
				open = false;
			}
			res.push("1");
			if (mIndexOf(res.join(" . "),pos,mpos) != -1){
				str+="ANIMA-OPENSPAN";
				open = true;
			}
		}
		else if (txt.charAt(i) == "]" && !(txt.charAt(i-1) == "`")) {
			if (open){
				str+="ANIMA-CLOSESPAN";
				open = false;
			}
			res.pop();
			if (mIndexOf(res.join(" . "),pos,mpos) != -1)
				str+="ANIMA-OPENSPAN"+txt.charAt(i)+"ANIMA-CLOSESPAN";
			else
				str+= txt.charAt(i);
		}
		else if (txt.charAt(i) == "," && !(txt.charAt(i-1) == "`")) {
			if (open){
				str+="ANIMA-CLOSESPAN";
				open = false;
			}
			aux = 1+parseInt(res.pop());
			if (mIndexOf(res.join(" . "),pos,mpos) != -1)
				str+="ANIMA-OPENSPAN"+txt.charAt(i)+"ANIMA-CLOSESPAN";
			else
				str+= txt.charAt(i);
			res.push(aux);
			if (mIndexOf(res.join(" . "),pos,mpos) != -1){
				str+="ANIMA-OPENSPAN";
				open = true;
			}
		}
		else 
			str+= txt.charAt(i);
	}
	str = str.replace(/ANIMA-CLOSESPANANIMA-OPENSPAN/g,"");
	
     if (id < 0) {
        $("#dInfoTerm").text(str);
        $("#dInfoTerm").html($("#dInfoTerm").html().replace(/ANIMA-OPENSPAN/g,"<span class=\"context\">"));
        $("#dInfoTerm").html($("#dInfoTerm").html().replace(/ANIMA-CLOSESPAN/g,"</span>"));
    }
    else {
        $("#"+id+"R").text(str);
        $("#"+id+"R").html($("#"+id+"R").html().replace(/ANIMA-OPENSPAN/g,"<span class=\"context\">"));
        $("#"+id+"R").html($("#"+id+"R").html().replace(/ANIMA-CLOSESPAN/g,"</span>"));
    }
}

function highlightRedexPosition(id){
	if (id > 0){
		var node = myTree.getNode(id);
		var parent = node.getParent();
		if (node != null && parent != null && $("#"+node.id+"R").length > 0 && $("#"+parent.id+"R").length > 0) {
			var redex = (parent == node.nodeParent?node.pos:node.redex);
			var contractum = (parent == node.nodeParent?node.pos:node.contractum);
			
			if (myTree.isSource) {
				highlightRedex(redex,parent.slice.map,parent.id,revertHTMLSymbols(parent.getDescription(true)));
				highlightRedex(contractum,node.slice.map,node.id,revertHTMLSymbols(node.getDescription(true)));
			}
			else {
				highlightRedexMeta(redex,revertHTMLSymbols(parent.getDescription(false)),parent.id);
				highlightRedexMeta(contractum,revertHTMLSymbols(node.getDescription(false)),node.id);
			}
		}
	}
}
