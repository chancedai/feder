(function(module) {
	var http = require('http');
	http.globalAgent.maxSockets = 1024;
	function requestWithTimeout(options, callback,timeout) {
		var timerId,
			req = http.request(options, function(res) {
				res.on('end', function() {
					clearTimeout(timerId);
				});
				res.on('close', function() {
					clearTimeout(timerId);
				});
				res.on('abort', function() {
				});
				callback(res);
			});

		req.on('timeout', function(e) {
			req.res && req.res.abort();
			req.abort();
		});
		timerId = setTimeout(function() {
			req.emit('timeout', {
				message: 'have been timeout...'
			});
		}, timeout);

		return req;
	}
	module.exports = function (request, response, serverPort) {
		response.header('X-Proxyed-By' ,'feder');
		serverPort = serverPort || 80;
		var proxyRequest = requestWithTimeout({
			host	: request.headers.host,
			port	: serverPort,
			path	: request.url,
			method	: request.method,
			headers	: request.headers,
			agent	: false
		}, function(proxyResponse) {
			proxyResponse.pipe(response);
			response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
		}, 5e3);
		proxyRequest.on('error', function(e) {

		});
		proxyRequest.on('timeout', function(e) {

		});
		request.pipe(proxyRequest);
	}
})(module);
