const sailsToken = require('../services/sailsTokenAuth');

module.exports = function(req, res, next) {
  console.log("token auth");
  if(req.session && req.session.uid && req.session.cid) {
    console.log("session in token auth")
    next();
  } else if (req.headers && req.headers.authorization) {
    console.log("headers in token auth")
    var parts = req.headers.authorization.split(' ');
    if (parts.length == 2) {
      var scheme = parts[0],
        credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }

      sailsToken.verifyToken(credentials,(err, userData) => {
        console.log(userData);
        if(!err && userData) {
          req.session.uid=userData["uid"];
          req.session.cid=userData["cid"];
          next();
        }else return res.status(401).json( {err: 'Invalid session. Format is Authorization: Bearer [token]'});
      })
    } else {
      req.session.destroy((err) => {
        return res.status(401).json( {err: 'Invalid session. Format is Authorization: Bearer [token]'});
      });
    }
  } else {
      req.session.destroy((err) => {
        return res.status(401).json( {err_internal: 'No Authorization header was found'});
      });
  }
};