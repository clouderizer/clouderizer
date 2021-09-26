const { Resource$Projects$Histories$Executions$Steps$Perfsampleseries } = require("googleapis/build/src/apis/toolresults/v1beta3");
var request = require("request");

module.exports.parsemodeljava = function(s3url,model_id,cb) {
  callbackURL = sails.config.clouderizerconfig.base_url + 
                sails.config.clouderizerconfig.serverlessCallbackURLPath +
                'parsemodeljava/' + 
                model_id
  payload = {
    "url": s3url
  }
  console.log(callbackURL + " : " + JSON.stringify(payload))
  request({
    baseUrl: sails.config.clouderizerconfig.serverlessURL,
    uri: sails.config.clouderizerconfig.internalfn_pmmlparser,
    headers: {
      "X-Callback-Url" : callbackURL
    },
    method: 'POST',
    json: payload
  }, function(err, response) {
    if(err) {
      cb(err);
      return;
    }
    //Check the HTTP response status Code and see it is a success
    if(response.statusCode < 200 || response.statusCode > 299) {
      cb(err);
    }
    return cb(null);
  });
}

module.exports.h2oparser = function(s3url,model_id,cb) {
  callbackURL = sails.config.clouderizerconfig.base_url + 
                sails.config.clouderizerconfig.serverlessCallbackURLPath +
                'h2oparser/' + 
                model_id
  payload = {
    "url": s3url
  }
  console.log(callbackURL + " : " + payload)
  request({
    baseUrl: sails.config.clouderizerconfig.serverlessURL,
    uri: sails.config.clouderizerconfig.internalfn_h2o,
    headers: {
      "X-Callback-Url" : callbackURL
    },
    method: 'POST',
    json: payload
  }, function(err, response) {
    if(err) {
      cb(err);
      return;
    }
    //Check the HTTP response status Code and see it is a success
    if(response.statusCode < 200 || response.statusCode > 299) {
      cb(err);
    }
    return cb(null);
  });
}

module.exports.onnxparser = function(s3url,model_id,cb) {
  callbackURL = sails.config.clouderizerconfig.base_url + 
                sails.config.clouderizerconfig.serverlessCallbackURLPath +
                'onnxparser/' + 
                model_id
  payload = {
    "url": s3url
  }
  console.log(callbackURL + " : " + payload)
  request({
    baseUrl: sails.config.clouderizerconfig.serverlessURL,
    uri: 'onnxparser',
    headers: {
      "X-Callback-Url" : callbackURL
    },
    method: 'POST',
    json: payload
  }, function(err, response) {
    if(err) {
      cb(err);
      return;
    }
    //Check the HTTP response status Code and see it is a success
    if(response.statusCode < 200 || response.statusCode > 299) {
      cb(err);
    }
    return cb(null);
  });
}

module.exports.parsenotebook = function(notebookdata, cb) {
  payload = {
    "server_url": sails.config.clouderizerconfig.base_url,
    "company": notebookdata.company,
    "file_path": notebookdata.file_path
  }
  base64payload = Buffer.from(JSON.stringify(payload)).toString('base64')
  console.log("in parse notebook")
  request({
    baseUrl: sails.config.clouderizerconfig.serverlessSyncURL,
    uri: sails.config.clouderizerconfig.internalfn_publish,
    method: 'POST',
    body: "parsenotebook " + base64payload
  }, function(err, response) {
    if(err) {
      console.log("error in parsing notebook")
      cb(err, null);
      return;
    }
    if(response.statusCode < 200 || response.statusCode > 299) {
      console.log("parsing response", response)
      return cb("Error parsing notebook. Please try again!", null);
    }
    return cb(null, response.body);
  });
}

