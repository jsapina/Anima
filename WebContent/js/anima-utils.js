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

function convertHTMLSymbols(str){
	str = str.replace(/&/g, "&amp;");
	str = str.replace(/\"/g, "&quot;");
	str = str.replace(/\'/g, "&apos;");
	str = str.replace(/\</g, "&lt;");
	str = str.replace(/\>/g, "&gt;");
	str = str.replace(/ /g, "&nbsp;");
	if (myTree.mode == MODE_PARTIAL)
		str = str.replace(/•/g, "<span class=\"bullet\">◦</span>");
	else
		str = str.replace(/•/g,"<span class=\"bullet\">•</span>");
	return str;
}

function revertHTMLSymbols(str){
	str = str.replace(/&amp;/g, "&");
	str = str.replace(/&quot;/g, "\"");
	str = str.replace(/&apos;/g, "\'");
	str = str.replace(/&lt;/g, "<");
	str = str.replace(/&gt;/g, ">");
	str = str.replace(/&nbsp;/g, " ");
	if (myTree.mode == MODE_PARTIAL)
		str = str.replace(/◦/g, "•");
	return str;
}

function replaceRegExpMetaChars(res){
	res = res.replace(/\^/g,"\\^");
	res = res.replace(/\[/g,"\\[");
	res = res.replace(/\./g,"\\.");
	res = res.replace(/\$/g,"\\$");
	res = res.replace(/\{/g,"\\{");
	res = res.replace(/\*/g,"\\*");
	res = res.replace(/\(/g,"\\(");
	res = res.replace(/\+/g,"\\+");
	res = res.replace(/\)/g,"\\)");
	res = res.replace(/\|/g,"\\|");
	res = res.replace(/\?/g,"\\?");
	res = res.replace(/\</g,"\\<");
	res = res.replace(/\>/g,"\\>");
	return res;
}

function loadXMLDoc(url, doWork) {
	var xmlhttp = NewXMLHttpRequest();
	if (xmlhttp != null) {
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4) {
				if (xmlhttp.status==200)
					doWork(xmlhttp);
				else
					alert("Cannot retrieve " + url);
			}
		};
		xmlhttp.open("GET", url, true);
		xmlhttp.send(null);
	}
	else
		alert("Your browser does not support XMLHttpRequest.");
}

function NewXMLHttpRequest() {
	if (window.XMLHttpRequest)
		return new XMLHttpRequest();
	if (window.ActiveXObject)
		return new ActiveXObject("Microsoft.XMLHTTP");
	return null;
}

function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++)
		if ((new Date().getTime() - start) > milliseconds)
			break;
}

function rgb2hex(rgb){
	rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	return "#" +
		("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
		("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
		("0" + parseInt(rgb[3],10).toString(16)).slice(-2);
}

//http://stackoverflow.com/questions/4726344/how-do-i-change-text-color-determined-by-the-background-color
function idealTextColor(bgColor) {
	var nThreshold = 105;
	var components = getRGBComponents(bgColor);
	var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);
	return ((255 - bgDelta) < nThreshold) ? "#000000" : "#FFFFFF";   
}

function getRGBComponents(color) {       
	var r = color.substring(1, 3);
	var g = color.substring(3, 5);
	var b = color.substring(5, 7);

	return {
		R: parseInt(r, 16),
		G: parseInt(g, 16),
		B: parseInt(b, 16)
	};
}

Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
};

RegExp.escape= function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
};

function hideIrrelevant(html,src,relevant,builtIn){
	if (html != null && src){
		if (!relevant || (myTree.trusted && builtIn))
			return "<span class=\"bullet\">" + html + "</span>";
		
		return html.replace(/&lt;&nbsp;<span class="bullet">•<\/span>&nbsp;(\|&nbsp;<span class="bullet">•<\/span>&nbsp;)*&gt;/g,"<span class=\"bullet\">$&</span>")
		.replace(/&lt;&nbsp;<span class="bullet">•<\/span>&nbsp;(\,&nbsp;<span class="bullet">•<\/span>&nbsp;)*&gt;/g,"<span class=\"shaded\">$&</span>")
		.replace(/[a-zA-Z]*\(<span class="bullet">•<\/span>(,(&nbsp;)*<span class="bullet">•<\/span>)*\)/g,"<span class=\"shaded\">$&</span>")
		.replace(/[a-zA-Z]*\[<span class="bullet">•<\/span>(,(&nbsp;)*<span class="bullet">•<\/span>)*\]/g,"<span class=\"shaded\">$&</span>");
	}
	return html;
}

function removeIrrelevant(html,src){
	if (html != null && src){
		return html.replace(/&lt;&nbsp;<span class="bullet">•<\/span>&nbsp;(\|&nbsp;<span class="bullet">•<\/span>&nbsp;)*&gt;/g,"")
		.replace(/&lt;&nbsp;<span class="bullet">•<\/span>&nbsp;(\,&nbsp;<span class="bullet">•<\/span>&nbsp;)*&gt;/g,"")
		.replace(/[a-zA-Z]*\(<span class="bullet">•<\/span>(,(&nbsp;)*<span class="bullet">•<\/span>)*\)/g,"")
		.replace(/[a-zA-Z]*\[<span class="bullet">•<\/span>(,(&nbsp;)*<span class="bullet">•<\/span>)*\]/g,"")
		.replace(/<span class="bullet">•<\/span>/g,"")
		.replace(/[ \s\t]/g,"");
	}
	return html;
}

function getFlag(error) {
	switch(error){
		case "COMMANDS_DETECTED" :
			return COMMANDS_DETECTED;
		case "ORDER_NOT_FOUND" :
			return ORDER_NOT_FOUND;
		case "FILE_NOT_FOUND" :
			return FILE_NOT_FOUND;
		default: 
			return GENERIC_ERROR;
	}
}