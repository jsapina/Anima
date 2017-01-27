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

var EX_BANK = 0;
var EX_BLOCKS = 1;
var EX_BRP = 2;
var EX_CONTAINER = 3;
var EX_CROSSING = 4;
var EX_DEKKER = 5;
var EX_PROTOCOL = 6;
var EX_FIBONACCI = 7;
var EX_NPA = 8;
var EX_MAZE = 9;
var EX_MINMAX = 10;
var EX_PHILO = 11;
var EX_PROTEIN = 12;
var EX_RENTCAR = 13;
var EX_SEMAPHORE = 14;
var EX_STOCKS = 15;
var EX_STOCKSOO = 16;
var EX_WEBMAIL = 17;
var EX_WOLFRAM = 18;

function showExample(ex) {
	$('#exampleWindow').modal('show');
	switch(ex) {
		case EX_PROTOCOL :
			$('#spanExampleWindowTitle').text("Fault-tolerant Protocol");
			$('#exampleWindowContent').html("<p>This Maude specification models an environment where several clients and servers interact. Each server " +
				"can serve many clients. However, for the sake of simplicity, we assume that each client communicates with a single server.</p><p>Clients " +
				"are represented as 4-tuples of the form [C, S, Q, A], where C is the client's name, S is the name of the server it wants to communicate " +
				"with. Program states are formalized as a soup (multiset) of clients, servers, and messages, whereas the system behavior is formalized " +
				"through five rewrite rules that model a faulty communication environment in which messages can arrive out of order, can be duplicated, " + 
				"and can be lost.</p><p>However, the right-hand side [C, S, Q, A] of the rule rec includes an intentional, barely perceptible bug that does " + 
				"not let the client structure be correctly updated with the incoming response D. The correct right-hand side should be [C, S, Q, D].</p>");
			break;
		case EX_BANK :
			$('#spanExampleWindowTitle').text("Bank Model");
			$('#exampleWindowContent').html("<p>This Maude specification encodes a conditional rewrite theory modeling a simple, distributed banking system. Each state of the system is "+
				"modeled as a multiset (i.e., an associative and commutative list) of elements of the form e<sub>1</sub> ; e<sub>2</sub> ; ... ; e<sub>n</sub>. "+
				"Each element e<sub>i</sub> is either (i) a bank account ac(Id,b), where ac is a constructor symbol (denoted by the Maude ctor attribute), Id is the owner of the "+
				"account and b is the account balance; or (ii) a message modeling a debit, credit, or transfer operation. These account operations are implemented via three rewrite rules: "+
				"namely, the debit, credit, and transfer rules.</p><p>The bug involving this module is located in the the rule debit, in which we have intentionally omitted the equational condition M <= b. "+ 
				"Roughly speaking, the considered specification always authorizes withdrawals even in the bizarre case when the amount of money to be "+
				"withdrawn is greater than the account balance.</p>");
			break;
		case EX_BLOCKS :
			$('#spanExampleWindowTitle').text("Blocks World");
			$('#exampleWindowContent').html("<p>Blocks World is one of the most famous planning problems in artificial intelligence. We assume that there " +
				"are some blocks, placed on a table, that can be moved by means of a robot arm; the goal of the robot arm " +
				"is to produce one or more vertical stacks of blocks.</p><p>In this specification we define a Blocks World system with three " +
				"different kinds of blocks that are defined by means of the operators a, b, and c of sort Block. Different " +
				"blocks have different sizes that are described by using the unary operator size. We also consider some " +
				"operators that formalize block and robot arm properties whose intuitive meanings are given in the accompanying " +
				"program comments.</p><p>The states of the system are modeled by means of associative and commutative " +
				"lists of properties of the form prop<sub>1</sub> & prop<sub>2</sub> & ... & prop<sub>n</sub>, which describe any possible configuration " + 
				"of the blocks on the table, as well as the status of the robot arm. The system behavior is formalized by four, " +
				"simple rewrite rules that control the robot arm.</p><p>Barely perceptible, this Maude specification fails to provide a " +
				"correct Blocks World implementation. By using the module, it is indeed possible to derive system " +
				"states that represent erroneous configuration. This is because the pickup rule, as it never checks the emptiness " + 
				"of the robot arm before grasping a block.</p>");
			break;
		case EX_NPA :
			$('#spanExampleWindowTitle').text("Maude-NPA");
			$('#exampleWindowContent').html("<p>Maude-NPA is an analysis tool for cryptographic protocols that takes into account many of the algebraic properties " +
					"of cryptosystems that are not considered by other tools. These include cancellation of encryption and decryption, Abelian groups (including " +
					"exclusive-or), exponentiation, and homomorphic encryption. By using unification, Maude-NPA performs backwards search from a given final state " +
					"in order to determine whether or not it is reachable. Unlike the original NPA, it has a theoretical basis in rewriting logic and narrowing, " +
					"and offers support for a wider class of equational theories that includes commutative (C), associative-commutative (AC), and " +
					"associative-commutative-identity (ACU) theories.</p>");
			break;
		case EX_MAZE :
			$('#spanExampleWindowTitle').text("Maze (with collision)");
			$('#exampleWindowContent').html("<p>" +
				"This Maude specification defines a maze game in which multiple players must reach a given exit point. " +
				"Players may enter the maze at distinct entry points, and can move through the maze by walking or jumping. " + 
				"Furthermore, any collision between two players eliminates them from the game. " +
				"Roughly speaking, a maze is a size &times; size grid in which each maze position is specified by a pair of natural numbers < X,Y > of sort Pos. " +
				"The internal maze structure is defined through the equation wall, which explicitly defines those cells that represent the maze walls. "+
				"</p><p>Each player's path in the maze is described by a term of sort List that specifies a list of (pairwise distinct) positions. " +
				"The next possible player's moves are nondeterministically computed by the rules walk and jump, which respectively augment L with the position P delivered by the rewrite expressions next(L; N) => P, with N = 1 (walk) or N = 2 (jump), occurring in the condition of these two rules. The function next(L; N) models all the possible N-cell movements that are available from the current player's location (given by the last position in L). In both rules, the correctness of the computed subsequent position P is verified by means of the function isOK(L P). Specifically, position P is valid if it is within the limits of the maze, not repeated in L, and not a part of the maze wall. Note that the jump rule allows a player to leap over either a wall or another player provided the position reached is valid. " +
				"</p><p>Collisions between two players are implemented by means of the eject rule, which checks whether two players bump on the same position and eliminates them from the maze by replacing their associated triples with the empty state value. " +
				"Finally, the exit rule checks whether a given player has reached the lower right corner position < size,size > that we assume to be the maze exit.</p>");
		break;
		case EX_WEBMAIL :
			$('#spanExampleWindowTitle').text("Webmail application");
			$('#exampleWindowContent').html("<p>This webmail application written in Maude models both server-side aspects (e.g., web script evaluations, database interactions) and browser-side "+
				"features (e.g., forward/backward navigation, web page refreshing, window/tab openings).</p><p>"+
				"The web application behavior is formalized by using rewrite rules of the form [label] : WebState &rArr; WebState, where WebState is a triple that we represent with the "+
				"following operator [ _ ] _ [ _ ] [ _ ] : (Browsers  &times; BrowserActions &times; Message  &times; Server) &rarr; WebState that can be interpreted "+
				"as a system shot that captures the current configuration of the active browsers (i.e., the browsers currently using the webmail application) together with the channel "+
				"through which the browsers and the server communicate via message-passing.</p>"); 
			break;
	}
	
}