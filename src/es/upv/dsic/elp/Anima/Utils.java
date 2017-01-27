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
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Arrays;
import java.util.Stack;
import java.util.Timer;
import java.util.TimerTask;

public class Utils {
	final static boolean USEMONGODB = false;
	final static String BEGIN_TOKEN = "ANIMA-BEG";
	final static String END_TOKEN = "ANIMA-END";
	final static int maudeTimeout = 300000; //300 * 1000
	
	public static String executeParse(String maudeInput, boolean isFullMaude) throws Exception {		
		String[] maudeOutput;
		int indexOfBegin, indexOfEnd;
		
		if (isFullMaude) {
			maudeOutput = Utils.executeCmd(Arrays.copyOfRange(Paths.fullMaudeArgs,0,6), maudeInput, Utils.maudeTimeout);
			if (maudeOutput != null && maudeOutput.length > 1 && maudeOutput[0] != null && !maudeOutput[0].isEmpty()){
				String result = maudeOutput[0].replaceAll("\n","");
				if (result.contains("Warning: Parse error in") || result.contains("Error: no parse for")){
					result = "";
					String[] errors = maudeOutput[0].split("\n");
					for(int i = 0; i < errors.length; i++){
						if (errors[i].contains("reduce in "))
							break;
						else if (!errors[i].isEmpty() && !errors[i].equals("Bye."))
							result+=errors[i]+"\n\n";
					}
					throw new Exception(result.substring(result.indexOf("Maude> ")+7).trim());
				}
			}
		}
		else {
			maudeOutput = Utils.executeCmd(Arrays.copyOfRange(Paths.maudeArgs,0,5), maudeInput, Utils.maudeTimeout);
			if (maudeOutput != null && maudeOutput.length > 1 && maudeOutput[1] != null && !maudeOutput[1].isEmpty()){
				String result = maudeOutput[1];
				String[] errors = result.split("Warning:");
				maudeOutput[1] = "";
				for(int i = 0; i < errors.length; i++){
					if (errors[i] != null && !errors[i].trim().isEmpty()){
						if (errors[i].contains("no loop state."))
							throw new Exception("NO_LOOP");
						if (!errors[i].contains("multiple distinct parses for"))
							maudeOutput[1] += "Warning:" + errors[i].trim();
					}
				}
				if (!maudeOutput[1].isEmpty())
					throw new Exception(result);
			}
		}
		maudeOutput[0] = maudeOutput[0].replaceAll("\n","");
		indexOfBegin = maudeOutput[0].indexOf("reduce in")+9;
		indexOfEnd = maudeOutput[0].indexOf(" : ");
		String result = maudeOutput[0].substring(indexOfBegin, indexOfEnd).trim();
		return result;
	}
	
	public static String executeCommand(String maudeInput) throws Exception {		
		String[] maudeOutput;
		if (USEMONGODB){
			String data = MongoDB.loadData(maudeInput);
			if (data != null)
				return data;
		}
		maudeOutput = Utils.executeCmd(Paths.maudeArgs, maudeInput, Utils.maudeTimeout);
		if (maudeOutput != null && maudeOutput.length > 1 && maudeOutput[1] != null && (maudeOutput[1].indexOf("no parse for statement") != -1 || maudeOutput[1].indexOf("bad token") != -1))
			throw new Exception();
		int indexOfBegin = maudeOutput[0].indexOf(Utils.BEGIN_TOKEN)+Utils.BEGIN_TOKEN.length();
		int indexOfEnd = maudeOutput[0].indexOf(Utils.END_TOKEN);
		String result = maudeOutput[0].substring(indexOfBegin, indexOfEnd).trim();
		if (result.contains("ANIMA-ERR")) throw new Exception();
		if (USEMONGODB)
			MongoDB.saveData(maudeInput, result);
		return result;
	}
	
    public static String readFile (String file) throws IOException
    {
        FileInputStream in = null;
        String content = "";

        try
        {
            File f = new File(file);
            in = new FileInputStream(file);

            int c = (int) f.length();
            byte[] contentBytes = new byte[c];
            in.read(contentBytes);
            content = new String(contentBytes);
        }
        finally
        {
            if (in != null)
            {
                in.close();
            }
        }

        return content;
    }

    public static void saveFile (String pathFile, String data) throws IOException
    {
        FileOutputStream out = null;

        try
        {
            File f = new File(pathFile);
            f.delete();
            out = new FileOutputStream(pathFile);
            out.write(data.getBytes());
        }
        finally
        {
            if (out != null)
            {
                out.close();
            }
        }
    }

