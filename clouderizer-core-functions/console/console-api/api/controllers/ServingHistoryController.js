var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
var async = require('async');
const { Resource$Projects$Transferconfigs$Runs$Transferlogs } = require('googleapis/build/src/apis/bigquerydatatransfer/v1');
const ServingModelController = require('./ServingModelController');

module.exports = {

    getServingHistory: async function(req, res) {
        var edit = req.query.edit;
        if(edit) {
            delete req.query['edit'];
        }
        var model = req.query['model']
        var requestid = req.query['requestid'];

        if(requestid){
            ServingHistory.findOne({requestid:req.query['requestid']},(err, sh) => {
                if(!err && sh) res.ok(sh);
                else if(err) return res.serverError(err);
                else if(!sh) return res.notFound('No record found.');
            });
        }
        
        else if(model){
            ServingHistory.find({model: model}, (err, matchingRecord) => {
                if (err) return res.serverError(err);
                if(!matchingRecord) return res.notFound('No record found.');
                if(matchingRecord) res.ok(matchingRecord);
            });
        }   
    },

    loadhistory: function(req, res){
        ServingHistory.find({model: req.body.modelid}, (err, matchingRecord) => {
            if (err) return res.serverError(err);
            if(!matchingRecord) return res.notFound('No record found.');
            if(matchingRecord) res.ok(matchingRecord);
        });
    },

    multiServingHistory: function(req, res){
        for(var i=0; i<req.body.length;i++){
            ServingHistory.update({id: req.body[i].id}, {feedback: req.body[i].feedback}).fetch().exec((err, sm) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
                if(sm){
                    console.log(sm);
                }
            });
        }
        res.status(200).json( {success:true, msg:'Successfully Updated the history.'});
    },

    postServingHistory: async function(req,res){
        var totalrecords = [];
        for(var i=0; i<req.body.length;i++){
            sm = await ServingHistory.create(req.body[i]).fetch();
            totalrecords.push(sm)
        }
        res.status(200).json(totalrecords);
    }, 

    nbview: function(req, res){
        var nburl = req.body["nburl"];
        console.log("nburl", nburl);
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        request.post({headers:headers, url: 'https://nbviewer.jupyter.org/create/', form: {"gistnorurl": nburl}}, function (err, resp, body) {
            if(err) {
                return res.status(500).json({"error":err});
            }                    
            if(resp){
                return res.status(200).json({"url":resp.headers["location"]});
            }
            
        });
    },

    errorCalculated: function(req, res){
        var requestid = req.query['requestid'];
        var errorCalculated = req.body.errorCalculated;
        console.log(requestid);
        console.log(errorCalculated);
        ServingHistory.update({requestid: requestid}, {errorCalculated: errorCalculated}).fetch().exec((err, sm) => {
            if (err) {
                console.log(err);
                res.status(500).json( {err:err});
            }
            if(sm){
                console.log(sm);
                res.status(200).json( sm);
            }
        });
    },

    updateHistory: function(req, res){
        var requestid = req.body.requestid;
        console.log("updatehistory", req.body);
        ServingHistory.update({requestid: requestid}, req.body).fetch().exec((err, sm) => {
            if (err) {
                console.log(err);
                res.status(500).json({err:err});
            }
            if(sm){
                console.log(sm);
                res.status(200).json(sm);
            }
        });
    }
}