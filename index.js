(function() {
	"use strict";

	module.exports = function(server, client) {
		if (!server) {
			var server = require('http').Server();

			server.listen(8888);
		}

		if (!client) {
			var client = require('redis').createClient();
		}

		var io = require('socket.io')(server);
		var EventEmitter = require('events').EventEmitter;

		io.sockets.on('connection', function(socket) {
			socket.on('subscribe', function(thing) {
				if (typeof thing == 'string')
					socket.join(thing);
			});

			socket.on('unsubscribe', function(thing) {
				if (typeof thing == 'string')
					socket.leave(thing);
			});

			socket.on('baudcast', function(thing, content) {
				if (typeof thing == 'string')
					baudcast.for(thing, content);
			});
		});

		var emitter = new EventEmitter();

		var template = {
			verb: {
				get: 'get',
				create: 'create'
			},

			respondSuccess: function (action, resourceType, data) {
				var response = {};

				response[resourceType] = data;

				return response;
			},

			respondFailure: function(why, apiErrorCode) {
				var response = {
					error : {
						code: apiErrorCode || 500,
						message: why
					}
				};

				return response;
			}
		};

		var baudcast = {route: {}};

		baudcast.for = function(thing, content) {
			var data = {
				thing: thing,
				created: (new Date()).getTime(),
				content: content
			};

			emitter.emit(thing+'-baudcast', data);
			io.sockets.in(thing).emit('baudcast', data);

			client.set(thing+':last-baudcast', JSON.stringify(data));
			client.lpush(thing+':baudcasts', JSON.stringify(data));

			client.llen(thing+':baudcasts', function(err, len) {
				if (len > 800)
					client.rpop(thing+':baudcasts');
			});

			client.expire(thing+':last-baudcast', 86400);
			client.expire(thing+':baudcasts', 86400);
		};

		baudcast.from = function(thing, callback) {
			emitter.on(thing+'-baudcast', callback);
		};

		baudcast.useTemplate = function(newTemplate) {
			template = newTemplate;
		};

		baudcast.route.makeNewBaudcast = function(req, res) {
			var thing = req.params.thing, content;

			if (req.body !== undefined && Object.keys(req.body).length != 0)
				content = req.body;
			else if (req.query !== undefined && Object.keys(req.query).length != 0)
				content = req.query;
			else
				return res.json(template.respondFailure('Invalid request.', 400));

			var data = {
				thing: thing,
				created: (new Date()).getTime(),
				content: content
			};

			emitter.emit(thing+'-baudcast', data);
			io.sockets.in(thing).emit('baudcast', data);

			client.set(thing+':last-baudcast', JSON.stringify(data));
			client.lpush(thing+':baudcasts', JSON.stringify(data));

			client.llen(thing+':baudcasts', function(err, len) {
				if (len > 800)
					client.rpop(thing+':baudcasts');
			});

			client.expire(thing+':last-baudcast', 86400);
			client.expire(thing+':baudcasts', 86400);

			return res.json(template.respondSuccess('create', 'baudcast', data));
		};

		baudcast.route.getBaudcasts = function(req, res) {
			var thing = req.params.thing;

			return client.lrange(thing+':baudcasts', 0, -1, function(err, reply) {
				if (err) {
					console.log('Redis error: '+err);
					return [];
				}

				var data = [];

				for (var i = 0; i < reply.length; i++)
					data.push(JSON.parse(reply[i]));

				if (data.length > 0)
					return res.json(template.respondSuccess('get', 'baudcasts', data));
				else
					return res.json(template.respondFailure('Could not find any baudcasts from '+thing+'.', 404));
			});
		};

		baudcast.route.getLastBaudcast = function(req, res) {
			var thing = req.params.thing;

			return client.get(thing+':last-baudcast', function(err, reply) {
				if (err) {
					console.log('Redis error: '+err);
					return null;
				}

				var data = JSON.parse(reply);

				if (data !== null)
					return res.json(template.respondSuccess('get', 'baudcast', data));
				else
					return res.json(template.respondFailure('Could not find any baudcasts from '+thing+'.', 404));
			});
		};

		return baudcast;
	}
})();