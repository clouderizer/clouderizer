module.exports = function(req, res, next) {

  var cid = '';
  if(req.session && req.session.cid) {
    cid = req.session.cid;
  } else if(req.token && req.token.cid) {
    cid = req.token.cid;
  }

  if(cid != '') {

    if(req.options.where) {
      req.options.where.id = cid;
    } else {
      req.options.where = {
        id: cid
      }
    }
    
    return next();
  }
  req.session.destroy((err) => {
    res.clearCookie('sails.sid');
    return res.status(401).json( {err: 'Invalid session. Please login again'});
  });
};