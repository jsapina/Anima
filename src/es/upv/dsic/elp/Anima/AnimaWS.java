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

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Scanner;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.sun.jersey.core.header.FormDataContentDisposition;
import com.sun.jersey.multipart.FormDataParam;

@Path("")
public class AnimaWS {
	private String DEBUG_STR = "\n\nset print format off .\nset print conceal on .\nprint conceal fmod_is_sorts_.____endfm .\nprint conceal mod_is_sorts_._____endm .\nprint conceal _->^{_,_,_}_ .\n";
	
	@GET
	@Produces(MediaType.TEXT_PLAIN)
	public String index() {
		return "Welcome to the Anima Web Service";
	}

	@POST @Path("parse-program")
	@Produces(MediaType.TEXT_PLAIN)
	public String parseProgram(@FormParam("program") String program) {
		try {
			if (!noCommands(program))
				throw new Exception("COMMANDS_DETECTED");
			StringBuilder sb = new StringBuilder().append(program).append(DEBUG_STR);
			sb.append("red true .\n\nquit .\n");
			String result = Utils.executeParse(sb.toString(),false);
			return "falseELP-RESULT" + result;
		}
		catch (Exception excore) {
			if (!excore.getMessage().equals("NO_LOOP")) 
				return excore.getMessage(); 
			try {
				StringBuilder sb = new StringBuilder().append(program).append(DEBUG_STR);
				sb.append("(red true .)\n\nquit .\n");
				String result = Utils.executeParse(sb.toString(),true);
				return "trueELP-RESULT" + result;
			}
			catch (Exception exfull) {
				return exfull.getMessage();
			}
		}
	}
	
	@POST @Path("init")
	@Produces(MediaType.TEXT_PLAIN)
	public String initializeTree(
			@FormParam("modname") String modName, 
			@FormParam("program") String program, 
			@FormParam("state") String state, 
			@FormParam("fullmaude") Boolean isFullMaude) {
		try {
			StringBuilder sb = new StringBuilder();
			if (!state.startsWith("'"))
				sb.append("mod ELP-TOOL is  pr ANIMA .\n\n  op elpState : -> String .\n  eq elpState = \""+state.replace("\"", "\\\"")+"\" .\nendm\n\n"+(isFullMaude?"load full-maude.maude\n\n(view Position from TRIV to ELP-SORTS is\n  sort Elt to Position .\nendv)\n\n(view QidType from TRIV to ELP-SORTS is\n  sort Elt to QidType .\nendv)\n\n":""));
			else
				sb.append("mod ELP-TOOL is  pr ANIMA .\n\n  op elpState : -> Term .\n  eq elpState = "+state+" .\nendm\n\n"+(isFullMaude?"load full-maude.maude\n\n(view Position from TRIV to ELP-SORTS is\n  sort Elt to Position .\nendv)\n\n(view QidType from TRIV to ELP-SORTS is\n  sort Elt to QidType .\nendv)\n\n":""));
			sb.append(program + DEBUG_STR);
			
			if (isFullMaude)
				sb.append("(rew in ELP-TOOL : initialize(labelModule(upModule("+modName+")),(elpState)) .)\n\nquit .\n");
			else
				sb.append("rew in ELP-TOOL : initialize(labelModule(upModule('"+modName+",true)),(elpState)) .\n\nquit .\n");
			String result = Utils.executeCommand(sb.toString());
			return result;
		}
		catch (Exception ex) {
			return "Anima error detected.";
		}
	}

