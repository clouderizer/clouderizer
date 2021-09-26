var mg = require('../services/mgService');
module.exports = { 
    sendemail: function(req, res){
        User.findOne({email: req.body.email}, (err, user) => {
            var options = {
                template: 'deployment',
                subject: 'Successfully deployed project!',
                email: user.email
            };
            mg.sendMail(options, (err) => {
            });
        })
    },
}