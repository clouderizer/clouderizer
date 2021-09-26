package automl;


import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.CharBuffer;
import java.nio.channels.Channels;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.xml.bind.JAXBException;

//import org.jpmml.evaluator.Evaluator;
//import org.jpmml.evaluator.LoadingModelEvaluatorBuilder;
//import org.jpmml.evaluator.visitors.DefaultVisitorBattery;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.pmml4s.model.Model;
import org.xml.sax.SAXException;

import ai.h2o.mojos.runtime.MojoPipeline;
import ai.h2o.mojos.runtime.lic.LicenseException;
import hex.genmodel.MojoModel;
import hex.genmodel.easy.exception.PredictException;
import jnr.unixsocket.*;
import automl.Handler;


public class UnixClient extends Thread {
	public static String base_url;
	public static String ping_ep="/api/servingmodel/shutdown";
	public static String homedir = "/tmp"; 
	public static String platform;
	public static String model_type;
	public static String servingid;
	public static String h2o_dai_zip_path = "/tmp/gotit.zip";
	public static String h2o_zip_path_rohan_local = "/Users/rohan.kothapalli/Downloads/h2o3/deeplearning_model.zip";
	public static String dai_pipeline_mojo_path = "/tmp/workdir/mojo-pipeline/pipeline.mojo";
	public static String pmml_path = "/tmp/model.pmml";
	public static String model_path = "/tmp/model.pmml";
	public static String pmml_local_path = "/Users/rohan.kothapalli/iris.pmml";
	public static String dai_pipeline_rohan_local = "/Users/rohan.kothapalli/Downloads/h2o/mojo-pipeline/pipeline.mojo";
	private static String processId;
    public static void main(String[] args) throws IOException, InterruptedException, JSONException, PredictException, LicenseException {
    	
	if(args.length>0) {
		UnixClient.model_type=args[0].toLowerCase();
		UnixClient.base_url=args[1].toLowerCase();
		UnixClient.servingid=args[2].toLowerCase();
		UnixClient.reqbody = args[3].toLowerCase();
		UnixClient.model_path = '/home/app/function/asset/model.file';
	} else {
		// Logger.LogError("Invalid arguments.", null);
		System.out.println({"success": false, msg: "Invalid arguments."}.toString());
		System.exit(0);
	}
    	
	java.io.File path = new java.io.File("/tmp/random.sock");
	
	UnixSocketAddress address = new UnixSocketAddress(path);
	UnixSocketChannel channel;

	MojoPipeline dai_model = null;
	MojoModel h2o_model = null;
	Model pmml4smodel = null;
	
	if(model_type.equals("dai")) {
		try {
			dai_pipeline_mojo_path = model_path;
			dai_model = MojoPipeline.loadFrom(dai_pipeline_mojo_path);
		} catch (Exception e) {
			// Issues like invalid license file should be propogated from here
			// Logger.LogMessage("Exception in dai loading!");
			// Logger.LogMessage(e.getMessage());
			JSONObject err = prepareError(e.getMessage());
			// channel = UnixSocketChannel.open(address);
			// send(err.toString(), channel);
			System.out.println({"success": false, "msg": err.toString()}.toString());
			System.exit(0);
		}
	} else if(model_type.equals("h2o")) {
		h2o_dai_zip_path = model_path;
		h2o_model = MojoModel.load(h2o_dai_zip_path);
	} else if(model_type.equals("jpmml")) {
	} else if(model_type.equals("pmml4s")) {
		try {
			pmml_path = model_path;
			pmml4smodel = Model.fromFile(pmml_path);
		} catch (Exception e) {
			// System.out.println(e.getMessage());
			JSONObject err = prepareError(e.getMessage());
			// channel = UnixSocketChannel.open(address);
			// send(err.toString(), channel);
			System.out.println({"success": false, "msg": err.toString()}.toString());
			System.exit(0);
		}
	}
	JSONObject modelLoading = new JSONObject();
	modelLoading.put("java_model_loading", false);
	modelLoading.put("processId", UnixClient.processId);
       
	// CharBuffer result = CharBuffer.allocate(65536);
	// r.read(result);
	// result.flip();
	// System.out.println(result.toString());
	JSONObject j = new JSONObject(reqbody);
	// System.out.println(j.toString());
	
	String[] predictArr= {};
	
	if(j.has("exit") && j.getString("exit").equals("true")) {
		System.out.println({"success": false, "msg": "Java exit with status code 0"}.toString());
		System.exit(0);
	}
            
	String qq="";
	if(j.has("csv")) {
		qq = j.getString("csv");
		predictArr = qq.split(",");
		
		// System.out.println(predictArr);
		
		if(predictArr.length < j.getInt("length")) {
			String bigarray[] = new String[j.getInt("length")];
			
			for(int i=0; i<j.getInt("length");i++) {
				if(i<predictArr.length) bigarray[i] = predictArr[i];
				else bigarray[i] = "";
			}
			
			if(UnixClient.model_type.equals("h2o")) {
//                    	Logger.LogMessage(j.getString("zip_path"));
			
				// Logger.LogMessage(qq.toString());
				
				JSONObject op = null;
				if(predictArr.length>0) {
					op = H2OPredict.predictArray(h2o_model, bigarray);
				}
				
				if(op!=null) {
					op.put("success", true);
					// send(op.toString(), channel);
					System.out.println({"success": true, "msg": op.toString()}.toString());
				}

			}
			
			if(UnixClient.model_type.equals("dai")) {
				JSONObject outp = null;
				if(predictArr.length>0) {
					outp = DaiPredict.predictArray(dai_model, bigarray);
				}
			
				if(outp != null) {
					outp.put("success", true);
					// send(outp.toString(), channel);
					System.out.println({"success": true, "msg": outp.toString()}.toString());
				}
			}
			
			if(UnixClient.model_type.equals("pmml4s")) {
				JSONObject pmml4sop = null;
				if(predictArr.length>0) {
					pmml4sop = PmmlPredict.pmml4spredict(pmml4smodel, bigarray);
				}
				
				if(pmml4sop!=null) {
					// send(pmml4sop.toString(), channel);
					System.out.println({"success": true, "msg": pmml4sop.toString()}.toString());
				}
			}
			
		} else {
			if(UnixClient.model_type.equals("h2o")) {
			
				// Logger.LogMessage(qq.toString());
				
				
				JSONObject op = null;
				if(predictArr.length>0) {
					op = H2OPredict.predictArray(h2o_model, predictArr);
				}
				
				if(op!=null) {
//                    		op.put("success", true);
					// send(op.toString(), channel);
					System.out.println({"success": true, "msg": op.toString()}.toString());
				}
			}
			
			if(UnixClient.model_type.equals("dai")) {
				JSONObject outp = null;
				if(predictArr.length>0) {
					outp = DaiPredict.predictArray(dai_model, predictArr);
//                    		Logger.LogMessage(output.toString());
				}
			
				if(outp!=null) {
//                    		outp.put("success", true);
					// send(outp.toString(), channel);
					System.out.println({"success": true, "msg": outp.toString()}.toString());
				}
			}
			
			if(UnixClient.model_type.equals("pmml4s")) {
				JSONObject pmml4sop = null;
				if(predictArr.length>0) {
					pmml4sop = PmmlPredict.pmml4spredict(pmml4smodel, predictArr);
				}
				
				if(pmml4sop!=null) {
					// send(pmml4sop.toString(), channel);
					System.out.println({"success": true, "msg": pmml4sop.toString()}.toString());
				}
			}
		}
	}
	
	if(j.has("mcsv")) {
		JSONArray mcsv = j.getJSONArray("mcsv");
		JSONArray output = new JSONArray();
		// System.out.println(mcsv);
		
		for(int i=0;i<mcsv.length();i++) {
			JSONObject row = mcsv.getJSONObject(i);
			boolean success = row.getBoolean("success");
			String data;
			if(success==true) {
//            			data = row.getString("data");
//            			predictArr = data.split(",");
				JSONArray predict_arr=row.getJSONArray("data");
				String bigarray[] = new String[j.getInt("length")];
				
//                    	for(int x=0; x<j.getInt("length");x++) {
				for(int x=0; x<predict_arr.length();x++) {
					if(x<predict_arr.length()) bigarray[x] = predict_arr.getString(x);
					else bigarray[x] = "";
				}
				
				// System.out.println(pmml4smodel);
				// System.out.println(bigarray);
				
				JSONObject op = null;
				if(UnixClient.model_type.equals("h2o")) op = H2OPredict.predictArray(h2o_model, bigarray);
				else if(UnixClient.model_type.equals("dai")) op = DaiPredict.predictArray(dai_model, bigarray);
//            			else if(UnixClient.model_type.equals("jpmml")) op = PmmlPredict.predict(evaluator, bigarray);
				else if(UnixClient.model_type.equals("pmml4s")) op = PmmlPredict.pmml4spredict(pmml4smodel, bigarray);
				
				// System.out.println(op.toString());
				output.put(op);
			} else {
				output.put(mcsv.getJSONObject(i));
			}
		}

		// send(output.toString(), channel);
		System.out.println({"success": true, "msg": output.toString()}.toString());
	}
    
// 	public static void send(String data, UnixSocketChannel channel) throws IOException {
// //    	UnixSocketAddress address = new UnixSocketAddress(unix_socket_path);
// //        UnixSocketChannel channel = UnixSocketChannel.open(address);
//         System.out.println("connected to " + channel.getRemoteSocketAddress());
//         PrintWriter w = new PrintWriter(Channels.newOutputStream(channel));
        
//         w.print(data);
//         w.flush();
//     }
	
	public static String ClouderizerPing(String value) {
		String finalJson = "";
		try {

			URL url = new URL(UnixClient.base_url + UnixClient.ping_ep);
			//URL url = new URL("http://192.168.43.252:1337" + started_url);
			HttpURLConnection conn = (HttpURLConnection) url.openConnection();
			conn.setRequestMethod("POST");
			conn.setRequestProperty("Accept", "application/json");
			
			String urlParameters = "servingid="+value;

			// Send post request
			conn.setDoOutput(true);
			DataOutputStream wr = new DataOutputStream(conn.getOutputStream());
			wr.writeBytes(urlParameters);
			wr.flush();
			wr.close();

			if (conn.getResponseCode() != 200) {
				BufferedReader br = new BufferedReader(new InputStreamReader(
					(conn.getErrorStream())));

				String output;
				
				// Logger.LogMessage("Error from Server .... \n");
				while ((output = br.readLine()) != null) {
					finalJson += output;
				}
					
				JSONParser p = new JSONParser();
				JSONObject o = (JSONObject) p.parse(finalJson);
//				String err = o != null ? ClouderizerUtil.GetStringFromJson(o, "msg") : "HTTP request failed with 500";
				throw new RuntimeException();
			}

			BufferedReader br = new BufferedReader(new InputStreamReader(
				(conn.getInputStream())));

			String output;
			
			// Logger.LogMessage("Output from Server .... \n");
			while ((output = br.readLine()) != null) {
				finalJson += output;
				//Logger.LogMessage(output);
			}
			
			conn.disconnect();
			
//			try (PrintStream out = new PrintStream(new FileOutputStream(ClouderizerService.mac_cred.homedir + "/.clouderizer/ping.txt"))) {
//				DateFormat df = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
//				Date date = new Date();
//				out.println( df.format(date) );
//			}

		  } catch (MalformedURLException e) {

			e.printStackTrace();

		  } catch (IOException e) {

			e.printStackTrace();

		  } catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return finalJson;
	}
	
	public static void sendMessageAndExit() {
		
	}
	
	public static JSONObject prepareError(String message) {
		JSONObject error = new JSONObject();
		try {
			error.put("success", false);
			error.put("msg", message);
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return error;
	}
}