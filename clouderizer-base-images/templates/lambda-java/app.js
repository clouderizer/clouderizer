const awsServerlessExpress = require('@vendia/serverless-express');
const app = require('./node-service/app.js');
// const server = awsServerlessExpress.createServer(app)

module.exports.handler = awsServerlessExpress({ app });