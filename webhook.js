var express = require('express'),
  app = express(),
  http = require('http'),
  httpServer = http.Server(app);
const requestAPI = require('request');
app.use(express.static(__dirname));

app.get('/', function (req, res) {
  res.send("/richowebsites");
});
app.post('/callPhone', function (req, res) {
  callServiceNowApi("https://dev64379.service-now.com/api/now/table/u_servicerequest?u_string_3=123456789&u_choice_1=in%20progress", null, "GET", function (err, data) {
    res.send(data);
  })
})
app.get('/chatwindow', function (req, res) {
  res.sendfile(__dirname + '/chatwindow.html');
});
app.get('/roaming', function (req, res) {
  res.sendfile(__dirname + '/roaming.html');
});
app.get('/chat', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.listen(process.env.PORT || 7000);


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
        callback(err, null)
      }
      else {
        // console.log('headers:', JSON.stringify(response.headers));
        // console.log('status code:', JSON.stringify(response.statusCode));
        callback(null, body);
      }
    });
  }
  catch (err) {
    // console.log('RESPONSE ERROR', JSON.stringify(err));
  }
};