/**
 * ServingHistory.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
var uuid = require('uuid');
var internalfnService = require('../services/internalfnService');
module.exports = { 
  dontUseObjectIds: true,
  attributes: {
    id: {
      type: 'string',
      columnName: '_id'
    },
    model: {
        model: 'ServingModel',
        required: true
    },
    input: {
      type: 'json'
    },
    responseTime: {
      type: 'ref', columnType: 'string'
    },
    timestamp: {
      type: 'ref', columnType: 'string'
    },
    company: {
      model: 'Customer'
    },
    requestid: {
      type: 'string'
    },
    feedback: {
      type: 'ref', columnType: 'boolean'
    },
    sent_for_retrain: {
      type: 'ref', columnType: 'boolean',
      defaultsTo: false
    } 
  },
  beforeCreate : function(values,cb) {
    values.id= uuid.v4();
    cb();
  },
  afterUpdate : function(updatedRecord, cb) {
    console.log("record updated in model history")
    // Notify project status update to everyone
    var sockets = sails.io.sockets.in(updatedRecord.company + '_projstatus');
    sockets.emit('modelhistory_status_updated', updatedRecord);
    cb();
  },
  afterCreate : function(createdRecord, cb) {
    console.log("record created in model history")
    // Notify project status update to everyone
    var sockets = sails.io.sockets.in(createdRecord.company + '_projstatus');
    sockets.emit('modelhistory_status_updated', createdRecord);
    ServingModel.findOne({id: createdRecord.model}, (err, sm) => {
      if(err) console.log(err)
      setTimeout(()=>{
        internalfnService.checkPrometheus({"modelid": createdRecord.model});
      },7000)
    })
    cb();
  }
};

