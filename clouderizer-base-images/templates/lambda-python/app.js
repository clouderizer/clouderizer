
// const request = require("request")

// exports.handler = async (event, context) => {
    
//     return "Hi"
//     var options = {
//         url: `http://localhost:9090/predict`,
//         method: 'POST',
//         body: JSON.stringify(event),
//         headers: {
//         'Content-Type': 'application/json'
//         }
//     };

//     request(options, (err, response, body) => {
//         console.log(body);
//         return {"body":body,"err":err,"response":response};
//     });
// }

// (async () => {
//     const resp = await exports.handler({"context":'A quick brown fox jumps over the lazy dog.',"query":"What color is the fox?"});
//     console.log(resp);
// })();

const awsServerlessExpress = require('@vendia/serverless-express');
const app = require('./node-service/app.js');
// const server = awsServerlessExpress.createServer(app)

module.exports.handler = awsServerlessExpress({ app })
// module.exports.handler = (event, context) => {
//     console.log(event,context);
//     awsServerlessExpress.proxy(server, event, context);
// }