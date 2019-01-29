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
var oauth2 = require('simple-oauth2').create(credentials);

var getAuthUrl = function() {
    console.log(`Generating auth url`);
  const returnVal = oauth2.authorizationCode.authorizeURL({
    redirect_uri: 'https://optychatbot.herokuapp.com/'
  });
  console.log(`Generated auth url: ${returnVal}`);
  return returnVal;
}

function getTokenFromCode(auth_code, callback) {
    var token;
    oauth2.authorizationCode.getToken({
      code: auth_code,
      redirect_uri: 'https://optychatbot.herokuapp.com/'
    }, function (error, result) {
      if (error) {
        console.log('Access token error: ', error.message);
        callback(error, null);
      } else {
        token = oauth2.accessToken.create(result);
        console.log('Token created: ', token.token);
        callback(null, token);
      }
    });
  }

exports.getTokenFromCode = getTokenFromCode;
module.exports.getAuthUrl = getAuthUrl;
