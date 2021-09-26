/**
 * Session Configuration
 * (sails.config.session)
 *
 * Use the settings below to configure session integration in your app.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For all available options, see:
 * https://sailsjs.com/config/session
 */

module.exports.session = {

  /***************************************************************************
  *                                                                          *
  * Session secret is automatically generated when your new app is created   *
  * Replace at your own risk in production-- you will invalidate the cookies *
  * of your users, forcing them to log in again.                             *
  *                                                                          *
  ***************************************************************************/
  secret: '119be7c0ee59b02508b7fea9db58f243',
  adapter: 'connect-mongo',
  // url: 'mongodb://clouderizer_prod:clouderizer123@ds137003.mlab.com:37003/clouderizer_session', // user, password and port optional
  url: 'mongodb://clouderizer_dev:clouderizer@clouderizer-dev-shard-00-00.8ognn.mongodb.net:27017,clouderizer-dev-shard-00-01.8ognn.mongodb.net:27017,clouderizer-dev-shard-00-02.8ognn.mongodb.net:27017/clouderizer_session',
  // url: 'mongodb://sandeep:sandyonlyaccess@cluster1-shard-00-00.tgp8w.mongodb.net:27017,cluster1-shard-00-01.tgp8w.mongodb.net:27017,cluster1-shard-00-02.tgp8w.mongodb.net:27017/clouderizer_session',
  collection: 'sessions',
  stringify: true,
  mongoOptions: {
    server: {
      ssl: true,
      // replicaSet:'atlas-gcfcl2-shard-0',
      replicaSet:'atlas-44n16w-shard-0',
      authSource:'admin',
      keepAlive: true,
      socketTimeoutMS: 30000,
      reconnectTries: 30000
    }
  }
  /***************************************************************************
  *                                                                          *
  * Customize when built-in session support will be skipped.                 *
  *                                                                          *
  * (Useful for performance tuning; particularly to avoid wasting cycles on  *
  * session management when responding to simple requests for static assets, *
  * like images or stylesheets.)                                             *
  *                                                                          *
  * https://sailsjs.com/config/session                                       *
  *                                                                          *
  ***************************************************************************/
  // isSessionDisabled: function (req){
  //   return !!req.path.match(req._sails.LOOKS_LIKE_ASSET_RX);
  // },

};
