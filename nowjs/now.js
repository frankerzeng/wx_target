define(function (require) {
    "use strict";
    var Now = function () {
        this.cfg = {
            'tplCache': {},           // 模板缓存
            'tpl': 'tpl/',  // 模版文件位置
            'nowjs': './nowjs/',  // nowjs位置
            'index': '',  // 首页位置
            'check': {},             // 后端的验证列表
            'ver': '',//版本
            'defPath' : '/img/default/' // 默认图片目录
        };
        this._uitest = 0;
        this.time = -1;
        this._gnd = {};//有权限的功能点
        this._userVal = {};   //私有验证
        this._sync = true;   //false同步,true异步
    };

    Now.prototype = {
        constructor: Now,

        /**
         * 设置同步异步
         * @author 陈梅妹
         * @param sync false同步,true异步
         */
        setSync: function(sync){
            this._sync = sync ? true : false;
        },

        /**
         * 根据模板名称和数据内容，得到组装好的模板数据，一般不要直接使用 各项目会有一个额外封装的方法
         * @author 欧远宁
         * @param tpl   模板名称
         * @param data  数据内容
         * @param okFun 完成模板组装后的回调
         */
        tpl: function (tpl, data, okFun, sync) {
            var self = this,
                _cfg = self.cfg,
                _c = _cfg.tplCache,
                _t = _cfg.tpl,
                 rpl_html = function (s) {
                    return s.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/'/g, "\\'").replace(/{#/g, "';s+=").replace(/#}/g, ";s+='");
                }, rpl_js = function (s) { // 替换函数
                    return s.replace(/\r/g, '').replace(/\n/g, '').replace(/'/g, "\'");
                }, rpl = function (s) {
                    var sArr = s.split('<!--#'),
                         ssArr = null,
                         jsStr = '';
                    if (sArr.length > 1) {
                        jsStr += rpl_html(sArr[0]);
                        for (var i = 1; i < sArr.length; i++) {
                            ssArr = sArr[i].split('#-->');
                            jsStr += '\';' + rpl_js(ssArr[0]) + 's+=\'' + rpl_html(ssArr[1]);
                        }
                    } else {
                        jsStr += rpl_html(s);
                    }
                    jsStr = " var s='" + jsStr + "';return s;";
                    return jsStr;
                }, rpl_fast = function (s) {
                    /*代码规范
                     {#if (data['para'] > 10) #}
                     {#else if(data['para'] < -10)#}
                     {#else#}
                     {#end#}

                     {#each data['users'] user#}
                     姓名：{#user['name']#}
                     {#end#}
                     */
                    s = s.replace(/\{#end#\}/ig, '<!--# } #-->');
                    s = s.replace(/\{#else#\}/ig, '<!--# } else { #-->');
                    s = s.replace(/\{#else(.*?)#\}/ig, '<!--# } else $1 { #-->');
                    s = s.replace(/\{#if(.*?)#\}/ig, '<!--# if $1{ #-->');
                    s = s.replace(/\{#each\s+(.*?)\s+(.*?)#\}/ig, '<!--# for(var i=0;i<$1.length; i++){ var $2 = $1[i];#-->');

                    return rpl(s);
                };

            if (_c[tpl]) {
                okFun(_c[tpl](data, require));

                // 设置默认图片
                self.imgDefault();
            } else {
                if (self._uitest === 1) {
                    sync = false;
                } else if (sync === undefined) {
                    sync = true;
                }

                $.ajax({
                    url: _t + tpl + '.html?v=' + new Date().getTime(),
                    type: "GET",
                    async: sync,
                    success: function (html) {
                        _c[tpl] = new Function(['data', 'require'], rpl_fast(html));
                        okFun(_c[tpl](data, require));

                        // 设置默认图片
                        self.imgDefault();
                    }
                });
            }
        },

        /**
         * 处理默认图片加载失败问题
         * @author 金宁宝
         */
        imgDefault: function () {
            var self = this;
            setTimeout(function(){
                $("img._defimg").each(function(){
                    var img = $(this).attr('src');
                    if(img === '' || img === '/'){
                        var imgName = $(this).attr('_imgname');
                        if(imgName === undefined){
                            imgName = 'user_default_50.jpg';
                        }
                        $(this).attr('src',self.cfg.defPath + imgName);
                    }
                });
            },1000);
        },

        /**
         * 更友好的剩余时间显示，比如 2012-08-08 08:08:08
         * @author 欧远宁
         * @param time  时间格式为2012-08-08 08:08:08
         * @param start 开始计算的日期的书，一般我们只要计算到后2年就可以了。
         * @param len   如start=2, len=14 那么我们计算时间的时候，就类似 12-08-08 08:08
         */
        pDate: function (time, start, len) {
            // 默认只显示到分钟
            if (start === undefined) {
                start = 2;
            }
            if (len === undefined) {
                len = 14;
            }
            var ntime = (this.time > -1) ? this.time : new Date().getTime();
            var date = new Date(time.replace(/-/g, '/')), tmp = (ntime - date.getTime()), future = (tmp < 0), diff = Math.abs(tmp) / 1000, day_diff = Math
                .floor(diff / 86400);

            if (future) {
                if (isNaN(day_diff) || day_diff >= 31){
                    return time.substr(start, len);
                }
                return day_diff === 0 &&
                    (diff < 60 && '一会' || diff < 120 && '1分钟后' || diff < 3600 && Math.floor(diff / 60) + '分钟后' || diff < 7200 && '1小时后' || diff < 86400 &&
                    Math.floor(diff / 3600) + '小时后') || day_diff === 1 && '明天' || day_diff < 7 && day_diff + '天后' || day_diff < 31 &&
                    Math.ceil(day_diff / 7) + '周后';
            } else {
                if (isNaN(day_diff) || day_diff >= 31){
                    return time.substr(start, len);
                }
                return day_diff === 0 &&
                    (diff < 60 && '刚刚' || diff < 120 && '1分钟前' || diff < 3600 && Math.floor(diff / 60) + '分钟前' || diff < 7200 && '1小时前' || diff < 86400 &&
                        Math.floor(diff / 3600) + '小时前') || day_diff === 1 && '昨天' || day_diff < 7 && day_diff + '天前' || day_diff < 31 &&
                    Math.ceil(day_diff / 7) + '周前';
            }
        },

        /**
         * 生成唯一ID
         * @author 张章湫
         * @return str
         */
        uniqid: function () {
            return "" + (new Date()).getTime() + parseInt(Math.random() * 100000);
        },

        /**
         * 如果字符过长，加入省略号
         * @author 欧远宁
         * @param str
         * @param max
         * @param rpl
         */
        pStr: function (str, max, rpl) {
            if (str.length < max){
                return str;
            }
            if (rpl === undefined){
                rpl = '...';// 省略的内容替代字符
            }
            return str.substr(0, max) + rpl;
        },

        /**
         * 将timestamp转为 yyyy-mm-dd HH:ii:ss的格式字符串
         * @author 欧远宁
         * @param ts    输入的timestamp
         * @param type  返回的时间格式
         * @returns     格式化后的字符串
         */
        timeStr: function (ts, type) {
            if (ts < 10) {
                return '';
            }
            var day = new Date(parseInt(ts) * 1000),
                fun = function (n) {
                    return (n < 10) ? '0' + n : n;
                };
            if (type == "time"){
                return fun(day.getHours()) + ':' + fun(day.getMinutes());
            }
            if (type) {
                return day.getFullYear() + '-' + (fun(day.getMonth() + 1)) + '-' + fun(day.getDate());
            } else {
                return day.getFullYear() + '-' + (fun(day.getMonth() + 1)) + '-' + fun(day.getDate()) + ' ' + fun(day.getHours()) + ':' +
                    fun(day.getMinutes()) + ':' + fun(day.getSeconds());
            }
        },
        intToTime: function(ts){
            if (ts < 0) {
                return '';
            }
            var fun = function (n) {
                return (n < 10) ? '0' + n : n;
            };
            return fun( parseInt( ts / 60 / 60 ) ) + ':' + fun( parseInt( ts / 60 % 60 ) ) + ':' + fun(ts%60);
        },

        /**
         * 获取timestamp的星期
         * @author 欧远宁
         * @param ts    输入的timestamp
         * @returns int
         */
        dayWeek: function (ts) {
            return new Date(parseInt(ts) * 1000).getDay();
        },

        /**
         * 将秒数转为 HH:ii的格式字符串
         * @author 金宁宝
         * @param ts    输入的timestamp
         * @param type  返回的时间格式
         * @returns     格式化后的字符串
         */
        secToTime: function (ts, isSec) {
            if (ts > 86400) {
                return '';
            }
            var _hour = 0,
                _min = 0,
                _sec = 0;

            _hour = parseInt(ts / 3600);
            _min = parseInt((ts % 3600) / 60);
            _sec = parseInt((ts % 3600) % 60);

            if (_hour < 10) {
                _hour = '0' + _hour;
            }
            if (_min < 10) {
                _min = '0' + _min;
            }
            if (_sec < 10) {
                _sec = '0' + _sec;
            }

            var ret = '';
            if (isSec!==undefined && isSec===true) {
                ret = _hour + ':' + _min + ':' + _sec;
            }else{
                ret = _hour + ':' + _min;
            }

            return ret;
        },

        /**
         * 日期加天数得到新的日期
         * @author 张章湫
         * @param string sdate 当前日期
         * @param int    days  加或减天数
         * @returns string     新的日期
         */
        dateadd: function (d, days) {
            var fun = function (n) {
                return (n < 10) ? '0' + n : n;
            };
            var arr = d.split('-');
            d = new Date(arr[0], arr[1] - 1, arr[2]);
            var a = d.getTime();
            a = a + days * 24 * 60 * 60 * 1000;
            a = new Date(a);
            return a.getFullYear() + '-' + (fun(a.getMonth() + 1)) + '-' + fun(a.getDate());
        },

        /**
         * 当前日期
         * @author 张章湫
         * @param string sdate 当前日期
         */
        datenow: function () {
            var fun = function (n) {
                return (n < 10) ? '0' + n : n;
            };
            var a = new Date();
            return a.getFullYear() + '-' + (fun(a.getMonth() + 1)) + '-' + fun(a.getDate());
        },

        /**
         * 日期转化为时间戳
         * @author 陈梅妹
         * @param string date 当前日期yyyy-mm-dd HH:ii:ss
         */
        date2Ts: function(date) {
            var f = date.split(' ', 2);
            var d = (f[0] ? f[0] : '').split('-', 3);
            var t = (f[1] ? f[1] : '').split(':', 3);
            return (new Date(parseInt(d[0])||null, (parseInt(d[1])||1)-1, parseInt(d[2])||null, parseInt(t[0])||null, parseInt(t[1])||null,parseInt(t[2])||null)).getTime() / 1000;
        },

        /**
         * 根据身份证获取个人信息
         * @author 金宁宝
         * @desc 需要获取后端配置this.cfg.pz
         * @param string idcard 身份证
         */
        getInfoByIdCard: function (idcard) {

            //验证省份证是否正确
            if(idcard === ''){
                //省份证号不能为空
                return false;
            }else if(idcard.length !== 15 && idcard.length !== 18){
                //身份证不是15位或者18位，错误
                return false;
            }

            var tmpStr = '',
                startPos = '',//获取性别位开始位置
                info = {};//存放个人信息

            //获取籍贯信息
            info.province = this.cfg.pz.jg[idcard.substr(0, 2) + '0000'];
            info.city = this.cfg.pz.jg[idcard.substr(0, 4) + '00'];
            info.area = this.cfg.pz.jg[idcard.substr(0, 6)];

            if (idcard.length === 15) {//15位身份证号

                //获取初始化日期
                tmpStr = idcard.substring(6, 12);
                tmpStr = '19' + tmpStr;
                info.birthday = tmpStr.substring(0, 4) + "-" + tmpStr.substring(4, 6) + "-" + tmpStr.substring(6);

                startPos = 14;
            } else {

                //获取初始化日期
                tmpStr = idcard.substring(6, 14);
                info.birthday = tmpStr.substring(0, 4) + "-" + tmpStr.substring(4, 6) + "-" + tmpStr.substring(6);

                startPos = 16;
            }

            //获取性别
            if (parseInt(idcard.substr(startPos, 1)) % 2 == 1) {
                info.sex = '男';
            } else {
                info.sex = '女';
            }

            return info;
        },

        /**
         * 获取行政地区各级名称
         * @author 金宁宝
         * @param code  行政区代码
         * @returns  addr  行政区名称
         */
        getAreaByCode : function(code){

            // 行政区号必须为6位
            if(code.length !== 6){
                return '';
            }

            // 验证配置是否存在
            if(this.cfg.pz === undefined){
                //N.cfg.pz =  ret.pz;
                $.actMsg('请先配置now.cfg.pz');
                return '';
            }

            // 获得省和市的行政区号
            var province = code.substr(0,2)+'0000';
            var city = code.substr(2,4) === '0000' ? '' : code.substr(0,4)+'00';
            var town = code.substr(4,6) === '00' ? '' : code;

            // 获取行政区各级名称
            var addr = '';
            addr = this.cfg.pz.jg[province] ? this.cfg.pz.jg[province] : '';
            addr += this.cfg.pz.jg[city] ? this.cfg.pz.jg[city] : '';
            addr += this.cfg.pz.jg[town] ? this.cfg.pz.jg[town] : '';

            return addr;
        },

        /**
         * 将行数据按照k=v的方式重新组织
         * @author 欧远宁
         * @param rows  行数据
         * @param k     对应的key字段
         * @param v     对应的value字段
         * @returns  map类型的数组
         */
        row2map: function (rows, k, v) {
            var ret = {};
            $.each(rows, function (idx, row) {
                ret[row[k]] = row[v];
            });
            return ret;
        },

        /**
         * 增加私有验证
         * @author 欧远宁
         * @param name  名称，在check中的第一个区间的名字，比如myval-a-b
         * @param cb  回调函数
         */
        addVal: function (name, cb) {
            this._userVal[name] = cb;
        },

        /**
         * 得到验证错误信息
         * @param arr
         */
        getCheckErr: function (arr) {
            var _msg = {
                    ip: 'IP',
                    phone: '电话',
                    mobile: '手机',
                    tel: '手机或电话',
                    date: '日期格式',
                    idcard: '身份证',
                    zip: '邮编',
                    qq: 'QQ号(5-15数字)',
                    url: '网址',
                    mail: '邮箱',
                    uuid: 'uuid',
                    timestamp: '时间戳'
                },
                _ret = _msg[arr[0]];
            if (_ret) {
                return '请输入正确的' + _ret;
            } else {
                var _fun = function (arr) {
                    var _str = '请输入';
                    if (arr.length === 2) {
                        _str += arr[1];
                    } else {
                        _str += arr[1] + '到' + arr[2];
                    }
                    return _str;
                };

                switch (arr[0]) {
                    case 'reg':
                        return '不符合验证规则';
                    case 'cmp':
                        if ($('label[for=' + arr[1] + ']').length > 0) {
                            var str = $('label[for=' + arr[1] + ']').text();
                            str = str.replace('*', '');
                            str = str.replace(':', '');
                            str = str.replace('：', '');
                            return '请与' + str + '的值保持一致';
                        }
                        return '1';
                    case 'alpha':
                        return _fun(arr) + '个字母';
                    case 'num':
                        return _fun(arr) + '个数字';
                    case 'alnum':
                        return _fun(arr) + '个数字或字母';
                    case 'alnum1':
                        return _fun(arr) + '个数字或字母，并以字母开头';
                    case 'account':
                        return _fun(arr) + '个只包含数字、字母、下划线、@符号、点号的字符';
                    case 'str':
                        return _fun(arr) + '个字符';
                    case 'str2':
                        return _fun(arr) + '个字符（一个汉字2字符）';
                    case 'int':
                        return '请输入' + arr[1] + '到' + arr[2] + '的数值';
                    case 'float':
                        _msg = '请输入' + arr[2] + '到' + arr[3] + '的数值';
                        if (arr[1] !== '0') {
                            _msg += '最多' + arr[1] + '位小数';
                        }
                        return _msg;
                    case 'gt':
                        if ($('label[for=' + arr[1] + ']').length > 0) {
                            return '必须大于' + $('label[for=' + arr[1] + ']').text().replace(/[:：]/, '').replace('*', '');
                        }
                        return '1';
                    case 'gte':
                        if ($('label[for=' + arr[1] + ']').length > 0) {
                            return '必须大于等于' + $('label[for=' + arr[1] + ']').text().replace(/[:：]/, '').replace('*', '');
                        }
                        return '1';
                    case 'lt':
                        if ($('label[for=' + arr[1] + ']').length > 0) {
                            return '必须小于' + $('label[for=' + arr[1] + ']').text().replace(/[:：]/, '').replace('*', '');
                        }
                        return '1';
                    case 'lte':
                        if ($('label[for=' + arr[1] + ']').length > 0) {
                            return '必须小于等于' + $('label[for=' + arr[1] + ']').text().replace(/[:：]/, '').replace('*', '');
                        }
                        return '1';
                    case 'score':
                        _msg = arr[1] + '到' + arr[2] + '的精确到1位小数的数字且小数位为0或5';
                        return _msg;
                    case 'time'://时段校验
                        return '时间段格式错误,正确格式为  xx:xx';
                }
            }
        },

        /**
         * 进行验证
         * @author 欧远宁
         * @param arr
         * @param v
         */
        val: function (arr, v) {
            var self = this,
                 i = 0,
                 gt = function (v, cmp) {//大于
                    if (cmp.indexOf('-') > 0) {// 时间比较
                        //return (new Date(v.replace(/-/g, "/")).getTime() > new Date(cmp.replace(/-/g, "/")).getTime());
                        return v > cmp;
                    } else {// int类型比较
                        return (parseInt(v) > parseInt(cmp));
                    }
                },
                lt = function (v, cmp) {//小于
                    if (cmp.indexOf('-') > 0) {// 时间比较
                        return v < cmp;
                    } else {// int类型比较
                        return (parseInt(v) < parseInt(cmp));
                    }
                },
                verifyBirthday = function(year,month,day,birthday){//生日校验（身份证校验）
                    var nowTime = new Date();
                    var now_year = nowTime.getFullYear();
                    if(birthday.getFullYear() == year && (birthday.getMonth() + 1) == parseInt(month) && birthday.getDate() == day){
                        var time = now_year - year;
                        if(time >= 10 && time <= 80){
                            return true;
                        }else{
                            return '年龄要求10到80周岁';
                        }
                    }
                    return false;
                },
                changeFivteenToEighteen = function(card){//15位身份证转18位（身份证校验）
                    if(card.length == '15'){
                        var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
                        var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
                        var cardTemp = 0, i;
                        card = card.substr(0, 6) + '19' + card.substr(6, card.length - 6);
                        for(i = 0; i < 17; i ++){
                            cardTemp += card.substr(i, 1) * arrInt[i];
                        }
                        card += arrCh[cardTemp % 11];
                        return card;
                    }
                    return card;
                },
                checkParity = function(card){ //校验位的检测（身份证校验）
                    card = changeFivteenToEighteen(card);
                    var len = card.length;
                    if(len == '18')
                    {
                        var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
                        var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
                        var cardTemp = 0, i, valnum;
                        for(i = 0; i < 17; i ++) {
                            cardTemp += card.substr(i, 1) * arrInt[i];
                        }
                        valnum = arrCh[cardTemp % 11];
                        if (valnum == card.substr(17, 1)){
                            return true;
                        }
                        return false;
                    }
                    return false;
                },
                vcity = { 11:"北京",12:"天津",13:"河北",14:"山西",15:"内蒙古",//省份编码
                    21:"辽宁",22:"吉林",23:"黑龙江",31:"上海",32:"江苏",
                    33:"浙江",34:"安徽",35:"福建",36:"江西",37:"山东",41:"河南",
                    42:"湖北",43:"湖南",44:"广东",45:"广西",46:"海南",50:"重庆",
                    51:"四川",52:"贵州",53:"云南",54:"西藏",61:"陕西",62:"甘肃",
                    63:"青海",64:"宁夏",65:"新疆",71:"台湾",81:"香港",82:"澳门",91:"国外"
                };

            for (; i < arr.length; i++) {
                var a = arr[i].split('-');
                if (a[0] === 'must') {
                    if (v === '') {
                        return '不能为空';
                    }
                    continue;
                }

                if (v === '' && a[0]!=='cmp'){
                    continue;
                }

                // 验证内容合法性(是否包含js脚本)
                /*var re = v.match(/<script.*?>.*?<\/script>/ig);
                if(re !== null){
                    return '内容不合法';
                }*/

                var reg_len = '',
                     errMsg = self.getCheckErr(a),
                     cmp,
                     reg;
                if (a.length === 3) {
                    reg_len = ',' + a[2];
                }
                switch (a[0]) {
                    case 'ip':// 检验ip
                        if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'phone':// 检验电话
                        if (!/^((0[1-9]{3})?(0[12][0-9])?[-])?\d{6,8}$/.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'mobile':// 检验手机
                        if (!/(^0?[1][3-9][0-9]{9}$)/.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'tel':// 检验手机或联系电话
                        if (!(/^((0[1-9]{3})?(0[12][0-9])?[-])?\d{6,8}$/.test(v) || /(^0?[1][3-9][0-9]{9}$)/.test(v))){
                            return errMsg;
                        }
                        continue;
                    case 'date':// 检验日期
                        var f = (a[2] === undefined) ? 'yyyy-MM-dd' : a[2];// 格式
                        var m = 'MM', d = 'dd', y = 'yyyy';
                        var regex = '^' + f.replace(y, '\\d{4}').replace(m, '\\d{2}').replace(d, '\\d{2}') + '$';
                        if (!new RegExp(regex).test(v)){
                            return errMsg;
                        }
                        var s = v.substr(f.indexOf(y), 4) + '/' + v.substr(f.indexOf(m), 2) + '/' + v.substr(f.indexOf(d), 2);
                        if (isNaN(new Date(s))){
                            return errMsg;
                        }
                        continue;
                    case 'idcard':// 身份证校验
                        if (!/^(\d{14}|\d{17})(\d|[X])$/.test(v)){//位数校验
                            return errMsg;
                        }
                        var code_city = v.substring(0,2);
                        if(vcity[code_city]==undefined){//省份校验
                            return errMsg;
                        }
                        if(!checkParity(v)){//校验位校验
                            return errMsg;
                        }
                        if(v.length==18){//生日校验
                            var re_eighteen = /^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/;
                            var arr_data = v.match(re_eighteen);
                            var year = arr_data[2],  month = arr_data[3], day = arr_data[4],birthday = new Date(year+'/'+month+'/'+day);
                            if(typeof verifyBirthday(year, month, day, birthday) != "boolean"){
                                return verifyBirthday(year, month, day, birthday);
                            }
                            if(!verifyBirthday(year, month, day, birthday)){
                                return errMsg;
                            }
                        }else{
                            var re_fifteen = /^(\d{6})(\d{2})(\d{2})(\d{2})(\d{3})$/;
                            var arr_data = v.match(re_fifteen);
                            var year = '19'+arr_data[2], month = arr_data[3], day = arr_data[4], birthday = new Date(year+'/'+month+'/'+day);
                            if(typeof verifyBirthday(year, month, day, birthday) != "boolean"){
                                return verifyBirthday(year, month, day, birthday);
                            }
                            if(!verifyBirthday(year, month, day, birthday)){
                                return errMsg;
                            }
                        }
                        continue;
                    case 'zip':// 检验邮编
                        if (!/^\d{6}$/.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'qq':// 检验qq
                        if (!/^\d{5,15}$/.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'url':// 检验url
                        if (!/^(http|https|ftp):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'mail':// 检验email
                        if (!/\w{1,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'uuid':// 检验uuid
                        if (!/^[a-f0-9]{16}$/.test(v)) {
                            return errMsg;
                        }
                        continue;
                    case 'cmp':// 与另外一个表单的value进行比较
                        if (v !== $('#' + a[1]).val()) {
                            return errMsg;
                        }
                        continue;
                    case 'reg':// 直接与正则比较
                        reg = new RegExp(a[1]);
                        if (!reg.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'alpha':// 字母，格式为 alpha-min-max 表示大于等于min且小于等于max， 如果alpha-num表示，必须是num多个alpha
                        reg = new RegExp('^[A-Za-z]{' + a[1] + reg_len + '}$');
                        if (!reg.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'alnum':// 字母+数字 用法与alpha同
                        reg = new RegExp('^[A-Za-z0-9]{' + a[1] + reg_len + '}$');
                        if (!reg.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'alnum1':// 以字母开头,字母+数字 用法与alpha同
                        reg = new RegExp('^[A-Za-z][A-Za-z0-9]{' + (a[1]-1) + ','+(a[2]-1) + '}$');
                        if (!reg.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'account':// 字母+数字+下划线+@符号+点号 用法与alpha同
                        reg = new RegExp('^[A-Za-z0-9@._]{' + a[1] + reg_len + '}$');
                        if (!reg.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'chinese':// 汉字 用法与alpha同
                        reg = new RegExp('^[\u4e00-\u9fa5]{' + a[1] + reg_len + '}$');
                        if (!reg.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'int':// int, 用法 int-min-max ，必须是大于等于min且小于等于max的整数
                        reg = new RegExp('(^[1-9]+[0-9]{0,50}$)|(^0$)');
                        if (!reg.test(v)) {
                            return '不是正整数';
                        }
                        v = parseInt(v);
                        if (isNaN(v)) {
                            return '不是数值类型';
                        }
                        if (v < parseInt(a[1]) || v > parseInt(a[2])) {
                            return errMsg;
                        }
                        continue;
                    case 'float':// float 用法 float-精度-最小-最大 比如float-2-10-100
                        reg = new RegExp('^[0-9]+\.?[0-9]{0,' + a[1] + '}$');
                        if (!reg.test(v)) {
                            return errMsg;
                        }
                        v = parseFloat(v);
                        if (isNaN(v)) {
                            return '不是数值类型';
                        }
                        if (v < parseInt(a[2]) || v > parseInt(a[3])) {
                            return errMsg;
                        }
                        continue;
                    case 'timestamp':// timestamp
                        if (!/^\d{1,11}$/.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'num':// 输入都是数字类型 用法与alpha同
                        reg = new RegExp('^[-+]?[\\d]{' + a[1] + reg_len + '}$');
                        if (!reg.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'str':// 普通字符串验证，一个中文占一个字符，用法与alpha同(换行后端验证被认为是两个字符)
                        reg = new RegExp('^([\\D\\d]){' + a[1] + reg_len + '}$');
                        if (!reg.test(v.replace(/\n/g, "**"))){
                            return errMsg;
                        }
                        continue;
                    case 'str2':// 一个汉字当作2个字符
                        v = v.replace(/[^\x00-\xff]/g, "**");
                        reg = new RegExp('^([\\D\\d]){' + a[1] + reg_len + '}$');
                        if (!reg.test(v)){
                            return errMsg;
                        }
                        continue;
                    case 'gt':// 大于某个dom的值
                        cmp = $('#' + a[1]).val();
                        if (!gt(v, cmp)) {
                            return errMsg;
                        }
                        continue;
                    case 'gte':// 大于等于某个dom的值
                        cmp = $('#' + a[1]).val();
                        if (lt(v, cmp)) {
                            return errMsg;
                        }
                        continue;
                    case 'lt':// 小于某个dom的值
                        cmp = $('#' + a[1]).val();
                        if (cmp === v || gt(v, cmp)) {
                            return errMsg;
                        }
                        continue;
                    case 'lte':// 小于等于某个dom的值
                        cmp = $('#' + a[1]).val();
                        if (gt(v, cmp)) {
                            return errMsg;
                        }
                        continue;
                    case 'time'://时段校验
                        var pattern = /([0-1][0-9]|2[0-3]):([0-5][0-9])$/i;
                        if (!pattern.test(v)) {
                            return errMsg;
                        }
                        continue;
                    case 'score'://分数校验
                        reg = new RegExp('^[0-9]+(\.?(5|0)){0,1}$');
                        if (!reg.test(v)) {
                            return '必须是数字格式（小数点后一位为0或5）';
                        }
                        v = parseFloat(v);
                        if (isNaN(v)) {
                            return '必须是数字格式';
                        }
                        if (v < parseFloat(a[1]) || v > parseFloat(a[2])) {
                            return errMsg;
                        }
                        continue;
                    case 'not_special'://不能是特殊字符，只能是中文 数字 字母 下划线
                        reg = new RegExp('^[A-Za-z0-9_\u4e00-\u9fa5]+$');
                        if (!reg.test(v)) {
                            return '只能是中文、数字、字母、下划线';
                        }
                        continue;
                    default : //进入自定义
                        if (self._userVal[a[0]]) {
                            return self._userVal[a[0]](arr[i], v);
                        }
                        continue;
                }
            }
            return '';
        },

        /**
         * 发送请求得到结果,不要直接使用
         * @param cmd
         * @param data
         * @param cb
         */
        _cmd: function (cmd, data, cb, errFun, sync) {
            var self = this;
            if ($.isFunction(data)) {
                cb = data;
                data = {};
            }
            if (!$.isFunction(errFun)) {
                errFun = function (msg) {
                    $.alertMsg('出错提示', msg);
                };
            }
            data = data || {};
            //data._c = cmd;
            if (typeof sync !== 'boolean') {
                sync = (this._uitest !== 1) ? this._sync : false;
            }

            var requestUrl = this.cfg.index + cmd;
            console.log('request url is : ' + requestUrl);

            $.ajax({
                url: requestUrl,
                data: data,
                type: 'POST',
                async: sync,
                dataType: 'json',
                error: function (jqxhr, status, thrown) {
                    if (status === 'timeout') {
                        errFun({s: '-1000', m: '连接超时'});
                    } else if (status === 'parsererror') {
                        errFun({s: '-1001', m: '不是正确的json格式'});
                    } else if (status === 'error') {
                        if (jqxhr.readyState > 0) {
                            if (jqxhr.status==500) {
                        		var errorResponse = $.parseJSON(jqxhr.responseText)
                        		errFun({s : errorResponse.code ? errorResponse.code : '-1002', m : errorResponse.msg ? errorResponse.msg : '暂时无法连接到服务器，请稍候重试'});
                        	} else {
                        		errFun({s: '-1002', m: '暂时无法连接到服务器，请稍候重试'});
                        	}
                        }
                    }
                },
                success: function (ret, status, jqxhr) {
                    if (ret) {
                        if (ret.t){
                            self.time = ret.t;
                        }
                    }else{
                        console.log('后端没有数据返回');
                    }

                    if (cb) {
                        cb(ret);
                    }
                }
            });

        },

        htmlDecode: function html_decode(str) {
            var s = "";
            if (str.length === 0) {
                return "";
            }
            s = str.replace(/&amp;/g, "&");
            s = s.replace(/&lt;/g, "<");
            s = s.replace(/&gt;/g, ">");
            s = s.replace(/&nbsp;/g, " ");
            s = s.replace(/&#39;/g, "\'");
            s = s.replace(/&quot;/g, "\"");
            s = s.replace(/<br>/g, "\n");
            return s;
        },


        /**
         * 获取URL参数
         * @param name
         * @returns str/null
         */
        getQry: function (name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var r = window.location.search.substr(1).match(reg);
            if (r !== null){
                return window.unescape(r[2]);
            }
            return null;
        },

        /**
         * 获取session字符串
         * @returns str/null
         */
        getSessStr: function () {
            var cookie_name = this.cfg.cookie_name === undefined ? 'nnss' : this.cfg.cookie_name;
            return this.cookie(cookie_name);
        },

        /**
         * cookie处理<br/>
         * 得到cookie的值，   var val = now.cookie('key');<br/>
         * 设置cookie的值  now.cookie('key', 'val', 2); 默认保存1天<br/>
         * 删除cookie      now.cookie('key', '');<br/>
         * @author 欧远宁
         * @param k cookie的key
         * @param v cookie的value
         */
        cookie: function (k, v, days) {
            if (v === undefined) {
                var regexp = new RegExp('\\b' + k + '\\b');
                var start = document.cookie.search(regexp);
                var len = start + k.length + 1;
                if (start === -1) {
                    return '';
                }
                var end = document.cookie.indexOf(';', len);
                if (end === -1) {
                    end = document.cookie.length;
                }
                return window.unescape(document.cookie.substring(len, end));
            } else if (v === '') {
                document.cookie = k + '=;expires=Thu, 01-Jan-1970 00:00:01 GMT;path=' + this.cfg.cookie_path + ';domain=' + this.cfg.cookie_domain + ';';
            } else {
                if (days === undefined) {
                    days = 1;
                }
                var exp = new Date();    //new Date('December 31, 9998');
                exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000);
                document.cookie = k + '=' + window.escape(v) + ';expires=' + exp.toGMTString() + ';path=' + this.cfg.cookie_path + ';domain=' + this.cfg.cookie_domain + ';';
            }
        },

        /**
         * 移除没有权限的功能点
         * @author 金宁宝
         *
         * 使用方法 1.需要初始化全局变量为var _gnd = {cmd:'base.role.get_tech_mdls'};,cmd为请求地址，获取用户没有权限的功能模块
         *            2.需要在相应功能点上添加class='gnd0001',gnd0001为功能点代码，配置写在cfg/fun.php中
         *
         */
        removeFun: function () {
            //如果没有设置_gnd,默认不需要移除功能点
            if (typeof(window._gnd) !== 'undefined') {
                if (typeof(window._gnd.cmd) !== 'undefined') {
                    //第一次需要获取没有权限的功能点
                    this._cmd(window._gnd.cmd, {}, function (ret) {
                        window._gnd = ret.rows;
                        $.each(window._gnd, function (key, val) {
                            $('body .' + val).remove();
                        });
                        var mustRemove = true;
                        $.each($('body ._operate_td span'), function (key, val) {
                            if ($.trim($(this).html()) !== '') {
                                mustRemove = false;
                            }
                        });

                        if (mustRemove) {
                            $('body ._operate_td').hide();
                            $('body ._operate').hide();
                        } else {
                            $('body ._operate_td').show();
                            $('body ._operate').show();
                        }
                    });
                } else {
                    $.each(window._gnd, function (key, val) {
                        $('body .' + val).remove();
                    });
                    var mustRemove = true;
                    $.each($('body ._operate_td span'), function (key, val) {
                        if ($.trim($(this).html()) !== '') {
                            mustRemove = false;
                        }
                    });

                    if (mustRemove) {
                        $('body ._operate_td').hide();
                        $('body ._operate').hide();
                    } else {
                        $('body ._operate_td').show();
                        $('body ._operate').show();
                    }
                }
            }
        },

        /**
         * 获取grid中操作列a标签html
         * @author 金宁宝
         *
         * @param sty_cls class名
         * @param attr a标签的属性
         * @param txt 显示文本
         * @param blank 跟在后面的内容
         */
        getLinkFunc: function (sty_cls, attr, txt, blank) {

            if (!blank) {
                blank = '';
            }

            var $ahref = $('<a>').addClass(sty_cls).attr('href', 'javascript:;').text(txt);

            $.each(attr, function (key, val) {
                $ahref.attr(key, val);
            });

            return $ahref[0].outerHTML + blank;
        },

        /**
         * 获取grid中操作列a标签html
         * @author 金宁宝
         *
         * @param json data 数据内容
         * @param string fg 分割符号
         */
        getLinkStr : function (data,fg) {

            if (!fg) {
                fg = ' ';
            }

            var aHtml = '';
            $.each(data,function(key,val){
                if(!val[2]){
                    var $ahref = $('<a>').addClass(val[0]).attr("href","javascript:;").text(key);
                    if(val[1]){
                        $.each(val[1], function (skey, sval) {
                            $ahref.attr(skey, sval);
                        });
                    }
                    aHtml += $ahref[0].outerHTML + fg;
                } else {
                    aHtml += '<span class="mgr-5 mgl-5 ' + val[0] + ' "><font color="#C0C0C0">'+key+'</font></span>&nbsp;' + fg;
                }
            });

            return aHtml;
        },


        /**
         * 在光标处添加字符串
         * @author 陈桂生
         * @param targetEle 目标元素
         * @param str 添加的字符串
         */
        insertStr2Cursor :function(targetEle,str){
            (function($){
                $.fn.extend({
                    insertAtCaret: function(myValue){
                        var $t=$(this)[0];
                        if (document.selection) {
                            this.focus();
                            var sel = document.selection.createRange();
                            sel.text = myValue;
                            this.focus();
                        }else if ($t.selectionStart || $t.selectionStart == '0') {
                            var startPos = $t.selectionStart;
                            var endPos = $t.selectionEnd;
                            var scrollTop = $t.scrollTop;
                            $t.value = $t.value.substring(0, startPos) + myValue + $t.value.substring(endPos, $t.value.length);
                            this.focus();
                            $t.selectionStart = startPos + myValue.length;
                            $t.selectionEnd = startPos + myValue.length;
                            $t.scrollTop = scrollTop;
                        }
                        else {
                            this.value += myValue;
                            this.focus();
                        }
                    }
                })
            })(jQuery);
            targetEle.insertAtCaret(str);

        }
    };

    var ins = new Now();
    if (ins.getQry('_uitest') !== null) {
        window.uitest = true;
        ins._uitest = 1;

        if (ins.getQry('_record') !== null){
            $.ajaxSetup({async: false});
            $.ajax({
                url: './static/nowjs/uitest.js',
                type: 'GET',
                async: false
            });
        }

        try{
            $('body').append('<script type="text/javascript">$("#_nui_colorpick").modal("hide");setTimeout(function(){$.support.transition = false;},500)</script>');
        }catch(e){

        }
    }else{
        window.uitest = false;
    }

    return ins;
});