	@POST @Path("interactive")
	@Produces(MediaType.TEXT_PLAIN)
	public String doInteractive(
			@FormParam("modname") String modName, 
			@FormParam("program") String program, 
			@FormParam("state") String state, 
			@FormParam("fullmaude") Boolean isFullMaude) {
		try {
			StringBuilder sb = new StringBuilder();
			sb.append("mod ELP-TOOL is  pr ANIMA .\n\n  op elpState : -> Term .\n  eq elpState = "+state+" .\nendm\n\n"+(isFullMaude?"load full-maude.maude\n\n(view Position from TRIV to ELP-SORTS is\n  sort Elt to Position .\nendv)\n\n(view QidType from TRIV to ELP-SORTS is\n  sort Elt to QidType .\nendv)\n\n":""));
			sb.append(program + DEBUG_STR);
			
			if (isFullMaude)
				sb.append("(rew in ELP-TOOL : doInteractive(labelModule(upModule("+modName+")),(elpState)) .)\n\nquit .\n");
			else
				sb.append("rew in ELP-TOOL : doInteractive(labelModule(upModule('"+modName+",true)),(elpState)) .\n\nquit .\n");
			String result = Utils.executeCommand(sb.toString());
			return result;
		}
		catch (Exception ex) {
			return "Anima error detected.";
		}
	}

	@POST @Path("partial")
	@Produces(MediaType.TEXT_PLAIN)
	public String doPartial(
			@FormParam("modname") String modName, 
			@FormParam("program") String program, 
			@FormParam("state") String state, 
			@FormParam("criteria") String criteria, 
			@FormParam("slice") String slice, 
			@FormParam("fullmaude") Boolean isFullMaude) {
		try {
			if (criteria.isEmpty()) criteria = "noPos";
			StringBuilder sb = new StringBuilder();
			sb.append("mod ELP-TOOL is  pr ANIMA .\n\n  op elpState : -> Term .\n  eq elpState = "+state+" .\n  op elpCriteria : -> Position .\n  eq elpCriteria = "+criteria+" .\n  op elpSlice : -> Term .\n  eq elpSlice = "+slice+" .\nendm\n\n"+(isFullMaude?"load full-maude.maude\n\n(view Position from TRIV to ELP-SORTS is\n  sort Elt to Position .\nendv)\n\n(view QidType from TRIV to ELP-SORTS is\n  sort Elt to QidType .\nendv)\n\n":""));
			sb.append(program + DEBUG_STR);
			
			if (isFullMaude)
				sb.append("(rew in ELP-TOOL : doPartial(labelModule(upModule("+modName+")),(elpState),(elpCriteria),(elpSlice)) .)\n\nquit .\n");
			else
				sb.append("rew in ELP-TOOL : doPartial(labelModule(upModule('"+modName+",true)),(elpState),(elpCriteria),(elpSlice)) .\n\nquit .\n");
			String result = Utils.executeCommand(sb.toString());
			return result;
		}
		catch (Exception ex) {
			return "Anima error detected.";
		}
	}
	
	@POST @Path("forward")
	@Produces(MediaType.TEXT_PLAIN)
	public String doForward(
			@FormParam("modname") String modName, 
			@FormParam("program") String program, 
			@FormParam("state") String state, 
			@FormParam("criteria") String criteria, 
			@FormParam("slice") String slice, 
			@FormParam("fullmaude") Boolean isFullMaude) {
		try {
			if (criteria.isEmpty()) criteria = "noPos";
			StringBuilder sb = new StringBuilder();
			sb.append("mod ELP-TOOL is  pr ANIMA .\n\n  op elpState : -> Term .\n  eq elpState = "+state+" .\n  op elpCriteria : -> Position .\n  eq elpCriteria = "+criteria+" .\n  op elpSlice : -> Term .\n  eq elpSlice = "+slice+" .\nendm\n\n"+(isFullMaude?"load full-maude.maude\n\n(view Position from TRIV to ELP-SORTS is\n  sort Elt to Position .\nendv)\n\n(view QidType from TRIV to ELP-SORTS is\n  sort Elt to QidType .\nendv)\n\n":""));
			sb.append(program + DEBUG_STR);
			
			if (isFullMaude)
				sb.append("(rew in ELP-TOOL : doForward(labelModule(upModule("+modName+")),(elpState),(elpCriteria),(elpSlice)) .)\n\nquit .\n");
			else
				sb.append("rew in ELP-TOOL : doForward(labelModule(upModule('"+modName+",true)),(elpState),(elpCriteria),(elpSlice)) .\n\nquit .\n");
			String result = Utils.executeCommand(sb.toString());
			return result;
		}
		catch (Exception ex) {
			return "Anima error detected.";
		}
	}
	
