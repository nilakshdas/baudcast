# baudcast

An open source, socket-based, realtime messaging API; designed for the **internet of things**.

*baudcast* allows machine-to-machine (M2M) communication of internet-connected devices over a simple and configurable REST API.
No registration/setup required, start *baudcasting* and receiving key-value data right away.

## Installation

Open your app's node_modules folder in the terminal and do:

```sh
$ git clone https://github.com/nilakshdas/baudcast.git
$ cd baudcast/
$ npm install
```

## Usage

```javascript
var app = require('express')();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var client = require('redis').createClient();
var baudcast = require('baudcast')(server, client);

app.use(bodyParser());

app.get('/', function(req, res) { res.send('<i>baudcasting</i> things...'); });

app.post('/baudcast/:thing', baudcast.handleMakeNewBaudcast); // make a baudcast
app.get('/baudcasts/:thing/last', baudcast.handleGetLastBaudcast); // get last baudcast
app.get('/baudcasts/:thing', baudcast.handleGetBaudcasts); // get last 800 baudcasts

app.listen(3000);
server.listen(8888);
console.log('Server on port 3000, socket on port 8888...');
```

Apart from the API endpoint, a device can also subscribe to a *thing* using the popular `socket.io` framework.

For subscribing to a *thing* using javascript, just include the main script

```html
<script src="https://cdn.socket.io/socket.io-1.0.4.js"></script>
```

and use the following script:

```javascript
var socket = io('http://<some-host>:8888');

socket.emit('subscribe', 'my-thing'); // you can subscribe to as many things you like

socket.on('baudcast', function(baudcast) {
	// do your magic here
	console.log(baudcast);

});
```

## API

### handleMakeNewBaudcast

This is the app handler for making a new *baudcast*. This supports POST as well as GET variables.

### handleGetLastBaudcast

This is the handler for retrieving the most recent *baudcast* made by a *thing*.
Since the *baudcasts* are realtime and ephemeral, they are only stored for 24 hours.

### handleGetBaudcasts

This is the handler for retrieving all the *baudcasts* made by a *thing*.
Again, because *baudcasts* are ephemeral, only the last 800 *baudcasts* are stored.