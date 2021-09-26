// var middleware = require('../../node-service/middleware'), // the Middleware you want to test
//     httpMocks = require('node-mocks-http'), // quickly sets up REQUEST and RESPONSE to be passed into Express Middleware
//     request = {}, // define REQUEST
//     response = {} // define RESPONSE
// ;

// describe('Middleware test', function(){
//     context('Valid arguments are passed', function() {
//         beforeEach(function(done) {
//             /* 
//              * before each test, reset the REQUEST and RESPONSE variables 
//              * to be send into the middle ware
//             **/
//             request = httpMocks.createRequest({
//                 method: 'POST',
//                 url: '/predict'
//             });
//             response = httpMocks.createResponse();
            
//             done(); // call done so that the next test can run
//         });
        
//         it('does something', function(done) {
//             /*
//              * Middleware expects to be passed 3 arguments: request, response, and next.
//              * We are going to be manually passing REQUEST and RESPONSE into the middleware
//              * and create an function callback for next in which we run our tests
//             **/
//             middleware.samplemw(request, response, function next(error) {
//                 /*
//                  * Usually, we do not pass anything into next except for errors, so because
//                  * in this test we are passing valid data in REQUEST we should not get an 
//                  * error to be passed in.
//                 **/
//                 if (error) { throw new Error('Expected not to receive an error'); }
                
//                 // Other Tests Against request and response
//                 if (response.locals.var1 != "sandeep") { throw new Error('Expected something to be done'); }
                
//                 done(); // call done so we can run the next test
//             }); // close middleware
//         }); // close it
//     }); // close context
// }); // close describe


// const test = require('tape');
const httpMocks = require('node-mocks-http');

// let chai = require('chai');

// var assert = chai.assert;
// var expect = chai.expect;
// const samplemw = require('../../node-service/middleware.js');
const samplemw = require('./samplemw.js');


describe("data type handler", () => {
    // when req.body.csv is present (request coming from UI)
    it('reb body csv', (done) => {
        req = httpMocks.createRequest({
        });
        var res = httpMocks.createResponse();
        var next = function(){};
        req.body.csv = "a,b";
        console.log(req.body.csv)
        global.validationInputAttr = [{"name": "key1", "type": "text"}, {"name": "key2", "type": "text"}];
        res.locals.inputItems = [];
        samplemw.datatype_handler(req, res, next);
        if(res.locals.inputItems[0]["name"] == "key1" && res.locals.inputItems[0]["value"] == "a"){
            done();
        }   
        else{
            console.log(res.locals.inputItems)
            done(new Error("reb body csv failed"));
        }
    });

    // when req.body.csv is not present but req.body json with input key values present with no input schema. (API request)
    it('req body json with no schema', (done) => {
        req = httpMocks.createRequest({
        });
        var res = httpMocks.createResponse();
        var next = function(){};
        req.body = {"key1": "a", "key2": "b"};
        res.locals.inputItems = [];
        samplemw.datatype_handler(req, res, next);
        if(res.locals.inputItems[0]["name"] == "key1" && res.locals.inputItems[0]["value"] == "a"){
            done();
        }   
        else{
            console.log(res.locals.inputItems)
            done(new Error("req body json with no schema failed"));
        }
    });

    // when req.body.csv is not present but req.body json with input key values present with input schema. (API request)
    it('req body json with schema', (done) => {
        req = httpMocks.createRequest({
        });
        var res = httpMocks.createResponse();
        var next = function(){};
        req.body = {"key1": "a", "key2": "b", "key3": "c"};
        global.validationInputAttr = [{"name": "key1", "type": "text"}, {"name": "key2", "type": "text"}];
        res.locals.inputItems = [];
        samplemw.datatype_handler(req, res, next);
        console.log("res locals",res.locals.inputItems)
        if(res.locals.inputItems.length == global.validationInputAttr.length && res.locals.inputItems[0]["name"] == "key1" && res.locals.inputItems[0]["value"] == "a" &&
        res.locals.inputItems[1]["name"] == "key2" && res.locals.inputItems[1]["value"] == "b"){
            done();
        }   
        else{
            console.log(res.locals.inputItems)
            done(new Error("req body json with no schema failed"));
        }
    });
})


