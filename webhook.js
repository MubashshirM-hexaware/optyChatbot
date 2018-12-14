var express = require('express'),
  app = express(),
  http = require('http'),
  httpServer = http.Server(app),
  passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy,
  session = require('express-session');
  // fb = require('fb');
// fb = new facebook(options);
const crypto = require('crypto');

// var accessToken;

// fb.api('oauth/access_token', {
//   client_id: process.env.appID,
//   client_secret: process.env.appSecret,
//   grant_type: 'client_credentials'
// }, function (res) {
//   console.log("getting access token")
//   if (!res || res.error) {
//     console.log(!res ? 'error occurred' : res.error);
//     return;
//   }
//   accessToken = res.access_token;
//   console.log(accessToken);
//   fetchFeed();
// });


// function fetchFeed () {
//   fb.setAccessToken(accessToken);

//   fb.api(
//     "/me", { fields: ['id', 'name'], access_token: accessToken },
//     function (response) {
//       console.log("Feed -->")
//       console.log(response);
//       if (response && !response.error) {
//         /* handle the result */
  
//       }
//     }
//   );
// }

var Facebook = require('facebook-node-sdk');

// var facebook = new Facebook({appID: process.env.appID, secret: process.env.appSecret}).setAccessToken(process.env.fbaccessToken);

// Passport session setup.
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new TwitterStrategy({
    consumerKey: process.env.consumer_key,
    consumerSecret: process.env.consumer_secret,
    callbackURL: "http://ec2-18-232-207-49.compute-1.amazonaws.com:7000/auth/twitter/callback"
  },
  function (token, tokenSecret, profile, done) {
    process.nextTick(function () {
      //Check whether the User exists or not using profile.id
      // User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
      // });

      return done(null, profile);
    });
  }
));

var bodyParser = require('body-parser');
var fs = require('fs');
const requestAPI = require('request');

app.use(bodyParser.json());
app.use(session({
  secret: 'login',
  key: 'opty'
}));
app.use(express.static(__dirname));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));
app.use(Facebook.middleware({appId: process.env.appID, secret: process.env.appSecret}));

app.get('/feed',Facebook.loginRequired(),function(req,res){
  res.send("inside feed");
  req.facebook.api('/me', function(err, data) {
    console.log('err',err)
    console.log('user',data);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello, ' + data + '!');
  });
})

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', {
    failureRedirect: '/roaming'
  }),
  function (req, res) {
    console.log('twitter auth');
    console.log('res -->', res);
    res.redirect('/chatwindow?sessionstate=true');
  });

var jsonIncompleteTran = [];

app.post("/webhook",async (req,res)=>{
  var options = {
    url: "https://api.dialogflow.com/v1/query?v=20150910",
    method: "POST",
    headers: { 'Authorization': 'Bearer ' + '04cfa3364e9a4649ab335f84a4b85ad7', 'Content-Type': 'application/json'},
    body: req.body,
    json: true
  };
  await requestAPI(options, function (error, response, body) {
   res.send(body);
  });
})


app.get('/', function (req, res) {
  res.send("/richowebsites");
});

