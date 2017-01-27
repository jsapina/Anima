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

function getTopSorts(){
	var res = new Array("\n","\n");
	var topSortCount = 0;
	
	for(var i = 0; i < myTree.kinds.length; i++){
		if (myTree.kinds[i].indexOf(",") != -1){
			 tmp = myTree.kinds[i].split(",");
			 res[0] += "sort ELPTOP"+topSortCount+" .\n";
			 res[0] += "subsorts " + (myTree.kinds[i].split(",")).join(" ") + " < ELPTOP"+topSortCount+" .\n";
			 res[1] += "  op ELPIDENTIFY : -> ELPTOP"+topSortCount+" .\n  op ELPDISCARD : -> ELPTOP"+topSortCount+" .\n";
			 topSortCount++;
		}
		else
			res[1] += "  op ELPIDENTIFY : -> "+myTree.kinds[i]+" .\n  op ELPDISCARD : -> "+myTree.kinds[i]+" .\n";
	}
	return res;
}

function highlightQueryResults(){
	clearHighlighting();
	var criteria = myTree.getCriteria();
	if (criteria != null && criteria.length > 0) {
		for(var i = 0; i < criteria.length; i++){
			if (myTree.isSource)
				highlightCriteria(document.getElementById(""+criteria[i][0]),myTree.getNode(criteria[i][0]).slice.map,criteria[i][1]);
			else
				highlightCriteriaMeta($("#"+criteria[i][0]),criteria[i][1]);
		}
	}
	if ($("#taSlice").is(":visible")) {
		$("#taSlice").html($("#"+myTree.iSelectedNode).html());
	}
	$(".highlighted").on("mouseup", function() {
		if (document.getElementById("0") != null)
			$("#0").getHighlighter().removeHighlights(this);
		else
			$("#1").getHighlighter().removeHighlights(this);
		highlightQueryResults();
	});
}

function mergeOffsets(offsets){
	if (offsets == null || offsets.length == 1)
		return offsets;
	var res = new Array(offsets[0]);
	for(var i = 1; i < offsets.length; i++){
		var aux = res.pop();
		if ((aux[0] + aux[1]) >= offsets[i][0]){
			aux[1] = (offsets[i][0] - aux[0]) + offsets[i][1];
			res.push(aux);
		}
		else{
			res.push(aux);
			res.push(offsets[i]);
		}
	}
	return res;
}

function getListOfStates() {
	var res = "";
	if (myTree != null){
		var nodes = myTree.dbNodes;
		for(var i = 0; i < nodes.length; i++){
			if (nodes[i] != null && nodes[i].id >= 0){
				res+= "{" + nodes[i].id + " , (" + nodes[i].slice.meta + ")} "; 
			}
		}
	}
	return res.trim();
}