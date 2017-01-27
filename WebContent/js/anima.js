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

function bindUpload() {
	$("#loader1").hide();
	$("#progressBarOuter").hide();
	$("#fileUpload").fileupload({
		type: "POST",
		url: "ws/upload",
		timeout: 250000,
		cache: false,
		contentType: false,
        processData: false,
        start: function(e) {
        	$("#alertStep1").hide();
			$("#progressBarOuter").show();
			disableControls1();
			$("#loader1").hide();
        },
        error: function(error) {
			showErrorMessage1(BAD_FILE);
			enableControls1();
		},
		success: function(response){
			$("#loader1").hide();
			myProgram.setValue("");
			$("#taState").val("");
			if (response == "Anima error detected." || response == "COMMANDS_DETECTED" || response == "FILE_NOT_FOUND" || response == "ORDER_NOT_FOUND")
				showErrorMessage1(response);
			else {
				if (response.indexOf("ANIMA-SPLIT-AJAX") == -1)
					myProgram.setValue(response);
				else {
					response = response.split("ANIMA-SPLIT-AJAX");
					myProgram.setValue(response[0]);
					$("#taState").val(response[1]);
				}
			}
			enableControls1();
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            if (progress >= 100) {
            	$("#progressBarOuter").hide();
            	$("#progressBarInner").css("width","0%");
            	$("#loader1").show();
            }
            else
            	$("#progressBarInner").css("width",progress + "%");
        }
    }).prop("disabled", !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : "disabled");
}

