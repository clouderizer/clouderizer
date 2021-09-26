/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */
var express = require('express');
var path = require('path');
module.exports.routes = {

  //  ╦ ╦╔═╗╔╗ ╔═╗╔═╗╔═╗╔═╗╔═╗
  //  ║║║║╣ ╠╩╗╠═╝╠═╣║ ╦║╣ ╚═╗
  //  ╚╩╝╚═╝╚═╝╩  ╩ ╩╚═╝╚═╝╚═╝
  // 'GET /':  'indexController.indexpage',
  // 'GET /': { 
  //   view:'index', 
  //   locals: {
  //     layout: false
  //   }
  //   },

  // '/dashboard/*': 'indexController.indexpage',
  // '/serving/*': 'indexController.indexpage',
  //'GET /givemeinitshshowcase/:key': 'AuthController.givemeinitshshowcase',
  'GET /givemepythontestenv/:id': 'AuthController.givemepythontestenv',
  'GET /givemepythonscoresh': 'AuthController.givemepythonscoresh',
  'GET /givememachineclientinitsh/:key': 'AuthController.givememachineclientinitsh',
  'POST /givemelambdadockerfile' : 'AuthController.givemelambdadockerfile',
  'POST /givemeawstemplatescli' : 'AuthController.givemeawstemplatescli',
  'GET /givemenodeserveinitsh/': 'AuthController.givemenodeserveinitsh',
  'GET /givemeclish': 'AuthController.givemeclish',
  'GET /givemefaascli': 'AuthController.givemefaasclish',
  'GET /givemefaasclibin': 'AuthController.givemefaasclibin',
  'GET /givemeclipy': 'AuthController.givemeclipy',  
  
  'POST /api/authenticate': 'AuthController.authenticate',
  'POST /api/authenticateOauth': 'AuthController.authenticateOauth',
  'POST /api/auth/registerOauth': 'AuthController.registerOauth',
  'GET /api/logout': 'AuthController.logout',
  'GET /api/testmail': 'AuthController.testmail',
  'POST /api/confirm': 'AuthController.confirm',
  'POST /api/setpassword': 'AuthController.setpassword',
  'POST /api/resetpassword': 'AuthController.resetpassword',
  'POST /api/resendlink': 'AuthController.resendlink',


  'POST /api/awsconfig/getImage': 'AwsconfigController.getImage',
  'POST /api/awsconfig/bestspot': 'AwsconfigController.bestspot',
  'POST /api/awsconfig/generatepresignedurl': 'AwsconfigController.generatepresignedurl',
  'POST /api/awsconfig/getbucket': 'AwsconfigController.getbucket',
  'POST /api/awsconfig/getuploadurl': 'AwsconfigController.getuploadurl',
  'POST /api/awsconfig/getlicensefile': 'AwsconfigController.getlicensefile',
  'POST /api/awsconfig/getinstancestatus': 'AwsconfigController.getinstancestatus',
  
  'POST /api/h2oparse': 'H2oController.h2oparse',
  'POST /api/pmmlparse': 'H2oController.pmmlparse',
  'POST /api/pmml4sparse': 'H2oController.pmml4sparse',
  'POST /api/h2opredict': 'H2oController.h2opredict',
  'POST /api/updatesubtype': 'H2oController.updatesubtype',
  'POST /api/updateservingport': 'H2oController.updateservingport',
  'POST /api/stopinstance': 'H2oController.stopinstance',
  'POST /api/predictionservice/predictiondata': 'H2oController.predictiondata',
  'GET /api/clientsocket/automlparserlongpoll': 'ClientSocketController.automlparserlongpoll',
  
  'GET /api/customer/getbilling': 'CustomerController.getbilling',
  'GET /api/customer/getaccount': 'CustomerController.getaccount',
  'PUT /api/customer/saveprofile/:id': 'CustomerController.saveprofile',
  'POST /api/customer/updateprom': 'CustomerController.updateprom',
  'POST /api/customer/getquota': 'CustomerController.getquota',
  'POST /api/customer/setaccountplan': 'CustomerController.setaccountplan',
  'POST /api/customer/getnbvariables': 'CustomerController.getnbvariables',
  'POST /api/customer/nbvariables': 'CustomerController.updatenbvariables',
  'POST /api/customer/cancelaccountplan': 'CustomerController.cancelaccountplan',
  'POST /api/customer/applycoupon/:coupon': 'CustomerController.applycoupon',
  'POST /api/customer/uploadkagglecreds': 'CustomerController.uploadkagglecreds',
  'POST /api/customer/uploaddaicreds': 'CustomerController.uploaddaicreds',
  'POST /api/customer/clearserviceaccountcreds':'CustomerController.clearserviceaccountcreds',
  'POST /api/customer/uploadserviceaccountcreds': 'CustomerController.uploadserviceaccountcreds', 
  'POST /api/customer/clearkagglecreds': 'CustomerController.clearkagglecreds',
  'POST /api/customer/cleardaicreds': 'CustomerController.cleardaicreds',
  'GET /api/customer': 'CustomerController.getCustomer',
  'GET /api/getlicenseinfo/:customerid': 'CustomerController.getlicenseinfo',
  'POST /api/customer/iaminterested': 'CustomerController.iaminterested',

  'POST /api/user/invite': 'UserController.invite',
  'PUT /api/user/saveprofile/:id': 'UserController.saveprofile',
  'GET /api/user/findpipPackages/:id': 'UserController.findpipPackages',
  'POST /api/user/updatepippackages': 'UserController.updatepippackages',
  'POST /api/user/deletepippackage': 'UserController.deletepippackage',
  'POST /api/user/updatejupyterstatus': 'UserController.updatejupyterstatus',
  'POST /api/user/disable': 'UserController.disable',
  'GET /api/user/listusers': 'UserController.listusers',
  'GET /api/user/listunverified': 'UserController.listunverified',
  'GET /api/user/reinviteall': 'UserController.reinviteall',
  'DELETE /api/user/deleteuser': 'UserController.deleteuser',
  'DELETE /api/user/deleterootfolder': 'UserController.deleterootfolder',
  'GET /api/user': 'UserController.getUser',
  // 'DELETE /api/user': 'UserController.deleteuserbyadmin',

  'GET /api/clientsocket/longpoll': 'ClientSocketController.longpoll',
  'GET /api/clientsocket/machineclientlongpoll': 'ClientSocketController.machineclientlongpoll',
  'GET /api/clientsocket/projstatus': 'ClientSocketController.projstatus',
  'GET /api/clientsocket/publishedprojstatus': 'ClientSocketController.publishedprojstatus',
  
  //Social login
  'GET /api/auth/google': 'AuthController.google',
  'GET /api/auth/github': 'AuthController.github',
  'GET /api/google/callback': 'AuthController.googlecallback',
  'GET /api/github/callback': 'AuthController.githubcallback',

  //Serving
  //'GET /api/servingmodel': 'ServingModelController.getServingModel',
  'POST /api/servingmodel/enableRetrain': 'ServingModelController.enableRetrain',
  'GET /api/servingmodel/generateport': 'ServingModelController.generateport',
  'GET /api/servingprojects': 'ServingProjectController.getServingProject',
  'POST /api/servingproject/deleteproject': 'ServingProjectController.deleteproject',
  'GET /api/servinghistory': 'ServingHistoryController.getServingHistory',
  'POST /api/servinghistory/loadhistory': 'ServingHistoryController.loadhistory',
  'POST /api/servinghistory/nbview': 'ServingHistoryController.nbview',
  'POST /api/servinghistory/multiple': 'ServingHistoryController.multiServingHistory',
  'POST /api/servinghistory/updatehistory': 'ServingHistoryController.updateHistory',
  'POST /api/servinghistory/errorCalculated': 'ServingHistoryController.errorCalculated',
  'POST /api/servinghistory/postmultiple': 'ServingHistoryController.postServingHistory',
  'POST /api/servingmodel/updatestatus': 'ServingModelController.updatestatus',
  'POST /api/servingmodel/shutdown': 'ServingModelController.shutdown',
  'POST /api/servingmodel/updatepippackages': 'ServingModelController.updatepippackages',
  'POST /api/servingmodel/deletepippackage': 'ServingModelController.deletepippackage',
  'POST /api/servingmodel/deleteparseroutput': 'ServingModelController.deleteparseroutput',
  'POST /api/servingmodel/updateErrorMetric': 'ServingModelController.updateErrorMetric',
  'POST /api/servingmodel/updateactual': 'ServingModelController.updateactual',
  'POST /api/servingmodel/updateError': 'ServingModelController.updateError',
  'POST /api/servingmodel/retrain': 'ServingModelController.retrain',
  'GET /api/servingproject/getserverlessurl': 'ServingProjectController.getserverlessurl',
  'POST /api/servingproject/refreshmetrics': 'ServingProjectController.refreshmetrics',
  'POST /api/servingproject/feedback': 'ServingProjectController.postServingProject',
  'POST /api/servingproject/bannerImage': 'ServingProjectController.updateBannerImage',
  'POST /api/servingproject/publishproject': 'ServingProjectController.publishServingProject',
  'POST /api/servingproject/publishprojectlambda': 'ServingProjectController.publishServingProjectLambda',
  'POST /api/servingproject/getprojects': 'ServingProjectController.getprojects',
  'POST /api/servingproject/deployproject': 'ServingProjectController.deployServingProject',
  'POST /api/servingproject/stopproject': 'ServingProjectController.stopServingProject',
  'POST /api/servingproject/parsenotebook': 'ServingProjectController.parsejupyternb',
  'POST /api/servingproject/refreshproject': 'ServingProjectController.getStatusServingProject',
  'POST /api/servingproject/updateprometheus': 'ServingProjectController.updateprometheus',
  'POST /api/servingproject/fetchprojectconfig': 'ServingProjectController.fetchProjectConfig',
  'GET /api/servingproject/fetchuser': 'ServingProjectController.fetchuser',

  'POST /api/publishedservingproject/sendemail': 'PublishedServingProjectController.sendemail',

  'GET /api/versionCheck': 'VersionCheckController.versionCheck',

  'POST /api/ifcallback/:fname/:id': 'InternalFunctionsCallbackController.callback',
  // 'userserving/*': express.static(path.normalize(__dirname + './../assets/dist/frontend')),
  // '/userserving/*': serveStatic(path.join(__dirname, './../assets/dist/frontend')),

  '/serving/*': {
    fn: function(req, res) {
      res.sendFile("index.html", { root: __dirname + "./../../public" });
    },
    skipAssets: false
  },
  // '/serving/*': function(req, res) {
  //     res.sendFile("index.html", { root: __dirname + "./../../public" });
  // },
  '/serving': function(req, res) {
    res.sendFile("index.html", { root: __dirname + "./../../public" });
  },
  '/dashboard/*': {
    fn: function(req, res) {
      res.sendFile("index.html", { root: __dirname + "./../../public" });
    },
    skipAssets: false
  },
  '/dashboard': function(req, res) {
    res.sendFile("index.html", { root: __dirname + "./../../public" });
  },
  '/profile/*': {
    fn: function(req, res) {
      res.sendFile("index.html", { root: __dirname + "./../../public" });
    },
    skipAssets: false
  },
  '/profile': function(req, res) {
    res.sendFile("index.html", { root: __dirname + "./../../public" });
  },
  '/auth/*': {
    fn: function(req, res) {
      res.sendFile("index.html", { root: __dirname + "./../../public" });
    },
    skipAssets: false
  },
  '/auth': function(req, res) {
    res.sendFile("index.html", { root: __dirname + "./../../public" });
  },
  '/settings': function(req, res) {
    res.sendFile("index.html", { root: __dirname + "./../../public" });
  },
  '/settings/*': {
    fn: function(req, res) {
      res.sendFile("index.html", { root: __dirname + "./../../public" });
    },
    skipAssets: false
  },
  '/community': function(req, res) {
    res.sendFile("index.html", { root: __dirname + "./../../public" });
  },
  '/community/*': {
    fn: function(req, res) {
      res.sendFile("index.html", { root: __dirname + "./../../public" });
    },
    skipAssets: false
  },
  '/drive': function(req, res) {
    res.sendFile("index.html", { root: __dirname + "./../../public" });
  },
  '/drive/*': {
    fn: function(req, res) {
      res.sendFile("index.html", { root: __dirname + "./../../public" });
    },
    skipAssets: false
  },
  '/projects': function(req, res) {
    res.sendFile("index.html", { root: __dirname + "./../../public" });
  },
  '/projects/*': {
    fn: function(req, res) {
      res.sendFile("index.html", { root: __dirname + "./../../public" });
    },
    skipAssets: false
  },
  "/givemeshowcasejar": function(req, res, next) {
    res.attachment('unixclient.jar');
    res.sendFile("unixclient.jar", { root: __dirname + "./../assets/inout" });
  },

  "/gettesseract": function (req, res, next) {
    res.attachment('savebucks.tunneluser.pem');
    res.sendFile("savebucks.tunneluser.pem", { root: __dirname + "./../assets/inout" });
  },

  "/givemeparserjar": function(req, res, next) {
    res.attachment("parser.jar");
    res.sendFile("parser.jar", { root: __dirname + "./../assets/inout" });
  },

  "/givemeinitjar": function(req, res, next) {
    res.attachment('clouderizer.jar');
    res.sendFile("clouderizer.jar", { root: __dirname + "./../assets/inout" });
  },

  "/gettesseract": function(req, res, next) {
    res.attachment('savebucks.tunneluser.pem');
    res.sendFile("savebucks.tunneluser.pem", { root: __dirname + "./../assets/inout" });
  },

  "/givemeshowcasesh": function(req, res, next) {
    res.attachment('init.sh');
    res.sendFile("showcase_init.sh", { root: __dirname + "./../assets/inout" });
  },

  "/givemepythonservingclient": function(req, res, next) {
    res.attachment('uds.py');
    res.sendFile("uds.py", { root: __dirname + "./../assets/inout" });
  },
  "/givemeunixclientjar": function (req, res, next) {
    res.attachment('unixclient.jar');
    res.sendFile("unixclient.jar", { root: __dirname + "./../assets/inout" });
  },
  "/givemeinstallservice": function(req, res, next) {
    res.attachment('install_clouderizer_service.sh');
    res.sendFile("install_clouderizer_service.sh", { root: __dirname + "./../assets/inout" });
  },
  "/giveme_machineinitjar": function(req, res, next) {
    res.attachment('machineclient.jar');
    res.sendFile("machineclient.jar", { root: __dirname + "./../assets/inout" });
  },
  "/givemeserviceconf": function(req, res, next) {
    res.attachment('clouderizer.service');
    res.sendFile("clouderizer.service", { root: __dirname + "./../assets/inout" });
  },
  "/givemeserviceconfmac": function(req, res, next) {
    res.attachment('clouderizer.service.plist');
    res.sendFile("clouderizer.service.plist", { root: __dirname + "./../assets/inout" });
  },
  '/': function(req, res) {
    res.sendFile("index.html", { root: __dirname + "./../../public" });
  },
  // "/userserving/*": express.static(path.normalize(__dirname + './../../userserving')),
  "/*": express.static(path.normalize(__dirname + './../../public'))
};
