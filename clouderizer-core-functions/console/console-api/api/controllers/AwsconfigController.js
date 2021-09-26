/**
 * AwsconfigController
 *
 * @description :: Server-side logic for managing awsconfigs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const AWS = require('aws-sdk');
var actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil');
const shortid = require('shortid');
var crypto = require('crypto');
var async = require('async');

module.exports = {

  
  getuploadurl: (req, res, next) => {
    const secret_key=req.body.secret_key;
    const type=req.body.type;
    const filename=req.body.filename;

    ServingModel.findOne({secret_key:secret_key},(err, sm) => {
      if(err || !sm) {
        console.log(err);
        return res.status(500).json({msg:"Couldn't find your model. Check the keys passed!"});
      }

      var s3Bucket;
      var awsconfig, config;
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
      
      const s3  = new AWS.S3(config);      

      var params = {
        Bucket: s3Bucket
      };

      const signedUrlExpireSeconds = 60 * 5;
      if(type=="put") {
        console.log(params);
        s3.headBucket(params, (err, data) => {
          if(data){
            console.log(data);
          }
          if(err) {
            console.log("err in check bucket");
            if(err.code === "NotFound") {
              s3.createBucket(params, function(err, data) {
                if (err) console.log(err, err.stack);
                else {
                  var params = {
                    Bucket: s3Bucket, 
                    CORSConfiguration: {
                      CORSRules: [
                        {
                        AllowedHeaders: [
                            "*"
                        ], 
                        AllowedMethods: [
                            "PUT",
                            "HEAD",
                            "GET", 
                            "POST"
                        ], 
                        AllowedOrigins: [
                            "https://alphaconsole.clouderizer.com",
                            "https://betaconsole.clouderizer.com",
                            "https://showcase.clouderizer.com"
                        ],                        
                        MaxAgeSeconds: 3000
                      }
                      ]
                    }
                  };

                  s3.putBucketCors(params, function(err, data) {
                    if (err) console.log(err); 
                    else {
                      console.log(data);
                      s3.getSignedUrl('putObject', {
                        Bucket: s3Bucket,
                        Key: filename,
                        Expires: signedUrlExpireSeconds
                      }, (err, data) => {
                        if(err) console.log(err);
                        else {
                          console.log(data);
                          res.send({"url":data});
                    }                          
                  });
                  //   }
                  // });
                  
                }
              });
                }
              });
            } else {
              console.log(err.code);
              console.log(err.statusCode);
              console.log(err);
            }
          } else {
            s3.getSignedUrl('putObject', {
              Bucket: s3Bucket,
              Key: filename,
              Expires: signedUrlExpireSeconds
            }, (err, data) => {
              if(err) console.log(err);
              else {
                console.log(data);
                res.send({"url":data});
              }
            });
          }
        });
      //   }   
      //  });
      } else {
        s3.getSignedUrl('getObject', {
          Bucket: s3Bucket,
          Key: filename,
          Expires: signedUrlExpireSeconds
        }, (err, data) => {
          if(err) {
            console.log(err);
            res.json({ success: false, msg: 'Something went wrong when getting presigned url' });
          }
          else {
            console.log("data3");
            console.log(data);
            res.send({"success": true, "urls":[data]});
          }
        });
      }
    });
  },

  getbucket: (req, res , next) => {
    return res.status(200).json({success:true, bucket: sails.config.clouderizerconfig.servingBucket});
  },

  generatepresignedurl: function (req, res, next) {
    const type = req.body.type;
    const ctype = req.body.ctype && req.body.ctype != "" ? req.body.ctype : undefined;
    const myKey = req.body.key;
    var company = req.body.company;
    var modelPublic = req.body.modelPublic;

    console.log(company);
    console.log(type);
    console.log(myKey);
    console.log(modelPublic);
    console.log(ctype)
    
    if(!company) {
      res.status(500);
    }
  
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
    
    console.log(config);
    const s3  = new AWS.S3(config);
    var params = {
      Bucket: s3Bucket
    };

    const signedUrlExpireSeconds = 60 * 5 
    if(type=="put") {
      s3.headBucket(params, (err, data) => {
        if(data){
          console.log(data);
        }
        if(err) {
          console.log("err in check bucket");
          console.log(err)
          if(err.code === "Forbidden") {
            res.json({ success: false, msg: 'S3 access to list and create buckets is forbidden. Please provide access to continue' });
          }
          else if(err.code === "NotFound") {
            s3.createBucket(params, function(err, data) {
              if (err) console.log(err, err.stack);
              else {
                    var params = {
                      Bucket: s3Bucket, 
                      CORSConfiguration: {
                        CORSRules: [
                          {
                          AllowedHeaders: [
                              "*"
                          ], 
                          AllowedMethods: [
                              "PUT",
                              "HEAD",
                              "GET", 
                              "POST"
                          ], 
                          AllowedOrigins: [
                              "https://alphaconsole.clouderizer.com",
                              "https://betaconsole.clouderizer.com",
                              "https://showcase.clouderizer.com"
                          ],                        
                          MaxAgeSeconds: 3000
                        }
                        ]
                      }
                    };

                    s3.putBucketCors(params, function(err, data) {
                      if (err) console.log(err); 
                      else {
                        console.log(data);
                        s3.getSignedUrl('putObject', {
                          Bucket: s3Bucket,
                          Key: myKey,
                          Expires: signedUrlExpireSeconds
                        }, (err, data) => {
                          if(err) console.log(err);
                          else {
                            console.log(data);
                            res.send({"success": true, "urls":[data]});
                      }                          
                    });
                  }
                });
              }
            });
          } else {
            console.log(err.code);
            console.log(err.statusCode);
            console.log(err);
          }
        } else {
          var param = {
            Bucket: s3Bucket,
            Key: myKey,
            Expires: signedUrlExpireSeconds
          }
          if(ctype) {
            param.ContentType = ctype
          }
          s3.getSignedUrl('putObject', param, (err, data) => {
            if(err) {
              console.log("error put")
              console.log(err);
              res.json({ success: false, msg: 'Something went wrong when getting presigned url' });
            }
            else {
              console.log("data2");
              console.log(data);
              res.send({"success": true, "urls":[data]});
            }
          });
        }
      });
    }
    else if(type=="head"){
      var param = {
        Bucket: s3Bucket,
        Key: myKey,
        Expires: signedUrlExpireSeconds
      }
      if(ctype) {
        param.ContentType = ctype
      }
      s3.getSignedUrl('headObject', param, (err, data) => {
        if(err) {
          console.log("error head")
          console.log(err);
          res.json({ success: false, msg: 'Something went wrong when getting presigned url' });
        }
        else {
          console.log("data3");
          console.log(data);
          res.send({"success": true, "urls":[data]});
        }
      });
    } 
    else {
      var param = {
        Bucket: s3Bucket,
        Key: myKey,
        Expires: signedUrlExpireSeconds
      }
      if(ctype) {
        param.ContentType = ctype
      }
      s3.getSignedUrl('getObject', param, (err, data) => {
        if(err) {
          console.log("error get")
          console.log(err);
          res.json({ success: false, msg: 'Something went wrong when getting presigned url' });
        }
        else {
          console.log("data3");
          console.log(data);
          res.send({"success": true, "urls":[data]});
        }
      });
    }
  },

  getlicensefile: function(req, res) {
    var servingmodel = req.body.servingmodel;

    ServingModel.findOne({id:servingmodel}).populate('company').exec((err, sm) => {
      if(sm.company.dai_license_hash) {

        try {
          let algorithm = 'aes256';
          let inputEncoding = 'utf8';
          let outputEncoding = 'hex';
          let aes_key = sails.config.clouderizerconfig.aes_key;

          var decipher = crypto.createDecipher(algorithm, aes_key);
          var deciphered = decipher.update(sm.company.dai_license_hash, outputEncoding, inputEncoding);
          deciphered += decipher.final(inputEncoding);
          
          res.attachment('license.sig');
          res.contentType('application/octet-stream');
          res.send(deciphered);
        } catch(e) {
          res.status(500).json( "Error getting license file!");
        }
        
      } else {
        console.log("No license file");
        res.status(500).json( "No license file!");
      }
    });
  }
};

function sortByKey(array, key) {
  return array.sort(function(a, b) {
      var x = a[key]; var y = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}

function encode(data) {
  var str = data.reduce(function(a,b){ return a+String.fromCharCode(b) },'');
  return Buffer.from(str).toString('base64').replace(/.{76}(?=.)/g,'$&\n');
}