    public static String repeatChar (char ch, int length)
    {
        char[] arr = new char[length];
        java.util.Arrays.fill(arr, ch);
        return new String(arr);
    }

    private static class ErrorString {
    	public StringBuilder sbe;
    }
    
    public static String[] executeCmd (String[] commands, String data, int timeout)
    {
        assert (commands != null);
        assert (commands.length > 0);

        try
        {
            StringBuilder sb = new StringBuilder();
            final ErrorString sbe = new ErrorString();
            sbe.sbe = new StringBuilder();
            
            Process p = Runtime.getRuntime().exec(commands);
            Timer timer = new Timer();
            try
            {
                Thread thread = Thread.currentThread();
                timer.schedule(new InterruptScheduler(thread), timeout);
                InputStreamReader es = new InputStreamReader(p.getErrorStream());
                InputStreamReader is = new InputStreamReader(p.getInputStream());
                OutputStreamWriter os = new OutputStreamWriter(p.getOutputStream());
                BufferedReader in = new BufferedReader(is);
                BufferedWriter out = new BufferedWriter(os);
                final BufferedReader err = new BufferedReader(es);
                
                //Capture warnings to:
                //	a) Avoid deadlock in case of the process writing into the stderr before stdin.
                //	b) Detect ambiguity in the provided query.
                //Important: Create Thread BEFORE READ OR WRITE to avoid deadlocks in both cases.
                new Thread() {
                    @Override public void run() {
                        String linerr;
                        try {
							while ((linerr = err.readLine()) != null){
								sbe.sbe.append(linerr+"\n");
							}
						} catch (IOException e) {}
                    }
                }.start();
                
                out.write(data);
                out.close();
                String line = null;
                while ((line = in.readLine()) != null) {
                    sb.append(line+"\n");
                }

                p.waitFor();
            }
            catch (InterruptedException e)
            {
                p.destroy();
                String msg = commands[0] +
                        " timed out after " + timeout + " seconds.";
                throw new RuntimeException(msg);
            }
            finally
            {
                timer.cancel();
            }

            return new String[]{sb.toString(),sbe.sbe.toString()};
        }
        catch (Exception e)
        {
            throw new RuntimeException("executeCmd failed: " + e.getMessage());
        }
    }

    /**
     * Finds the first occurence of any of the supplied characters.
     * Returns -1 if none was found.
     */
    public static int strtok (StringBuilder sb, String delim)
    {
        return strtok(sb.toString(), delim);
    }

    public static int strtok (String s, String delim, int i)
    {
        int lsb = s.length(), ld = delim.length();
        assert (i >= 0);
        assert (i < lsb);

        while (i < lsb)
        {
            for (int j = 0; j < ld; j++)
            {
                if (s.charAt(i) == delim.charAt(j))
                {
                    return i;
                }
            }
            i++;
        }

        return -1;
    }

    public static int strtok (String s, String delim)
    {
        return strtok(s, delim, 0);
    }

    /**
     * Flattens an array of strings (with separator)
     */
    public static String flatten (String[] strings, String separator)
    {
        StringBuilder sb = new StringBuilder();
        boolean any = false;

        for (String s : strings)
        {
            if (any)
            {
                sb.append(separator);
            }
            any = true;
            sb.append(s);
        }

        return sb.toString();
    }

    /**
     * Replaces every occurence of the first character with the second,
     * if the next character is not c.
     */
    public static String replaceCharExcept (String str, char a, char b, char c)
    {
        StringBuilder sb = new StringBuilder(str);

        int i = str.indexOf(a);
        while (i >= 0)
        {
            if (i + 1 < str.length() && str.charAt(i + 1) != c)
            {
                sb.setCharAt(i, b);
            }
            i = str.indexOf(a, i + 1);
        }

        return sb.toString();
    }

    /**
     * Inserts a string after each occurence of the characters in delim
     * in the input string.
     * 
     * @param s input string
     * @param delim string with the delimiting characters
     * @param sep inserted string
     * @return output string
     */
    public static String addStringAfter (String s, String delim, String sep)
    {
        StringBuilder sb = new StringBuilder();

        int i = 0;
        while (true)
        {
            int j = strtok(s, delim, i);

            if (j < 0)
            {
                sb.append(s.substring(i));
                break;
            }
            else
            {
                sb.append(s.substring(i, j + 1));
                sb.append(sep);
                i = j + 1;
            }
        }

        return sb.toString();
    }

