/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

 module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/
  datastores : {
    mongo_db : {
      adapter: 'sails-mongo',
      url: '',
      ssl: true,
      replicaSet:'',
      authSource:'',
      keepAlive: true,
      reconnectTries: 30000,
      connectTimeoutMS: 40000
    }
  },
  models: {
    datastore: 'mongo_db'
  },
  
  port: 3337,

  clouderizerconfig: {

    account_details : {
      name: "Acme Inc",
      user: {
        name: "John Doe",
        email: "john.doe@test-email.com",
        password: "clouderizer"
      }
    },

    base_url: 'https://clouderizer.foo.com',
    sync_url: 'https://serverless.foo.com',
    //notifyregstrationmail: true,
    
    aes_key: '',

    globalAckList: [],

    java_parser_tasks:[],

    // true represents that parser is free
    java_parser_status: true,

    parserSocketId: null,

    // Clouderizer S3 bucket, user's serving zip files are stored here if their s3 is not configured
    servingBucket: "showcase-test",

    // this will give access to Clouderizer's AWS S3 bucket that user is storing files in
    servingBucketAWSCreds: {
      "awsaccessid" : "",
      "awssecret" : "",
      "endpoint" : "storage.googleapis.com",
      "region" : "us-central1"
    },
    github: {
      clientID: '',
      clientSecret: ''
    },
    google: {
      clientID: '',
      clientSecret: ''
    },
    parser_socket_timeout_ms: 240000,

    serverlessURL: "https://serverless.foo.com/async-function/",
    serverlessSyncURL: "https://serverless.foo.com/function/",
    serverlessCallbackURLPath: "/api/ifcallback/",

    base_git_url: "gcr.io/my-gcp-project/",
    git_domain: "gcr.io",
    base_registry_url: "gcr.io/my-gcp-project/",
    projectlimit: 5,
    invlimit: 1000,
    execlimit: 100,
    
    internalfn_publish: 'publishproject',
    internalfn_pmmlparser: 'pmmlparser',
    internalfn_h2o: 'h2oparser',
    
    clouderizerpackages: {custom: ['pandas', 'numpy', 'papermill', 'nbformat==5.1.2', 'ipywidgets', 'ipykernel', 'matplotlib', 'tensorflow', 'tensorflow-datasets', 'tensorflow-hub', 'torch', 'torchvision', 'fastai', 'nbdev'], standard: ['pandas', 'numpy', 'papermill', 'nbformat==5.1.2', 'ipywidgets', 'ipykernel', 'matplotlib']},
    //mailgun config
    mg_domain: 'mg.foo.com',
    mg_api: 'key-xxx',
    mg_replyto: 'info@foo.com',

  }
};

