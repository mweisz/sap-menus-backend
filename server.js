var parser = require('./menuParser');
var express = require('express');
var cors = require('cors')
var app = express();

app.use(cors());

app.get('/sap-menus', parser.parseMenu);
app.get('/today', parser.today);
app.get('/tomorrow', parser.tomorrow);

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('SAP Menus Server listening at http://%s:%s', host, port);
});