/**
 * CustomerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const moment = require('moment');
//var ZohoSubscription = require('../services/zohoService');
var crypto = require('crypto');
var fs = require('fs');
var mg = require('../services/mgService');

module.exports = {

  update: function(req, res){
    var id = req.body.id;
    Customer.update({id: id},req.body).fetch().exec((err, pt) => {
      console.log(req.body.phone);
      console.log("updated 4");
      if(err) {
        console.log("updated 5")
        res.status(500).json({success: false, msg: 'Unable to update user details.'});
        console.log(err);
        return;
      }
      console.log("updated 6")
      res.status(200).json({success:true, msg:'Successfully updated the user details.'});
    });
  },

  updatenbvariables: function(req, res){
    if(req.body.type == 'delete'){
      Customer.findOne({id: req.body.customerId}).exec((err, cus)=>{
        if(!err && cus){
          for(var i=0; i<cus.nbvariables.length; i++) {
            if(cus.nbvariables[i]["key"] == req.body.key) {
              cus.nbvariables.splice(i, 1);
              break;
            }
          }
          Customer.update({id: req.body.customerId},{"nbvariables": cus.nbvariables, "savedon": (new Date().getTime() / 1000).toFixed()}).fetch().exec((err, data) => {
            if(!err){
              console.log(data)
              res.status(200).json({success:true, data:data[0].nbvariables});
            }
            else{
              res.status(500).json({success:false, msg:'Error while updating'});
            }
          })
        }
        else{
          res.status(500).json({success:false, msg:'Error while updating'});
        }
      })
    }
    else{
      const iv = "AAAAAAAAAAAAAAAA";
      let algorithm = 'aes-256-cbc';
      let inputEncoding = 'utf8';
      let outputEncoding = 'base64';
      let aes_key = sails.config.clouderizerconfig.aes_key;
      
      var cipher = crypto.createCipheriv(algorithm, Buffer.from(aes_key, "hex"), Buffer.from(iv));
      var ciphered = cipher.update(req.body.value, inputEncoding, outputEncoding);
      ciphered += cipher.final(outputEncoding);
      Customer.findOne({id: req.body.customerId}).exec((err, cus)=>{
        if(!err && cus){
          if(cus.nbvariables) {
            var assigned = false;
            if(req.body.type == 'add'){
              for(var i=0; i<cus.nbvariables.length; i++) {
                if(cus.nbvariables[i]["key"] == req.body.key) {
                  return res.status(500).json({success:false, msg:'Key already exists'});
                }
                else{
                  continue
                }
              }
            }
            else if(req.body.type == 'update'){
              for(var i=0; i<cus.nbvariables.length; i++) {
                if(cus.nbvariables[i]["key"] == req.body.key){
                  cus.nbvariables[i]["value"] = ciphered;
                  assigned = true;
                  break;
                }
                else{
                  continue
                }
              }
            }
            
            if(!assigned) cus.nbvariables.push({"key":req.body.key, "value":ciphered})
          }
          else {
            cus.nbvariables = [{"key":req.body.key, "value":ciphered}]
          }
          Customer.update({id: req.body.customerId},{"nbvariables": cus.nbvariables, "savedon": new Date()}).fetch().exec((err, pt) => {
            if(!err){
              res.status(200).json({success:true, msg:'Successfully updated.'});
            }
            else{
              res.status(500).json({success:false, msg:'Error while updating'});
            }
          })
        }
        else{
          res.status(500).json({success:false, msg:'Error while updating'});
        }
      })
    }
  },

  getnbvariables: function(req, res){
    Customer.findOne({id: req.body.customerId}).exec((err, cus)=>{
      if(!err && cus){
        if(cus.nbvariables && cus.nbvariables.length > 0){
          console.log("nvariables", cus.nbvariables);
          var nbkeyvalues = [];
          const iv = "AAAAAAAAAAAAAAAA";
          let inputEncoding = 'utf8';
          let outputEncoding = 'base64';
          let aes_key = sails.config.clouderizerconfig.aes_key;
          console.log("begin decr")
          for(let i=0; i<cus.nbvariables.length; i++){
            var decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(aes_key, "hex"), Buffer.from(iv));
            var deciphered = decipher.update(cus.nbvariables[i].value, outputEncoding, inputEncoding);
            deciphered += decipher.final(inputEncoding);
            console.log("dcrd", deciphered)
            console.log("dcrd to string", deciphered.toString('utf-8'))
            nbkeyvalues.push({"key": cus.nbvariables[i]["key"], "value": deciphered.toString('utf8')})
          }
          res.status(200).json({success:true, data:nbkeyvalues});
        }
        else{
          res.status(200).json({success:true, data:[]});
        }
      }
      else{
        res.status(500).json({success:false, msg:'Error while updating'});
      }
    })
  },

  getCustomer: function(req, res){
    var email= req.query.email;
    Customer.find({email: email}, (err, matchingRecord) => {
      if (err) return res.serverError(err);
      if(!matchingRecord) return res.notFound('No record found with the specified `name`.');
      if(matchingRecord) res.ok(matchingRecord);
    })
  },

  getquota: function(req, res){
    var custid= req.body.id;
    Customer.find({id: custid}, (err, matchingRecord) => {
      if (err) return res.serverError(err);
      if(!matchingRecord) return res.notFound('No record found with the specified id.');
      if(matchingRecord) res.ok(matchingRecord[0]);
    })
  },

  getbilling: function(req, res) {
    var customer_id = req.body.company;
    if(!req.query) {
      res.status(500).json({ success: false, msg: 'Parameter missing' });
      return;
    }

    var billingmonth = req.query.id;
    var currentmonth = moment(new Date()).format('MMYYYY');
    Customer.findOne({id: customer_id}).populate('plan').exec((err, customer) => {
      CustomerBilling.findOne({company: customer_id, month: billingmonth}).populate('plan').exec((err, cbilling) => {
        if(err || !cbilling) {
          //billing for this month is missing, lets create one and send response
          ComputeBilling(customer, billingmonth, (err, cbilling) => {
            if(err | !cbilling) {
              res.status(500).json(err);
              return;
            }
            CustomerBilling.create(cbilling).fetch().exec((err, new_cbilling) => {
              if(err | !new_cbilling) {
                res.status(500).json({success:false, message: 'Unable to generate billing info'});
                return;
              }
              //inflate the plan data for client
              cbilling.plan = customer.plan;
              res.status(200).json(cbilling);
              return;
            });
          });
          return;
        }
  
        //we found an existing record here
        if(true) {
          //Lets compute again and update the record.
          ComputeBilling(customer, billingmonth, (err, new_billing) => {
            if(err | !new_billing) {
              res.status(500).json(err);
              return;
            }
  
            CustomerBilling.update({company: customer_id, id: cbilling.id}, new_billing).fetch().exec((err, updated_billing) => {
              if(err) {
                res.status(500).json({success:false, message: 'Unable to generate billing info'});
                return;
              }
              
              new_billing.plan = customer.plan;
              res.status(200).json(new_billing);
              return;
            });
          });
          return;
        } else {
          res.status(200).json(cbilling);
          return;
        }
      });
    });
    
  },

  updateprom: function(req,res){
    console.log(" cust function metrics", req.body);
    Customer.update({id: req.body.id}, {inv_count: req.body.inv_count, time_sum_standard: req.body.time_sum_standard, time_sum_highmemory: req.body.time_sum_highmemory, time_sum_gpu: req.body.time_sum_gpu}).fetch().exec((err, cust) => {             
        if(err) {
            console.log("Error in updateprometehus - cust", err);
            res.status(500).json({success: false})
        } else {
            console.log("prometheus cust saved!");
            res.status(200).json({success: true})
        }
    });
  },

  saveprofile: function(req, res){
    Customer.update({id: req.body.id}, req.body).fetch().exec((err, users) => {
      if(err || !users) {
        res.status(500).json( {success: false, msg: 'Error updating profile'});
        return;
      }
      res.status(200).json( {success: true, msg: 'Profile updated successfully'});
    });
  },

  getaccount: function(req, res) {
    var customer_id = req.body.company;
    Customer.findOne({id: customer_id}).populate('plan').populate('parent_company').exec((err, customer) => {
      if(err || !customer) {
        res.status(500).json({success: false, message: 'Unable to fetch customer data'});
      }

      if(!customer.user_addon) {
        customer.user_addon = 1;
      }

      if(!customer.api_addon) {
        customer.api_addon = 0;
      }

      if(customer.parent_company) {
        res.status(200).json({success: true, parent: customer.parent_company});
        return;
      }

      res.status(200).json({success: true, customer: customer});
    });
  },

  uploaddaicreds: function(req, res) {
    var company = req.body.company;
    req.file('file').upload(function (err, files) {
      var file_loc=files[0].fd;
      let algorithm = 'aes256';
      let inputEncoding = 'utf8';
      let outputEncoding = 'hex';

      let aes_key = sails.config.clouderizerconfig.aes_key;

      var text = fs.readFileSync(file_loc);
      
      var cipher = crypto.createCipher(algorithm, aes_key);
      var ciphered = cipher.update(text, inputEncoding, outputEncoding);
      ciphered += cipher.final(outputEncoding);

      Customer.update({id: company}, {
        dai_license_hash: ciphered,
        dai_setup_sa: true
      }).fetch().exec((err, customer) => {
        if(err) {
          res.status(500).json({success: false, message: 'Error saving H2O license.'});
          return;
        }
        console.log("Successfully saved H2O license");
        res.status(200).json({success: true, message: 'Successfully saved H2O license.'});
      });
      
    });
  },

  cleardaicreds: function(req, res) {
    var customer = req.body.company;
    if(customer) {
      Customer.update({id: customer}, {dai_license_hash: '', dai_setup_sa: false}).fetch().exec((err, customers) => {
        if(err) {
          res.status(500).json({ success: false, msg: 'Error clearing DAI credentials.'});
          return;
        }

        res.status(200).json({ success: true, msg: 'Account updated successfully.'});
        
      })
    }
  },

  getlicenseinfo: function(req, res) {
    var customerid = req.params.customerid;
    Customer.findOne({id:customerid}).populate('plan').exec(function(err, customer) {
      if(err || !customer) {
        res.notFound('Unable to find record')
        return;
      }
      res.ok({istrial: customer.istrial, plan: customer.plan.name});
    })
  },

  iaminterested: function(req, res) {
    var customerid = req.body.company;
    var userid = req.body.loggedinuser;
    Customer.findOne({id:customerid},(err, customer) => {
      if(err || !customer) {
        res.serverError('Unable to find record')
        return;
      }
      User.findOne({id:userid}, (err, user) => {
        if(err || !user) {
          res.serverError('Unable to find user');
          return;
        }

        var domainName = sails.config.clouderizerconfig.base_url.split('//')[1].split('.')[0]
        var options = {
          email: 'sales@clouderizer.com',
          subject: `[${domainName}][New Opportunity] User interest in Clouderizer pricing`,
          template: 'pricing_interest',
          url: sails.config.clouderizerconfig.base_url,
          domainName: domainName,
          customer: customer, 
          user: user 
        };
        mg.sendMail(options, (err) => {
          res.ok({success: true});  
        });
      });
    });
  }
};

function ComputeBilling(customer, billingmonth, callback) {
  billingService.ComputeBilling(customer, billingmonth, true, (err, cbilling) => {
    if(err || !cbilling) {
      callback({ success: false, msg: 'Unable to fetch billing info.'}, null);
      return;
    }

    callback(null, cbilling);
    return;
  });
}

