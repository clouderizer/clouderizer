var fs = require('fs');
var path = require('path');
var EmailTemplate = require('email-templates').EmailTemplate;
var nodemailer = require('nodemailer');
var async = require('async');
var _ = require('@sailshq/lodash');
var mg = require('nodemailer-mailgun-transport');

var templatesDir = path.resolve(__dirname, '../../assets/templates/emails');

var transport = nodemailer.createTransport(mg({
  auth: {
    api_key: sails.config.clouderizerconfig.mg_api,
    domain:  sails.config.clouderizerconfig.mg_domain
  }
}));

var templates = {};

// load templates once
fs.readdirSync(templatesDir).forEach(function(file) {
  if(fs.statSync(path.join(templatesDir, file)).isDirectory()){
    templates[file] = new EmailTemplate(path.join(templatesDir, file));
  }
});

module.exports = {
  sendMail: function(locals, callback) {
    var data = {};
    var template = templates[locals.template];

    if(!template){
      return cb({msg: 'Template not found', status: 500});
    }

    locals.from = 'Clouderizer <postmaster@' + sails.config.clouderizerconfig.mg_domain + '>';
    template.render(locals, function (err, results) {
      if (err) {
        return cb(err);
      }

      data = {
        from: locals.from,
        to: locals.email,
        subject: locals.subject,
        html: results.html,
        text: results.text
      };

      if(locals['recipient-variables']) {
        data['recipient-variables'] = locals['recipient-variables'];
      }

      transport.sendMail(data, (err, responseStatus) => {
        if (err) {
          return callback(err, null);
        }
        callback(null, data.html);
      });
    });
  }
}
 
