/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var mg = require('../services/mgService');
var actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil');
module.exports = {
  update: function(req, res){
    var id = req.body.id;
    var Model = actionUtil.parseModel(req);
    req.body.company = req.body.company.id;
    Model.update({id: id},req.body).fetch().exec((err, pt) => {
      console.log(req.body.company);
      console.log("updated 1");
      if(err || !pt) {
        console.log("updated 2")
        res.status(500).json( {success: false, data: pt, error: err, msg: 'Unable to update user details.'});
        console.log(err);
        return;
      }
      console.log("updated 3")
      res.status(200).json( {success:true, msg:'Successfully updated the user details.'});
    });
  },

  getUser: function(req, res){
    var id = req.query.id;
    User.find({id:id}, (err, user) =>{
      if(err || !user) {
        res.status(500).json( {success: false, msg: 'Error listing user'});
        return;
      }
      res.ok(user);
    })
  },

  saveprofile: function(req, res){
    User.update({id: req.body.id}, req.body).fetch().exec((err, users) => {
      if(err || !users) {
        res.status(500).json( {success: false, msg: 'Error updating profile'});
        return;
      }
      res.status(200).json( {success: true, msg: 'Profile updated successfully'});
    });
  },
  
  invite: function(req, res) {
    var admin = req.body.loggedinuser;
    var type = req.body.type;
    console.log(type);
    if(!req.body.email) {
      res.status(500).json( {success:false, msg:'Invalid email address.'});
      return;
    }

    User.findOne({email: req.body.email}, (err, user) => {
      if(err) {
        res.status(500).json( {success: false, msg: 'Some error occured.'});
        return;
      }

      if(user) {
        res.status(500).json( {success: false, msg: 'Email already registered'});
        return;
      }

      User.findOne({id: admin}).populate('company').exec((err, admin) => {
        if(err || !admin) {
          res.status(500).json( {success:false, msg:'Invalid email address.'});
          return;
        }

        // Just create the user without checking the billing plan details
        User.create({
          name: req.body.name,
          email: req.body.email,
          type: 'User',
          status: 'Unverified',
          company: admin.company.id
        }).fetch().exec((err, user) => {
          if (err) {
            res.status(err.status).json({err: err});
            return;
          }
          if (user) {
            var clink = sails.config.clouderizerconfig.base_url +
              '/auth/confirm?u=' + user.verification_guid;
            //send mail here
            var options = {
              template: 'inviteuser',
              subject: 'Clouderizer Invitation',
              email: req.body.email,
              confirmationLink: clink,
              userName: req.body.name,
              adminName: admin.name
            };
            mg.sendMail(options, (err) => {
              res.json({success: true, user: user});
            });
          } else {
            return res.status(500).json( {err: 'Error creating user'});
          }
        });
      });
    });
  },

  destroy: function (req, res) {
    var Model = actionUtil.parseModel(req);
    var pk = actionUtil.requirePk(req);

    Model.findOne(pk).exec((e, r) => {
      if (e) return res.serverError(r);
      if(!r) return res.notFound('No record found with the specified `id`.');
      if(r.type == 'Student') {
        var company_id = r.company;
        var parent_company_id = r.parent_company;
        User.update({id: r.id}, {parent_company: null, type: 'Account Owner'}).fetch().exec((err, user) => {
          if(err) {
            res.status(500).json( { success: false, msg: 'Error deleting user.'});
            return;
          }

          //Set the trial for 14 days
          var expiry = new Date();
          expiry.setDate(expiry.getDate());
          Customer.update({id: company_id}, {parent_company: null, istrial: true, account_expiry: expiry}).fetch().exec((err, customer) => {
            if(err) {
              res.status(500).json( { success: false, msg: 'Error deleting user.'});
              return;
            }

            res.ok(user);
          });
        });

      } else {
        var query = Model.findOne(pk)
          .where( actionUtil.parseCriteria(req) );
        query = actionUtil.populateRequest(query, req);
        query.exec(function foundRecord (err, record) {
          if (err) return res.serverError(err);
          if(!record) return res.notFound('No record found with the specified `id`.');

          //cannot delete Account Owner
          if(record.type == 'Account Owner') return res.status(403).json( { success: false, msg: 'You cannot delete Account Owner.'});

          Model.destroy(pk).fetch().exec((err, record) => {
            if (err) return res.negotiate(err);
            return res.ok(record);
          });
        });
      }
    });
  },

  disable: function (req, res) {
    var uid = req.body.userid;
    var company = req.body.company;
    var active = req.body.active;

    User.findOne({id: uid, or : [ {company: company}, {parent_company: company}]}, (err, user) => {
      if(err || !user) {
        res.status(500).json( {success: false, msg: 'Error disabling user'});
        return;
      }

      if(user.type == 'Account Owner') {
        res.status(403).json( {success: false, msg: 'You cannot disable Account Owner.'});
        return;
      }

      if(user.status == 'Unverified') {
        res.status(500).json( {success: false, msg: 'Unverified account. Cannot modify.'});
        return;
      }

      user.status = active ? 'Active' : 'Disabled';
      User.update({id: uid}, user).fetch().exec((err, users) => {
        if(err || !users) {
          res.status(500).json( {success: false, msg: 'Error disabling user'});
          return;
        }
        res.status(200).json( {success: true, msg: 'User disabled successfully'});
      });
    });
  },

  listusers: function(req, res) {
    var company = req.body.company;
    var user_id = req.session.uid;
    User.findOne({id: user_id}, (err, user) => {
      if(err) {
        res.status(500).json( {success: false, msg: 'Unknown User'});
        return;
      }
      
    if(user.type ==  'Student' )
    {
      Customer.findOne({parent_company: user.parent_company}, (err, customer) => {
        User.find({ or : [ {company: customer.parent_company}, {parent_company: customer.parent_company}]}, (err, users) => {
          if(err || !users) {
             res.status(500).json( {success: false, msg: 'Error listing user'});
            return;
          }
    
          res.ok(users);
        });
      });
    }
    else
    {
      User.find({ or : [ {company: company}, {parent_company: company}]}, (err, users) => {
        if(err || !users) {
          console.log(err);
          console.log(users)
          res.status(500).json( {success: false, msg: 'Error listing user'});
          return;
        }
        res.ok(users);
      });
    }
    });
  },

  listunverified: function(req, res) {
    var company = req.body.company;
    User.find({ or : [{ and : [{company: company},{status:'Unverified'}]},{ and : [{parent_company: company},{status:'Unverified'}]}]},(err, users) => {
      if(err || !users) {
        res.status(500).json( {success: false, msg: 'Error listing user'});
        return;
      }
      res.ok(users);
    });
  },

  reinviteall:function(req,res)
  {
    var admin =   req.body.loggedinuser;
    var type = req.body.type;
    User.findOne({email: req.body.email}, (err, user) => {
      if(err) {
        res.status(500).json( {success: false, msg: 'Some error occured.'});
        return;
      }

      User.findOne({id: admin}).populate('company').exec((err, admin) => {
        if(err || !admin) {
          res.status(500).json( {success:false, msg:'Invalid email address.'});
          return;
        }

        if(user)
        {
          var clink = sails.config.clouderizerconfig.base_url +
            '/auth/confirm?u=' + user.verification_guid;
          //send mail here
          var options = {
            template: 'inviteuser',
            subject: 'Clouderizer Invitation',
            email: req.body.email,
            confirmationLink: clink,
            userName: req.body.name,
            adminName: admin.name
          };
          mg.sendMail(options, (err) => {
            res.json({success: true, user: user});
          });
        }
      });
    });
  },

  deleteuser:function(req,res)
  {
    var admin =   req.body.loggedinuser;
    var del = req.body.deletes;
    User.findOne({id: admin}).populate('company').exec((err, adm) => {
      if(err || !adm) {
        res.status(500).json( {success:false, msg:'Invalid email address.'});
        return;
      }

      User.destroy({id: admin}, (err, user) => {
          Customer.destroy({id:req.body.company}, (err, customer) => {
      })
        if(err) {
          res.json({ success: false, msg: 'Error deleting profile' });
          return;
        } else {
          res.json({ success: true, msg: 'Successfully deleted the profile' });
        }
      });
    });
  },

  deleterootfolder:function(req,res) 
  {
    Customer.findOne({id: req.body.company}, (err, cus) => {
      if(cus && cus.goauth_orig_tokens && cus.gdrive_root_folder) {
        gdriveService.deletedir(cus.gdrive_root_folder, JSON.parse(cus.goauth_orig_tokens), (err, res) => {
          if(err) {
            console.log(err);
          }
        })    
      }
      res.json({ success: true, msg:'Successfully deleted the profile including all data.' });
    });
  },

  updatejupyterstatus: function (req, res) {
    console.log("in updatejupyterstatus method")
    console.log(req.body.userid);
    console.log(req.body.jupyterStatus);
    var userid = req.body.userid;
    var jupyterStatus = req.body.jupyterStatus;

    User.update({id:userid}, {jupyterStatus:jupyterStatus}).fetch().exec((err, sm) => {

        if(err) {
            console.log(err);
            res.status(500).json( {err:err});
        } else {
            res.end();
        }
    });
  },

  updatepippackages: function(req, res) {
    var id = req.body.id;
    var pipPackages = req.body.pipPackages;

    console.log(pipPackages)
    User.findOne({id: id}, (err, sm)=> {
        if(err) {
            console.log(err);
            res.status(500).json( {err:err});
        }
        else{
            console.log(sm.pipPackages)
            if(sm.pipPackages){
                pipPackages = [...pipPackages, ...sm.pipPackages];
            }
            console.log(pipPackages)
            pipPackages.splice(0, pipPackages.length, ...(new Set(pipPackages))) //remove duplicates
            User.update({id:sm.id}, {pipPackages: pipPackages}).fetch().exec((err, sm) => {
                if(err) {
                    console.log(err);
                    res.status(500).json( {err:err});
                } else {
                    res.json("saved!");
                }
            });
        }
    })
  },

  deletepippackage: function(req, res) {
    var id = req.body.id;
    var pipPackage = req.body.pipPackage;

    console.log(pipPackage)
    User.findOne({id: id}, (err, sm)=> {
        if(err) {
            console.log(err);
            res.status(500).json( {err:err});
        }
        else{
            console.log(sm.pipPackages)
            if(sm.pipPackages){
                sm.pipPackages.splice(sm.pipPackages.indexOf(pipPackage),1);
                var pipPackages = sm.pipPackages;
            }
            console.log(pipPackages);
            User.update({id:sm.id}, {pipPackages: pipPackages}).fetch().exec((err, sm) => {
                if(err) {
                    console.log(err);
                    res.status(500).json( {err:err});
                } else {
                    res.json("saved!");
                }
            });
        }
    })
  },

  findpipPackages: function (req, res) {
    console.log(req.params.id)
    var id = req.params.id;
    User.findOne({id: id}).exec(function(err, sm) {
      if(err || !sm) {
        res.send(404);
        return;
      }
      if(sm){
        res.ok(sm)
      }
    });
  }
};

