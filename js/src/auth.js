const credentials = {
  client: {
    id: '3MVG9pe2TCoA1Pf4gOK_r9I_2WAlDC8GemGLa.XyQJxerdzIy1xU5OH.DuMkrTMc6hGkGPFakWN4YMzDAPTtE',
    secret: '6917821745050784149',
  },
  auth: {
    tokenHost: 'https://login.salesforce.com/',
    authorizePath: '/services/oauth2/authorize',
    tokenPath: '/services/oauth2/token'
  }
};
const oauth2 = require('simple-oauth2').create(credentials);

var getAuthUrl = function() {
  const returnVal = oauth2.authorizationCode.authorizeURL({
    redirect_uri: process.env.REDIRECT_URI,
    scope: process.env.APP_SCOPES
  });
  console.log(`Generated auth url: ${returnVal}`);
  return returnVal;
}

module.exports.getAuthUrl = getAuthUrl;
