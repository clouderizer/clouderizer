const fs = require('fs');
const socket_handler = require("./socket_handler")
const util = require("./util")
const csvParser = require('csv-parser');
const shortid = require("shortid");
const shell = require('shelljs');
const {exec} = require('child_process');
const uuid = require('uuid');
const python_scorer_log="preprocess.log"
const python_user_log="user_python.log"
const request = require('request');
const path = require("path");
const async = require("async");

// var jsonPath = ""
// try {
//     jsonPath = path.join(global.base_path, '..', 'function', 'projectConfig.json');
// } catch (e) {
//     //in case json configuration is not valid, exit the process...we cannot do anything
//     process.exit(1)
// }
//

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
}

function inputAttrLength(type) {
    if(type == 'preprocess'){
        return global.rawInputAttr.length;
    }
    else if(type == 'prediction'){
        return global.validationInputAttr.length;
    }
    
}

function convertObjToStr(obj, type) {
    var arr="";
    length=inputAttrLength(type);
    for(var x=0;x<length;x++) {
        if(x!=length-1) arr=arr+obj[x]+",";
        else arr=arr+obj[x];
    }
    return arr;
}

// function convertObjToArr(obj, cb) {
//     var arr=[],
//         length=inputAttrLength();
//     for(var x=0;x<length;x++) {
//         arr.push(obj[x]);
//     }
//     cb(arr);
// }

function validateRow(type, csv, cb) {
    console.log("Inside validate row", csv);
    if(type == 'preprocess'){
        var tempinputs = global.rawInputAttr;
    }
    else if(type == 'prediction'){
        var tempinputs = global.validationInputAttr;
    }
    for(var i=0; i < csv.length; i++) {
        if (tempinputs[i] && tempinputs[i].type && tempinputs[i].type==="Numeric") {
            var convertToInt = parseInt(csv[i]);
            var min = tempinputs[i].min;
            var max = tempinputs[i].max;

            if(min==null && max==null) continue;
            if(convertToInt==NaN) {
                cb({success: false, message: csv[i] + " is not Numeric"});
                return;
            }
            if(!(convertToInt>min)) {
                cb({success: false, message: csv[i] + " value less than min"});
                return;
            }
            if(!(convertToInt<max)) {
                cb({success: false, message: csv[i] + " value greater than max"});
                return;
            }
        } else if (tempinputs[i] && tempinputs[i].type && tempinputs[i].type==="Enum") {
            if(tempinputs[i].allowedValues.length>0) {
                if(typeof(tempinputs[i].allowedValues[0])!="string") {
                    for(var j=0;j<tempinputs[i].allowedValues.length;j++) {
                        tempinputs[i].allowedValues[j] = tempinputs[i].allowedValues[j].toString();
                    }
                }

                console.log(tempinputs[i].allowedValues.indexOf(csv[i]));

                if(tempinputs[i].allowedValues.indexOf(csv[i])==-1) {
                    console.log(csv[i]);
                }

                if(!(tempinputs[i].allowedValues.indexOf(csv[i])>-1)) {
                    cb({success: false, message:csv[i] + " is not among the allowed values"});
                    return;
                }
            }
        }
    }

    // console.log("Validation Successful");
    cb({success:true, data: convertObjToStr(csv)});
    return;
}

// req.file object
function downloadAllFiles(reqObject,requestId) {

    var inputPath = global.base_path+"/uploads/"+requestId + "/inputs/";

    if(!fs.existsSync(inputPath)) {
        fs.mkdirSync(inputPath);
    }

    return new Promise((resolve,reject) => {
        if(reqObject.files) {
            const fileParams=Object.keys(reqObject.files);
            console.log(fileParams);

            var countFileDownloads=0;

            for(var i=0;i<fileParams.length;i++) {
                if(reqObject.files[fileParams[i]]) {
                    // const filePath=global.base_path+"/uploads/"+ requestId+"_"+reqObject.files[fileParams[i]].name; 
                    const filePath = inputPath + reqObject.files[fileParams[i]].name;
                    reqObject.body[fileParams[i]]=filePath;
                    reqObject.files[fileParams[i]].mv(filePath, (err) => {
                        if(err) {
                            console.log("Error while saving file "+fileParams[i], err);
                            reject("Error while saving file "+fileParams[i]);
                            // return res.status(500).json("Error while saving file "+fileParams[i]);
                        }

                        if(countFileDownloads==fileParams.length-1) resolve();

                        countFileDownloads++;
                    });
                }
            }
        } else {
            resolve();
        }
        
    });
}

module.exports.stop_docker = (req, res, next) => {
    if(global.model_type == 'pythonscore' || global.model_type == 'train'){
        var stopCode = exec(`a=$(pgrep -f app.js) && kill -9 $a`);
        stopCode.stdout.on('data', (data)=>{
            console.log(data);
        });
        stopCode.stdout.on('end', (data)=>{
            console.log(data); 
        });
        stopCode.stderr.on('data', (data)=>{
            console.error(data);
        });
    }
    else{
        socket_handler.exit_sequence(global.unixSocket);
    }
    return res.json(200,{'msg':'Instance stopped'});
};

module.exports.remove_modules = (req, res, next) => {
    if(global.python_service_status) {
        var valueToSend = {"type": "updatedeployment"}; 
        global.python_service_status=false;
        socket_handler.python_socket(global.pythonUnixSocket, valueToSend, (err, data) => {
            global.python_service_status=true;
            if(!err && JSON.parse(data)["msg"] != "error occured while removing modules"){
                res.json(200, {msg:'removed python code modules'});
            }
            else if(JSON.parse(data)["msg"] == "error occured while removing modules"){
                var errObj={};
                errObj.success=false;
                errObj.message=JSON.parse(data)["msg"];
                res.status(500).json(errObj);
            }
            else{
                var errObj={};
                errObj.success=false;
                errObj.message=err;
                res.status(500).json(errObj);
            }
        });
    }
    else {
        var checkstatus = setInterval(()=>{
            if(global.python_service_status){
                clearInterval(checkstatus);
                var valueToSend = {"type": "updatedeployment"}; 
                global.python_service_status=false;
                socket_handler.python_socket(global.pythonUnixSocket, valueToSend, (err, data) => {
                    global.python_service_status=true;
                    if(!err){
                        res.json(200, {msg:'removed python code modules'});
                    }
                    else{
                        var errObj={};
                        errObj.success=false;
                        errObj.message=err;
                        res.json(500, errObj);
                    }
                    
                });
            }
            else{
                console.log("in queue");
            }
        }, 500);
    }
};

