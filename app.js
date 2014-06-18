var app = require('express')();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var client = require('redis').createClient();
var baudcast = require('./')(server, client);

app.use(bodyParser()); // necessary for handling POST variables

app.get('/', function(req, res) { res.send('<i>baudcasting</i> things...'); });


/* set up endpoint to make a baudcast */
app.post('/baudcast/for/:thing', baudcast.route.makeNewBaudcast);
app.get('/baudcast/for/:thing', baudcast.route.makeNewBaudcast); // GET works too

/* set up endpoint to get last baudcast */
app.get('/get/last/baudcast/from/:thing', baudcast.route.getLastBaudcast);

/* set up endpoint to get last 800 baudcasts */
app.get('/get/baudcasts/from/:thing', baudcast.route.getBaudcasts);


/* set up custom response template */
var template = {
	verb: {
		get: 'getting',
		create: 'creating'
	},

	respondSuccess: function (action, resourceType, data) {
		var response = {
			this: "succeeded",
			by: this.verb[action],
			the: resourceType,
			with: data
		};

		return response;
	},

	respondFailure: function(why, apiErrorCode) {
		var response = {
			this: "failed",
			with: apiErrorCode || 500,
			because: why
		};

		return response;
	}
};

baudcast.useTemplate(template);


app.listen(3000);
server.listen(8888);
console.log('Server on port 3000, socket on port 8888...');