define(function(){
    var store = {
        accessToken: "",
        cloudSiteUrl: "",
        appId: 0,

        getAuthUrl: function (url) {
            return this.cloudSiteUrl + url + "?accesstoken=" + this.accessToken + "&appId=" + this.appId;
        },
        create: function (success) {
            $.ajax({
                url: this.getAuthUrl("/v1/cloud/syncmessage/create"),
                dataType: "jsonp",
                jsonp: "jsonpcallback",
                cache: false,
                async: false,
                data: null,
                success: success
            });
        },

        close: function (sessionKey, success) {
            $.ajax({
                url: this.getAuthUrl("/v1/cloud/syncmessage/close"),
                dataType: "jsonp",
                jsonp: "jsonpcallback",
                cache: false,
                async: false,
                data: { sessionKey: sessionKey },
                success: success
            });
        },

        read: function (sessionKey, success) {
            $.ajax({
                url: this.getAuthUrl("/v1/cloud/syncmessage/read"),
                dataType: "jsonp",
                jsonp: "jsonpcallback",
                cache: false,
                async: false,
                data: { sessionKey: sessionKey },
                success: success
            });
        }
    };

    return {
        model: {
            sessionKey: "",
            receiveMessageCallback: null,
            isInit: false,
            staticServerUrl: ""
        },

        getUrlParam: function (name, url) {
            var paraString = url.substring(url.indexOf("?") + 1, url.length).split("&");
            var paraObj = {};
            var j = paraString[0];
            for (i = 0; j; i++) {
                paraObj[j.substring(0, j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=") + 1, j.length);
                j = paraString[i];
            }
            var returnValue = paraObj[name.toLowerCase()];
            if (typeof (returnValue) == "undefined") {
                return "";
            }
            else {
                return returnValue;
            }
        },

        Init: function (cloudSiteUrl, staticServerUrl) {
            if (cloudSiteUrl !== undefined && cloudSiteUrl !== null && cloudSiteUrl !== "") {
                this.setCloudSiteUrl(cloudSiteUrl);
            }
//if (accessToken != undefined && accessToken != null && accessToken != "") {
            //    store.accessToken = accessToken;
            //}
//if (appId != undefined && appId != null && appId > 0) {
            //    store.appId = appId;
            //}
            if (staticServerUrl !== undefined && staticServerUrl !== null && staticServerUrl !== "") {
                this.model.staticServerUrl = staticServerUrl;
            }

            this.model.isInit = true;
        },

        setCloudSiteUrl: function (siteUrl) {
            if (typeof (siteUrl) !== undefined || siteUrl !== null || siteUrl !== "") {
                var tempUrl = "http://s21.tianyuimg.com";
                if (siteUrl.indexOf("release.") >= 0) {
                    tempUrl = "http://release.cloud.91open.com/script/";
                }
                else if (siteUrl.indexOf("test.") >= 0) {
                    tempUrl = "http://new.static.huayu.nd";
                }
                else if (siteUrl.indexOf("dev.") >= 0) {
                    tempUrl = "http://dev.static.huayu.nd";
                }
                else if (siteUrl.indexOf("debug.") >= 0) {
                    tempUrl = "http://debug.static.huayu.nd";
                }

                this.staticServerUrl = tempUrl;

                store.cloudSiteUrl = siteUrl;
            }
        },

        setAccessTokenAndAppId: function (url) {
            var accessToken = this.getUrlParam('accesstoken', url);
            if (accessToken === undefined || accessToken === null || accessToken === "") {
                accessToken = this.getUrlParam('accessToken', url);

                if (accessToken === undefined || accessToken === null || accessToken === "") {
                    this.showAlertMessage("url有误，缺少accesstoken参数！");
                    return false;
                }
            }

            store.accessToken = accessToken;

            var appId = this.getUrlParam('appId', url);
            if (appId === undefined || appId === null || appId === "") {
                appId = this.getUrlParam('appid', url);

                if (appId === undefined || appId === null || appId === "") {
                    this.showAlertMessage("url有误，缺少appid！");

                    return false;
                }
            }

            store.appId = appId;

            return true;
        },
        CreateSession: function (url, receiveMessageCallback, title, btnTitle) {
            var self = this;

            if (!this.setAccessTokenAndAppId(url)) return;

            if (this.model.isInit) {
                store.create(function (data) {
                    self.showMaskDivIncludeParent(function () { self.ReadMessage(); }, "", title, btnTitle);

                    if (typeof (receiveMessageCallback) !== undefined)
                        self.model.receiveMessageCallback = receiveMessageCallback;

                    if (typeof (data.Data.SessionKey) !== undefined)
                        self.model.sessionKey = data.Data.SessionKey;

                    if (typeof (url) !== undefined) {
                        if (navigator.userAgent.indexOf("MSIE") > 0) { //IE浏览器
                            var popup = window.open('', '');
                            try {
                                popup.location.href = url + "&sessionKey=" + self.model.sessionKey;
                                var interval = setInterval(function () {
                                    try {
                                        popup.opener = null;
                                        popup.close();
                                    } catch (e) {
                                        clearInterval(interval);
                                    }
                                }, 200);
                            } catch (e) {
                                popup.close();
                            }
                        } else{
                            //非IE浏览器
                            window.location = url + "&sessionKey=" + self.model.sessionKey;
                        }
                    }
                });
            }
        },

        CloaseSession: function () {
            store.close(model.sessionKey, function (data) {

            });
        },

        ReadMessage: function () {
            var self = this;

            store.read(self.model.sessionKey, function (data) {
                self.model.receiveMessageCallback(data);
            });
        },

        WriteMessage: function () {

        },

// 创建遮罩层并附加到BODY元素下,然后显示遮罩层
        createMaskDiv: function (parent, title, btnTitle) {
            this.alertMessage(title, btnTitle, "");
        },

        showAlertMessage: function (message) {
            this.alertMessage("系统提示", "关闭", message);

            var div = $("#maskDiv");

            if (window.parent !== null)
                div = $(window.parent.document.body).find("#maskDiv");

            if (div.length <= 0) {
                this.createMaskDiv(true, title, btnTitle);

                div = $("#maskDiv");
                if (window.parent !== null)
                    div = $(window.parent.document.body).find("#maskDiv");
            }

            if (div.css("display") === "none") {
                div.show();
                div.next().show();
            }

            div.parent().find("#alert-form .close").on("click", function () {
                div.hide();
                div.parent().find("#alert-form").remove();
            });

            div.parent().find("#btn-close-dialog").on("click", function () {
                div.hide();
                div.parent().find("#alert-form").remove();
            });
        },

        alertMessage: function (title, btnTitle, message) {
            var interTitle = "上传提示", interBtnTitle = "已完成上传";
            if (title !== null && title !== "")
                interTitle = title;
            if (btnTitle !== null && btnTitle !== "")
                interBtnTitle = btnTitle;

            var linkCss = "";
//            linkCss += "<style id='css-modalDialog'>";
//            linkCss += ".close{float:right;font-size:20px;font-weight:bold;line-height:20px;color:#000000;text-shadow:0 1px 0 #ffffff;opacity:0.2;filter:alpha(opacity=20);text-decoration:none;}.close:hover,.close:focus{color:#000000;text-decoration:none;cursor:pointer;opacity:0.4;filter:alpha(opacity=40);}.modal-backdrop{position:fixed;top:0;right:0;bottom:0;left:0;z-index:1040;background-color:#000000;}.modal-backdrop.fade{opacity:0;}.modal-backdrop,.modal-backdrop.fade.in{opacity:0.8;filter:alpha(opacity=80);}.modal{position:fixed;top:10%;left:50%;z-index:1050;width:560px;margin-left:-280px;background-color:#ffffff;border:1px solid #999;border:1px solid rgba(0,0,0,0.3);*border:1px solid #999;-webkit-border-radius:6px;-moz-border-radius:6px;border-radius:6px;outline:none;-webkit-box-shadow:0 3px 7px rgba(0,0,0,0.3);-moz-box-shadow:0 3px 7px rgba(0,0,0,0.3);box-shadow:0 3px 7px rgba(0,0,0,0.3);-webkit-background-clip:padding-box;-moz-background-clip:padding-box;background-clip:padding-box;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#333333;background-color:#ffffff;}.modal.fade{top:-25%;-webkit-transition:opacity 0.3s linear,top 0.3s ease-out;-moz-transition:opacity 0.3s linear,top 0.3s ease-out;-o-transition:opacity 0.3s linear,top 0.3s ease-out;transition:opacity 0.3s linear,top 0.3s ease-out;}.modal.fade.in{top:10%;}.modal-header{padding:9px 15px;border-bottom:1px solid #eee;}.modal-header .close{margin-top:2px;}.modal-header h3{margin:0;line-height:30px;}.modal-body{position:relative;max-height:400px;padding:15px;overflow-y:auto;}.modal-form{margin-bottom:0;}.modal-footer{padding:14px 15px 15px;margin-bottom:0;text-align:right;background-color:#f5f5f5;border-top:1px solid #ddd;-webkit-border-radius:0 0 6px 6px;-moz-border-radius:0 0 6px 6px;border-radius:0 0 6px 6px;*zoom:1;-webkit-box-shadow:inset 0 1px 0 #ffffff;-moz-box-shadow:inset 0 1px 0 #ffffff;box-shadow:inset 0 1px 0 #ffffff;}.modal-footer:before,.modal-footer:after{display:table;line-height:0;content:'';}.modal-footer:after{clear:both;}.modal-footer .btn + .btn{margin-bottom:0;margin-left:5px;}.modal-footer .btn-group .btn + .btn{margin-left:-1px;}.modal-footer .btn-block + .btn-block{margin-left:0;}.btn{display:inline-block;*display:inline;padding:4px 12px;margin-bottom:0;*margin-left:.3em;font-size:14px;line-height:20px;color:#333333;text-align:center;text-shadow:0 1px 1px rgba(255,255,255,0.75);vertical-align:middle;cursor:pointer;background-color:#f5f5f5;*background-color:#e6e6e6;background-image:-moz-linear-gradient(top,#ffffff,#e6e6e6);background-image:-webkit-gradient(linear,0 0,0 100%,from(#ffffff),to(#e6e6e6));background-image:-webkit-linear-gradient(top,#ffffff,#e6e6e6);background-image:-o-linear-gradient(top,#ffffff,#e6e6e6);background-image:linear-gradient(to bottom,#ffffff,#e6e6e6);background-repeat:repeat-x;border:1px solid #cccccc;*border:0;border-color:#e6e6e6 #e6e6e6 #bfbfbf;border-color:rgba(0,0,0,0.1) rgba(0,0,0,0.1) rgba(0,0,0,0.25);border-bottom-color:#b3b3b3;-webkit-border-radius:4px;-moz-border-radius:4px;border-radius:4px;filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffffffff',endColorstr='#ffe6e6e6',GradientType=0);filter:progid:DXImageTransform.Microsoft.gradient(enabled=false);*zoom:1;-webkit-box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 1px 2px rgba(0,0,0,0.05);-moz-box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 1px 2px rgba(0,0,0,0.05);box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 1px 2px rgba(0,0,0,0.05);}.btn:hover,.btn:focus,.btn:active,.btn.active,.btn.disabled,.btn[disabled]{color:#333333;background-color:#e6e6e6;*background-color:#d9d9d9;}.btn:active,.btn.active{background-color:#cccccc \9;}.btn:first-child{*margin-left:0;}.btn:hover,.btn:focus{color:#333333;text-decoration:none;background-position:0 -15px;-webkit-transition:background-position 0.1s linear;-moz-transition:background-position 0.1s linear;-o-transition:background-position 0.1s linear;transition:background-position 0.1s linear;}.btn:focus{outline:thin dotted #333;outline:5px auto -webkit-focus-ring-color;outline-offset:-2px;}.btn.active,.btn:active{background-image:none;outline:0;-webkit-box-shadow:inset 0 2px 4px rgba(0,0,0,0.15),0 1px 2px rgba(0,0,0,0.05);-moz-box-shadow:inset 0 2px 4px rgba(0,0,0,0.15),0 1px 2px rgba(0,0,0,0.05);box-shadow:inset 0 2px 4px rgba(0,0,0,0.15),0 1px 2px rgba(0,0,0,0.05);}.btn.disabled,.btn[disabled]{cursor:default;background-image:none;opacity:0.65;filter:alpha(opacity=65);-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none;}.btn-large{padding:11px 19px;font-size:17.5px;-webkit-border-radius:6px;-moz-border-radius:6px;border-radius:6px;}.btn-large [class^='icon-'],.btn-large [class*=' icon-']{margin-top:4px;}.btn-small{padding:2px 10px;font-size:11.9px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;}.btn-small [class^='icon-'],.btn-small [class*=' icon-']{margin-top:0;}.btn-mini [class^='icon-'],.btn-mini [class*=' icon-']{margin-top:-1px;}.btn-mini{padding:0 6px;font-size:10.5px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;}.btn-block{display:block;width:100%;padding-right:0;padding-left:0;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;}.btn-block + .btn-block{margin-top:5px;}input[type='submit'].btn-block,input[type='reset'].btn-block,input[type='button'].btn-block{width:100%;}.btn-primary.active,.btn-warning.active,.btn-danger.active,.btn-success.active,.btn-inverse.active{color:rgba(255,255,255,0.75);}.btn-primary{color:#ffffff;text-shadow:0 -1px 0 rgba(0,0,0,0.25);background-color:#006dcc;*background-color:#0044cc;background-image:-moz-linear-gradient(top,#0088cc,#0044cc);background-image:-webkit-gradient(linear,0 0,0 100%,from(#0088cc),to(#0044cc));background-image:-webkit-linear-gradient(top,#0088cc,#0044cc);background-image:-o-linear-gradient(top,#0088cc,#0044cc);background-image:linear-gradient(to bottom,#0088cc,#0044cc);background-repeat:repeat-x;border-color:#0044cc #0044cc #002a80;border-color:rgba(0,0,0,0.1) rgba(0,0,0,0.1) rgba(0,0,0,0.25);filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#ff0088cc',endColorstr='#ff0044cc',GradientType=0);filter:progid:DXImageTransform.Microsoft.gradient(enabled=false);}.btn-primary:hover,.btn-primary:focus,.btn-primary:active,.btn-primary.active,.btn-primary.disabled,.btn-primary[disabled]{color:#ffffff;background-color:#0044cc;*background-color:#003bb3;}.btn-primary:active,.btn-primary.active{background-color:#003399;}";
//            linkCss += "</style>";

            var modalStr = "";
            modalStr += "<div style='position: absolute; height: 100%; width:100%; top:0px; left:0px; z-Index: 10000; filter: alpha(opacity=20); opacity: 0.2; background-color: #000000;  display: none;'>";
            modalStr += "</div>";

            var dialogStr = "";
            if (message === undefined || message === null || message === "") {
                dialogStr += "   <div id='modal-form' class='modal' data-backdrop='static' style='top: 40%; z-Index: 10001;'>";
            }
            else {
                dialogStr += "   <div id='alert-form' class='modal' data-backdrop='static' style='top: 40%; z-Index: 10001;'>";
            }
            dialogStr += "       <div class='modal-header'>";
            dialogStr += "           <a href='#' class='close' data-dismiss='modal'>&times;</a>";
            dialogStr += "           <h3 style='font-size: 14px;'>";
            dialogStr += "              " + interTitle;
            dialogStr += "           </h3>";
            dialogStr += "       </div>";
            dialogStr += "       <div class='modal-body'>";
            dialogStr += "           <form class='form-inline'>";
            dialogStr += "               <div class='control-group'>";
            dialogStr += "                   <label class='control-label' style='cursor: default;'>";

            if (message === undefined || message === null || message === "") {
                dialogStr += "                       <span style='cursor: default; font-size: 13px; margin-left: 25px;'>请在打开的客户端中上传音视频。如不能打开客户端请检查是否安装<a id='a-clienturl' href='javascript:void(0);'>客户端</a>。</span>";
                dialogStr += "                       <br/>";
                dialogStr += "                       <br/>";
                dialogStr += "                       <span style='cursor: default; font-size: 13px; margin-left: 25px;'>添加完文档后可关闭此窗口查看最新上传的音视频。</span>";
            }
            else {
                dialogStr += "                       <span style='cursor: default; font-size: 13px; margin-left: 25px;'>";
                dialogStr += "                          " + message;
                dialogStr += "                       </span>";
            }

            dialogStr += "                   </label>";
            dialogStr += "               </div>";
            dialogStr += "           </form>";
            dialogStr += "       </div>";

            if (message === undefined || message === null || message === "") {
                dialogStr += "       <div class='modal-footer'  style='text-align:center;'>";
                dialogStr += "           <a id='btn-sure-syncmessage' style='font-size: 13px;' class='btn-primary btn'>";
                dialogStr += "              " + interBtnTitle;
                dialogStr += "           </a>";
                dialogStr += "       </div>";
            }
            else {
                dialogStr += "       <div class='modal-footer'>";
                dialogStr += "           <a id='btn-close-dialog' style='font-size: 13px;' class='btn'>";
                dialogStr += "              " + interBtnTitle;
                dialogStr += "           </a>";
                dialogStr += "       </div>";
            }

            dialogStr += "   </div>";

            var newMask = $(modalStr);
            newMask.attr("id", "maskDiv");

            var height = $(document).height();
            var body = $(document.body);
            if (parent) {
                if (typeof (window.parent) !== undefined && window.parent !== null) {
                    body = $(window.parent.document.body);
                    if (body.find("#css-modalDialog").length <= 0)
                        $(window.parent.document.body).append($(linkCss));

                    if (body.find("#maskDiv").length <= 0)
                        body.append(newMask);

                    $(window.parent.document.body).append($(dialogStr));

                    var pHeight = $(window.parent.document).height();
                    if (pHeight > height)
                        height = pHeight;

                    newMask.css("height", height);

                    return;
                }
            }

            newMask.css("height", height);

            if (body.find("#css-modalDialog").length <= 0)
                $(document.body).append($(linkCss));
            if(body.find("#maskDiv"))
                $(document.body).append(newMask);

            $(document.body).append($(dialogStr));
        },

// 显示遮罩层
        showMaskDivIncludeParent: function (sureCallback, clientDownloadUrl, title, btnTitle) {
            if (typeof (clientDownloadUrl) === undefined || clientDownloadUrl === null || clientDownloadUrl === "") {

                var formatTimeWithHour = function(){
                    var d = new Date();

                    var day = d.getDate();
                    if( day < 10){
                        day = '0'+ day;
                    }

                    var mon = d.getMonth() + 1;
                    if( mon < 10){
                        mon = '0'+ mon;
                    }
                    var hour = d.getHours();
                    if( hour < 10){
                        hour = '0'+ hour;
                    }

                    return d.getFullYear() + mon +  day +  hour ;
                };

                clientDownloadUrl = "http://c21.tianyuimg.com/soft/hyeditsetup.exe?v="+formatTimeWithHour()+"&file=hyeditsetup.exe";
                if (window.location.href.indexOf("test.") >= 0) {
                    clientDownloadUrl = "ftp://192.168.9.78/pub/TaskAndEdit/hyedittestsetup.exe";
                } else if (window.location.href.indexOf("dev.") >= 0 || window.location.href.indexOf("debug.") >= 0) {
                    clientDownloadUrl = "ftp://192.168.9.78/pub/TaskAndEdit/hyeditdevsetup.exe";
                }
            }

            var div = $("#maskDiv");

            if (window.parent !== null)
                div = $(window.parent.document.body).find("#maskDiv");

            if (div.length <= 0) {
                this.createMaskDiv(true, title, btnTitle);

                div = $("#maskDiv");
                if (window.parent !== null)
                    div = $(window.parent.document.body).find("#maskDiv");
            }

            if (div.css("display") == "none") {
                div.show();
                div.next().show();
            }

            div.next().find("#a-clienturl").attr("href", clientDownloadUrl);
            div.next().find(".close").unbind("click").on("click", function () {
                div.hide();
                div.next().hide();
                //mdify:点关闭案扭，也需要将已上传文件写入回调方法，张杰：2015-5-21
                if (typeof (sureCallback) !== undefined && sureCallback !== null) {
                    sureCallback();
                }
            });

            if (typeof (sureCallback) !== undefined && sureCallback !== null) {
                div.next().find("#btn-sure-syncmessage").unbind("click").on("click", function () {
                    div.hide();
                    div.next().hide();
                    sureCallback();
                });
            }
        }
    };
});