function get_presigned_urls(outputFiles) {
    if(outputFiles.length===0) return Promise.resolve();
    return new Promise((resolve,reject) => {
        var fileurl=[];
        console.log(outputFiles);
        for(var i=0;i<outputFiles.length;i++) {
            var options = {
                url: global.s3_upload_presigned_url,
                method: 'POST',
                body: {
                    'type': 'get',
                    'filename': outputFiles[i],
                    'secret_key': global.secret_key
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                json:true
            };

            request(options,(err, response, body) => {
                if(!err) {
                    if(body['urls']) {
                        fileurl.push(body['urls'][0]);
                    // console.log(body['urls'][0]);
                        if(fileurl.length==outputFiles.length) resolve(fileurl);
                    } else reject("Couldn't fetch s3 urls");
                } else reject(err);
            });

        }
    });
}

function checkFilesInDir(dir) {
    files=fs.readdirSync(dir)
    if(files && files.length>0) return true;
    return false;
}

function upload_to_s3(file_name,file_loc,cb) {
    console.log(file_name);
    var options = {
        url: global.s3_upload_presigned_url,
        method: 'POST',
        body: {
            'type': 'put',
            'filename': file_name,
            'secret_key': global.secret_key
        },
        headers: {
            'Content-Type': 'application/json'
        },
        json:true
    };

    request(options,(err, response, body) => {
        if(!err) {
            console.log(body);

            f=fs.readFileSync(file_loc);

            var options2 = {
                url: body['url'],
                method: 'PUT',
                body: f
            };

            request.put(options2,(error,resp,bod) => {
                if(!error) {
                    // bod is empty
                    console.log(resp.client._host);
                    if(resp.statusCode==200) {
                        // console.log(construct_url);
                        return cb(null,file_name,resp.client._host.split(".")[0]);
                    } else {
                        // HODOR : handle it 
                    }
                }
            });
        } else {
            console.log(err);
            console.log(options);
            return cb(err,null,null);
        }
    });
}

function clearFilesInDir(dirPath) {
    fs.readdir(dirPath, (err,files) => {
        if(!err) {
            files.forEach(file => {
                if(fs.lstatSync(dirPath+'/'+file).isDirectory()) {
                    return clearFilesInDir(dirPath+'/'+file);
                } else fs.unlinkSync(dirPath+'/'+file);
            });
            fs.rmdir(dirPath,()=>{});
            return;                
        }
    });
}

function uploadS3DirFiles(outputDir,s3Path, skipupload) {
    return new Promise((resolve,reject) => {
        fs.readdir(outputDir,(err,files) => {
            if(err) {
                console.log("uploads3error", err)
                return reject(err);
            }
            var countFilesUploaded=0;
            var filenames=[];
            console.log("no error1");

            if(files.length==0) return resolve({outputFiles:[]});

            for(var i=0;i<files.length;i++) {
                const filePath = outputDir+'/'+files[i];
                if(skipupload) {
                    filenames.push(s3Path+files[i])
                } else {
                    upload_to_s3(s3Path+files[i],filePath, (err,filename, bucket) => {
                        if(!err) {
                            filenames.push(filename);
                            // get_presigned_url()
                        } 
                        else {
                            console.log("upload_to_s3 err", err)
                            return reject(err);
                        }
                        // console.log(files.length);
                        if(countFilesUploaded===files.length-1) {
                            // console.log(filenames);
                            console.log("no error2")
                            resolve({outputFiles:filenames,bucket:bucket});
                        }
                        console.log("no error3")
                        countFilesUploaded++;
                    });
                }
            }
            if(skipupload) {
                resolve({outputFiles: filenames})
            }
        });
    });
}

module.exports.cachefileurls = async (req, res, next) => {
    try{
        //set a request and response timeout
        global.python_service_status=false;
        console.log("python status in cachefiles", global.python_service_status)

        const bodyKeys = Object.keys(req.body)
        var transaction_id = req.headers['x-transaction-id']
        if(!transaction_id) {
            transaction_id = uuid.v4().split("-")[0]
        }
        res.locals.historyrequestId = transaction_id
        if(bodyKeys && bodyKeys.length > 0) {
            async.forEach(bodyKeys, (key, callback) => {
                value = req.body[key]
                store_regex = /filestore\:\/\/(.*)/g;
                url_regex = /url\:\/\/(.*)/g;
                file_loc = ""
                var match = store_regex.exec(value);
                if(match && match.length > 1) {
                    filestore_loc = match[1];
                    util.download_from_s3(transaction_id, filestore_loc, (err, path) => {
                        req.body[key] = path;
                        res.locals.skipinputupload = true;
                        callback()
                    })
                } else {
                    match = url_regex.exec(value);
                    if(match && match.length > 1) {
                        filestore_loc = match[1]
                        util.download_from_url(transaction_id, filestore_loc, (err, path) => {
                            req.body[key] = path
                            res.locals.skipinputupload = true;
                            callback()
                        })
                    } else {
                        callback()
                    }
                }
            }, (err) => {
                //all keys in body iterated. Call next middleware
                next()
            })
        } else {
            next()
        }
    }
    catch(err){
        console.log(err)
        global.python_service_status=true;
        var dateFormat = Number(new Date());
        var modelHistory = {
            timestamp: new Date(dateFormat),
            inputFiles: [],
            company: global.companyid,
            model: global.servingid,
            status: 'Failed',
            output: `Something went wrong. Please try again.`,
            error: `failed while caching files ${err}`
        };
        var options = {
            url: `${global.cldz_base_url}/api/servinghistory`,
            method: 'POST',
            body: JSON.stringify(modelHistory),
            headers: {
            'Content-Type': 'application/json'
            }
        };
        // saveHistory(options);
        if(global.lambda_deployment) await saveHistoryPromise(options);
        else saveHistory(options);
        return res.json(500,{"err":"Error caching files"});
    } 
}

module.exports.train_notebook = async (req,res,next) => {

    var transactionIdDir=global.training_output_path+res.locals.historyrequestId;

    const grabInputs = Object.assign({},req.body);

    console.log("/train_notebook inputs " + JSON.stringify(grabInputs));

    req.body.outputFilePath=transactionIdDir+'/outputs/';
    var inputDir=transactionIdDir+'/inputs/';

    if(!fs.existsSync(global.training_output_path)) {
        fs.mkdirSync(global.training_output_path);
    }

    if(!fs.existsSync(global.training_output_path+res.locals.historyrequestId)) {
        fs.mkdirSync(global.training_output_path+res.locals.historyrequestId);
    }

    if(!fs.existsSync(req.body.outputFilePath)) {
        fs.mkdirSync(req.body.outputFilePath);
    }

    var callbackurl = res.locals.callbackurl;

    var outputfilepath = req.body.outputFilePath;

    downloadAllFiles(req,res.locals.historyrequestId).then(() => {
        var valueToSend = {"type":"train", "data":req.body};
        console.log(valueToSend);
       
        global.python_service_status=false;
        console.log("before socket", res.locals.historyrequestId)
        console.log("before req out body filepath", outputfilepath);
        socket_handler.python_socket_easy(global.pythonUnixSocket, valueToSend, async (err, data) => {
            // global.python_service_status=true;
            var reqid = res.locals.historyrequestId;
            console.log("after socket", reqid)
            console.log("req out body filepath", outputfilepath);
            console.log(err);
            var getData=null;

            if(typeof(data)=="string") {
                try {
                    getData=JSON.parse(data);
                } catch(err) {
                    global.python_service_status=true;
                    console.log(`Error parsing output data ${err}`);
                    var dateFormat = Number(new Date());
                    const modelHistory = {
                        requestid: reqid,
                        timestamp: new Date(dateFormat),
                        output: `Error parsing output data ${err} - data ${data}`,
                        input: grabInputs,
                        inputFiles: [], //TODO: we should abe able to populate input files here . 
                        company: global.companyid,
                        model: global.servingid,
                        status: 'Failure'
                    };
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory/updatehistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    // saveHistory(options);
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    clearFilesInDir(transactionIdDir);
                    global.python_service_status=true;

                    if(callbackurl) {

                        var options = {
                            url: callbackurl,
                            method: 'POST',
                            body: JSON.stringify({"err":"Error parsing output from notebook"}),
                            headers: {
                            'Content-Type': 'application/json'
                            }
                        };

                        await saveHistoryPromise(options);
                    } else return res.json(500,{"err":"Error parsing output from notebook"})

                    // return res.json(500,{"err":"Error parsing output from notebook"})
                }
                
            } else getData=data;
            console.log(getData);
            
            // gatData = getData[0];
            // if(!err && getData['err']===undefined) {
            s3Path=global.companyid+"/"+global.servingprojectid+"/"+reqid+"/outputs/";
            var outputLoc=outputfilepath;
            console.log("outputLoc",outputLoc);
            if(!err && getData['err']===undefined) {
                var requeststatus = 'Success';
                var requestoutput = getData["output"];
            }
            else if(getData && getData['err']){
                var requeststatus = 'Failure';
                var requestoutput = getData['err'] || err;
            }
           
            uploadS3DirFiles(outputLoc,s3Path, false).then((resp) => {
                console.log(getData);
                if(getData["output"]) {
                    resp.output=Buffer.from(getData["output"], 'base64').toString();
                }
                else if(getData && getData['err']){
                    resp.output=Buffer.from(getData['err'], 'base64').toString();
                }
                else if(err){
                    resp.output=err;
                }
                
                get_presigned_urls(resp.outputFiles).then((urls) => {
                    // console.log(`Here ${urls}`);
                    resp.s3urls=urls;
                    // res.status(200).json(resp);
                    uploadS3DirFiles(inputDir,global.companyid+"/"+global.servingprojectid+"/"+reqid+"/inputs/", res.locals.skipinputupload)
                        .then(async (inputRes) => {
                            // resp.inputFiles = inputRes.outputFiles;
                            // res.json(200,resp);
                            var dateFormat = Number(new Date());
                            console.log(inputRes);
                            var modelHistory = {
                                requestid: reqid,
                                timestamp: new Date(dateFormat),
                                output: requestoutput,
                                outputFiles:resp.outputFiles,
                                bucket: resp.bucket,
                                input: grabInputs,
                                inputFiles: inputRes.outputFiles,
                                company: global.companyid,
                                model: global.servingid,
                                status: requeststatus
                            };
                            var options = {
                                url: `${global.cldz_base_url}/api/servinghistory/updatehistory`,
                                method: 'POST',
                                body: JSON.stringify(modelHistory),
                                headers: {
                                'Content-Type': 'application/json'
                                }
                            };
                            // saveHistory(options);
                            if(global.lambda_deployment) await saveHistoryPromise(options);
                            else saveHistory(options);
                            clearFilesInDir(transactionIdDir);
                            global.python_service_status=true;

                            if(callbackurl) {

                                var options = {
                                    url: callbackurl,
                                    method: 'POST',
                                    body: JSON.stringify(resp),
                                    headers: {
                                    'Content-Type': 'application/json'
                                    }
                                };
        
                                await saveHistoryPromise(options);
                            } else return res.status(200).json(resp);
                            // return res.status(200).json(resp);
                        })
                        .catch(async err => {
                            console.log(err);
                            var dateFormat = Number(new Date());
                            var modelHistory = {
                                requestid: reqid,
                                timestamp: new Date(dateFormat),
                                output: requestoutput,
                                outputFiles:resp.outputFiles,
                                bucket: resp.bucket,
                                err: "Failed to upload input files to s3",
                                inputFiles: [],
                                company: global.companyid,
                                model: global.servingid,
                                status: requeststatus
                            };
                            var options = {
                                url: `${global.cldz_base_url}/api/servinghistory/updatehistory`,
                                method: 'POST',
                                body: JSON.stringify(modelHistory),
                                headers: {
                                'Content-Type': 'application/json'
                                }
                            };

                            if(global.lambda_deployment) await saveHistoryPromise(options);
                            else saveHistory(options);
                            clearFilesInDir(transactionIdDir);
                            global.python_service_status=true;

                            if(callbackurl) {

                                var options = {
                                    url: callbackurl,
                                    method: 'POST',
                                    body: JSON.stringify({"err":"Failed to upload input files to s3"}),
                                    headers: {
                                    'Content-Type': 'application/json'
                                    }
                                };
        
                                await saveHistoryPromise(options);
                            } else return res.json(500,{"err":"Failed to upload input files to s3"});
                            // return res.json(500,{"err":"Failed to upload input files to s3"});
                        });
                    
                }).catch(async err => {
                    console.log(`Error getting presigned url from s3 ${err}`);
                    // your files will be available in bucket ${resp.bucket} under directory ${res.locals.requestid}
                    resp.s3urls=`Error fetching s3 file access urls, files can still be downloaded from Clouderizer Analytics section`;
                    // res.json(200, resp);
                    var dateFormat = Number(new Date());
                    var modelHistory = {
                        requestid: reqid,
                        timestamp: new Date(dateFormat),
                        output: requestoutput,
                        outputFiles:resp.outputFiles,
                        bucket: resp.bucket,
                        inputFiles: [], //TODO: we should abe able to populate input files here . 
                        error: "Error getting presigned url",
                        company: global.companyid,
                        model: global.servingid,
                        status: requeststatus
                    };
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory/updatehistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    // saveHistory(options);
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    clearFilesInDir(transactionIdDir);
                    global.python_service_status=true;

                    if(callbackurl) {

                        var options = {
                            url: callbackurl,
                            method: 'POST',
                            body: JSON.stringify({"err":"Error getting urls from s3. Folder may still be present in s3"}),
                            headers: {
                            'Content-Type': 'application/json'
                            }
                        };

                        await saveHistoryPromise(options);
                    } else return res.json(500,{"err":"Error getting urls from s3. Folder may still be present in s3"});
                    // return res.json(500,{"err":"Error getting urls from s3. Folder may still be present in s3"});
                });
                // clearFilesInDir(req.body.outputFilePath);
            }).catch(async err => {
                console.log(`Error uploading files to s3 ${err}`);
                var dateFormat = Number(new Date());
                var modelHistory = {
                    requestid: reqid,
                    timestamp: new Date(dateFormat),
                    output: requestoutput,
                    error: `Failed to upload output files to s3 ${err}`,
                    inputFiles: [], //TODO: we should abe able to populate input files here . 
                    company: global.companyid,
                    model: global.servingid,
                    status: requeststatus
                };
                var options = {
                    url: `${global.cldz_base_url}/api/servinghistory/updatehistory`,
                    method: 'POST',
                    body: JSON.stringify(modelHistory),
                    headers: {
                    'Content-Type': 'application/json'
                    }
                };
                // saveHistory(options); 
                if(global.lambda_deployment) await saveHistoryPromise(options);
                else saveHistory(options);
                clearFilesInDir(transactionIdDir);
                global.python_service_status=true;

                if(callbackurl) {

                    var options = {
                        url: callbackurl,
                        method: 'POST',
                        body: JSON.stringify({"err":"Error uploading model output files to s3"}),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };

                    await saveHistoryPromise(options);
                } else return res.json(500,{"err":"Error uploading model output files to s3"});
                // return res.json(500,{"err":"Error uploading model output files to s3"});
            });
        });
    }).catch(async err => {
        console.log("Err with downloadAllFiles", err);
        var dateFormat = Number(new Date());
        var modelHistory = {
            requestid: res.locals.historyrequestId,
            timestamp: new Date(dateFormat),
            output: err,
            inputFiles: [], //TODO: we should abe able to populate input files here . 
            err: "Error processing downloadAllFiles",
            company: global.companyid,
            model: global.servingid,
            status: 'Failure'
        };
        var options = {
            url: `${global.cldz_base_url}/api/servinghistory/updatehistory`,
            method: 'POST',
            body: JSON.stringify(modelHistory),
            headers: {
            'Content-Type': 'application/json'
            }
        };
        // saveHistory(options);
        if(global.lambda_deployment) await saveHistoryPromise(options);
        else saveHistory(options);
        clearFilesInDir(transactionIdDir);
        global.python_service_status=true;

        if(callbackurl) {

            var options = {
                url: callbackurl,
                method: 'POST',
                body: JSON.stringify({"err":"Error processing the uploaded files"}),
                headers: {
                'Content-Type': 'application/json'
                }
            };

            await saveHistoryPromise(options);
        } else return res.status(500).json({"err":"Error processing the uploaded files"});
        // return res.status(500).json({"err":"Error processing the uploaded files"});
    })
};

module.exports.project_details = (req, res, next) => {
    fs.readFile(path.join(__dirname, '..', 'function', 'projectConfig.json'), 'utf-8', (err, data) => {
        if (err || !data) {
            return res.json(500,{msg:"something wrong with details json file "+err});
        }
        else if(data){
            // console.log("project details");
            // console.log(data);
            let detailsjson = JSON.parse(data);
            // console.log(detailsjson);
            return res.json(200, detailsjson);
        }
    });
};

module.exports.version_check = (req, res, next) => {
    fs.readFile('/tmp/versionCheck.json', 'utf-8', (err, data) => {
        if (err || !data) {
            console.log(err);
            return res.json(500,{msg:"Could not fetch build version"});
        }
        else if(data){
            console.log(data);
            let versionjson = JSON.parse(data)
            // console.log(versionjson);
            return res.json(200, versionjson);
        }
    });
};

module.exports.update_version = (req, res, next) => {
    fs.writeFile("/tmp/versionCheck.json", `{"hash": "${uuid.v4()}"}`, 'utf-8', (err, data) => {
        if (err || !data) {
            console.log(err);
            return res.json(500,{msg:"Could not write version"});
        }
        else if(data){
            // console.log(data);
            // let versionjson = JSON.parse(data)
            // console.log(versionjson);
            return res.json(200, data);
        }
    });
};

module.exports.update_deployment = (req, res, next) => {
    const showcaseCode = exec(`chmod +x /showcase_files/init.sh && bash /showcase_files/init.sh ${servingid} ${cldz_base_url} ${servingprojectid}`);
    // const showcaseCode = exec('bash /showcase_files/init.sh');
    showcaseCode.stdout.on('data', (data)=>{
        console.log(data);
    });
    showcaseCode.stdout.on('end', (data)=>{
        console.log(data); 
    });
    showcaseCode.stderr.on('data', (data)=>{
        console.error(data);
    });
    return res.json(200, {msg:'success'});
};

module.exports.queue_handler = (req, res, next) => {
    console.log("queue handler");
    console.log(req.headers);

    if(req.headers['x-callback-url'] && global.lambda_deployment) {
        res.locals.callbackurl = req.headers['x-callback-url'];
    }

    if(!req.body.requestid){
        res.locals.requestid = uuid.v4().split('-')[0];
    }
    else{
        res.locals.requestid = req.body.requestid;
    }
    res.locals.inputItems = [];  
    res.locals.minputItems = []; 
    if(req.headers["x-browser"]){
        console.log("UI");
        res.locals.requestfrom = 'UI'
    }
    else{
        res.locals.requestfrom = 'API'
    }

    if(!global.lambda_deployment) {
        res.setTimeout(60*60*1000, () => {
            let err = new Error('Service Timeout');
            err.status = 503;
            var dateFormat = Number(new Date()); 
            var modelHistory = {
                requestid: req.headers['x-transaction-id'] || res.locals.requestid,
                timestamp: new Date(dateFormat),
                inputFiles: [],
                company: global.companyid,
                model: global.servingid,
                status: 'Failure',
                output: Buffer('Service timeout').toString('base64')
            };
            var options = {
                url: `${global.cldz_base_url}/api/servinghistory`,
                method: 'POST',
                body: JSON.stringify(modelHistory),
                headers: {
                'Content-Type': 'application/json'
                }
            };
            saveHistory(options);
            return next(err);
        });
        req.setTimeout(60*60*1000, () => {
            let err = new Error('Request Timeout');
            err.status = 408;
            var dateFormat = Number(new Date());
            var modelHistory = {
                requestid: req.headers['x-transaction-id'] || res.locals.requestid,
                timestamp: new Date(dateFormat),
                inputFiles: [],
                company: global.companyid,
                model: global.servingid,
                status: 'Failure',
                output: Buffer('Request timeout').toString('base64')
            };
            var options = {
                url: `${global.cldz_base_url}/api/servinghistory`,
                method: 'POST',
                body: JSON.stringify(modelHistory),
                headers: {
                'Content-Type': 'application/json'
                }
            };
            saveHistory(options);
            return next(err);
        });
    }

    if(global.model_type=="h2o" || global.model_type=="dai" || global.model_type=="pmml4s" || global.model_type=="jpmml") {
        // if(global.java_model_loading) {
        //     return res.status(500).json({success:false,msg:"Model is still loading"});
        // }
        // if(global.java_client_status) next();
        // else {
        //     var checkstatus = setInterval(()=>{
        //         if(global.java_client_status){
        //             clearInterval(checkstatus); 
        //             next();
        //         }
        //         else{
        //             console.log("in queue");
        //         }
        //     }, 500);
        // }

        if(global.java_client_status && !global.java_model_loading) next();
        else {
            var checkstatus = setInterval(()=>{
                if(global.java_client_status && !global.java_model_loading){
                    clearInterval(checkstatus); 
                    next();
                }
                else{
                    console.log("in queue");
                }
            }, 500);
            // setTimeout(() => {
            //     if(global.java_client_status) next();
            // },500);
        }
    }
    else if(global.model_type=="pythonscore" || global.model_type=="train") {
        // console.log("python status", global.python_service_status)
        // if(global.python_service_status) next();
        // else {
        //     var checkstatus = setInterval(()=>{
        //         if(global.python_service_status){
        //             clearInterval(checkstatus); 
        //             next();
        //         }
        //         else{
        //             console.log("in queue");
        //         }
        //     }, 500);
        // }

        if(global.python_service_status && global.pythonUnixSocket) next();
        else {
            var checkstatus = setInterval(()=>{
                if(global.python_service_status && global.pythonUnixSocket){
                    clearInterval(checkstatus); 
                    next();
                }
                else{
                    console.log("in queue");
                }
            }, 500);
        }
    }
};

module.exports.datatype_handler = async (req,res,next) => {
    // convert everything to a comma separated string
    console.log("datatype handler")
    var tempinput = [];
    if(global.rawInputAttr && global.rawInputAttr.length > 0) {
        tempinput = global.rawInputAttr;
    }
    else if(global.validationInputAttr && global.validationInputAttr.length > 0) {
        tempinput = global.validationInputAttr;
    }

    //if(req.body.csv && req.body.csv != '' || (req.files && req.files.multicsv)) {
    if(req.body.csv && req.body.csv != '') {
        // if(req.body.csv){
        res.locals.csv = req.body.csv;
        var inputData = res.locals.csv.replace(/\\n/g, '\n').split(",");
        for(var i=0; i< tempinput.length; i++) {
            res.locals.inputItems.push({name: tempinput[i].name, value: inputData[i]})
        } 
        // }
        next();
    }
    //else if(req.files && !req.files.multicsv){
    else if(req.files && Object.keys(req.files).length > 0){
        console.log("files present")
        next()
    }
    else {
        var weNeedStr='';
        res.locals.inputItems = [];
        
        if(tempinput && tempinput.length > 0){
            for(var i=0; i< tempinput.length; i++) {
                weNeedStr+=req.body[tempinput[i].name]+",";
                res.locals.inputItems.push({name: tempinput[i].name, value: req.body[tempinput[i].name]})
            }
        }
        //handle when no input attrs configured
        else{
            try{
                for (i in Object.keys(req.body)){
                    weNeedStr+=req.body[i]+","
                    res.locals.inputItems.push({name: i, value: req.body[i]})
                }
            }
            catch(err){
                var errormsg = "Issue with input format. If no input attributes are configured, please configure as the documentation or provide a key value input";
                var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                var dateFormat = Number(new Date());
                var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                var options = {
                    url: `${global.cldz_base_url}/api/servinghistory`,
                    method: 'POST',
                    body: JSON.stringify(modelHistory),
                    headers: {
                    'Content-Type': 'application/json'
                    }
                };
                // saveHistory(options);
                if(global.lambda_deployment) await saveHistoryPromise(options);
                else saveHistory(options);
                var errObj={};
                errObj.success=false;
                errObj.message=errormsg;
                return res.status(500).json(errObj);
                // return res.status(500).json({msg:"Issue with input format. If no input attributes are configured, please configure as the documentation or provide a key value input"});
            }
        }
        
        console.log(weNeedStr);
        
        //removing last comma
        res.locals.csv=weNeedStr.slice(0,-1);
        //req.body.csv=weNeedStr.slice(0,-1);
        next();
    }
};

module.exports.preprocessvalidator = async (req, res, next) => {
    /*
        1. output format: res.locals.file_array = [{"success":true,"data":preprocessinput}]  
    */
    if(global.preprocessEnabled){
        var inputPath = global.base_path+"/uploads/inputs/"+res.locals.requestid;
        var outputPath = global.base_path+"/uploads/outputs/"+res.locals.requestid;

        if(!fs.existsSync(global.training_output_path)) {
            fs.mkdirSync(global.training_output_path);
        }

        if(!fs.existsSync(global.training_output_path+"outputs")) {
            fs.mkdirSync(global.training_output_path+"outputs");
        }

        if(!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath);
        }

        if(!fs.existsSync(global.training_output_path+"inputs")) {
            fs.mkdirSync(global.training_output_path+"inputs");
        }

        if(!fs.existsSync(inputPath)) {
            fs.mkdirSync(inputPath);
        }

        //if((!global.rawInputAttr || global.rawInputAttr.length==0) && (!req.files || req.files.multicsv)) {
        if((!global.rawInputAttr || global.rawInputAttr.length==0) && !(req.files && Object.keys(req.files).length > 0)) {    
            console.log("Passing data without validation");
            csv=null;
            if(req.body && req.body.csv){
                res.locals.csv = res.locals.csv.replace(/\\n/g, '\n');
                csv = res.locals.csv;
                var preprocessinput= csv.split(",");
                res.locals.file_array=[{"success":true,"data":preprocessinput}]; //preprocessinput as array
            }
            else{
                var preprocessinput = req.body;
                res.locals.file_array=[{"success":true,"data":preprocessinput}]; //preprocessinput as key values
            }
            next();       
        }
    
        var cookies = parseCookies(req);
        console.log("Cookies",cookies);
        
        res.locals.serving_history_storage=true;
        if(cookies["refreshrate"]=="89345123765") {
            res.locals.serving_history_storage = false;
        }
        console.log("req body csv preprocess", res.locals.csv)
    
        if(res.locals.csv && global.rawInputAttr && global.rawInputAttr.length>0) {
            var csv = "";
            res.locals.csv = res.locals.csv.replace(/\\n/g, '\n');
            csv = res.locals.csv;
            csv = csv.split(",");
            console.log(csv.length);
            console.log(global.rawInputAttr);
            if(csv.length!=global.rawInputAttr.length) {
                var errormsg = "preprocessing input validation error: Number of elements don't match with configured";
                var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                var dateFormat = Number(new Date());
                var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                var options = {
                    url: `${global.cldz_base_url}/api/servinghistory`,
                    method: 'POST',
                    body: JSON.stringify(modelHistory),
                    headers: {
                    'Content-Type': 'application/json'
                    }
                };
                // saveHistory(options);
                if(global.lambda_deployment) await saveHistoryPromise(options);
                else saveHistory(options);
                var errObj={};
                errObj.success=false;
                errObj.message=errormsg;
                return res.status(500).json(errObj);
                // return res.status(500).json({msg:"Number of elements don't match in preprocessor"});
            }
            validateRow('preprocess', csv, async (result) => {
                if(result["success"]){
                    var preprocessinput = {};
                    for(let i=0;i<global.validationInputAttr.length;i++){
                        console.log("output image", global.validationInputAttr[i].name)
                        preprocessinput[global.validationInputAttr[i].name] = global.base_path+"/uploads/outputs/" + res.locals.requestid+"/"+global.validationInputAttr[i].name+".png"
                    }
                    for(let i=0;i<global.rawInputAttr.length;i++){
                        preprocessinput[global.rawInputAttr[i].name] = csv[i]
                    }
                    res.locals.file_array=[{"success":true,"data":preprocessinput}]               
                    next();
                } else {
                    var errormsg = "preprocessing input validation error: "+JSON.stringify(result);
                    var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                    var dateFormat = Number(new Date());
                    var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    // saveHistory(options);
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    var errObj={};
                    errObj.success=false;
                    errObj.message=errormsg;
                    return res.status(500).json(errObj);
                    // console.log("Danger!");
                    // return res.status(500).json(result);
                }
            });
        }
    
        //if(req.files && !req.files.multicsv){
        if(req.files && Object.keys(req.files).length > 0){
            var preprocessinput = {};
            
            for(let i=0;i<global.validationInputAttr.length;i++){
                console.log("output image", global.validationInputAttr[i].name)
                preprocessinput[global.validationInputAttr[i].name] = global.base_path+"/uploads/outputs/" + res.locals.requestid+"/"+global.validationInputAttr[i].name+".png"
            }

            // Also handle when no inputs configured
            var filekeys = Object.keys(req.files);
            for(var i=0; i<filekeys.length; i++) {
                const filePath = inputPath + "/" + filekeys[i];
                await req.files[filekeys[i]].mv(filePath)
                console.log("after file move")
                preprocessinput[filekeys[i]] = global.base_path+"/uploads/inputs/" + res.locals.requestid+"/"+filekeys[i]
            }
    
            if(req.body){
                var bodykeys = Object.keys(req.body);
                for(var i=0; i<bodykeys.length; i++) {
                    preprocessinput[bodykeys[i]] = req.body[bodykeys[i]]
                }
            }
    
            console.log("after for loop")
            res.locals.file_array=[{"success":true,"data":preprocessinput}];
            next();
        }
    }
    else{
        next();
    }
};

