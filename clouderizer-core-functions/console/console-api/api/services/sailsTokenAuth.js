var jwt = require('jsonwebtoken');

// With this method we generate a new token based on payload we want to put on it
module.exports.issueToken = function(payload) {
  return jwt.sign(
          payload, // This is the payload we want to put inside the token
          process.env.TOKEN_SECRET || "oursecret" // Secret string which will be used to sign the token
        );
};

module.exports.issueCLIToken = function(payload, cname, uname, cid, uid) {
  cli_token = {
    url : sails.config.clouderizerconfig.base_url,
    surl: sails.config.clouderizerconfig.sync_url,
    User : uname,
    Company: cname,
    uid: uid,
    cid: cid,
    token: this.issueToken(payload)
  }
  return Buffer(JSON.stringify(cli_token)).toString('base64');
};

// Here we verify that the token we received on a request hasn't be tampered with.
module.exports.verifyToken = function(token, verified) {
  return jwt.verify(
            token, // The token to be verified
            process.env.TOKEN_SECRET || "oursecret", // The secret we used to sign it.
            {}, // Options, none in this case
            verified // The callback to be call when the verification is done.
         );
};