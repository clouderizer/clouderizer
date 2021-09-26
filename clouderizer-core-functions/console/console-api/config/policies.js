/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  'AuthController' : {
    'testmail': ['tokenAuth', 'filterAdminUser'],
    '*': true
  },
  'cliMetricsController' : {
    '*': true
  },
  'CustomerController' : {
     'getbilling': ['tokenAuth', 'filterAdminUserBilling', 'populateCompanyId'],
     'getaccount': ['tokenAuth', 'filterAdminUser', 'populateCompanyId'],
     'setaccountplan': ['tokenAuth', 'filterAdminUserBilling', 'populateCompanyId'],
     'cancelaccountplan': ['tokenAuth', 'filterAdminUserBilling', 'populateCompanyId'],
     'applycoupon': ['tokenAuth', 'filterAdminUserBilling', 'populateCompanyId'],
     'uploadkagglecreds': ['tokenAuth', 'filterAdminUser', 'populateCompanyId'],
     'uploaddaicreds': ['tokenAuth', 'filterAdminUser', 'populateCompanyId'],
     'clearkagglecreds': ['tokenAuth', 'filterAdminUser', 'populateCompanyId'],
     'cleardaicreds': ['tokenAuth', 'filterAdminUser', 'populateCompanyId'],
     'uploadserviceaccountcreds': ['tokenAuth', 'filterAdminUser', 'populateCompanyId'],
     'clearserviceaccountcreds': ['tokenAuth', 'filterAdminUser', 'populateCompanyId'],
     'getlicenseinfo': true,
     'updateprom': true,
     'iaminterested': ['tokenAuth', 'filterLocalAdminUser', 'populateCompanyId', 'populateUserId'],
     'getquota': ['tokenAuth', 'filterByCustomerId'],
     '*': ['tokenAuth', 'filterAdminUser', 'filterByCustomerId']
  },
  'UserController' : {
    'invite': ['tokenAuth', 'filterLocalAdminUser', 'populateCompanyId', 'populateUserId'],
    'find': ['tokenAuth', 'filterLocalAdminUser', 'populateCompanyId'],
    'destroy': ['tokenAuth', 'filterLocalAdminUser', 'populateCompanyId'],
    'disable': ['tokenAuth', 'filterLocalAdminUser', 'populateCompanyId'],
    'listusers': ['tokenAuth', 'populateCompanyId'],
    'listunverified': ['tokenAuth', 'filterLocalAdminUser', 'populateCompanyId'],
    'reinviteall': ['tokenAuth', 'filterLocalAdminUser', 'populateCompanyId', 'populateUserId'],
    'deleteuser': ['tokenAuth', 'filterLocalAdminUser', 'populateCompanyId', 'populateUserId'],
    'deleterootfolder': ['tokenAuth', 'filterLocalAdminUser', 'populateCompanyId', 'populateUserId'],
    'updatejupyterstatus':true,
    'findpipPackages':true,
    // 'getUser': true,
     '*': ['tokenAuth', 'filterByUserId']
  },
  'H2oController' : {
    'h2oparse': true,
    'h2opredict': true,
    'pmmlparse': true,
    'stopinstance': true,
    'predictiondata': true,
    'updatesubtype': true,
    'pmml4sparse': true,
    'updateservingport': ['filterServingToken']
  },
  'ClientSocketController' : {
    'longpoll': true,
    'machineclientlongpoll' : true,
    'automlparserlongpoll': true,
    'projstatus': ['tokenAuth', 'filterByUser', 'populateCompanyId'],
    'publishedprojstatus': ['tokenAuth', 'filterByUser', 'populateCompanyId']
  },
  'ServingProjectController' : {
    'deleteproject': ['tokenAuth','populateCompanyId'],
    'publishServingProject': ['tokenAuth', 'filterByUser', 'populateCompanyId'],
    'publishServingProjectLambda' : ['tokenAuth', 'filterByUser', 'populateCompanyId'],
    'deployServingProject': ['tokenAuth', 'filterByUser', 'populateCompanyId'],
    'stopServingProject': ['tokenAuth', 'filterByUser', 'populateCompanyId'],
    'getStatusServingProject': ['tokenAuth', 'filterByUser', 'populateCompanyId'],
    '*': true
  },
  'ServingModelController' : {
    '*': true
  },
  'ServingHistoryController' : {
    '*': true
  },
  'ProjectservingController' : {
    '*': true
  },
  'VersionCheckController' : {
    '*': true
  },
  'InternalFunctionsCallbackController' : {
    'callback': true
  },
  'PublishedServingProjectController' : {
    'sendemail' : true,
    '*' : ['decodeb64']
  },
  'indexController' : {
    '*': true
  },
  'AwsconfigController' : {
    '*' : true  //not secure. needs to be fixed. Figure out a sec handshake when called from internal functions.
  },
  '*': false

  /***************************************************************************
  *                                                                          *
  * Here's an example of mapping some policies to run before a controller    *
  * and its actions                                                          *
  *                                                                          *
  ***************************************************************************/
	// RabbitController: {

		// Apply the `false` policy as the default for all of RabbitController's actions
		// (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
		// '*': false,

		// For the action `nurture`, apply the 'isRabbitMother' policy
		// (this overrides `false` above)
		// nurture	: 'isRabbitMother',

		// Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
		// before letting any users feed our rabbits
		// feed : ['isNiceToAnimals', 'hasRabbitFood']
	// }
};
