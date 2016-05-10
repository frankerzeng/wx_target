/**
 * SocketIO工具类(标准requirejs)
 * @author 李文虎
 */
define(function(require) {
    var Socket = null;

    /**
     * 默认初始化参数
     * @type {{ip: string, dns: string, port: string, defaultEvents: string, events: {}}}
     */
    var defaultOption = {
        ip: '127.0.0.1',    //IP
        dns:'localhost',    //域名
        port : '3002',      //端口
        serverReceiver : 'message',//默认服务端消息接收事件
        clientReceiver : 'message',//客户端接收事件
        events : {}         //绑定事件
    };

    /**
     * 构造函数
     * @author 李文虎
     * @param namespace 作用域
     * @constructor
     */
    var SocketIO = function(namespace){
        //var _this = this;
        //参数配置
        this.options = {};
        //事件列表
        this.events = {};
        //命名空间
        this.namespace = namespace;

        //是否已经初始化
        this.isInit = false;
        //业务码 - 用于区分消息的不同作用
        this.bcd = '10000';
        //可用系统事件
        this.defaultEvents = ['connect','message', 'error', 'online', 'offline', 'disconnect'];

        this.connect = function(jsonData){
            console.log('服务连接成功');
        };
        this.message = function(jsonData){//成功后默认回调
            console.log('服务端消息返回');
        };
        this.online = function(jsonData){
            console.log('上线消息提醒');
        };
        this.offline = function(jsonData){
            console.log('离线消息提醒');
        };
        this.disconnect = function(jsonData){//异常回调函数
            console.log('连接断开');
        };
        this.error = function(jsonData){//异常回调函数
            console.log('发生错误了');
        };
    };

    /**
     * socketio 通用逻辑 - 兼容原socketIO的方法
     * @author 李文虎
     * @type {{constructor: Function, connect: Function, on: Function, emit: Function, send: Function}}
     */
    SocketIO.prototype = {
        constructor : SocketIO,
        /**
         * socket连接
         * @author 李文虎
         * @param option
         */
        open : function(options){
            var _this = this;
            var op = _this.options = $.extend(defaultOption, options);
            var server = 'http://' + (op.dns!=='localhost' ? op.dns : op.ip) + ':' + op.port + '/',
                scriptServer = 'http://' + (op.dns!=='localhost' ? op.dns : op.ip) + ':' + op.port + '/';
            var scriptUrl = scriptServer+ 'socket.io/socket.io.js';

            //获取连接
            $.getScript(scriptUrl, function(){
                if(Socket!==null){
                    Socket.disconnect();
                }
                Socket = io.connect(server, {'max reconnection attempts':10});

                _this.isInit = true;

                /**
                 * 系统默认事件绑定
                 */
                $.each(_this.defaultEvents, function(i, event){
                    _this.on(event, _this[event]);
                });

                /**
                 * 用户自定义事件绑定
                 */
                $.each(op.events, function(k, v){
                    if($.inArray(k, _this.defaultEvents)>-1){
                        //默认方法
                        _this.off(k);
                    }
                    _this.on(k, v);
                });
            });

            return this;
        },

        /**
         * 重新打开
         * @author 李文虎
         * @returns {SocketIO}
         */
        reOpen : function(){
            var _this = this;
            _this.open(_this.options);
            return this;
        },

        /**
         * 测试联通性
         * @author 李文虎
         * @returns {boolean}
         */
        testConnect : function(){
            return Socket!==null ? true : false;
        },

        /**
         * 拷贝一个SocketIO对象
         * @author 李文虎
         * @param name 实例名称
         * @returns {SocketIO}
         */
        clone : function(namespace){

        },

        /**
         * 判断是否初始化
         * @author 李文虎
         * @param err
         * @returns {boolean|*|SocketIO.isInit}
         * @private
         */
        _isInit : function(err){
          //未初始化 + 强制弹出错误
          if(!this.isInit && err){
              throw new Error('socket未完成初始化');
          }
          return this.isInit;
        },


        /**
         * 自定义事件绑定
         * @author 李文虎
         * @param event_type
         * @param ns namespace 作用域
         * @param cb
         */
        on : function(event_type, cb){
            if(event_type){//事件
                //事件绑定
                Socket.on(event_type, function(){
                    if(cb && typeof cb === 'function'){
                        if(arguments.length===1){
                            cb(arguments[0]);
                        }else{
                            cb(arguments[0], arguments[1]);
                        }
                    }
                });
            }
            return this;
        },

        /**
         * 事件取消绑定
         * @author 李文虎
         * @param event_type
         * @returns {SocketIO}
         */
        off : function(event_type){
            if(Socket!==null){
                Socket.off(event_type);
            }
            return this;
        },

        /**
         * 自定义数据发送
         * @author 李文虎
         * @param event_type
         * @param jsonData
         */
        emit : function(event_type, jsonData, okFun){
            this._isInit(true);
            var _this = this;
            if(event_type!==''){
                if($.inArray(event_type, _this.defaultEvents)>-1){
                    if(typeof okFun !== 'function'){
                        Socket.emit(event_type, jsonData);
                    }else{
                        Socket.emit(event_type, jsonData, okFun);
                    }
                }else{
                    _this.error({_c:1, _m:'socketio.emit:事件类型' + event_type + '不可用!'});
                }
            }
            return this;
        },

        /**
         * socket销毁
         * @auhtor 李文虎
         */
        destory : function(){
            if(Socket!==null){
                Socket.emit('disconnect', {});
                Socket.disconnect()
            }
        },

        /**
         * 发送数据
         * @author 李文虎
         * @param 最多两个参数
         * eventType string 服务端的消息接收通用接口
         * jsonData json {_c:'', bcd:'', xxx:{}} 需要发送的数据
         *
         */
        _send : function(){
            this._isInit(true);
            var _this = this;
            var jsonData = {}, eventType = _this.options.serverReceiver, okFun = null;
            if(arguments.length === 0){
                console.log('请指定需要发送的内容');
            }

            //可以指定事件发送 - 服务端已经注册的事件
            if(arguments.length===2){
                jsonData = arguments[0];
                okFun = arguments[1];
            }else{//
                jsonData = arguments[0];
            }
            //请求的业务逻辑
            if(jsonData._c===undefined){
                _this.error({_c: 1, _m:'_c参数未添加'});
            }
            //业务码
            jsonData.bcd = jsonData.bcd ? jsonData.bcd : _this.bcd;

            if(okFun===null){
                _this.emit(eventType, jsonData);
            }else{
                _this.emit(eventType, jsonData, okFun);
            }
        },

        /**
         * 发送数据
         * @author 李文虎
         * @param jsonData
         */
        send_msg : function(){
            var _this = this;
            if(arguments.length===1){
                _this._send(arguments[0]);
            }else{
                _this._send(arguments[0], arguments[1]);
            }

        }
    };

    return new SocketIO('_sk_init');
});