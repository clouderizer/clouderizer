package automl;

import java.io.File;
import java.io.IOException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import automl.Logger;

import ai.h2o.mojos.runtime.lic.LicenseException;
import automl.ParserService;

public class NewMainApp {
	
	public static void main(String[] args) throws IOException, LicenseException {
//		String path = "/Users/rohan.kothapalli/Downloads/h2o/mojo-pipeline/pipeline.mojo";
//		
//		JSONArray ia = DaiParser.inputAttr(path);
////		JSONArray oa = DaiParser.outputAttr(path);
//		System.out.println(ia.toString());
		
		if(args.length > 0) {
			ParserService.base_url = args[0];
		} else {
			Logger.LogError("Invalid arguments.", null);
			System.exit(1);
		}
		
		Path path = Paths.get("/tmp/workdir");
		if(Files.exists(path)) {
			Runtime.getRuntime().exec((new String[] {"rm","-R","/tmp/workdir"}));
		}
		
//		ParserService.daiparser("/Users/rohan.kothapalli/mojo-pipeline/pipeline.mojo", null);
		new ParserService().start();
	}
}
