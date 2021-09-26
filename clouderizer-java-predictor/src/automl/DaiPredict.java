package automl;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import org.apache.commons.lang3.ArrayUtils;
import org.json.JSONException;
import org.json.JSONObject;

import ai.h2o.mojos.runtime.MojoPipeline;
import ai.h2o.mojos.runtime.frame.MojoFrame;
import ai.h2o.mojos.runtime.frame.MojoFrameBuilder;
import ai.h2o.mojos.runtime.frame.MojoRowBuilder;
import ai.h2o.mojos.runtime.utils.SimpleCSV;
import au.com.bytecode.opencsv.CSVWriter;
import ai.h2o.mojos.runtime.lic.LicenseException;
import ai.h2o.mojos.runtime.frame.MojoColumn;
import ai.h2o.mojos.runtime.frame.MojoFrameMeta;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import automl.Utils;
import main.java.io.socket.client.Socket;
import hex.genmodel.MojoModel;

public class DaiPredict {
	
  public static void mai(String[] args) throws IOException, LicenseException {
	  
	String csvFile = "/Users/rohan.kothapalli/Downloads/h2o/mojo-pipeline/example.csv";  
	String mojoPath = "/Users/rohan.kothapalli/Downloads/h2o/mojo-pipeline/pipeline.mojo";
	String runtime = "/Users/rohan.kothapalli/Downloads/h2o/mojo-pipeline/mojo2-runtime.jar";
	
	Utils.RunScriptApply("java -Xmx5g -Dai.h2o.mojos.runtime.license.file=${LICENSE_FILE} -cp "+runtime+" ai.h2o.mojos.ExecuteMojo "+mojoPath+ " "+csvFile, true, (res) -> {
		Logger.LogMessage(res);
	});
//	String line="", csvSplitBy=",";
//	BufferedReader br = null;
//	
//	Object[] inputFeatures= {};
//	
//	br = new BufferedReader(new FileReader(csvFile));
//	
//	while ((line = br.readLine()) != null) {
//        inputFeatures = line.split(csvSplitBy);
//    }
//	
//	br.close();
//    // Load model
//    MojoPipeline model = MojoPipeline.loadFrom("/Users/rohan.kothapalli/Downloads/h2o/mojo-pipeline/pipeline.mojo");
//
//    // Get and fill the input columns
//    MojoFrameBuilder frameBuilder = model.getInputFrameBuilder();
//    MojoRowBuilder rowBuilder = frameBuilder.getMojoRowBuilder();
//    
//    MojoFrameMeta mj = model.getInputMeta();
//    int inputSize = mj.size();
//    
//    for(int i=0; i < mj.size(); i++) {
////      System.out.println(inputFeatures[i].getClass().getName());
//      System.out.println(inputFeatures[i]);
//      rowBuilder.setValue(mj.getColumnName(i), inputFeatures[i].toString());
//    }
//    
//    frameBuilder.addRow(rowBuilder);
//    
//    MojoFrame iframe = frameBuilder.toMojoFrame();
//    MojoFrame oframe = model.transform(iframe);
//
//    // Output prediction as CSV
//    SimpleCSV outCsv = SimpleCSV.read(oframe);
//    outCsv.write(System.out);
    
  }
  
//  public static void main(String [] args) throws IOException, LicenseException {
//	  predict("/Users/rohan.kothapalli/Downloads/h2o/mojo-pipeline/example.csv", "/Users/rohan.kothapalli/Downloads/h2o/mojo-pipeline/out1.csv");
//  }
  