function doInitialization(program,state) {
	console.time("Parsing");
	$.ajax( {
		type: "POST",
		url: "ws/parse-program",
		timeout: 250000,
		data: "program=" + encodeURIComponent(program),
		error: function(error) {
			console.timeEnd("Parsing");
			showErrorMessage1(BAD_PROGRAM);
			enableControls1();
		},
		success: function(response){
			console.timeEnd("Parsing");
			if (response == null) { 
				showErrorMessage1(BAD_PROGRAM);
				enableControls1();
			}
			else {
				response = response.split("ELP-RESULT");
				if (response.length < 2){
					enableControls1();
					try {
						if (response[0] == "COMMANDS_DETECTED")
                    		showErrorMessage1(getFlag(response[0]));
						else {
							var errors = response[0].replace(/(?:\r\n|\r|\n)/g,"ELP-NEWLINE");
							$("#parseWindowContent2").text(errors);
							$("#parseWindowContent2").html($("#parseWindowContent2").html().replace(/ELP-NEWLINE/g,"<br>"));
							$("#parseWindowContent2").html($("#parseWindowContent2").html().replace(/Warning:/g,"<span class=\"elpError\">Warning:</span>"));
							$("#parseWindowContent2").html($("#parseWindowContent2").html().replace(/&lt;---\*HERE\*/g,"<span class=\"elpError\">&lt;---*HERE*</span>"));
							$("#parseWindowContent2").html($("#parseWindowContent2").html().replace(/<br>Error: No parse for input./g,""));
							$("#myParseWindow").modal("show");
						}
					}
					catch(ex){ showErrorMessage1(BAD_PROGRAM); };
				}
				else {
					isFullMaude = response[0] == "true";
					modName = response[1].trim();
					console.time("Initialization");
					$.ajax( {
						type: "POST",
						url: "ws/init",
						timeout: 250000,
						data: "modname=" + encodeURIComponent(modName) + "&program=" + encodeURIComponent(program) + "&state=" + encodeURIComponent(state) + "&fullmaude=" + encodeURIComponent(isFullMaude),
						error: function(error) {
							console.timeEnd("Initialization");
							showErrorMessage1(BAD_STATE);
							enableControls1();
						},
						success: function(response){
							console.timeEnd("Initialization");
							response = response.trim().slice(1,-1).trim().replace(/DEV-BULLET/g,"•").replace(/ELP-DQ/g,"\"").replace(/ELP-EDQ/g,"\\\"");
							try {
								var data = JSON.parse(response);
								$("#step1").hide();
								$("#step2").show();
								zoom = 100;
								myTree = null;
								autoselect = false;
								expanding = null;
								isLocked = false;
								drawing = null;
								
								myTree = new AnimaTree("myTreeContainer");
								if (!$("#opIScheck").is(":visible")){
									$("#opIScheck").css("display","inline");
									$("#opPScheck").css("display","none");
									$("#opFWcheck").css("display","none");
								}
								$("#drawSlicedGraph").hide();
								$("#drawSlicedGraphText").text("");
								
								myTree.isSource = !$("#opVWcheck").is(":visible");
							    myTree.nodeType = data.type;
							    myTree.kinds = parseKinds(data.kinds);
							    myTree.isInstrumented = !($("#opINcheck").css("display") == "none");
								myTree.isSource = $("#opVWcheck").css("display") == "none";
							    myTree.showState = !($("#opSLcheck").css("display") == "none");
							    myTree.showRule = !($("#opRLcheck").css("display") == "none");
							    myTree.showRedex = !($("#opRXcheck").css("display") == "none");
							    
							    //(id, pid, nid, term, slice, rule, sub, cond, condsli, pos, posf, posp, sli, norm, vis, counter)
							    data.term.map = parseMap(data.term.map);
								if (data.trace === undefined || data.trace.length == 0){
						    	myTree.add(0, -1, 0, data.term, data.term, [], [], [], [], [], "", "", "", false, true, true, 0);
							    }
							    else {
							    	var last = data.trace.length;
							    	myTree.add( 0, -1, last, 
							    				data.term, data.term, 
							    				[], [], [], [], [],
							    				"", "", "", 
							    				false, false, myTree.isInstrumented, 0);
							    	
							    	for(var i = 0; i < last - 1; i++) {
							    		data.trace[i].term.map = parseMap(data.trace[i].term.map);
							    		myTree.add(	i+1, i, last, 
							    					data.trace[i].term, data.trace[i].term, 
							    					data.trace[i].rule, data.trace[i].sub, [], data.trace[i].cond, [], 
							    					parsePosition(data.trace[i].pos), "", "", 
							    					false,false,myTree.isInstrumented,0);
							    	}
							    	data.trace[last - 1].term.map = parseMap(data.trace[last - 1].term.map);
							    	myTree.add( last, last - 1, last, 
							    				data.trace[last - 1].term, data.trace[last - 1].term, 
							    				data.trace[last - 1].rule, data.trace[last - 1].sub, [], data.trace[last - 1].cond, [], 
							    				parsePosition(data.trace[last - 1].pos), "", "", 
							    				false, true, true, 0);    			
							    }
							    myTree.updateTree();
								
								
								if (myTree.getNode(0).isNormalized)
									myTree.selectNode(0,true,true);
								else
									myTree.selectNode(myTree.getNode(0).nid,true,true);
								enableControls1();
							}
							catch(e){
								showErrorMessage1(BAD_STATE);
								enableControls1();
							}
						}
					});
				}
			}
		}
	});
}

