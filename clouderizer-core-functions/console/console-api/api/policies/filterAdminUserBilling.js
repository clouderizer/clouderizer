module.exports = function(req, res, next) {
  var uid = '';
  if(req.session && req.session.uid) {
    uid = req.session.uid;
  } else if(req.token && req.token.uid) {
    uid = req.token.uid;
  }

  if(uid != '') {

    User.findOne({id: uid}, (err, user) => {
      if(err || !user) {
        req.session.destroy((err) => {
          res.clearCookie('sails.sid');
          return res.status(401).json( {err: 'Invalid session. Please login again'});
        });
      }

      if(user.type != 'Account Owner' && user.type != 'Admin') {
        return res.status(403).json( {err: 'Permission Denied.'});
      }
      return next();
    });
    
  } else {
    req.session.destroy((err) => {
      res.clearCookie('sails.sid');
      return res.status(401).json( {err: 'Invalid session. Please login again'});
    });
    
  }
};