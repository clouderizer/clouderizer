package automl;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Paths;

//import com.clouderizer.client.service.ClouderizerService;

class StreamGobbler extends Thread
{
    InputStream is;
    
    String type;
    
    StreamGobbler(InputStream is, String type)
    {
        this.is = is;
        this.type = type;
    }
    
    public void run()
    {
        try
        {
            InputStreamReader isr = new InputStreamReader(is);
            BufferedReader br = new BufferedReader(isr);
            String line=null;
            
            while ( (line = br.readLine()) != null) {
            		
            		if(line.contains("Identity file "+ParserService.tesseract_path+" not accessible")) {
            			File f = new File(ParserService.tesseract_path);
            			if(!f.exists()) {
            				if(IsClouderizerReachable() && !ParserService.tesseract_on) {
            					//clouderizer_agent.restart();
                				
                				new Thread( new Runnable() {
                				    @Override
                				    public void run() {
                				    		try {
//                				    			ClouderizerService.tesseract_on = true;
                				    			Logger.LogMessage("Tesseract gone missing....invoking bifrost.");
                				    			
                    				    		//Send HUP to ironman and captainamerica to nudge them to try immediately d
                    				    		
                    				    		new java.util.Timer().schedule( 
                    				    		        new java.util.TimerTask() {
                    				    		            @Override
                    				    		            public void run() {
                    				    		                //Delete the file
                                    				    		try {
                            									Files.deleteIfExists(Paths.get(ParserService.tesseract_path));
                            								} catch (IOException e) {
                            									e.printStackTrace();
                            								}
                    				    		            }
                    				    		        }, 
                    				    		        5* 60 * 1000 
                    				    		);
                    				    		
                				    		} catch(Exception e) {
                				    			e.printStackTrace();
                				    		} finally {
                				    			//reset the flag
//                				    			ClouderizerService.tesseract_on = false;
                				    		}
                				    }
                				}).start();
                			}
            			}
            		}
            		Logger.LogMessage(type + ">" + line);
            }
                    
        } catch (IOException ioe)
          {
            ioe.printStackTrace();  
          }
    }

	private boolean IsClouderizerReachable() {
		try {
	        final URL url = new URL("https://console.clouderizer.com");
	        final URLConnection conn = url.openConnection();
	        conn.connect();
	        return true;
	    } catch (MalformedURLException e) {
	        throw new RuntimeException(e);
	    } catch (IOException e) {
	        return false;
	    }
	}
}