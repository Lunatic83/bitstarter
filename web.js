var express = require('express');
var fs =require('fs');
var app = express.createServer(express.logger());

app.get('/', function(request, response) {
	fs.readFileSync('index.html','utf8',  function (err, data) {
	  if (err) throw err;
	  //console.log(data.toString('utf8',0,data.length));
	  response.send(data.toString('utf8',0,data.length));
	});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
