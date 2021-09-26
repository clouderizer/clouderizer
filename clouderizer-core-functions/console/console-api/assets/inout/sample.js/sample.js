const express = require('express')
const bodyParser = require('body-parser')
const fileUpload = require("express-fileupload")
const net = require('net')
const request = require("request")
const socket_handler = require("./socket_handler")
const fs = require('fs');
const csvParser = require('csv-parser');
const shortid = require("shortid");
const middleware = require('./middleware'); 
var async = require('async');

global.unixSocket='';
global.pythonUnixSocket='';
global.java_model_loading=true;

const server = net.createServer((unixSock) => {

    console.log("Client Connected!");

    global.unixSocket = unixSock;

    unixSock.setKeepAlive(true);

    unixSock.on("data",(data)=> {
        console.log("Always listening");
        console.log(data);
        data=JSON.parse(data.toString());
        console.log(data["java_model_loading"]);
        if(data["java_model_loading"]==false){
            global.java_model_loading=false;
            var url=global.cldz_base_url+"/api/servingmodel/updatestatus/"
            var resource={"servingid":global.servingid,"status":"Running","status_message":"Model is ready!"};
            var headers={
                'Content-Type': 'application/json'
            };
            request.post({headers:headers, url:url, json:resource}, function (err, res, body) {
                if(err) {
                  console.log(err);
                }
  
                // console.log(res);
                console.log(body);
            });

        }
    });

    unixSock.on('end', () => {
        console.log("Client Disconnected!");
    });
});

const pythonServer = net.createServer((pyUnixSock) => {

    console.log("Preprocessing connection!");
    global.pythonUnixSocket=pyUnixSock;
    pyUnixSock.setKeepAlive(true);

    // pyUnixSock.on('data', (data) => {
    //     console.log(data);

    //     pyUnixSock.write(JSON.stringify({"name":"Rohan"}));
    // });

    pyUnixSock.on('end', () => {
        console.log("Client Disconnected!");
        // unixSock.connect();
    });
});

if(fs.existsSync("/tmp/random.sock")) {
    fs.unlinkSync("/tmp/random.sock");
}

if(fs.existsSync("/tmp/preprocessing_unix.sock")) {
    fs.unlinkSync("/tmp/preprocessing_unix.sock");
}

var app = express();

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : 'uploads/'
}))

// {csv_path, res_obj}
global.task_queue = [];

// true --> available
global.java_client_status = true;
global.python_service_status = true;

app.use(bodyParser.urlencoded({extended:true})); //req.body args
app.use(bodyParser.json());
//app.use('/', express.static(path.normalize(__dirname + "/dist/frontend")));
//app.use('/userserving/', express.static(path.normalize(__dirname + "/dist/frontend")));

console.log(process.argv);

global.zip_path = process.argv[2];
global.servingid = process.argv[3];
global.servingprojectid = process.argv[4];
global.cldz_base_url = process.argv[5];
global.model_type=process.argv[6];

request(global.cldz_base_url+"/api/servingproject/find/"+process.argv[4], (err, res, body) => {
    if(err) {
        console.log(err);
    } else {
        console.log(body);
        var parsedBody = JSON.parse(body);
        if(parsedBody && parsedBody["inputAttr"] && parsedBody["inputAttr"].length>0 && parsedBody["inputAttr"][0]["inputList"]) {
            global.validationInputAttr = JSON.parse(body)["inputAttr"][0]["inputList"];
            global.validationOutputAttr = JSON.parse(body)["outputAttr"][0]["outputList"];
        }
        console.log(global.validationInputAttr);
    }
});

function inputAttrLength() {return global.validationInputAttr.length;}

function convertObjToStr(obj) {
    var arr="";
    length=inputAttrLength();
    for(var x=0;x<length;x++) {
        if(x!=length-1) arr=arr+obj[x]+",";
        else arr=arr+obj[x];
    }
    return arr;
}

