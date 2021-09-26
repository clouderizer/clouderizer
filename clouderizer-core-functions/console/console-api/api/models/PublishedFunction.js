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

    psprojectid: {
      model: 'PublishedServingProject',
      required: true
    },
    type: {
      type: 'string',
      defaultsTo: 'python',
      enum: [
        "h2o",
        "pmml",
        "dai",
        "python"
      ]
    },
    model_url: {
      type: 'string',
    },
    script_url: {
      type: 'string',
    },
    schema: {
      type: 'string'
    },
    input_type: {
      type: 'string',
      required: true,
      enum: [
        "user",
        "function"
      ]
    },
    input_function: {
      type: 'string'
    },
    output_type: {
      type: 'string',
      required: true,
      enum: [
        "user",
        "function"
      ]
    },
    output_function: {
      type: 'string'
    },
  },

  beforeCreate: function(values, cb) {
    values.id= uuid.v4();
    cb();
  }
}