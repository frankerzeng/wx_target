<%@ page contentType="text/html; charset=UTF-8"%>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>上善100公益</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <link href="nowjs/bootstrap.css" rel="stylesheet">
    <link href="nowjs/nui.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
    <script src="nowjs/jquery.js"></script>
    <script src="nowjs/bootstrap.js"></script>
    <script src="nowjs/module.js"></script>
</head>
<body>
    <div class="navbar navbar-inverse">
        <div class="header-inner" id="header">
            <div class="container-fluid">
                <a class="brand logo" href="javascript:;"><!-- <img src="img/logox.png"/> -->上善100公益</a>
            </div>
        </div>
    </div>
    <div class="container" id="container"></div>
    <div class="footer foot-posi">
        <p>&copy; 2016 网龙公司&nbsp;&nbsp;&nbsp;本系统建议使用IE7.0以上浏览器 1024X768以上分辨率浏览，以获得最佳的使用效果。</p>
    </div>
    <script>
    //window.history.forward(1);
    define(function(require, exports){
        setup('js/', ['now','nui','sys']);
        var N = require('now');
        var sys = require('sys');

        sys.url = "./";
        
        N.cfg.index = "${indexUrl}";
        window.app_url_index = N.cfg.index;

        sys.cmd('/comm', {}, function(ret) {
            N.cfg.check = ret.o.rows[0];
            var index = require('index');
            index.login();
        });
    });
    </script>
</body>
</html>