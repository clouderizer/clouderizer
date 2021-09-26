package automl;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;

import javax.xml.bind.JAXBException;

import org.dmg.pmml.*;
//import org.dmg.pmml.FieldValue;

import org.jpmml.evaluator.Evaluator;
import org.jpmml.evaluator.InputField;
import org.jpmml.evaluator.LoadingModelEvaluatorBuilder;
import org.jpmml.evaluator.TargetField;
//import org.jpmml.evaluator.visitors.DefaultVisitorBattery;

//import org.jpmml.evaluator.*;
//import org.jpmml.evaluator.FieldValue;
//import org.jpmml.manager.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pmml4s.PmmlException;
import org.pmml4s.common.StructField;
import org.pmml4s.common.StructType;
import org.pmml4s.metadata.DataDictionary;
import org.pmml4s.metadata.DataField;
import org.pmml4s.model.Model;
import org.xml.sax.SAXException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class PmmlParser {
	
//	public static JSONObject jpmmlparser(String path) {
//		try {
//			File pmml_file = new File(path);
//			Evaluator evaluator = null;
//			if(pmml_file.exists()) {
//				evaluator = new LoadingModelEvaluatorBuilder()
//						.setLocatable(false)
//						.setVisitors(new DefaultVisitorBattery())
//						//.setOutputFilter(OutputFilters.KEEP_FINAL_RESULTS)
//						.load(new File(path))
//						.build();
//				
//				evaluator.verify();
//			} else {
//				JSONObject err = ProcessUtil.prepareResponse("File not found", false);
//				return err;
//			}
//			
//			JSONObject finalOutput = new JSONObject();
//			
//			List<? extends InputField> inputFields = evaluator.getInputFields();
//			
//			JSONArray inputs = new JSONArray();
//			for(InputField inputField: inputFields) {
//
//				org.dmg.pmml.DataField pmmlDataField = (org.dmg.pmml.DataField)inputField.getField();
//				org.dmg.pmml.MiningField pmmlMiningField = inputField.getMiningField();
//
//				org.dmg.pmml.DataType dataType = inputField.getDataType();
//				org.dmg.pmml.OpType opType = inputField.getOpType();
//				
//				IOData prepareIO = new IOData();
//				prepareIO.setName(inputField.getName().toString());
//				prepareIO.setDataType(inputField.getDataType().toString());
//				
//				switch(opType) {
//					case CONTINUOUS:
//						com.google.common.collect.RangeSet<Double> validInputRanges = inputField.getContinuousDomain();
//						System.out.println(validInputRanges);
//						break;
//					case CATEGORICAL:
//					case ORDINAL:
//						List<?> validInputValues = inputField.getDiscreteDomain();
//						prepareIO.setDomains(validInputValues);
//						break;
//					default:
//						break; 
//				}
//				
////				System.out.println(inputField);
////				System.out.println(inputField.getName());
//				ObjectMapper mapper = new ObjectMapper();
//				mapper.enable(SerializationFeature.INDENT_OUTPUT);
//				String json = mapper.writeValueAsString(prepareIO);
//				JSONObject convert = new JSONObject(json);
//				inputs.put(convert);
////			    System.out.println(json);
//			}
//			
////			List<? extends OutputField> outputFields = evaluator.getOutputFields();
////			System.out.println(outputFields);
//			
//			List<? extends TargetField> targetFields = evaluator.getTargetFields();
//			System.out.println(targetFields);
//				
//			JSONArray outputs = new JSONArray();
//			for(TargetField targetField: targetFields) {
//				IOData prepareOI = new IOData();
//				
//				try {
//					prepareOI.setName(targetField.getName().toString());
//					prepareOI.setDataType(targetField.getDataType().toString());
//				} catch (NullPointerException e) {
//					System.out.println(e.getMessage());
//				}
//				
//				ObjectMapper mapper = new ObjectMapper();
//				mapper.enable(SerializationFeature.INDENT_OUTPUT);
//				String json = mapper.writeValueAsString(prepareOI);
//				JSONObject convert = new JSONObject(json);
////				System.out.println(json);
//				outputs.put(convert);
//			}
//			
////			System.out.println(inputFields);
////			System.out.println(outputFields);
//			
//			
////			System.out.println(prepareIO.toString());
//			
//			JSONObject j = new JSONObject();
//			j.put("input", inputs);
//			j.put("output", outputs);
//			j.put("platform", "jpmml");
//			
//			System.out.println(j.toString());
//			
//			return j;
////			ack.call(null, j);
////			socket.emit("pmmlparser_ack", j);
//		} catch (IllegalArgumentException | IOException | SAXException | JAXBException | JSONException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//			System.out.println(e.getMessage());
//			JSONObject err = ProcessUtil.prepareResponse(e.getMessage(), false);
//			return err;
//		}
//	}
	
//	public static JSONObject jpmmlArchivedParser(String path) throws IOException, SAXException, JAXBException {
//		File file = new File(path);
//		PMML pmml = IOUtil.unmarshal(file);
//
//		PMMLManager pmmlManager = new PMMLManager(pmml);
//		
//		ModelEvaluator<?> modelEvaluator = (ModelEvaluator<?>)pmmlManager.getModelManager(null, ModelEvaluatorFactory.getInstance());
//		Evaluator evaluator = (Evaluator)modelEvaluator;
//		
//		org.dmg.pmml.DataDictionary datadict = pmml.getDataDictionary();
//		
//		List<FieldName> activeFields = evaluator.getActiveFields();
//		List<FieldName> predictedFields = evaluator.getPredictedFields();
//		List<FieldName> outputFields = evaluator.getOutputFields();
//		
//		System.out.println(activeFields);
//		System.out.println(predictedFields);
//		
//		List<org.dmg.pmml.DataField> dfs = datadict.getDataFields();
//		JSONArray inputs = new JSONArray();
//		JSONArray outputs = new JSONArray();
//		
//		Map<String,JSONObject> arrange = new HashMap<String, JSONObject>();
//		
//		for(org.dmg.pmml.DataField df: dfs) {
////			System.out.println(df.getDataType().toString().toLowerCase());
//			System.out.println(activeFields.contains(df.getName()));
////			System.out.println(df.getIntervals());
//			
//			if(activeFields.contains(df.getName())) {
//				IOData io = new IOData();
//				io.setDataType(df.getDataType().toString().toLowerCase());
//				io.setName(df.getName().toString());
//				
//				System.out.println(df.getName().toString());
//				if(df.getValues().size()>0) {
//					List<org.dmg.pmml.Value> values = df.getValues();
//					List<String> domainValues= new ArrayList<String>();
//					for(org.dmg.pmml.Value value:values) {
//						domainValues.add(value.getValue());
////						System.out.println(value.getDisplayValue());
//					}
//					
//					io.setDomains(domainValues);
//				}
//				
//				ObjectMapper mapper = new ObjectMapper();
//				mapper.enable(SerializationFeature.INDENT_OUTPUT);
//				String json = mapper.writeValueAsString(io);
//				try {
//					arrange.put(df.getName().toString(), new JSONObject(json));
//				} catch (JSONException e) {
//					// TODO Auto-generated catch block
//					e.printStackTrace();
//				}
////				ObjectMapper mapper = new ObjectMapper();
////				mapper.enable(SerializationFeature.INDENT_OUTPUT);
////				String json = mapper.writeValueAsString(io);
////				JSONObject convert;
////				try {
////					convert = new JSONObject(json);
////					inputs.put(convert);
////				} catch (JSONException e) {
////					// TODO Auto-generated catch block
////					e.printStackTrace();
////				}
//			} else {
//				IOData oi = new IOData();
//				oi.setDataType(df.getDataType().toString().toLowerCase());
//				oi.setName(df.getName().toString());
//				
//				if(df.getValues().size()>0) {
//					List<org.dmg.pmml.Value> values = df.getValues();
//					
//					List<String> domainValues= new ArrayList<String>();
//					for(org.dmg.pmml.Value value:values) {
//						domainValues.add(value.getValue());
////						System.out.println(value.getValue());
////						System.out.println(value.getDisplayValue());
//					}
//					
//					oi.setDomains(domainValues);
//				}
//				
//				ObjectMapper mapper = new ObjectMapper();
//				mapper.enable(SerializationFeature.INDENT_OUTPUT);
//				String json = mapper.writeValueAsString(oi);
//				JSONObject convert;
//				try {
//					convert = new JSONObject(json);
//					outputs.put(convert);
//				} catch (JSONException e) {
//					// TODO Auto-generated catch block
//					e.printStackTrace();
//				}
//			}
//		}
//		
//		
//		for(FieldName activeField: activeFields) {	
//			inputs.put(arrange.get(activeField.toString()));
//		}
//		
//		JSONObject j = new JSONObject();
//		try {
//			j.put("input", inputs);
//			j.put("output", outputs);
//			j.put("platform", "jpmml");
//		} catch (JSONException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
//		
//		System.out.println(j.toString());
//		
//		return j;
//		
////		for(int i=0;i<values.length;i++) {
////			IOData data = new IOData();
////			DataField df = dataFields.apply(i);
////			
////			System.out.println(df.intervals());
//
////		List<FieldName> activeFields = evaluator.getActiveFields();
////		for(FieldName activeField : activeFields){
////			// The raw (ie. user-supplied) value could be any Java primitive value
////			Object rawValue = ...;
////
////			// The raw value is passed through: 1) outlier treatment, 2) missing value treatment, 3) invalid value treatment and 4) type conversion
////			org.jpmml.evaluator.FieldValue activeValue = evaluator.prepare(activeField, rawValue);
////
////			arguments.put(activeField, activeValue);
////		}
//		
//	}
	
	public static JSONObject evaluatorType(String pmml_file) {
		// compare between 2 parsers based on the output type
		
		/*
		 * types of scenarios:
		 * 1. pmml4s works good and returns output
		 * 2. pmml4s doesn't work and fallback to jpmml
		 * 3. Both return an exception, no parsing
		 */
		
		try {
			JSONObject pmml4s = pmml4sparser(pmml_file);
//			JSONObject jpmml = jpmmlparser(pmml_file);
			
			String type = "pmml4s";
			
			System.out.println("pmml4s");
			System.out.println(pmml4s);
//			System.out.println("jpmml");
//			System.out.println(jpmml);
			
			
			// Test 1: Check if output is null for one of the parsers
			if(!pmml4s.has("platform")) {
				type="noparse";
				System.out.println(type);
				if(pmml4s.has("message")) {
					return pmml4s;
				} else return null;
			}
			
//			System.out.println(pmml4s.get("output"));
			
//			if(!type.equals("noparse")) 
			JSONArray pmml4sOutputArray=null;
			JSONArray jpmmlOutputArray=null;
			if(pmml4s.has("output")) pmml4sOutputArray = (JSONArray) pmml4s.get("output");
//			if(jpmml.has("output")) jpmmlOutputArray = (JSONArray) jpmml.get("output");

			File file = new File(pmml_file);
			
//			try {
//				Scanner scanner = new Scanner(file);
//				int lineNum = 0;
//			    while (scanner.hasNextLine()) {
//			        String line = scanner.nextLine();
//			        if(line.contains("dmg.org")) {
//			        	return jpmml;
//			        }
//			        
//			        if(lineNum>3) break;
//			        lineNum++;
//			    }
//			} catch(FileNotFoundException e) { 
//				System.out.println(e.getMessage());
//			}
			
			if(pmml4sOutputArray!=null) {
				if(pmml4sOutputArray.length()==0 || pmml4sOutputArray.getJSONObject(0).getString("name") == null) {
//					if(!jpmml.has("platform")) {
						type="pmml4s";
						pmml4s.put("parser_type", type);
						System.out.println("Chose " + type);
						return pmml4s;
//					} else {
//						type = "jpmml";
//						System.out.println("Chose " + type);
//						jpmml.put("pmml_type", type);
//						return jpmml;
					}
				}
//			} else if(jpmmlOutputArray!=null){
//				type = "jpmml";
//				System.out.println("Chose2 " + type);
//				jpmml.put("pmml_type", type);
//				return jpmml;
//			}

			type="pmml4s";
			System.out.println("Chose1 " + type);
			pmml4s.put("parser_type", type);
			return pmml4s;
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return null;
		
	}
	
	public static JSONObject pmml4sparser(String pmml_file) {
		
		try {
			Model model = Model.fromFile(pmml_file);
			
			DataDictionary dataFields = model.dataDictionary();
			
			if(model.isScorable()==false) {
				JSONObject err = new JSONObject();
				err.put("message", "Model is not scorable");
				return err;
			}
			
	//		System.out.println(model.outputFields()[1]);
			
			System.out.println(model.outputSchema());
			int numOfOutputFields = model.outputFields().length;
			int numOfInputFields = model.inputFields().length;
			
			System.out.println(dataFields);
			
	 		JSONArray inputs = new JSONArray();
	 		JSONArray outputs = new JSONArray();
	 		
			Object[] values = new Object[dataFields.size()];
			
			for(int i=0;i<values.length;i++) {
				IOData data = new IOData();
				DataField df = dataFields.apply(i);
				
				System.out.println(df.intervals());
	//			System.out.println(df.opType());
				
				
				if(i<numOfInputFields) {
					List<Object> domainValues=Arrays.asList(df.validValues());
					data.setDomains(domainValues);
					
					data.setName(df.name());
					data.setDataType(df.dataType().toString());
	
	//				data.setOpType(df.opType());
	//				System.out.println(Arrays.toString(domainValues.toArray()));
					
					ObjectMapper mapper = new ObjectMapper();
					mapper.enable(SerializationFeature.INDENT_OUTPUT);
					String json = mapper.writeValueAsString(data);
					JSONObject convert = new JSONObject(json);
					inputs.put(convert);
				}
	//			for(int j=0;j<df.validValues().length;j++) {
	//				System.out.println(df.validValues()[j]);
	//			}
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
			System.out.println(j.toString());
			
			return j;
		} catch (Exception e) {
			System.out.println(e.getMessage());
			JSONObject err = ProcessUtil.prepareResponse(e.getMessage(), false);
			return err;
		}
	}
}
