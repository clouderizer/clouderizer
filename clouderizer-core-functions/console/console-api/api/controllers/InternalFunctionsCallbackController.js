var H2oParserService = require('../services/H2oParserService');

module.exports = {
  callback: function (req, res) {
    fname = req.params.fname;
    id = req.params.id

    if(fname == undefined || id == undefined) {
      //nothing can be done without these two args
      res.badRequest();
      return;
    }

    switch (fname) {
      case 'parsemodeljava':
        parsemodeljava(id, req, res);
        break;
      case 'h2oparser':
        h2oparser(id, req, res);
        break;
      case 'publishproject':
        publishproject(id, req, res);
        break;
      case 'deployproject':
        deployproject(id, req, res);
        break;
      case 'stopproject':
        stopproject(id, req, res);
        break;
      case 'getprojectstatus':
        getprojectstatus(id, req, res);
        break;
      case 'checkprometheus':
        checkprometheus(id, req, res);
        break;
      case 'queueworker':
        queueworker(id, req, res);
        break;
      default:
        res.badRequest();
        break;
    }
  }
}

function parsemodeljava(servingid, req, res) {
  data = req.body.toString('utf8');
  if(data != undefined)
  {
    output = JSON.parse(data);
    if(output.success == false) {
      ServingModel.update({id:servingid}, {parserOutput: 'Parser error'}, (err, sm) => {                  
      }, { fetch: true });
    } else {
      ServingModel.findOne({id:servingid}, (err, sm) => {
        if(!err && sm) H2oParserService.parseOutputPmml(output,sm.servingproject);;
      });
      // ServingModel.update({id:servingid}, {parserOutput: output, subtype:output.platform.toLowerCase()}, (err, serving_models) => {
      //   if(err || !serving_models || serving_models.length==0) {
      //     console.log(err)                    
      //   }
      //   var sm = serving_models[0];
      //   H2oParserService.parseOutputPmml(output,sm.servingproject);
      // }, { fetch: true });
    }
  }
  res.ok();
}

function h2oparser(servingid, req, res) {
  data = req.body.toString('utf8');
  console.log("parser data", data)
  if(data != undefined)
  {
    output = JSON.parse(data);
    var parse_model = output.parse_model;
    if(!parse_model || parse_model=="") {
      ServingModel.update({id:servingid}, {parserOutput: 'Parser error'}, (err, sm) => {                  
      }, { fetch: true });
    } else {
      ServingModel.findOne({id:servingid}, (err, sm) => {
        if(!err && sm) H2oParserService.parseOutputH2o(output,sm.servingproject);
      });
      // ServingModel.update({id:servingid}, {parserOutput: output, subtype:output.platform.toLowerCase()}, (err, serving_models) => {
      //   if(err || !serving_models) {
      //     console.log(err);                    
      //   }
      //   var sm = serving_models[0];
      //     H2oParserService.parseOutputH2o(output,sm.servingproject);
      // }, { fetch: true });
    }
  }
  res.ok();
}

function publishproject(pprojectid, req, res) {
  data = req.body.toString('utf8');
  console.log("publishproject callback data", data);
  if(data.indexOf("error") != -1) {
    PublishedServingProject.update({id:pprojectid}, {status_message: 'Error while publishing. Please try again!'}, (err, sm) => {     
      console.log(err)             
    }, { fetch: true });
  } else {
  }
  res.ok();
}

function queueworker(transactionid, req, res) {
  console.log(transactionid)
  console.log("queue worker data", req.headers['x-function-status'])
  if(req.headers['x-function-status'].toString() != "200"){
    ServingHistory.findOne({requestid: transactionid},(err, sh) => {
      if(!err && sh){
        if(!sh.output) sh.output = "Something went wrong, please try again!"
        ServingHistory.update({requestid: transactionid}, {duration: req.headers["x-duration-seconds"], status: "Failure", output: sh.output}).fetch().exec((err, sm) => {
          if (err) {
              console.log(err);
          }
        });
      }
    });
  }
  else{
    ServingHistory.update({requestid: transactionid}, {duration: req.headers["x-duration-seconds"]}).fetch().exec((err, sm) => {
      if (err) {
          console.log(err);
      }
    });
    console.log(req.headers['x-function-status'].toString())
  }
  res.ok();
}

