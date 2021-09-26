var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
var AWS = require('aws-sdk');
var fs = require('fs');
const { getServingModel } = require('./ServingModelController');
const { getServingHistory } = require('./ServingHistoryController');
var async = require('async');
const request = require('request');
const { CustomerProfiles } = require('aws-sdk');
const { Resource$Defaultobjectaccesscontrols } = require('googleapis/build/src/apis/storage/v1');
var spawn = require("child_process").spawn;

module.exports = {
    getServingProject: function(req, res) {
        console.log(req.query)
        var edit = req.query.edit;
        if(edit) {
            delete req.query['edit'];
        }
        var public = req.query['public'];
        var company = req.query['company']
       
        if(public){
            var query = ServingProject.find({ispublic: true}, (err, matchingRecord) => {
                if (err) return res.serverError(err);
                console.log("records", matchingRecord);
                if(!matchingRecord) return res.notFound('No record found with the specified `name`.');
                if(matchingRecord) {
                    console.log("records");
                    res.ok(matchingRecord);
                }    
            });
        }
        if(company){
            var query = ServingProject.find({company: company}, (err, matchingRecord) => {
                if (err) return res.serverError(err);
                if(!matchingRecord) return res.notFound('No record found with the specified `name`.');
                if(matchingRecord) {
                    res.ok(matchingRecord);
                }
            });
        }
    },

    deleteproject: async function(req, res) {
        /*
        1. Remove zip file from s3
        2. Delete serving project, model and history documents
        3. Delete project in gitlab
        4. Delete s3 folder and files
        5. Delete openfaas deployment
        */

        var company = req.body.company;
        var servingprojectid = req.body.servingprojectid;

        awsconfig = sails.config.clouderizerconfig.servingBucketAWSCreds;
        s3Bucket=sails.config.clouderizerconfig.servingBucket;
        var config = {
        accessKeyId : awsconfig.awsaccessid,
        secretAccessKey : awsconfig.awssecret,
        };

        if(awsconfig.endpoint && awsconfig.endpoint != "") {
        var ep = new AWS.Endpoint(awsconfig.endpoint);
        config.endpoint = ep
        }

        if(awsconfig.region && awsconfig.region != "") {
        config.region = awsconfig.region
        }

        var params = {
            Bucket: s3Bucket
        };
        
        var s3  = new AWS.S3(config);
        console.log(config);

        ServingProject.destroy({id:servingprojectid}, (err, sp) => {
            if(!err){
                console.log("project destroyed");
                res.status(200).json({msg:'Project is deleted'});
            }
        });

        ServingModel.find({servingproject:servingprojectid}, (err, sm) => {
            if(err) {
                console.log(err);
                return res.status(500).json( {msg:"Error deleting the project"});
            } else {
                if(sm.length>0) {
                    for(var i=0;i<sm.length;i++) {

                        // delete s3 files
                        if(sm[i].training){
                            ServingHistory.find({model:sm[i].id}, (err, sh) => {
                                for(var l=0;l<sh.length;l++) {
                                    if(sh[l].inputFiles){
                                        var paramsin = {};
                                        for(var j=0;j<sh[l].inputFiles.length;j++) {
                                            paramsin = {Bucket: s3Bucket, Key: sh[l].inputFiles[j]}
                                            s3.deleteObject(paramsin,(err, data) =>{
                                                if(err) console.log(err);
                                                else console.log(data);
                                            })
                                        }
                                    }
                                    if(sh[l].outputFiles){
                                        var paramsout = {};
                                        for(var k=0;k<sh[l].outputFiles.length;k++) {
                                            paramsout = {Bucket: s3Bucket, Key: sh[l].outputFiles[k]}
                                            s3.deleteObject(paramsout,(err, data) =>{
                                                if(err) console.log(err);
                                                else console.log(data);
                                            })
                                        }
                                    }
                                    
                                }
                            })
                
                        }
                        
                        var s3_zip_file = sm[i].s3_zip_file;
                        if(s3_zip_file) {
                            params.Key = s3_zip_file;
                            s3.deleteObject(params, (err, data) => {
                                if(err) console.log(err);
                                else console.log(data);
                            });
                        }
                        var s3_other_files = sm[i].s3_other_files;
                        if(s3_other_files && s3_other_files.length > 0){
                            for(let i=0;i<s3_other_files.length;i++){
                                params.Key = s3_other_files[i];
                                s3.deleteObject(params, (err, data) => {
                                    if(err) console.log(err);
                                    else console.log(data);
                                });
                            }
                        }
                        if(sm[i].id){
                            ServingHistory.destroy({model:sm[i].id}, (err, sh) => {
                                if(!err) {
                                    console.log("history records destroyed") 
                                }
                            });
                            
                            ServingModel.destroy({id:sm[i].id}, (err, sh) => {
                                if(!err) {
                                    console.log("model destroyed")
                                }
                            }); 
                        }
                    }
                } else {
                    console.log("Didn't find any Serving model for this project ID");
                }
                
                if(servingprojectid){
                    console.log("sprojectid",servingprojectid);
                    PublishedServingProject.findOne({servingproject:servingprojectid}, (err,psp) => {
                        if(!err && psp){
                            if(psp.status == 'Running'){
                                PublishedFunction.find({psprojectid: psp.id}, (err, functions) => {
                                    if(!err && functions){
                                        internalfnService.stopproject(psp, functions, (err) => {
                                            console.log(err);
                                        });
                                    }
                                })
                            };
                            console.log("psp", psp);
                            // delete psp record
                            if(psp.id){
                                PublishedFunction.destroy({psprojectid:psp.id}, (err, psf) => {
                                    if(!err) {
                                        console.log("psp function destroyed");
                                        PublishedServingProject.destroy({id: psp.id}, (err, psp1) =>{
                                            if(err) console.log("error deleting psp project", err)
                                            else console.log("deleted psp project")
                                        });
                                    }
                                    else{
                                        console.log("error deleting pspfunction project", err)
                                    }
                                });
                            }
                        }
                        else{
                            console.log("no psp record")
                        }
                    });
                }
            }
        });
    },

    updateBannerImage: function(req, res){
        ServingProject.update({id: req.body.projectId}, {bannerImage: req.body.bannerImage}).fetch().exec((err, sp2) => {
            if(err) {
                console.log("Error in /updateBannerImage", err);
            } else {
                res.json("Saved!");
            }
        }); 
    },

    postServingProject: function(req, res) {
        var projectId = req.body.projectId;

        console.log(req.body.thumbs_up);
        console.log(req.body.thumbs_down);
        console.log(req.body.requests);
        if(!req.body.requests){
            console.log("thumbs");
            ServingProject.update({id: projectId}, {thumbs_up: req.body.thumbs_up, thumbs_down : req.body.thumbs_down}).fetch().exec((err, sp1) => {
                if(err) {
                    console.log("Error in /postServingProject", err);
                } else {
                    res.json("Saved!");
                }
            }); 
        } else if(req.body.requests){
            console.log("requests");
            ServingProject.update({id: projectId}, {requests: req.body.requests, thumbs_up: req.body.thumbs_up, thumbs_down : req.body.thumbs_down}).fetch().exec((err, sp2) => {
                if(err) {
                    console.log("Error in /postServingProject", err);
                } else {
                    res.json("Saved!");
                }
            }); 
        }
    },

    getprojects: function(req, res) {
        // populate PublishedservingProjects with ServingProject mainly for cli
        const companyid=req.body.company;
        PublishedServingProject.find({company:companyid}).populate('servingproject').exec((err, publishedproject) => {
            if(!err && publishedproject) {
                res.status(200).json(publishedproject);
            } else res.status(500).json({"err":"No project found"});
        });
    },

    fetchuser: async function(req, res){
        User.find({}, async (err, us) => {
            console.log(us[0]);
            console.log("starting user data");
            if(!err && us){
                var user_details = [];
                console.log("details")
                for (let i=0; i<us.length; i++){
                    console.log("user details")
                    console.log(us[i]);
                    var user = us[i];
                    var sm = await ServingModel.find({company: user.company});
                    if(sm && sm.length > 0){
                        for (let j=0; j<sm.length; j++){
                            var model = sm[j];
                            var details = {};
                            details["user email"] = user.email;
                            details["account created on"] = user.createdAt;
                            var model_type = "";
                            if(model.subtype == 'pmml4s' || model.subtype == 'jpmml' || model.subtype == 'pmml'){
                                model_type = 'PMML'
                            }
                            else if(model.subtype == 'dai' || model.subtype == 'h2o' || model.subtype == 'H2O.ai'){
                                model_type = 'H2O'
                            }
                            else if(model.subtype == 'pythonscore'){
                                model_type = 'Python'
                            }
                            details["Model type"] =  model_type;
                            details["Model uploaded on"] = model.createdAt;
                            details["Recent updates"] = model.updatedAt;
                            details["Model Size"] = (model.modelSize/1000000).toFixed(2) + ' MB';
                            details["Deployed on"] = model.machinetype;
                            var sh = await ServingHistory.find({model: model.id});
                            if(sh){
                                details["Scoring Requests"] = sh.length;
                                details["Successful scoring count"] = sh.filter(i => { return i && i.output && i.output[0] && i.output[0].value != 'Error'}).length;
                                details["Failed scoring count"] = sh.filter(i => { return i && i.output && (!i.output.length || i.output[0].value == 'Error') }).length;
                            }
                            else {
                                details["Scoring Requests"] = 0;
                                details["Successful scoring count"] = 0;
                                details["Failed scoring count"] = 0;
                            }
                            console.log(details);
                            user_details.push(details);
                        };
                    }
                    else{
                        details = {};
                        details["user email"] = user.email;
                        details["account created on"] = user.createdAt;
                        details["Model type"] =  "";
                        details["Model uploaded on"] = "";
                        details["Recent updates"] = "";
                        details["Model Size"] = "";
                        details["Deployed on"] = "";
                        details["Scoring Requests"] = 0;
                        details["Successful scoring count"] = 0;
                        details["Failed scoring count"] = 0;
                        console.log(details)
                        user_details.push(details);
                    }
                }
                console.log("for loop complete");
            }
            console.log(user_details);  
        });
        res.status(200).json({msg: 'success'});
    },

    fetchProjectConfig: function(req, res){
        ServingProject.findOne({id: req.body.servingproject}).exec((err, sproject) => {
            if(err || !sproject){
                return res.status(500).json({success:false, message: "Error fetching details!"});
            }
            else{
                ServingModel.findOne({servingproject: req.body.servingproject}, (err, model) => {
                    if(err || !model){
                        return res.status(500).json({success:false, message: "Error fetching details!"});
                    }
                    else{
                        var file_path = "";
                        if(model.subtype == "jpmml" || model.subtype == "pmml4s"){
                            file_path="/tmp/model.pmml";
                        }
                        else if(model.subtype == "pythonscore"){
                            file_path="/tmp/model.pickle";
                        }
                        else if(model.subtype == "h2o" || model.subtype == "dai"){
                            file_path="/tmp/gotit.zip";
                        }
        
                        if(model.training){
                            file_path="/tmp/notebook.ipynb";
                            model.subtype = "train";
                        }
        
                        var projectConfig = {
                            "file_path": file_path,
                            "projectName": sproject.name,
                            "projectDescription": sproject.description,
                            "companyId": sproject.company,
                            "input": sproject.inputAttr,
                            "output": sproject.outputAttr,
                            "bannerImage": sproject.bannerImage,
                            "public": sproject.ispublic,
                            "timeSeries": model.timeSeries ? model.timeSeries : false,
                            "zip_path": model.s3_zip_file,
                            "cldz_base_url": sails.config.clouderizerconfig.base_url,
                            "type": model.type,
                            "subtype": model.subtype,
                            "servingid": model.id,
                            "projectid": sproject.id,
                            "preprocess": model.preprocessEnabled,
                            "postprocess": model.postprocessEnabled,
                            "secret_key": model.secret_key,
                            "lambda" : model.lambda == "true" ? true : false
                        }
                        return res.status(200).json(projectConfig);
                    }
                })
            }  
        })
    }, 

    publishServingProject: function(req, res) {
        proj_id = req.body.projectId;
        infratype = req.body.infratype;

        ServingProject.findOne({id: proj_id}).populate('company').exec(async (err, sproject) => {
            console.log(sproject);
            var spsavedon = sproject.savedon;
            var imagebuildtime = sproject.imagebuildtime;
            var customerdetails = await Customer.findOne({id:sproject.company.id});
            var custsavedon = customerdetails.savedon;
            var nbvariables = "";
            if(customerdetails.nbvariables && customerdetails.nbvariables.length > 0){
                nbvariables = customerdetails.nbvariables;
            }
            ServingModel.find({servingproject: proj_id}, (err, models) => {
                if(err || !models) {
                    res.json(500, {success:false, message: "Error publishing the project. Please try again!"});
                    return;
                } else if(models.length == 0) {
                    res.json(500, {success:false, message: "Error publishing the project. Please try again!"});
                    return;
                }
                var smsavedon = models[0].savedon;
                model = models[0];
                console.log("before async waterfall - publishproject")
                async.waterfall([
                    (next) => {
                        //Get the publishedProject if already in db
                        normalized_companyname = sproject.company.name.replace(/[^a-zA-Z0-9]+/g, '').replace(/\s+/g, '').toLowerCase();
                        normalized_projectname = sproject.name.replace(/[^a-zA-Z0-9-]+/g, '').replace(/\s+/g, '').toLowerCase();
                        PublishedServingProject.findOne({servingproject: sproject.id, company: sproject.company.id})
                            .populate('functions')
                            .exec((err, pproject) => {
                            console.log("pproject", pproject)
                            if(err || !pproject) {
                                //didn't find it, let's create it
                                PublishedServingProject.create({
                                    name: normalized_companyname + '-' + normalized_projectname,
                                    servingproject: sproject.id,
                                    infratype: infratype,
                                    company: sproject.company.id,
                                    giturl: sails.config.clouderizerconfig.base_git_url + normalized_companyname + '-' + normalized_projectname + '.git',
                                    registryurl: sails.config.clouderizerconfig.base_registry_url + normalized_companyname + '-' + normalized_projectname
                                }, (err, pproject) => { 
                                    console.log("pproject create", pproject)
                                    if(err || !pproject) {
                                        return res.serverError();
                                    }
                                    next(null, pproject);
                                }, {fetch: true} );
                            } else if(pproject.infratype != infratype){
                                PublishedServingProject.update({id: pproject.id}, {infratype: infratype}).fetch().exec((err, pp2) => {
                                    console.log("pp2 here", pp2)
                                    if(err || !pp2) {
                                        return res.serverError();
                                    }
                                    pp2[0].functions = pproject.functions;
                                    next(null, pp2[0]);
                                });         
                            } 
                            else {
                                next(null, pproject);
                            }
                        })
                    },

                    (pproject, next) => {
                        console.log("after async", pproject)
                        functions = [];
                        fname = normalized_companyname + '-' + normalized_projectname;
                        console.log("functions")
                        predictFunction = findFunc(pproject.functions, fname);

                        var modelSubtype = "automl";
                        if(model.subtype=="pythonscore") modelSubtype="python";
                        if(model.subtype=="onnx") modelSubtype="onnx";
                        fname = fname.replace(/[^a-zA-Z0-9-]+/g, '').replace(/\s+/g, '');
                        if(!predictFunction) {
                            predictFunction = {
                                name: fname,
                                schema: sproject.parserOutput,
                                input_type: 'user',
                                output_type: 'user',
                                psprojectid: pproject.id,
                                timeout: model.training ? '60m' : '2m',
                                fn_type: modelSubtype,
                                fn_exec: infratype
                            }
                        }

                        predictFunction.servingproject = sproject.id;
                        predictFunction.company = sproject.company.id;
                        predictFunction.fn_model_path = model.s3_zip_file;
                        predictFunction.server_url = sails.config.clouderizerconfig.base_url;
                        predictFunction.infratype = infratype;
                        predictFunction.timeout = '2m'
                        predictFunction.cpu_request = '10m'
                        predictFunction.memory_request = '100Mi'
                        //putting limits based on training vs prediction
                        if(model.training) {
                            predictFunction.timeout = '60m'
                        } 

                        if(infratype == 'standard'){
                            predictFunction.cpu_limit = '1'
                            predictFunction.memory_limit = '2Gi'
                        }
                        else if(infratype == 'highmemory'){
                            predictFunction.cpu_limit = '3'
                            predictFunction.memory_limit = '8Gi'
                        }
                        else if(infratype == 'gpu'){
                            predictFunction.gpu_limit = '1'
                            predictFunction.cpu_limit = '8'
                            predictFunction.memory_limit = '30Gi'
                        }

                        
                        if(model.preprocessEnabled && 
                            model.preprocessCodePath && 
                            model.preprocessCodePath != '') {
                            predictFunction.preprocess_script_path = model.preprocessCodePath
                        }

                        if(model.postprocessEnabled && 
                            model.postprocessCodePath && 
                            model.postprocessCodePath != '') {
                            predictFunction.postprocess_script_path = model.postprocessCodePath
                        }

                        if(model.s3_zip_file && 
                            model.s3_zip_file != '') {
                            predictFunction.model_path = model.s3_zip_file;
                        }

                        if(model.s3_other_files && 
                            model.s3_other_files != '' && model.s3_other_files.length > 0) {
                            predictFunction.s3_otherfiles_path = model.s3_other_files.toString();
                            predictFunction.otherfiles_path = model.otherfilenames.toString();
                        }

                        if(model.predictCodePath && 
                            model.predictCodePath != '') {
                            predictFunction.predict_script_path = model.predictCodePath;
                        }

                        if(model.pipPackages && model.pipPackages.length > 0) {
                            predictFunction.reqs = model.pipPackages.toString()
                        }

                        if(model.userreqs && sails.config.clouderizerconfig.clouderizerpackages){
                            if(model.imagetype == 'tensorflow' || model.imagetype == 'torch'){
                                predictFunction.hotstart = model.userreqs.every(val => sails.config.clouderizerconfig.clouderizerpackages.custom.includes(val));
                            }
                            else{
                                predictFunction.hotstart = model.userreqs.every(val => sails.config.clouderizerconfig.clouderizerpackages.standard.includes(val));
                            }   
                        }

                        if (model.imagetype == 'tensorflow'){
                            predictFunction.dockerimage = 'tfpython3'
                        }
                        else if(model.imagetype == 'torch'){
                            predictFunction.dockerimage = 'torchpython3'
                        }
                        else{
                            predictFunction.dockerimage = 'python3'
                        }

                        if(model.userreqs && model.userreqs.length > 0) {
                            predictFunction.userreqs = model.userreqs.toString()
                        }
                        var file_path = "";
                        if(model.subtype == "jpmml" || model.subtype == "pmml4s"){
                            file_path="/tmp/model.pmml";
                        }
                        else if(model.subtype == "pythonscore"){
                            file_path="/tmp/model.pickle";
                        }
                        else if(model.subtype == "h2o" || model.subtype == "dai"){
                            file_path="/tmp/gotit.zip";
                        }

                        if(model.training){
                            file_path="/tmp/notebook.ipynb";
                            model.subtype = "train";
                        }

                        predictFunction.schema = sproject.parserOutput;
                        predictFunction.projectConfig = {
                            "file_path": file_path,
                            "projectName": sproject.name,
                            "projectDescription": sproject.description,
                            "companyId": sproject.company.id,
                            "input": sproject.inputAttr,
                            "output": sproject.outputAttr,
                            "bannerImage": sproject.bannerImage,
                            "public": sproject.ispublic,
                            "timeSeries": model.timeSeries ? model.timeSeries : false,
                            "zip_path": model.s3_zip_file,
                            "cldz_base_url": sails.config.clouderizerconfig.base_url,
                            "type": model.type,
                            "subtype": model.subtype,
                            "servingid": model.id,
                            "projectid": sproject.id,
                            "preprocess": model.preprocessEnabled,
                            "postprocess": model.postprocessEnabled,
                            "secret_key": model.secret_key
                        }

                        functions.push(predictFunction);
                        next(null, [pproject, functions])
                    }
                ], (err, result) => {
                    pproject = result[0]
                    functions = result[1]
                    console.log("calling publish project")
                    console.log("times", spsavedon, smsavedon, custsavedon, imagebuildtime)
                    if(spsavedon) pproject.spsavedon = spsavedon
                    else pproject.spsavedon = 0;
                    if(smsavedon) pproject.smsavedon = smsavedon
                    else pproject.smsavedon = 0;
                    if(custsavedon) pproject.custsavedon = custsavedon
                    else pproject.custsavedon = 0;
                    pproject.imagebuildtime = imagebuildtime;
                    internalfnService.publishproject(pproject, functions, nbvariables, (err) => {
                        if(err) {
                            console.log("error in publish project", err)
                            pproject.status_message = "Error publishing project. Please try again!";
                            return res.json(500, {success:false, message: "Error publishing the project. Please try again!"});
                        } else {
                            console.log("publishing project")
                            pproject.status_message = "Project publish in progress...";
                        }

                        async.each(functions, (f, next) => {
                            PublishedFunction.findOne({psprojectid: pproject.id, name: f.name}, (err, db_fn) => {
                                if(err || !db_fn) {
                                    PublishedFunction.create(f, (err, f) => {
                                        next();
                                    })
                                } else {
                                    PublishedFunction.update({id: db_fn.id}, f, (err, fns) => {
                                        next();
                                    }, { fetch: true })
                                }
                            })
                            
                        }, (err) => {
                            //update published project status and return
                            delete pproject[functions];
                            PublishedServingProject.update({id:pproject.id}, pproject, (err, sm) => {                  
                                res.ok({success: true})
                            }, { fetch: true });
                        })
                    });
                })
            })
        });
        
    },

    publishServingProjectLambda: function(req, res) {
        proj_id = req.body.projectId;
        infratype = req.body.infratype;

        ServingProject.findOne({id: proj_id}).populate('company').exec(async (err, sproject) => {
            console.log(sproject);
            var customerdetails = await Customer.findOne({id:sproject.company.id});
            var nbvariables = "";
            if(customerdetails.nbvariables && customerdetails.nbvariables.length > 0){
                nbvariables = customerdetails.nbvariables;
            }
            ServingModel.find({servingproject: proj_id}, (err, models) => {
                if(err || !models) {
                    res.json(500, {success:false, message: "Error publishing the project. Please try again!"});
                    return;
                } else if(models.length == 0) {
                    res.json(500, {success:false, message: "Error publishing the project. Please try again!"});
                    return;
                }
                model = models[0];
                console.log("before async waterfall - publishproject")
                async.waterfall([
                    (next) => {
                        //Get the publishedProject if already in db
                        normalized_companyname = sproject.company.name.replace(/[^a-zA-Z0-9]+/g, '').replace(/\s+/g, '').toLowerCase();
                        normalized_projectname = sproject.name.replace(/[^a-zA-Z0-9-]+/g, '').replace(/\s+/g, '').toLowerCase();
                        PublishedServingProject.findOne({servingproject: sproject.id, company: sproject.company.id})
                            .populate('functions')
                            .exec((err, pproject) => {
                            console.log("pproject", pproject)
                            if(err || !pproject) {
                                //didn't find it, let's create it
                                PublishedServingProject.create({
                                    name: normalized_companyname + '-' + normalized_projectname,
                                    servingproject: sproject.id,
                                    infratype: infratype,
                                    company: sproject.company.id,
                                    giturl: sails.config.clouderizerconfig.base_git_url + normalized_companyname + '-' + normalized_projectname + '.git',
                                    registryurl: sails.config.clouderizerconfig.base_registry_url + normalized_companyname + '-' + normalized_projectname
                                }, (err, pproject) => { 
                                    console.log("pproject create", pproject)
                                    if(err || !pproject) {
                                        return res.serverError();
                                    }
                                    next(null, pproject);
                                }, {fetch: true} );
                            } else if(pproject.infratype != infratype){
                                PublishedServingProject.update({id: pproject.id}, {infratype: infratype}).fetch().exec((err, pp2) => {
                                    console.log("pp2 here", pp2)
                                    if(err || !pp2) {
                                        return res.serverError();
                                    }
                                    pp2[0].functions = pproject.functions;
                                    next(null, pp2[0]);
                                });         
                            } 
                            else {
                                next(null, pproject);
                            }
                        })
                    },

                    (pproject, next) => {
                        console.log("after async", pproject)
                        functions = [];
                        fname = normalized_companyname + '-' + normalized_projectname;
                        console.log("functions")
                        predictFunction = findFunc(pproject.functions, fname);

                        var modelSubtype = "automl";
                        if(model.subtype=="pythonscore") modelSubtype="python";
                        if(model.subtype=="onnx") modelSubtype="onnx";
                        fname = fname.replace(/[^a-zA-Z0-9-]+/g, '').replace(/\s+/g, '');
                        if(!predictFunction) {
                            predictFunction = {
                                name: fname,
                                schema: sproject.parserOutput,
                                input_type: 'user',
                                output_type: 'user',
                                psprojectid: pproject.id,
                                timeout: model.training ? '15m' : '2m',
                                fn_type: modelSubtype,
                                fn_exec: infratype
                            }
                        }

                        predictFunction.servingproject = sproject.id;
                        predictFunction.company = sproject.company.id;
                        predictFunction.fn_model_path = model.s3_zip_file;
                        predictFunction.server_url = sails.config.clouderizerconfig.base_url;
                        predictFunction.infratype = infratype;
                        predictFunction.timeout = '2m'
                        predictFunction.cpu_request = '10m'
                        predictFunction.memory_request = '100Mi'
                        if(model.training) {
                            predictFunction.timeout = '15m'
                        } 
                        

                        if(infratype == 'standard'){
                            predictFunction.cpu_limit = '1'
                            predictFunction.memory_limit = '2Gi'
                        }
                        else if(infratype == 'highmemory'){
                            predictFunction.cpu_limit = '3'
                            predictFunction.memory_limit = '8Gi'
                        }
                        
                        if(model.preprocessEnabled && 
                            model.preprocessCodePath && 
                            model.preprocessCodePath != '') {
                            predictFunction.preprocess_script_path = model.preprocessCodePath
                        }

                        if(model.postprocessEnabled && 
                            model.postprocessCodePath && 
                            model.postprocessCodePath != '') {
                            predictFunction.postprocess_script_path = model.postprocessCodePath
                        }

                        if(model.s3_zip_file && 
                            model.s3_zip_file != '') {
                            predictFunction.model_path = model.s3_zip_file;
                        }

                        if(model.s3_other_files && 
                            model.s3_other_files != '' && model.s3_other_files.length > 0) {
                            predictFunction.s3_otherfiles_path = model.s3_other_files.toString();
                            predictFunction.otherfiles_path = model.otherfilenames.toString();
                        }

                        if(model.predictCodePath && 
                            model.predictCodePath != '') {
                            predictFunction.predict_script_path = model.predictCodePath;
                        }

                        if(model.pipPackages && model.pipPackages.length > 0) {
                            predictFunction.reqs = model.pipPackages.toString()
                        }

                        if(model.userreqs && sails.config.clouderizerconfig.clouderizerpackages){
                            if(model.imagetype == 'tensorflow' || model.imagetype == 'torch'){
                                predictFunction.hotstart = model.userreqs.every(val => sails.config.clouderizerconfig.clouderizerpackages.custom.includes(val));
                            }
                            else{
                                predictFunction.hotstart = model.userreqs.every(val => sails.config.clouderizerconfig.clouderizerpackages.standard.includes(val));
                            }   
                        }

                        if(model.training){
                            if (model.imagetype == 'tensorflow'){
                                predictFunction.dockerimage = 'tfpython3'
                            }
                            else if(model.imagetype == 'torch'){
                                predictFunction.dockerimage = 'torchpython3'
                            }
                            else{
                                predictFunction.dockerimage = 'python3'
                            }
                        }
                        else if(model.subtype == 'pythonscore' || model.subtype == "onnx"){
                            predictFunction.dockerimage = 'python3'
                        }

                        if(model.userreqs && model.userreqs.length > 0) {
                            predictFunction.userreqs = model.userreqs.toString()
                        }
                        var file_path = "";
                        if(model.subtype == "jpmml" || model.subtype == "pmml4s"){
                            file_path="/tmp/model.pmml";
                        }
                        else if(model.subtype == "pythonscore"){
                            file_path="/tmp/model.pickle";
                        }
                        else if(model.subtype == "h2o" || model.subtype == "dai"){
                            file_path="/tmp/gotit.zip";
                        }

                        if(model.training){
                            file_path="/tmp/notebook.ipynb";
                            model.subtype = "train";
                        }

                        predictFunction.schema = sproject.parserOutput;
                        predictFunction.projectConfig = {
                            "file_path": file_path,
                            "projectName": sproject.name,
                            "projectDescription": sproject.description,
                            "companyId": sproject.company.id,
                            "input": sproject.inputAttr,
                            "output": sproject.outputAttr,
                            "bannerImage": sproject.bannerImage,
                            "public": sproject.ispublic,
                            "timeSeries": model.timeSeries ? model.timeSeries : false,
                            "zip_path": model.s3_zip_file,
                            "cldz_base_url": sails.config.clouderizerconfig.base_url,
                            "type": model.type,
                            "subtype": model.subtype,
                            "servingid": model.id,
                            "projectid": sproject.id,
                            "preprocess": model.preprocessEnabled,
                            "postprocess": model.postprocessEnabled,
                            "secret_key": model.secret_key
                        }

                        functions.push(predictFunction);
                        next(null, [pproject, functions])
                    }
                ], (err, result) => {
                    pproject = result[0]
                    functions = result[1]
                    console.log("calling publish project")

                    async.each(functions, (f, next) => {
                        //check if this function is already in db
                        PublishedFunction.findOne({psprojectid: pproject.id, name: f.name}, (err, db_fn) => {
                            if(err || !db_fn) {
                                //create the function
                                PublishedFunction.create(f, (err, f) => {
                                    next();
                                })
                            } else {
                                //update the function
                                PublishedFunction.update({id: db_fn.id}, f, (err, fns) => {
                                    next();
                                }, { fetch: true })
                            }
                        })
                        
                    }, (err) => {
                        //update published project status and return
                        delete pproject[functions];
                        PublishedServingProject.update({id:pproject.id}, pproject, (err, sm) => {                  
                            res.ok({success: true})
                        }, { fetch: true });
                    })
                    // });
                })
            })
        });
        
    },

    refreshmetrics: function(req, res) {
        proj_id = req.body.projectId;
        PublishedServingProject.findOne({servingproject: proj_id}).exec((err, pproject) => {
            if(!err && pproject){
                internalfnService.checkmetrics(pproject, (data) => {
                    return res.status(200).json({data: data});
                });
            }
            else{
                console.log("checkmetrics", err, pproject);
                return res.status(200).json({data: null});
            }
        })
    },

    deployServingProject: function(req, res) {
        proj_id = req.body.projectId;
        ServingProject.findOne({id: proj_id}).populate('company').exec((err, sproject) => {
            if(err || !sproject) {
                res.json(500, {success:false, message: "sp: Error deploying the project"});
                return;
            }
            PublishedServingProject.findOne({servingproject: sproject.id, company: sproject.company.id})
                .exec((err, pproject) => {
                if(err) {
                    res.json(500, {success:false, message: "Error deploying the project"});
                    return;
                }
                else if(!pproject) {
                    res.json(500, {success:false, message: "Please save the project before deploying"});
                    return;
                } else {
                    internalfnService.deployproject(pproject, (err) => {
                        if(err) {
                            pproject.status = "Not Running";
                            pproject.status_message = "Some error occured while merging latest code.";
                            return res.serverError();
                        } else {
                            pproject.status_message = "Merging latest code...";
                            PublishedServingProject.update({id:pproject.id}, pproject, (err, sm) => {                  
                                res.ok({success: true})
                            }, { fetch: true });
                        }
                    });
                }
            })
        });
        
    },

    updateprometheus: function(req,res){
        console.log("function metrics sp", req.body);
        ServingProject.update({id: req.body.id}, {function_invocation_count: req.body.function_invocation_count, function_time_sum_standard: req.body.function_time_sum_standard, function_time_sum_highmemory: req.body.function_time_sum_highmemory, function_time_sum_gpu: req.body.function_time_sum_gpu}).fetch().exec((err, sp2) => {             
            if(err) {
                console.log("Error in updateprometehus - sp", err);
                res.status(500).json({success: false})
            } else {
                console.log("prometheus sp saved!");
                res.status(200).json({success: true})
            }
        });
    },

    stopServingProject: function(req, res) {
        proj_id = req.body.projectId;
        ServingProject.findOne({id: proj_id}).populate('company').exec((err, sproject) => {
            if(err || !sproject) {
                res.json(500, {success:false, message: "Error stopping the project"});
                return;
            }
            PublishedServingProject.findOne({servingproject: sproject.id, company: sproject.company.id})
                .exec((err, pproject) => {
                if(err || !pproject) {
                    res.json(500, {success:false, message: "Error stopping the project"});
                    return;
                } else {
                    PublishedFunction.find({psprojectid: pproject.id}, (err, functions) => {
                        if(err || !functions) {
                            res.json(500, {success:false, message: "Error stopping the project"});
                            return;
                        }
                        internalfnService.stopproject(pproject, functions, (err) => {
                            if(err) {
                                pproject.status_message = "Some error occured while stopping project.";
                                return res.serverError();
                            } else {
                                //pproject.status = "Stopping";
                                pproject.status_message = "Stopping model instance...";
                                PublishedServingProject.update({id:pproject.id}, pproject, (err, sm) => {                  
                                    res.ok({success: true})
                                }, { fetch: true });
                            }
                        });
                    })
                }
            })
        });
    },

    getStatusServingProject: function(req, res) {
        proj_id = req.body.projectId;
        ServingProject.findOne({id: proj_id}).populate('company').exec((err, sproject) => {
            if(err || !sproject) {
                res.json(500, {success:false, message: "Error getting project status"});
                return;
            }
            PublishedServingProject.findOne({servingproject: sproject.id, company: sproject.company.id})
                .exec((err, pproject) => {
                if(err || !pproject) {
                    res.json(500, {success:false, message: "Error getting project status"});
                    return;
                } else {
                    PublishedFunction.find({psprojectid: pproject.id}, (err, functions) => {
                        if(err || !functions) {
                            res.json(500, {success:false, message: "Error getting project status"});
                            return;
                        }
                        internalfnService.getprojectstatus(pproject, functions, (err) => {
                            if(err) {
                                pproject.status_message = "Error getting project status";
                                return res.serverError();
                            } else {
                                pproject.status_message = "Getting project status...";
                                PublishedServingProject.update({id:pproject.id}, pproject, (err, sm) => {                  
                                    res.ok({success: true})
                                }, { fetch: true });
                            }
                        });
                    })
                    
                }
            })
        });
    },

    parsejupyternb: function(req, res){

        internalfnService.parsenotebook(req.body, (err, result) => {
            if(err){
                return res.serverError();
            }
            else{
                res.status(200).json({"result": result})
            }
        });
    },

    getserverlessurl: function(req, res){
        return res.status(200).json({"url":sails.config.clouderizerconfig.serverlessURL.split("/async-function/")[0]})
    }
};

function findFunc(fnArray, fname) {
    if(!fnArray) return null;

    for(i=0;i<fnArray.size;i++) {
        if(fnArray[i].name == fname) {
            fnArray[i].name = fnArray[i].name.replace(/[^a-zA-Z0-9-]+/g, '').replace(/\s+/g, '')
            return fnArray[i]
        }
    }
    return null
}
