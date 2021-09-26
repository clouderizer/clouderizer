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

      if(req.options.where) {
        req.options.where.user = uid;
      } else {
        req.options.where = {
          user: uid
        }
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