function doInteractive(program,expanding,counter){
	var node = myTree.getNode(expanding);
	if (!node.isSelected)
		myTree.selectNode(expanding,false,false);
	console.time("Interactive-stepper");
	$.ajax( {
		type: "POST",
		url: "ws/interactive",
		timeout: 250000,
		data: "modname=" + encodeURIComponent(modName) + "&program=" + encodeURIComponent(program) + "&state=" + encodeURIComponent(node.slice.meta) + "&fullmaude=" + encodeURIComponent(isFullMaude),
		error: function(error) {
			console.timeEnd("Interactive-stepper");
			showErrorMessage2("Anima error detected.");
			enableControls2();
		},
		success: function(response){
			console.timeEnd("Interactive-stepper");
			try {
				node.counter = 0;
				response = response.trim().slice(1,-1).trim().replace(/DEV-BULLET/g,"•").replace(/ELP-DQ/g,"\"").replace(/ELP-EDQ/g,"\\\"");
				var data = (JSON.parse(response));
				var parent = expanding;
				if (data.expands == null || data.expands.length == 0) {
					node.canExpand = false;
					showErrorMessage2(NO_EXPAND);
					enableControls2();
				}
				else {
					myTree.getNode(parent).criteria = [];
					var newid = myTree.getNewID();
					for(var i = 0; i < data.expands.length; i++) { //Each branch result
						var parid = newid + (data.expands[i].trace.length - 1);
						for(var j = 0; j < data.expands[i].trace.length; j++){	//Each instrumented step
							//(id, pid, nid, term, slice, rule, sub, cond, condsli, pos, posf, posp, sli, norm, vis, counter)
							data.expands[i].trace[j].term.map = parseMap(data.expands[i].trace[j].term.map);
							if (newid == parid){
								myTree.add(
					    			newid,parent,parid,
					    			data.expands[i].trace[j].term, data.expands[i].trace[j].term,
					    			data.expands[i].trace[j].rule, data.expands[i].trace[j].sub, [], data.expands[i].trace[j].cond, [],
					    			parsePosition(data.expands[i].trace[j].pos), parsePosition(data.expands[i].redex), parsePosition(data.expands[i].contractum), 
					    			false, true, true, counter);
							}
							else {
								myTree.add(
					    			newid,parent,parid,
						    		data.expands[i].trace[j].term, data.expands[i].trace[j].term,
						    		data.expands[i].trace[j].rule, data.expands[i].trace[j].sub, [], data.expands[i].trace[j].cond, [],
						    		parsePosition(data.expands[i].trace[j].pos), "", "",
						    		false, false, myTree.isInstrumented,0
								);
							}
							parent = newid;
							newid++;
						}
						parent = expanding;
					}
				}
				myTree.updateTree();
				lockMode(true);
				centerTree(expanding,true);
				enableControls2();
			}
			catch (e) {
				showErrorMessage2("Anima error detected.");
				enableControls2();
			}
			if (cgWindow != null && cgWindow.myGraph != null)
				cgWindow.myGraph.refresh();
			node = myTree.getExpandableNode();
			if (node != null){
				disableControls2();
				doInteractive(program,node.id,node.counter);
			}
		}
	});
}

