package automl;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.sql.Timestamp;
import org.apache.commons.lang3.ArrayUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.xml.sax.SAXException;

import automl.ProcessUtil;
import hex.genmodel.MojoModel;
import hex.genmodel.easy.exception.PredictException;
import ai.h2o.mojos.runtime.lic.LicenseException;
import automl.Logger;
import automl.DaiParser;

import io.socket.emitter.Emitter;
import main.java.io.socket.client.Ack;
import main.java.io.socket.client.IO;
import main.java.io.socket.client.Socket;
import java.util.Timer;

import javax.xml.bind.JAXBException;

import hex.genmodel.attributes.parameters.ModelParameter;
import hex.genmodel.attributes.ModelAttributes;
import automl.H2OPredict;
import hex.genmodel.attributes.Table;
import org.jpmml.evaluator.*;
//import org.jpmml.evaluator.visitors.DefaultVisitorBattery;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class ParserService extends Thread {

	private static ParserService inst;
	public boolean socketConnected = false;
	public boolean flaskSocketConnected = false;

	public static String homedir = "/tmp";
	public static String platform;
	public static String base_url;
	public static boolean busy = false;
	public static String tesseract_path = "/Users/rohan.kothapalli";
	public static String default_pmml_file_path = "/tmp/model.pmml";
	public static boolean tesseract_on = false;

