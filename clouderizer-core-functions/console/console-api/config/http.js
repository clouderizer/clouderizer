/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {
    // compress : require('compression')(),

    // /***************************************************************************
    // *                                                                          *
    // * The order in which middleware should be run for HTTP requests.           *
    // * (This Sails app's routes are handled by the "router" middleware below.)  *
    // *                                                                          *
    // ***************************************************************************/
    passportInit    : require('passport').initialize(),
    passportSession : require('passport').session(),
    multerMiddleware : require('../api/policies/multerMiddleware'),

    order: [
      'cookieParser',
      'session',
      'passportInit',
      'passportSession',
      'multerMiddleware',
      'bodyParser',
      'compress',
      'poweredBy',
      'router',
      'www',
      'favicon',
    ],

    // // customMiddleware: function (app) {
    // //   var path = require('path')
    // //   var express = require('express');
    // //   var app = express();
    // //   app.use('/', express.static(path.normalize(__dirname + './../assets/public')));
    // // }
    // /***************************************************************************
    // *                                                                          *
    // * The body parser that will handle incoming multipart HTTP requests.       *
    // *                                                                          *
    // * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    // *                                                                          *
    // ***************************************************************************/

    bodyParser: (function(req, res, next) {
      var opts = {
        limit: '50mb',
        strict: false
      };
      var skipper = require('skipper')(opts);
      var rawParser = require("body-parser").raw({type: "*/*"});
    
      // Create and return the middleware function
      return function(req, res, next) {
        //sails.log.debug(req.headers);
        if (!req.headers['content-type'] || 
        req.headers['content-type'].match('text/plain')) {
          //sails.log.info('request using raw parser middleware');
          return rawParser(req, res, next);
        }

        // Otherwise use Skipper to parse the body
        //sails.log.info('request using skipper middleware');
        return skipper(req, res, next);
      };
    })(),
    compress : require('compression')()
  },
  
  /***************************************************************************
  *                                                                          *
  * The number of seconds to cache flat files on disk being served by        *
  * Express static middleware (by default, these files are in `.tmp/public`) *
  *                                                                          *
  * The HTTP static cache is only active in a 'production' environment,      *
  * since that's the only time Express will cache flat-files.                *
  *                                                                          *
  ***************************************************************************/

  //   // Default to built-in bodyParser:
  //   fn = require('skipper');
  //   return fn(opts);
  // })
};
