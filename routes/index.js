var http = require('http');
var fs = require('fs');
var settings = require('../settings');
http.globalAgent.maxSockets = 1024;
// 带超时的请求
function requestWithTimeout(options, callback, timeout) {
    var timerId,
        req = http.request(options, function(res) {
            res.on('end', function() {
                clearTimeout(timerId);
            });
            res.on('close', function() {
                clearTimeout(timerId);
            });
            res.on('abort', function() {});
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
function proxyService (request, response, serverPort){
    response.header('X-Proxyed-By', 'feder');
    serverPort = serverPort || 80;
    var proxyRequest = requestWithTimeout({
        host: request.headers.host,
        port: serverPort,
        path: request.url,
        method: request.method,
        headers: request.headers,
        agent: false
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
module.exports = function(app) {
    app.use(function(req, res, next) {
        var host = req.headers.host;
        if (req.url.indexOf(host) !== 1) {
            req.url = '/' + host + req.url;
        }
        req.url = decodeURIComponent(req.url);
        res.header('X-Local-Server-Url', req.url);
        url = settings.documentRoot + req.url.split('?')[0];
        // console.log(url,fs.existsSync(url));
        if (fs.existsSync(url)) {
            next();
        } else {
            settings.autoProxy ? proxyService(req, res, 80) : next();
        }
    });

    app.post('/post', function(req, res) {
        var currentUser = req.session.user;
        var post = new Post(currentUser.name, req.body.post);
        post.save(function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '發表成功');
            res.redirect('/u/' + currentUser.name);
        });
    });
};