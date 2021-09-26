module.exports = function (req, res, next) {
    var servingid='';

    if(req.body) {
        if(req.body.servingid) servingid = req.body.servingid;
        if(req.body.servingmodel) servingid = req.body.servingmodel;


        ServingModel.findOne({id:servingid}, (err, sm) => {
            if(err || !sm) {
                console.log(err);
                req.session.destroy((err) => {
                    res.clearCookie('sails.sid');
                    return res.status(401).json( {err: 'Invalid session. Please login again'});
                  });
            } else next();
        });
    }
}