describe("preprocess validator", () => {
    // preprocess enabled
    it('preprocess enabled np schema', (done) => {
        req = httpMocks.createRequest({
        });
        var res = httpMocks.createResponse();
        var next = function(){};

        global.rawInputAttr = [];
        req.body = {"key1": "a", "key2": "b"};
        res.locals.file_array = [];
        console.log(req.body)
        global.preprocessEnabled = true;
        global.base_path = "/home/app/node-service";
        res.locals.requestid = "12wew"
        global.training_output_path = global.base_path + "/uploads/";

        console.log(global.preprocessEnabled)
        samplemw.preprocessvalidator(req, res, next);
        console.log(res.locals.file_array)
        if(res.locals.file_array[0]["success"] && res.locals.file_array[0]["data"]["key1"] == "a"){
            done();
        }   
        else{
            console.log(res.locals.inputItems);
            done(new Error("preprocess enabled no schema failed"));
        }
    });

    // preprocess enabled and there is raw input schema
    // it('preprocess enabled schema', (done) => {
    //     req = httpMocks.createRequest({
    //     });
    //     var res = httpMocks.createResponse();
    //     var next = function(){};

    //     global.rawInputAttr = [{"name": "key1", "type": "text"}, {"name": "key2", "type": "text"}];
    //     req.body = {"key1": "a", "key2": "b"};
    //     res.locals.csv = "a,b"
    //     res.locals.file_array = [];
         
    //     global.preprocessEnabled = true;
    //     global.base_path = "/home/app/node-service";
    //     res.locals.requestid = "12wew"
    //     global.training_output_path = global.base_path + "/uploads/";

    //     console.log(global.preprocessEnabled)
    //     samplemw.preprocessvalidator(req, res, next);
    //     console.log(res.locals.file_array)
    //     if(res.locals.file_array[0]["success"] && res.locals.file_array[0]["data"]["key1"] == "a"){
    //         done();
    //     }   
    //     else{
    //         console.log(res.locals.inputItems);
    //         done(new Error("preprocess enabled schema failed"));
    //     }
    // });
})

// describe("preprocessor", () => {
//     // preprocess enabled
//     it('preprocess enabled np schema', (done) => {
//         req = httpMocks.createRequest({
//         });
//         var res = httpMocks.createResponse();
//         var next = function(){};

//         global.rawInputAttr = [];
//         var preprocessinput = {"key1": "a", "key2": "b"};
//         res.locals.file_array = [{"success":true,"data":preprocessinput}];
//         global.preprocessEnabled = true;

//         samplemw.preprocessor(req, res, next);
//         console.log(res.locals.file_array)
//         if(res.locals.file_array[0]["success"] && res.locals.file_array[0]["data"][0]["data"]["key1"] == "a"){
//             done();
//         }   
//         else{
//             console.log(res.locals.inputItems);
//             done(new Error("preprocess enabled no schema failed"));
//         }
//     });

//     // preprocess enabled and there is raw input schema
//     it('preprocess enabled schema', (done) => {
//         req = httpMocks.createRequest({
//         });
//         var res = httpMocks.createResponse();
//         var next = function(){};

//         global.rawInputAttr = [];
//         var preprocessinput = {"key1": "a", "key2": "b"};
//         res.locals.file_array = [{"success":true,"data":preprocessinput}];
//         global.preprocessEnabled = true;

//         samplemw.preprocessor(req, res, next);
//         console.log(res.locals.file_array)
//         if(res.locals.file_array[0]["success"] && res.locals.file_array[0]["data"][0]["data"]["key1"] == "a"){
//             done();
//         }   
//         else{
//             console.log(res.locals.inputItems);
//             done(new Error("preprocess enabled no schema failed"));
//         }
//     });
// })


