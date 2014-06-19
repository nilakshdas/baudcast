# baudcast

![dependencies](https://david-dm.org/nilakshdas/baudcast.png)

A socket-based, realtime messaging API; designed for the **internet of things**.

*baudcast* is a node module that allows machine-to-machine (M2M) communication of internet-connected devices over a simple and configurable REST API.

No registration/setup required, just start *baudcasting* and receiving key-value data right away.

## Installation

Open your app's node_modules folder in the terminal and run the following commands:

```sh
$ git clone https://github.com/nilakshdas/baudcast.git
$ cd baudcast/
$ npm install
```

## Usage

*baudcast* can be easily configured to use custom endpoints and response templates.

As an example, the [HAPI](https://github.com/jheising/HAPI)-REST API specification has been implemented with *baudcast*:

```javascript
var app = require('express')();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var client = require('redis').createClient();
var baudcast = require('baudcast')(server, client);

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
```

### *baudcasting*

Simply call the following URL(as set up in the code) to make a new *baudcast*:

```
http://{some-host}:3000/baudcast/for/{thing}?foo=bar&baz=qux
```

The server will respond with:

```json
{
	"this": "succeeded",
	"by": "creating",
	"the": "baudcast",
	"with": {
		"thing": "{thing}",
		"created": 1402642240997,
		"content": {
			"foo": "bar",
			"baz": "qux"
		}
	}
}
```

The POST method can also be used to *baudcast* valid JSON data.

### Getting *baudcasts*

The last 800 *baudcasts* made by a *thing* over the last 24 hours can be retrieved by calling the following URL:

```
http://{some-host}:3000/get/baudcasts/from/{thing}
```

The server will return an array of *baudcasts* in the following form:

```json
{
	"this": "succeeded",
	"by": "getting",
	"the": "baudcasts",
	"with": [
		{
			"thing": "{thing}",
			"created": 1402642240997,
			"content": {
				"hello": "again"
			}
		},
		{
			"thing": "{thing}",
			"created": 1402640319211,
			"content": {
				"hello": "world"
			}
		}
	]
}
```

The latest *baudcast* made by a thing can be retrieved by making a call to the following URL:

```
http://{some-host}:3000/get/last/baudcast/from/{thing}
```

The server will return a single baudcast in the following form:

```json
{
	"this": "succeeded",
	"by": "getting",
	"the": "baudcast",
	"with": {
		"thing": "{thing}",
		"created": 1402642240997,
		"content": {
			"foo": "bar",
			"baz": "qux"
		}
	}
}
```

Apart from the API endpoints, a device can also subscribe to a *thing* (or publish a new *baudcast*) using the popular **socket.io** framework.

To use *baudcast* with js, just include the **socket.io** script:

```html
<script src="https://cdn.socket.io/socket.io-1.0.4.js"></script>
```

and use the following code:

```javascript
var socket = io('http://{some-host}:8888');

socket.emit('subscribe', '{thing}'); // you can subscribe to as many things you like

socket.on('baudcast', function(baudcast) {
	// do your magic here
	console.log(baudcast);

});

socket.emit('baudcast', '{another-thing}', {ping: 'pong'});
```

Each *baudcast* received, for a subscribed *thing* will be an Object of the form:

```
{
	thing: "{thing}",
	created: 1402642240997,
	content: {
		foo: "bar",
		baz: "qux"
	}
}
```

## API

#### for(thing, content)

This function makes a new *baudcast* for a *thing*.

#### from(thing, callback)

This function executes callback(baudcast) everytime a *thing* makes a new *baudcast*.

#### route.makeNewBaudcast(req, res)

This is the app handler for making a new *baudcast*. This supports POST as well as GET variables.

#### route.getLastBaudcast(req, res)

This is the handler for retrieving the most recent *baudcast* made by a *thing*.
Since *baudcasts* are realtime and ephemeral, they are only stored for 24 hours.

#### route.getBaudcasts(req, res)

This is the handler for retrieving all the *baudcasts* made by a *thing*.
Again, because *baudcasts* are ephemeral, only the last 800 *baudcasts* are stored.

#### useTemplate(newTemplate)

This function is used to specify the response template of the REST API. Note that it's argument is a JSON object that should contain the methods `respondSuccess` and `respondFailure`, whose signatures should follow guidelines in the example.