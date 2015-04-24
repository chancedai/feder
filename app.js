/**
 * Module dependencies.
 */
// https://scotch.io/bar-talk/expressjs-4-0-new-features-and-upgrading-from-3-0
process.setMaxListeners(0);
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
// Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it.
var methodOverride = require('method-override');
var errorHandler = require('errorHandler');
var partials = require('express-partials');
var serveIndex = require('serve-index')

var routes = require('./routes');
var settings = require('./settings');

var app = module.exports = express();

process.on('uncaughtException', function(err) {
	console.error('Caught exception: ', err);
});


if (!fs.existsSync(settings.documentRoot)) {
	console.error('Fatal Error: ' + settings.documentRoot + ' does not exist.\n You must set correct "documentRoot" in settings.js and restart!');
	process.exit(1);
}

// 设置
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser());
app.use(methodOverride());

// 代理
routes(app);
// 静态目录
app.use(express.static(__dirname + '/static'));
if (settings.documentRoot){
	//下面的2句必须在自定义路由规则之后
	app.use(express.static(settings.documentRoot));
	app.use(serveIndex(settings.documentRoot));
}


var env = process.env.NODE_ENV || 'development';
if ('development' === env) {
   app.use(errorHandler({ dumpExceptions: true, showStack: true }));
}else if('production'=== env){
    app.use(errorHandler());
}

var listener = app.listen(80);
console.log("Express server listening on port %d in %s mode", listener.address().port, app.settings.env);




