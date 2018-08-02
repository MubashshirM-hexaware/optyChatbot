var express = require('express'),
  app = express(),
  http = require('http'),
  httpServer = http.Server(app);
var bodyParser = require('body-parser');
var fs = require('fs');
const requestAPI = require('request');
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));

app.get('/', function (req, res) {
  res.send("/richowebsites");
});

app.post('/callPhone', function (req, res) {
  callServiceNowApi("https://dev64379.service-now.com/api/now/table/u_servicerequest?sysparm_limit=1&sysparm_query=ORDERBYDESCsys_created_on&u_string3=9876543210&u_choice_1=in%20progress", null, "GET", function (err, data) {
    res.send(data);
  })
})
app.post('/updateSessionState', function (req, res) {
  callServiceNowApi("https://p3ep1jeoz4.execute-api.us-east-1.amazonaws.com/Dev/updatesession-dev", {
    type: req.body.params,
    sessionID: req.body.sessionId,
  }, "POST", function (err, data) {

    res.send(data);
  })
})
app.get('/chatwindow', function (req, res) {
  res.sendfile(__dirname + '/chatwindow1.html');
});
app.get('/roaming', function (req, res) {
  res.sendfile(__dirname + '/roaming.html');
});
app.get('/chat', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/showChatTranscript', function (req, res) {
  var showTranscript = [];
  if (fs.existsSync("ChatScript.json")) {
    var data = fs.readFileSync("ChatScript.json", "utf8");
    var jsonArr = JSON.parse(data);
    console.log(jsonArr);
    var size = Object.keys(jsonArr).length;
    console.log(size);
    var beforeParse = jsonArr[size-1].Conversation;
    console.log(typeof(beforeParse));
    beforeParse.forEach(function (arrayItem) {
      console.log(arrayItem["Bot"]);
      console.log(arrayItem["User"]);
      showTranscript.push("Opty says : "+arrayItem["Bot"])
      showTranscript.push("Visitor says : "+arrayItem["User"])
    });
//     datap = JSON.stringify(data);
//     var lastItem = null;
//     for(key in datap) {
//       //console.log( key + ' has a value ' + data[key] );
//       lastItem = key;
//     }
// // now the last iteration's key is in lastItem
//     console.log('the last key ' + lastItem + ' has a value ' + data[lastItem]);
    //console.log(data[last]);
  }
  res.json(showTranscript);
});
app.post('/writeFile', function (req, res) {
  var jsonArr = [];
  if (fs.existsSync("ChatScript.json")) {
    var data = fs.readFileSync("ChatScript.json", "utf8");
    jsonArr = JSON.parse(data);
    jsonArr.push(req.body);
    console.log(jsonArr);
    writeFile(jsonArr, "ChatScript.json");
  } else {
    jsonArr.push(req.body);
    writeFile(jsonArr, "ChatScript.json");
  }
});
app.post('/incompleteTransaction', function (req, res) {
  console.log('************Incompelete Tran', req.body);
  var hasIncompleteTran = false;
  var jsonArr = [];
  if (fs.existsSync("IncompleteTransaction.json")) {
    var data = fs.readFileSync("IncompleteTransaction.json", "utf8");
    jsonArr = JSON.parse(data);
    var index = null;
    var hasElement = false;    
    for (index = 0; jsonArr.length > index; index++) {
      if (jsonArr[index].ChatSession === req.body.ChatSession && jsonArr[index].IsTransactionComplete == 'false') {
        hasElement = true;
        hasIncompleteTran = false;
        jsonArr[index].IsTransactionComplete = 'true';
        break;
      } else if (jsonArr[index].ChatSession === req.body.ChatSession && jsonArr[index].IsTransactionComplete == 'true') {
        hasElement = true;
        hasIncompleteTran = true;
        jsonArr[index].IsTransactionComplete = 'false';        
        break;
      }
    }

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

app.listen(process.env.PORT || 9000);

function writeFile(data, fileName) {
  fs.writeFile(fileName, JSON.stringify(data), function (err) {
    if (err) {
      return console.log(err);
    }

    console.log("The file was saved!");
  });
}


function callServiceNowApi(url, dataService, type, callback) {
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
        password: "pj10GXYsUTej"
      }
    };

    requestAPI(options, function (error, response, body) {
      if (error) {
        // console.log('API ERROR', JSON.stringify(error));
        callback(error, null)
      } else {
        // console.log('headers:', JSON.stringify(response.headers));
        // console.log('status code:', JSON.stringify(response.statusCode));
        callback(null, body);
      }
    });
  } catch (err) {
    // console.log('RESPONSE ERROR', JSON.stringify(err));
  }
};