function doPartial(program,expanding,counter) {
	savePreviousSlice(expanding);
	var node = myTree.getNode(expanding);
	if (!myTree.getNode(expanding).isSelected)
		myTree.selectNode(expanding,false,false);
	var criteria = myTree.isSource?parseCriteria(expanding):parseCriteriaMeta(expanding);
	if (criteria == null || criteria.length == 0)
		criteria = "noPos";
	console.time("Partial-stepper");
	$.ajax( {
		type: "POST",
		url: "ws/partial",
		timeout: 250000,
		data: "modname=" + encodeURIComponent(modName) + "&program=" + encodeURIComponent(program) + "&state=" + encodeURIComponent(node.term.meta) + "&criteria=" + encodeURIComponent(criteria) + "&slice=" + encodeURIComponent(node.slice.meta) + "&fullmaude=" + encodeURIComponent(isFullMaude),
		error: function(error) {
			console.timeEnd("Partial-stepper");
			showErrorMessage2("Anima error detected.");
			enableControls2();
		},
		success: function(response){
			console.timeEnd("Partial-stepper");
			try {
				node.counter = 0;
				response = response.trim().slice(1,-1).trim().replace(/DEV-BULLET/g,"•").replace(/ELP-DQ/g,"\"").replace(/ELP-EDQ/g,"\\\"");
				var data = (JSON.parse(response));
				var parent = expanding;
				if (data.expands == null || data.expands.length == 0) {
					node.canExpand = false;
					showErrorMessage2(NO_EXPAND);
					enableControls2();
				}
				else {
					var root = myTree.getNode(expanding);
					root.sli = true;
					data.slice.map = parseMap(data.slice.map);
					root.slice = data.slice;
					root.criteria = [];
					root.resize();
						
					var newid = myTree.getNewID();
					for(var i = 0; i < data.expands.length; i++) { //Each branch result
						var parid = newid + (data.expands[i].trace.length - 1);
						for(var j = 0; j < data.expands[i].trace.length; j++){	//Each instrumented step
							//(id, pid, nid, term, slice, rule, sub, cond, condsli, pos, posf, posp, sli, norm, vis, counter)
							data.expands[i].trace[j].term.map = parseMap(data.expands[i].trace[j].term.map);
							data.expands[i].trace[j].slice.map = parseMap(data.expands[i].trace[j].slice.map);
							if (newid == parid){
								myTree.add(
					    			newid,parent,parid,
					    			data.expands[i].trace[j].term, data.expands[i].trace[j].slice,
					    			data.expands[i].trace[j].rule, data.expands[i].trace[j].sub, [], data.expands[i].trace[j].cond, [],
					    			parsePosition(data.expands[i].trace[j].pos), parsePosition(data.expands[i].redex), parsePosition(data.expands[i].contractum), 
					    			true, true, true, counter);
							}
							else {
								myTree.add(
					    			newid,parent,parid,
					    			data.expands[i].trace[j].term, data.expands[i].trace[j].slice,
					    			data.expands[i].trace[j].rule, data.expands[i].trace[j].sub, [], data.expands[i].trace[j].cond, [],
					    			parsePosition(data.expands[i].trace[j].pos), "", "",
					    			true, false, myTree.isInstrumented,0
								);
							}
							parent = newid;
							newid++;
						}
						parent = expanding;
					}
				}
				myTree.updateTree();
				if (myTree.getNormalizedRoot().canExpand)
					lockMode(false);
				else
					lockMode(true);
				centerTree(expanding,true);
				enableControls2();
			}
			catch (e) {
				showErrorMessage2("Anima error detected.");
				enableControls2();
			}
			$("#drawSlicedGraph").removeClass("disabled");
			if (cgWindow != null && cgWindow.myGraph != null)
				cgWindow.myGraph.refresh();
			if (sgWindow != null && sgWindow.myGraph != null)
				sgWindow.myGraph.refresh();
			node = myTree.getExpandableNode();
			if (node != null) {
				disableControls2();
				doPartial(program,node.id,node.counter);
			}
		}
	});
}

