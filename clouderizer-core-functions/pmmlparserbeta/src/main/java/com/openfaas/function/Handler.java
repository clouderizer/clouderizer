package com.openfaas.function;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import com.openfaas.model.IHandler;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.openfaas.model.IResponse;
import com.openfaas.model.IRequest;
import com.openfaas.model.Response;

import org.pmml4s.common.StructField;
import org.pmml4s.common.StructType;
import org.pmml4s.metadata.DataDictionary;
import org.pmml4s.metadata.DataField;
import org.pmml4s.model.Model;
import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
public class Handler extends com.openfaas.model.AbstractHandler {

    public IResponse Handle(IRequest req) {
        Response res = new Response();
        String req_json_str = req.getBody();
        JSONObject res_json = new JSONObject();
        int statuscode = 500;
        try {
            res_json.put("success", false);
            res_json.put("message", "Error parsing model file");
            JSONObject req_json = new JSONObject(req_json_str);
            String model_url = req_json.getString("url");
            String file_path = "model.pmml";
            int timeout = 3000;
            // Download the model file
						System.out.println("About to download file");
            FileUtils.copyURLToFile(new URL(model_url), new File(file_path), timeout, timeout);
						System.out.println("Downloaded the model file....about to parse now");
						JSONObject parsed_json = pmml4sparser(file_path);
						System.out.println("Parsing completed...");

						//Thread.sleep(10000);
            if(parsed_json != null) {
                res_json = parsed_json;
                if(parsed_json.getBoolean("success")) {
                    statuscode = 200;
                }
            }

        } catch(OutOfMemoryError e) {
						//trigger unhealthy
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
        } finally {
            res.setBody(res_json.toString());
            res.setStatusCode(statuscode);
        }
			System.out.println("Returning now...");
	    return res;
    }

    public JSONObject pmml4sparser(String pmml_file) {
		
		try {
			Model model = Model.fromFile(pmml_file);
			
			DataDictionary dataFields = model.dataDictionary();
			
			if(model.isScorable()==false) {
				JSONObject err = new JSONObject();
                err.put("message", "Model is not scorable");
                err.put("success", false);
				return err;
			}
			
	//		System.out.println(model.outputFields()[1]);
			
			System.out.println(model.outputSchema());
			//int numOfOutputFields = model.outputFields().length;
			int numOfInputFields = model.inputFields().length;
			
			System.out.println(dataFields);
			
	 		JSONArray inputs = new JSONArray();
	 		JSONArray outputs = new JSONArray();
	 		
//			Object[] values = new Object[dataFields.size()];
//			
//			for(int i=0;i<values.length;i++) {
//				IOData data = new IOData();
//				DataField df = dataFields.apply(i);
//				
//				System.out.println(df.intervals());
//	//			System.out.println(df.opType());
//				
//				
//				if(i<numOfInputFields) {
//					List<Object> domainValues=Arrays.asList(df.validValues());
//					data.setDomains(domainValues);
//					
//					data.setName(df.name());
//					data.setDataType(df.dataType().toString());
//	
//	//				data.setOpType(df.opType());
//	//				System.out.println(Arrays.toString(domainValues.toArray()));
//					
//					ObjectMapper mapper = new ObjectMapper();
//					mapper.enable(SerializationFeature.INDENT_OUTPUT);
//					String json = mapper.writeValueAsString(data);
//					JSONObject convert = new JSONObject(json);
//					inputs.put(convert);
//				}
//	//			for(int j=0;j<df.validValues().length;j++) {
//	//				System.out.println(df.validValues()[j]);
//	//			}
//			}
	 			
	 		StructType inputSchema = model.inputSchema();
			
			for(int i=0;i<inputSchema.length();i++) {
				IOData input = new IOData();
				StructField sf = inputSchema.apply(i);
				input.setName(sf.name());
				input.setDataType(sf.dataType().toString());
				
				ObjectMapper mapper = new ObjectMapper();
				mapper.enable(SerializationFeature.INDENT_OUTPUT);
				String json;
				json = mapper.writeValueAsString(input);
				JSONObject convert = new JSONObject(json);
				inputs.put(convert);
			}
			
			StructType outputSchema = model.outputSchema();
			
			for(int i=0;i<outputSchema.length();i++) {
				IOData output = new IOData();
				StructField sf = outputSchema.apply(i);
				output.setName(sf.name());
				output.setDataType(sf.dataType().toString());
				
				ObjectMapper mapper = new ObjectMapper();
				mapper.enable(SerializationFeature.INDENT_OUTPUT);
				String json;
				json = mapper.writeValueAsString(output);
				JSONObject convert = new JSONObject(json);
				outputs.put(convert);
			}
			
			JSONObject j = new JSONObject();
			j.put("input", inputs);
			j.put("output", outputs);
            j.put("platform", "pmml4s");
            j.put("success", true);
            
			System.out.println(j.toString());
			
			return j;
		} catch (Exception e) {
			System.out.println(e.getMessage());
			JSONObject err = prepareResponse(e.getMessage(), false);
			return err;
		}
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
