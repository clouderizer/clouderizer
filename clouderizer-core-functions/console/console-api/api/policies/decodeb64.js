
module.exports = function(req, res, next) {

  if(req.body && req.body.status_message && req.body.status_message.startsWith('base64#')) {
    try {
      req.body.status_message = Buffer.from(req.body.status_message.slice(7), 'base64').toString()
      return next()
    } catch (error) {
      return res.json(500, {err: 'Invalid Base64 body.'});
    }
  } else {
    return next()
  }
  
};

function jsonEscape(str)  {
  return str.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
}