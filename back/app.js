/**
 * Module dependencies.
 */
process.setMaxListeners(0);
var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorHandler');
var serveIndex = require('serve-index')

var routes = require('./routes');

var app = module.exports = express();

process.on('uncaughtException', function(err) {
	console.error('Caught exception: ', err);
});


// 设置
app.use(bodyParser());
app.use(methodOverride());

// 代理
routes(app);
// 静态目录
app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname));
app.use(serveIndex(__dirname));

app.engine('.html', ejs.__express);

var env = process.env.NODE_ENV || 'development';
if ('development' === env) {
   app.use(errorHandler({ dumpExceptions: true, showStack: true }));
}else if('production'=== env){
    app.use(errorHandler());
}

var listener = app.listen(4000);
console.log("feder backend server listening on port %d in %s mode", listener.address().port, app.settings.env);




