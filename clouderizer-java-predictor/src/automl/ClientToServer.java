package automl;

import java.io.DataOutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

public class ClientToServer {
	//Helper functions for server communication
	
			public static void updateSubType(String servingid, String subtype) throws IOException {
				URL url = new URL(ParserService.base_url + "/api/updatesubtype/");
				
				System.out.println(ParserService.base_url + "/api/updatesubtype");
				HttpURLConnection conn = (HttpURLConnection) url.openConnection();
				conn.setRequestMethod("POST");
				conn.setRequestProperty("Accept", "application/json");
				
				String urlParameters = "servingid="+ servingid + "&subtype="+ subtype;
				
				conn.setDoOutput(true);
				DataOutputStream wr = new DataOutputStream(conn.getOutputStream());
				wr.writeBytes(urlParameters);
				wr.flush();
				wr.close();
				
				if(conn.getResponseCode()!=200) {
					DataOutputStream wr2 = new DataOutputStream(conn.getOutputStream());
					wr2.writeBytes(urlParameters);
					wr2.flush();
					wr2.close();
					
					System.out.println("2nd try response code");
					System.out.println(conn.getResponseCode());
				} else {
					System.out.println(conn.getResponseCode());
				}
			
				conn.disconnect();
			}
}