	@POST @Path("query")
	@Produces(MediaType.TEXT_PLAIN)
	public String doQuery(
			@FormParam("modname") String modName, 
			@FormParam("program") String program, 
			@FormParam("topSorts") String topSorts, 
			@FormParam("topOps") String topOps, 
			@FormParam("states") String states, 
			@FormParam("pattern") String pattern,
			@FormParam("fullmaude") Boolean isFullMaude) {
		String maudeInput = null;
		String[] maudeOutput = null;
		String upTerm = "";
		String[] terms;
		
		try {
			// METAPARSE
			if (isFullMaude){
				StringBuilder sb = new StringBuilder();
                sb.append("(view Position from TRIV to ELP-SORTS is\n  sort Elt to Position .\nendv)\n\n(view QidType from TRIV to ELP-SORTS is\n  sort Elt to QidType .\nendv)\n");
				sb.append(program);
				sb.append("\n\n(mod " + modName + "-PRED is\n  inc " + modName + " .\n\n  " + topSorts + topOps + "\n\nendm)");
				sb.append(DEBUG_STR + "(rew in ANIMA : parseQuery(upModule("+modName+"-PRED),(\""+pattern+"\")) .)\n\nquit .\n");				
				maudeInput = sb.toString();
				maudeOutput = Utils.executeCmd(Paths.fullMaudeArgs, maudeInput, Utils.maudeTimeout);
				//There is ambiguity
				if (maudeOutput[0] != null && maudeOutput[0].indexOf("getTerm(ambiguity({'") != -1){
					maudeOutput[0] = maudeOutput[0].trim().replaceAll(" +"," ");
					String aux = maudeOutput[0].substring(maudeOutput[0].indexOf("getTerm(ambiguity({'")+20,maudeOutput[0].indexOf("}))"));
					terms = aux.split("[}], [{]'");
					terms[0] = terms[0].substring(0,terms[0].lastIndexOf(","));
					terms[1] = terms[1].substring(0,terms[1].lastIndexOf(","));
					return "ELP-AMBIGUITY:"+terms[0]+"ELP-AMBIGUITY"+terms[1];
				}
				//No ambiguity
				else{
					int indexOfBegin = maudeOutput[0].indexOf(Utils.BEGIN_TOKEN)+Utils.BEGIN_TOKEN.length();
					int indexOfEnd = maudeOutput[0].indexOf(Utils.END_TOKEN);
					upTerm = maudeOutput[0].substring(indexOfBegin, indexOfEnd).trim();
					
					if (upTerm.equals("(empty).GroundTermList"))
						return "QUERY_EMP";
					int numVar = 0;
					while(upTerm.indexOf("ELPIDENTIFY") != -1){
						upTerm = upTerm.replaceFirst("ELPIDENTIFY.","#IDENTIFY#"+numVar+":");
						numVar++;
					}
					while(upTerm.indexOf("ELPDISCARD") != -1){
						upTerm = upTerm.replaceFirst("ELPDISCARD.","#DISCARD#"+numVar+":");
						numVar++;
					}
					upTerm = upTerm.replaceAll(".Sort]",".Qid]");
					upTerm = upTerm.replaceAll(".Sort,",".Qid,");
					upTerm = ((upTerm+" ").replaceAll(".Sort ",".Qid "));
					
					if (upTerm == null || upTerm.length() == 0 || upTerm.indexOf("getTerm(noParse") != -1)
						throw new Exception();
				
					// DO QUERY
					sb = new StringBuilder().append("mod ELP-TOOL is  pr ANIMA .\n\n  op elpNodes : -> NodeTermList .\n  eq elpNodes = "+states+" .\nendm\n\nload full-maude.maude\n\n");
					sb.append(program);
					sb.append("\n\n(mod " + modName + "-PRED is\n  inc " + modName + " .\n\n  " + topSorts + "\n\nendm)");
					sb.append(DEBUG_STR + "(rew in ELP-TOOL : doQuery(upModule("+modName+"-PRED),(elpNodes),"+upTerm+") .)\n\nquit .\n");
					String result = Utils.executeCommand(sb.toString()); 
					return result;
				}
			}
			else {
				StringBuilder sb = new StringBuilder().append(program);
				sb.append("\n\nmod " + modName + "-PRED is\n  inc " + modName + " .\n\n  " + topSorts + topOps + "\n\nendm");
				sb.append(DEBUG_STR + "rew in ANIMA : parseQuery(upModule('"+modName+"-PRED,true),(\""+pattern+"\")) .\n\nquit .\n");				
				maudeInput = sb.toString();
				maudeOutput = Utils.executeCmd(Paths.maudeArgs, maudeInput, Utils.maudeTimeout);
				//There is ambiguity
				if (maudeOutput[0] != null && maudeOutput[0].indexOf("getTerm(ambiguity({'") != -1){
					maudeOutput[0] = maudeOutput[0].trim().replaceAll(" +"," ");
					String aux = maudeOutput[0].substring(maudeOutput[0].indexOf("getTerm(ambiguity({'")+20,maudeOutput[0].indexOf("}))"));
					terms = aux.split("[}], [{]'");
					terms[0] = terms[0].substring(0,terms[0].lastIndexOf(","));
					terms[1] = terms[1].substring(0,terms[1].lastIndexOf(","));
					return "ELP-AMBIGUITY:"+terms[0]+"ELP-AMBIGUITY"+terms[1];
				}
				//No ambiguity
				else{
					int indexOfBegin = maudeOutput[0].indexOf(Utils.BEGIN_TOKEN)+Utils.BEGIN_TOKEN.length();
					int indexOfEnd = maudeOutput[0].indexOf(Utils.END_TOKEN);
					upTerm = maudeOutput[0].substring(indexOfBegin, indexOfEnd).trim();
				
					if (upTerm.equals("(empty).EmptyCommaList"))
						return "QUERY_EMP";
					
					int numVar = 0;
					while(upTerm.indexOf("ELPIDENTIFY") != -1){
						upTerm = upTerm.replaceFirst("ELPIDENTIFY.","#IDENTIFY#"+numVar+":");
						numVar++;
					}
					while(upTerm.indexOf("ELPDISCARD") != -1){
						upTerm = upTerm.replaceFirst("ELPDISCARD.","#DISCARD#"+numVar+":");
						numVar++;
					}
					upTerm = upTerm.replaceAll(".Sort]",".Qid]");
					upTerm = upTerm.replaceAll(".Sort,",".Qid,");
					upTerm = ((upTerm+" ").replaceAll(".Sort ",".Qid "));
					
					if (upTerm == null || upTerm.length() == 0 || upTerm.indexOf("getTerm(noParse") != -1)
						throw new Exception();
				
					// DO QUERY
					sb = new StringBuilder().append("mod ELP-TOOL is  pr ANIMA .\n\n  op elpNodes : -> NodeTermList .\n  eq elpNodes = "+states+" .\nendm\n\n");
					sb.append(program);
					sb.append("\n\nmod " + modName + "-PRED is\n  inc " + modName + " .\n\n  sorts sAssertion fAssertion Assertion .\n  subsorts sAssertion fAssertion < Assertion .\n\n" + topSorts + "\n\nop _`{_`} : Universal Bool -> sAssertion [ ctor poly (1) ] .\n  op _`{_`}->_`{_`} : Universal Bool Universal Bool -> fAssertion [ ctor poly (1 3) ] .\n\nendm");
					sb.append(DEBUG_STR + "rew in ELP-TOOL : doQuery(upModule('"+modName+"-PRED,true),(elpNodes),"+upTerm+") .\n\nquit .\n");
					String result = Utils.executeCommand(sb.toString()); 
					return result;
				}
			}
		}
		catch (Exception ex) {
			return "Anima error detected.";
		}
	}
	
