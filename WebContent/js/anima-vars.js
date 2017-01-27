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

var GENERIC_ERROR = 0;
var BAD_FILE = 1;
var BAD_PROGRAM = 2;
var BAD_STATE = 3;
var NO_BULLET = 4;
var NO_EXPAND = 5;
var NO_EXPPAR = 6;
var QUERY_EMP = 7;
var QUERY_NOR = 8;
var QUERY_ERR = 9;
var COMMANDS_DETECTED = 10; 
var ORDER_NOT_FOUND = 11;
var FILE_NOT_FOUND = 12;

var MODE_STEPPER = 0;
var MODE_PARTIAL = 1;
var MODE_FORWARD = 2;

var TRACE_LARGE = 0; //extended view
var TRACE_MEDIUM = 1; //standard view
var TRACE_SMALL = 2; //compact view

var EXP_STATE = 0;
var EXP_TRACE = 1;
var EXP_CONDITION = 2;

var MAX_EXPAND = 3;

var TYPE_MB = "membership";
var TYPE_EQ = "equational";
var TYPE_MA = "matching";
var TYPE_RW = "rewrite";

var myProgram;
var myTree = null;
var autoselect = false;
var autodelete = false;
var expanding = null;
var zoom = 100;
var drawing = null;
var isWorking = false;
var isLocked = false;

var astate = null;      //Anima export state
var inode = null;       //iJulienne export state
var icond = null;       //iJulienne export condition
var icsli = null;       //iJulienne export sliced condition
var idtraced = null;     //Anima traced node

var cgWindow = null;	//Graph window
var sgWindow = null;	//Sliced graph window

var modName= null;
var isFullMaude = null;