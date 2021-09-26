module.exports = function(req, res, next) {

  var cid = '';
  if(req.session && req.session.cid) {
    cid = req.session.cid;
  } else if(req.token && req.token.cid) {
    cid = req.token.cid.id;
  }

  if(cid != '') {

    if(req.body) {
      req.body.company = cid;
    } else {
      req.body = {
        company: cid,
      }
    }
    
    return next();
  }

  if(req.session) {
    req.session.destroy((err) => {
      res.clearCookie('sails.sid');
      return res.status(401).json( {err: 'Invalid session. Please login again'});
    });
  } else return res.status(401).json( {err: 'Invalid session. Please login again'});
};