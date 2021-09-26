module.exports = function(req, res, next) {
  if(req.session && req.session.superuser) {
    next();
  } else {
    return res.redirect('superlogin');
  }
}