function convertObjToArr(obj, cb) {
    var arr=[],
        length=inputAttrLength();
    for(var x=0;x<length;x++) {
        arr.push(obj[x]);
    }
    cb(arr);
}

// function convertArrToStr(arr, cb) {
//     cb(arr.toString())
// }

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

function validateRow(csv, cb) {
    console.log("Inside validate row", csv);
    for(var i=0; i< csv.length; i++) {
        if (global.validationInputAttr[i].type==="Numeric") {
            var convertToInt = parseInt(csv[i]);
            var min = global.validationInputAttr[i].min;
            var max = global.validationInputAttr[i].max;

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
        } else if (global.validationInputAttr[i].type==="Enum") {
            if(global.validationInputAttr[i].allowedValues.length>0) {

                if(typeof(global.validationInputAttr[i].allowedValues[0])!="string") {
                    for(var j=0;j<global.validationInputAttr[i].allowedValues.length;j++) {
                        global.validationInputAttr[i].allowedValues[j] = global.validationInputAttr[i].allowedValues[j].toString();
                    }
                }

                console.log(global.validationInputAttr[i].allowedValues.indexOf(csv[i]));

                if(global.validationInputAttr[i].allowedValues.indexOf(csv[i])==-1) {
                    console.log(csv[i]);
                }

                if(!(global.validationInputAttr[i].allowedValues.indexOf(csv[i])>-1)) {
                    cb({success: false, message:csv[i] + " is not among the allowed values"});
                    return;
                }
            }
        }
    }

    cb({success:true, data: convertObjToStr(csv)});
    return;
}

function storeDataInDb(inputs, outputs, responseTime, cb) {
    let servingHistoryData = {};
    servingHistoryData["input"] = inputs;
    servingHistoryData["output"] = outputs;
    servingHistoryData["responseTime"] = responseTime;
    servingHistoryData["servingid"] = global.servingid;

    var options = {
        uri: global.cldz_base_url+'/api/predictionservice/predictiondata',
        method: 'POST',
        headers: {'Content-type' : 'application/json'},
        json: servingHistoryData
    };

    request(options,(err, resp, body) => {
        if(err) cb(err, null);
        console.log(body);
        if(!err) cb(null, body);
    });
}

function socketHandlerQueues(unixSocket, type, start_time) {
    var valueToSend;
    if(type=='csv') {
        // tempArrToGetLength = global.task_queue[0].csv.split(",");
        valueToSend = {"key": global.task_queue[0].key, "zip_path":global.zip_path,"csv": global.task_queue[0].csv, "length": global.validationInputAttr.length};
        // delete tempArrToGetLength;
    } else if (type=='mcsv') {
        valueToSend = {"key": global.task_queue[0].key, "zip_path":global.zip_path,"mcsv": global.task_queue[0].res.locals.file_array, "length": global.validationInputAttr.length};
    }

    socket_handler.unix_socket(unixSocket, valueToSend, (data) => {
        console.log(global.task_queue);

        console.log("Ack call!");
        // global.java_client_status=true;
        if(global.task_queue.length>0) {

            // servingHistoryData["input"] = valueToSend;
            // servingHistoryData["output"] = data;
            data = JSON.parse(data);

            data["responseTime"] = (Date.now() - start_time);
            console.log(data);
            delete start_time;
            global.task_queue[0].res.status(200).json(data);
            global.task_queue.shift();
            // servingHistoryData["servingid"] = global.servingid;

            // if(type=='mcsv') {
            //     storeDataInDb(valueToSend["mcsv"], data, () => {
            //         console.log("Saved to db!");
            //     });
            // }

            // var options = {
            //     uri: 'https://alphaconsole.clouderizer.com/api/predictionservice/predictiondata',
            //     method: 'POST',
            //     headers: {'Content-type' : 'application/json'},
            //     json: servingHistoryData
            // };

            // request(options,(err, resp, body) => {
            //     if(err) console.log(err);
            //     console.log(resp);
            //     console.log(body);
            //     console.log("data sent to node server!");
            // });
        }
    })
}