module.exports.publishproject = function(pproject, functions, nbvariables, cb) {
  callbackURL = sails.config.clouderizerconfig.base_url + 
                sails.config.clouderizerconfig.serverlessCallbackURLPath +
                'publishproject/' + 
                pproject.id
  //delete functions from pproject
  delete pproject.functions
  payload = {
    "server_url": sails.config.clouderizerconfig.base_url,
    "project": pproject,
    "functions": functions
  }
  if(nbvariables) payload.nbvariables = nbvariables;
  base64payload = Buffer.from(JSON.stringify(payload)).toString('base64')
  console.log(base64payload)
  console.log("in publish project")
  request({
    baseUrl: sails.config.clouderizerconfig.serverlessURL,
    // uri: 'publishproject',
    uri: sails.config.clouderizerconfig.internalfn_publish,
    headers: {
      "X-Callback-Url" : callbackURL
    },
    method: 'POST',
    body: "publish " + base64payload
  }, function(err, response) {
    if(err) {
      console.log("error in publishing")
      cb(err);
      return;
    }
    //Check the HTTP response status Code and see it is a success
    if(response.statusCode < 200 || response.statusCode > 299) {
      console.log("publish request response", response)
      return cb({success: false, message: "Error publishing the project. Please try again!"});
    }
    console.log("publish ok")
    return cb(null);
  });
}

module.exports.deployproject = function(pproject, cb) {
  callbackURL = sails.config.clouderizerconfig.base_url + 
                sails.config.clouderizerconfig.serverlessCallbackURLPath +
                'deployproject/' + 
                pproject.id
  //delete functions from pproject
  delete pproject.functions
  payload = {
    "server_url": sails.config.clouderizerconfig.base_url,
    "project": pproject
  }
  base64payload = Buffer.from(JSON.stringify(payload)).toString('base64')
  request({
    baseUrl: sails.config.clouderizerconfig.serverlessURL,
    // uri: 'publishproject',
    uri: sails.config.clouderizerconfig.internalfn_publish,
    headers: {
      "X-Callback-Url" : callbackURL
    },
    method: 'POST',
    body: "deploy " + base64payload
  }, function(err, response) {
    if(err) {
      cb(err);
      return;
    }
    //Check the HTTP response status Code and see it is a success
    if(response.statusCode < 200 || response.statusCode > 299) {
      return cb({success: false, message: "Error publishing the project. Please try again!"});
    }
    return cb(null);
  });
}

module.exports.stopproject = function(pproject, functions, cb) {
  callbackURL = sails.config.clouderizerconfig.base_url + 
                sails.config.clouderizerconfig.serverlessCallbackURLPath +
                'stopproject/' + 
                pproject.id
  //delete functions from pproject
  delete pproject.functions
  payload = {
    "server_url": sails.config.clouderizerconfig.base_url,
    "project": pproject,
    "functions": functions
  }
  base64payload = Buffer.from(JSON.stringify(payload)).toString('base64')
  request({
    baseUrl: sails.config.clouderizerconfig.serverlessURL,
    // uri: 'publishproject',
    uri: sails.config.clouderizerconfig.internalfn_publish,
    headers: {
      "X-Callback-Url" : callbackURL
    },
    method: 'POST',
    body: "stop " + base64payload
  }, function(err, response) {
    if(err) {
      cb(err);
      return;
    }
    //Check the HTTP response status Code and see it is a success
    if(response.statusCode < 200 || response.statusCode > 299) {
      return cb({success: false, message: "Error stopping the project"});
    }
    return cb(null);
  });
}

module.exports.getprojectstatus = function(pproject, functions, cb) {
  callbackURL = sails.config.clouderizerconfig.base_url + 
                sails.config.clouderizerconfig.serverlessCallbackURLPath +
                'getprojectstatus/' + 
                pproject.id
  //delete functions from pproject
  delete pproject.functions
  payload = {
    "server_url": sails.config.clouderizerconfig.base_url,
    "project": pproject,
    "functions": functions
  }
  base64payload = Buffer.from(JSON.stringify(payload)).toString('base64')
  request({
    baseUrl: sails.config.clouderizerconfig.serverlessURL,
    // uri: 'publishproject',
    uri: sails.config.clouderizerconfig.internalfn_publish,
    headers: {
      "X-Callback-Url" : callbackURL
    },
    method: 'POST',
    body: "getstatus " + base64payload
  }, function(err, response) {
    if(err) {
      cb(err);
      return;
    }
    //Check the HTTP response status Code and see it is a success
    if(response.statusCode < 200 || response.statusCode > 299) {
      return cb({success: false, message: "Error getting project status"});
    }
    return cb(null);
  });
}

