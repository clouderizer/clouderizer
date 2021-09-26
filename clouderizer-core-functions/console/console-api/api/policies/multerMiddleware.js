var uuid = require('uuid');
var AWS = require('aws-sdk');
var multer  = require('multer');
// var multerS3  = require('multer-s3');
// var multerGoogleStorage = require("multer-google-storage");
//var multerGoogleStorage = require("multer-cloud-storage");
// const {Storage} = require('@google-cloud/storage');
// const {Storage} = require('@google-cloud/storage');
// const unggah = require('unggah')

var request = require("request");
var async = require("async");
var multerS3  = require('./multers3');
var internalfnService = require('../services/internalfnService');
const ServingModelController = require('../controllers/ServingModelController');
// const storage = new Storage();

module.exports = async function(req, res, next) {
  if(req.method != 'POST') {
    next();
    return;
  }
  console.log("reqfilesbegin", req.body);

  var myString = req.originalUrl;
  console.log("mystring", myString);
  var myRegexp = /\/api\/async-function\/(.*)\/notebook/g;
  var match = myRegexp.exec(myString);
  if(match && match.length > 0) {
    fname = match[1];
    console.log("fname", fname);
    PublishedFunction.findOne({"name": fname}).populate('psprojectid').exec((err, fn) => {
      if(err) {
        console.log(err);
        res.status(500).send("Error looking up this endpoint");
        return;
      }

      if(myString.indexOf("notebook")==-1 && fn.fn_type!="onnx") {
        console.log("Not notebook or onnx model "+ myString);
        return next();
      }

      if(!fn) {
        console.log("no name");
        res.sendStatus(404);
        return;
      }

      internalfnService.checkprommulter(fn.psprojectid, (err, limitmsg) => {
      if(limitmsg == 'limit exceeded'){
        res.status(200).send("Allocated limit exceeded, contact sales@clouderizer.com for more info.");
        return;
      }
      var transaction_id = uuid.v4().split("-")[0];
      var company_id = fn.psprojectid.company;
      var functionname = fn.psprojectid.name;
      var projectid = fn.psprojectid.servingproject;
      bucket_path = company_id + '/' + projectid + '/' + transaction_id + '/inputs'

      var s3Bucket, globalStorage=true;
      awsconfig = sails.config.clouderizerconfig.servingBucketAWSCreds;
      s3Bucket=sails.config.clouderizerconfig.servingBucket;
      var config = {
        accessKeyId : awsconfig.awsaccessid,
        secretAccessKey : awsconfig.awssecret,
      };

      if(awsconfig.endpoint && awsconfig.endpoint != "") {
        var ep = new AWS.Endpoint("https://storage.googleapis.com/");
        config.endpoint = ep
      }

      if(awsconfig.region && awsconfig.region != "") {
        config.region = awsconfig.region
      }
      
      const s3  = new AWS.S3(config); 
      console.log("ready multer");
      upload = multer({
        storage: multerS3({
          s3: s3,
          bucket: s3Bucket,
          acl: 'projectPrivate',
          cacheControl: 'no-cache',
          contentType: function (req, file, cb){
            cb(null, 'multipart/form-data', null);
          },
          metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
          },
          key: function (req, file, cb) {
            cb(null, bucket_path + '/' + file.originalname)
          }
        }),
        limits: {
          fileSize: 100 * 1024 * 1024, //100 MB
          files: 10
        }
      }).any()

      // var s3  = new AWS.S3(config); 

      // upload = multer({
      //   storage: multerGoogleStorage.storageEngine({
      //     bucket: sails.config.clouderizerconfig.servingBucket,
      //     projectId: 'production-servers-228902',
      //     keyFilename: '/var/openfaas/secrets/gcp-service-key',
      //     filename: (req, file, cb) => {
      //       console.log("file name", file.originalname);
      //       cb(null, bucket_path + '/' + file.originalname);
      //     }
      //   }),
      //   limits: {
      //     fileSize: 100 * 1024 * 1024, //100 MB
      //     files: 10
      //   }
      // }).any()

      // const multer = Multer({
      //   storage: Multer.memoryStorage(),
      //   limits: {
      //     fileSize: 100 * 1024 * 1024, // no larger than 5mb, you can change as needed.
      //   },
      // }).any()

      // const bucket = storage.bucket(s3Bucket);
      

      // const storage = unggah.s3({
      //   endpoint: awsconfig.endpoint,
      //   accessKeyId: awsconfig.awsaccessid,
      //   secretAccessKey: awsconfig.awssecret,
      //   bucketName: s3Bucket,
      //   rename: (req, file) => {
      //     return `${bucket_path}` + '/' + `${file.originalname}`  // this is the default
      //   }
      // })

      // upload = unggah({
      //   storage: storage,
      //   limits: {
      //     fileSize: 100 * 1024 * 1024, //100 MB
      //     files: 10
      //   },
      //   fileFilter: function (req, file, callback) {
      //     callback(null, true)
      //   }
      // }).any()

      // upload = multer({
      //   storage: MulterS3GCS({
      //     s3: s3,
      //     gcsBucket: s3Bucket,
      //     destination: function (req, file, cb) {
      //       cb(null, bucket_path + '/' + file.originalname)
      //     }
      //   }),
      //   limits: {
      //     fileSize: 100 * 1024 * 1024, //100 MB
      //     files: 10
      //   }
      // }).any()

      // const storage = new Storage();

      // const bucket = storage.bucket(s3Bucket);

      // const blob = bucket.file(req.file.originalname);
      // const blobStream = blob.createWriteStream();

      // blobStream.on('error', err => {
      //   next(err);
      // });

      // blobStream.on('finish', () => {

      // Create a new blob in the bucket and upload the file data.
      // const blob = bucket.file(req.file.originalname);
      // const blobStream = blob.createWriteStream();

      // blobStream.on('error', err => {
      //   console.log(err)
      //   res.status(500).send("Error uploading the file.")
      //   return;
      // });

      // blobStream.on('finish', () => {
      //   // The public URL can be used to directly access the file via HTTP.
      //   const publicUrl = format(
      //     `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      //   );
      //   res.status(200).send(publicUrl);
      // });

      
      //});

      //blobStream.on('finish', () => {
      upload(req, res, (err) => {
        if(err) {
          console.log(err)
          res.status(500).send("Error uploading the file.")
          return;
        }
        // console.log("response after upload", res);
        console.log("trsans id", transaction_id)
        const formData = {};
        const headers = {};
        const final_headers = {};
        async.waterfall([
          (next) => {
            if(req.files){
              console.log("req files there");
              for(i=0;i<req.files.length;i++) {
                var f = req.files[i]
                filestore_path = 'filestore://'+transaction_id+'/inputs/'+f.originalname
                formData[f.fieldname] = filestore_path
                file_header = 'x-fileinput-'+f.originalname
                final_headers[file_header] = filestore_path
              }
            }
            next()
          }, 
          (next) => {
            final_headers['x-callback-url'] = req.headers['x-callback-url']
            final_headers['x-transaction-id'] = transaction_id
            headers['x-callback-url'] = req.headers['x-callback-url']
            headers['x-transaction-id'] = transaction_id
            next()
          }, 
          (next) => {
            if(req.body){
              const bodyKeys = Object.keys(req.body)
              if(bodyKeys && bodyKeys.length > 0) {
                for(i=0;i<bodyKeys.length;i++) {
                  formData[bodyKeys[i]] = req.body[bodyKeys[i]]
                }
              }
            }
            next()
          }
        ], (err, result) => {
          console.log("fname in request", functionname)
          request({
            baseUrl: sails.config.clouderizerconfig.serverlessURL,
            uri: functionname + '/notebook',
            headers: headers,
            method: 'POST',
            formData: formData
          }, function(err, response) {
            if(err) {
              console.log("error in upstream", err)
              res.sendStatus(500)
              return;
            }
            console.log("multer callback data", response.statusCode, response.body)
            res.set(final_headers)
            if(response.statusCode == 500 && response.body.includes('server returned non-200 status code (404) for function')){
              res.status(500)
              res.send("Some problem occurred. If project is not stopped, please try again!")
              return;
            }
            else{
              res.status(response.statusCode)
              res.send(response.body)
              var dateFormat = Number(new Date());
              console.log("after request", projectid)
              ServingModel.findOne({"servingproject": projectid}).exec((err, model) => {
                if(!err && model){
                  ServingHistory.create({
                    requestid: transaction_id,
                    timestamp: new Date(dateFormat),
                    input: {},
                    inputFiles: [],
                    company: company_id,
                    model: model.id,
                    status: 'Executing'
                  }, (err, hist) => { 
                      console.log("History create", hist)
                      if(err || !hist) {
                        console.log(err)
                      }
                      return;
                  }, { fetch: true });
                }
              });
            }
          });
        })
      })
      // blobStream.end(req.file.buffer);
    })
    })
  } else {
    next()
  }
};