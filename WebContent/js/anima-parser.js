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

function parseKinds(data){
	var res = [];
	for(var i = 0; i < data.length; i++){
		data[i].val = data[i].val.replace(/`\[/g,"");
		data[i].val = data[i].val.replace(/`\]/g,"");
		data[i].val = data[i].val.replace(/`,/g,",");
		res.push(data[i].val);
	}
	return res;
}

function parsePosition(data) {
	try {
		return data.replace(/L/g,"Lambda").replace(/\./g," . ");
	}
	catch (err) {
		return "";
	}
}

function parsePositionSet(data) {
	try {
		var res = data.replace(/L/g,"Lambda").replace(/\./g," . ").split(",");
        if (res == null || res.length == 0 || res[0] == "empty")
            res = [];
        return res;
	}
	catch (err) {
		return [];
	}
}

function parseMap(data){
	data = data.replace(/p/g, "pLambda.");
	data = data.replace(/Lambda.c/g, "Lambdac");
	data = data.replace(/X/g, " , Lambda.");
	data = data.replace(/\./g, " . ");
	data = data.trim();
	if (data[data.length-1] == ".")
		data = data.slice(0,-2);
	data = data.split("c");
	for(var j = 1; j < data.length; j++){
		data[j-1] = data[j].split("p");
		data[j-1][0] = parseInt(data[j-1][0]);
	}
	return data.slice(0,-1);
}

function parseCriteria(nodeid){
	var SPAN_HIGHLIGHTED = "<span class=\"highlighted hyphenate\">";
    var SPAN_BULLET = "<span class=\"bullet\">";
    var CLOSE_SPAN = "</span>";
    
	var map = myTree.getNode(nodeid).slice.map;
	var html = revertHTMLSymbols($("#"+nodeid).html()).replace(/\<sub\>/g,"").replace(/[0-9]+\<\/sub\>/g,"");
	if (html.indexOf(SPAN_HIGHLIGHTED) == -1)
		return "noPos";
	var inside = false;
	var mask = "";
	var criteria = new Array();
	
	for (var i = 0; i < html.length; i++){
		if (i+SPAN_HIGHLIGHTED.length < html.length && html.substring(i,i+SPAN_HIGHLIGHTED.length) == SPAN_HIGHLIGHTED) {
			inside = true;
			i+=(SPAN_HIGHLIGHTED.length-1);
		}
		else if (inside && i+CLOSE_SPAN.length < html.length && html.substring(i,i+CLOSE_SPAN.length) == CLOSE_SPAN) {
			inside = false;
			i+=(CLOSE_SPAN.length-1);
		}
		else if (i+SPAN_BULLET.length < html.length && html.substring(i,i+SPAN_BULLET.length) == SPAN_BULLET)
			i+=(SPAN_BULLET.length-1);
		else if (i+CLOSE_SPAN.length < html.length && html.substring(i,i+CLOSE_SPAN.length) == CLOSE_SPAN)
			i+=(CLOSE_SPAN.length-1);
		else if (inside)
			mask += "S";
		else
			mask += "n";
	}
	
	var pos = 0;
	for(var i = 0; i < map.length; i++){
		if(pos+map[i][0] <= mask.length && (mask.substring(pos, pos+map[i][0])).indexOf("S") != -1){
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

function parseCriteriaMeta(nodeid) {
	var SPAN_HIGHLIGHTED = "<span class=\"highlighted hyphenate\">";
    var SPAN_BULLET = "<span class=\"bullet\">";
    var CLOSE_SPAN = "</span>";
    
	var html = revertHTMLSymbols($("#"+nodeid).html());
	if (html.indexOf(SPAN_HIGHLIGHTED) == -1)
		return "noPos";
	
	var inside = false;
	var bullet = false;
	var pos = 1;
	var res = new Array();
	var criteria = new Array();
	
	for (var i = 0; i < html.length-1; i++) {
		if (i+SPAN_HIGHLIGHTED.length < html.length && html.substring(i,i+SPAN_HIGHLIGHTED.length) == SPAN_HIGHLIGHTED){
			inside = true;
			i+=(SPAN_HIGHLIGHTED.length-1);
		}
		else if (i+SPAN_BULLET.length < html.length && html.substring(i,i+SPAN_BULLET.length) == SPAN_BULLET){
			bullet = true;
			i+=(SPAN_BULLET.length-1);
		}
		else if (bullet && i+CLOSE_SPAN.length < html.length && html.substring(i,i+CLOSE_SPAN.length) == CLOSE_SPAN){
			bullet = false;
			i+=(CLOSE_SPAN.length-1);
		}
		else if (inside && i+CLOSE_SPAN.length < html.length && html.substring(i,i+CLOSE_SPAN.length) == CLOSE_SPAN){
			inside = false;
			i+=(CLOSE_SPAN.length-1);
		}
		else if(html.charAt(i)=="[" && !((html.charAt(i-1) == "`") || (i > SPAN_HIGHLIGHTED.length && html.substring(i-SPAN_HIGHLIGHTED.length,i-1) == SPAN_HIGHLIGHTED && html.charAt(i-SPAN_HIGHLIGHTED.length+1) == "`") || (i > SPAN_BULLET.length && html.substring(i-SPAN_BULLET.length,i-1) == SPAN_BULLET && html.charAt(i-SPAN_BULLET.length+1) == "`"))) {
			if (inside)
				criteria.push(res.length > 0? "Lambda . "+res.join(" . ") : "Lambda");
			res.push(pos);
			pos = 1;
		}
		else if (html.charAt(i) == "]" && !((html.charAt(i-1) == "`") || (i > SPAN_HIGHLIGHTED.length && html.substring(i-SPAN_HIGHLIGHTED.length,i-1) == SPAN_HIGHLIGHTED && html.charAt(i-SPAN_HIGHLIGHTED.length+1) == "`") || (i > SPAN_BULLET.length && html.substring(i-SPAN_BULLET.length,i-1) == SPAN_BULLET && html.charAt(i-SPAN_BULLET.length+1) == "`"))) {
			pos = res.pop();
			if (inside)
				criteria.push(res.length > 0? "Lambda . "+res.join(" . ") : "Lambda");
		}
		else if (html.charAt(i) == "," && !((html.charAt(i-1) == "`") || (i > SPAN_HIGHLIGHTED.length && html.substring(i-SPAN_HIGHLIGHTED.length,i-1) == SPAN_HIGHLIGHTED && html.charAt(i-SPAN_HIGHLIGHTED.length+1) == "`") || (i > SPAN_BULLET.length && html.substring(i-SPAN_BULLET.length,i-1) == SPAN_BULLET && html.charAt(i-SPAN_BULLET.length+1) == "`"))) {
			pos = res.pop();
			pos++;
			if (inside)
				criteria.push(res.length > 0? "Lambda . "+res.join(" . ") : "Lambda");
			res.push(pos);
			pos = 1;
		}
		else if (inside)
			criteria.push(res.length > 0? "Lambda . "+res.join(" . ") : "Lambda");
	}
	return criteria.unique();
}

function parseAllCriteria() {
	var nodes = myTree.dbNodes;
	
	if (myTree.isSource){
		for(var i = 0; i < nodes.length; i++)
			if (nodes[i].isVisible)
				nodes[i].criteria = parseCriteria(nodes[i].id);
	}
	else {
		for(var i = 0; i < nodes.length; i++)
			if (nodes[i].isVisible)
				nodes[i].criteria = parseCriteriaMeta(nodes[i].id);
	}
}
