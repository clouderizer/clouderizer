package automl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import automl.CallbackWithError;

public class Utils {
	public static void RunScriptApply(String script, boolean withBash, CallbackWithError cb) {
		String res="", errRes="";
//		JSONObject result = new JSONObject();
		try {
			System.out.println(script);
		    Runtime r = Runtime.getRuntime();
		    Process proc = null;
		    if(withBash) {
		    		String cmds[] = new String[] {"bash", "-c", script};
			    proc = r.exec(cmds);
		    } else {
		    		proc = r.exec(script);
		    }

		    BufferedReader in = new BufferedReader(new InputStreamReader(proc.getInputStream()));
		    BufferedReader err = new BufferedReader(new InputStreamReader(proc.getErrorStream()));
		    
		    String errLine="";
		    while((errLine = err.readLine()) != null) {
		    	errRes+=errLine;
		    }
		    
//		    result.put("error", errRes);
		    
		    String line="";
			while ((line = in.readLine()) != null) {
    			res+=line;
			}
		    
//			result.put("output", res);
		} catch (IOException e) {
		    System.out.println(e.getMessage());
		}
		if(res!="") cb.callback(res);
		else cb.callback(errRes);
	}
}