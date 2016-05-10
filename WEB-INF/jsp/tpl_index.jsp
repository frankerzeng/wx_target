<%@ page contentType="text/html; charset=UTF-8"%>
<!DOCTYPE html>
<html  lang="en">
<head>
    <title>上善100公益</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="nowjs/bootstrap.css" rel="stylesheet">
    <link href="nowjs/nui.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
</head>
<body>
    <div class="navbar navbar-inverse">
        <div class="header-inner" id="header">
            <div class="container-fluid">
                <div class="row-fluid">
                    <a class="brand logo"><!-- <img src="img/logox.png" /> -->上善100公益</a>
                    <div class="current-user">
                        <div class="pull-left user">
                            <i></i>
                            <span>当前用户：</span>
                            <span style="font-family: calluna, Georgia, serif;" class="brand-name" id="stuName">${name}</span>
                        </div>
                        <div class="pull-left quit">
                            <a id="fxl_logout" href="javascript:void(0)"><i></i>退出</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="current-path">
            <span id="_goTo">您当前的位置：<a href="javascript:;" class="_quick-to-single"></a></span>
        </div>
    </div>
    <div class="container-fluid contain-body" id="container">
        <div id="techTree">
            <div id="divMenu">
                <div id="menulist"></div>
            </div>
            <div id="divContent">
                <div id="divMain"></div>
            </div>
        </div>
    </div>
    <div class="footer">
        <p>&copy; 2016 网龙公司</p>
    </div>

    <script src="nowjs/jquery.js"></script>
    <script src="nowjs/bootstrap.js"></script>
    <script src="nowjs/module.js"></script>

    <script>
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
                index.main();
            });



        });
    </script>
</body>
</html>