module.exports.preprocessor = (req, res, next) => {
    res.locals.start_time=Date.now();
    console.log("ST,",res.locals.start_time);
    if(global.preprocessEnabled=="false" || !global.preprocessEnabled) {
        next();
    } else {
        /**
         * We will have 2 types:
         * 1. Preprocessing
         * 2. ONNX model with preprocessing & postprocessing enablers
        */
        console.log("preprocessing enabled")
        console.log("before preprocess code", res.locals.file_array)
        if(res.locals.file_array) {
            var valueToSend = {"type": "preprocess", "data": res.locals.file_array};
            global.python_service_status=false;
            socket_handler.python_socket(global.pythonUnixSocket, valueToSend, async (err, preprocessedData) => {
                global.python_service_status=true;
                if(!err && preprocessedData && preprocessedData.length > 0) {
                    preprocessedData=JSON.parse(preprocessedData);
                    console.log("preprocessedData", preprocessedData)
                    if(preprocessedData[0].success == 'false'){
                        var errormsg = "preprocessing error: "+ Buffer.from(preprocessedData[0].message, 'base64').toString();
                        var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                        var dateFormat = Number(new Date());
                        var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                        var options = {
                            url: `${global.cldz_base_url}/api/servinghistory`,
                            method: 'POST',
                            body: JSON.stringify(modelHistory),
                            headers: {
                            'Content-Type': 'application/json'
                            }
                        };
                        // saveHistory(options);
                        if(global.lambda_deployment) await saveHistoryPromise(options);
                        else saveHistory(options);
                        var errObj={};
                        errObj.success="false";
                        errObj.stack_trace=errormsg;
                        return res.status(500).json(errObj);
                    }
                    else{
                        try{
                            preprocessedData[0].data = Buffer.from(preprocessedData[0].data, 'base64').toString()
                        }
                        catch(err){
                            preprocessedData[0].data = preprocessedData[0].data
                        }
                        console.log(preprocessedData);
                        try{
                            if(typeof(preprocessedData[0].data) === 'string'){
                                console.log("string");
                                preprocessedData[0].data = eval(preprocessedData[0].data);
                            }
                        }
                        catch(err){
                            var errormsg = "incorrect preprocessing output format, please follow clouderizer docs to format it properly.";
                            var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                            var dateFormat = Number(new Date());
                            var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                            var options = {
                                url: `${global.cldz_base_url}/api/servinghistory`,
                                method: 'POST',
                                body: JSON.stringify(modelHistory),
                                headers: {
                                'Content-Type': 'application/json'
                                }
                            };
                            // saveHistory(options);
                            if(global.lambda_deployment) await saveHistoryPromise(options);
                            else saveHistory(options);
                            var errObj={};
                            errObj.success=false;
                            errObj.message=errormsg;
                            return res.status(500).json(errObj);
                        }
                        
                        // single scoring
                        if(preprocessedData[0]['data']==global.error_map["SMO"]) {
                            var errormsg = "preprocessing error: "+preprocessedData[0]['data'];
                            var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                            var dateFormat = Number(new Date());
                            var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                            var options = {
                                url: `${global.cldz_base_url}/api/servinghistory`,
                                method: 'POST',
                                body: JSON.stringify(modelHistory),
                                headers: {
                                'Content-Type': 'application/json'
                                }
                            };
                            // saveHistory(options);
                            if(global.lambda_deployment) await saveHistoryPromise(options);
                            else saveHistory(options);
                            var errObj={};
                            errObj.success=false;
                            errObj.message=errormsg;
                            return res.status(500).json(errObj);
                        }
                    }
                    res.locals.file_array=preprocessedData;
                    console.log(res.locals.file_array);
                    console.log("Passed preprocessing step",res.locals.file_array);
                    next();
                } else {
                    var errormsg = "preprocessing error: "+JSON.stringify(err);
                    var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                    var dateFormat = Number(new Date());
                    var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    // saveHistory(options);
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    var errObj={};
                    errObj.success=false;
                    errObj.message=errormsg;
                    return res.status(500).json(errObj);
                }
            });
        }
    }
};