//	2 types : 1 --> PARSE 2--> PREDICT
	public static String run_type = "PARSER";

	public ParserService() {
		if (inst != null) {
			throw new RuntimeException("ParserService is already initilized");
		}
		inst = this;
		setName(ParserService.class.getSimpleName() + "#" + System.currentTimeMillis());
		setDaemon(false); // This will keep Machine client running //
	}

	@Override
	public void run() {
		try {
			if (run_type.equals("PARSER")) {
				final JSONObject obj1 = new JSONObject();

				obj1.put("url", "/api/clientsocket/automlparserlongpoll?key=1234567890");

				final Socket socket = IO.socket(base_url + "?__sails_io_sdk_version=0.11.0");

				socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {

					@Override
					public void call(Object... args) {
						Logger.LogMessage("Socket connected...");
						if (socketConnected == false) {
							socket.emit("get", obj1);
						}
					}

				}).on("init", new Emitter.Listener() {

					@Override
					public void call(Object... args) {
						socketConnected = true;
						Logger.LogMessage("Socket connected!");
					}
				}).on("parser", new Emitter.Listener() {

					@Override
					public void call(Object... args) {
						JSONObject command_str = (JSONObject) args[0];
						Ack ack = (Ack) args[args.length - 1];

//						String zip_path="";
						try {
							Logger.LogMessage(command_str.toString());
							final String s3_url = command_str.getString("zip_path");
							final String servingid = command_str.getString("servingid");

							Logger.LogMessage(s3_url);
//							Runtime.getRuntime().exec("mkdir -p " + homedir + "/workdir");
							ProcessUtil.RunProcess("getFileFromS3",
							new String[] { "curl", "-o", "/tmp/h2o.zip", s3_url }, null, () -> {

								ProcessUtil.RunProcess("unzip", new String[] { "unzip", "-o", "-q",
								"/tmp/h2o.zip", "-d", homedir + "/workdir" }, null, () -> {

									File f = new File(homedir + "/workdir/mojo-pipeline/pipeline.mojo");
									File f_h2o = new File(homedir + "/workdir/model.ini");
									JSONObject output = new JSONObject();
									JSONObject parse_model = null;
									String errMsg = "";
									try {
										if (f.exists()) {
											parse_model = daiparser(
													homedir + "/workdir/mojo-pipeline/pipeline.mojo",
													null);
											output.put("parse_model", parse_model);
											// no error, lets put platform sub type here as well
											output.put("platform", "dai");
										} else if (f_h2o.exists()) {
											parse_model = h2oparser("/tmp/h2o.zip", null);
											output.put("parse_model", parse_model);
											// no error, lets put platform sub type here as well
											output.put("platform", "h2o");
										} else {
											platform = "cleanup";
										}
									} catch (Throwable e) {
										errMsg = e.getMessage();
									}

									if (parse_model == null || !errMsg.isEmpty()) {
										// send back error
										JSONObject err = new JSONObject();
										try {
											err.put("message", errMsg);
										} catch (JSONException e) {
											// TODO Auto-generated catch block
											e.printStackTrace();
										}
										ack.call(err, null);
										ProcessUtil.cleanup(homedir, socket);
									} else {
										ack.call(null, output);
									}
								});
							});
//								);
						} catch (JSONException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
//							
//						}
					}
				}).on("pmmlparser", new Emitter.Listener() {

					@Override
					public void call(Object... args) {
						JSONObject command_str = (JSONObject) args[0];
						Ack ack = (Ack) args[args.length - 1];
						try {
							final String s3_url = command_str.getString("pmml");
//							final String path = command_str.getString("path");
							
							// checks if this is a local path on file system or a s3_url(for dev)
							boolean local_path=false;
							if(s3_url.startsWith("/")) local_path=true;
			
							if(!local_path) {
								ProcessUtil.RunProcess("getFileFromS3",
										new String[] { "curl", "-o", default_pmml_file_path, s3_url }, null, () -> {
											
											JSONObject output = PmmlParser.evaluatorType(default_pmml_file_path);
//											JSONObject output = PmmlParser.jpmmlparser(s3_url);
						
											try {
//												JSONObject output = PmmlParser.jpmmlArchivedParser(default_pmml_file_path);
												if(output.has("platform") && 
														(output.getString("platform").equals("pmml4s") || output.getString("platform").equals("jpmml"))) {
													ack.call(null, output);
												} else ack.call(output,null);

												Runtime.getRuntime().exec(new String[] { "rm", "/tmp/model.pmml" });
											} catch (JSONException| IOException e) {
												// TODO Auto-generated catch block
												e.printStackTrace();
											}
//											ProcessUtil.RunProcess("parsePMML", commands, scb, ecb)
									
								});
							} else {
								Thread cmdProcessor = new Thread() {
									public void run() {
										
//										JSONObject output = PmmlParser.evaluatorType(s3_url);
//										JSONObject output = PmmlParser.jpmmlparser(s3_url);
										
										try {
//											JSONObject output = PmmlParser.jpmmlArchivedParser(s3_url);
											JSONObject output = PmmlParser.evaluatorType(s3_url);
											
											if(output.has("platform") && (output.getString("platform").equals("pmml4s") || output.getString("platform").equals("jpmml"))) {
											ack.call(null, output);
											} else ack.call(output,null);
										} catch (Exception e) {
											// TODO Auto-generated catch block
											e.printStackTrace();
										}
									}
								};
								
								cmdProcessor.start();
							}
						} catch (JSONException e) {
							
						}
					}
				}).on("pmml4sparser", new Emitter.Listener() {

					@Override
					public void call(Object... args) {
						JSONObject command_str = (JSONObject) args[0];
						Ack ack = (Ack) args[args.length - 1];
						try {
							final String s3_url = command_str.getString("pmml4s");
							Thread cmdProcessor = new Thread() {
								public void run() {
									try {
										File pmml_file = new File(s3_url);
										if(pmml_file.exists()) {
											JSONObject output = PmmlParser.pmml4sparser(pmml_file.toString());
											
											if(output.getString("platform").equals("pmml")) ack.call(null, output);
											else ack.call(output,null);
										}
										
									} catch (Exception e) {
										System.out.println(e.getMessage());
									}
								}
							};
							
							cmdProcessor.start();
						} catch (Exception e) {
							
						}
					}
				}).on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {

					@Override
					public void call(Object... args) {
						Logger.LogMessage("Socket disconnected...");
						socketConnected = false;

						// lets connect again
						socket.connect();
					}
				});

				socket.connect();

				while (inst == this) {
					try {
						Thread.sleep(2000);
						if (!socket.connected() && run_type.equalsIgnoreCase("PARSER")) {
							socket.connect();
						}

					} catch (InterruptedException ie) {
						Logger.LogMessage("While Loop interrupted");
					}

				}

			} else {
				final JSONObject obj2 = new JSONObject();
				obj2.put("url", "/");

				final Socket flask_socket = IO.socket("http://127.0.0.1:9091");

				flask_socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {

					@Override
					public void call(Object... args) {
						flask_socket.emit("get", obj2);

						Logger.LogMessage("Flask Socket Connected!");
					}
				}).on("daipredict", new Emitter.Listener() {

					@Override
					public void call(Object... args) {

						JSONObject command_str = (JSONObject) args[0];
						Logger.LogMessage(command_str.toString());
						String target_path = "";
						String csv_path = "";
						try {
//							target_path = command_str.getString("path");
							csv_path = command_str.getString("csv_path");
						} catch (JSONException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}

						try {
							String[] output = DaiPredict.predict(csv_path);
							Logger.LogMessage(output.toString());
							flask_socket.emit("daipredict_ack", output);
						} catch (IOException | LicenseException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						} catch (InterruptedException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
					}
				}).on("h2opredict", new Emitter.Listener() {

					@Override
					public void call(Object... args) {
						JSONObject command_str = (JSONObject) args[0];
						Logger.LogMessage(command_str.toString());
						String zip_path = "";
						String csv_path = "";
						JSONArray csv = null;
						try {
//							target_path = command_str.getString("path");
							if (command_str.has("csv")) {
								csv = command_str.getJSONArray("csv");
							}

							if (command_str.has("csv_path")) {
								csv_path = command_str.getString("csv_path");
							}

							zip_path = command_str.getString("zip_path");
						} catch (JSONException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}

//						new java.util.Timer().schedule( 
//						        new java.util.TimerTask() {
//						            @Override
//						            public void run() {
//						            	if(busy) {
//						            		busy = false;
//						            		Logger.LogMessage("In here");
//						            		flask_socket.emit("h2opredict_err", "random");
//						            	}
//						            }
//						        }, 
//						        10000 
//						);

//						try {
//							JSONObject j = H2OPredict.predict(zip_path, csv_path, csv);
//							flask_socket.emit("h2opredict_ack", j);
//						} catch (IOException | PredictException e) {
//							// TODO Auto-generated catch block
//							e.printStackTrace();
//						} catch (JSONException e) {
//							// TODO Auto-generated catch block
//							e.printStackTrace();
//						} catch (InterruptedException e) {
//							// TODO Auto-generated catch block
//							e.printStackTrace();
//						}
					}
				})

						.on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {

							@Override
							public void call(Object... args) {
								Logger.LogMessage("Socket disconnected...");
								flaskSocketConnected = false;

								// lets connect again
								flask_socket.connect();
							}
						});

				flask_socket.connect();

				while (inst == this) {
					try {
						Thread.sleep(5000);

						if (!flask_socket.connected() && run_type.equalsIgnoreCase("PREDICT")) {
							flask_socket.connect();
						}

					} catch (InterruptedException ie) {
						Logger.LogMessage("While Loop interrupted");
					}

				}

			}
		} catch (Throwable e) {
			Logger.LogError("Error in AutoML Parsing Service", e);
		}
	}

	public static JSONObject daiparser(String path, Socket socket) {
//		JSONObject command_str = (JSONObject) args[0];
//		String path="";
//		try {
//			path = command_str.getString("path");
//		} catch (JSONException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
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
			
			if(socket != null) socket.emit("parser_ack", fin);
			Logger.LogMessage(fin.toString());
			Runtime.getRuntime().exec(new String[] {"rm", "-R", homedir+"/workdir"});
			Runtime.getRuntime().exec(new String[] {"rm", "/tmp/h2o.zip"});
			return fin;
		} catch (IOException | LicenseException | JSONException e) {
			e.printStackTrace();
		}
		return null;
	}

	public static JSONObject h2oparser(String zip_path, Socket socket) throws IOException, JSONException {
		MojoModel mj = MojoModel.load(zip_path);

		System.out.println(mj._modelDescriptor);
		System.out.println(mj._modelAttributes);

		System.out.println(mj.getModelCategory());
//		System.out.println(mp.getClass().getName());
//		System.out.println(mp.getModelSummary());

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
//		fin.put("parameters", mp.getModelParameters());

		Timestamp ts = new Timestamp(System.currentTimeMillis());

		fin.put("timestamp", ts);

		String headers[] = new String[mj.getNames().length];
		for (int i = 0; i < mj.getNames().length; i++) {
			headers[i] = mj.getNames()[i];
//	    	System.out.println(mj.getNames()[i]);
		}

		fin.put("ia", headers);
		if (socket != null)
			socket.emit("parser_ack", fin);
		Runtime.getRuntime().exec(new String[] { "rm", "-R", homedir + "/workdir" });
		Runtime.getRuntime().exec(new String[] { "rm", "/tmp/h2o.zip" });

		return fin;
	}

	public static void h2oparser(String zip_path) throws IOException, JSONException {
		MojoModel mj = MojoModel.load(zip_path);

		System.out.println(mj._modelDescriptor);
		System.out.println(mj._modelAttributes);

		System.out.println(mj.getModelCategory());
//		System.out.println(mp.getClass().getName());
//		System.out.println(mp.getModelSummary());

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
		fin.put("platform", "h2o");
		fin.put("all_columns", mj.getNames());
//		fin.put("parameters", mp.getModelParameters());

		Timestamp ts = new Timestamp(System.currentTimeMillis());

		fin.put("timestamp", ts);

		String headers[] = new String[mj.getNames().length];
		for (int i = 0; i < mj.getNames().length; i++) {
			headers[i] = mj.getNames()[i];
//	    	System.out.println(mj.getNames()[i]);
		}

		fin.put("ia", headers);
//		socket.emit("parser_ack", fin);
		Runtime.getRuntime().exec(new String[] { "rm", "-R", homedir + "/workdir" });
		Runtime.getRuntime().exec(new String[] { "rm", "/tmp/h2o.zip" });
	}
}
