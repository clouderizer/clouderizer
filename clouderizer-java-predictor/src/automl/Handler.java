package automl;

import java.io.IOException;

import org.json.simple.JSONObject;

import jnr.unixsocket.UnixSocketChannel;

public class Handler implements Thread.UncaughtExceptionHandler {
	 
//    private static Logger LOGGER = LoggerFactory.getLogger(Handler.class);
	private UnixSocketChannel channel;
	
	Handler(UnixSocketChannel channel) {
		this.channel = channel;
	}
 
    public void uncaughtException(Thread t, Throwable e) {
    	
    	Logger.LogMessage(e.getMessage());
    	JSONObject err = new JSONObject();
    	err.put("success", false);
    	if(e.getMessage().contains("Unknown categorical level")) {
    		try {
    			err.put("message", e.getMessage());
				UnixClient.send(err.toString(), channel);
			} catch (IOException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
    	}
    }
}
