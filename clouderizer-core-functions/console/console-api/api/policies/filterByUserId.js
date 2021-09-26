module.exports = function(req, res, next) {
  var uid = '';
  if(req.session && req.session.uid) {
    uid = req.session.uid;
  } else if(req.token && req.token.uid) {
    uid = req.token.uid;
  }

  if(uid != '') {
    if(req.options.where) {
      req.options.where.id = uid;
    } else {
      req.options.where = {
        id: uid
      }
    }
    
    return next();
  } 
  req.session.destroy((err) => {
    res.clearCookie('sails.sid');
    return res.status(401).json( {err: 'Invalid session. Please login again'});
  });
};