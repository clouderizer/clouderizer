/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var fs = require('fs');
var uuid = require('uuid');
var extractValues = require("extract-values");
var mg = require('../services/mgService');

var recaptchaService = require('../services/recaptchaService');
var passport = require('passport');
var countries = require("i18n-iso-countries");
var async = require('async');
const { config } = require('process');


module.exports = {
	authenticate: function(req, res) {
    console.log("in auth")
    var email = req.param('email');
    var password = req.param('password');

    if (!email || !password) {
      req.session.destroy();
      res.clearCookie('sails.sid');
      return res.status(401).json({err: 'username and password required'});
    }

    req.session.regenerate(function(err) {
      User.findOne({email: email}).populate('company').populate('parent_company').exec(function(err, user) {
        if (!user) {
          req.session.destroy();
          res.clearCookie('sails.sid');
          return res.status(401).json({err: 'User is not registered'});
        }

        console.log(user);
        if(user.status == 'Disabled') {
          req.session.destroy();
          res.clearCookie('sails.sid');
          return res.status(401).json({err: 'Account disabled. Please contact your account administrator or support@clouderizer.com'});
        }
  
        if(user.status == 'Unverified') {
          req.session.destroy();
          res.clearCookie('sails.sid');
          return res.status(401).json({err: 'Account unverified. In case you did not receive verification email, please check your SPAM folder or contact support@clouderizer.com'});
        }
  
        User.validPassword(password, user, function(err, valid) {
          if (err) {
            req.session.destroy();
            res.clearCookie('sails.sid');
            return res.status(401).json({err: 'Some error has occured. Please login again.'});
          }
  
          if (!valid) {
            req.session.destroy();
            res.clearCookie('sails.sid');
            return res.status(401).json({err: 'Invalid username or password'});
          } else {
            user.company.planName = sails.config.clouderizerconfig.license;
            req.session.uid = user.id;
            req.session.cid = user.company.id;
            delete user.password;
            delete user.encryptedpwd;
            if(!req.session.accountexpired) {
              //dont give auth cookie if trial is expired so that tunneling is prohibited
              res.cookie('refreshrate', "89345123765", {httpOnly: true});
            }

            delete user.company.gcp_service_account_hash;
            delete user.company.gcp_shared_service_account_encrypted;
            delete user.company.gcp_temp_token;
            const sailsToken  = sailsTokenAuth.issueToken({uid: user.id, cid: user.company.id});
            const cliToken  = sailsTokenAuth.issueCLIToken({uid: user.id, cid: user.company.id}, user.company.name, user.name, user.company.id, user.id);
            user.token = sailsToken;
            user.clitoken = cliToken;
            res.json({success: true, user: user, token: sailsToken});

            User.update({id: user.id}, {token:sailsToken, clitoken: cliToken}).fetch().exec((err, smuser) =>{
              if(err && !smuser) {
                console.log("Error updating jwt token to user model authenticate!");
              }
            });
          }
        });
      })
    })
  },

  authenticateOauth: function(req, res) {
    var email = req.body.email;
    
      //if no new params passed and existing session was already there, log them in
    console.log(req.session);
    req.session.regenerate(function(err) {
      // will have a new session here
      
      console.log("email");
      console.log(email);
      User.findOne({email: email}).populate('company').populate('parent_company').exec(function(err, user) {
        console.log(user);
        if(err){
          console.log(err);
          return;
        }

        if(user.status == 'Disabled') {
          req.session.destroy();
          res.clearCookie('sails.sid');
          return res.status(401).json({err: 'Account disabled. Please contact your account administrator or support@clouderizer.com'});
        }
  
        if(user.status == 'Unverified') {
          req.session.destroy();
          res.clearCookie('sails.sid');
          return res.status(401).json({err: 'Account unverified. In case you did not receive verification email, please check your SPAM folder or contact support@clouderizer.com'});
        }
      
        user.company.planName = sails.config.clouderizerconfig.license;
        req.session.uid = user.id;
        req.session.cid = user.company.id;
        console.log("uid and cid details")
        console.log(req.session.uid)
        console.log(req.session.cid)
        delete user.password;
        delete user.encryptedpwd;
        if(!req.session.accountexpired) {
          //dont give auth cookie if trial is expired so that tunneling is prohibited
          res.cookie('refreshrate', "89345123765", {httpOnly: true});
        }

        delete user.company.gcp_service_account_hash;
        delete user.company.gcp_shared_service_account_encrypted;
        delete user.company.gcp_temp_token;
        console.log("before sending user");
        console.log(user);

        const sailsToken = sailsTokenAuth.issueToken({uid: user.id, cid: user.company.id});
        const cliToken = sailsTokenAuth.issueCLIToken({uid: user.id, cid: user.company.id});
        user.token = sailsToken;
        user.clitoken = cliToken;
        res.json({success: true, user: user, token: sailsToken});
        User.update({id: user.id}, {token:sailsToken}).fetch().exec((err, smuser) =>{
          if(err && !smuser) {
            console.log("Error updating jwt token to user model authenticateOAuth!");
          }
        });
      })
    });
  },

  google: function(req, res, next){
    const source = req.query.source;
    console.log(source);
    if(source && source=="cli") req.session.source="cli";
    else req.session.source="ui";
    console.log("entering google auth passport");
    console.log(req.headers.host);
    console.log(sails.config.proxyHost);
    passport.authenticate('google', { failureRedirect: '/auth/login', scope: ['email', 'https://www.googleapis.com/auth/userinfo.profile']
    })(req, res, next);
  },

  github: function(req, res, next){
    console.log("entering github auth passport");
    passport.authenticate('github', { failureRedirect: '/auth/login', scope: 'user:email'})(req, res, next);
  },

  googlecallback: function(req, res, next){
    console.log(req.session);
    console.log("passport google auth")
    passport.authenticate('google', function(err, user) {
      if(err) {
        // redirect to login page
        res.redirect('/auth/login?message=error');
        console.log('google callback error: '+err);
      } else {
        console.log('google credentials');
        console.log(user);
        var email = user.email;
        if(user.registered){
          res.redirect('/auth/login?message=success&email=' + email+'&source=' + req.session.source);
        }
        else{
          res.redirect(`/auth/login?id=${user.company}&message=detailspending&email=` + email+'&source=' + req.session.source);
        }
        
      }
    })
    (req, res, next); 
  },

  githubcallback: function(req, res, next){
    passport.authenticate('github', function(err, user) {
      if(err){
        res.redirect('/auth/login?message=error');
        console.log('github callback error: '+err);
      }
      else{
        console.log('github credentials');
        console.log(user);
        var email = user.email;
        if(user.registered){
          res.redirect('/auth/login?message=success&email=' + email);
        }
        else{
          res.redirect(`/auth/login?id=${user.company}&message=detailspending&email=` + email);
        }
      }
    })
    (req, res, next); 
  },

  logout: function(req, res) {
    req.session.destroy((err) => {
      res.clearCookie('sails.sid');
      return res.status(401).json({err: 'Logged out'});
    });
  },

  registerOauth: function(req, res){
    var country = countries.getName(req.body.countryCode, "en");
    Customer.update({id: req.body.id}, {name: req.body.name, phone: req.body.phone, organisation_type: req.body.organisation_type, country: country}).fetch().exec((err, cust) => {
      if (err) {
        console.log(err);
        res.status(500).json({success: false, msg: 'Something went wrong while storing customer details.'})
      }
      if(cust){
        User.update({email: req.body.email}, {registered: true}).fetch().exec((err, user) =>{
          if(user){
            res.json({success: true});
            if(sails.config.clouderizerconfig.notifyregstrationmail) {
              var domainName = sails.config.clouderizerconfig.base_url.split('//')[1].split('.')[0]
              var our_options = {
                template: 'newregistration',
                subject: `${domainName}: New Account Registered`,
                email: 'sales@clouderizer.com',
                url: sails.config.clouderizerconfig.base_url,
                domainName: domainName,
                customer: cust[0], 
                user: user[0]
              };
              mg.sendMail(our_options, (err) => {
              })

              var options = {
                template: 'signup',
                subject: 'Welcome aboard!',
                email: user[0].email
              };
              mg.sendMail(options, (err) => {
              });
            }
          }
          else{
            res.status(500).json({success: false, msg: 'Something went wrong while storing user details.'})
          }
        })
      }
  });
  },

  register: function(req, res) {
    
    console.log("entered in register controller");
          User.findOne({email: req.body.email}, (err, user) => {
            if(err) {
              res.status(500).json({success: false, msg: 'Some error occured.'});
              return;
            }
      
            if(user) {
              res.status(500).json({success: false, msg: 'Email already registered'});
              return;
            }
            var country = countries.getName(req.body.countryCode, "en");
            var cus_obj = {
              name: req.body.cname,
              phone: req.body.phone,
              country: country,
              organisation_type: req.body.organisation_type
            };
    
            Customer.create(cus_obj).fetch().exec(function(err, Customer) {
              if(err) {
                res.status(err.status).json({err: err});
                return;
              }
        
              if(Customer) {
                User.create({
                  name: req.body.name, 
                  email: req.body.email, 
                  password: req.body.password,
                  type: 'Account Owner',
                  status: 'Unverified',
                  company: Customer.id
                }).fetch().exec(function(err, user) {
                  if (err) {
                    res.status(err.status).json({err: err});
                    return;
                  }
                  if (user) {
                    var clink = sails.config.clouderizerconfig.base_url +
                    '/auth/confirm?u=' + user.verification_guid;
                    //send mail here
                    var options = {
                      template: 'newuser',
                      subject: 'Email Verification',
                      email: req.body.email,
                      confirmationLink: clink
                    };
                    mg.sendMail(options, (err) => {
                      res.json({success: true, user: user});
                    });
                    
                    if(sails.config.clouderizerconfig.notifyregstrationmail) {
                      var domainName = sails.config.clouderizerconfig.base_url.split('//')[1].split('.')[0]
                      var our_options = {
                        template: 'newregistration',
                        subject: `${domainName}: New Account Registered`,
                        email: 'sales@clouderizer.com',
                        url: sails.config.clouderizerconfig.base_url,
                        domainName: domainName,
                        customer: Customer, 
                        user: user 
                      };
                      mg.sendMail(our_options, (err) => {
    
                      })
                    }
                    
                  } else {
                    return res.status(500).json({err: 'Error creating user. Please contact support@clouderizer.com for assistance.'});
                  }
                });
              } else {
                return res.status(500).json({err: 'Error registering account. Please contact support@clouderizer.com for assistance.'});
              }
            });
          });
  },

  confirm: function(req, res) {
    var vguid = req.query.u;
    User.findOne({verification_guid: vguid}, (err, user) => {
      if(err || !user) {
        res.status(404).json({success: false, msg: 'Unable to verify email.'});
        return;
      }

      if(user.status != 'Unverified') {
        return res.status(500).json({success: false, msg: 'Account already verified.'});
      }

      user.status = 'Active';
      async.waterfall([
        (next) => {
          if(!user.encryptedpwd) {
            var password = req.body.password;
            if(password) {
              User.generateHash(password, (err, hash) => {
                if(err || !hash) {
                  res.status(500).json({success: false, msg: 'Error verifying email.'});
                  return;
                }
                user.encryptedpwd = hash;
                next();
              });
            } else {
              res.status(500).json({success: false, msg: 'Please set a password for activating account', needpassword: true});
              return;
            }
          } else {
            next();
          }
        }
      ], (err, result) => {
        //unset the verification guid
        user.verification_guid = '';
        User.update({id: user.id}, user).fetch().exec((err, upd_user) => {
          if(err || !upd_user) {
            res.status(500).json({success: false, msg: 'Error verifying email.'});
            return;
          }
          var options = {
            template: 'signup',
            subject: 'Welcome aboard!',
            email: user.email
          };
          mg.sendMail(options, (err) => {
            res.status(200).json({success: true, msg: 'Successfully verified email. Please login to portal now.', type: upd_user.type});
          });
        });
      });
    })
  },

  testmail: function(req, res) {
    var email = req.query.email;
    var template = req.query.template;
    //send mail here
    var options = {
      template: template,
      subject: 'Welcome aboard!',
      email: email
    };
    mg.sendMail(options, (err, body) => {
      res.send(body);
    });
  },

  givemeclish: (req, res) => {

    fs.readFile(__dirname + '/../../assets/inout/cli.sh', function(err, data) {
      if (err) {
        res.send(404);
        return;
      } else {
        res.attachment('cli.sh');
        res.contentType('application/octet-stream');

        data=data.toString();
        data=data.replace("#BASE_URL#",sails.config.clouderizerconfig.base_url);
        data=data.replace("#FILE_NAME#","cldz_cli.py");
        res.send(data);
      }
    });
  },

  givemelambdadockerfile: (req, res) => {

    var type = req.body.type;

    fs.readFile(__dirname + '/../../assets/inout/'+type, function(err, data) {
      if (err) {
        console.log("givemelambdadockerfile: ",err);
        res.send(404);
        return;
      } else {
        res.attachment(type);
        res.contentType('application/octet-stream');
        res.send(data);
      }
    });
  },

  givemeawstemplatescli: (req, res) => {
    var name = req.body.name;

    fs.readFile(__dirname + '/../../assets/inout/aws_templates/'+name, function(err, data) {
      if (err) {
        console.log("givemeawstemplatescli: ",err);
        res.send(404);
        return;
      } else {
        res.attachment(name);
        res.contentType('application/octet-stream');
        res.send(data);
      }
    });
  },

  givemefaasclish: (req, res) => {

    fs.readFile(__dirname + '/../../assets/inout/install_faas_cli.sh', function(err, data) {
      if (err) {
        res.send(404);
        return;
      } else {
        res.attachment('install_faas_cli.sh');
        res.contentType('application/octet-stream');

        data=data.toString();
        data=data.replace("#BASE_URL#",sails.config.clouderizerconfig.base_url);
        res.send(data);
      }
    });
  },

  givemefaasclibin: (req, res) => {

    fs.readFile(__dirname + '/../../assets/inout/faas-cli', function(err, data) {
      if (err) {
        res.send(404);
        return;
      } else {
        res.attachment('faas-cli');
        res.contentType('application/octet-stream');
        res.send(data);
      }
    });
  },

  givemeclipy: (req, res) => {

    fs.readFile(__dirname + '/../../assets/inout/cli.py', function(err, data) {
      if (err) {
        res.send(404);
        return;
      } else {
        res.attachment('cli.py');
        res.contentType('application/octet-stream');

        data=data.toString();
        data=data.replace("#BASE_URL#",sails.config.clouderizerconfig.base_url);
        data=data.replace("#SYNC_URL#",sails.config.clouderizerconfig.serverlessSyncURL);
        res.send(data);
      }
    });
  },

  givemeinitsh2: function(req, res) {
    var key = req.params.key;
    Project.findOne({key: key}).populate('company').exec(function(err, project) {
      if(err || !project) {
        res.send(404);
        return;
      }

      //let's read the file
      fs.readFile(__dirname + '/../../assets/inout/clouderizer_init.sh', function(err, data) {
        if (err) {
            res.send(404);
            return;
        } else {
          res.attachment('clouderizer_init.sh');
          res.contentType('application/octet-stream');
          prepareinitsh(data, project, key, (err, filedata) => {
            if(err || !filedata) {
              res.send(500);
              return;
            }

            res.send(filedata);
          });
        }
      });
    });
  },

  givemecolabinitsh: function(req, res) {
    var key = req.params.key;
    Project.findOne({key: key}).populate('company').exec(function(err, project) {
      if(err || !project) {
        res.send(404);
        return;
      }

      //let's read the file
      fs.readFile(__dirname + '/../../assets/inout/colab_init.sh', function(err, data) {
        if (err) {
            res.send(404);
            return;
        } else {
          res.attachment('colab_init.sh');
          res.contentType('application/octet-stream');
          prepareinitsh(data, project, key, (err, filedata) => {
            if(err || !filedata) {
              res.send(500);
              return;
            }
            res.send(filedata);
          });
        }
      });
    });
  },

  givemedockerinitsh: function(req, res) {
    var key = req.params.key;
    Project.findOne({key: key}).populate('company').exec(function(err, project) {
      if(err || !project) {
        res.send(404);
        return;
      }

      //let's read the file
      fs.readFile(__dirname + '/../../assets/inout/docker_init.sh', function(err, data) {
        if (err) {
            res.send(404);
            return;
        } else {
          res.attachment('docker_init.sh');
          res.contentType('application/octet-stream');
          prepareinitsh(data, project, key, (err, filedata) => {
            if(err || !filedata) {
              res.send(500);
              return;
            }

            res.send(filedata);
          });
        }
      });
    });
  },

  givemeinitsh: function(req, res) {
    var key = req.params.key;
    Project.findOne({key: key}).populate('company').exec(function(err, project) {
      if(err || !project) {
        res.send(404);
        return;
      }

      //let's read the file
      fs.readFile(__dirname + '/../../assets/inout/clouderizer_init.sh', function(err, data) {
        if (err) {
            res.send(404);
            return;
        } else {
          res.attachment('clouderizer_init.sh');
          res.contentType('application/octet-stream');
          prepareinitsh2(data, project, key, (err, filedata) => {
            if(err || !filedata) {
              res.send(500);
              return;
            }

            res.send(filedata);
          });
        }
      });
    });
  },

  givemepythontestenv: function (req, res) {
    console.log(req.params.id)
    var id = req.params.id;
    User.findOne({id: id}).exec(function(err, sm) {
      if(err || !sm) {
        res.send(404);
        return;
      }

      //let's read the file
      fs.readFile(__dirname + '/../../assets/inout/thebelab.sh', function(err, data) {
        if (err) {
            res.send(404);
            return;
        } else {
          res.attachment('thebelab.sh');
          res.contentType('application/octet-stream');
          preparejupyterlab(data, sm, 3434, (err, filedata) => {
            if(err || !filedata) {
              res.send(500);
              return;
            }

            res.send(filedata);
          });
        }
      });      
    });
  },

  givemepythonscoresh: function (req, res) {
    fs.readFile(__dirname + '/../../assets/inout/pythonscore_init.sh', function(err, data) {
      if (err) {
          res.send(404);
          return;
      } else {
        res.attachment('pythonscore_init.sh');
        res.contentType('application/octet-stream');
        res.send(data.toString());
      }
    });
  },

  givememachineclientinitsh: function(req, res) {
    var key = req.params.key;
    Project.findOne({key: key}).populate('company').exec(function(err, project) {
      if(err || !project) {
        res.send(404);
        return;
      }

      //let's read the file
      fs.readFile(__dirname + '/../../assets/inout/machineclient_init.sh', function(err, data) {
        if (err) {
            res.send(404);
            return;
        } else {
          console.log("Call for machineclient_init.sh");
          res.attachment('machineclient_init.sh');
          res.contentType('application/octet-stream');
          prepareinitsh2(data, project, key, (err, filedata) => {
            if(err || !filedata) {
              res.send(500);
              return;
            }

            res.send(filedata);
          });
        }
      });
    });
  },

  givemenodeserveinitsh: (req, res) => {

    fs.readFile(__dirname + '/../../assets/inout/nodeserveinit.sh', function(err, data) {
      if (err) {
          res.send(404);
          return;
      } else {
        console.log("Call for nodeserveinit.sh");
        res.attachment('nodeserveinit.sh');
        res.contentType('application/octet-stream');

        var strdata = bindata.toString();
        strdata = strdata.replace(new RegExp("#SERVING_ID#", 'g'), "random");
        res.send(strdata);
      }
    });
  },

  givemekagglecookie: function(req, res) {
    var key = req.params.key;
    Project.findOne({key: key}).populate('company').exec(function(err, project) {
      if(err || !project) {
        res.send(404);
        return;
      }

      if(!project.company.kaggle_credentials || project.company.kaggle_credentials == ''){
        res.send(404);
        return;
      }

      res.attachment('kaggle.json');
      res.contentType('application/octet-stream');
      res.send(project.company.kaggle_credentials);
    });
  },

  givemeinitshmac: function(req, res) {
    var key = req.params.key;
    Project.findOne({key: key}, (err, project) => {
      if(err || !project) {
        res.send(404);
        return;
      }

      //let's read the file
      fs.readFile(__dirname + '/../../assets/inout/clouderizer_init_mac.sh', function(err, data) {
        if (err) {
            res.send(404);
            return;
        } else {
          res.attachment('clouderizer_init.sh');
          res.contentType('application/octet-stream');
          prepareinitsh2(data, project, key, (err, filedata) => {
            if(err || !filedata) {
              res.send(500);
              return;
            }

            res.send(filedata);
          });
        }
      });
    });
  },

  givemecolabinit: function(req, res) {
    fs.readFile('assets/files/colab.py', function(err, data) {
      if (err) {
          res.send(404);
          return;
      } else {
        res.attachment('colab.py');
        res.contentType('application/octet-stream');
        res.send(data);
        return;
      }
    });
  },

  setpassword: function(req, res) {
    var oldpwd = req.body.opwd;
    var newpwd = req.body.newpwd;
    var verification_guid = req.body.verification_guid;
    var uid = null;
    if(req.session && req.session.uid) {
      uid = req.session.uid;
    } else if(req.token && req.token.uid) {
      uid = req.token.uid;
    }

    if(!newpwd || newpwd == '') {
      res.status(500).json({success:false, msg: 'Invalid new password value.'})
      return;
    }
    
    if(oldpwd && oldpwd != '' && uid && uid != '') {
      User.findOne({id: uid}, (err, user) => {
        if(err || !user) {
          res.status(500).json({success:false, msg: 'Error retrieving user details.'})
          return;
        }

        User.validPassword(oldpwd, user, (err,  valid) => {
          if (err) {
            return res.status(500).json({err: 'Error validating old password.'});
          }
  
          if (!valid) {
            return res.status(500).json({err: 'Invalid Old password.'});
          } else {
            updatePassword(newpwd, user, res);
          }
        });
      });
    } else if(verification_guid && verification_guid != '') {
      User.findOne({verification_guid: verification_guid}, (err, user) => {
        if(err || !user) {
          res.status(500).json({success:false, msg: 'Error retrieving user details.'})
          return;
        }

        updatePassword(newpwd, user, res);
      });
    } else {
      res.status(500).json({success:false, msg: 'Invalid parameters'})
      return;
    }
  },

  resetpassword: function(req, res) {
    var email = req.body.email;

    if(!email || email == '') {
      return res.status(500).json({success:false, msg: 'Invalid details.'})
    }

    User.findOne({email: email}, (err, user) => {
      if(err || !user) {
        return res.status(500).json({success:false, msg: 'Email not registered with Clouderizer.'})
      }

      if(user.status == 'Unverified') {
        return res.status(403).json({ success: false, msg: 'Account not verified yet. In case you did not receive verification mail, please check your Inbox spam folder or contact support@clouderizer.com'})
      }

      //otherwise generate verification guid and send mail
      user.verification_guid = uuid.v4();
      User.update({id:user.id}, user).fetch().exec((err, users) => {
        if(err || !users) {
          return res.status(500).json({success:false, msg: 'Some error occured. Please contact us at support@clouderizer.com for help.'});
        }

        if(users.length != 1) {
          return res.status(500).json({success:false, msg: 'Something went wrong. Please contact us at support@clouderizer.com for help.'});
        }

        var user = users[0];
        var clink = sails.config.clouderizerconfig.base_url +
        '/auth/resetpwd?u=' + user.verification_guid;
        //send mail here
        var options = {
          template: 'forgotpassword',
          subject: 'Reset your Clouderizer password',
          email: req.body.email,
          confirmationLink: clink
        };
        mg.sendMail(options, (err) => {
          res.json({success: true});
        });
      })
    });
  },

  resendlink :function(req,res)
  { 
    user_email = req.body.email;
    console.log(user_email);
    User.findOne({email: user_email}, (err, u) => {
      if(err || !u) 
      {
        return res.status(500).json({success:false, msg: 'Some error occured. Please contact us at support@clouderizer.com for help.'});
      }
      //clink is the Confirmation link to be sent to the User.
      var clink = sails.config.clouderizerconfig.base_url +
                  '/auth/confirm?u=' + u.verification_guid;
      //send mail here
      var options = {
        template: 'newuser',
        subject: 'Email Verification',
        email: user_email,
        confirmationLink: clink
      };
      mg.sendMail(options, (err) => {
        res.json({success: true, user: u});
      });            
    })
  }  
};