// async function JavaStatusPromise() {
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             console.log("Stuck here!");
//             console.log(global.java_client_status);
//             console.log(global.task_queue);
//             if(global.java_client_status) resolve();
//             else JavaStatusPromise();
//         },1000);
//     });
// }

// storage format for serving history
function servingHistoryStorageFormat(values, output, cb){

    var inputArr=[];

    values=values.split(",");

    for(var i=0; i< global.validationInputAttr.length; i++) {
        var prepFormat={};
        prepFormat["name"] = global.validationInputAttr[i].name;
        prepFormat["value"] = values[i];

        inputArr.push(prepFormat);
    }

    outputArr=[];

    if(global.validationOutputAttr.length>0) {
        for(var i=0; i < global.validationOutputAttr.length; i++) {
            var opFormat={};
            opFormat["name"] = global.validationOutputAttr[i].name;
            opFormat["value"] = output[i];

            outputArr.push(opFormat);
        }
    }

    cb(inputArr, outputArr);
}

// this endpoint is only for local testing
app.get('/', (req, res, next) => {
    res.sendFile("index.html", { root: __dirname });
});

app.post('/:port-:servingid-SH/test', (req, res, next) => {
    var weNeedStr='';
    for(var i=0; i< global.validationInputAttr.length; i++) {
        weNeedStr+=req.body[global.validationInputAttr[i].name]+",";
    }
    console.log(weNeedStr);
});

app.get('/:port-:servingid-SH/', (req, res, next) => {
    console.log(req.params.port);
    console.log(req.params.servingid);
    console.log(global.servingid);

    if(req.params.servingid === global.servingid) res.sendFile("index.html", { root: __dirname });
    else res.status(500).json({success:false, msg:"Wrong ID"});
});

app.get('/:port-:servingid-SH/projectdetails', middleware.project_details);

app.post('/:port-:servingid-SH/stop', middleware.stop_docker);

app.post('/:port-:servingid-SH/predict', middleware.queue_handler, middleware.datatype_handler, middleware.preprocessor, middleware.validator, middleware.scorer,middleware.postprocessor);