module.exports.validator = async (req, res, next) => {
    // input validation logic
    // TODO: Angular FE is already performing validation, skip validation if Referrer is Angular
    var inputPath = global.base_path+"/uploads/inputs/"+res.locals.requestid;
    var outputPath = global.base_path+"/uploads/outputs/"+res.locals.requestid;
    if(!fs.existsSync(global.training_output_path)) {
        fs.mkdirSync(global.training_output_path);
    }
    if(!fs.existsSync(global.training_output_path+"outputs")) {
        fs.mkdirSync(global.training_output_path+"outputs");
    }
    if(!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }

    if(!fs.existsSync(global.training_output_path+"inputs")) {
        fs.mkdirSync(global.training_output_path+"inputs");
    }

    if(!fs.existsSync(inputPath)) {
        fs.mkdirSync(inputPath);
    }
    //When no input output attributes configured
    //if((!global.validationInputAttr || global.validationInputAttr.length==0) && !global.preprocessEnabled && (!req.files || req.files.multicsv)) {
    if((!global.validationInputAttr || global.validationInputAttr.length==0) && !global.preprocessEnabled && !(req.files && Object.keys(req.files).length > 0)) {
        
        if(global.model_type=="pythonscore") {
            console.log("Passing data without validation");
            csv=null;
            if(res.locals.csv) {
                res.locals.csv = res.locals.csv.replace(/\\n/g, '\n');
                csv = res.locals.csv;
                csv = csv.split(",");
            } 
            // else if((req.files && req.files.multicsv) || (res.locals.file_array)) {
            //     return res.status(500).json({msg:"File scoring is currently not supported for this model"});
            // }
            if(!csv) console.log("Some error might occur, csv null");
            res.locals.file_array=[{"success":true,"data":csv}];           
            next();
        } 
        else {
            next();
        }
    }

    var cookies = parseCookies(req);
    console.log("Cookies",cookies);
    
    res.locals.serving_history_storage=true;
    if(cookies["refreshrate"]=="89345123765") {
        res.locals.serving_history_storage = false;
    }
    console.log("req body csv", res.locals.csv)

    if(res.locals.csv && !global.preprocessEnabled && global.validationInputAttr.length>0) {
        var csv = "";
        res.locals.csv = res.locals.csv.replace(/\\n/g, '\n');
        csv = res.locals.csv;
        csv = csv.split(",");
        console.log(csv.length);
        console.log(global.validationInputAttr);
        if(csv.length!=global.validationInputAttr.length) {
            var errormsg = "Prediction inputs validation failed: Number of inputs don't match with configured";
            var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
            var dateFormat = Number(new Date());
            var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
            var options = {
                url: `${global.cldz_base_url}/api/servinghistory`,
                method: 'POST',
                body: JSON.stringify(modelHistory),
                headers: {
                'Content-Type': 'application/json'
                }
            };
            // saveHistory(options);
            if(global.lambda_deployment) await saveHistoryPromise(options);
            else saveHistory(options);
            var errObj={};
            errObj.success=false;
            errObj.message=errormsg;
            return res.status(500).json(errObj);
            // res.status(500).json({msg:"Number of elements don't match in prediction"});
            // return;
        }
        validateRow('prediction', csv, async (result) => {
            if(result["success"]){
                if(global.model_type=="pythonscore"){
                    var predictioninput = {};
                    var outfilesobj = {};
                    for(let i=0;i<global.validationOutputAttr.length;i++){
                        console.log("output image", global.validationOutputAttr[i].name)
                        outfilesobj["name"] = global.validationOutputAttr[i].name;
                        outfilesobj["path"] = global.companyid+"/"+global.servingprojectid+"/"+res.locals.requestid+"/outputs/"+global.validationOutputAttr[i].name+".png"
                        res.locals.resoutput = [];
                        res.locals.resoutput.push(outfilesobj)
                        predictioninput[global.validationOutputAttr[i].name] = global.base_path+"/uploads/outputs/" + res.locals.requestid+"/"+global.validationOutputAttr[i].name+".png"
                    } 
                    for(let i=0;i<global.validationInputAttr.length;i++){
                        predictioninput[global.validationInputAttr[i].name] = csv[i]
                    }
                    
                    res.locals.file_array=[{"success":true,"data":predictioninput}]               
                }
                else{
                    res.locals.file_array=[{"success":true,"data":csv}]        
                }
                next()
            } else {
                var errormsg = "Prediction inputs validation failed: "+JSON.stringify(result);
                var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                var dateFormat = Number(new Date());
                var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                var options = {
                    url: `${global.cldz_base_url}/api/servinghistory`,
                    method: 'POST',
                    body: JSON.stringify(modelHistory),
                    headers: {
                    'Content-Type': 'application/json'
                    }
                };
                // saveHistory(options);
                if(global.lambda_deployment) await saveHistoryPromise(options);
                else saveHistory(options);
                var errObj={};
                errObj.success=false;
                errObj.message=errormsg;
                return res.status(500).json(errObj);
            }
        });
    } 
    
    //if(req.files && !req.files.multicsv){
    if(req.files && Object.keys(req.files).length > 0 && !global.preprocessEnabled){
        var predictioninput = {};
        var outfilesobj = {};

        // Also handle when no inputs configured
        var filekeys = Object.keys(req.files);
        for(var i=0; i<filekeys.length; i++) {
            const filePath = inputPath + "/" + filekeys[i];
            await req.files[filekeys[i]].mv(filePath)
            console.log("after file move")
            predictioninput[filekeys[i]] = global.base_path+"/uploads/inputs/" + res.locals.requestid+"/"+filekeys[i]
        }

        console.log(req.body);
        if(req.body){
            var bodykeys = Object.keys(req.body);
            for(var i=0; i<bodykeys.length; i++) {
                if(!parseInt(bodykeys[i])) predictioninput[bodykeys[i]] = req.body[bodykeys[i]]
            }
        }

        for(let i=0;i<global.validationOutputAttr.length;i++){
            console.log("output image", global.validationOutputAttr[i].name)
            outfilesobj["name"] = global.validationOutputAttr[i].name;
            outfilesobj["path"] = global.companyid+"/"+global.servingprojectid+"/"+res.locals.requestid+"/outputs/"+global.validationOutputAttr[i].name+".png"
            res.locals.resoutput = [];
            res.locals.resoutput.push(outfilesobj)
            predictioninput[global.validationOutputAttr[i].name] = global.base_path+"/uploads/outputs/" + res.locals.requestid+"/"+global.validationOutputAttr[i].name+".png"
        }

        console.log("after for loop")
        res.locals.file_array=[{"success":true,"data":predictioninput}];
        next();
    }

    if(res.locals.file_array && global.preprocessEnabled && global.validationInputAttr.length>0) {    
        console.log(res.locals.file_array);
        try{
            for(var i=0;i<res.locals.file_array.length;i++) {
                console.log(res.locals.file_array[i]);
                var data = [];
                for(let j=0;j<global.validationInputAttr.length;j++){
                    data.push(res.locals.file_array[i]["data"][0]["data"][global.validationInputAttr[j].name])
                }
                //validateRow(res.locals.file_array[i]["data"], (result) => {
                validateRow('prediction', data, async (result) => {
                    console.log(result);
                    if(result["success"]){
                        res.locals.file_array[i] = {"success":true,"data":result["data"].split(",")};
                        var tempInput = [];
                        for(var j=0; j< global.validationInputAttr.length; j++) {
                            tempInput.push({name: global.validationInputAttr[i].name, value: result["data"].split(",")[j]})
                        }
                        res.locals.minputItems.push(tempInput);
    
                        if(global.model_type=="pythonscore"){
                            var predictioninput = {}
                            var outfilesobj = {};
                            for(let i=0;i<global.validationOutputAttr.length;i++){
                                console.log("output image", global.validationOutputAttr[i].name)
                                outfilesobj["name"] = global.validationOutputAttr[i].name;
                                outfilesobj["path"] = global.companyid+"/"+global.servingprojectid+"/"+res.locals.requestid+"/outputs/"+global.validationOutputAttr[i].name+".png"
                                res.locals.resoutput = [];
                                res.locals.resoutput.push(outfilesobj)
                                predictioninput[global.validationOutputAttr[i].name] = global.base_path+"/uploads/outputs/" + res.locals.requestid+"/"+global.validationOutputAttr[i].name+".png"
                            }
                            for(let i=0;i<global.validationInputAttr.length;i++){
                                predictioninput[global.validationInputAttr[i].name] = csv[i]
                            }
                            res.locals.file_array=[{"success":true,"data":predictioninput}]               
                        }
                        else{
                            res.locals.file_array=[{"success":true,"data":data}]        
                        }
                        console.log("end validator")
                    } 
                    else {
                        var errormsg = "Prediction inputs validation failed. Please cross check your inputs against the configuration";
                        var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                        var dateFormat = Number(new Date());
                        var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                        var options = {
                            url: `${global.cldz_base_url}/api/servinghistory`,
                            method: 'POST',
                            body: JSON.stringify(modelHistory),
                            headers: {
                            'Content-Type': 'application/json'
                            }
                        };
                        // saveHistory(options);
                        if(global.lambda_deployment) await saveHistoryPromise(options);
                        else saveHistory(options);
                        var errObj={};
                        errObj.success=false;
                        errObj.message=errormsg;
                        return res.status(500).json(errObj);
                        // res.locals.file_array[i] = {"success":result["success"],"data":result["message"]}; 
                    }
                    if(i==res.locals.file_array.length-1) console.log("done validator");  next();
                });
            }
        }
        catch(err){
            var errormsg = "Preprocess outputs don't match with prediction input configuration. Please check inputs and outputs against the preferred configuration. ";
            var outputItems = {err: errormsg, stackTrace: errormsg+JSON.stringify(err), predictionResult: 'Failed'}
            var dateFormat = Number(new Date());
            var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
            var options = {
                url: `${global.cldz_base_url}/api/servinghistory`,
                method: 'POST',
                body: JSON.stringify(modelHistory),
                headers: {
                'Content-Type': 'application/json'
                }
            };
            // saveHistory(options);
            if(global.lambda_deployment) await saveHistoryPromise(options);
            else saveHistory(options);
            var errObj={};
            errObj.success=false;
            errObj.message=errormsg+JSON.stringify(err);
            return res.status(500).json(errObj);
        }
    }
};

