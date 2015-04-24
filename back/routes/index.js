var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var exec = require('child_process').exec;
var iconv = require('iconv-lite');
http.globalAgent.maxSockets = 1024;
var mime = {
    "shtml" : "text/html",
    "htm" : "text/html",
    "html" : "text/html",
    "css"  : "text/css",
    "js"   : "text/javascript",
    "json" : "application/json",
    "ico"  : "image/x-icon",
    "gif"  : "image/gif",
    "jpeg" : "image/jpeg",
    "jpg"  : "image/jpeg",
    "png"  : "image/png",
    "pdf"  : "application/pdf",
    "svg"  : "image/svg+xml",
    "swf"  : "application/x-shockwave-flash",
    "tiff" : "image/tiff",
    "txt"  : "text/plain",
    "wav"  : "audio/x-wav",
    "wma"  : "audio/x-ms-wma",
    "wmv"  : "video/x-ms-wmv",
    "xml"  : "text/xml"
};
var htmlspecialchars =  function(str) {
        if (!str){
            return '';
        }
        return str.
            replace(/&/g, '&amp;').
            replace(/</g, '&lt;').
            replace(/>/g, '&gt;').
            replace(/"/g, '&quot;').
            replace(/'/g, '&#039;');
    };
// 下载静态文件
var download_file_httpget = function(fileUrl,filePathWidthName,cb) {
    var options = {
        host: url.parse(fileUrl).host,
        port: 80,
        path: url.parse(fileUrl).pathname,
        method:'GET'
    };

    var file;
    var timerId;
    fs.unlink(filePathWidthName, function (err) {
        file = fs.createWriteStream(filePathWidthName);
        http.get(options, function(res) {
            res.on('data', function(data) {
                file.write(data);
            }).on('end', function() {
                file.end();
                cb();
                clearTimeout(timerId);
            });
        });
        timerId = setTimeout(function(){
            file.end();
            cb();
        }, 10e3);
    });
};
// 在本地创建静态文件
var createFile = function(file,filePath,fileName,cb){
    var root = 'G:/federProxy/';
    var urlObj = url.parse(file);
    if(!fs.existsSync(filePath)){
        mkdirp(filePath,function(err){
            if(err){
                cb(err);
            }else{
                download_file_httpget(file,filePath+fileName,cb);
            }
        });
    }else{
        download_file_httpget(file,filePath+fileName,cb);
    }
};
// 从url获取静态文件信息，路径，文件名等
var getFileInfo = function(file,cb){
    var root = 'G:/federProxy/';
    if(!file){
        cb(root,'','');
        return;
    }
    var urlObj = url.parse(file);
    var filePath = [root,urlObj.hostname,urlObj.pathname].join('/');
    var extname = path.extname(urlObj.pathname);
    var fileName = urlObj.pathname.split('/').pop();
    filePath = filePath.replace(fileName,'');
    cb(filePath,fileName,extname);
};
var addFile = function(req,res){
    var file = (req.body.file||'').trim();
    res.writeHead(200, {
            'Content-Type' : 'text/html;charset=utf-8'
    });
    getFileInfo(file,function(filePath,fileName,extname){
        var type = extname.slice(1);
        if(mime[type]){
            createFile(file,filePath,fileName,function (err) {
                var status = '添加成功';
                if (err){
                    console.log(err);
                    status = '添加失败';
                }
                res.write('<a href="/">'+file+status+'，返回部署首页</a>', 'utf-8');
                res.end('');
            });
        }else{
            res.write('<a href="/">'+file+'不是有效的静态文件地址，返回部署首页</a>', 'utf-8');
            res.end('');
        }

    });
};
// 显示文件
var showFile = function(req,res){
    // 文件地址
    var file = (req.query.file||'').trim();
    getFileInfo(file,function(filePath,fileName,extname){
        if(!fileName||!extname||!fs.existsSync(filePath+fileName)){
            res.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            res.write("This request URL " + file + " was not found on this server.");
            res.end();
        }else{
            // 读取文件并显示到页面 TODO
            fs.readFile(filePath+fileName, "binary", function (err, fileData) {
                if (err) {
                    res.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    res.end(err);
                } else {
                    var type = extname.slice(1);
                    var contentType = mime[type] || 'text/plain';
                    var modes = {
                        js:'javascript',
                        css:'css',
                        html:'htmlmixed'
                    };
                    var modejs = (modes[type]||'htmlmixed');
                    var mode = modejs
                    if(modejs==='htmlmixed'){
                        mode = '';
                    }
                    fileData = htmlspecialchars(iconv.decode(fileData, 'utf-8'));
                    // fileData = htmlspecialchars(fileData);
                    var content = [
                    '<!doctype html>',
                    '<title>静态文件编辑-feder</title>',
                    '<meta charset="utf-8"/>',
                    '<link rel="stylesheet" href="static/codemirror/lib/codemirror.css">',
                    '<link rel="stylesheet" href="static/codemirror/addon/fold/foldgutter.css">',
                    '<link rel="stylesheet" href="static/codemirror/addon/dialog/dialog.css">',
                    '<link rel="stylesheet" href="static/codemirror/theme/monokai.css">',
                    '<script>',
                        'FEDERDATA = {',
                            'mode:"'+mode+'"',
                        '};',
                    '</script>',
                    '<script src="static/codemirror/lib/codemirror.js"></script>',
                    '<script src="static/codemirror/addon/search/searchcursor.js"></script>',
                    '<script src="static/codemirror/addon/search/search.js"></script>',
                    '<script src="static/codemirror/addon/dialog/dialog.js"></script>',
                    '<script src="static/codemirror/addon/edit/matchbrackets.js"></script>',
                    '<script src="static/codemirror/addon/edit/closebrackets.js"></script>',
                    '<script src="static/codemirror/addon/comment/comment.js"></script>',
                    '<script src="static/codemirror/addon/wrap/hardwrap.js"></script>',
                    '<script src="static/codemirror/addon/fold/foldcode.js"></script>',
                    '<script src="static/codemirror/addon/fold/brace-fold.js"></script>',
                    '<script src="static/codemirror/mode/'+modejs+'/'+modejs+'.js"></script>',
                    '<script src="static/codemirror/keymap/sublime.js"></script>',
                    '<script src="static/codemirror/addon/selection/active-line.js"></script>',
                    '<script src="static/js/jquery.js"></script>',
                    '<article id="Feder_20150421104106">',
                    '<form feder-type="form" method="POST" action="/edit">',
                    '<input feder-type="file" name="file" type="hidden" value="'+file+'"/>',
                    '<textarea feder-type="content" name="content" style="display:none;">'+ fileData +'</textarea>',
                    '<input feder-type="submit" type="submit" value="提交"/>',
                    '</form>',
                    '</article>',
                    '<script src="static/js/edit.js"></script>'].join('\n');
                    res.writeHead(200, {'Content-Type':'text/html' });
                    res.write(content, 'utf-8');
                    res.end();
                }
            });
        }
    });
};
// 编辑文件
var editFile = function(req,res){
    // 文件地址
    var file = (req.body.file||'').trim();
    var type = (req.body.type||'').trim();
    // 文件内容
    var content = (req.body.content||'').trim();
    getFileInfo(file,function(filePath,fileName,extname){
        if(!fileName||!extname||!fs.existsSync(filePath+fileName)){
            if(type==='json'){
                res.send({
                    code:1,
                    msg:'file was not found',
                    data:''
                });
            }else{
                res.writeHead(404, {
                    'Content-Type': 'text/plain'
                });
                res.write("This request URL " + file + " was not found on this server.");
                res.end();
            }
        }else{
            // 保存文件
            var openFile = fs.createWriteStream(filePath+fileName);
            openFile.write(content);
            openFile.end();
            if(type==='json'){
                res.send({
                    code:0,
                    msg:'file was saved',
                    data:''
                });
            }else{
                res.writeHead(200, {'Content-Type':'text/html' });
                res.write('file was saved!', 'utf-8');
                res.end();
            }

        }
    });
};
var render = {
    add:function(res){
        // res.redirect('/add.html');
        res.render('page-add.ejs',{
            project:'Feder',
            title:'添加文件',
            pageType:'add'
        });
    },
    edit:function(res){

    }
};
module.exports = function(app) {
    app.get('/', function(req, res) {
        render.add(res);
    });
    app.get('/add', function(req, res) {
        render.add(res);
    });
    app.post('/add', function(req, res) {
        addFile(req,res);
    });
    app.get('/edit', function(req, res) {
        showFile(req,res);
    });
    app.post('/edit', function(req, res) {
        editFile(req,res);
    });
};