function doForward(program,expanding,counter) {
	savePreviousSlice(expanding);
	var node = myTree.getNode(expanding);
	if (!myTree.getNode(expanding).isSelected)
		myTree.selectNode(expanding,false,false);
	var criteria = myTree.isSource?parseCriteria(expanding):parseCriteriaMeta(expanding);
	if (criteria == null || criteria.length == 0)
		criteria = "noPos"
	console.time("Forward-slicer");
	$.ajax( {
		type: "POST",
		url: "ws/forward",
		timeout: 250000,
		data: "modname=" + encodeURIComponent(modName) + "&program=" + encodeURIComponent(program) + "&state=" + encodeURIComponent(node.term.meta) + "&criteria=" + encodeURIComponent(criteria) + "&slice=" + encodeURIComponent(node.slice.meta) + "&fullmaude=" + encodeURIComponent(isFullMaude),
		error: function(error) {
			console.timeEnd("Forward-slicer");
			showErrorMessage2("Anima error detected.");
			enableControls2();
		},
		success: function(response){
			console.timeEnd("Forward-slicer");
			try {
				node.counter = 0;
				response = response.trim().slice(1,-1).trim().replace(/DEV-BULLET/g,"•").replace(/ELP-DQ/g,"\"").replace(/ELP-EDQ/g,"\\\"");
				var data = (JSON.parse(response));
				var parent = expanding;
				if (data.expands == null || data.expands.length == 0) {
					node.canExpand = false;
					showErrorMessage2(NO_EXPAND);
					enableControls2();
				}
				else {
					var root = myTree.getNode(expanding);
					root.sli = true;
					data.slice.map = parseMap(data.slice.map);
					root.slice = data.slice;
					root.criteria = [];
					root.resize();

					var newid = myTree.getNewID();
					for(var i = 0; i < data.expands.length; i++) { //Each branch result
						var parid = newid + (data.expands[i].trace.length - 1);
						for(var j = 0; j < data.expands[i].trace.length; j++){	//Each instrumented step
							//(id, pid, nid, term, slice, rule, sub, cond, condsli, pos, posf, posp, sli, norm, vis, counter)
							data.expands[i].trace[j].term.map = parseMap(data.expands[i].trace[j].term.map);
							data.expands[i].trace[j].slice.map = parseMap(data.expands[i].trace[j].slice.map);
							if (newid == parid){
								myTree.add(
					    			newid,parent,parid,
					    			data.expands[i].trace[j].term, data.expands[i].trace[j].slice,
					    			data.expands[i].trace[j].rule, data.expands[i].trace[j].sub, data.expands[i].trace[j].subsli, data.expands[i].trace[j].cond, data.expands[i].trace[j].condsli,
					    			parsePosition(data.expands[i].trace[j].pos), parsePosition(data.expands[i].redex), parsePosition(data.expands[i].contractum), 
					    			true, true, true, counter,data.expands[i].trace[j].relev
					    		);
							}
							else {
								myTree.add(
					    			newid,parent,parid,
					    			data.expands[i].trace[j].term, data.expands[i].trace[j].slice,
					    			data.expands[i].trace[j].rule, data.expands[i].trace[j].sub, data.expands[i].trace[j].subsli, data.expands[i].trace[j].cond, data.expands[i].trace[j].condsli,
					    			parsePosition(data.expands[i].trace[j].pos), "", "",
					    			true, false, myTree.isInstrumented,0,data.expands[i].trace[j].relev
								);
							}
							if (data.expands[i].trace[j].relev == "false")
						    	myTree.getNode(newid).isSliced = true;	
							parent = newid;
							newid++;
						}
						parent = expanding;
					}
				}
				myTree.updateTree();
				if (myTree.getNormalizedRoot().canExpand)
					lockMode(false);
				else
					lockMode(true);
				centerTree(expanding,true);
				enableControls2();
			}
			catch (e) {
				showErrorMessage2("Anima error detected.");
				enableControls2();
			}
			$("#drawSlicedGraph").removeClass("disabled");
			if (cgWindow != null && cgWindow.myGraph != null)
				cgWindow.myGraph.refresh();
			if (sgWindow != null && sgWindow.myGraph != null)
				sgWindow.myGraph.refresh();
			node = myTree.getExpandableNode();
			if (node != null) {
				disableControls2();
				doForward(program,node.id,node.counter);
			}
		}
	});
}

function doQuery(program,states,pattern,topSorts) {
	console.time("Query");
	$.ajax( {
		type: "POST",
		url: "ws/query",
		timeout: 250000,
		data: "modname=" + encodeURIComponent(modName) + "&program=" + encodeURIComponent(program) + "&states=" + encodeURIComponent("(" + states +")") + "&pattern=" + encodeURIComponent(pattern) + "&topSorts=" + encodeURIComponent(topSorts[0]) + "&topOps=" + encodeURIComponent(topSorts[1]) + "&fullmaude=" + encodeURIComponent(isFullMaude),
		error: function(error){
			console.timeEnd("Query");
			showErrorMessage2(QUERY_ERR);
            enableControls2();
		},
		success: function(response){
			console.timeEnd("Query");
			try {
				response = response.trim().slice(1,-1).trim().replace(/ELP-DQ/g,"\"").replace(/ELP-EDQ/g,"\\\"");
				var data = (JSON.parse(response));
				var qsts = [];
				var qres = [];
				if (data != null && data.query != null && data.query.length > 0){
					for(var i = 0; i < data.query.length; i++){
						qsts.push(data.query[i].state);
						qres.push(parsePositionSet(data.query[i].pos));
					}
					for(var i = 0; i < myTree.dbNodes.length; i++){
						var idx = qsts.indexOf(myTree.dbNodes[i].id);
						if (idx != -1)
							myTree.dbNodes[i].criteria = qres[idx];
						else
							myTree.dbNodes[i].criteria = [];
					}
					highlightQueryResults();
					$("#queryInput").val("");
				}
				else 
					showErrorMessage2(QUERY_EMP);
				enableControls2();
			}
			catch (e) {
				showErrorMessage2(QUERY_ERR);
				enableControls2();
			}
		}
	});	
}