    /**
     * Inserts a string before each occurence of the characters in delim
     * in the input string.
     * 
     * @param s input string
     * @param delim string with the delimiting characters
     * @param sep inserted string
     * @return output string
     */
    public static String addStringBefore (String s, String delim, String sep)
    {
        StringBuilder sb = new StringBuilder();

        int i = 0;
        while (true)
        {
            int j = strtok(s, delim, i);

            if (j < 0)
            {
                sb.append(s.substring(i));
                break;
            }
            else
            {
                sb.append(s.substring(i, j));
                sb.append(sep);
                sb.append(s.charAt(j));

                i = j + 1;
            }
        }

        return sb.toString();
    }

    /**
     * Remove matching chars from the string
     */
    public static String removeChars (String s, String delim)
    {
        StringBuilder sb = new StringBuilder();

        int i = 0;
        while (true)
        {
            int j = strtok(s, delim, i);

            if (j < 0)
            {
                sb.append(s.substring(i));
                break;
            }
            else
            {
                sb.append(s.substring(i, j));
                i = j + 1;
            }
        }

        return sb.toString();
    }

    /**
     * Remove whitespace from the string
     * 
     * @param s input String
     * @return String without whitespace
     */
    public static String removeWhitespace (String s)
    {
        return Utils.removeChars(s, " \t\n");
    }

    /**
     * Pretty-format data
     * 
     * @param s input String
     * @return formatted String
     */
    public static String beautify (String s)
    {
        String tmp = s;
        tmp = removeWhitespace(tmp);
        tmp = Utils.addStringAfter(tmp, ",?:", " ");
        tmp = Utils.addStringBefore(tmp, ":?", " ");
        return tmp;
    }

    /**
     * Parses until a same-level (wrt parentheses) comma is found.
     * 
     * @param delim delimiter character
     * @param s input string
     * @return The first String in the array contains the field value,
     * @return the other contains the unparsed remaining String; or null,
     * @return if the delimiter was not found.
     */
    public static String[] tryParseUntil (char delim, String s)
    {
        final String PARENTHESIS = ")";
        final String BRACKET = "]";
        final String CURLY = "}";

        String[] tuple = new String[2];

        // Using Strings to avoid the hassle of a boxed char...
        Stack<String> stack = new Stack<String>();

        for (int i = 0; i < s.length(); i++)
        {
            char c = s.charAt(i);

            // This case must be tested before the others, so the
            // special characters can be used as delimiters as well
            if (c == delim && stack.empty())
            {
                tuple[0] = s.substring(0, i);
                tuple[1] = s.substring(i + 1);
                return tuple;
            }

            switch (c)
            {
                case '(':
                    stack.push(PARENTHESIS);
                    break;

                case '[':
                    stack.push(BRACKET);
                    break;

                case '{':
                    stack.push(CURLY);
                    break;

                case ')':
                case ']':
                case '}':
                    if (stack.empty())
                    {
                        throw new RuntimeException("missing opening symbol for '" + c + '\'');
                    }
                    else
                    {
                        String last = stack.pop();
                        if (last.charAt(0) != c)
                        {
                            throw new RuntimeException("unbalanced '" + c + '\'');
                        }
                    }
            }
        }

        return null;
    }

    /*
     * Like tryParseUtil, but it throws an exception if the
     * delimiter character is not found instead of returning null.
     */
    public static String[] parseUntil (char delim, String s)
    {
        String[] result = tryParseUntil(delim, s);
        if (result == null)
        {
            throw new RuntimeException("delimiter not found");
        }
        else
        {
            return result;
        }
    }

    /*
     * Alias for a very common invokation
     */
    public static String[] parseUntilComma (String s)
    {
        return parseUntil(',', s);
    }

    public static boolean isAnyOf (String s, char c)
    {
        for (int i = 0; i < s.length(); i++)
        {
            if (s.charAt(i) == c)
            {
                return true;
            }
        }
        return false;
    }
}

// Taken from http://www.aviransplace.com/2008/04/17/how-to-safely-execute-process-from-java/
class InterruptScheduler extends TimerTask
{
    Thread target = null;

    public InterruptScheduler (Thread target)
    {
        this.target = target;
    }

    @Override
    public void run ()
    {
        target.interrupt();
    }
}
