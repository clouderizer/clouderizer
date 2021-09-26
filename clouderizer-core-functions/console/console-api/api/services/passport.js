var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var GithubStrategy = require('passport-github').Strategy;

var verifyHandler = function(token, tokenSecret, profile, done) {
    console.log("verify handler");
    console.log(profile);
    console.log(token);
    console.log(tokenSecret);
    process.nextTick(function() {
    
    User.findOne({email: profile._json.email}, function(err, user) {
    if (user) {
      if(user.type == 'User' && user.status == 'Unverified'){
        user.status = 'Active';
        User.update({id: user.id}, user).fetch().exec((err, updatedUser) => {
          if(!err){
            console.log(updatedUser);
            return done(null, updatedUser);
          }
        });
      }
      console.log(user);
      return done(null, user);
    } 
    else {
      console.log("creating user");
        var data = {
          id: profile.id,
          name: profile.displayName || profile.username,
          phone: '',
          encryptedpwd: '',
          type:'',
          status:'',
          verification_guid:'',
          parent_company:'',
        };
        data.company = "";
        data.email = profile._json.email;
        if(!data.email){
          return done ('no email', null)
        }

        var cus_obj = {
          name: data.company,
          phone: data.phone,
          country: '',
        };

        Customer.create(cus_obj).fetch().exec(function(err, Customer) {
          console.log(Customer);
          if(err) {
            return done(err, null)
          }
          if(Customer) {
            console.log("in user");
            console.log(data);
            User.create({
              id: data.id,
              name: data.name, 
              email: data.email, 
              password: '',
              type: 'Account Owner',
              status: 'Active',
              company: Customer.id
            }).fetch().exec(function(err, user) {
              if (err) {
                console.log("error in user");
                console.log(err);
                return;
              }
              if (user) {
                
                return done(err, user);
              } 
              else {
                return done('Error creating user. Please contact support@clouderizer.com for assistance.', null)
              }
            });
          } 
          else {
            return done('Error registering account. Please contact support@clouderizer.com for assistance.', null)
          }
        });
      }
      });
    });
};

passport.serializeUser(function(user, done) {
    console.log(user);
    done(null, user.id);
});
    
passport.deserializeUser(function(id, done) {
    console.log("deserialized");
    console.log(id);
    User.findById(id, function(err, user) {
        console.log(user);
        console.log(err);
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: sails.config.clouderizerconfig.google.clientID,
    clientSecret: sails.config.clouderizerconfig.google.clientSecret,
    callbackURL: `${sails.config.clouderizerconfig.base_url}/api/google/callback`
}, verifyHandler));

passport.use(new GithubStrategy({
    clientID: sails.config.clouderizerconfig.github.clientID,
    clientSecret: sails.config.clouderizerconfig.github.clientSecret,
    callbackURL: `${sails.config.clouderizerconfig.base_url}/api/github/callback`
}, verifyHandler));
