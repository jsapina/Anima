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

function exportDataAnima() {
	return [ myProgram.getValue(),astate ];
}

function exportDataiJulienne() {
	var res = new Array();
	res.push(myProgram.getValue().trim());
	if (icond != null){
		res.push(EXP_CONDITION);
		res.push(true);
		res.push(icond);
		res.push(icsli);
		icond = null;
		icsli = null;
	}
	else {
		res.push(EXP_TRACE);
		res.push(true);
		var aux = [];
		var node = inode;
		while(node != null){
			aux.push("(( "+node.nodeParent.term.meta+") ->^{"+node.rule.meta+","+node.getMaudeSub()+","+node.pos+"} ("+node.term.meta+"))");
			if (node.id == 0 || node.nodeParent.id == 0) break;
			node = node.nodeParent;
		}
		res.push(aux.reverse().join("\n"));
		if (myTree.mode == MODE_PARTIAL || myTree.mode == MODE_FORWARD){
			aux = [];
			node = inode;
			while(node != null){
				aux.push([node.slice,node.condsli]);
				if (node.id == 0) break;
				node = node.nodeParent;
			}
			res.push(aux.reverse());
		}
		else
			res.push(null);
	}
	return res;
}

function importData() {
	var impData = window.opener.exportDataAnima();
	if (impData != null && impData.length == 2){
		myProgram.setValue(impData[0]);
		$("#taState").val(impData[1]);
		window.opener = null;
		from1to2();
	}
	else
		window.opener = null;
}