app.post('/callPhone', function (req, res) {
  console.log("inside callphone")
  callServiceNowApi("https://dev65171.service-now.com/api/now/table/u_servicerequest?sysparm_limit=1&sysparm_query=ORDERBYDESCsys_created_on&u_string3=9876543210&u_choice_1=in%20progress", null, "GET", function (err, data) {
    console.log('inside call',data)
    res.send(data);
  })
})
app.post('/updateSessionState', function (req, res) {
  callServiceNowApi("https://p3ep1jeoz4.execute-api.us-east-1.amazonaws.com/Dev/updatesession", {
    type: req.body.params,
    sessionID: req.body.sessionId,
  }, "POST", function (err, data) {

    res.send(data);
  })
})
app.get('/chatwindow', function (req, res) {
  readFile("IncompleteTransaction.json", function (hasFile, data) {
    if (hasFile) {
      jsonIncompleteTran = data;
    }
    res.sendfile(__dirname + '/chatwindow1.html');
  });
});
app.get('/roaming', function (req, res) {
  readFile("IncompleteTransaction.json", function (hasFile, data) {
    if (hasFile) {
      jsonIncompleteTran = data;
    }
    res.sendfile(__dirname + '/roaming.html');
  });
});
app.get('/chat', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
app.get('/getIncompleteStatus', function (req, res) {
  console.log('Chat ID', JSON.stringify(req.query.ChatId));
  let chatId = req.query.ChatId;
  var hasTran = false;
  if (jsonIncompleteTran.length > 0) {
    var jsonArr = jsonIncompleteTran;
    jsonArr.forEach(function (arrayItem, arrayIndex) {
      if (jsonArr[arrayIndex].ChatSession === chatId && jsonArr[arrayIndex].IsTransactionComplete == true) {
        // jsonArr[arrayIndex].Conversation = req.body.Conversation;
        hasTran = true;
      }
    });
    res.send(hasTran);
  } else {
    res.send(hasTran);
  }
});

app.get('/generateId', function (req, res) {
  const secret = 'checkmate';
  const hash = crypto.createHmac('sha256', secret)
    .update(Math.random().toString(26).slice(2))
    .digest('hex');
  res.json({
    "hash": hash
  });
});

app.get('/showChatTranscript', function (req, res) {
  setTimeout(() => {
    var showTranscript = [];
    if (fs.existsSync("ChatScript.json")) {
      var data = fs.readFileSync("ChatScript.json", "utf8");
      var jsonArr = JSON.parse(data);
      var size = Object.keys(jsonArr).length;
      var beforeParse = jsonArr[size - 1].Conversation;
      beforeParse.forEach(function (arrayItem) {
        showTranscript.push("--------------------------------------");
        showTranscript.push(`<div dir="ltr" style="direction: ltr; text-align: left;">Opty says : </div>` + arrayItem["Bot"])
        showTranscript.push(`<div dir="ltr" style="direction: ltr; text-align: left;">Charlotte says : </div>` + arrayItem["User"])
      });
    }
    res.json(showTranscript);
  }, 1000);
});

app.post('/changeChatSess', function (req, res) {
  var jsonArr = [];
  //console.log(req);return false;
  if (fs.existsSync("ChatScript.json")) {
    var data = fs.readFileSync("ChatScript.json", "utf8");
    console.log(data);
    var jsonArr = JSON.parse(data);
    var size = Object.keys(jsonArr).length;
    jsonArr[size - 1].ChatSession = req.body.LETagSessionId;
    writeFile(jsonArr, "ChatScript.json");
  }
});

app.post('/writeFile', function (req, res) {
  var jsonArr = [];
  if (fs.existsSync("ChatScript.json")) {
    var data = fs.readFileSync("ChatScript.json", "utf8");
    jsonArr = JSON.parse(data);
    let checkArr = false;
    jsonArr.forEach(function (arrayItemm, arrayIndex) {
      if (jsonArr[arrayIndex].ChatSession == req.body.ChatSession) {
        jsonArr[arrayIndex].Conversation = req.body.Conversation;
        jsonArr[arrayIndex].ChatLESession = req.body.ChatLESession;
        checkArr = true;
      }
    });
    if (!checkArr)
      jsonArr.push(req.body);
    console.log(jsonArr);
    writeFile(jsonArr, "ChatScript.json");
  } else {
    jsonArr.push(req.body);
    writeFile(jsonArr, "ChatScript.json");
  }
});
app.post('/writeIncompleteTran', function (req, res) {
  console.log('************Incompelete Tran', req.body);
  var hasIncompleteTran = false;
  console.log(jsonIncompleteTran);
  var jsonArr = [];
  if (jsonIncompleteTran.length > 0) {
    // var data = fs.readFileSync("IncompleteTransaction.json", "utf8");
    jsonArr = jsonIncompleteTran;    
    var index = null;
    var hasElement = false;
    console.log('Before For each');
    jsonArr.forEach(function (arrayItem, arrayIndex) {
      if (jsonArr[arrayIndex].ChatSession === req.body.ChatSession && jsonArr[arrayIndex].IsTransactionComplete == true) {
        console.log('A');
        hasElement = true;
        jsonArr[arrayIndex].IsTransactionComplete = false;
        hasIncompleteTran = true;
      } else if (jsonArr[arrayIndex].ChatSession === req.body.ChatSession && jsonArr[arrayIndex].IsTransactionComplete == false) {
        console.log('B');
        hasElement = true;
        jsonArr[arrayIndex].IsTransactionComplete = true;
        hasIncompleteTran = false;
      }
    });
    console.log('After For each');
    // for (index = 0; jsonArr.length > index; index++) {
    //   if (jsonArr[index].ChatSession === req.body.ChatSession && jsonArr[index].IsTransactionComplete == 'false') {
    //     hasElement = true;
    //     hasIncompleteTran = false;
    //     jsonArr[index].IsTransactionComplete = 'true';        
    //     break;      
    //   } else if (jsonArr[index].ChatSession === req.body.ChatSession && jsonArr[index].IsTransactionComplete == 'true') {
    //     hasElement = true;
    //     hasIncompleteTran = true;
    //     jsonArr[index].IsTransactionComplete = 'false';  
    //     break;
    //   }    
    // }

    if (hasElement == false) {
      jsonArr.push(req.body);
    }
    console.log('JSON ARR', jsonArr);
    writeFile(jsonArr, "IncompleteTransaction.json");
  } else {
    jsonArr.push(req.body);
    writeFile(jsonArr, "IncompleteTransaction.json");
  }
  res.send(hasIncompleteTran);
});

app.listen(process.env.PORT || 7000);

function writeFile(data, fileName) {
  fs.writeFile(fileName, JSON.stringify(data), function (err) {
    if (err) {
      return console.log(err);
    }

    if (fileName == "IncompleteTransaction.json") {
      readFile("IncompleteTransaction.json", function (hasFile, data) {
        if (hasFile) {
          jsonIncompleteTran = data;
        }
      });
    }

    console.log("The" + fileName + " file was saved!");
  });
}

function readFile(fileName, callback) {
  try {
    var objData = null;
    if (fs.existsSync(fileName)) {
      var data = fs.readFileSync(fileName, "utf8");
      objData = JSON.parse(data);
      callback(true, objData)
    } else {
      callback(false, objData)
    }
  } catch (err) {
    console.log(err);
  }
}


function callServiceNowApi(url, dataService, type, callback) {
  console.log("inside callservice now")
  try {
    const header = {
      'Cache-Control': 'no-cache',
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
    var options = {
      url: url,
      method: type,
      header: header,
      body: dataService,
      json: true,
      auth: {
        user: "admin",
        password: "qyIDs8zNwSX0"
      }
    };

    requestAPI(options, function (error, response, body) {
      if (error) {
        console.log('API ERROR', JSON.stringify(error));
        callback(error, null)
      } else {
        console.log('headers:', JSON.stringify(response.headers));
        console.log('body:', JSON.stringify(body));
        callback(null, body);
      }
    });
  } catch (err) {
    // console.log('RESPONSE ERROR', JSON.stringify(err));
  }
};