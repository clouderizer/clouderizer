module.exports = function(req, res, next) {

  var uid = '';
  if(req.session && req.session.uid) {
    uid = req.session.uid;
  } else if(req.token && req.token.uid) {
    uid = req.token.uid;
  }

  if(uid != '') {

    if(req.body) {
      req.body.loggedinuser = uid;
    } else {
      req.body = {
        loggedinuser: uid,
      }
    }
    
    return next();
  }
  req.session.destroy((err) => {
    res.clearCookie('sails.sid');
    return res.status(401).json( {err: 'Invalid session. Please login again'});
  });
};