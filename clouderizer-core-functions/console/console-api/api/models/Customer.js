/**
 * Customer.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
var uuid = require('uuid');
module.exports = {
  dontUseObjectIds: true,
  attributes: {
    id: {
      type: 'string',
      columnName: '_id'
    },
    name: {
      type: 'ref', columnType: 'string',
    },
    phone: {
      type: 'ref', columnType: 'string',
    },
    country: {
      type: 'ref', columnType: 'string',
    },
    organisation_type: {
      type: 'ref', columnType: 'string',
    },
    storage_in_mb: {
      type: 'ref', columnType: 'number'
    },
    users: {
      collection: 'User',
      via: 'company'
    },
    child_users: {
      collection: 'User',
      via: 'parent_company'
    },
    created_on: {
      type: 'ref',
      columnType: 'datetime',
      defaultsTo: '',
    },
    //path to license file needs to be fetched from S3 with presigned url
    h2o_license_file: {
      type: 'ref', columnType: 'string'
    },
    user_addon: {
      type: 'ref', columnType: 'number',
      defaultsTo: 1
    },
    api_addon: {
      type: 'ref', columnType: 'number',
      defaultsTo: 0
    },
    zoho_subscription_id: {
      type: 'ref', columnType: 'string'
    },
    gdrive_root_folder: {
      type: 'ref', columnType: 'string'
    },
    goauth_orig_tokens: {
      type: 'ref', columnType: 'string'
    },
    goauth_tokens: {
      type: 'ref', columnType: 'string'
    },
    gcp_service_account_hash: {
      type: 'ref', columnType: 'string'
    },
    gcp_shared_service_account_encrypted: {
      type: 'ref', columnType: 'string'
    },
    us_gcr_setup: {
      type: 'ref', columnType: 'boolean',
      defaultsTo: false
    },

    // initial push may not contain a repo in registry, this field identifies that cldz repo does not exist in Customer's AWS
    ecr_repo_setup: {
      type: 'ref', columnType: 'boolean',
      defaultsTo: false
    },
    gdrive_setup: {
      type: 'ref', columnType: 'boolean'
    },
    gcp_setup: {
      type: 'ref', columnType: 'boolean'
    },
    service_account_email: {
      type: 'ref', columnType: 'string'
    },
    google_id: {
      type: 'ref', columnType: 'string'
    },
    gcp_projectid: {
      type: 'ref', columnType: 'string'
    },
    kaggle_credentials: {
      type: 'ref', columnType: 'string'
    },
    dai_credentials: {
      type: 'ref', columnType: 'string'
    },
    istrial: {
      type: 'ref', columnType: 'boolean'
    },
    account_expiry: {
      type: 'ref',
      columnType: 'datetime',
    },
    child_companies: {
      collection: 'Customer',
      via: 'parent_company'
    },
    parent_company: {
      model: 'Customer'
    }
  },
  beforeCreate : function(values,cb) {
    values.id= uuid.v4();
    values.created_on = new Date();
    cb();
  },
  afterUpdate : function(updatedRecord, cb) {
    // Notify status update to everyone
    console.log("cust updated")
    var sockets = sails.io.sockets.in(updatedRecord.id + '_projstatus');
    sockets.emit('customer_status_updated', updatedRecord);
    cb();
  }
};

