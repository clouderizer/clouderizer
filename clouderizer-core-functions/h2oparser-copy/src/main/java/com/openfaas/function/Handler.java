package com.openfaas.function;

import java.io.File;
import java.io.IOException;
import java.lang.Exception;
import java.lang.IllegalStateException;
import java.lang.NullPointerException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.sql.Timestamp;
import com.openfaas.model.IHandler;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.List;
// import com.openfaas.function.ProcessUtil;
import com.openfaas.function.Logger;
import com.openfaas.function.DaiParser;
import hex.genmodel.MojoModel;
import ai.h2o.mojos.runtime.lic.LicenseException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.openfaas.model.IResponse;
import com.openfaas.model.IRequest;
import com.openfaas.model.Response;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import net.lingala.zip4j.core.ZipFile;
import net.lingala.zip4j.exception.ZipException;

public class Handler extends com.openfaas.model.AbstractHandler {
	public static String homedir = "/tmp";
	public static String tesseract_path = "~/";
	public static boolean tesseract_on = false;
	
    public IResponse Handle(IRequest req) {
        Response res = new Response();
        String req_json_str = req.getBody();
        JSONObject res_json = new JSONObject();
    	int statuscode = 500;
		// int statuscode_h2o = 500;
        try {
            res_json.put("success", false);
            res_json.put("message", "Error parsing model file");
            JSONObject req_json = new JSONObject(req_json_str);
			System.out.println(req_json);
            String model_url = req_json.getString("url");
			// String model_type = req_json.getString("modeltype");
            int timeout = 3000;
            // Download the model file
			System.out.println("About to download file");
			String file_path = "model.zip";

            FileUtils.copyURLToFile(new URL(model_url), new File(file_path), timeout, timeout);
			
			System.out.println("Downloaded the model file....about to parse now");
			// JSONObject parsed_json = new JSONObject();
			JSONObject out = new JSONObject();
			new ZipFile("model.zip").extractAll("/tmp/modelextract");
			File f = new File(homedir + "/modelextract/mojo-pipeline/pipeline.mojo");
			File f_h2o = new File(homedir + "/modelextract/model.ini");

			JSONObject parse_model = null;
			try {
				if (f.exists()) {
					System.out.println("dai");
					parse_model = daiparser(homedir + "/modelextract/mojo-pipeline/pipeline.mojo");
					out.put("parse_model", parse_model);
					out.put("platform", "dai");
				} else if (f_h2o.exists()) {
					System.out.println("h2o");
					parse_model = h2oparser("model.zip");
					out.put("parse_model", parse_model);
					out.put("platform", "h2o");
				} else {
					System.out.println("Neither dai nor h2o");
				}
				System.out.println("Parsing completed...");
				statuscode = 200;
				
			} catch (Throwable e) {
				e.printStackTrace();
            	res_json = prepareResponse("An internal server error has occured.", false);
			}
			if(out != null) {
				res_json = out;
			}
			
        } catch(OutOfMemoryError e) {
			try {
				Files.deleteIfExists(Paths.get("/tmp/.lock"));
			} catch (IOException e1) {
				e1.printStackTrace();
			}
			} catch (JSONException e) {
            e.printStackTrace();
            res_json = prepareResponse("An internal server error has occured.", false);
        } catch (MalformedURLException e) {
            e.printStackTrace();
            res_json = prepareResponse("Unable to read model file.", false);
        } catch (IOException e) {
            e.printStackTrace();
            res_json = prepareResponse("Unable to download model file.", false);
		} catch (ZipException e) {
           e.printStackTrace();
		   res_json = prepareResponse("An internal server error has occured.", false);
        } 
    	finally {
            res.setBody(res_json.toString());
            res.setStatusCode(statuscode);
        }
		System.out.println("Returning now...");
	    return res;
    }

	public static JSONObject h2oparser(String zip_path) throws IOException, JSONException {
		try{
			MojoModel mj = MojoModel.load(zip_path);
			// System.out.println(mj._modelDescriptor);
			// System.out.println(mj._modelAttributes);
			System.out.println(mj.getModelCategory());
			JSONObject fin = new JSONObject();

			if (mj.getModelCategory().equals("Binomial") || mj.getModelCategory().equals("Multinomial")) {
				fin.put("numresponseclasses", mj.getNumResponseClasses());
			}

			fin.put("nfeatures", mj.nfeatures());
			fin.put("numclasses", mj.getNumCols());
			fin.put("domains", mj._domains);
			fin.put("modelCategory", mj.getModelCategory());
			fin.put("nclasses", mj.nclasses());
			fin.put("oa", mj._responseColumn);
			fin.put("subtype", "h2o");
			fin.put("all_columns", mj.getNames());

			Timestamp ts = new Timestamp(System.currentTimeMillis());

			fin.put("timestamp", ts);

			String headers[] = new String[mj.getNames().length];
			for (int i = 0; i < mj.getNames().length; i++) {
				headers[i] = mj.getNames()[i];
			}
			fin.put("ia", headers);
			Runtime.getRuntime().exec(new String[] { "rm", "-R", homedir + "/modelextract" });
			Runtime.getRuntime().exec(new String[] { "rm", "/tmp/h2o.zip" });
			return fin;
		}
		catch (NullPointerException | JSONException | IllegalStateException e) {
			e.printStackTrace();
		}
		catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}

	public static JSONObject daiparser(String path) {
		Logger.LogMessage("Inside Dai Parser");
		try {
			JSONArray ia = DaiParser.inputAttr(path);
			JSONArray oa = DaiParser.outputAttr(path);
			
			JSONObject fin = new JSONObject();
			fin.put("ia", ia);
			fin.put("oa", oa);
			fin.put("subtype", "dai");

			Timestamp ts = new Timestamp(System.currentTimeMillis());
		
			fin.put("timestamp", ts);
			Logger.LogMessage(fin.toString());
			Runtime.getRuntime().exec(new String[] {"rm", "-R", homedir+"/modelextract"});
			Runtime.getRuntime().exec(new String[] {"rm", "/tmp/h2o.zip"});
			return fin;
		} catch (IOException | LicenseException | JSONException e) {
			e.printStackTrace();
		}
		return null;
	}
    
    public JSONObject prepareResponse(String message, boolean success) {
		JSONObject err = new JSONObject();
		try {
			err.put("success", success);
			err.put("message", message);
		} catch (JSONException e) {
			e.printStackTrace();
		}
		return err;
	}
}