// describe("validator", () => {
//     // preprocess enabled
//     it('preprocess enabled np schema', (done) => {
//         req = httpMocks.createRequest({
//         });
//         var res = httpMocks.createResponse();
//         var next = function(){};

//         global.rawInputAttr = [];
//         req.body = {"key1": "a", "key2": "b"};
//         res.locals.file_array = [];
//         console.log(req.body)
//         global.preprocessEnabled = true;
//         global.base_path = "/home/app/node-service";
//         res.locals.requestid = "12wew"
//         global.training_output_path = global.base_path + "/uploads/";

//         console.log(global.preprocessEnabled);
//         samplemw.validator(req, res, next);
//         console.log(res.locals.file_array)
//         if(res.locals.file_array[0]["success"] && res.locals.file_array[0]["data"]["key1"] == "a"){
//             done();
//         }   
//         else{
//             console.log(res.locals.inputItems);
//             done(new Error("preprocess enabled no schema failed"));
//         }
//     });

//     // preprocess enabled and there is raw input schema
//     it('preprocess enabled schema', (done) => {
//         req = httpMocks.createRequest({
//         });
//         var res = httpMocks.createResponse();
//         var next = function(){};

//         global.rawInputAttr = [{"name": "key1", "type": "text"}, {"name": "key2", "type": "text"}];
//         req.body = {"key1": "a", "key2": "b"};
//         res.locals.csv = "a,b"
//         res.locals.file_array = [];
         
//         global.preprocessEnabled = true;
//         global.base_path = "/home/app/node-service";
//         res.locals.requestid = "12wew"
//         global.training_output_path = global.base_path + "/uploads/";

//         console.log(global.preprocessEnabled)
//         samplemw.validator(req, res, next);
//         console.log(res.locals.file_array)
//         if(res.locals.file_array[0]["success"] && res.locals.file_array[0]["data"]["key1"] == "a"){
//             done();
//         }   
//         else{
//             console.log(res.locals.inputItems);
//             done(new Error("preprocess enabled schema failed"));
//         }
//     });
// })


// describe("scorer", () => {
//     // preprocess enabled
//     it('preprocess enabled np schema', (done) => {
//         req = httpMocks.createRequest({
//         });
//         var res = httpMocks.createResponse();
//         var next = function(){};

//         global.rawInputAttr = [];
//         req.body = {"key1": "a", "key2": "b"};
//         res.locals.file_array = [];
//         console.log(req.body)
//         global.preprocessEnabled = true;
//         global.base_path = "/home/app/node-service";
//         res.locals.requestid = "12wew"
//         global.training_output_path = global.base_path + "/uploads/";

//         console.log(global.preprocessEnabled);
//         samplemw.scorer(req, res, next);
//         console.log(res.locals.file_array)
//         if(res.locals.file_array[0]["success"] && res.locals.file_array[0]["data"]["key1"] == "a"){
//             done();
//         }   
//         else{
//             console.log(res.locals.inputItems);
//             done(new Error("preprocess enabled no schema failed"));
//         }
//     });

//     // preprocess enabled and there is raw input schema
//     it('preprocess enabled schema', (done) => {
//         req = httpMocks.createRequest({
//         });
//         var res = httpMocks.createResponse();
//         var next = function(){};

//         global.rawInputAttr = [{"name": "key1", "type": "text"}, {"name": "key2", "type": "text"}];
//         req.body = {"key1": "a", "key2": "b"};
//         res.locals.csv = "a,b"
//         res.locals.file_array = [];
         
//         global.preprocessEnabled = true;
//         global.base_path = "/home/app/node-service";
//         res.locals.requestid = "12wew"
//         global.training_output_path = global.base_path + "/uploads/";

//         console.log(global.preprocessEnabled)
//         samplemw.scorer(req, res, next);
//         console.log(res.locals.file_array);
//         if(res.locals.file_array[0]["success"] && res.locals.file_array[0]["data"]["key1"] == "a"){
//             done();
//         }   
//         else{
//             console.log(res.locals.inputItems);
//             done(new Error("preprocess enabled schema failed"));
//         }
//     });
// })