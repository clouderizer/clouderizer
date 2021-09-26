var timeoutCallback = require('timeout-callback');

module.exports.sendCommandToParser = function () {
    sendCommand();
}

module.exports.sendCommandToParserWithAck = function (command, payload, callback) {
var sockets = sails.io.sockets.in("1234567890");
    if(!sockets) {
        callback(new Error('Parser service not running.'), null);
    }
    var socket = sockets.sockets[sails.config.clouderizerconfig.parserSocketId];

    if(socket) {
        socket.emit(command, payload, (error, data) => {
            callback(error, data)
        });
    } else {
        callback(new Error('Parser service not running.'), null);
    }
}

function sendCommand() {
    if(sails.config.clouderizerconfig.java_parser_tasks.length>0) {
        socketHandler(sails.config.clouderizerconfig.java_parser_tasks[0].message, sails.config.clouderizerconfig.java_parser_tasks[0].s3Url, sails.config.clouderizerconfig.java_parser_tasks[0].servingid, (data) => {
            if(sails.config.clouderizerconfig.java_parser_tasks.length>0) {
                sails.config.clouderizerconfig.java_parser_tasks[0].res.status(200).json(data);
                sails.config.clouderizerconfig.java_parser_tasks.shift();
            }
        });
    } 
}

module.exports.parseOutputH2o = function (output, servingprojectid) {
  var tempiItems = [];
  var tempoutputItems = [];

  var inputType={"text": {"type":"Text", "image": "Text_Icon","format": "txt", "formats": ["txt", "doc", "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t"]},
        "video": {"type":"Video", "image": "Video_1", "format": "", "formats": ["MP4", "AVI"]},
        "audio": {"type":"Audio", "image": "Audio_1", "format": "MP3", "formats": ["MP4", "AVI"]},
        "image": {"type":"Image", "image": "Image_1", "format": "PNG", "formats": ["JPEG", "JPG"]},
        "table_input": {"type":"Input Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "inputList":[], "rawinputList":[], "subtype":""},
        "table_output": {"type":"Output Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "outputList":[], "finaloutput":[], "subtype":""},
        "url": {"type":"URL", "image": "URL_1", "format": "", "formats": []}
    };
  

  output_parsed=output.parse_model;
  console.log("Parser output h2o",output_parsed.subtype);
  if(output_parsed.subtype === 'h2o'){
    if(output_parsed.ia instanceof Array){
      
      //inputList = output_parsed.ia;
      var index = output_parsed.ia.indexOf(output_parsed.oa);
      if(index > -1){
        output_parsed.ia.splice(index, 1);
        var outDomain = output_parsed.domains[index]
        output_parsed.domains.splice(index,1);
      } 
    }
    inputType["table_input"]["inputList"] = [];
    inputType["table_output"]["outputList"] = [];
    var domains = [];
    for (let i = 0; i < output_parsed.ia.length; i++) {
      domains = [];
      if(output_parsed.domains[i] != null){
        domains = output_parsed.domains[i]
      }
      else {
        domains= null;
      }
      inputType["table_input"]["inputList"].push({"name": output_parsed.ia[i], "userfriendlyName": output_parsed.ia[i], "allowedValues": domains})
    }
    for(let i=0;i<inputType["table_input"]["inputList"].length; i++){  
      if(inputType["table_input"]["inputList"][i]["allowedValues"] === null || inputType["table_input"]["inputList"][i]["allowedValues"].length == 0) {
        inputType["table_input"]["inputList"][i]["type"] = "Integer";  
        inputType["table_input"]["inputList"][i]["allowedValues"] = []; 
      }     
      else if(inputType["table_input"]["inputList"][i]["allowedValues"].length > 0){
        inputType["table_input"]["inputList"][i]["type"] = "Enum";  
      }  
      else {
        inputType["table_input"]["inputList"][i]["type"] = "None";
      }    
      inputType["table_input"]["inputList"][i]["description"] = "None";  
      inputType["table_input"]["inputList"][i]["min"] = null;
      inputType["table_input"]["inputList"][i]["max"] = null;
      inputType["table_input"]["inputList"][i]["important"] = false; 
      inputType["table_input"]["inputList"][i]["allowed2"] = [inputType["table_input"]["inputList"][i]["name"]]; 
    }
    inputType["table_input"]["rawinputList"] = [...inputType["table_input"]["inputList"]]
    tempiItems = [inputType["table_input"]];
    
    if(output_parsed.oa){
      inputType["table_output"]["outputList"] = [{"name": output_parsed.oa, "userfriendlyName": output_parsed.oa, "allowedValues": outDomain}];
      for(let i=0;i<inputType["table_output"]["outputList"].length; i++){
          
        if(inputType["table_output"]["outputList"][i]["allowedValues"] === null || inputType["table_output"]["outputList"][i]["allowedValues"].length == 0) {
          inputType["table_output"]["outputList"][i]["allowedValues"] = []; 
          inputType["table_output"]["outputList"][i]["type"] = "Integer";
        }
        else if (inputType["table_output"]["outputList"][i]["allowedValues"].length > 0){
          inputType["table_output"]["outputList"][i]["type"] = "Enum";
        }
        else{
          inputType["table_output"]["outputList"][i]["type"] = "None";
        }
        inputType["table_output"]["outputList"][i]["description"] = "None";
        inputType["table_output"]["outputList"][i]["min"] = null;
        inputType["table_output"]["outputList"][i]["max"] = null;
        inputType["table_output"]["outputList"][i]["allowed2"] = [inputType["table_output"]["outputList"][i]["name"]];
      }
      inputType["table_output"]["finaloutput"] = [...inputType["table_output"]["outputList"]]
      tempoutputItems = [inputType["table_output"]];
    }
  }
  else if(output_parsed.subtype === 'dai'){
    inputType["table_input"]["inputList"] = [];
    inputType["table_output"]["outputList"] = [];
    console.log(iItems);
    if(output_parsed.ia instanceof Array){
      
        for(let i=0;i<output_parsed.ia.length; i++){
          inputType["table_input"]["inputList"].push({});
        }
        var itemType;
        for(let i=0;i<output_parsed.ia.length; i++){
          console.log(value(output_parsed.ia[i]));
          inputType["table_input"]["inputList"][i]["name"] = key(output_parsed.ia[i])[0];
          inputType["table_input"]["inputList"][i]["userfriendlyName"] = key(output_parsed.ia[i])[0];
          inputType["table_input"]["inputList"][i]["description"] = "None";
          if(value(output_parsed.ia[i])[0].toLowerCase().includes('float')) {
            itemType = "Whole";
          }
          else if(value(output_parsed.ia[i])[0].toLowerCase().includes('int')){
            itemType = "Integer";
          }
          else if(value(output_parsed.ia[i])[0].toLowerCase().includes('str')){
            itemType = "Enum";
          }
          else if(value(output_parsed.ia[i])[0] === "" || value(output_parsed.ia[i])[0] === null){
            itemType = "None";
          }
          else {
            itemType = value(output_parsed.ia[i])[0];
          }
          inputType["table_input"]["inputList"][i]["type"] = itemType;                
          inputType["table_input"]["inputList"][i]["allowedValues"] = [];
          inputType["table_input"]["inputList"][i]["min"] = null;
          inputType["table_input"]["inputList"][i]["max"] = null;
          inputType["table_input"]["inputList"][i]["allowed2"] = [inputType["table_input"]["inputList"][i]["name"]];
        }
        console.log(iItems);
        console.log(tempiItems);
        inputType["table_input"]["rawinputList"] = [...inputType["table_input"]["inputList"]]
        tempiItems = [inputType["table_input"]];
        console.log(iItems);

        for(let i=0;i<output_parsed.oa.length; i++){
          inputType["table_output"]["outputList"].push({});
        }

        for(let i=0;i<output_parsed.oa.length; i++){
          console.log(key(output_parsed.oa));
          inputType["table_output"]["outputList"][i]["name"] = key(output_parsed.oa[i])[0];
          inputType["table_output"]["outputList"][i]["userfriendlyName"] = key(output_parsed.oa[i])[0];
          inputType["table_output"]["outputList"][i]["description"] = "None";
          if(value(output_parsed.oa[i])[0].toLowerCase().includes('float')){
            itemType = "Whole";
          }
          else if(value(output_parsed.oa[i])[0].toLowerCase().includes('int')){
            itemType = "Integer";
          }
          else if(value(output_parsed.oa[i])[0].toLowerCase().includes('str')){
            itemType = "Enum";
          }
          else if(value(output_parsed.oa[i])[0] === "" || value(output_parsed.oa[i])[0] === null){
            itemType = "None";
          }
          else{
            itemType = value(output_parsed.oa[i])[0];
          }
          inputType["table_output"]["outputList"][i]["type"] = itemType;                
          inputType["table_output"]["outputList"][i]["allowedValues"] = [];
          inputType["table_output"]["outputList"][i]["min"] = null;
          inputType["table_output"]["outputList"][i]["max"] = null;
          inputType["table_output"]["outputList"][i]["allowed2"] = [inputType["table_output"]["outputList"][i]["name"]];
        }
        inputType["table_output"]["finaloutput"] = [...inputType["table_output"]["outputList"]]
        tempoutputItems = [inputType["table_output"]];  
      }    
    }

    checkAndUpdateModelAttributes(servingprojectid,tempiItems,tempoutputItems,output);    
}

module.exports.parseOutputPmml = function (output,servingprojectid) {
    var inputType={"text": {"type":"Text", "image": "Text_Icon","format": "txt", "formats": ["txt", "doc", "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t"]},
        "video": {"type":"Video", "image": "Video_1", "format": "", "formats": ["MP4", "AVI"]},
        "audio": {"type":"Audio", "image": "Audio_1", "format": "MP3", "formats": ["MP4", "AVI"]},
        "image": {"type":"Image", "image": "Image_1", "format": "PNG", "formats": ["JPEG", "JPG"]},
        "table_input": {"type":"Input Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "inputList":[], "rawinputList":[], "subtype":""},
        "table_output": {"type":"Output Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "outputList":[], "finaloutput":[], "subtype":""},
        "url": {"type":"URL", "image": "URL_1", "format": "", "formats": []}
    };

    inputType["table_input"]["subtype"] = output.platform;
    inputType["table_output"]["subtype"] = output.platform;

    var tempiItems = [];
    var tempoutputItems = [];
    if(output.platform === 'jpmml' || output.platform === 'pmml4s' || output.platform === 'pmml'){
      inputType["table_input"]["inputList"] = [];
      inputType["table_output"]["outputList"] = [];
      for (let i = 0; i < output.input.length; i++) {
        inputType["table_input"]["inputList"].push({"name": output.input[i].name, "userfriendlyName": output.input[i].name, "allowedValues": output.input[i].domains, "dataType": output.input[i].dataType});
      }
      for(let i=0;i<inputType["table_input"]["inputList"].length; i++){  
        if(inputType["table_input"]["inputList"][i]["allowedValues"] === null || inputType["table_input"]["inputList"][i]["allowedValues"].length == 0) {
          if(inputType["table_input"]["inputList"][i]["dataType"] == 'boolean'){
            inputType["table_input"]["inputList"][i]["type"] = "Enum";
            inputType["table_input"]["inputList"][i]["allowedValues"] = ['true', 'false'];
          }
          else if(inputType["table_input"]["inputList"][i]["dataType"] == 'string'){
            inputType["table_input"]["inputList"][i]["type"] = "Text";
            inputType["table_input"]["inputList"][i]["allowedValues"] = []; 
          }
          else if(inputType["table_input"]["inputList"][i]["dataType"] == 'double'){
            inputType["table_input"]["inputList"][i]["type"] = "Whole";
            inputType["table_input"]["inputList"][i]["allowedValues"] = []; 
          }
          else{
          inputType["table_input"]["inputList"][i]["type"] = "Integer";  
          inputType["table_input"]["inputList"][i]["allowedValues"] = []; 
          }
        }     
        else if(inputType["table_input"]["inputList"][i]["allowedValues"].length > 0){
          inputType["table_input"]["inputList"][i]["type"] = "Enum";  
        }  
        else {
          inputType["table_input"]["inputList"][i]["type"] = "None";
        }    
        inputType["table_input"]["inputList"][i]["description"] = "None";  
        inputType["table_input"]["inputList"][i]["min"] = null;
        inputType["table_input"]["inputList"][i]["max"] = null;
        inputType["table_input"]["inputList"][i]["important"] = false; 
        inputType["table_input"]["inputList"][i]["allowed2"] = [inputType["table_input"]["inputList"][i]["name"]];
      }
      inputType["table_input"]["rawinputList"] = [...inputType["table_input"]["inputList"]]
      tempiItems = [inputType["table_input"]];
      console.log(tempiItems);
      for (let i = 0; i < output.output.length; i++) {
        inputType["table_output"]["outputList"].push({"name": output.output[i].name, "userfriendlyName": output.output[i].name, "allowedValues": output.output[i].domains, "dataType": output.output[i].dataType})
      }
      for(let i=0;i<inputType["table_output"]["outputList"].length; i++){  
        if(inputType["table_output"]["outputList"][i]["allowedValues"] === null || inputType["table_output"]["outputList"][i]["allowedValues"].length == 0) {
          if(inputType["table_output"]["outputList"][i]["dataType"] == 'boolean'){
            inputType["table_output"]["outputList"][i]["type"] = "Enum";
            inputType["table_output"]["outputList"][i]["allowedValues"] = ['true', 'false'];
          }
          else if(inputType["table_output"]["outputList"][i]["dataType"] == 'string'){
            inputType["table_output"]["outputList"][i]["type"] = "Text";
            inputType["table_output"]["outputList"][i]["allowedValues"] = []; 
          }
          else if(inputType["table_output"]["outputList"][i]["dataType"] == 'double'){
            inputType["table_output"]["outputList"][i]["type"] = "Whole";
            inputType["table_output"]["outputList"][i]["allowedValues"] = []; 
          }
          else{
            inputType["table_output"]["outputList"][i]["type"] = "Integer";  
            inputType["table_output"]["outputList"][i]["allowedValues"] = []; 
          }
        }     
        else if(inputType["table_output"]["outputList"][i]["allowedValues"].length > 0){
          inputType["table_output"]["outputList"][i]["type"] = "Enum";  
        }  
        else {
          inputType["table_output"]["outputList"][i]["type"] = "None";
        }    
        inputType["table_output"]["outputList"][i]["description"] = "None";  
        inputType["table_output"]["outputList"][i]["min"] = null;
        inputType["table_output"]["outputList"][i]["max"] = null;
        inputType["table_output"]["outputList"][i]["important"] = false; 
        inputType["table_output"]["outputList"][i]["allowed2"] = [inputType["table_output"]["outputList"][i]["name"]]; 
      }
      inputType["table_output"]["finaloutput"] = [...inputType["table_output"]["outputList"]]
      tempoutputItems = [inputType["table_output"]];
      console.log(tempoutputItems);
    }

    checkAndUpdateModelAttributes(servingprojectid,tempiItems,tempoutputItems,output);
}

function checkAndUpdateModelAttributes(servingprojectid,tempiItems,tempoutputItems,output) {
    ServingProject.findOne({id:servingprojectid}, (err, data) => {
      console.log(err, data);
      console.log("tempiItems");
      console.log(tempiItems);

      var project = data;
      console.log(data);
      var iItems = data.inputAttr;
      for (let i = 0; i < tempiItems.length; i++) {
        iItems[i] = {}; 
        project.inputAttr[i] = {};
        for (var prop in tempiItems[i]) {
          iItems[i][prop] = tempiItems[i][prop];
          project.inputAttr[i][prop] = tempiItems[i][prop];
        }
      }

      var outputItems={};
      for (let i = 0; i < tempoutputItems.length; i++) {
        outputItems[i] = {}; 
        project.outputAttr[i] = {};
        for (var prop in tempoutputItems[i]) {
          outputItems[i][prop] = tempoutputItems[i][prop];
          project.outputAttr[i][prop] = tempoutputItems[i][prop];
        }
      }
      ServingProject.update({id:servingprojectid},project, (err,data) => {
        var subtype = (output.platform && output.platform.toLowerCase()) || output.subtype.toLowerCase();
        ServingModel.update({servingproject:servingprojectid}, {parserOutput: output, subtype:subtype}, (err, sm) => {}, { fetch: true });
      });
    });
}

function socketHandler(command, path, servingid, cb) {
    console.log(servingid);
    var sockets = sails.io.sockets.in("1234567890");
    var socket = sockets.sockets[sails.config.clouderizerconfig.parserSocketId];

    if(socket) {

        if(command=="parser") {
            socket.emit(command, {"zip_path":path, "servingid": servingid});
            socket.on(command+"_ack", (data) => {
                data.success=true;
                console.log(data);
                cb(data);
                sendCommand();        
            });

            socket.on(command+"_err", (err) => {
                console.log(err);
                errObj = {};
                errObj.success = false;
                errObj.message = err;
                cb(errObj);
                delete errObj;
            });
        } else if (command=="pmmlparser") {
            socket.emit(command, {"pmml": path});
            socket.on(command+"_ack", (data) => {
                console.log(data);
                data.success=true;
                cb(data);
                sendCommand();
            });
        }
    } else {
        console.log("Waiting for connection from java client");
    }
}
