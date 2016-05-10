define(function (require) {
    "use strict";
    var sys = require('sys'),
        N = require('now');

    var Index = function () {
        // 禁止密码输入框复制黏贴拷贝
        $("body").on("copy cut paste",'input[type=password]',function(e){
            return false;
        });
    };

    Index.prototype = {
        constructor: Index,

        /**
         * 登陆界面
         * @author zj
         * */
        login : function () {
            var append = '<div id="divLogin"></div>';
            $('#container').addClass('mgt-20').append(append);

            //登录弹出框
            $('#divLogin').quickfrm({
                fields: [
                    {name: 'account', id: 'log_account', text: '账号：', mdl: 'base', tbl:'user', must: true},
                    { name: 'password', id: 'log_pwd', text: '密码：', type: 'password', mdl: 'base', tbl:'user', must:true }
                ],
                title: '用户登录',
                submit: '登录',
                cmd: '/logined',
                para: {},
                dialog: false,
                otherCss: 'login-form',
                submitCss: 'btn-primary btn-medium mgl-18'
            }).on('cmdOk', function (e, ret) {
                console.log(N.cfg);
                // 登录成功后跳转
                window.location.href = N.cfg.index + '/index';
            });
        },

        //总部
        main: function (para) {
            var self = this;
            self.init();
            $('#menulist').on('select',function (e, row) {
                console.log(row);
                var _cls;
                if (row.mdl.indexOf('/') === -1) {
                    //没找到
                    _cls = require('main/' + row.mdl);
                } else {
                    _cls = require(row.mdl);
                }
                _cls[row.menu]();
                sys.dispose();
                $(document).scrollTop(0);
            }).on('load',function (e, row) {
                if (!$.isEmptyObject(row)) {
                    var i = 0,
                        first_role = {};
                    if (row._child) {
                        $.each(row._child, function (key, val) {
                            if (i === 0) {
                                first_role = val;
                            }
                            i++;
                        });
                    } else {
                        first_role = row;
                    }

                    setTimeout(function () {
                        $('#menulist').menulist('select', first_role.id);
                        $('#_goTo').quickto('set', first_role.id);
                    }, 500);
                }
            }).menulist({
                data: '/menu',
                firstOpen: false,
                quickToId: '_goTo',
                css: 'nex-menulist',
                closeOthers: true
            });
        },
        
        //单位
        unit: function (para) {
            var self = this;
            self.init();
            $('#menulist').on('select',function (e, row) {
                console.log(row);
                var _cls;
                if (row.mdl.indexOf('/') === -1) {
                    //没找到
                    _cls = require('main/' + row.mdl);
                } else {
                    _cls = require(row.mdl);
                }
                _cls[row.menu]();
                sys.dispose();
                $(document).scrollTop(0);
            }).on('load',function (e, row) {
                if (!$.isEmptyObject(row)) {
                    var i = 0,
                        first_role = {};
                    if (row._child) {
                        $.each(row._child, function (key, val) {
                            if (i === 0) {
                                first_role = val;
                            }
                            i++;
                        });
                    } else {
                        first_role = row;
                    }

                    setTimeout(function () {
                        $('#menulist').menulist('select', first_role.id);
                        $('#_goTo').quickto('set', first_role.id);
                    }, 500);
                }
            }).menulist({
                data: '/unit_menu',
                firstOpen: false,
                quickToId: '_goTo',
                css: 'nex-menulist',
                closeOthers: true
            });
        },

        //初始化，当加载divMain时调用，并绑定该页面元素的事件
        init: function () {

            $('#container').on('click', 'li._pill_tabs', function () {
                //处理二级页面点击(后台管理)
                var $a = $(this),
                    $p = $a.parent(),
                    mdl = $p.attr('module');

                $('li.active', $p).removeClass('active');
                $a.addClass('active');

                var _menu = $a.attr('menu');
                var _cls = require(mdl);
                sys.dispose();
                _cls[_menu]();
            });

            $('#fxl_logout').on('click', function(){
                sys.cmd('/logout', {}, function() {
                    location.href = N.cfg.index + '/login';
                });
            });
            /**
             * 单位管理员退出
             */
            $('#unit_logout').on('click', function(){
                sys.cmd('/unit_logout', {}, function() {
                    location.href = '/gyt-web';
                });
            });
        }

    };

    return new Index();
});