module.exports.checkPrometheus=async function(record) {
  console.log(record);
    ServingModel.findOne({id: record["modelid"]}).exec((err, smodel) => {
      if(err || !smodel) {
          console.log("error getting model details from history");   
      }
      else{
        PublishedServingProject.findOne({servingproject: smodel.servingproject})
        .exec((err, pproject) => {
          if(!err){
            prometheus(pproject, (err, result) => {
              if(err) {
                console.log("error checking prometheus");
                return err
                
              } else {
                console.log("checking prometheus");
                return result
              }
            });
          }
          else console.log("error - psp in history");
          return "error in prometheus"
        });
      }
    });
}
module.exports.checkmetrics=function(pproject, cb) {
  var date = new Date();
  var firstday = new Date(date.getFullYear(), date.getMonth(), 1);
  var lastday = new Date(date.getFullYear(), date.getMonth(), 0);
  var month_first = Number(firstday)/1000
  var today = new Date();
  var period=Math.floor((today-firstday)/1000);
  var periodcheck=Math.floor((today-lastday)/1000);

  var query_invocation_count = "ceil(sum(increase(gateway_function_invocation_total%7Bfunction_name%3D%22"+pproject.name+".openfaas-fn%22%7D%5B"+period+"s%5D)))"
  var query_time_sum = "ceil(increase(gateway_functions_seconds_sum%7Bfunction_name%3D%22"+pproject.name+".openfaas-fn%22%7D%5B"+period+"s%5D))"
  
  var cust_query_invocation_count = "ceil(sum(increase(gateway_function_invocation_total%7Bfunction_name%3D~%22"+pproject.name.split('-')[0]+".*.openfaas-fn%22%7D%5B"+period+"s%5D)))"
  var cust_query_time_sum = "ceil(increase(gateway_functions_seconds_sum%7Bfunction_name%3D~%22"+pproject.name.split('-')[0]+".*.openfaas-fn%22%7D%5B"+period+"s%5D))"
  payload = {
    "server_url": sails.config.clouderizerconfig.base_url,
    "project": pproject,
    "period": periodcheck.toString(),
    "month_first":month_first.toString(),
    "companyname": pproject.name.split('-')[0],
    "query_invocation_count": query_invocation_count,
    "query_time_sum": query_time_sum,
    "cust_query_invocation_count":cust_query_invocation_count,
    "cust_query_time_sum":cust_query_time_sum
  }
  console.log(payload);
  base64payload = Buffer.from(JSON.stringify(payload)).toString('base64')

  request({
    baseUrl: sails.config.clouderizerconfig.serverlessSyncURL,
    uri: sails.config.clouderizerconfig.internalfn_publish,
    method: 'POST',
    body: "prometheus " + base64payload
  }, function(err, response) {
    if(err) {
      console.log("internalcheckmetrics1", err, pproject);
      return cb(null);
    }
    if(response.statusCode < 200 || response.statusCode > 299) {
      console.log("internalcheckmetrics2", response.statusCode, pproject);
      return cb(null);
    }
    ServingProject.findOne({id: pproject.servingproject}).exec((err, sproject) =>{
      if(!err && sproject){
        return cb(sproject);
      }
      else{
        console.log("internalcheckmetrics3", err, sproject);
        return cb(null);
      }
    })
  })
}