function prepareinitsh2(bindata, project, key, cb) {
  var strdata = bindata.toString();
  strdata = strdata.replace(new RegExp("#PROJECT_KEY#", 'g'), key);
  strdata = strdata.replace(new RegExp("#BASE_URL#", 'g'), sails.config.clouderizerconfig.base_url);
  strdata = strdata.replace(new RegExp("#PROJECT_NAME#", 'g'), project.name.split(' ').join('').toLowerCase());
  strdata = strdata.replace(new RegExp('#PROJECTID#', 'g'), project.id);
  cb(null, strdata);
}

function preparejupyterlab(bindata, sm, port, cb) {
  var strdata = bindata.toString();
  strdata = strdata.replace(new RegExp("#BASE_URL#", 'g'), sails.config.clouderizerconfig.base_url);
  strdata = strdata.replace(new RegExp('#USERID#', 'g'), sm.id);
  strdata = strdata.replace(new RegExp("#PORT#", 'g'), port);
  cb(null, strdata);
}

async function prepareinitsh(bindata, project, key, cb) {
  var strdata = bindata.toString();
  //replace key

  var result = extractValues(project.startupcmd.replace(/\n/g, '<br>'), 
    "----PRE TASK START----{preTask}----PRE TASK END----{mainTask}", { whitespace: 1});
  if(result && result.preTask) {
    project.setupcmd = project.setupcmd + '\n' + result.preTask.replace(/<br>/g, '\n');
    
  }

  if(project.setupcmd != null && project.setupcmd != '') {
    strdata = strdata.replace(new RegExp("#INIT_STARTUP_CMD#", 'g'), project.setupcmd);
  }

  strdata = strdata.replace(new RegExp("#PROJECT_KEY#", 'g'), key);
  strdata = strdata.replace(new RegExp("#BASE_URL#", 'g'), sails.config.clouderizerconfig.base_url);
  var conda_env_name = 'clouderizer';

  //Add kaggle datasets if account has credentials and project has datasets
  if(project.company.kaggle_credentials && project.company.kaggle_credentials != '') {
    strdata = strdata.replace(new RegExp("#KAGGLESETUP#", 'g'), 'KAGGLE=True');
  }
  
  if(project.showcaseflaskon) {
    strdata = strdata.replace(new RegExp("#SHOWCASEFLASKSETUP#", 'g'), 'SHOWCASEFLASKSETUP=True');

    var sm=await ServingModel.findOne({servingproject:project.showcase_model}); 

    if(sm) {
      strdata=strdata.replace(new RegExp("#SHOWCASE_SECRET_KEY#", 'g'), sm.secret_key);

      var url = sails.config.clouderizerconfig.base_url.replace("https://","https:\\/\\/")

      strdata = strdata.replace(new RegExp("#SBASE_URL#", 'g'), url);
    } else {
      console.log("Showcase flask key not set. Danger!");
    }
  }

  kaggleStr = '';
  if(project.kaggleItems && project.kaggleItems.length > 0) {
    kaggleStr = '"' + project.kaggleItems.join('" "') + '"';
  }
  strdata = strdata.replace(new RegExp("#KAGGLEDATASETS#", 'g'), kaggleStr);

  if(project.cuda) {
    strdata = strdata.replace(new RegExp("#CUDASETUP#", 'g'), 'CLOUDERIZER_CUDA=True');
  } 

  if(project.torch) {
    strdata = strdata.replace(new RegExp("#TORCHSETUP#", 'g'), 'CLOUDERIZER_TORCH=True');
  }

  if(project.anaconda) {
    strdata = strdata.replace(new RegExp("#ANACONDASETUP#", 'g'), 'CLOUDERIZER_ANACONDA=True');
  } else {
    //if there is no anaconda, make sure we install normal apt python and PIP
    if(!project.aptItems) {
      project.aptItems = [];
    }
  }

  torchStr = '';
  if(project.torchItems && project.torchItems.length > 0) {
    torchStr = '"' + project.torchItems.join('" "') + '"';
  }

  strdata = strdata.replace(new RegExp("#TORCH_PACKAGES#", 'g'), torchStr);

  strdata = strdata.replace(new RegExp("#DATADIR#", 'g'), project.datadir);

  strdata = strdata.replace(new RegExp("#CONDA_ENV_NAME#", 'g'), conda_env_name);

  //changes for Clouderizer Serve
  if(project.modelserveon) {
    strdata = strdata.replace(new RegExp("#SERVESETUP#", 'g'), 'SERVESETUP=True');
  }

  if(project.h2oon) {
    strdata = strdata.replace(new RegExp("#H2OSETUP#", 'g'), 'H2OSETUP=True');
  }

  if(project.daion) {
    strdata = strdata.replace(new RegExp("#DAISETUP#", 'g'), 'DAISETUP=True');
  }

  var project_dir = '/content/clouderizer/' + project.name.split(' ').join('').toLowerCase() + '/';
  if(project.datadir && project.datadir != '') {
    project_dir = project.datadir.substring(0, project.datadir.lastIndexOf("/")+1);
  }
  console.log(project_dir);

  strdata = strdata.replace(new RegExp("#PROJECTDIR#", 'g'), project_dir);
  

  strdata = strdata.replace(new RegExp("#SERVE_ID#", 'g'), project.modelserveport + '-' + project.id.split("").reverse().join(""));

  //replace apt packages
  var aptStr = '';
  if(project.aptItems && project.aptItems.length > 0) {
    aptStr = '"' + project.aptItems.join('" "') + '"';
  }

  //replace conda packages
  var condaStr = '';
  if(project.condaItems && project.condaItems.length > 0) {
    condaStr = '"' + project.condaItems.join('" "') + '"';
  }

  //replace pip packages
  var pipStr = '';
  if(project.modelserveon) {
    project.pipItems.push("flask");
    project.pipItems.push("werkzeug");
  }

  if(project.showcaseflaskon) {
    project.pipItems.push("flask");
  }

  if(project.pipItems && project.pipItems.length > 0) {
    pipStr = '"' + project.pipItems.join('" "') + '"';
  }

  strdata = strdata.replace(new RegExp("#APT_PACKAGES#", 'g'), aptStr);
  
  strdata = strdata.replace(new RegExp("#CONDA_PACKAGES#", 'g'), condaStr);

  strdata = strdata.replace(new RegExp("#PIP_PACKAGES#", 'g'), pipStr);
  
  cb(null, strdata);
}

function updatePassword(newpwd, user, res) {
  //generate and set the new password
  async.waterfall([
    (next) => {
      User.generateHash(newpwd, (err, hash) => {
        if(err || !hash) {
          return res.status(500).json({err: 'Error updating password'});
        }

        user.encryptedpwd = hash;
        next();
      })
    }
  ], 
    (err, result) => {
      user.verification_guid = '';
      User.update({id: user.id}, user).fetch().exec((err, users) => {
        if(err) {
          return res.status(500).json({err: 'Error updating password'});
        }
        res.status(200).json({success: true, msg: 'Successfully upadated password.'});
      });
  });
}
