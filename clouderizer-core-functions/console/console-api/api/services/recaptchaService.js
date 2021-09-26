request = require('request');

module.exports.verifytoken = function(token, req, cb) {
  // var reqst = request.defaults({
  //   json: true
  // });

  request.post(
    {
      url: sails.config.clouderizerconfig.recaptcha_uri,
      form: {
        secret: sails.config.clouderizerconfig.recaptcha_secret,
        response: token,
        remoteip: req.ip
      }
    },
    cb
  )
};