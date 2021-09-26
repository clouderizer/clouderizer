var uuid = require('uuid');
//var awsnetworkService = require('../services/awsnetworkService');
module.exports = {
    // primaryKey: 'id',
    dontUseObjectIds: true,
    attributes: {
        id: {
            type: 'string',
            columnName: '_id'
        },
        name: {
            type: 'ref', columnType: 'string',
            required: true,
        },
        ispublic: {
            type: 'ref', columnType: 'boolean',
            defaultsTo:false
        },
        status: {
            type: 'ref', columnType: 'string',
        },
        project_description: {
            type: 'ref', columnType: 'string'
        },
        trained_time: {
            type: 'ref', columnType: 'string'
        },
        inputAttr: {
            type: 'json',
            defaultsTo: [{"type":"Input Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "inputList":[], "rawinputList":[], "subtype":""}]
        },
        outputAttr: {
            type: 'json',
            defaultsTo: [{"type":"Output Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "outputList":[], "subtype":""}]
        },
        company: {
            model: 'Customer',
            required: true
        },
        thumbs_up:{
            type: 'ref', columnType: 'number',
            defaultsTo: 0
        },
        thumbs_down:{
            type: 'ref', columnType: 'number',
            defaultsTo: 0
        },
        requests:{
            type: 'ref', columnType: 'number',
            defaultsTo: 0
        }, 
        started_at:{
            type: 'ref',
            columnType: 'timestamp'    
        },
        nameincompany: {
            type: 'ref', columnType: 'string',
            //required: true,
            unique: true
        },
        linked_to_workspace: {
            type: 'ref', columnType: 'boolean',
            defaultsTo: false
        },

    },
    beforeCreate : function(values,cb) {
        values.id= uuid.v4();
        values.nameincompany = values.company + values.name;

        if (typeof(values.inputAttr) == 'string') values.inputAttr = JSON.parse(values.inputAttr);
        if (typeof(values.outputAttr) == 'string') values.outputAttr = JSON.parse(values.outputAttr);
        cb();
    },
    afterUpdate : function(updatedRecord, cb) {
        // Notify project status update to everyone
        var sockets = sails.io.sockets.in(updatedRecord.company + '_projstatus');
        sockets.emit('overall_servingproj_status_updated', 
            updatedRecord);
        cb();
    }
};