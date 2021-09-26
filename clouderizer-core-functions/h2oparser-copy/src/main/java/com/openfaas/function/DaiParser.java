package com.openfaas.function;

import java.io.IOException;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

import ai.h2o.mojos.runtime.MojoPipeline;
import ai.h2o.mojos.runtime.frame.MojoFrame;
import ai.h2o.mojos.runtime.frame.MojoFrameBuilder;
import ai.h2o.mojos.runtime.frame.MojoRowBuilder;
// import ai.h2o.mojos.runtime.utils.SimpleCSV;
import ai.h2o.mojos.runtime.lic.LicenseException;
import ai.h2o.mojos.runtime.frame.MojoColumn;
import ai.h2o.mojos.runtime.frame.MojoFrameMeta;

public class DaiParser {
	
//  DaiParser(String path) {
//	  
//  }
	
  public static void main(String[] args) throws IOException, LicenseException {
    // Load model
    MojoPipeline model = MojoPipeline.loadFrom("/tmp/workdir/mojo-pipeline/pipeline.mojo");

    // Get and fill the input columns
    MojoFrameBuilder frameBuilder = model.getInputFrameBuilder();

    JSONArray ia = new JSONArray();
    JSONArray oa = new JSONArray();
    
    MojoFrameMeta mj = model.getInputMeta();
    MojoFrameMeta oj = model.getOutputMeta();

    for(int i=0; i < mj.size(); i++) {
    	JSONObject inputAttr = new JSONObject();
    	try {
			ia.put(inputAttr.put(mj.getColumnName(i), mj.getColumnType(i)));
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }


    for(int i=0; i < oj.size(); i++) {
    	JSONObject outputAttr = new JSONObject();
    	try {
			oa.put(outputAttr.put(oj.getColumnName(i), oj.getColumnType(i)));
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }

    System.out.println(ia.toString());
    System.out.println(oa.toString());
//    System.out.println(mj.getColumnNames());
    
  }
  
  public static JSONArray inputAttr(String path) throws IOException, LicenseException {
	  MojoPipeline model = MojoPipeline.loadFrom(path);

	    JSONArray ia = new JSONArray();

	    MojoFrameMeta mj = model.getInputMeta();

	    for(int i=0; i < mj.size(); i++) {
	    	JSONObject inputAttr = new JSONObject();
	    	try {
				ia.put(inputAttr.put(mj.getColumnName(i), mj.getColumnType(i)));
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
	    }
	    return ia;
  }
  
  public static JSONArray outputAttr(String path) throws IOException, LicenseException {
	  MojoPipeline model = MojoPipeline.loadFrom(path);

	    JSONArray oa = new JSONArray();

	    MojoFrameMeta oj = model.getOutputMeta();

	    for(int i=0; i < oj.size(); i++) {
	    	JSONObject outputtAttr = new JSONObject();
	    	try {
				oa.put(outputtAttr.put(oj.getColumnName(i), oj.getColumnType(i)));
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
	    }
	    return oa;
  }
}