module.exports.scorer = (req, res, next) => {
    console.log("scorer")
    start_time=res.locals.start_time;
    var key=global.model_type;
    if(res.locals.file_array) {
        console.log("Res locals", res.locals.file_array);
        global.task_queue.push({"csv":null, "mcsv":res.locals.file_array, "res": res});
        if(global.java_client_status && key!="pythonscore") {
            res.locals.file_array[0]["data"] = res.locals.file_array[0]["data"].map(i => { if(i) return i.toString(); else return "" })
            valueToSend = {"zip_path":global.zip_path,"mcsv": res.locals.file_array, "length": global.validationInputAttr.length};
            global.java_client_status=false;
            console.log(valueToSend);
            socket_handler.java_socket(global.unixSocket, valueToSend, async (err, data) => {
                global.java_client_status=true;
                console.log("Ack call!");
                
                if(!err) {
                    console.log(data);
                    console.log("parsing data")
                    try{
                        console.log("json parse")
                        res.locals.scorer_arr=JSON.parse(data);
                    }
                    catch(err){
                        console.log("eval works")
                        res.locals.scorer_arr=eval(data);
                    }
                    console.log("after parsing fetching data")
                    next();
                } else {
                    var errObj={};
                    console.log(JSON.stringify(err));
                    errObj.success=false;
                    errObj.message="Error occurred while scoring: "+JSON.stringify(err);  
                    errObj.requestfrom=res.locals.requestfrom;                 
                    var outputItems = {stackTrace: errObj.message, predictionResult: 'Failed'} 
                    var dateFormat = Number(new Date());
                    var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    // saveHistory(options);
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    return res.status(500).json(errObj);
                }
            });
        }

        if(key=="pythonscore") {
            console.log(res.locals.file_array);
            var valueToSend = {"type":"pythonscore", "data":res.locals.file_array};
            global.python_service_status=false;
            socket_handler.python_socket(global.pythonUnixSocket, valueToSend, async (err, data) => {
                global.python_service_status=true;
                if(!err && data.length>0) {
                    res.locals.scorer_arr=JSON.parse(data);
                    next();
                } else {
                    var errObj={};
                    errObj.success="false";
                    errObj.requestfrom=res.locals.requestfrom;
                    errObj.stack_trace="Error occurred while scoring: "+JSON.stringify(err);
                    if(err && err["message"]=="unixSocket.write is not a function") {
                        errObj.message=global.error_map["SMO"];
                        outputItems.err='Issue with python predict function. Redeployment is required!';
                    }
                    var outputItems = {stackTrace: errObj.stack_trace, predictionResult: 'Failed'} 
                    if(err && err["message"]=="unixSocket.write is not a function") {
                        errObj.message=global.error_map["SMO"];
                        outputItems.stackTrace='Issue with python predict function. Please stop and redeploy!';
                    }
                    var dateFormat = Number(new Date());
                    var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    // saveHistory(options);
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    return res.status(500).json(errObj);
                }
            });
        }
    }
    else{
        return res.status(500).json({msg: "something went wrong"});
    }
};