function getGraphData(sli,instrumented) {
	if (myTree == null) return null;
	var gKey = [];
	var gVal = [];
	var resNodes = [];
	var resLinks = [];
	var idx;
	var invNodes = [];
	var bullet = sli?(myTree.mode == MODE_PARTIAL?"◦":"•"):"";
	var nodes = myTree.dbNodes;
	
	for(var i = 0; i < nodes.length; i++){
		var node = nodes[i];
		if (!instrumented && node.isNormalized){
			idx = gKey.indexOf(sli?node.slice.meta:node.term.meta);
			if (idx == -1){
				gKey.push(sli?node.slice.meta:node.term.meta);
				gVal.push(new Array("S"+node.id+bullet));
				invNodes["S"+node.id+bullet] = gVal.length-1;
			}
			else {
				gVal[idx].push("S"+node.id+bullet);
				invNodes["S"+node.id+bullet] = idx;
			}
		}
		else if (instrumented) {
			idx = gKey.indexOf(sli?node.slice.meta:node.term.meta);
			if (idx == -1){
				gKey.push(sli?node.slice.meta:node.term.meta);
				gVal.push(new Array("S"+node.id+bullet));
				invNodes["S"+node.id+bullet] = gVal.length-1;
			}
			else {
				gVal[idx].push("S"+node.id+bullet);
				invNodes["S"+node.id+bullet] = idx;
			}
		}
	}
	var child,rule;
	for(var i = 0; i < nodes.length; i++){
		var node = nodes[i];
		for (var j = 0; j < node.nodeChildren.length;j++){
			if (!instrumented && node.isNormalized){
				child = myTree.getNode(node.nodeChildren[j].nid);
				rule = child.getRule();
				resLinks = addLink(resLinks,{"source":  invNodes["S"+node.id+bullet], "target":  invNodes["S"+child.id+bullet], type: rule.type, label: rule.label});
			}
			else if (instrumented){
				child = node.nodeChildren[j];
				rule = child.rule;
				resLinks = addLink(resLinks,{"source":  invNodes["S"+node.id+bullet], "target":  invNodes["S"+child.id+bullet], type: rule.type, label: rule.label=="flattening"?"toBnf":rule.label=="unflattening"?"fromBnF":rule.label});
			}
		}
	}
	for(var i = 0; i < gVal.length; i++){
		var nroot = (instrumented?"S0":"S"+myTree.getNormalizedRoot().id)+bullet;
		var isNorm = myTree.getNode(parseInt(gVal[i][0].slice(1))).isNormalized; 
		if (gVal[i].indexOf(nroot) == -1)
			resNodes.push({name: gVal[i].join(","), type: isNorm?"default":"instrumented"});
		else
			resNodes.push({name: gVal[i].join(","), type: isNorm?"root":"root instrumented"});
	}
	gKey = [];
	gVal = [];
	invNodes = [];
	return new Array(resNodes,resLinks);
}

function addLink(res,ele){
	var dupl = false;;
	if (res != null){
		for(var i = 0; i < res.length; i++){
			if (res[i].source == ele.source && res[i].target == ele.target){
				if (res[i].label.split(",").indexOf(ele.label) == -1)
					res[i].label += (", "+ele.label);
				dupl = true;
				break;
			}
		}
		if (!dupl)
			res.push(ele);
	}
	return res;
}