	@POST @Path("upload")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	@Produces(MediaType.TEXT_PLAIN)
	public String uploadFile(
			@FormDataParam("file") InputStream uploadedInputStream,
			@FormDataParam("file") FormDataContentDisposition fileDetail) {
		try {
			if (fileDetail.getFileName().endsWith(".maude") || fileDetail.getFileName().endsWith(".fm")) {
				Scanner scn = new Scanner(uploadedInputStream,"UTF-8");
				String fileText = scn.useDelimiter("\\A").next();
				scn.close();
				uploadedInputStream.close();
				if (noCommands(fileText))
					return fileText;
				else
					throw new Exception("COMMANDS_DETECTED");
			}
			else if (fileDetail.getFileName().endsWith(".zip")) {
				ArrayList<String> order = null;
				HashMap<String,String> program = new HashMap<String,String>();
				ZipInputStream zis = new ZipInputStream(uploadedInputStream);
				ZipEntry entry;
				String start = new String();
				while ((entry = zis.getNextEntry()) != null)
				{
					String ename = entry.isDirectory()?"":entry.getName().toLowerCase().trim();
					if (order == null && ename.equals("order.anima"))
						order = parseOrder(zis);
					else if (ename.equals("start.anima"))
						start = readEntry(zis).trim();
					else {
						String fileText =  readEntry(zis);
						if (noCommands(fileText))
							program.put(ename, fileText);
					}
				}
				if (order == null){
					zis.close();
					uploadedInputStream.close();
					throw new Exception("ORDER_NOT_FOUND");
				}
				StringBuilder sb = new StringBuilder();
				for(int i = 0; i < order.size(); i++){
					if (program.get(order.get(i)) != null)
						sb.append(program.get(order.get(i)));
					else
						throw new Exception("FILE_NOT_FOUND");
				}
				zis.close();
				uploadedInputStream.close();
				return start.isEmpty()?sb.toString() : (sb.toString() + "ANIMA-SPLIT-AJAX" + start);
			}
			throw new Exception();
		}
		catch (Exception ex) {
			return ex.getMessage().isEmpty()?"Anima error detected.":ex.getMessage();
		}
	}
	
