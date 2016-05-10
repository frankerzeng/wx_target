define(function (require) {
    "use strict";
    var N = require('now');

    //重写quickfrm默认值，适应1024 * 786
    $.fn.quickfrm.defaults.maxHeight = document.documentElement.clientHeight - 150;

    var Sys = function () {
    };
    Sys.prototype = {
        constructor: Sys,

        sec2hour : function (second, chinese) {
            var str = '',
                h = 0,
                tstr = '',
                m = 0;
            if (second > 3600) {
                h = Math.floor(second / 3600);
                second = second % 3600;
                tstr = chinese ? '小时' : ':';
                if (h < 10) {
                    str += '0' + h + tstr;
                } else {
                    str += h + tstr;
                }
            }
            if (second > 60) {
                m = Math.floor(second / 60);
                second = second % 60;
                tstr = chinese ? '分钟' : ':';
                if (m < 10) {
                    str += '0' + m + tstr;
                } else {
                    str += m + tstr;
                }

            }

            tstr = chinese ? '秒' : '';
            if (second < 10) {
                str += '0' + second + tstr;
            } else {
                str += second + tstr;
            }

            return str;
        },

        /**
         * 显示num级页面
         * @param para
         */
        showClassify: function(para){
            // 滚动到页面顶部
            $(document).scrollTop(0);
            if (!para || !para.show_type) {
                return $('#divMain');
            } else {
                var num = para.num,
                    showDiv = 'divMainChild' + num,
                    hideDiv = 'divMainChild' + (num-1);
                $('#divMainHeader,#' + showDiv).show();
                $('#' + hideDiv).hide();
                return $('#'+showDiv);
            }
        },

        cmd: function (cmd, para, okFun, errFun, sync, cmsg) {
            var sys = require('sys');
           /* if (sys.session!==undefined && N.cookie('nnss_ts')!=='') {
                if (parseInt(N.cookie('nnss_ts'))!==parseInt(sys.session.nnss_ts)) {
                    window.alert('其他账号已经登录');
                    window.location.href = window.location.href;
                    return;
                }
            }*/
            if ($.isFunction(para)) {
                cmsg = sync;
                sync = errFun;
                errFun = okFun;
                okFun = para;
                para = {};
            }

            if(cmsg){
                $.alertMsg('提示', cmsg, true);
            }
            N._cmd(cmd, para, function (ret) {
                if(cmsg){
                    $('#_nui_alertmsg .close').click();
                }

                if (ret.s === true) {
                    okFun(ret);
                } else {
                    if ($.isFunction(errFun)) {
                        errFun(ret);
                    } else {
                        if (parseInt(ret.s) === 1002) {
                            $.dialog('出错提示', ret.m,
                                [
                                    {text: '确定', primary: true, okfun: function () {
                                        window.location.href = sys.cfg.index + '/login';
                                    }}
                                ], true);
                        } else {
                            $.alertMsg('出错提示', ret.m);
                        }
                    }
                }
            }, function (ret) {
                if(cmsg){
                    $('#_nui_alertmsg .close').click();
                }

                if ($.isFunction(errFun)) {
                    errFun(ret);
                } else {
                    if (ret.m) {
                        $.alertMsg('出错提示', ret.m);
                    } else {
                        $.alertMsg('出错提示', ret);
                    }
                }
            }, sync);
        },

        /**
         * pc端的链接跳转  返回链接地址|对js跳转的处理 地址链接必须用位静态链接：/base/stu/import/unit_id/1111111/
         * @author 陈梅妹
         */
        pcLink: function (href, fun, winName, winParam) {
            var baseUrl = '/index.php?_s='+this.session.sid+'&_c=main.page.index&to_link=';

            if(typeof href === 'string' && href.indexOf('http') === -1){
                baseUrl += 'http://'+this.url;
            }

            if($.isFunction(fun)){
                if(this.session.platform === 'pc'){
                    window.open(baseUrl+href, winName, winParam);
                }else{
                    fun();
                }
            }else{
                return baseUrl+href;
            }
        },

        /**
         * pc端的链接跳转  对 <a class="_pcLink"></a>的批量处理 地址链接必须用位静态链接：/base/stu/import/unit_id/1111111/
         * @author 陈梅妹
         */
        batPcLink: function(obj){
            var sys = this;
            if(sys.session.platform === 'pc'){
                var find;
                if(obj){
                    find = obj.find('a._pcLink');
                }else{
                    find =  $("a._pcLink");
                }

                find.each(function(){
                    var href = $(this).attr('href');

                    $(this).attr('href', sys.pcLink(href));
                    $(this).attr('target', '_blank');
                });
            }
        },

        /**
         * post大数据同时打开新的窗口
         * @author 陈梅妹
         * @param  name 窗口名字
         */
        openPostWindow:function(url, data, name){
            var tempForm = document.createElement("form");
            tempForm.id="tempForm1";
            tempForm.method="post";
            tempForm.action=url;
            tempForm.target=name;

            var digui=function(data,name){
                if(typeof data=='object'){
                    $.each(data,function(i,e){
                        digui(e,i);
                    });
                }else{
                    var hideInput = document.createElement("input");
                    hideInput.type="hidden";
                    hideInput.name= name;
                    hideInput.value= data;
                    tempForm.appendChild(hideInput);
                    return;
                }
            };

            var openWindow=function(name){
                window.open(name, '_self','height=400, width=400, top=0, left=0, toolbar=yes, menubar=yes, scrollbars=yes, resizable=yes,location=yes, status=yes');
            };

            digui(data);

            if (window.addEventListener) {
                tempForm.addEventListener("onsubmit",function(){
                    openWindow(name);
                });

                document.body.appendChild(tempForm);
                tempForm.submit();
                document.body.removeChild(tempForm);
            } else if (window.attachEvent) {
                tempForm.attachEvent("onsubmit",function(){
                    openWindow(name);
                });
                document.body.appendChild(tempForm);
                tempForm.fireEvent("onsubmit");
                tempForm.submit();
                document.body.removeChild(tempForm);
            }
        },

        setDispose: function (cb) {
            this.disCb = cb;
        },

        dispose: function () {
            if ($.isFunction(this.disCb)) {
                this.disCb();
                this.disCb = '';
            }
        }
    };
    var sys = new Sys();
    N.cmd = sys.cmd;
    return new Sys();
});