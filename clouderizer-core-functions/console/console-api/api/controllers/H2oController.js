var h2oparserService = require("../services/H2oParserService");
var servingProjectService = require("../services/servingProjectService");
var async = require('async');

module.exports = {
    h2oparse: function (req, res) {
        var s3Url = req.body.path;
        var servingid = req.body.servingid;
        console.log(s3Url);

        internalfnService.h2oparser(s3Url, servingid, (err) => {
            if(err) {
                console.log(err);
                console.log("parser error");
                if(servingid) ServingModel.update({id:servingid}, {parserOutput: 'Parser error'}).fetch().exec((err, sm) => {                  
                });
            }
        });
        console.log("before h2o parse ",servingid)
        if(servingid) ServingModel.update({id:servingid}, {parserOutput: 'Parsing in progress'}).fetch().exec((err, sm) => {
        });
        res.status(200).json({msg:'Parsing in progress'});
    },

    pmml4sparse: (req, res) => {
        var servingid = req.body.servingid;
        var s3Url = req.body.path;
        var modeltype='pmml';
        internalfnService.parsemodeljava(s3Url, servingid, (err) => {
            if(err) {
                console.log(err);
                console.log("parser error");
                if(servingid) ServingModel.update({id:servingid}, {parserOutput: 'Parser error'}).fetch().exec((err, sm) => {                  
                });
            }
        });
    },

    pmmlparse: (req, res) => {
        var servingid = req.body.servingid;
        var s3Url = req.body.path;
        console.log(servingid);
        internalfnService.parsemodeljava(s3Url, servingid, (err) => {
            if(err) {
                console.log(err);
                console.log("parser error");
                if(servingid) ServingModel.update({id:servingid}, {parserOutput: 'Parser error'}).fetch().exec((err, sm) => {                  
                });
            }
        });
        console.log("before pmml parse ", servingid)
        if(servingid) ServingModel.update({id:servingid}, {parserOutput: 'Parsing in progress'}).fetch().exec((err, sm) => {});
        res.status(200).json({msg:'Parsing in progress'});
    },

    updatesubtype: (req, res) => {

        var subtype = req.body.subtype;
        var servingid = req.body.servingid;

        console.log(subtype);
        console.log(servingid);

        if(servingid) {
            ServingModel.update({id:servingid}, {subtype:subtype}).fetch().exec((err, sm) => {
            if(err) {console.log(err); res.status(500); return;}
            else {
                console.log("Subtype "+ subtype+ " updated for Serving model id " + servingid);
                res.status(200); return;
            }
            });
        }
    },

    updateservingport: (req, res) => {
        var servingport = req.body.servingport;
        var servingid = req.body.servingid;


        console.log(servingport);
        console.log(servingid);

        if(servingid) ServingModel.update({id:servingid}, {servingport:servingport}).fetch().exec((err, sm) => {
            if(err) {console.log(err);}
            else {
                res.json("Db updated");
            }
        });
    },

    stopinstance: (req, res) => {
        var company = req.body.company;

        var servingid = req.body.servingid;

        var instancetype=req.body.platform_type;

        console.log(instancetype);
        
        ServingModel.findOne({id:servingid}, (err, sm) => {
            if(err || !sm) {
                console.log(err);
                return res.status(500).json({msg:"Some Error occurred while stopping instance!"});
            } else {
                var projectId = sm.servingproject;
                //Fix for the case where project status is stuck on Stopping
                ServingProject.findOne({id:projectId}, (err, sp) => {
                    var statusmessage = "";
                    if(sm.status_message == 'Insufficient memory. Please deploy it with more memory!' || sm.status_message.toLowerCase().includes('file not found. please upload') || sm.status_message.toLowerCase().includes("issue with predictor") || sm.status_message.toLowerCase().includes('deploy again') || sm.status_message == 'Something went wrong. Instance stopped') {
                        statusmessage = sm.status_message;
                    }
                    else{
                        statusmessage = 'Project is not running';
                    }
                    if(sp.status == 'Stopping') {
                        if(projectId) ServingProject.update({id:projectId}, {status:"Not Running"}).fetch().exec((err, sm) => {});
                        if(servingid) ServingModel.update({id:servingid}, {status:"Not Running", status_message: statusmessage}).fetch().exec((err, sm) => {
                            if(err){
                                console.log(err)
                            }
                        });
                    } else {
                        console.log(instancetype);
                        if(projectId) ServingProject.update({id:projectId}, {status:"Not Running"}).fetch().exec((err, sm) => {});
                        if(servingid) ServingModel.update({id:servingid}, {status:"Not Running", status_message: statusmessage}).fetch().exec((err, sm) => {});  
                    }
                });
            }
        });
        
        if(instancetype==="aws") {
            servingProjectService.stopAWSInstance(company, servingid, (err) => {
                if(!err.success){
                    if(projectId) ServingProject.update({id:projectId}, {status:"Not Running"}).fetch().exec((err, sm) => {});
                    if(servingid) ServingModel.update({id:servingid}, {status:"Not Running", status_message: err.error}).fetch().exec((err, sm) => {});
                }
            });
        }
        
        else if(instancetype==="gcp") {
            servingProjectService.stopGCPInstance(company, servingid, (err) => {
                if(!err.success){
                    if(projectId) ServingProject.update({id:projectId}, {status:"Not Running"}).fetch().exec((err, sm) => {});
                    if(servingid) ServingModel.update({id:servingid}, {status:"Not Running", status_message: err.error}).fetch().exec((err, sm) => {});
                }
            });
        }

        res.json({"msg":"success"});
    },

    predictiondata: function (req, res) {

        var inputValues = req.body.input;
        console.log(req.body.output);
        console.log(req.body.servingid);
        ServingHistory.create({
           inputAttrValues: inputValues,
           outputAttrValues: req.body.output,
           model: req.body.servingid,
           responseTime: req.body.responseTime
       }).fetch().exec((err, sh) => {
           if(err) console.log("Error:", err);
           console.log(sh);
           if(!err) {
               res.json("Saved!");
           }
       });
    },

    
}