	public static String readEntry(ZipInputStream zis) {
		try {
			StringBuilder sb = new StringBuilder();
			BufferedReader br = new BufferedReader(new InputStreamReader(zis));
			String strLine;
			while ((strLine = br.readLine()) != null)   {
				sb.append(strLine+"\n");
			}
			sb.append("\n");
			return sb.toString();
		}
		catch(Exception e){
			return "";
		}
	}
	
	public static ArrayList<String> parseOrder(ZipInputStream zis){
		try {
			ArrayList<String> res = new ArrayList<String>();
			BufferedReader br = new BufferedReader(new InputStreamReader(zis));
			String strLine;
			while ((strLine = br.readLine()) != null)   {
				strLine = strLine.trim();
				if (strLine.length() > 0 && strLine.charAt(0) != '#')
					res.add(strLine.toLowerCase());
			}
			return res;
		}
		catch(Exception e){
			return null;
		}
	}
	
	private static String[] deleteModules(String module) {
		//ArrayList<String> res = new ArrayList<String>();
		//boolean inside = false;
		//return (String[]) res.toArray();
		//TODO: remove in-module lines. 
		return module.split("[\r\n]+");
	}
	
	public static boolean noCommands(String module) {
		String[] lines = deleteModules(module);
		if (lines == null || lines.length == 0)
			return true;
		
		for(int i = 0; i < lines.length; i++)
			if (lines[i] != null && lines[i].matches("(break|cd|continue|debug|eof|erew|erewrite|frew|frewrite|in|load|loop|ls|match|parse|popd|print|pushd|pwd|quit|red|reduce|rew|rewrite|search|select|set|show|trace|unify|xmatch)[\\s]+.*"))
				return false;
		return true;
	}
}