module.exports.checkprommulter=function(pproject, cb) {
  var date = new Date();
  var firstday = new Date(date.getFullYear(), date.getMonth(), 1);
  var lastday = new Date(date.getFullYear(), date.getMonth(), 0);
  var month_first = Number(firstday)/1000
  var today = new Date();
  var period=Math.floor((today-firstday)/1000);
  var periodcheck=Math.floor((today-lastday)/1000);
  
  var cust_query_invocation_count = "ceil(sum(increase(gateway_function_invocation_total%7Bfunction_name%3D~%22"+pproject.name.split('-')[0]+".*.openfaas-fn%22%7D%5B"+period+"s%5D)))"
  var cust_query_time_sum = "ceil(increase(gateway_functions_seconds_sum%7Bfunction_name%3D~%22"+pproject.name.split('-')[0]+".*.openfaas-fn%22%7D%5B"+period+"s%5D))"
  payload = {
    "server_url": sails.config.clouderizerconfig.base_url,
    "project": pproject,
    "period": periodcheck.toString(),
    "month_first":month_first.toString(),
    "companyname": pproject.name.split('-')[0],
    "cust_query_invocation_count":cust_query_invocation_count,
    "cust_query_time_sum":cust_query_time_sum
  }
  console.log(pproject.name)
  base64payload = Buffer.from(JSON.stringify(payload)).toString('base64')

  request({
    baseUrl: sails.config.clouderizerconfig.serverlessSyncURL,
    uri: sails.config.clouderizerconfig.internalfn_publish,
    method: 'POST',
    body: "prometheus_multer " + base64payload
  }, function(err, response) {
    if(err) {
      cb(err, null);
      return;
    }
    if(response.statusCode < 200 || response.statusCode > 299) {
      return cb({success: false, message: "Error checking prometheus"}, null);
    }

    console.log("updating customer data from prometheus")
    Customer.findOne({id: pproject.company}).exec((err, cus) => { 
      if(err){
        return cb(err, null)
      }

      cb(null, "All good.")
      return;
    });
  })  
}

prometheus = function(pproject, cb) {
  callbackURL = sails.config.clouderizerconfig.base_url + 
                sails.config.clouderizerconfig.serverlessCallbackURLPath +
                'checkprometheus/' + 
                pproject.id
  //delete functions from pproject
  delete pproject.functions
  var date = new Date();
  var firstday = new Date(date.getFullYear(), date.getMonth(), 1);
  var lastday = new Date(date.getFullYear(), date.getMonth(), 0);
  var month_first = Number(firstday)/1000
  var today = new Date();
  var period=Math.floor((today-firstday)/1000);
  var periodcheck=Math.floor((today-lastday)/1000);

  var query_invocation_count = "ceil(sum(increase(gateway_function_invocation_total%7Bfunction_name%3D%22"+pproject.name+".openfaas-fn%22%7D%5B"+period+"s%5D)))"
  var query_time_sum = "ceil(sum(increase(gateway_functions_seconds_sum%7Bfunction_name%3D%22"+pproject.name+".openfaas-fn%22%2Cinfra_type%3D%22standard%22%7D%5B"+period+"s%5D)))"
  var query_time_sum = "ceil(increase(gateway_functions_seconds_sum%7Bfunction_name%3D%22"+pproject.name+".openfaas-fn%22%7D%5B"+period+"s%5D))"
  var cust_query_invocation_count = "ceil(sum(increase(gateway_function_invocation_total%7Bfunction_name%3D~%22"+pproject.name.split('-')[0]+".*.openfaas-fn%22%7D%5B"+period+"s%5D)))"
  var cust_query_time_sum= "ceil(increase(gateway_functions_seconds_sum%7Bfunction_name%3D~%22"+pproject.name.split('-')[0]+".*.openfaas-fn%22%7D%5B"+period+"s%5D))"
  payload = {
    "server_url": sails.config.clouderizerconfig.base_url,
    "project": pproject,
    "period": periodcheck.toString(),
    "month_first":month_first.toString(),
    "companyname": pproject.name.split('-')[0],
    "query_invocation_count": query_invocation_count,
    "query_time_sum": query_time_sum,
    "cust_query_invocation_count":cust_query_invocation_count,
    "cust_query_time_sum":cust_query_time_sum
  }
  console.log(payload)
  base64payload = Buffer.from(JSON.stringify(payload)).toString('base64')
  request({
    baseUrl: sails.config.clouderizerconfig.serverlessURL,
    // uri: 'publishproject',
    uri: sails.config.clouderizerconfig.internalfn_publish,
    headers: {
      "X-Callback-Url" : callbackURL
    },
    method: 'POST',
    body: "prometheus " + base64payload
  }, function(err, response) {
    if(err) {
      cb(err);
      return;
    }
    //Check the HTTP response status Code and see it is a success
    if(response.statusCode < 200 || response.statusCode > 299) {
      return cb({success: false, message: "Error checking prometheus"});
    }
    return cb(null);
  });
}