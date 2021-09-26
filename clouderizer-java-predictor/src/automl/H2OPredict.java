package automl;

import java.io.*;

import java.util.concurrent.TimeUnit;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import hex.genmodel.easy.RowData;
import hex.genmodel.easy.exception.PredictException;
import hex.genmodel.easy.exception.PredictUnknownCategoricalLevelException;
import hex.genmodel.easy.EasyPredictModelWrapper;
import hex.genmodel.easy.prediction.*;
import hex.ModelCategory;
import hex.genmodel.MojoModel;

public class H2OPredict {
  public static void main(String[] args) throws Exception {
	  
	String zip_path = "/Users/rohan.kothapalli/Downloads/h2o3/deeplearning_model.zip";  
    EasyPredictModelWrapper model = new EasyPredictModelWrapper(MojoModel.load(zip_path));
    
    MojoModel mj = MojoModel.load(zip_path);
    
    String csvFile="";
    String line="";
    String[] inputFeatures= {};
    BufferedReader br;
    br = new BufferedReader(new FileReader("/Users/rohan.kothapalli/Downloads/h2o3/sample.csv"));
    
    int l=0;
    while ((line = br.readLine()) != null) {
//		if(l==0) {
//			l++;
//			continue;
//		}
		
		inputFeatures = line.split(",");
		RowData row = new RowData();
		
//		Logger.LogMessage(inputFeatures.toString());
	    
	    for(int i=0;i<mj.getNames().length-1;i++) {
	    	Logger.LogMessage(inputFeatures[i]);
	    	row.put(mj.getNames()[i], inputFeatures[i]);
	    }
//	    row.put("Dest", "NY");
//	    row.put("Origin", "CHICAGO");
//	    row.put("DayofMonth", "5");
//	    row.put("Year", "2017");
//	    row.put("DayOfWeek", "6");
//	    row.put("Month", "June");
//	    row.put("Distance", "2000");
	    
	    String modelName = mj.getModelCategory().toString();
	    
	    if(modelName.equals("Regression")) {
	    	RegressionModelPrediction p = model.predictRegression(row);
	        System.out.println(p.value);
	    }
	    
	    if(modelName.equals("Binomial")) {
	      BinomialModelPrediction p = model.predictBinomial(row);
	      System.out.println(p.label);
	      System.out.print("Class probabilities: ");
	      for (int i = 0; i < p.classProbabilities.length; i++) {
	        if (i > 0) {
	        	System.out.print(",");
	        }
	        System.out.print(p.classProbabilities[i]);
	      }
	    }
	    
	    if(modelName.equals("Multinomial")) {
	    	MultinomialModelPrediction p = model.predictMultinomial(row);
	    	System.out.println(p.classProbabilities);
	    	System.out.println(p.label);
	    }
    }
  }
  
  public static JSONObject predictArray(MojoModel mj, String[] qq) throws IOException, PredictException, JSONException, PredictUnknownCategoricalLevelException {
	  EasyPredictModelWrapper model = new EasyPredictModelWrapper(mj);
	    
	  //System.out.println(mj);
//	  EasyPredictModelWrapper model = new EasyPredictModelWrapper(mj);
//	  MojoModel mj = MojoModel.load(zip_path);
	  ParserService.busy=true;
	  
	  String modelName = mj.getModelCategory().toString();
	  System.out.println(modelName);
	  
	  RowData row = new RowData();
	    
	  for(int i=0;i<mj.getNames().length-1;i++) {
    	Logger.LogMessage(qq[i]);
    	System.out.println(mj.getNames()[i]);
    	System.out.println(qq[i]);
    	row.put(mj.getNames()[i], qq[i]);
	  }
	  
	  if(modelName.equals("Regression")) {
	    	RegressionModelPrediction p = model.predictRegression(row);
	        System.out.println("here" + p.value);
	        
	        JSONObject reg = new JSONObject();
	        reg.put("output", p.value);
	        reg.put("success", true);
	        return reg;
	        /* leafNodeAssignments with its ids
	         * value
	         * stage probabilities 
	         * equals()
	         */
	  } else if(modelName.equals("Binomial")) {
	      JSONObject bi = new JSONObject();
	      JSONArray j = new JSONArray();

	      try {
	    	BinomialModelPrediction p = model.predictBinomial(row);
			bi.put("output", p.label);
			System.out.println(p.label);
		      System.out.print("Class probabilities: ");
		      for (int i = 0; i < p.classProbabilities.length; i++) {
		        if (i > 0) {
		        	System.out.print(",");
		        }
		        System.out.print(p.classProbabilities[i]);
		        j.put(p.classProbabilities[i]);
		      }
		      
		      bi.put("classprobabilities", j);
		      bi.put("success", true);
		      return bi;
		  } catch(PredictUnknownCategoricalLevelException f) {
			Logger.LogMessage(f.getMessage());
//			JSONObject err = ProcessUtil.prepareResponse(f.getMessage(), false);
//			return err;
		  } catch (JSONException e) {
			// TODO Auto-generated catch block 
			e.printStackTrace();
		  }
	      
	      /*
	       * class probabilites 
	       * stage probabilities
	       * label
	       * label index
	       * leafNodeAssignments with its ids
	       * stage probabilities 
	       */
	    } else if(modelName.equals("Multinomial")) {
	    	JSONObject mi = new JSONObject();
	    	JSONArray j = new JSONArray();
	    	MultinomialModelPrediction p = model.predictMultinomial(row);
	    	for (int i = 0; i < p.classProbabilities.length; i++) {
		        if (i > 0) {
		        	System.out.print(",");
		        }
		        System.out.print(p.classProbabilities[i]);
		        j.put(p.classProbabilities[i]);
		     }
	    	 mi.put("output", p.label);
	    	 mi.put("classprobabilities", j);
	    	 mi.put("success", true);
	    	 return mi;
	    	/*
		       * class probabilites 
		       * stage probabilities
		       * label
		       * label index
		       * leafNodeAssignments with its ids
		       * stage probabilities 
		       */
	    } else {
	    	JSONObject modelTypeUndefined=null;
	    	modelTypeUndefined.put("success", false);
	    	modelTypeUndefined.put("msg", "Model not among the supported categories Regression/Binomial/Multinomial");
	    	return modelTypeUndefined;
	    }
	    return null;
  }
  
