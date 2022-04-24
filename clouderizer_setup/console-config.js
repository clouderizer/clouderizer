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

    base_url: 'https://clouderizer.foo.com', // your main domain URL
    sync_url: 'https://serverless.foo.com', // Your OPENFAAS gateway URL
    
    aes_key: '',

    globalAckList: [],

    java_parser_tasks:[],

    // true represents that parser is free
    java_parser_status: true,

    parserSocketId: null,

    // GCS bucket or any bucket supporting S3 API
    servingBucket: "",

    // Credentials supporting S3 API
    servingBucketAWSCreds: {
      "awsaccessid" : "",
      "awssecret" : "",
      "endpoint" : "", //ex: if GCP is used, it would be storage.googleapis.com
      "region" : "" //ex: us-central1
    },

    parser_socket_timeout_ms: 240000,

    //OPENFASS config
    serverlessURL: "https://serverless.foo.com/async-function/", // your async OPENFAAS gateway URL with function in the path parameter
    serverlessSyncURL: "https://serverless.foo.com/function/", // your OPENFAAS gateway URL with function in the path parameter
    serverlessCallbackURLPath: "/api/ifcallback/",

    //GCR config
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

