var app = require('express')();
var bodyParser = require('body-parser');
var client = require('redis').createClient();
var baudcast = require('./')(client);

app.use(bodyParser());

app.get('/', function(req, res) { res.send('<i>baudcasting</i> things...'); });

app.post('/baudcast/:thing', baudcast.handleMakeNewBaudcast); // make a baudcast
app.get('/baudcasts/:thing/last', baudcast.handleGetLastBaudcast); // get last baudcast
app.get('/baudcasts/:thing', baudcast.handleGetBaudcasts); // get last 800 baudcasts

app.listen(3000);
console.log('Listening on port 3000...');