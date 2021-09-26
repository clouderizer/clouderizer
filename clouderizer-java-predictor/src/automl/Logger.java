package automl;

import java.text.SimpleDateFormat;
import java.util.Date;

public class Logger {
	public static final org.slf4j.Logger LOG = org.slf4j.LoggerFactory.getLogger(Logger.class);
	
	public static void LogMessage(String msg) {
		Date date = new Date();
		SimpleDateFormat sdf = new SimpleDateFormat("MM/dd/yyyy h:mm:ss a");
		String formattedDate = sdf.format(date);
//		System.out.println(formattedDate + " : " + msg);
		
		Logger.LOG.info(formattedDate + " : " + msg);
	}
	
	public static void LogError(String msg, Throwable e) {
		Date date = new Date();
		SimpleDateFormat sdf = new SimpleDateFormat("MM/dd/yyyy h:mm:ss a");
		String formattedDate = sdf.format(date);
//		System.out.println(formattedDate + " : " + msg);
		
		Logger.LOG.error(formattedDate + " : " + msg, e);
	}
	
}