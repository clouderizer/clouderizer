/**
 * ServingModel.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
var uuid = require('uuid');
var serviceprojectService = require('../services/servingProjectService');
module.exports = { 
  dontUseObjectIds: true,
  attributes: {
    id: {
      type: 'string',
      columnName: '_id'
    },
    key: {
      type: 'ref', columnType: 'string'
    },
    type: {
        type: 'ref', columnType: 'string',
        defaultsTo: 'automl',
        isIn: [
          'automl',
          'regular',
          'pythonscore'
        ]
    },
    imagetype: {
      type: 'ref', columnType: 'string',
      isIn: [
        'standard',
        'torch',
        'tensorflow'
      ]
    },
    global_storage: {
      type: 'ref', columnType: 'boolean'
    },
    model: {
      type: 'ref', columnType: 'string'
    },
    subtype: {
        type: 'ref', columnType: 'string'
    },
    aws_instance_id: {
      type: 'ref', columnType: 'string'
    },
    machinetype: {
      defaultsTo: 'clouderizer',
      type: 'ref', columnType: 'string',
      isIn: [
        "local",
        "aws",
        "gcp",
        "azure",
        "clouderizer"
      ]
    },
    insname: {
      type: 'ref', columnType: 'string'
    },
    instype: {
      type: 'ref', columnType: 'string'
    },
    instanceid : {
      type: 'ref', columnType: 'string'
    },
    gcp_region: {
      type: 'ref', columnType: 'string'
    },
    gcp_zone: {
      type: 'ref', columnType: 'string'
    },
    no_of_gpu: {
      type: 'ref', columnType: 'number'
    },
    gpu_type: {
      type: 'ref', columnType: 'string'
    },
    status: {
      type: 'ref', columnType: 'string'
    },
    status_message: {
      type: 'ref', columnType: 'string'
    },
    servingport: {
      type: 'ref', columnType: 'number'
    },
    s3_zip_file: {
        type: 'ref', columnType: 'string',
    },
    s3_bucket_name: {
        type: 'ref', columnType: 'string'
    },
    servingproject: {
      model: 'ServingProject',
      required: true
    },
    company: {
      model: 'Customer',
      required: true
    },
    edited:{
      type: 'ref', columnType: 'boolean'
    },
    lbpercent:{
      type: 'ref', columnType: 'string'
    },
    requests:{
      type: 'ref', columnType: 'string'
    },
    feedback:{
      type: 'ref', columnType: 'string'
    },
    like:{
      type: 'ref', columnType: 'string'
    },
    dislike:{
      type: 'ref', columnType: 'string'
    },
    notResponsded:{
      type: 'ref', columnType: 'string'
    },
    preprocessCode: {
      type: 'ref', columnType: 'string'
    },
    predictCode: {
      type: 'ref', columnType: 'string'
    },
    preprocessCodePath: {
      type: 'ref', columnType: 'string'
    },
    postprocessCodePath: {
      type: 'ref', columnType: 'string'
    },
    predictCodePath: {
      type: 'ref', columnType: 'string'
    },
    volumesize: {
      type: 'ref', columnType: 'number',
    },
    requestspot: {
      type: 'ref', columnType: 'boolean',
    },
    bidprice: {
      type: 'ref', columnType: 'number',
    },
    enableRetrain: {
      type: 'ref', columnType: 'boolean',
      defaultsTo: false
    },
    secret_key: {
      type: 'ref', columnType: 'string',
      defaultsTo:''
    },
    user_retrain_url: {
      type: 'ref', columnType: 'string',
      defaultsTo:''
    },
    preprocessEnabled: {
      type: 'ref', columnType: 'boolean',
      defaultsTo: false
    },
    postprocessEnabled: {
      type: 'ref', columnType: 'boolean',
      defaultsTo: false
    },
    lambda: {
      type: 'ref', columnType: 'boolean',
      defaultsTo: false
    },
    model_history: {
      type: 'json',
      custom: function(array){
        if (!Array.isArray(array)) {
            return false;
        } else {
            return array.every(function (value) {
                return typeof(value) === "string"
            });
        }
      }
    },
    flask_logs: {
      type: 'ref', columnType: 'string',
      defaultsTo:''
    }
  },
  beforeCreate : function(values,cb) {
    values.id= uuid.v4(); 
    values.key = serviceprojectService.getRandomKey()
    values.secret_key= serviceprojectService.getRandomKey()

    try {
      if(typeof(values.enableRetrain)=='string') values.enableRetrain=(values.enableRetrain == 'true');
      if(typeof(values.preprocessEnabled)=='string') values.preprocessEnabled=(values.preprocessEnabled == 'true');
      if(typeof(values.postprocessEnabled)=='string') values.postprocessEnabled=(values.postprocessEnabled == 'true');
      if(typeof(values.training)=='string') values.training=(values.training == 'true');
      if(typeof(values.pipPackages)=='string') values.pipPackages=[values.pipPackages];
      if(typeof(values.userreqs)=='string') values.userreqs=[values.userreqs];
      if(typeof(values.lambda)=='string') values.lambda=(values.lambda == 'true') ?  true : false
      if(typeof(values.otherfilenames)=='string') values.otherfilenames = [value.otherfilenames];
      if(typeof(values.s3_other_files)=='string') values.s3_other_files = [value.s3_other_files];

    } catch (e) {
      console.log(`ServingModel: beforeUpdate ${err}`);
      values.enableRetrain=false;
      values.preprocessEnabled=false;
      values.postprocessEnabled=false;
    }

    cb();
  },
  beforeUpdate : function(values,cb) {
    try {
      if(typeof(values.enableRetrain)=='string') values.enableRetrain=(values.enableRetrain == 'true');
      if(typeof(values.preprocessEnabled)=='string') values.preprocessEnabled=(values.preprocessEnabled == 'true');
      if(typeof(values.postprocessEnabled)=='string') values.postprocessEnabled=(values.postprocessEnabled == 'true');
      if(typeof(values.training)=='string') values.training=(values.training == 'true');
      if(typeof(values.pipPackages)=='string') values.pipPackages=[values.pipPackages];
      if(typeof(values.userreqs)=='string') values.userreqs=[values.userreqs];
      if(typeof(values.lambda)=='string') values.lambda=(values.lambda == 'true') ?  true : false
      if(typeof(values.otherfilenames)=='string') values.otherfilenames = [value.otherfilenames];
      if(typeof(values.s3_other_files)=='string') values.s3_other_files = [value.s3_other_files];

    } catch (e) {
      console.log(`ServingModel: beforeUpdate ${err}`);
      values.enableRetrain=false;
      values.preprocessEnabled=false;
      values.postprocessEnabled=false;
    }

    cb();
  },
  afterUpdate : function(updatedRecord, cb) {
    // Notify project status update to everyone
    var sockets = sails.io.sockets.in(updatedRecord.company + '_projstatus');
    ServingProject.update({id:updatedRecord.servingproject},{status:updatedRecord.status}).fetch().exec((err,sp)=>{});
    sockets.emit('servingproj_status_updated', 
          updatedRecord);

    if(updatedRecord.lambda) {
      PublishedServingProject.update({servingproject:updatedRecord.servingproject},{"status":updatedRecord.status,"status_message":updatedRecord.status_message},(err,psp) => {
        console.log(err);
        console.log(psp);
      });
    }
    cb();
  },
  genKey : function() {
    ServingModel.find({}, (err, sms) => {
      if(sms) {
        sms.forEach( sm => {
          if(!sm.key) {
            sm.key = serviceprojectService.getRandomKey();
            ServingModel.update({id: sm.id}, sm, (err, sms_res) => {
              if(sms_res) {
                console.log("Generated key for serving project " - sms_res[0].name);
              } else {
                console.log("Some error occured while generating key");
              }
            })
          }
        })
      }
    });
  }
};
