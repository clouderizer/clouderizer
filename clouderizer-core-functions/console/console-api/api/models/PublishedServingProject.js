var uuid = require('uuid');

module.exports = {
  dontUseObjectIds: true,
  attributes: {
    id: {
        type: 'text',
    },
    name: {
        type: 'string',
        required: true,
    },

    functions: {
      collection: 'PublishedFunction',
      via: 'psprojectid'
    },

    giturl: {
      type: 'string'
    },

    servingproject: {
      model: 'ServingProject',
      required: true
    },

    status: {
      type: 'string'
    },

    status_message: {
      type: 'string'
    },

    company: {
      model: 'Customer',
      required: true
    },
  },
  beforeUpdate : function(valuesToSet, cb) {

    if(valuesToSet.status == ' ') {
      delete valuesToSet.status
    }

    cb()
  },
  afterUpdate : function(updatedRecord, cb) {
    // Notify project status update to everyone
    var sockets = sails.io.sockets.in(updatedRecord.company + '_publishedprojstatus');
    var projectstatus = !updatedRecord.status ? 'Not Running' : updatedRecord.status;
    ServingProject.update({id:updatedRecord.servingproject},{status:projectstatus}).fetch().exec((err,sp)=>{});
    sockets.emit('publishedproj_status_updated', 
          updatedRecord);
    cb();
  },

  beforeCreate: function(values, cb) {
    values.id= uuid.v4();
    cb();
  }
}