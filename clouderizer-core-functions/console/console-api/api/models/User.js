/**
 * User.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
var bcrypt = require('bcrypt');
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
      required: true
    },
    email: {
      type: 'ref', columnType: 'string',
      required: true,
      unique: true,
      isEmail: true
    },
    phone: {
      type: 'ref', columnType: 'string',
      defaultsTo: ''
    },
    encryptedpwd: {
      type: 'ref', columnType: 'string',
    },
    type: {
      type: 'ref', columnType: 'string',
      isIn: [
        'Account Owner',
        'Admin',
        'User',
        'Student'
      ],
      defaultsTo: 'User'
    },
    status: {
      type: 'ref', columnType: 'string',
      isIn: [
        'Active',
        'Disabled',
        'Unverified'
      ],
      defaultsTo: 'Unverified'
    },
    verification_guid: {
      type: 'ref', columnType: 'string',
      defaultsTo: '',
    },
    company: {
      model: 'Customer',
      required: true
    },
    parent_company: {
      model: 'Customer'
    }, 
    jupyterStatus:{
      type: 'ref', columnType: 'string'
    }
  },

  beforeCreate: function(values, next) {
    values.id= uuid.v4();
    values.verification_guid= uuid.v4();
    if(values.password) {
      bcrypt.genSalt(10, function(err, salt) {
        if (err) return next(err);
  
        bcrypt.hash(values.password, salt, function(err, hash) {
          if (err) return next(err);
  
          values.encryptedpwd = hash;
          delete values.password;
          next();
        });
      });
    } else {
      next();
    }
  },

  generateHash: function(password, cb) {
    if(password) {
      bcrypt.genSalt(10, function(err, salt) {
        if (err) return cb(err, null);
  
        bcrypt.hash(password, salt, function(err, hash) {
          if (err) return cb(err, null);
          
          cb(null, hash);
        });
      });
    }
  },

  afterUpdate : function(updatedRecord, cb) {
    // Notify project status update to everyone
    var sockets = sails.io.sockets.in(updatedRecord.company + '_projstatus');
    sockets.emit('jupyter_status_updated', 
          updatedRecord);
    cb();
  },

  validPassword: function(password, user, cb) {
    bcrypt.compare(password, user.encryptedpwd, function(err, match) {
      if (err) 
      {
        cb(err);
        return;
      }  

      if (match) {
        cb(null, true);
      } else {
        cb(err);
      }
    });
  }
};

