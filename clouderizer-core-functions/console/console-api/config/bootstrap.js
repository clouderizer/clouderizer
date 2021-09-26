/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */
var scheduler = require("node-schedule");
var CronJob = require("../api/services/CronJob");

module.exports.bootstrap = function(cb) {
  sails.hooks.http.app.disable('etag');
  
  if(sails.config.clouderizerconfig.account_details) {
    console.log("Bootstrapping default account......")
    var acc = sails.config.clouderizerconfig.account_details;
    if(acc.user.email) {
      User.findOne({email: acc.user.email}, (err, user) => {
        if(err) {
          console.log("Error bootstrapping default account. Fix config file !!" + err)
          return;
        }
  
        if(user) {
          console.log("Default account user already there. Skipping...")
          return;
        }
        var cus_obj = {
          name: acc.name,
        };
  
        Customer.create(cus_obj).fetch().exec(function(err, Customer) {
          if(err) {
            console.log("Error creating default account. Fix DB or config." + err)
            return;
          }
    
          if(Customer) {
            console.log("Created Bootstrap Customer account......")
            User.create({
              name: acc.user.name, 
              email: acc.user.email, 
              password: acc.user.password,
              type: 'Account Owner',
              status: 'Active',
              company: Customer.id
            }).fetch().exec(function(err, user) {
              if (err) {
                console.log("Error creating default account. Fix DB or config." + err)
                return;
              }
              if (!user) {
                console.log('Error creating user. Fix DB or config.');
              } else {
                console.log("Created Bootstrap user account......")
              }
              return;
            });
          } else {
            console.log('Error creating default account. Fix DB or config.');
          }
        });
      });
    }
  }
  cb();
};
