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
    type: req.body.type
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
app.post('/writeFile', function (req, res) {
  console.log(req.body.type);
  fs.appendFile("ChatScript.json", JSON.stringify(req.body.type), function (err) {
    if (err) {
      return console.log(err);
    }

    console.log("The file was saved!");
  });
});

app.listen(process.env.PORT || 9000);


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