function deployproject(pprojectid, req, res) {
  data = req.body.toString('utf8');
  console.log("before data")
  console.log(data);
  console.log("after data")
  if(data.indexOf("error") != -1) {
    PublishedServingProject.update({id:pprojectid}, {status_message: 'Error while deploying.'}, (err, sm) => {     
      console.log(err)             
    }, { fetch: true });
  }
  res.ok();
}

function stopproject(pprojectid, req, res) {
  data = req.body.toString('utf8');
  
  console.log(data);
  //if output string doesnt contain removing, fn is not removed.
  if(data.indexOf("Removing") < 0) {

    console.log("error while stopping. Have a look")
  } else {
    console.log("all ok")
  }
  res.ok();
}

function getprojectstatus(pprojectid, req, res) {
  data = req.body.toString('utf8');
  
  console.log(data);
  //if output string doesnt contain removing, fn is not removed.
  if(data.indexOf("No such function") > -1){
    PublishedServingProject.update({id:pprojectid}, {status_message: 'Project not running'}, (err, sm) => {     
      console.log(err)             
    }, { fetch: true });
  } else if(data.indexOf("Available replicas") < 0) {
    PublishedServingProject.update({id:pprojectid}, {status_message: 'Error in project status'}, (err, sm) => {     
      console.log(err)             
    }, { fetch: true });
  } 
  res.ok();
}

async function checkprometheus(pprojectid, req, res) {
  data = req.body.toString('utf8');
  console.log("prometheus cb data", data);
  if(data.indexOf("error") != -1) {
    console.log("Error while checking prometheus")
  } else {
    // check and stop projects if it exceeds the free quota
    console.log("updating customer data from prometheus")
    var psp = await PublishedServingProject.findOne({id:pprojectid})    
    console.log("fetched data from psp - prom")
    var cus = await Customer.findOne({id: psp.company});
    var user = await User.findOne({company: cus.id});
    var time_sum = parseFloat(cus.time_sum_standard) + parseFloat(cus.time_sum_highmemory)*3 + parseFloat(cus.time_sum_gpu)*10;
    
    console.log(user.email)
    client.users.update({
      email: user.email,
      update_last_request_at: true,
      custom_attributes: {
        Invocations: parseFloat(cus.inv_count) || 0,
        ExecutionTimeStandard: parseFloat(cus.time_sum_standard).toFixed(2) || 0,
        ExecutionTimeHighMemory: parseFloat(cus.time_sum_highmemory).toFixed(2) || 0,
        ExecutionTimeGPU: parseFloat(cus.time_sum_gpu).toFixed(2) || 0
      }
    },(result) => {
      console.log(result.statusCode)
      console.log(result.body.errors)
    });

    if((cus.inv_count > sails.config.clouderizerconfig.invlimit || time_sum > sails.config.clouderizerconfig.execlimit) && (cus.id != '4b721e09-a27e-48ad-9147-dc42acc268e6') && (cus.id != 'bb839974-414c-4219-a17a-04053d3e67e8') && (cus.id != '7c29d6cf-b496-459b-80ae-85ff36941b47')){
      var sprojects = await ServingProject.find({company: psp.company})
       
      for(let i=0; i<sprojects.length; i++){
        PublishedServingProject.find({company:psp.company}).exec((err, psps) => { 
          if(!err && psps && psps.length > 0){
            PublishedFunction.find({psprojectid: psps[i].id}, (err, functions) => {
              if(!err && functions){
                internalfnService.stopproject(psps[i], functions, (err) => {
                  console.log(err);
                });
              }
            });
          }
        })  
      }
    }
  }
  res.ok();
}