module.exports.postprocessor = async (req, res, next) => {
    console.log("postprocessing middleware")
    start_time=res.locals.start_time;
    if(global.postprocessEnabled) {
        console.log("postprocessing enabled")
        //change output key to data and change the array value to json key values
        if(res.locals.scorer_arr[0]["output"]){
            if(res.locals.scorer_arr[0]["output"].length == global.validationOutputAttr.length){
                var tempobj = {};
                for(var i=0; i< global.validationOutputAttr.length; i++) {
                    tempobj[global.validationOutputAttr[i].name]=res.locals.scorer_arr[0]["output"][i]
                }
                res.locals.scorer_arr[0]["data"] = tempobj;
                delete res.locals.scorer_arr[0]["output"]
            }
            else{
                var errormsg = "postprocessing error: Output attributes don't match with prediction output. Please check if you have configured output attributes correctly."
                var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                var dateFormat = Number(new Date());
                var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                if(res.locals.inputpredictionFiles && res.locals.inputpredictionFiles.length > 0){
                    modelHistory["inputFiles"] = res.locals.inputpredictionFiles;
                }
                var options = {
                    url: `${global.cldz_base_url}/api/servinghistory`,
                    method: 'POST',
                    body: JSON.stringify(modelHistory),
                    headers: {
                    'Content-Type': 'application/json'
                    }
                };
                // saveHistory(options);
                if(global.lambda_deployment) await saveHistoryPromise(options);
                else saveHistory(options);
                var errObj={};
                errObj.success="false";
                errObj.stack_trace=errormsg;
                return res.status(500).json(errObj);
            }
        }
        valueToSend={"type":"postprocess", "data":res.locals.scorer_arr};
        global.python_service_status=false;
        socket_handler.python_socket(global.pythonUnixSocket, valueToSend, async (err, data) => {
            global.python_service_status=true;
            if(global.task_queue.length>0) {
                if(!err) {
                    response={};
                    console.log(data);
                    response["responseTime"]=(Date.now() - start_time);
                    response["data"]=JSON.parse(data);
                    console.log("post process outpu", response["data"])

                    //res.locals.requestfrom=res.locals.requestfrom;
                    response["success"]=true;  
                    if(global.timeSeries){
                        if(response["data"][0].success == 'true'){
                            try{
                                response["data"][0].data = Buffer.from(response["data"][0].data, 'base64').toString()
                            }
                            catch(err){
                                response["data"][0].data = response["data"][0].data
                            }
                            var outputItems = [];
                            if(global.finaloutput.find(x => x.name == 'lower bound' && x.include == true)){
                                var lowerbound = true;
                            }
                            else {
                                var lowerbound = false;
                            }
                            if(global.finaloutput.find(x => x.name == 'upper bound' && x.include == true)){
                                var upperbound = true;
                            }
                            else {
                                var upperbound = false;
                            }
                            for(let i=0; i<response["data"][0].data.length;i++){
                                outputItems.push({timestamp: response["data"][0].data[i][0], predicted: response["data"][0].data[i][1], lower_bound: lowerbound ? response["data"][0].data[i][2] : undefined, upper_bound: upperbound ? response["data"][0].data[i][3] : undefined})
                            }
                            var dateFormat = Number(new Date()); 
                            var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: response["responseTime"], feedback: true, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                            response["output"] = response["data"][0].data;
                            delete response["data"];
                            var options = {
                                url: `${global.cldz_base_url}/api/servinghistory`,
                                method: 'POST',
                                body: JSON.stringify(modelHistory),
                                headers: {
                                'Content-Type': 'application/json'
                                }
                            };
                            // saveHistory(options);
                            if(global.lambda_deployment) await saveHistoryPromise(options);
                            else saveHistory(options);
                            return res.status(200).json(response);
                        }
                        else if(response["data"][0].success == 'false'){
                            var errObj={};
                            errObj.success="false";
                            var errormsg = "Postprocessing error: "+Buffer.from(response["data"][0].message, 'base64').toString();
                            errObj.stack_trace=errormsg;
                            
                            var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                            var dateFormat = Number(new Date()); 
                            var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                            var options = {
                                url: `${global.cldz_base_url}/api/servinghistory`,
                                method: 'POST',
                                body: JSON.stringify(modelHistory),
                                headers: {
                                'Content-Type': 'application/json'
                                }
                            };
                            // saveHistory(options);
                            if(global.lambda_deployment) await saveHistoryPromise(options);
                            else saveHistory(options);
                            return res.status(500).json(errObj);
                        }
                    }
                    else if(response["data"].length <= 1){
                        if(response["data"][0].success == 'true'){
                            try{
                                response["data"][0].data = Buffer.from(response["data"][0].data, 'base64').toString()
                            }
                            catch(err){
                                response["data"][0].data = response["data"][0].data
                            }

                            for(var j=0; j<response["data"].length; j++) {
                                var outputItems = [];
                                console.log("final", global.finaloutput)
                                if(!global.finaloutput || global.finaloutput.length == 0){
                                    outputItems.push({name: 'Result', value: response["data"][j].data});
                                }
                                else{
                                    for(let i=0; i<global.finaloutput.length; i++){
                                        try{
                                            console.log("post process output before check", response["data"])
                                            if(typeof(response["data"][0].data) === 'string'){
                                                console.log("string");
                                                response["data"][0].data = eval(response["data"][0].data);
                                            }
                                            console.log("post process output after check", response["data"])
                                            var outputValue="";
                                            if(response["data"][0].data[0] && global.finaloutput[i].name in response["data"][0].data[0].data){
                                                console.log("getting outputvalue");
                                                outputValue = response["data"][0].data[0].data[global.finaloutput[i].name];
                                            }
                                            console.log("after output value")
                                            if(!outputValue){
                                                if(global.finaloutput[i].type != 'Image'){
                                                    outputItems.push({name: 'Result', value: JSON.stringify(response["data"][j]["data"])})
                                                }                         
                                                break;
                                            }
                                            outputItems.push({name: global.finaloutput[i].userfriendlyName || global.finaloutput[i].name, value: outputValue})
                                        }
                                        catch(err){
                                            outputItems.push({name: 'Result', value: JSON.stringify(response["data"][j]["data"])});
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            var modelHistory = {requestid: res.locals.requestid, company: global.companyid, responseTime: response["responseTime"]/response["data"].length, feedback: true, timestamp: new Date(), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                            response["output"] = response["data"][0].data;
                            delete response["data"];
                            var options = {
                                url: `${global.cldz_base_url}/api/servinghistory`,
                                method: 'POST',
                                body: JSON.stringify(modelHistory),
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            };
                            if(global.lambda_deployment) await saveHistoryPromise(options);
                            else saveHistory(options);
                            return res.status(200).json(response);
                        }
                        else if(response["data"][0].success == 'false'){
                            var errObj={};
                            errObj.success="false";
                            var errormsg = "Postprocessing error: "+Buffer.from(response["data"][0].message, 'base64').toString();
                            errObj.stack_trace=errormsg;
                            
                            var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                            var dateFormat = Number(new Date()); 
                            var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                            var options = {
                                url: `${global.cldz_base_url}/api/servinghistory`,
                                method: 'POST',
                                body: JSON.stringify(modelHistory),
                                headers: {
                                'Content-Type': 'application/json'
                                }
                            };
                            if(global.lambda_deployment) await saveHistoryPromise(options);
                            else saveHistory(options);
                            return res.status(500).json(errObj);
                        }
                    }
                }
                else{
                    var errormsg = "postprocessing error: "+JSON.stringify(err)
                    var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                    var dateFormat = Number(new Date());
                    var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                    if(res.locals.inputpredictionFiles && res.locals.inputpredictionFiles.length > 0){
                        modelHistory["inputFiles"] = res.locals.inputpredictionFiles;
                    }
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    // saveHistory(options);
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    var errObj={};
                    errObj.success="false";
                    errObj.stack_trace=errormsg;
                    return res.status(500).json(errObj);
                }
            }
        });
    } else {
        var response={};
        response["responseTime"]=(Date.now() - start_time);
        delete start_time;
        console.log("else in postprocessor")
        if(res.locals.scorer_arr) {
            console.log("Scorer array",res.locals.scorer_arr);
            response["data"]=res.locals.scorer_arr;
            // res.locals.requestfrom=res.locals.requestfrom;
            response["success"]=true;
            if(global.timeSeries){
                if(response["data"][0].success == 'true'){
                    try{
                        response["data"][0].data = Buffer.from(response["data"][0].data, 'base64').toString()
                    }
                    catch(err){
                        response["data"][0].data = response["data"][0].data
                    }
                    var outputItems = [];
                    if(global.validationOutputAttr.find(x => x.name == 'lower bound' && x.include == true)){
                        var lowerbound = true;
                    }
                    else {
                        var lowerbound = false;
                    }
                    if(global.validationOutputAttr.find(x => x.name == 'upper bound' && x.include == true)){
                        var upperbound = true;
                    }
                    else {
                        var upperbound = false;
                    }
                    for(let i=0; i<response["data"][0].data.length;i++){
                        outputItems.push({timestamp: response["data"][0].data[i][0], predicted: response["data"][0].data[i][1], lower_bound: lowerbound ? response["data"][0].data[i][2] : undefined, upper_bound: upperbound ? response["data"][0].data[i][3] : undefined})
                    }
                    var dateFormat = Number(new Date()); 
                    var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: response["responseTime"], feedback: true, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                    response["output"] = response["data"][0].data;
                    delete response["data"];
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    // saveHistory(options);
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    return res.status(200).json(response);
                }
                else if(response["data"][0].success == 'false'){
                    var errObj={};
                    var errormsg = "prediction error: "+ Buffer.from(response["data"][0].message, 'base64').toString();
                    errObj.success="false";
                    errObj.requestfrom=res.locals.requestfrom;
                    errObj.stack_trace=errormsg;
                    
                    var outputItems = {err:errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                    var dateFormat = Number(new Date()); 
                    var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    // saveHistory(options);
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    return res.status(500).json(errObj);
                }
            }
            else if(global.model_type != 'pythonscore' && response["data"].length <= 1){
                if(response["data"][0].success || response["data"][0].success == 'true'){
                    for(var j=0; j< response["data"].length; j++) {
                        outputItems = [];
                        if(Array.isArray(response["data"][j].output)){
                            for(var i=0; i< global.validationOutputAttr.length; i++) {
                                outputItems.push({name: global.validationOutputAttr[i].userfriendlyName || global.validationOutputAttr[i].name, value: response["data"][j].output[i], predictionResult: 'Success'})
                            }
                        }
                        else{
                            for(var i=0; i< global.validationOutputAttr.length; i++) {
                                outputItems.push({name: global.validationOutputAttr[i].userfriendlyName || global.validationOutputAttr[i].name, value: response["data"][j].output, predictionResult: 'Success'})
                            }
                        }
    
                        var modelHistory = {requestid: res.locals.requestid, company: global.companyid, responseTime: response["responseTime"]/response["data"].length, feedback: true, timestamp: new Date(), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                        response["output"] = response["data"][0].output;
                        delete response["data"];
                        var options = {
                            url: `${global.cldz_base_url}/api/servinghistory`,
                            method: 'POST',
                            body: JSON.stringify(modelHistory),
                            headers: {
                              'Content-Type': 'application/json'
                            }
                        };
                        if(global.lambda_deployment) await saveHistoryPromise(options);
                        else saveHistory(options);
                    }
                    return res.status(200).json(response);
                }
                else{
                    if(response["data"][0]) var errormsg = "Prediction error: "+response["data"][0].message
                    else var errormsg = "Something went wrong, please try again!"
                    var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                    var dateFormat = Number(new Date());
                    var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    // saveHistory(options);
                    var errObj={};
                    errObj.success=false;
                    errObj.message=errormsg;
                    return res.status(500).json(errObj);
                }
            }
            else if(global.model_type == 'pythonscore' && response["data"].length <= 1){
                if(response["data"][0].success == 'true' && response["data"].length > 0){
                    try{
                        response["data"][0].data = Buffer.from(response["data"][0].data, 'base64').toString()
                    }
                    catch(err){
                        response["data"][0].data = response["data"][0].data
                    }
                    for(var j=0; j<response["data"].length; j++) {
                        outputItems = [];
                        if(!global.validationOutputAttr || global.validationOutputAttr.length == 0){
                            outputItems.push({name: 'Result', value: response["data"][j].data});
                        }
                        else{
                            for(let i=0; i<global.validationOutputAttr.length; i++){
                                try{
                                    if(typeof(response["data"][0].data) === 'string'){
                                        console.log("string");
                                        response["data"][0].data = eval(response["data"][0].data);
                                    }
                                    var outputValue="";
                                    if(response["data"][0].data[0] && global.validationOutputAttr[i].name in response["data"][0].data[0].data){
                                        console.log("getting outputvalue");
                                        outputValue = response["data"][0].data[0].data[global.validationOutputAttr[i].name];
                                    }
                                    if(!outputValue){
                                        if(global.validationOutputAttr[i].type != 'Image'){
                                            outputItems.push({name: 'Result', value: JSON.stringify(response["data"][j]["data"])})
                                        }                         
                                        break;
                                    }
                                    outputItems.push({name: global.validationOutputAttr[i].userfriendlyName || global.validationOutputAttr[i].name, value: outputValue})
                                }
                                catch(err){
                                    outputItems.push({name: 'Result', value: JSON.stringify(response["data"][j]["data"])});
                                    break;
                                }
                            }
                        }

                        if (fs.existsSync(global.base_path+"/uploads/outputs/"+res.locals.requestid +"/")) {
                            console.log("outputfiles present");
                            uploadS3DirFiles(global.base_path+"/uploads/outputs/"+res.locals.requestid, global.companyid+"/"+global.servingprojectid+"/"+res.locals.requestid+"/outputs/", false)
                            .then(async (outputRes) => {
                                var tempd = [];
                                var tempe = {};
                                for(item in outputRes.outputFiles){
                                    tempc = outputRes.outputFiles[item].split('/')
                                    tempc = tempc[tempc.length-1]
                                    tempe["name"] = tempc
                                    tempe["path"] = outputRes.outputFiles[item]
                                    tempd.push(tempe)
                                }
                                if(outputRes.outputFiles && outputRes.outputFiles.length > 0) response["datafiles"] = res.locals.resoutput;
                                
                                res.locals.outputpredictionFiles = tempd;
                                get_presigned_urls(outputRes.outputFiles).then(async (urls) => {
                                    if(outputRes.outputFiles && outputRes.outputFiles.length > 0) response["outputfiles_s3urls"] = urls;
                                    if(fs.existsSync(global.base_path+"/uploads/inputs/"+res.locals.requestid+"/")){
                                        console.log("input files present")
                                        uploadS3DirFiles(global.base_path+"/uploads/inputs/"+res.locals.requestid,global.companyid+"/"+global.servingprojectid+"/"+res.locals.requestid+"/inputs/", false)
                                        .then(async (inputRes) => {
                                        var tempd = [];
                                        var tempe = {};
                                        for(item in inputRes.outputFiles){
                                            tempc = inputRes.outputFiles[item].split('/')
                                            tempc = tempc[tempc.length-1]
                                            tempe["name"] = tempc
                                            tempe["path"] = inputRes.outputFiles[item]
                                            tempd.push(tempe)
                                        }
                                        console.log("input tempd", tempd)
                                        res.locals.inputpredictionFiles = tempd;
                                        var modelHistory = {requestid: res.locals.requestid, company: global.companyid, responseTime: response["responseTime"]/response["data"].length, feedback: true, timestamp: new Date(), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                                        if(res.locals.inputpredictionFiles && res.locals.inputpredictionFiles.length > 0){
                                            modelHistory["inputFiles"] = res.locals.inputpredictionFiles;
                                        }
                                        if(res.locals.outputpredictionFiles && res.locals.outputpredictionFiles.length > 0){
                                            modelHistory["outputFiles"] = res.locals.outputpredictionFiles;
                                            console.log("output files in model history")
                                        }
                                        var options = {
                                            url: `${global.cldz_base_url}/api/servinghistory`,
                                            method: 'POST',
                                            body: JSON.stringify(modelHistory),
                                            headers: {
                                            'Content-Type': 'application/json'
                                            }
                                        };
                                        // saveHistory(options);
                                        if(global.lambda_deployment) await saveHistoryPromise(options);
                                        else saveHistory(options);
                                        return res.status(200).json(response);
                                        })
                                    }    
                                    else{
                                        var modelHistory = {requestid: res.locals.requestid, company: global.companyid, responseTime: response["responseTime"]/response["data"].length, feedback: true, timestamp: new Date(), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                                        response["output"] = response["data"][0].data;
                                        delete response["data"];
                                        if(res.locals.inputpredictionFiles && res.locals.inputpredictionFiles.length > 0){
                                            modelHistory["inputFiles"] = res.locals.inputpredictionFiles;
                                        }
                                        if(res.locals.outputpredictionFiles && res.locals.outputpredictionFiles.length > 0){
                                            modelHistory["outputFiles"] = res.locals.outputpredictionFiles;
                                            console.log("output files in model history")
                                        }
                                        var options = {
                                            url: `${global.cldz_base_url}/api/servinghistory`,
                                            method: 'POST',
                                            body: JSON.stringify(modelHistory),
                                            headers: {
                                            'Content-Type': 'application/json'
                                            }
                                        };
                                        // saveHistory(options);
                                        if(global.lambda_deployment) await saveHistoryPromise(options);
                                        else saveHistory(options);
                                        return res.status(200).json(response);
                                    }
                                });
                            });
                        }
                        else if(fs.existsSync(global.base_path+"/uploads/inputs/"+res.locals.requestid+"/")){
                            console.log("input files present else")
                            uploadS3DirFiles(global.base_path+"/uploads/inputs/"+res.locals.requestid,global.companyid+"/"+global.servingprojectid+"/"+res.locals.requestid+"/inputs/", false)
                            .then(async (inputRes) => {
                            var tempd = [];
                            var tempe = {};
                            for(item in inputRes.outputFiles){
                                tempc = inputRes.outputFiles[item].split('/')
                                tempc = tempc[tempc.length-1]
                                tempe["name"] = tempc
                                tempe["path"] = inputRes.outputFiles[item]
                                tempd.push(tempe)
                            }
                            console.log("input tempd", tempd)
                            res.locals.inputpredictionFiles = tempd;
                            console.log("inputfiles not present")
                            var modelHistory = {requestid: res.locals.requestid, company: global.companyid, responseTime: response["responseTime"]/response["data"].length, feedback: true, timestamp: new Date(), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                            response["output"] = response["data"][0].data;
                            delete response["data"];
                            if(res.locals.inputpredictionFiles && res.locals.inputpredictionFiles.length > 0){
                                modelHistory["inputFiles"] = res.locals.inputpredictionFiles;
                            }
                            if(res.locals.outputpredictionFiles && res.locals.outputpredictionFiles.length > 0){
                                modelHistory["outputFiles"] = res.locals.outputpredictionFiles;
                            }
                            var options = {
                                url: `${global.cldz_base_url}/api/servinghistory`,
                                method: 'POST',
                                body: JSON.stringify(modelHistory),
                                headers: {
                                'Content-Type': 'application/json'
                                }
                            };
                            // saveHistory(options);
                            if(global.lambda_deployment) await saveHistoryPromise(options);
                            else saveHistory(options);
                            return res.status(200).json(response);
                            })
                        }
                        else {
                            var modelHistory = {requestid: res.locals.requestid, company: global.companyid, responseTime: response["responseTime"]/response["data"].length, feedback: true, timestamp: new Date(), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                            response["output"] = response["data"][0].data;
                            delete response["data"];
                            if(res.locals.inputpredictionFiles && res.locals.inputpredictionFiles.length > 0){
                                modelHistory["inputFiles"] = res.locals.inputpredictionFiles;
                            }
                            if(res.locals.outputpredictionFiles && res.locals.outputpredictionFiles.length > 0){
                                modelHistory["outputFiles"] = res.locals.outputpredictionFiles;
                            }
                            var options = {
                                url: `${global.cldz_base_url}/api/servinghistory`,
                                method: 'POST',
                                body: JSON.stringify(modelHistory),
                                headers: {
                                'Content-Type': 'application/json'
                                }
                            };
                            // saveHistory(options);
                            if(global.lambda_deployment) await saveHistoryPromise(options);
                            else saveHistory(options);
                            return res.status(200).json(response);
                        }
                    }
                }
                else if(response["data"][0].success == 'false'){
                    var errormsg = "prediction error: "+Buffer.from(response["data"][0].message, 'base64').toString();
                    var outputItems = {err: errormsg, stackTrace: errormsg, predictionResult: 'Failed'}
                    var dateFormat = Number(new Date());
                    var modelHistory = {requestid: res.locals.requestid, requestfrom: res.locals.requestfrom, company: global.companyid, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: global.servingid, input: res.locals.inputItems, output: outputItems};
                    if(res.locals.inputpredictionFiles && res.locals.inputpredictionFiles.length > 0){
                        modelHistory["inputFiles"] = res.locals.inputpredictionFiles;
                    }
                    var options = {
                        url: `${global.cldz_base_url}/api/servinghistory`,
                        method: 'POST',
                        body: JSON.stringify(modelHistory),
                        headers: {
                        'Content-Type': 'application/json'
                        }
                    };
                    if(global.lambda_deployment) await saveHistoryPromise(options);
                    else saveHistory(options);
                    var errObj={};
                    errObj.success="false";
                    errObj.stack_trace=errormsg;
                    return res.status(500).json(errObj);
                } 
            }
            // return res.status(200).json(response);
        }
    }
};

function callback(error, response, body) {
    if (!error) {
        console.log(body)
        console.log("response success");
        var options = {
            url: `${global.cldz_base_url}/api/servinghistory?model=${global.servingid}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        };
        getservingHistory(options);
    }
}

function callback1(error, response, body) {
    if (!error) {
        // console.log(response)
        console.log(body);
        console.log("gethistory response success");
        var thumbs_up = body.filter(item => item.feedback == true).length;
        var thumbs_down = body.filter(item => item.feedback == false).length;
        const servingproject = {projectId: global.servingprojectid, thumbs_up: thumbs_up, thumbs_down: thumbs_down, requests: body.length};
        var options = {
            url: `${global.cldz_base_url}/api/servingproject/feedback`,
            method: 'POST',
            body: JSON.stringify(servingproject),
            headers: {
                'Content-Type': 'application/json'
            },
            // json: true
        };
        saveProject(options);
    }
}

function saveHistoryPromise(options) {
    return new Promise((resolve,reject) => {
        request(options,(err, response, body) => {
            if(err) {
                // handle it
                console.log("Error saving invocation history!");
            }
            resolve();
        });
    });
}

function callback2(error, response, body) {
    if (!error) {
        console.log("project response success");
        // console.log(body);
    }
}

function saveHistory(options) {
    request(options, null);
    //request(options, callback);
}

function getservingHistory(options){
    request(options, callback1);
}

function saveProject(options) {
    request(options, callback2);
}