  public static JSONObject predict(String zip_path, String csv_path) throws IOException, PredictException, JSONException, InterruptedException {
	    EasyPredictModelWrapper model = new EasyPredictModelWrapper(MojoModel.load(zip_path));
	    
	    MojoModel mj = MojoModel.load(zip_path);
	    ParserService.busy=true;
//	    TimeUnit.MINUTES.sleep(1);
	    String line="";
	    String[] inputFeatures= {};
	    BufferedReader br;
	    br = new BufferedReader(new FileReader(csv_path));
	    
	    int l=0;
	    while ((line = br.readLine()) != null) {
	    	
//			if(l==0) {
//				l++;
//				continue;
//			}
			
			inputFeatures = line.split(",");
			RowData row = new RowData();
			
//			Logger.LogMessage(inputFeatures.toString());
		    
		    for(int i=0;i<mj.getNames().length-1;i++) {
		    	Logger.LogMessage(inputFeatures[i]);
		    	row.put(mj.getNames()[i], inputFeatures[i]);
		    }
//		    row.put("Dest", "NY");
//		    row.put("Origin", "CHICAGO");
//		    row.put("DayofMonth", "5");
//		    row.put("Year", "2017");
//		    row.put("DayOfWeek", "6");
//		    row.put("Month", "June");
//		    row.put("Distance", "2000");
		    
		    String modelName = mj.getModelCategory().toString();
		    System.out.println(modelName);
		    // prepare json for each model type
		    
		    if(modelName.equals("Regression")) {
		    	RegressionModelPrediction p = model.predictRegression(row);
		        System.out.println(p.value);
		        /* leafNodeAssignments with its ids
		         * value
		         * stage probabilities 
		         * equals()
		         */
		    }
		    
		    if(modelName.equals("Binomial")) {
		      JSONObject bi = new JSONObject();
		      JSONArray j = new JSONArray();
		      BinomialModelPrediction p = model.predictBinomial(row);
		      try {
				bi.put("label", p.label);
				
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		      System.out.println(p.label);
		      System.out.print("Class probabilities: ");
		      for (int i = 0; i < p.classProbabilities.length; i++) {
		        if (i > 0) {
		        	System.out.print(",");
		        }
		        System.out.print(p.classProbabilities[i]);
		        j.put(p.classProbabilities[i]);
		      }
		      
		      bi.put("classprobabilities", j);
		      br.close();
		      return bi;
		      
		      /*
		       * class probabilites 
		       * stage probabilities
		       * label
		       * label index
		       * leafNodeAssignments with its ids
		       * stage probabilities 
		       */
		    }
		    
		    if(modelName.equals("Multinomial")) {
		    	MultinomialModelPrediction p = model.predictMultinomial(row);
		    	System.out.println(p.classProbabilities);
		    	System.out.println(p.label);
		    	/*
			       * class probabilites 
			       * stage probabilities
			       * label
			       * label index
			       * leafNodeAssignments with its ids
			       * stage probabilities 
			       */
		    }
	    }
	    br.close();
	    return null;
  }
}
