var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
var request = require("request");
const assert = require('assert');
var spawn = require("child_process").spawn;

module.exports = {
    enableRetrain: (req, res) =>{
        var project = req.query['servingproject'];
        var enableRetrain = req.body["enableRetrain"];
        ServingModel.update({servingproject:project}, {enableRetrain: enableRetrain}, (err, sm) => {});
            return res.status(200).json({msg:"Retraining enabled!"});
    },

    retrain: (req,res) => {
        var servingid=req.body.servingid;

        if(servingid && servingid!="") {
            ServingModel.findOne({id:servingid},(err, sm) => {
                if(err && !sm) {
                    console.log(err);
                    return res.status(500).json({msg:err});
                }

                if(sm.user_retrain_url && sm.user_retrain_url!="") {
                    var headers = {
                        'Content-Type': 'application/json'
                    };
                    
                    var resource={
                        "secret_key": sm.secret_key
                    };

                    request.post({headers:headers, url:sm.user_retrain_url+"/notebook", json:resource}, function (err, resp, body) {
                        if(err) {
                            console.log(err);
                            ServingModel.update({id:servingid},{status_message:"Retraining failed. Couldn't call the retrain URL"},(err, sm)=>{});
                            return res.status(500).json({msg:"Couldn't call the retrain URL."});
                        }                    
                        
                        if(body && body["message"]=="Done") {
                            ServingModel.update({id:servingid},{status_message:"Retraining in progress"},(err, sm)=>{});
                            return res.status(200).json({msg:"Retraining inititated!"});
                        } else {
                            console.log(body);
                            ServingModel.update({id:servingid},{status_message:"Retraining failed. Couldn't call the retrain URL"},(err, sm)=>{});
                            return res.status(500).json({msg:"Couldn't call the retrain URL"});
                        }
                    });
                }
            });             
        } else {
            return res.status(500).json({msg:"Retraining failed. Pinging wrong model"});
        }
    },

    getarchiveddata: (req,res) => {
        var secret_key=req.body.secret_key;
        var from_date=req.body.from_date;
        var to_date=req.body.to_date;
        if(!(from_date.split("-").length==3) || !(to_date.split("-").length==3) || !(from_date.split("-")[0].length==4) || !(to_date.split("-")[0].length==4)) {
            return res.status(200).json({msg:"Date formats are wrong: required format %Y-%m-%d, ex: 2020-08-17"});
        }

        from_date=new Date(from_date);
        to_date=new Date(to_date);

        ServingModel.findOne({"secret_key":secret_key},(err, sm) => {
            if(!err) {
                ServingHistory.find({model:sm.id},(err, sh)=> {
                    if(err || !sh ){
                        console.log(err);
                        return res.status(500).json({msg:"Couldnt find history"});
                    }

                    if(sh.length==0){
                        return res.status(500).json({msg:"No new data to retrain with!"});
                    }
                    
                    data_arr=[];
                    for(var i=0;i<sh.length;i++) {
                        if(new Date(sh[i].timestamp)>=from_date && new Date(sh[i].timestamp)<=to_date) {
                            delete sh[i].model;
                            delete sh[i].company;
                            delete sh[i].id;
                            delete sh[i].sent_for_retrain;
                            delete sh[i].updatedAt;
                            delete sh[i].createdAt;
                            data_arr.push(sh[i]);
                        }
                    }

                    return res.status(200).json({"data":data_arr});
               });
            } else {
                return res.status(200).json({msg:"Check your secret keys!"});
            }
        });
    },

    flaskstatus: (req,res) => {
        var secret_key=req.body.secret_key;
        var filename=req.body.filename;
        var logs=req.body.logs;

        ServingModel.findOne({"secret_key":secret_key},(err, sm) => {
            if(!err && filename!="") {
                prev_s3_zip_file=sm.s3_zip_file;
                sm.s3_zip_file=filename;
                sm.model=filename;
                if(!sm.model_history || sm.model_history==[]) {
                    sm.model_history=[prev_s3_zip_file];
                    sm.model_history.push(filename);
                } else {
                    if(sm.model_history.indexOf(filename)==-1) {
                        sm.model_history.push(filename);
                    } else {
                        sm.model_history.splice(sm.model_history.indexOf(filename),1);
                        sm.model_history.push(filename);
                    }
                }

                sm.status_message="Retraining successful, model file updated. If project is already running, click update deployment to deploy with new model";
                ServingModel.update({"secret_key":secret_key},sm,(error,smo) => {});
                console.log("Model updated!");
                return res.status(200).json({msg:"Model updated!"});
            } else if(filename=="") {
                ServingModel.update({"secret_key":secret_key},{status_message:"Retraining failed!",flask_logs:logs},(error,smo) => {});                
                return res.status(500).json({msg:"Retraining failed!",logs:logs});
            } else {
                ServingModel.update({"secret_key":secret_key},{status_message:"Retraining failed!",flask_logs:logs},(error,smo) => {});
                return res.status(500).json({msg:"Check your secret key!",logs:logs});
            }
        });
    },

    updateactual: (req, res) => {
        var servingid = req.body.id;
        var data = req.body.actualOutput;
        var predicted = req.body.predicted;
        console.log(req.body)
        console.log(data);
        var process = spawn('python', ["resample.py", JSON.stringify(data), JSON.stringify(predicted)]);

        var dataString = "";

        // collect data from python script
        process.stdout.on('data', function (data) {
            console.log('Pipe data from python script ...');
            console.log(data.toString());
            dataString += data.toString();
        });

        process.stderr.on('data', (data) => {
            console.error(`child stderr:\n${data}`);
        });

        process.on('exit', function (code, signal) {
            console.log('child process exited with ' +
                        `code ${code} and signal ${signal}`);
        });

        process.on('close', (code) => {
            console.log(`child process close all stdio with code ${code}`);
            console.log(JSON.parse(dataString))
            ServingModel.update({id:servingid},{actualOutput:JSON.parse(dataString), resampled: true}).fetch().exec((err, sm)=>{
                if(!err && sm){
                    console.log(sm);
                    res.status(200).json( {data: sm[0].actualOutput});
                }
            });
        });   
    },

    updateError: (req, res) => {
        var modelId= req.body.modelId;
        var errordata= req.body.errordata;

        ServingModel.findOne({id: modelId}, (err, sm)=> {
            if(err) {
                console.log(err);
                res.status(500).json( {err:err});
            }
            else{
                if(sm.errorData){
                    sm.errorData.push(errordata);
                }
                else{
                    sm.errorData = [errordata];
                }
                ServingModel.update({id:sm.id}, {errorData: sm.errorData}).fetch().exec((err, sm) => {
                    if(err) {
                        console.log(err);
                        res.status(500).json( {err:err});
                    } else {
                        console.log(sm[0])
                        res.status(200).json( {msg:'error metric data uploaded'});
                    }
                });
            }
        }) 
        
    },

    shutdown: (req,res) => {
        var servingid=req.body.servingid;

        console.log("Shut down initiated for serving id:" + servingid);
        if(servingid && servingid!="") {
            ServingModel.findOne({id:servingid},(err, sm) => {
                if(!err && sm) {
                    ServingModel.update({id:servingid},{status:"Not Running",status_message:"Model deployment failed!"},(err, sm)=>{});
                }
            });
        }
        res.status(200).json("Exit initiated");
    },

    getsubtype: function(req, res) {
        var servingid = req.body.servingid; 

        if(servingid && servingid!="") {
            ServingModel.findOne({id:servingid},(err, sm) => {
                if(!err && sm) {
                    return res.status(200).json( sm.subtype);
                }
            });
        } else return res.status(500).json( {msg:"Serving Model id not received"});
    },

    getServingModel: function(req, res) {
        var edit = req.query.edit;
        if(edit) {
            delete req.query['edit'];
        }
        var project = req.query['servingproject'];
        var query = ServingModel.find({servingproject: project}, (err, matchingRecord) => {
            if (err) return res.serverError(err);
            if(!matchingRecord) return res.notFound('No record found with the specified `name`.');
            if(matchingRecord) res.ok(matchingRecord);
        });
    },

    updateServingModel: (req, res) => {
        var servingid=req.body.servingid;

        ServingModel.findOne({id:servingid},(err, sm) => {
            if(err) {
                console.log("error from update serving model", err);
                return res.status(500).json(err);
            }

            if(sm) {
                // verify that the model is not empty and this is just an update to newer version
                if(sm["subtype"]!="pythonscore") {
                    return res.status(500).json( {msg:"Model type not supported for updates"});
                }  
            }
        });
    },

    generateport: function (req, res) {
        var servingid = req.query.servingid;
        console.log(servingid);
        if(servingid && servingid!="") {
            sails.config.clouderizerconfig.GetNextPort((port) => {
                console.log(port);
                ServingModel.update({id:servingid}, {status:"Starting", status_message:"Starting Instance", servingport:port, machinetype:"local"}).fetch().exec((err, sm) => {
                  if(err) {
                    console.log(err);
                    return res.status(500).json( {msg:"Showcase model could not be found"});
                  } else {
                    console.log(sm);
                    var projectId = sm[0].servingproject;
                    ServingProject.update({id:projectId}, {status:"Starting"}, (err, sp) => {});
                  }
                });
                return res.status(200).json( {port:port});
            });
        } else {
            return res.status(500).json( {msg:"Showcase model id not received!"});
        }
    },

    updateErrorMetric: function(req, res){
       
        var modelId = req.body.modelId;
        var errorMetric = req.body.errorMetric;

        ServingModel.update({id:modelId}, {errorMetric:errorMetric}).fetch().exec((err, sm) => {
            if(err) {
                console.log(err);
                res.status(500).json( {err:err});
            } else if(sm){
                return res.ok();
            }
        });
    },

    updatestatus: function (req, res) {
        console.log("in updatestatus method")
        console.log(req.body.status);
        console.log(req.body.status_message);
        var servingid = req.body.servingid;
        var status = req.body.status;
        var status_message = req.body.status_message;

        ServingModel.update({id:servingid}, {status:status, status_message:status_message}).fetch().exec((err, sm) => {

            if(err || !sm) {
                console.log(err);
                res.status(500).json( {err:err});
            } else {
                console.log(sm);
                return res.ok();
            }
        });
    },

    updatepippackages: function(req, res) {
        var id = req.body.id;
        var pipPackages = req.body.pipPackages;

        console.log(pipPackages)
        ServingModel.findOne({id: id}, (err, sm)=> {
            if(err) {
                console.log(err);
                res.status(500).json( {err:err});
            }
            else{
                console.log(sm.pipPackages)
                if(sm.pipPackages){
                    pipPackages = [...pipPackages, ...sm.pipPackages];
                }
                console.log(pipPackages)
                pipPackages.splice(0, pipPackages.length, ...(new Set(pipPackages))) //remove duplicates
                console.log(pipPackages)
                ServingModel.update({id:sm.id}, {pipPackages: pipPackages, userreqs: pipPackages}).fetch().exec((err, sm) => {
                    if(err) {
                        console.log(err);
                        res.status(500).json( {err:err});
                    } else {
                        console.log(sm[0])
                        res.status(200).json( {msg:sm[0].pipPackages});
                    }
                });
            }
        }) 
    },

    deletepippackage: function(req, res) {
        var id = req.body.id;
        var pipPackage = req.body.pipPackage;

        console.log(pipPackage)
        ServingModel.findOne({id: id}, (err, sm)=> {
            if(err) {
                console.log(err);
                res.status(500).json( {err:err});
            }
            else{
                console.log(sm.pipPackages);
                if(sm.pipPackages){
                    sm.pipPackages.splice(sm.pipPackages.indexOf(pipPackage),1);
                    var pipPackages = sm.pipPackages;
                }
                console.log(pipPackages);
                ServingModel.update({id:sm.id}, {pipPackages: pipPackages,userreqs: pipPackages}).fetch().exec((err, sm) => {
                    if(err) {
                        console.log(err);
                        res.status(500).json( {err:err});
                    } else {
                        res.status(200).json( {msg:sm.pipPackages});
                    }
                });
            }
        })
    },

    deleteparseroutput: function(req, res) {
        var id = req.body.id;
        ServingModel.update({id:id}, {parserOutput:""}).fetch().exec((err, sm) => {
            if(err) {
              console.log(err);
              return res.status(500).json( {msg:"Showcase model could not be found"});
            } else {
              console.log(sm);
            }
        });
    }
}