app.post('/:port-:servingid-SH/predictold', (req, res, next) => {
    // preprocessing step
    // must be skipped for dai and h2o models

    res.locals.start_time=Date.now();
    console.log("ST,",res.locals.start_time);

    if(global.model_type=="h2o" || global.model_type=="dai" || process.argv[7]=="false" || !process.argv[7]) {
        next();
    } else {
        /**
         * We will have 2 types:
         * 1. Preprocessing
         * 2. ONNX model with preprocessing & postprocessing enablers
         */
        if(req.body.csv) {
            received_data=req.body.csv.split(",");
            
            var valueToSend = {"type": "preprocess", "data":received_data};

            global.python_service_status=false;
            socket_handler.unix_socket(global.pythonUnixSocket, valueToSend, (err, data) => {
                global.python_service_status=true;
                
                if(!err && data!="") {
                    data=JSON.parse(data);
                    console.log(data);
                    var data_from_preprocessing;

                    if(typeof(data)=="object") {
                        data_from_preprocessing=data.join(",");
                    } else data_from_preprocessing=data["data"];

                    res.locals.preprocessed_csv_data=data_from_preprocessing;  
                    console.log(res.locals.preprocessed_csv_data);
                    console.log("Passed preprocessing step",data);
                    next();
                } else {
                    var errObj={};
                    errObj.success=false;
                    errObj.message=err;
                    // global.task_queue[0].res.status(500).json(errObj);
                    // global.task_queue.shift();
                }
            });
        }

        if(req.files && req.files.file && process.argv[7]=="true") {
            console.log(req.files.file);
            if(req.files.file.mimetype=="text/csv" || req.files.file.mimetype=="application/octet-stream") {
                res.locals.file_path = __dirname+"/uploads/"+req.params.servingid+"_"+shortid.generate()+".csv"; 
                req.files.file.mv(res.locals.file_path, (err) => {
                    if(err) {
                        console.log(err);
                        res.status(500).json("Error while saving file");
                    }
    
                    var goodArr = [],
                        rowCount=0;
                    fs.createReadStream(res.locals.file_path)
                        .pipe(csvParser({headers:false}))
                        .on('data', (row) => {
                            if(rowCount!=0) {
                                console.log(row);
                                convertObjToArr(row, (arrRow) => {
                                    arrRow=arrRow.toString();
                                    goodArr.push(arrRow);
                                    // validateRow(arrRow, (result) => {
                                    //     console.log("Result to push to goodArr", result);
                                    //     goodArr.push(result);
                                    // });
                                });
                            } 
                            rowCount=rowCount+1;
                        })
                        .on('end', () => {
                            console.log('CSV file successfully pre processed');
                            console.log(goodArr);

                            valueToSend={"type": "preprocess", "data":goodArr};
                            global.python_service_status=false;
                            socket_handler.unix_socket(global.pythonUnixSocket, valueToSend, (err, data) => {
                                global.python_service_status=true;
                                if(!err && data!="") {
                                    data=JSON.parse(data);
                                    console.log(data);
                                    console.log("Passed preprocessing step for file",data);
                                    goodArr=data;
                                    res.locals.file_array = goodArr;
                                    next();
                                } else {
                                    var errObj={};
                                    errObj.success=false;
                                    errObj.message=err;
                                    global.task_queue[0].res.status(500).json(errObj);
                                    global.task_queue.shift();
                                }
                            });
                            // console.log(res.locals.file_path);
    
                            fs.unlink(res.locals.file_path, (err) => {
                                if(err) console.log(err);
                            });
                        });
                });
            } else {
                res.status(500).json({success:false, message:"File format not supported!"});
                return;
            }
        }
    }
}, (req, res, next) => {
    // input validation logic
    // TODO: Angular FE is already performing validation, skip validation if Referrer is Angular
    if(!global.validationInputAttr || !(global.validationInputAttr.length>0)) {
        next();
    }

    if(req.params.servingid!=global.servingid) {
        res.status(500).json({success:false, msg:"Wrong ID"});
        return;
    }

    var cookies = parseCookies(req);
    console.log("Cookies",cookies);
    
    res.locals.serving_history_storage=true;
    if(cookies["refreshrate"]=="89345123765") {
        res.locals.serving_history_storage = false;
    }
    //     console.log("Inside refresh rate");
    //     next();
    // }

    if(process.argv[7]=="false" || !process.argv[7]) {
        var csv = "";
        if(req.body.csv) {
            csv=req.body.csv;
            csv = csv.split(",");
            console.log(csv.length);
            console.log(global.validationInputAttr);
            if(csv.length!=global.validationInputAttr.length) {
                res.status(500).json({msg:"Number of elements don't match"});
                return;
            }

            // var result = await validateRow(csv);
            validateRow(csv, (result) => {
                if(result.data==csv) next();
                else {
                    console.log("Danger!");
                    res.status(500).json(result);
                    return;
                }
            });
        }
    } else {
        csv=res.locals.preprocessed_csv_data.split(",");
        if(csv.length!=global.validationInputAttr.length) {
            res.status(500).json({msg:"Number of elements don't match"});
            return;
        }

        if(global.model_type!="pythonscore") {
            validateRow(csv, (result) => {
                if(result.data==csv) next();
                else {
                    console.log("Danger!");
                    res.status(500).json(result);
                    return;
                }
            });
        } else next();
    }

    if(req.files && req.files.file && (process.argv[7]=="false" || !process.argv[7])) {
        console.log(req.files.file);
        if(req.files.file.mimetype=="text/csv" || req.files.file.mimetype=="application/octet-stream") {
            res.locals.file_path = __dirname+"/uploads/"+req.params.servingid+"_"+shortid.generate()+".csv"; 
            req.files.file.mv(res.locals.file_path, (err) => {
                if(err) {
                    console.log(err);
                    res.status(500).json("Error while saving file");
                }

                var goodArr = [],
                    rowCount=0;
                fs.createReadStream(res.locals.file_path)
                    .pipe(csvParser({headers:false}))
                    .on('data', (row) => {
                        if(rowCount!=0) {
                            console.log(row);
                            convertObjToArr(row, (arrRow) => {
                                console.log(arrRow);
                                validateRow(arrRow, (result) => {
                                    console.log("Result to push to goodArr", result);
                                    goodArr.push(result);
                                });
                            });
                        } 
                        rowCount=rowCount+1;
                    })
                    .on('end', () => {
                        console.log('CSV file successfully processed');
                        // console.log(goodArr);
                        res.locals.file_array = goodArr;
                        console.log(res.locals.file_path);

                        fs.unlink(res.locals.file_path, (err) => {
                            if(err) console.log(err);
                        })
                        next();
                    });
            });
        } else {
            res.status(500).json({success:false, message:"File format not supported!"});
            return;
        }
    }

    if(req.files && req.files.file && process.argv[7]=="true") {
        console.log(res.locals.file_array);

        for(var i=0;i<res.locals.file_array.length;i++) {
            console.log(res.locals.file_array[i]);
            validateRow(res.locals.file_array[i].split(","), (result) => {
                res.locals.file_array[i] = result;

                if(i==res.locals.file_array.length-1) next();
            });
        }
    }
}, (req, res, next) => {
    start_time=res.locals.start_time;

    if(req.body.csv && (process.argv[7]=="false" || !process.argv[7])) {
        var csv="";
        csv=req.body.csv;
        console.log(req.body.csv);

        var key=global.model_type;

        global.task_queue.push({"key": key, "csv": csv, "res": res, "mcsv":null});

        if(global.java_client_status) {
            var valueToSend;
            if(csv && csv!="") {
                tempArrToGetLength = csv.split(",");

                // h2o needs all values perform validation
                if(key=="h2o") {
                    for(var i=0;i<tempArrToGetLength.length;i++) {
                        if(tempArrToGetLength[i]=="") return res.status(500).json( {msg:"Please provide all inputs"});
                    }
                }
                valueToSend = {"zip_path":global.zip_path,"csv": csv, "length": tempArrToGetLength.length};
                delete tempArrToGetLength;
            }
            
            global.java_client_status=false;

            // socketHandlerQueues(unixSocket, 'csv', start_time);
            console.log("356",global.task_queue);
            socket_handler.unix_socket(global.unixSocket, valueToSend, (err, data) => {
                global.java_client_status=true;
                if(!err) {
                    console.log("Ack call!");
                    console.log("task queue", global.task_queue);
                    // global.java_client_status=true;
                    if(global.task_queue.length>0) {
                        data = JSON.parse(data);

                        data["responseTime"] = (Date.now() - start_time);
                        delete start_time;
                        console.log(data);
                        if(data.success) {
                            global.task_queue[0].res.status(200).json(data);
                            global.task_queue.shift();
                            
                            if(res.locals.serving_history_storage) {
                                if(global.model_type=="pmml4s") {
                                    servingHistoryData={};
                                    servingHistoryStorageFormat(csv, data["output"], (inputs, outputs) => {
                                        storeDataInDb(inputs, outputs, data["responseTime"], (err, matter) => {
                                            if(err) console.log(err);
                                            else {
                                                console.log("Data with inputs " + csv + " stored to db");
                                            }
                                        });
                                    });
                                }
                            }
                        } else {
                            global.task_queue[0].res.status(500).json(data);
                            global.task_queue.shift();
                        }
                    }
                } else {
                    var errObj={};
                    errObj.success=false;
                    errObj.message=err;
                    global.task_queue[0].res.status(500).json(errObj);
                    global.task_queue.shift();
                }
            });
        }
    }  

    if(res.locals.preprocessed_csv_data) {
        var key=global.model_type;

        global.task_queue.push({"key": key, "csv": res.locals.preprocessed_csv_data, "res": res, "mcsv":null});

        if(global.java_client_status) {
            var valueToSend;
            if(res.locals.preprocessed_csv_data && res.locals.preprocessed_csv_data!="") {
                tempArrToGetLength = res.locals.preprocessed_csv_data.split(",");

                // h2o needs all values perform validation
                
                valueToSend = {"zip_path":global.zip_path,"csv": res.locals.preprocessed_csv_data, "length": tempArrToGetLength.length};
                delete tempArrToGetLength;
            }
            
            global.java_client_status=false;

            // socketHandlerQueues(unixSocket, 'csv', start_time);
            console.log("356",global.task_queue);
            socket_handler.unix_socket(global.unixSocket, valueToSend, (err, data) => {
                global.java_client_status=true;
                console.log("Ack call!");
                console.log("tasK queue", global.task_queue);
                
                if(!err){
                    if(global.task_queue.length>0) {
                        data = JSON.parse(data);
    
                        data["responseTime"] = (Date.now() - start_time);
                        delete start_time;
                        console.log(data);
                        if(data.success) {
                            global.task_queue[0].res.status(200).json(data);
                            global.task_queue.shift();
                            
                            if(res.locals.serving_history_storage) {
                                if(global.model_type=="pmml4s") {
                                    servingHistoryData={};
                                    servingHistoryStorageFormat(res.locals.preprocessed_csv_data, data["output"], (inputs, outputs) => {
                                        storeDataInDb(inputs, outputs, data["responseTime"], (err, matter) => {
                                            if(err) console.log(err);
                                            else {
                                                console.log("Data with inputs " + res.locals.preprocessed_csv_data + " stored to db");
                                            }
                                        });
                                    });
                                }
                            }
                        } else {
                            global.task_queue[0].res.status(500).json(data);
                            global.task_queue.shift();
                        }
                    }
                } else {
                    var errObj={};
                    errObj.success=false;
                    errObj.message=err;
                    global.task_queue[0].res.status(500).json(errObj);
                    global.task_queue.shift();
                }
            })
        }
    }
    
    if(res.locals.file_array) {
        console.log("Res locals", res.locals.file_array);

        valueToSend = {"zip_path":global.zip_path,"mcsv": res.locals.file_array, "length": global.validationInputAttr.length};
        global.task_queue.push({"csv":null, "mcsv":res.locals.file_array, "res": res});
        if(global.java_client_status) {
            global.java_client_status=false;

            // socketHandlerQueues(unixSocket, 'mcsv', start_time);
            socket_handler.unix_socket(global.unixSocket, valueToSend, (err, data) => {
                global.java_client_status=true;
                console.log("Ack call!");
                
                if(!err) {
                    if(global.task_queue.length>0) {
                        // data = JSON.parse(data);
                        var responseObj = {};
                        responseObj["responseTime"] = (Date.now() - start_time);
                        responseObj["data"] = JSON.parse(data);
                        delete start_time;
    
                        global.task_queue[0].res.status(200).json(responseObj);
                        global.task_queue.shift();
                    }
                } else {
                    var errObj={};
                    errObj.success=false;
                    errObj.message=err;
                    global.task_queue[0].res.status(500).json(errObj);
                    global.task_queue.shift();
                }
            });
        }
    }
});

server.listen("/tmp/random.sock", () => {
    console.log("Unix socket on /tmp/random.sock");
});

pythonServer.listen("/tmp/preprocessing_unix.sock", () => {
    console.log("Python socket connected");
});

app.listen(9090,()=>console.log('Listening on port 9090'));
