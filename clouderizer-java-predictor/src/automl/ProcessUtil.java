package automl;

import java.io.BufferedWriter;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Field;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

import automl.Callback;
import automl.Logger;
import automl.StreamGobbler;
import main.java.io.socket.client.Socket;

public class ProcessUtil {
	
	private static void DeleteProcessID(String name) {
		File file = new File(ParserService.homedir + "/.clouderizer/.run/" + name + ".pid");
		file.delete();
	}
	
	 private static void SaveProcessID(String name, Long pidOfProcess) {
		 // TODO Auto-generated method stub
		 File file = new File(ParserService.homedir + "/.clouderizer/.run/" + name + ".pid");
	 	 file.getParentFile().mkdirs();
		 BufferedWriter writer = null;
		 try {
			 writer = new BufferedWriter(new FileWriter(file));
			 writer.write(pidOfProcess.toString());
		 } catch (Exception e) {
		    e.printStackTrace();
		 } finally {
			 try {
				 // Close the writer regardless of what happens...
				 writer.close();
			 } catch (Exception e) {
			 }
		}
	}
	
	public static synchronized long getPidOfProcess(Process p) {
		long pid = -1;
		
		try {
		  if (p.getClass().getName().equals("java.lang.UNIXProcess")) {
		    Field f = p.getClass().getDeclaredField("pid");
	        f.setAccessible(true);
	        pid = f.getLong(p);
	        f.setAccessible(false);
	      }
	    } catch (Exception e) {
	      pid = -1;
	    }
	    return pid;
	  }
	
	public static Process RunProcess(String name, String[] commands, Callback scb, Callback ecb) {
		Process proc = RunProcess(name, commands, null, null, scb, ecb);
		
		return proc;
	}
	
	public static Process RunProcess(String name, String[] commands, String[] envp, Callback scb, Callback ecb) {
		Process proc = RunProcess(name, commands, envp, null, scb, ecb);
		
		return proc;
	}
	
	public static Process RunProcess(String name, String[] commands, String[] envp, String wd, Callback scb, Callback ecb) {
		try {
			ProcessBuilder pb = new ProcessBuilder(commands);
			Map<String, String> env = pb.environment();
			if(envp != null) {
				for(String s:envp) {
					if(s != null) {
						String[] args = s.split("=");
						if(args != null && args.length == 2) {
							env.put(args[0], args[1]);
						}
					}
				}
			}
			
			if(wd != null) {
				pb.directory(new File(wd));
			}
			
			final Process proc = pb.start();
			
			if(scb != null) {
				new Thread( new Runnable() {
				    @Override
				    public void run() {
				    		try {
			    				Thread.sleep(100);
			    				while(!proc.isAlive()) {
			    					Thread.sleep(1000);
			    				}
						} catch (InterruptedException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
				    		
				    		//Process create.
				    		
				    		scb.callback();
				    }
				}).start();
			}
			
			if(ecb != null) {
				new Thread( new Runnable() {
				    @Override
				    public void run() {
				    		try {
			    				proc.waitFor();
						} catch (InterruptedException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
				    		DeleteProcessID(name);
				    		ecb.callback();
				    }

					
				}).start();
			}
			
			//create pid file with name and PID inside
			SaveProcessID(name, getPidOfProcess(proc));
			
			StreamGobbler errorGobbler = new 
	                StreamGobbler(proc.getErrorStream(), "ERROR");            
	            
            // any output?
            StreamGobbler outputGobbler = new 
                StreamGobbler(proc.getInputStream(), "OUTPUT");
                
            // kick them off
            errorGobbler.start();
            outputGobbler.start();
			
			return proc;
			
		} catch (IOException e) {
		    Logger.LogMessage(e.getMessage());
		    if(ecb != null) {
		    		ecb.callback();
		    }
		    
		}
		
		return null;
	}
	
	public static void cleanup(String homedir, Socket socket) {
		try {
			Runtime.getRuntime().exec(new String[] {"rm", "-R", homedir+"/workdir", "/tmp/h2o.zip"});
			socket.emit("parser_err", "Couldn't parse the zip file!");
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public static JSONObject prepareResponse(String message, boolean success) {
		JSONObject err = new JSONObject();
		try {
			err.put("success", success);
			err.put("message", message);
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return err;
	}
}
