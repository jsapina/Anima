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

package es.upv.dsic.elp.Anima;

//WARNING: Uncomment your OS and configure with your own data
public class Paths {
	//Windows
	final static String maudeBasePath = "C:\\Eclipse\\Workspace\\Anima\\WebContent\\maudev\\";
	final static String[] maudeArgs = new String[] { maudeBasePath + "maudev.exe","-no-advise","-no-banner","-no-wrap","anima.maude" };
	final static String[] fullMaudeArgs = new String[] { maudeBasePath + "maudev.exe","-no-advise","-no-banner","-no-wrap","anima.maude","full-maude.maude" };

	//Linux
	//final static String maudeBasePath = "/srv/anima/tomcat/webapps/anima/maudev/";
	//final static String[] maudeArgs = new String[] { maudeBasePath + "maudev.linux","-no-advise","-no-banner","-no-wrap",maudeBasePath + "anima.maude" };
	//final static String[] fullMaudeArgs = new String[] { maudeBasePath + "maudev.linux","-no-advise","-no-banner","-no-wrap",maudeBasePath + "anima.maude",maudeBasePath + "full-maude.maude" };
	
	//MacOS
	//final static String maudeBasePath = "/Users/jsapina/Eclipse/Workspace/Anima/WebContent/maudev/";
	//final static String[] maudeArgs = new String[] { maudeBasePath + "maudev.darwin","-no-advise","-no-banner","-no-wrap",maudeBasePath + "anima.maude" };
	//final static String[] fullMaudeArgs = new String[] { maudeBasePath + "maudev.darwin","-no-advise","-no-banner","-no-wrap",maudeBasePath + "anima.maude",maudeBasePath + "full-maude.maude" };
}