  public static JSONObject predictArray(MojoPipeline model, String[] inputFeatures) throws IOException, LicenseException, JSONException {
//	  MojoPipeline model = MojoPipeline.loadFrom(mojo_path);

    // Get and fill the input columns
	    MojoFrameBuilder frameBuilder = model.getInputFrameBuilder();
	    MojoRowBuilder rowBuilder = frameBuilder.getMojoRowBuilder();
	    
	//    String[] arr = new String[inputFeatures.length];
	    
	    MojoFrameMeta mj = model.getInputMeta();
	    int inputSize = mj.size();
		    
	  	for(int i=0; i < mj.size(); i++) {
	  	  System.out.println(inputFeatures[i].toString());
		  rowBuilder.setValue(mj.getColumnName(i), inputFeatures[i]);
		}
	  	frameBuilder.addRow(rowBuilder);
		    
	    MojoFrame iframe = frameBuilder.toMojoFrame();
	    MojoFrame oframe = model.transform(iframe);
	    
	//	    if(l==1) {
	//	    	String headers[] = new String[oframe.getNcols()];
	//	    	for (int i=0; i<oframe.getNcols();i++) {
	//		    	headers[i] = oframe.getColumnName(i);
	//		    }
	//	    	
	//	    	writer.writeNext(headers);
	//	    }
	    
	   
	    String op[] = new String[oframe.getNcols()];
	    
	//	    System.out.println(oframe.getColumnData(0));
	    SimpleCSV outCsv = SimpleCSV.read(oframe);
	    for (int i=0; i<oframe.getNcols();i++) {
	//	    	System.out.println(outCsv.getData()[0][i]);
	//	    	myList.add(outCsv.getData()[0][i]);
	    	op[i] = outCsv.getData()[0][i];
	    }
	    
	    System.out.println("Output:");
	    for(Object x:op) {
	    	System.out.println(x.toString());
	    }
	//	    socket.emit("daipredict_ack", op.toString());
	//	    writer.writeNext(op);
	    JSONObject t = new JSONObject();
	    t.put("output", op);
	    t.put("success", true);
	    return t;
  }
  
  public static String[] predict(String csv_path) throws IOException, LicenseException, InterruptedException {
	  
//	  TimeUnit.MINUTES.sleep(1);
		String line="", csvSplitBy=",";
		BufferedReader br = null;
		
		String[] inputFeatures= {};
		
		MojoFrame[] oframes = null;
		
		br = new BufferedReader(new FileReader(csv_path));
		
		File f = new File(csv_path);
		FileWriter fw = new FileWriter(f);
		CSVWriter writer = new CSVWriter(fw);
		
		int l=0;
		while ((line = br.readLine()) != null) {
//			if(l==0) {
//				l++;
//				continue;
//			}
			
	        inputFeatures = line.split(csvSplitBy);
//	        String[] arr = Arrays.toString(inputFeatures).split(csvSplitBy);
	        String[] arr = new String[inputFeatures.length];
	        int j=0;
	        for (Object x:inputFeatures) {
	        	arr[j] = x.toString();
//	        	System.out.println(x.toString());
	        	j++;
	        }
	        
//	        for (String m: arr) {
//	        	System.out.println(m);
//	        }
	        
		    // Load model
		    MojoPipeline model = MojoPipeline.loadFrom("/tmp/workdir/mojo-pipeline/pipeline.mojo");

		    // Get and fill the input columns
		    MojoFrameBuilder frameBuilder = model.getInputFrameBuilder();
		    MojoRowBuilder rowBuilder = frameBuilder.getMojoRowBuilder();
		    
		    MojoFrameMeta mj = model.getInputMeta();
		    int inputSize = mj.size();
		    
	    	for(int i=0; i < inputSize; i++) {
//		  	      System.out.println(inputFeatures[i].getClass().getName());
//	  	      System.out.println(inputFeatures[i]);
//	    		System.out.println(arr[i].().getName());
	    	  System.out.println(arr[i].toString());
	  	      rowBuilder.setValue(mj.getColumnName(i), arr[i].toString());
	  	    }
	    	frameBuilder.addRow(rowBuilder);
		    
		    MojoFrame iframe = frameBuilder.toMojoFrame();
		    MojoFrame oframe = model.transform(iframe);
		    
//		    if(l==1) {
//		    	String headers[] = new String[oframe.getNcols()];
//		    	for (int i=0; i<oframe.getNcols();i++) {
//			    	headers[i] = oframe.getColumnName(i);
//			    }
//		    	
//		    	writer.writeNext(headers);
//		    }
		    
		   
		    String op[] = new String[oframe.getNcols()];
		    
//		    System.out.println(oframe.getColumnData(0));
		    SimpleCSV outCsv = SimpleCSV.read(oframe);
		    for (int i=0; i<oframe.getNcols();i++) {
//		    	System.out.println(outCsv.getData()[0][i]);
//		    	myList.add(outCsv.getData()[0][i]);
		    	op[i] = outCsv.getData()[0][i];
		    }
		    
		    System.out.println("Output:");
		    for(Object x:op) {
		    	System.out.println(x.toString());
		    }
//		    socket.emit("daipredict_ack", op.toString());
//		    writer.writeNext(op);
		    l++;
//		    br.close();
		    return op;
	    }
		br.close();
		writer.close();
		return null;
  	}
}
