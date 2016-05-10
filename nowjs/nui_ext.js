/**
 * 简单的UI组件-业务扩展，参考的bootstrap
 */
define(function (require) {

    var now = require('now');

    /*
     * 课程显示选择组件
     * @author 刘锦华
     */
    !function ($) {
        //构造函数
        var Courseslt = function (element, options) {
            this.options = options;
            this.$element = $(element).addClass(options.css);
            //节点数据 队列
            this._data = [];
            //当前选中节点
            this._selected = null;
            //样式表
            this._style = defaultStyle;
            //执行初始化
            this._init();
        };
        Courseslt.prototype = {
            constructor: Courseslt,
            //初始化
            _init: function () {
                var op = this.options,
                    dataType = typeof this.options.data,
                    t = this;

                //扩展参数
                t._expandOption();

                //判断data类型 若为object则直接加载数据 若为string 则远程加载数据
                switch (dataType) {
                    case 'object':
                        t._load(op.data);
                        break;
                    case 'string':
                        now.cmd(op.data, op.para, function (ret) {
                            t._load(ret);
                        });
                        break;
                    default:
                        return false;
                        break;
                }

                return true;
            },
            //载入
            _load: function (data) {
                //分析节点
                var htmlString = this._analysis(data);
                if (htmlString && htmlString.length > 0) {
                    //加载页面
                    this.$element.html(htmlString);
                    //banding 事件
                    this._eventBind();
                }
                else {
                    return false;
                }
            },
            //banding 事件
            _eventBind: function () {
                var t = this,
                    currentStyle = t._style;

                //banding li 项hover时的效果
                $("ul li." + currentStyle.item.main, t.$element).on("mouseover", function () {
                    $(this).addClass(currentStyle.item.hover);
                }).on("mouseout", function () {
                    $(this).removeClass(currentStyle.item.hover);
                });

                //baning 点击 学习按钮时回调其相应的数据节点
                $("ul li." + currentStyle.item.main + " a", t.$element).on("click", function () {
                    t._event("select", parseInt($(this).attr("data-index"), 10));
                });
            },
            //解析数据 返回拼接html
            _analysis: function (data) {
                var t = this,
                    htmlString = '',
                    currentMap = t.options.map;

                htmlString += '<ul>';

                //获取 章 节点列表
                var chapterList = data[currentMap.list.chapter];
                if (!t._isObjectEmpty(chapterList)) {
                    //循环拼接 章 节点数据
                    $.each(chapterList, function (i, chapter) {
                        htmlString += t._analysisChapter(chapter, i + 1);
                    });
                }

                htmlString += '</ul>'
                return htmlString;
            },
            //分析章节点 返回相应拼接字符串
            _analysisChapter: function (chapter, index) {
                var t = this,
                    htmlString = '',
                    currentStyle = t._style,
                    currentMap = t.options.map,
                    sectionList = chapter[currentMap.list.section], //获取 节 节点列表 及 资源 节点列表 以及 练习节点 列表
                    resourceList = chapter[currentMap.list.resource],
                    examList = chapter[currentMap.list.exam],
                    chapterClass = currentStyle.chapter.main;

                if (t._isObjectEmpty(sectionList)) {
                    chapterClass = currentStyle.chapter.mixed;
                }

                //分析节点数据 并拼接字符串
                htmlString += '<li class="' + currentStyle.theme.main + ' ' + chapterClass + '">';
                htmlString += '   <div class="' + currentStyle.left + '">';
                htmlString += '       <i>' + index + '</i>';
                htmlString += '   </div>';
                htmlString += '   <div class="' + currentStyle.right + '">';
                htmlString += '       <span class="' + currentStyle.chapter.title + '">' + chapter[currentMap.chapter.name] + '</span>';
                htmlString += '   </div>';
                htmlString += "</li>";

                //判断分析方式 若含有 节 节点 则只分析 节 节点 当前不分析 资源 和 练习 节点
                if (!t._isObjectEmpty(sectionList)) {
                    //循环分析 节 节点
                    $.each(sectionList, function (j, section) {
                        htmlString += t._analysisSection(section, j + 1, chapter[currentMap.chapter.id]);
                    });
                }
                else {
                    //不含 节 节点 则分析 资源 节点 和 练习节点
                    if (!t._isObjectEmpty(resourceList)) {
                        $.each(resourceList, function (j, resource) {
                            htmlString += t._analysisResource(resource, chapter[currentMap.chapter.id], "", chapter[currentMap.chapter.courseId]);
                        })
                    }

                    if (!t._isObjectEmpty(examList)) {
                        $.each(examList, function (j, exam) {
                            htmlString += t._analysisExam(exam, chapter[currentMap.chapter.id], "", chapter[currentMap.chapter.courseId]);
                        });
                    }
                }

                return htmlString;
            },
            //分析 节 节点 返回相应拼接字符串
            _analysisSection: function (section, index, chapterId) {
                var t = this,
                    htmlString = '',
                    currentStyle = t._style,
                    currentMap = t.options.map,
                    resourceList = section[currentMap.list.resource],//获取资源列表 和 练习列表
                    examList = section[currentMap.list.exam];

                htmlString += '<li class="' + currentStyle.theme.main + ' ' + currentStyle.section.main + '">';
                htmlString += '   <div class="' + currentStyle.left + '">';
                htmlString += '       <i>' + index + '</i>';
                htmlString += '   </div>';
                htmlString += '   <div class="' + currentStyle.right + '">';
                htmlString += '       <span class="' + currentStyle.section.title + '">' + section[currentMap.section.name] + '</span>';
                htmlString += '   </div>';
                htmlString += "</li>";

                if (!t._isObjectEmpty(resourceList)) {
                    $.each(resourceList, function (k, resource) {
                        htmlString += t._analysisResource(resource, chapterId, section[currentMap.section.id], section[currentMap.section.courseId]);
                    });
                }

                if (!t._isObjectEmpty(examList)) {
                    $.each(examList, function (k, exam) {
                        htmlString += t._analysisExam(exam, chapterId, section[currentMap.section.id], section[currentMap.section.courseId]);
                    });
                }

                return htmlString;
            },
            //分析资源节点 返回相应拼接字符串
            _analysisResource: function (resource, chapterId, sectionId, courseId) {
                var t = this,
                    htmlString = '',
                    currentMap = t.options.map,
                    kindName = resource[currentMap.resource.kindName];

                resource[currentMap.chapter.id] = chapterId;
                resource[currentMap.chapter.courseId] = courseId;
                resource[currentMap.section.id] = sectionId;

                //获取种类名称 并分析 主要为 视频 和文本
                switch (kindName) {
                    case "文本":
                        htmlString += t._analysisLiterature(resource);
                        break;
                    case "三分屏":
                        htmlString += t._analysisVideo(resource);
                        break;
                    default:
                        htmlString += t._analysisVideo(resource);
                        break;
                };

                return htmlString;
            },
            //分析 文学教学 节点 返回相应拼接字符串
            _analysisLiterature: function (literature) {
                var t = this,
                    htmlString = '',
                    currentStyle = t._style,
                    currentMap = t.options.map,
                    fullClass = "", //解析完成的情况
                    goStudy = "",
                    percent = parseInt(literature[currentMap.resource.percent], 10);

                //解析
                htmlString += '<li class="' + currentStyle.item.main + ' ' + currentStyle.literature.main + '">';
                htmlString += '    <div class="' + currentStyle.left + '">';

                if (percent == 100) {
                    fullClass = "full";
                    goStudy = currentStyle.studyButton.finish;
                }
                else if (percent == 0) {
                    fullClass = "empty";
                    goStudy = currentStyle.studyButton.unStart;
                }
                else {
                    fullClass = "half";
                    goStudy = currentStyle.studyButton.unFinish;
                }

                htmlString += '        <i class="' + fullClass + '"></i>';
                htmlString += '    </div>';
                htmlString += '    <div class="' + currentStyle.right + '">';
                htmlString += '        <span class="' + currentStyle.literature.time + ' right">' + t._toTime(parseInt(literature[currentMap.resource.time], 10)) + '<i class="' + currentStyle.literature.img + '"></i></span>';
                htmlString += '        <a class="' + currentStyle.studyButton.main + ' right res" data-index="' + t._getDataLength() + '" href="javascript:void(0);">' + goStudy + '</a>';

                //添加相应数据节点
                t._appendData(literature);

                htmlString += '        <span class="' + currentStyle.literature.title + '">' + literature[currentMap.resource.name] + '</span>';
                htmlString += '    </div>';
                htmlString += '</li>';

                return htmlString;
            },
            //分析 视频教学 节点 返回相应拼接字符串
            _analysisVideo: function (video) {
                var t = this,
                    htmlString = '',
                    currentStyle = t._style,
                    currentMap = t.options.map,
                    fullClass = "",
                    goStudy = "",
                    percent = parseInt(video[currentMap.resource.percent], 10);

                htmlString += '<li class="' + currentStyle.item.main + ' ' + currentStyle.video.main + '">';
                htmlString += '    <div class="' + currentStyle.left + '">';

                if (percent == 100) {
                    fullClass = "full";
                    goStudy = currentStyle.studyButton.finish;
                }
                else if (percent == 0) {
                    fullClass = "empty";
                    goStudy = currentStyle.studyButton.unStart;
                }
                else {
                    fullClass = "half";
                    goStudy = currentStyle.studyButton.unFinish;
                }

                htmlString += '        <i class="' + fullClass + '"></i>';
                htmlString += '    </div>';
                htmlString += '    <div class="' + currentStyle.right + '">';
                htmlString += '        <span class="' + currentStyle.video.time + ' right">' + t._toTime(parseInt(video[currentMap.resource.time], 10)) + '<i class="' + currentStyle.video.img + '"></i></span>';
                htmlString += '        <a class="' + currentStyle.studyButton.main + ' right res" data-index="' + t._getDataLength() + '" href="javascript:void(0);">' + goStudy + '</a>';

                t._appendData(video);

                htmlString += '        <span class="' + currentStyle.video.title + '">' + video[currentMap.resource.name] + '</span>';
                htmlString += '    </div>';
                htmlString += '</li>';

                return htmlString;
            },
            //分析测试节点 返回相应拼接字符串
            _analysisExam: function (exam, chapterId, sectionId, courseId) {
                var t = this,
                    htmlString = '',
                    currentStyle = t._style,
                    currentMap = t.options.map;

                htmlString += '<li class="' + currentStyle.item.main + ' ' + currentStyle.exam.main + '">';
                htmlString += '    <div class="' + currentStyle.left + '"><i class="full"></i></div>';
                htmlString += '    <div class="' + currentStyle.right + '">';
                htmlString += '        <span class="' + currentStyle.exam.time + ' right">' + exam[currentMap.exam.subNum] + '题<i class="' + currentStyle.exam.img + '"></i></span>';
                htmlString += '        <a class="' + currentStyle.studyButton.main + ' right exam" data-index="' + t._getDataLength() + '" href="javascript:void(0);" >' + currentStyle.studyButton.goExam + '</a>';

                exam[currentMap.chapter.id] = chapterId;
                exam[currentMap.chapter.courseId] = courseId;
                exam[currentMap.section.id] = sectionId;

                t._appendData(exam);

                htmlString += '        <span class="' + currentStyle.exam.title + '">' + exam[currentMap.exam.name] + '</span>';
                htmlString += '    </div>';
                htmlString += '</li>';

                return htmlString;
            },
            //刷新即重新载入
            _reload: function (para) {
                var t = this,
                    op = this.options;
                //重置参数
                if (!t._isObjectEmpty(para)) {
                    op = $.extend({}, op, para);
                }
                //扩展参数
                t._expandOption();
                //清空数据
                t._clearData();

                t._init();
            },
            //将分钟转换为时间 00:00 格式
            _toTime: function (minutes) {
                var hour = parseInt(minutes / 60, 10);
                var minute = parseInt(minutes % 60, 10);
                return (this._expandNum(hour) + ":" + this._expandNum(minute));
            },
            //扩充正整数，当其为个位数时 补上一个0
            _expandNum: function (num) {
                var str = "";
                if (num < 10) {
                    str = "0" + num
                }
                else {
                    str = num + "";
                }
                return str;
            },
            //判断对象内容是否为空 若参数不为对象类型 ，则亦视为内容为空的对象
            _isObjectEmpty: function (obj) {
                if (typeof obj == "object" && obj) {
                    for (var sub in obj) {
                        return false;
                    }
                    return true;
                }
                else {
                    return true;
                }
            },
            //扩展参数配置
            _expandOption: function () {
                var t = this,
                    ops = t.options;
                //扩展映射参数
                ops.map = $.extend(true, defaultMap, ops.map);
                ops.map = $.extend(true, necessaryMap, ops.map);

            },
            //事件触发 传递数据节点 
            _event: function (type, dataIndex) {
                var t = this;
                t._selected = t._data[dataIndex];
                var e = $.Event(type);
                t.$element.trigger(e, t._selected);
            },
            //添加数据节点
            _appendData: function (node) {
                this._data.push(node);
            },
            //清除数据
            _clearData: function () {
                this._data = [];
                this._data.length = 0;
            },
            //获取数据长度
            _getDataLength: function () {
                return this._data.length;
            },
            //获取当前选中行
            _getSelected: function () {
                return this._selected;
            },
            //对外函数接口：
            //获取当前选定节点
            getSelect: function () {
                return this._getSelected();
            },
            //重置数据
            reload: function (para) {
                this._reload(para);
            }
        };
        //对外使用接口 必须参数 option
        $.fn.courseslt = function (option, para) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('courseslt'),
                    os = (typeof option == 'string');

                //执行
                if (!data) {
                    var options = $.extend({}, $.fn.courseslt.defaults, typeof option == 'object' && option);
                    $this.data('courseslt', (data = new Courseslt(this, options)));
                }
                else if (!os) {
                    data.options = $.extend({}, data.options, typeof option == 'object' && option);
                    data._init();
                }
                if (os) {
                    if (null != para && para != undefined) {
                        return data[option](para);
                    }
                    else {
                        return data[option]();
                    }
                }
            });
        };
        //默认可选参数系列
        $.fn.courseslt.defaults = {
            //数据源
            data: null,
            //远程请求参数
            para: {},
            //主样式
            css: "courslt",
            //其余数据参数映射名称
            map: {}
        };
        //默认参数配置
        //默认解析参数名称-必要数据-映射 不可配置
        var necessaryMap = {
            //列表项目参数名称
            list: {
                chapter: "chapter_list",
                section: "section_list",
                resource: "res_list",
                exam: "exam_list"
            },
            //章 参数名称
            chapter: {
                name: "chapter_name"
            },
            //节 参数名称
            section: {
                name: "section_name"
            },
            //课时（文学教学） 参数名称
            resource: {
                name: "res_name",
                time: "res_ltime",
                kindName: "res_kind_name",
                percent: "percent"
            },
            //练习 参数名称
            exam: {
                name: "exam_name",
                subNum: "sub_num"
            }
        };
        //默认解析参数名称-其他数据-映射配置 可配置
        var defaultMap = {
            //章 参数名称
            chapter: {
                id: "chapter_id",
                courseId: "course_id"
            },
            //节 参数名称
            section: {
                id: "section_id",
                courseId: "course_id"
            }
        };
        //默认样式 不可配置
        var defaultStyle = {
            //每一项 li 左边区域 样式
            left: "cour-lf",
            //右边区域样式
            right: "cour-rg",
            // 章 节 li节点的 一般样式
            theme: {
                main: "cour-the"
            },
            //章 项样式
            chapter: {
                //主样式
                main: "cour-chap",
                //标题样式
                title: "cour-title",
                //章节样式混合
                mixed: "cour-chap-sec"
            },
            //节 项样式
            section: {
                main: "cour-sec",
                title: "cour-title"
            },
            //文学教学 项样式
            literature: {
                //主样式
                main: "",
                //标题样式
                title: "cour-title",
                //时间样式
                time: "cour-times",
                //相关图片样式
                img: "doc"
            },
            //视屏教学 项样式
            video: {
                main: "",
                title: "cour-title",
                time: "cour-times",
                img: "vod"
            },
            //章节练习 项样式
            exam: {
                main: "",
                title: "cour-title",
                time: "cour-times",
                img: "tes"
            },
            //一般项目样式 （即可选择 除 章 节 以外的 li 项 样式）
            item: {
                main: "cour-res",
                //hover效果样式
                hover: "active"
            },
            //进入学习 的按钮的样式
            studyButton: {
                //状态相关字符
                unStart: "开始学习",
                unFinish: "继续学习",
                finish: "进入复习",
                goExam: "进入",
                //按钮主样式
                main: "btn-primary"
            }
        };
    }(jQuery);


    /*
     * 倒计时组件
     * @author 刘锦华
     */
    !function ($) {
        var TimeCnt = function (element, options) {
            this.data = 0;
            this.$element = $(element).addClass(options.css);
            this.options = options;
            //倒计时函数
            this.cutDownRender = null;
            this._init();
        };
        TimeCnt.prototype = {
            constructor: TimeCnt,
            //初始化
            _init: function () {
                var t = this;
                t.data = this._analyTime(t.options.data);
                t._load();
            },
            //加载
            _load: function () {
                var t = this,
                    op = this.options,
                    $el = this.$element,
                    html = '',
                    startTime = t._analyTime(t.data.toString());
                html += '<div class="timecnt-con">'
                if (op.showIcon) {
                    html += '<span class="icon"></span>';
                }
                html += '<span class="time text-info"></span><div class="clearboth"></div>';
                html += '</div>';
                $el.html(html);
                t._setTime(t._parseTime(t.data));
                if (op.auto) {
                    t._start();
                }
            },
            //设置显示时间
            _setTime: function (time) {
                var t = this,
                    op = t.options,
                    $el = t.$element;
                $('.time', $el).html(op.hint + time);
            },
            //重置数据
            _resetData: function () {
                this.data = 0;
            },
            //开始倒计时
            _start: function () {
                var t = this,
                    op = t.options;
                t.cutDownRender = setInterval(function () {
                    if (t.data == 0) {
                        t._submit();
                        t._stop();
                    }
                    t._setTime(t._parseTime(t.data));
                    t.data--;
                }, 1000);
            },
            //停止倒计时
            _stop: function () {
                var t = this;
                if (null != t.cutDownRender) {
                    clearInterval(t.cutDownRender);
                }
            },
            //提交
            _submit: function () {
                var t = this,
                    submitFun = t.options.submitRender;
                if ($.isFunction(submitFun)) {
                    submitFun();
                }
                t._stop();
                t._resetData();
            },
            //解析时间 将时间全部转换为以秒为单位的数字
            _analyTime: function (data) {
                var unit = data.charAt(data.length - 1),
                    timeNum = parseFloat(data, 10);
                timeNum = isNaN(timeNum) ? 0 : timeNum;
                switch (unit) {
                    case 's':
                        return timeNum;
                        break;
                    case 'm':
                        return timeNum * 60;
                        break;
                    case 'h':
                        return timeNum * 3600;
                        break;
                    default:
                        return timeNum * 60;
                        break;
                }
            },
            //转换时间 00:00:00 => 秒钟
            _parseSecond: function (time) {
                var times = time.split(':'),
                    result = 0;
                if (times && times.length > 0 && times.length < 4) {
                    $.each(times, function (i, val) {
                        result += 60 ^ (2 - i) * parseInt(val, 10);
                    });
                }
                return result;
            },
            //转换时间 秒钟 =》 00：00：00
            _parseTime: function (seconds) {
                if (isNaN(seconds)) {
                    return seconds;
                }

                var t = this,
                    _seconds = parseInt(seconds, 10),
                    _minutes = parseInt(_seconds / 60, 10),
                    _second = parseInt(_seconds % 60, 10),
                    _minute = parseInt(_minutes % 60, 10)
                _hour = parseInt(_minutes / 60, 10);

                return (t._extendNum(_hour) + ':' + t._extendNum(_minute) + ':' + t._extendNum(_second));
            },
            //扩展各位数字
            _extendNum: function (num) {
                if (num >= 0 && num < 10) {
                    return '0' + num;
                }
                else {
                    return num + '';
                }
            },
            //string isNullOrEmpty
            _isNullOrEmpty: function (str) {
                if (str && str.length > 0) {
                    return false;
                }
                else {
                    return true;
                }
            },
            //对外接口
            //重新载入
            reload: function (para) {
                var t = this,
                    op = this.options;
                if (para && typeof para == 'object') {
                    op = $.extend({}, op, para);
                }
                t._init();
            },
            //submit
            submit: function () {
                this._submit();
            },
            //save
            save: function () {
                var t = this,
                    saveFun = t.options.saveRender;
                t._stop();
                if ($.isFunction(saveFun)) {
                    saveFun();
                }
            },
            //停止
            stop: function () {
                this._stop();
            },
            //重新开始
            restart: function () {
                var t = this;
                t._stop();
                t._start();
            },
            //获取余下时间
            getLastTime: function (type) {
                var t = this,
                    _data = parseFloat(t.data);
                switch (type) {
                    case 'm':
                        return _data / 60;
                        break;
                    case 's':
                        return _data;
                        break;
                    case 'h':
                        return _data / 3600;
                        break;
                    default:
                        return _data / 60;
                        break;
                }
            },
            //开始
            start: function () {
                this._start();
            }
        };
        $.fn.timecnt = function (option, para, cb) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('timecnt'),
                    os = (typeof option == 'string');

                //执行
                if (!data) {
                    var options = $.extend({}, $.fn.timecnt.defaults, typeof option == 'object' && option);
                    $this.data('timecnt', (data = new TimeCnt(this, options)));
                }
                else if (!os) {
                    data.options = $.extend({}, data.options, typeof option == 'object' && option);
                    data.reload();
                }
                if (os) {
                    if ($.isFunction(para)) {
                        para(data[option]({}));
                    } else if ($.isFunction(cb)) {
                        cb(data[option](para));
                    } else {
                        data[option](para);
                    }
                }
            });
        };
        $.fn.timecnt.defaults = {
            //主体样式
            css: 'timecnt',
            //时间数据 可选值为 数值（默认单位为m， 可选形式：60s 60秒，60m 60分钟， 60h 60小时）
            data: '0',
            //时间到后执行函数
            submitRender: null,
            //暂停保存状态执行函数
            saveRender: null,
            //是否显示提示图片
            showIcon: true,
            //提示
            hint: '剩余时间：',
            //是否自动开始
            auto: false
        };
    }(jQuery);

    /*
     * 答题卡组件
     * @author 刘锦华
     */
    !function ($) {
        var AnswerCard = function (element, options) {
            this.options = options;
            this.$element = $(element).addClass(options.css);
            this.data = null;
            this.selected = null;
            this._init();
        };
        AnswerCard.prototype = {
            constructor: 'AnswerCard',
            //初始化
            _init: function () {
                var t = this,
                    op = t.options,
                    dataType = typeof op.data;

                switch (dataType) {
                    case 'object':
                        t.data = op.data;
                        t._load();
                        break;
                    case 'string':
                        now.cmd(op.data, op.para, function (ret) {
                            t.data = ret;
                            t._load();
                        });
                        break;
                    default:
                        break;
                }
            },
            //加载
            _load: function () {
                var t = this,
                    op = t.options,
                    $el = t.$element,
                    _data = t.data,
                    html = '',
                    hint = op.hint,
                    render = op.render,
                    field = op.field;

                html += '<div class="answercard-con">';

                if (hint && hint.length > 0) {
                    html += '<p class="ans-tip">' + hint + '</p>';
                }

                html += '<ul class="nav nav-pills ans-list">';
                $.each(_data, function (index, node) {
                    var active = '',
                        fieldsHtml = '';
                    if (node[op.selected]) {
                        active = 'active';
                    }
                    if (node[field]) {
                        fieldsHtml = 'data-field="' + node[field] + '"';
                    }
                    html += '<li ' + fieldsHtml + ' class="' + active + '">';
                    if ($.isFunction(render)) {
                        html += render(index, node);
                    }
                    else if (typeof render == 'string') {
                        html += '<a href="###" data-index="' + index + '">' + t._expandNum(node[render]) + '</a>'
                    }
                    html += '</li>'
                });
                html += '</ul>';
                html += '</div>';

                $el.html(html);
                t._eventBind();
            },
            //激活
            _setSelected: function (id) {
                var t = this,
                    _data = t.data,
                    op = t.options,
                    field = op.field,
                    selected = op.selected;
                $('.ans-list li[data-field=' + id + ']').addClass('active');
                $.each(_data, function (index, node) {
                    if (node[field] == id) {
                        node[selected] = true;
                        t.selected = node;
                        return false;
                    }
                });
            },
            //未激活
            _setunSelected: function (id) {
                var t = this,
                    _data = t.data,
                    op = t.options,
                    field = op.field,
                    selected = op.selected;
                $('.ans-list li[data-field=' + id + ']').removeClass('active');
                $.each(_data, function (index, node) {
                    if (node[field] == id) {
                        node[selected] = false;
                        return false;
                    }
                });
            },
            //事件banding
            _eventBind: function () {
                var t = this,
                    $el = t.$element,
                    op = t.options,
                    _data = t.data;

                $('.ans-list a', $el).on('click', function (evt) {
                    var dataIndex = $(this).attr('data-index');
                    t.selected = _data[dataIndex];
                    t._eventTrigger('select', dataIndex, t.selected);
                });
            },
            //事件触发
            _eventTrigger: function (type, para1, para2, para3, para4) {
                var t = this,
                    e = $.Event(type);
                t.$element.trigger(e, [para1, para2, para3, para4]);
            },
            //是否数组
            _isArray: function (obj) {
                return Object.prototype.toString.call(obj) === '[object Array]';
            },
            //扩展个位数字为两位
            _expandNum: function (str) {
                if (isNaN(str)) {
                    return str;
                }
                var value = parseInt(str, 10);
                if (value >= 0 && value < 10) {
                    return '0' + value
                }
                else {
                    return str;
                }
            },
            //对外接口
            //重置
            reload: function (para) {
                var t = this,
                    op = t.options;
                if (para && typeof para == 'object') {
                    op = $.extend({}, op, para);
                }
                t._init();
            },
            //获取选择项
            getSelecteds: function () {
                var t = this;
                return $.grep(t.data, function (node, index) {
                    if (node[t.options.selected]) {
                        return true;
                    }
                });
            },
            //获取未选择项
            getunSelecteds: function () {
                var t = this;
                return $.grep(t.data, function (node, index) {
                    if (node[t.options.selected]) {
                        return true;
                    }
                }, true);
            },
            //获取最新选择项
            getSelected: function () {
                return this.selected;
            },
            //激活项
            setSelected: function (para) {
                var t = this;
                if (t._isArray(para)) {
                    $.each(para, function (index, val) {
                        t._setSelected(val);
                    });
                }
                else {
                    t._setSelected(para);
                }
            },
            //未激活项
            setunSelected: function (para) {
                var t = this;
                if (t._isArray(para)) {
                    $.each(para, function (index, val) {
                        t._setunSelected(val);
                    });
                }
                else {
                    t._setunSelected(para);
                }
            }
        };
        $.fn.answercard = function (option, para, cb) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('answercard'),
                    os = (typeof option == 'string');

                //执行
                if (!data) {
                    var options = $.extend({}, $.fn.answercard.defaults, typeof option == 'object' && option);
                    $this.data('answercard', (data = new AnswerCard(this, options)));
                }
                else if (!os) {
                    data.options = $.extend({}, data.options, typeof option == 'object' && option);
                    data.reload();
                }
                if (os) {
                    if ($.isFunction(para)) {
                        para(data[option]({}));
                    } else if ($.isFunction(cb)) {
                        cb(data[option](para));
                    } else {
                        data[option](para);
                    }
                }
            });
        };
        $.fn.answercard.defaults = {
            //基本样式
            css: 'answercard',
            //数据 可直接填充亦可远程请求
            data: null,
            //远程请求参数
            para: {},
            //是否激活字段
            selected: 'selected',
            //唯一识别字段
            field: 'id',
            //显示字段
            render: 'sort',
            //提示文字
            hint: '答题卡：'
        };
    }(jQuery);

    /*
     * 试题组件
     * @author 刘锦华
     */
    !function ($) {
        var QuesMdl = function (element, options) {
            this.options = options;
            this.$element = $(element).addClass(options.css);
            this.data = null;
            this.selected = null;
            this._init();
        };
        QuesMdl.prototype = {
            constructor: QuesMdl,
            _init: function () {
                var t = this,
                    op = this.options,
                    dataType = typeof op.data;

                if (dataType == 'object') {
                    t.data = op.data;
                    t._load();
                }
                else if (dataType == 'string') {
                    now.cmd(op.data, op.para, function (ret) {
                        t.data = ret;
                        t._load();
                    });
                }
            },
            _load: function () {
                var t = this,
                    op = t.options,
                    _data = t.data,
                    $el = t.$element,
                    opType = op.type,
                    questions = null,
                    html = '',
                    singleChoices = null,
                    multiChoices = null,
                    judges = null,
                    fillings = null,
                    shortAnswers = null,
                    groups = null,
                    funName = '';

                if (_data) {
                    _data.sort(function (obj1, obj2) {
                        return parseInt(obj1[questionMap.sort], 10) - parseInt(obj2[questionMap.sort], 10);
                    });

                    singleChoices = $.grep(_data, function (val, i) {
                        if (val[questionMap.type] == questionType.singleChoice) {
                            return true;
                        }
                    });
                    multiChoices = $.grep(_data, function (val, i) {
                        if (val[questionMap.type] == questionType.multiChoice) {
                            return true;
                        }
                    });
                    judges = $.grep(_data, function (val, i) {
                        if (val[questionMap.type] == questionType.judge) {
                            return true;
                        }
                    });
                    fillings = $.grep(_data, function (val, i) {
                        if (val[questionMap.type] == questionType.filling) {
                            return true;
                        }
                    });
                    shortAnswers = $.grep(_data, function (val, i) {
                        if (val[questionMap.type] == questionType.shortAnswer) {
                            return true;
                        }
                    });
                    groups = $.grep(_data, function (val, i) {
                        if (val[questionMap.type] == questionType.group) {
                            return true;
                        }
                    });

                    questions = {
                        singleChoices: singleChoices,
                        multiChoices: multiChoices,
                        judges: judges,
                        fillings: fillings,
                        shortAnswers: shortAnswers,
                        groups: groups
                    };

                    html += '<div class="ques-con">';

                    funName = '_analyBy' + t._toFirstUpperCase(opType);
                    if ($.isFunction(t[funName])) {
                        html += t[funName](questions);
                    }
                    html += '</div>';
                    $el.html(html);
                    t._eventBind();
                    t._eventLaunch();
                }
            },
            _analyBySin: function () {
                var t = this,
                   op = t.options,
                   index = 0,
                   html = '',
                   _data = t.data,
                   active = 'active';

                html += '<div class="sin">';
                html += '<div class="carousel slide" id="ques-sin">';
                html += '<ol class="carousel-indicators" style="display: none;">';
                for (var i = 0; i < _data.length; i++) {
                    if (i == 0) {
                        active = 'active';
                    }
                    else {
                        active = '';
                    }
                    html += '<li data-target="#ques-sin" data-slide-to="' + i + '" class="' + active + '"></li>';
                }
                html += '</ol>';
                html += '<div class="carousel-inner">';
                $.each(_data, function (index, ques) {
                    if (index == 0) {
                        active = 'active';
                    }
                    else {
                        active = '';
                    }
                    html += '<div class="item ' + active + '">';
                    html += t._analyQues(ques);
                    html += '</div>';
                });
                html += '</div>';
                html += '<div class="btn-group sin-btns">';
                html += '<button class="btn sin-prev">上一题</button>';
                html += '<button class="btn sin-next">下一题</button>';
                html += '<button class="btn sin-first">首题</button>';
                html += '<button class="btn sin-last">末题</button>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
                return html;
            },
            _analyByAll: function (questions) {
                var t = this,
                    op = t.options,
                    index = 0,
                    html = '',
                    singleChoices = questions.singleChoices,
                    multiChoices = questions.multiChoices,
                    judges = questions.judges,
                    fillings = questions.fillings,
                    shortAnswers = questions.shortAnswers,
                    groups = questions.groups;

                html += '<div id="ques-all" class="all">';
                if (singleChoices.length > 0) {
                    html += '<div class="all-sin">';
                    html += '<div class="all-ti">'
                    html += '<span>' + defaultQuestionNumber.charAt(index) + '、 单选题</span>';
                    html += '</div>';
                    html += '<div class="all-con">';
                    $.each(singleChoices, function (i, sin) {
                        html += t._analySin(sin);
                    });
                    html += '</div>';
                    html += '</div>';
                    index++;
                }
                if (multiChoices.length > 0) {
                    html += '<div class="all-mul">';
                    html += '<div class="all-ti">'
                    html += '<span>' + defaultQuestionNumber.charAt(index) + '、 多选题</span>';
                    html += '</div>';
                    html += '<div class="all-con">';
                    $.each(multiChoices, function (i, mul) {
                        html += t._analyMul(mul);
                    });
                    html += '</div>';
                    html += '</div>';
                    index++;
                }
                if (judges.length > 0) {
                    html += '<div class="all-jud">';
                    html += '<div class="all-ti">'
                    html += '<span>' + defaultQuestionNumber.charAt(index) + '、 判断题</span>';
                    html += '</div>';
                    html += '<div class="all-con">';
                    $.each(judges, function (i, jud) {
                        html += t._analyJud(jud);
                    });
                    html += '</div>';
                    html += '</div>';
                    index++;
                }
                if (fillings.length > 0) {
                    html += '<div class="all-fil">';
                    html += '<div class="all-ti">'
                    html += '<span>' + defaultQuestionNumber.charAt(index) + '、 填空题</span>';
                    html += '</div>';
                    html += '<div class="all-con">';
                    $.each(fillings, function (i, fil) {
                        html += t._analyFil(fil);
                    });
                    html += '</div>';
                    html += '</div>';
                    index++;
                }
                if (shortAnswers.length > 0) {
                    html += '<div class="all-sho">';
                    html += '<div class="all-ti">'
                    html += '<span>' + defaultQuestionNumber.charAt(index) + '、 简答题</span>';
                    html += '</div>';
                    html += '<div class="all-con">';
                    $.each(shortAnswers, function (i, sho) {
                        html += t._analySho(sho);
                    });
                    html += '</div>';
                    html += '</div>';
                    index++;
                }
                if (groups.length > 0) {
                    html += '<div class="all-gro">';
                    html += '<div class="all-ti">'
                    html += '<span>' + defaultQuestionNumber.charAt(index) + '、 组合题</span>';
                    html += '</div>';
                    html += '<div class="all-con">';
                    $.each(groups, function (i, gro) {
                        html += t._analyGro(gro);
                    });
                    html += '</div>';
                    html += '</div>';
                    index++;
                }
                html += '</div>';
                return html;
            },
            _analyByTab: function (questions) {
                var t = this,
                    op = t.options,
                    index = 0,
                    html = '',
                    singleChoices = questions.singleChoices,
                    multiChoices = questions.multiChoices,
                    judges = questions.judges,
                    fillings = questions.fillings,
                    shortAnswers = questions.shortAnswers,
                    groups = questions.groups,
                    active = 'active';

                html += '<div class="tab">';
                html += '<ul class="nav nav-tabs" id="ques-tab">';
                if (singleChoices.length > 0) {
                    html += '<li class="' + active + '"><a href="#tab-sin" data-toggle="tab">单选题</a></li>';
                    active = '';
                }
                if (multiChoices.length > 0) {
                    html += '<li class="' + active + '"><a href="#tab-mul" data-toggle="tab">多选题</a></li>';
                    active = '';
                }
                if (judges.length > 0) {
                    html += '<li class="' + active + '"><a href="#tab-jud" data-toggle="tab">判断题</a></li>';
                    active = '';
                }
                if (fillings.length > 0) {
                    html += '<li class="' + active + '"><a href="#tab-fil" data-toggle="tab">填空题</a></li>';
                    active = '';
                }
                if (shortAnswers.length > 0) {
                    html += '<li class="' + active + '"><a href="#tab-sho" data-toggle="tab">简答题</a></li>';
                    active = '';
                }
                if (groups.length > 0) {
                    html += '<li class="' + active + '"><a href="#tab-gro" data-toggle="tab">组合题</a></li>';
                    active = '';
                }
                html += '</ul>';
                active = 'active';
                html += '<div class="tab-content">';
                if (singleChoices.length > 0) {
                    html += '<div class="tab-pane tab-sin ' + active + '" id="tab-sin">';
                    $.each(singleChoices, function (index, sin) {
                        html += t._analySin(sin);
                    });
                    html += '</div>';
                    active = '';
                }
                if (multiChoices.length > 0) {
                    html += '<div class="tab-pane tab-mul ' + active + '" id="tab-mul">';
                    $.each(multiChoices, function (index, mul) {
                        html += t._analyMul(mul);
                    });
                    html += '</div>';
                    active = '';
                }
                if (judges.length > 0) {
                    html += '<div class="tab-pane tab-jud ' + active + '" id="tab-jud">';
                    $.each(judges, function (index, jud) {
                        html += t._analyJud(jud);
                    });
                    html += '</div>';
                    active = '';
                }
                if (fillings.length > 0) {
                    html += '<div class="tab-pane tab-fil ' + active + '" id="tab-fil">';
                    $.each(fillings, function (index, fil) {
                        html += t._analyFil(fil);
                    });
                    html += '</div>';
                    active = '';
                }
                if (shortAnswers.length > 0) {
                    html += '<div class="tab-pane tab-sho ' + active + '" id="tab-sho">';
                    $.each(shortAnswers, function (index, sho) {
                        html += t._analySho(sho);
                    });
                    html += '</div>';
                    active = '';
                }
                if (groups.length > 0) {
                    html += '<div class="tab-pane tab-gro ' + active + '" id="tab-gro">';
                    $.each(groups, function (index, gro) {
                        html += t._analyGro(gro);
                    });
                    html += '</div>';
                    active = '';
                }
                html += '</div>';
                html += '</div>';
                return html;
            },
            _analyQues: function (ques) {
                var t = this,
                    quesType = ques[questionMap.type],
                    funName = '',
                    html = '';
                funName = '_analy' + t._toFirstUpperCase(quesType);
                if ($.isFunction(t[funName])) {
                    html += t[funName](ques);
                }
                return html;
            },
            _analySin: function (sin) {
                var t = this,
                    op = t.options,
                    quesfield = sin[op.field],
                    seAnswer = sin[questionMap.selectedAnswer],
                    sort = sin[questionMap.sort],
                    choiceCss = choiceArrange[op.choiceArr]||'',
                    html = '',
                    hi_val = '';

                html += '<div id="ques-' + sort + '" class="sin">';
                html += '<div class="ques">';
                html += '<div class="ti">';
                html += '<span class="sort">第' + sort + '题</span>';
                html += '<span>' + sin[questionMap.title] + '</span>';
                html += '</div>';
                html += '<div class="ch">';
                html += '<ul>';
                $.each(sin[questionMap.answers], function (i, val) {
                    html += '<li class="' + choiceCss + '">' + defaultChoiceNumber.charAt(i) + '. ' + val + ' </li>';
                });
                html += '</ul>';
                html += '</div>';
                html += '<div class="clearboth"></div>';
                html += '</div>';
                html += '<div class="ans">';
                html += '<div class="ans-con">';
                html += '<span>选择答案:</span>';
                html += '<ul data-index="' + sort + '">';
                for (var i = 0; i < parseInt(sin[questionMap.anawerCount], 10) ; i++) {
                    var answerNumber = defaultChoiceNumber.charAt(i),
                        active = '',
                        checked = '';
                    if (!t._isNullOrEmpty(seAnswer) && seAnswer == answerNumber) {
                        active = 'active';
                        checked = 'checked="checked"';
                        hi_val = seAnswer;
                    }
                    html += '<li data-field="' + quesfield + answerNumber + '" class="' + active + '">';
                    html += '<label class="radio">';
                    html += '<input data-index="' + sort + '" class="se-ans" data-field="' + quesfield + '" value="' + answerNumber + '" name="sin-' + quesfield + '" type="radio" ' + checked + '/>' + answerNumber;
                    html += '</label>';
                    html += '</li>';
                }
                html += '</ul>';
                html += '<input type="hidden" class="fi-ans" data-field="' + quesfield + '" value="' + hi_val + '"/>';
                html += '</div>';
                html += '<div class="clearboth"></div>';
                html += '</div>';
                html += '</div>'

                return html;
            },
            _analyMul: function (mul) {
                var t = this,
                    op = t.options,
                    quesfield = mul[op.field],
                    seAnswer = mul[questionMap.selectedAnswer],
                    choiceCss = choiceArrange[op.choiceArr]||'',
                    sort = mul[questionMap.sort],
                    html = '',
                    hi_val = '';

                html += '<div id="ques-' + sort + '" class="mul">';
                html += '<div class="ques">';
                html += '<div class="ti">';
                html += '<span class="sort">第' + sort + '题</span>';
                html += '<span>' + mul[questionMap.title] + '</span>';
                html += '</div>';
                html += '<div class="ch">';
                html += '<ul>';
                $.each(mul[questionMap.answers], function (i, val) {
                    html += '<li class="' + choiceCss + '">' + defaultChoiceNumber.charAt(i) + '. ' + val + ' </li>';
                });
                html += '</ul>';
                html += '</div>';
                html += '<div class="clearboth"></div>';
                html += '</div>';
                html += '<div class="ans">';
                html += '<div class="ans-con">';
                html += '<span>选择答案:</span>';
                html += '<ul data-index="' + sort + '">';
                for (var i = 0; i < parseInt(mul[questionMap.anawerCount], 10) ; i++) {
                    var answerNumber = defaultChoiceNumber.charAt(i),
                        active = '',
                        checked = '';
                    if (!t._isNullOrEmpty(seAnswer) && seAnswer.indexOf(answerNumber) >= 0) {
                        active = 'active';
                        checked = 'checked="checked"';
                        hi_val = seAnswer;
                    }

                    html += '<li data-field="' + quesfield + answerNumber + '" class="' + active + '">';
                    html += '<label class="checkbox">';
                    html += '<input data-index="' + sort + '" class="se-ans" data-field="' + quesfield + '" value="' + answerNumber + '" name="mul-' + quesfield + '" type="checkbox" ' + checked + '/>' + answerNumber;
                    html += '</label>';
                    html += '</li>';
                }
                html += '</ul>';
                html += '<input type="hidden" class="fi-ans" data-field="' + quesfield + '" value="' + hi_val + '"/>';
                html += '</div>';
                html += '<div class="clearboth"></div>';
                html += '</div>';
                html += '</div>'

                return html;
            },
            _analyJud: function (jud) {
                var t = this,
                    op = t.options,
                    quesfield = jud[op.field],
                    seAnswer = jud[questionMap.selectedAnswer],
                    sort = jud[questionMap.sort],
                    html = '',
                    hi_val = '';

                html += '<div id="ques-' + sort + '" class="jud">';
                html += '<div class="ques">';
                html += '<div class="ti">';
                html += '<span class="sort">第' + sort + '题</span>';
                html += '<span>' + jud[questionMap.title] + '</span>';
                html += '</div>';
                html += '<div class="clearboth"></div>';
                html += '</div>';
                html += '<div class="ans">';
                html += '<div class="ans-con">';
                html += '<span>选择答案:</span>';
                html += '<ul data-index="' + sort + '">';
                for (var i = 0; i < 2; i++) {
                    var answerNumber = defaultJudgeNumber.charAt(i),
                        active = '',
                        checked = '';
                    if (!t._isNullOrEmpty(seAnswer) && seAnswer == answerNumber) {
                        active = 'active';
                        checked = 'checked="checked"';
                        hi_val = seAnswer;
                    }
                    html += '<li data-field="' + quesfield + answerNumber + '" class="' + active + '">';
                    html += '<label class="radio">';
                    html += '<input data-index="' + sort + '" class="se-ans" data-field="' + quesfield + '" value="' + answerNumber + '" name="jud-' + quesfield + '" type="radio" ' + checked + '/>' + answerNumber;
                    html += '</label>';
                    html += '</li>';
                }
                html += '</ul>';
                html += '<input type="hidden" class="fi-ans" data-field="' + quesfield + '" value="' + hi_val + '"/>';
                html += '</div>';
                html += '<div class="clearboth"></div>';
                html += '</div>';
                html += '</div>'

                return html;
            },
            _analyFil: function (fil) {
                var t = this,
                    op = t.options,
                    seAnswer = fil[questionMap.selectedAnswer],
                    quesfield = fil[op.field],
                    sort = fil[questionMap.sort],
                    html = '';

                html += '<div id="ques-' + sort + '" class="fil">';
                html += '<div class="ques">';
                html += '<div class="ti">';
                html += '<span class="sort">第' + sort + '题</span>';
                html += '<span>' + fil[questionMap.title] + '</span>';
                html += '</div>';
                html += '</div>';
                html += '<div class="ans">';
                if (t._isNullOrEmpty(seAnswer)) {
                    seAnswer = '';
                }
                if (op.isEditor) {
                    html += '<div class="fi-editor" style="width: 100%; height: 0px;" id="fil-' + quesfield + '" data-field="' + quesfield + '" value="' + seAnswer + '"></div>';
                    html += '<textarea style="display:none;" class="fi-ans" data-field="' + quesfield + '" name="fil-' + quesfield + '">' + seAnswer + '</textarea>';
                }
                else {
                    html += '<fieldset>';
                    html += '<div>';
                    html += '<textarea class="fi-ans" data-field="' + quesfield + '" name="fil-' + quesfield + '">' + seAnswer + '</textarea>';
                    html += '</div>';
                    html += '</fieldset>';
                }
                html += '</div>';
                html += '</div>';

                return html;
            },
            _analySho: function (sho) {
                var t = this,
                    op = t.options,
                    seAnswer = sho[questionMap.selectedAnswer],
                    sort = sho[questionMap.sort],
                    quesfield = sho[op.field],
                    html = '';

                html += '<div id="ques-' + sort + '" class="sho">';
                html += '<div class="ques">';
                html += '<div class="ti">';
                html += '<span class="sort">第' + sort + '题</span>';
                html += '<span>' + sho[questionMap.title] + '</span>';
                html += '</div>';
                html += '</div>';
                html += '<div class="ans">';
                if (t._isNullOrEmpty(seAnswer)) {
                    seAnswer = '';
                }
                if (op.isEditor) {
                    html += '<div class="fi-editor" style="width: 100%; height: 0px;" id="sho-' + quesfield + '" data-field="' + quesfield + '" value="' + seAnswer + '"></div>';
                    html += '<textarea style="display:none;" class="fi-ans" data-field="' + quesfield + '" name="sho-' + quesfield + '">' + seAnswer + '</textarea>';
                }
                else {
                    html += '<fieldset>';
                    html += '<div>';
                    html += '<textarea class="fi-ans" data-field="' + quesfield + '" name="sho-' + quesfield + '">' + seAnswer + '</textarea>';
                    html += '</div>';
                    html += '</fieldset>';
                }
                html += '</div>';
                html += '</fieldset>';
                html += '</div>';
                html += '</div>';

                return html;
            },
            _analyGro: function (gro) {
                var t = this,
                    op = t.options,
                    html = '';

                html += '<div class="gro">';
                html += '<div class="ques">';
                html += '<div class="ti">';
                html += '<span>' + gro[questionMap.title] + '</span>';
                html += '</div>';
                html += '<div class="clearboth"></div>';
                html += '</div>';
                html += '<div class="">';
                $.each(gro[questionMap.answers], function (index, ques) {
                    html += t._analyQues(ques);
                });
                html += '</div>';
                html += '</div>'
                return html;
            },
            _eventBind: function () {
                var t = this,
                    op = t.options,
                    _data = t.data,
                    $el = t.$element,
                    _selected = t.selected;

                $('.ans .se-ans', $el).on('change', function (event) {
                    var $th = $(this),
                        type = $th.attr('type'),
                        quesField = $th.attr('data-field'),
                        checked = this.checked,
                        $obj = $('.ans .fi-ans[data-field=' + quesField + ']', $el),
                        objVal = $obj.val(),
                        thVal = $th.val(),
                        dataIndex = $th.attr('data-index'),
                        $lis = $('.ans ul[data-index=' + dataIndex + '] li'),
                        $li = $('.ans li[data-field=' + quesField + thVal + ']');
                    switch (type) {
                        case 'radio':
                            $lis.removeClass('active');
                            if (checked) {
                                $li.addClass('active');
                                $obj.val(thVal);
                            }
                            break;
                        case 'checkbox':
                            if (checked) {
                                if (objVal.indexOf(thVal) < 0) {
                                    $li.addClass('active');
                                    $obj.val(objVal + thVal);
                                }
                            }
                            else {
                                $li.removeClass('active');
                                $obj.val(objVal.replace(thVal, ''));
                            }
                            break;
                        default:
                            break;
                    }
                    $obj.trigger('change');
                });
                $('.ans .fi-ans', $el).on('change', function (event) {
                    var $th = $(this),
                        thVal = $th.val(),
                        quesField = $th.attr('data-field');

                    $.each(_data, function (index, val) {
                        if (val[op.field] && val[op.field] == quesField) {
                            val[questionMap.selectedAnswer] = thVal;
                            _selected = val;
                            return false;
                        }
                    });

                    if (t._isNullOrEmpty(thVal)) {
                        t._eventTrigger('uncheck', _selected);
                    }
                    else {
                        t._eventTrigger('check', _selected);
                    }
                }).on('input', function (event) {
                    $(this).trigger('change');
                }).bind('propertychange', function (event) {
                    $(this).trigger('change');
                }).on('keyup', function (event) {
                    $(this).trigger('change');
                });

                if (op.type == optionalType.single) {
                    $('.sin-prev', $el).on('click', function () {
                        $('#ques-sin', $el).carousel('prev');
                        $('#ques-sin', $el).carousel('pause');
                    });
                    $('.sin-next', $el).on('click', function () {
                        $('#ques-sin', $el).carousel('next');
                        $('#ques-sin', $el).carousel('pause');
                    });
                    $('.sin-first', $el).on('click', function () {
                        $('#ques-sin', $el).carousel(0);
                        $('#ques-sin', $el).carousel('pause');
                    });
                    $('.sin-last', $el).on('click', function () {
                        $('#ques-sin', $el).carousel(_data.length - 1);
                        $('#ques-sin', $el).carousel('pause');
                    });
                }
                if (op.isEditor) {
                    $('.fi-editor', $el).each(function () {
                        var $t = $(this),
                			_value = $t.attr('value'),
                			quesField = $t.attr('data-field'),
                			$obj = $('.fi-ans[data-field=' + quesField + ']', $el);

                        setInterval(function () {
                            var value = $t.attr('value');
                            if (value != _value) {
                                _value = value;
                                $obj.val(_value);
                                $obj.trigger('change');
                            }
                        }, 100);
                    });
                }
            },
            //事件触发
            _eventTrigger: function (type, para1, para2, para3, para4) {
                var t = this,
                    e = $.Event(type);
                t.$element.trigger(e, [para1, para2, para3, para4]);
            },
            //事件启动
            _eventLaunch: function () {
                var t = this,
                    op = t.options,
                    opType = op.type,
                    $el = t.$element;

                if (opType == optionalType.tab) {
                    $('#ques-tab a:first', $el).tab('show');
                }
                else if (opType == optionalType.sin) {
                    $('#ques-sin', $el).carousel({
                        interval: false
                    });
                }
                else if (opType == optionalType.all) {

                }

                if (op.isEditor) {
                    $('.fi-editor', $el).each(function () {
                        var $t = $(this),
                			value = $t.attr('value');
                        $t.editor({
                            data: value,
                            isSync: true
                        });
                    });
                }
            },
            //将首字母转化为大写
            _toFirstUpperCase: function (str) {
                var tip = str.charAt(0);
                return tip.toUpperCase() + str.substr(1);
            },
            _isNullOrEmpty: function (str) {
                if (null == str || str.length < 1) {
                    return true;
                }
                return false;
            },
            //对外接口
            reload: function (para) {
                var t = this,
                    op = t.options;
                if (typeof para == 'object') {
                    op = $.extend({}, op, para);
                }
                t._init();
            },
            getChecked: function () {
                return this.selected;
            },
            getCheckeds: function () {
                var t = this;
                return $.grep(t.data, function (val, index) {
                    if (!t._isNullOrEmpty(val[questionMap.selectedAnswer])) {
                        return true;
                    }
                });
            },
            getunCheckeds: function () {
                var t = this;
                return $.grep(t.data, function (val, index) {
                    if (t._isNullOrEmpty(val[questionMap.selectedAnswer])) {
                        return true;
                    }
                });
            },
            position: function (sort) {
                var t = this,
                    _data = t.data,
                    $el = t.$element,
                    op = t.options,
                    $ques = $('div#ques-' + sort, $el),
                    offtop = $ques.offset().top - 200,
                    sinLength = 0,
                    mulLength = 0,
                    judLength = 0,
                    filLength = 0,
                    shoLength = 0,
                    tabname = '';
                sort = parseInt(sort, 10);
                if (op.type == optionalType.tab) {
                    sinLength = $.grep(_data, function (val, index) {
                        if (val[questionMap.type] == questionType.singleChoice) {
                            return true;
                        }
                    }).length;
                    if (sort <= sinLength) {
                        tabname = 'sin';
                    } else {
                        mulLength = $.grep(_data, function (val, index) {
                            if (val[questionMap.type] == questionType.multiChoice) {
                                return true;
                            }
                        }).length;
                        if (sort <= sinLength + mulLength) {
                            tabname = 'mul';
                        } else {
                            judLength = $.grep(_data, function (val, index) {
                                if (val[questionMap.type] == questionType.judge) {
                                    return true;
                                }
                            }).length;
                            if (sort <= sinLength + mulLength + judLength) {
                                tabname = 'jud';
                            } else {
                                filLength = $.grep(_data, function (val, index) {
                                    if (val[questionMap.type] == questionType.filling) {
                                        return true;
                                    }
                                }).length;
                                if (sort <= sinLength + mulLength + judLength + filLength) {
                                    tabname = 'fil';
                                } else {
                                    shoLength = $.grep(_data, function (val, index) {
                                        if (val[questionMap.type] == questionType.shortAnswer) {
                                            return true;
                                        }
                                    }).length;
                                    if (sort <= sinLength + mulLength + judLength + filLength + shoLength) {
                                        tabname = 'sho';
                                    } else {
                                        tabname = 'gro';
                                    }
                                }
                            }
                        }
                    }
                    $('#ques-tab a[href="#tab-' + tabname + '"]').tab('show');
                    $('html,body').animate({ scrollTop: offtop }, 0);
                }
                else if (op.type == optionalType.all) {
                    $('html,body').animate({ scrollTop: offtop }, 0);
                }
                else if (op.type == optionalType.single) {
                    $('#ques-sin', $el).carousel(sort);
                    $('#ques-sin', $el).carousel('pause');
                }
            }
        };
        $.fn.quesmdl = function (option, para, cb) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('quesmdl'),
                    os = (typeof option == 'string');
                //执行
                if (!data) {
                    var options = $.extend({}, $.fn.quesmdl.defaults, typeof option == 'object' && option);
                    $this.data('quesmdl', (data = new QuesMdl(this, options)));
                }
                else if (!os) {
                    data.options = $.extend({}, data.options, typeof option == 'object' && option);
                    data.reload();
                }
                if (os) {
                    if ($.isFunction(para)) {
                        para(data[option]({}));
                    } else if ($.isFunction(cb)) {
                        cb(data[option](para));
                    } else {
                        data[option](para);
                    }
                }
            });
        };
        $.fn.quesmdl.defaults = {
            css: 'quesmdl',
            para: null,
            //卷面类型（解析类型 可选类型：tab sin all）
            type: 'tab',
            data: null,
            //唯一识别序列
            field: 'sub_id',
            //是否使用富文本编辑器
            isEditor: false,
            //选择题答案排列方式： full整行 half半行 auto自动填充
            choiceArr: 'full'
        };
        //默认参数
        //可供选择的type（解析类型，枚举）
        var optionalType = {
            tab: 'tab',
            all: 'all',
            single: 'sin'
        };
        //可供选择的题目类型（枚举）
        var questionType = {
            singleChoice: 'sin',
            multiChoice: 'mul',
            judge: 'jud',
            filling: 'fil',
            shortAnswer: 'sho',
            //组合题（即套题）
            group: 'gro'
        };
        //默认试题参数解析名（不可配置）
        var questionMap = {
            //类型
            type: 'kind',
            //分数
            score: 'sub_score',
            //序号
            sort: 'sub_sort',
            //题目
            title: 'sub_content',
            //答案(若为套题时，该项可继续填充试题)
            answers: 'items',
            //答案数量
            anawerCount: 'answer_count',
            //已选答案
            selectedAnswer: 'stu_answer'
        };
        //选择题答案的排列方式可选值
        var choiceArrange = {
            full: 'full-line',
            half: 'half-line',
            auto: 'auto'
        };
        //选择编号
        var defaultChoiceNumber = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        //判断编号
        var defaultJudgeNumber = "对错";
        //大题编号
        var defaultQuestionNumber = "一二三四五六七八九";
    }(jQuery);

    /*
     * 测试模型组件
     * @author 刘锦华
     */
    !function ($) {
        var TestMdl = function (element, options) {
            this.options = options;
            this.$element = $(element).addClass(options.css);
            this.data = null;
            this.selected = null;
            //相关组件对象
            this.$testobjs = {};
            this.submitFun = null;
            this.saveFun = null;
            this.timeSync = null;
            this._init();
        };
        TestMdl.prototype = {
            constructor: TestMdl,
            _init: function () {
                var t = this,
                   op = t.options,
                   dataType = typeof op.data;;

                if (dataType == 'object') {
                    t.data = op.data;
                    t._load();
                }
                else if (dataType == 'string') {
                    now.cmd(op.data, op.para, function (ret) {
                        t.data = ret;
                        t._load();
                    });
                }
            },
            _load: function () {
                var t = this,
 					_data = t.data,
 					op = t.options,
 					$el = t.$element,
 					submitRender = op.submitRender,
                    saveRender = op.saveRender,
 					testMap = defaultMap.test,
 					stuMap = defaultMap.student,
 					quesMap = defaultMap.question,
 					questionData = _data[testMap.questions],
 					studentData = _data[testMap.student],
 					html = '';

                html += '<div class="test-con container">';
                html += '<!-- head !-->';
                html += '<div class="test-head">';
                html += '<!-- 考试 标题 -->';
                html += '<div class="test-ti text-info margin-bottom20">';
                html += '<h2>' + _data[testMap.name] + '</h2>';
                html += '</div>';

                if (op.showSta && !t._isNullOrEmpty(_data[testMap.statement])) {
                    html += '<!-- 考试说明 !-->';
                    html += '<div class="margin-bottom20">';
                    html += '<span class="font-bold">考试说明&nbsp;&nbsp;</span>';
                    html += '<span>' + _data[testMap.statement] + '</span>';
                    html += '</div>';
                }

                if (op.showStu || op.isTime || null != op.infoRender) {
                    html += '<!-- 其他信息 !-->';
                    html += '<div class="margin-bottom20">';

                    if (op.showStu && studentData) {
                        html += '<!-- 考生信息 !-->';
                        html += '<div class="stu-info left-zone">';
                        html += '<span>考生：' + studentData[stuMap.name] + '</span>';
                        html += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                        html += '<span>考生号：' + studentData[stuMap.number] + '</span>';
                        html += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                        html += '<span>证件号：' + studentData[stuMap.id] + '</span>';
                        html += '</div>';
                    }

                    if (op.isTime) {
                        html += '<!-- 时间及其他信息 !-->';
                        html += '<div id="test-time" class="right-zone">';
                        html += '</div>';
                    }

                    if (null != op.infoRender) {
                        html += '<!-- infoRender !-->';
                        html += '<div>';
                        if (typeof op.infoRender == 'string') {
                            html += op.infoRender;
                        }
                        else if ($.isFunction(op.infoRender)) {
                            html += op.infoRender(_data);
                        }
                        html += '</div>';
                    }

                    html += '<div class="clearboth"></div>';
                    html += '</div>';
                }

                html += '</div>';
                html += '<!-- body !-->';
                html += '<div class="test-body">';
                html += '<!-- 考题区域 !-->';
                html += '<div id="test-ques" class="left-zone"></div>';
                html += '<!-- 答案区域 !-->';
                html += '<div class="right-zone" id="test-ans-zone">';
                html += '<div id="test-ans"></div>';
                html += '<div class="submit-con">';
                if (op.showSave) {
                    html += '<button class="btn test-save">保存</button>';
                }
                html += '<button class="btn btn-info test-submit">交卷</button>';
                html += '</div>';
                html += '</div>';
                html += '<div class="clearboth"></div>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
                html += '</div>';

                $el.html(html);

                this.$testobjs = {
                    time: $('#test-time', $el),
                    ques: $('#test-ques', $el),
                    ans: $('#test-ans', $el)
                }

                if (null != submitRender) {
                    if ($.isFunction(submitRender)) {
                        t.submitFun = function () {
                            if (null != t.timeSync) {
                                clearInterval(t.timeSync);
                            }
                            submitRender(_data);
                        }
                    }
                    else if (typeof submitRender == 'string') {
                        t.submitFun = function () {
                            if (null != t.timeSync) {
                                clearInterval(t.timeSync);
                            }
                            now.cmd(submitRender, _data, function (ret) {
                            });
                        }
                    }
                }
                else {
                    t.submitFun = function () {
                        if (null != t.timeSync) {
                            clearInterval(t.timeSync);
                        }
                    };
                }

                if (null != saveRender) {
                    if ($.isFunction(saveRender)) {
                        t.saveFun = function () {
                            if (null != t.timeSync) {
                                clearInterval(t.timeSync);
                            }
                            saveRender(_data);
                        }
                    }
                    else if (typeof saveRender == 'string') {
                        t.saveFun = function () {
                            if (null != t.timeSync) {
                                clearInterval(t.timeSync);
                            }
                            now.cmd(saveRender, _data, function (ret) {
                            });
                        }
                    }
                }
                else {
                    t.saveFun = function () {
                        if (null != t.timeSync) {
                            clearInterval(t.timeSync);
                        }
                    };
                }

                t._eventLaunch();
                t._eventBind();
            },
            _eventBind: function () {
                var t = this,
     				$el = t.$element,
     				$objs = t.$testobjs,
     				quesMap = defaultMap.question,
     				op = t.options,
     				quesField = op.questionField,
     				_data = t.data,
     				$ans = $objs.ans,
     				$ques = $objs.ques,
     				$time = $objs.time,
					topT = $time.offset().top,
					fixedElement = null,
					unfixedElement = null;

                $('.test-save', $el).on('click', function () {
                    $time.timecnt('save');
                });

                $('.test-submit', $el).on('click', function () {
                    $time.timecnt('submit');
                });

                $ans.on('select', function (event, index, node) {
                    $ques.quesmdl('position', node[quesMap.sort]);
                });

                $ques.on('check', function (event, node) {
                    $ans.answercard('setSelected', node[quesField]);
                });

                $ques.on('uncheck', function (event, node) {
                    $ans.answercard('setunSelected', node[quesField]);
                });

                fixedElement = function ($em, offTop) {
                    var offLeft = $em.offset().left;
                    $em.css({ 'position': 'fixed', 'top': (offTop > 0 ? offTop : 0) + 'px', 'left': offLeft + 'px' });
                }

                unfixedElement = function ($em) {
                    $em.css({ 'position': 'static' });
                }

                $(window).on('scroll', function () {
                    var scrolTop = $(document).scrollTop(),
 						bottomEl = $el.offset().top + $el.height() - 300;

                    if (scrolTop >= topT && scrolTop <= bottomEl) {
                        fixedElement($time, 50);
                        fixedElement($('#test-ans-zone', $el), 108);
                    }
                    else {
                        unfixedElement($time);
                        unfixedElement($('#test-ans-zone', $el));
                    }
                });

                t._eventInterval();
            },
            _eventTrigger: function (type, para1, para2, para3, para4) {
                var t = this,
                    e = $.Event(type);
                t.$element.trigger(e, [para1, para2, para3, para4]);
            },
            _eventLaunch: function () {
                var t = this,
            		op = t.options,
            		_data = t.data,
            		$objs = t.$testobjs,
            		testMap = defaultMap.test,
            		quesMap = defaultMap.question,
            		quesField = op.questionField,
            		quesData = _data[testMap.questions],
            		ansData = [],
            		ans = {};

                $objs.ques.quesmdl({
                    css: op.quesCss,
                    type: op.type,
                    data: quesData,
                    field: quesField,
                    isEditor: op.isEditor,
                    choiceArr: op.choiceArr
                });

                $.each(quesData, function (index, ques) {
                    ans = {
                        'selected': !t._isNullOrEmpty(ques[quesMap.selectedAnswer])
                    }
                    ans[quesMap.sort] = ques[quesMap.sort];
                    ans[quesField] = ques[quesField];
                    ansData.push(ans);
                });

                $objs.ans.answercard({
                    css: op.ansCss,
                    data: ansData,
                    field: quesField,
                    render: quesMap.sort
                });

                if (op.isTime) {
                    $objs.time.timecnt({
                        css: op.timeCss,
                        data: _data[testMap.time],
                        auto: op.auto,
                        submitRender: t.submitFun,
                        saveRender: t.saveFun
                    });
                }
            },
            _eventInterval: function () {
                var t = this,
        			_data = t.data,
        			op = t.options,
        			$objs = t.$testobjs,
        			$time = $objs.time;
                if (op.isTime) {
                    t.timeSync = setInterval(function () {
                        $time.timecnt('getLastTime', 'm', function (time) {
                            _data[defaultMap.test.time] = time;
                        });
                    }, 1000);
                }
            },
            _isNullOrEmpty: function (str) {
                if (null == str || undefined == str || str.length < 1) {
                    return true;
                }
                else {
                    return false;
                }
            },
            //对外接口
            reload: function (para) {
                var t = this,
   					op = t.options;
                if (para && typeof para == 'object') {
                    op = $.extend({}, op, para);
                }
                t._init();
            },
            getSelected: function () {
                return this.selected;
            },
            save: function () {
                var t = this,
 				$objs = t.$testobjs;
                $objs.time.timecnt('save');
            },
            submit: function () {
                var t = this,
 				$objs = t.$testobjs;
                $objs.time.timecnt('submit');
            },
            stop: function () {
                var t = this,
 				$objs = t.$testobjs;
                if (t.timeSync) {
                    clearInterval(t.timeSync);
                }
                $objs.time.timecnt('stop');
            },
            getSelecteds: function () {
                var $objs = this.$testobjs;
                return $objs.ques.quesmdl('getSelecteds');
            },
            getunSelecteds: function () {
                var $objs = this.$testobjs;
                return $objs.ques.quesmdl('getunSelecteds');
            },
            getData: function () {
                return this.data;
            },
            start: function () {
                var t = this,
 				$objs = t.$testobjs;
                t._eventInterval();
                $objs.time.timecnt('start');
            }
        };
        $.fn.testmdl = function (option, para, cb) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('testmdl'),
                    os = (typeof option == 'string');

                //执行
                if (!data) {
                    var options = $.extend({}, $.fn.testmdl.defaults, typeof option == 'object' && option);
                    $this.data('testmdl', (data = new TestMdl(this, options)));
                }
                else if (!os) {
                    data.options = $.extend({}, data.options, typeof option == 'object' && option);
                    data.reload();
                }
                if (os) {
                    if ($.isFunction(para)) {
                        para(data[option]({}));
                    } else if ($.isFunction(cb)) {
                        cb(data[option](para));
                    } else {
                        data[option](para);
                    }
                }
            });
        };
        $.fn.testmdl.defaults = {
            css: 'testmdl',
            quesCss: 'quesmdl',
            timeCss: 'timecnt',
            ansCss: 'answercard',
            //试卷显示类型
            type: 'tab',
            data: null,
            para: null,
            saveRender: null,
            submitRender: null,
            //显示保存按钮
            showSave: true,
            //显示考试说明
            showSta: true,
            //显示学生信息
            showStu: true,
            //是否计时
            isTime: true,
            //输入框是否采用富文本编辑器
            isEditor: false,
            //考题唯一识别字段
            questionField: 'sub_id',
            //是否自动开始计时
            auto: true,
            //其余信息扩展
            infoRender: null,
            //选择题答案排列方式： full整行 half半行 auto自动填充
            choiceArr: 'full'
        };
        var defaultMap = {
            test: {
                name: 'te_name',
                //考试说明
                statement: 'te_stam',
                time: 'te_time',
                questions: 'subs_total',
                student: "subs_stu"
            },
            student: {
                name: 'stu_name',
                //考生号
                number: 'stu_num',
                //身份证号
                id: 'stu_id'
            },
            //问题相关信息
            question: {
                type: 'kind',
                score: 'sub_score',
                //序号
                sort: 'sub_sort',
                //题目
                title: 'sub_content',
                //答案
                answers: 'items',
                anawerCount: 'answer_count',
                //已选答案
                selectedAnswer: 'stu_answer'
            }
        };
    }(jQuery);

});