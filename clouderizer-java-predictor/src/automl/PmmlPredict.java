package automl;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.xml.bind.JAXBException;

import org.dmg.pmml.FieldName;
import org.jpmml.evaluator.Evaluator;
import org.jpmml.evaluator.EvaluatorUtil;
import org.jpmml.evaluator.FieldValue;
import org.jpmml.evaluator.InputField;
import org.jpmml.evaluator.LoadingModelEvaluatorBuilder;
//import org.jpmml.evaluator.visitors.DefaultVisitorBattery;
import org.jpmml.evaluator.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pmml4s.model.Model;
import org.xml.sax.SAXException;

public class PmmlPredict {
	
	public static JSONObject predict(Evaluator evaluator, String[] inputs) {
		
		try {
			List<? extends InputField> inputFields = evaluator.getInputFields();
			Map<FieldName, FieldValue> arguments = new LinkedHashMap<>();
			
			Map<String,String> inputRecord = new HashMap<String,String>();
			
			int i=0;
			for(InputField inputField: inputFields) {
				inputRecord.put(inputField.getName().getValue(), inputs[i]);
				i++;
			}
			
			
			
			for(InputField inputField : inputFields){
				FieldName inputName = inputField.getName();

				Object rawValue = inputRecord.get(inputName.getValue());

				// Transforming an arbitrary user-supplied value to a known-good PMML value
				FieldValue inputValue = inputField.prepare(rawValue);

				arguments.put(inputName, inputValue);
			}
			
			Map<FieldName, ?> results = evaluator.evaluate(arguments);

			// Decoupling results from the JPMML-Evaluator runtime environment
			Map<String, ?> resultRecord = EvaluatorUtil.decodeAll(results);
			
			System.out.println(resultRecord);
			JSONObject t = new JSONObject();
			t.put("output", resultRecord);
			t.put("success", true);
			return t;
		} catch (MissingAttributeException | JSONException e) {
			System.out.println(e.getMessage());
			e.printStackTrace();
			JSONObject err = ProcessUtil.prepareResponse(e.getMessage(), false);
			return err;
		}
	}
	
	public static JSONObject pmml4spredict(Model pmml4smodel, String[] inputs) {
		
		for(int i=0;i<inputs.length;i++) {
			System.out.println(inputs[i]);
		}
		
		try {
			Object[] result = pmml4smodel.predict(inputs);
			JSONObject op = new JSONObject();
			op.put("output", result);
			op.put("success", true);
				
			System.out.println(op);
			return op;
		} catch (Exception e) {
			System.out.println(e.getMessage());
			JSONObject err = ProcessUtil.prepareResponse(e.getMessage(), false);
			return err;
		}
	}
	
	public static void main(String[] args) throws JSONException {
//		Evaluator evaluator=null;
//		try {
//			evaluator = new LoadingModelEvaluatorBuilder()
//					.setLocatable(false)
//					.setVisitors(new DefaultVisitorBattery())
//					//.setOutputFilter(OutputFilters.KEEP_FINAL_RESULTS)
//					.load(new File("/Users/rohan.kothapalli/new_design/clouderizer-dev/automl/svm.pmml"))
//					.build();
//		} catch (IOException | SAXException | JAXBException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
//		evaluator.verify();
//		String[] inputs = {"6.5","3","5.2","2.0"};
////		PmmlPredict x = new PmmlPredict();
//		JSONObject result = predict(evaluator, inputs);
//		System.out.println(result.toString());
		
		Model model = Model.fromFile("/Users/rohan.kothapalli/new_design/clouderizer-dev/automl/model.pmml");
		String[] inputs = {"35","PSLocal","College","Unmarried","Service","1000","Female","300","25"};
		Object[] result = model.predict(inputs);
		
		System.out.println(result[2]);
	}
}
