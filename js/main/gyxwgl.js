define(function (require) {
    "use strict";
    var sys = require('sys');
    var now = require('now');

    var Gyxwgl = function () {
        this.type = 2;
        this.name = '公益新闻';
        this.mode = 'add';
        this.topicStatus = {
            "0": "下线",
            "1": "上线"
        };
        this.editorOp = {
            minWidth: 300,
            resizeType: 1,
            allowPreviewEmoticons: false,
            allowImageUpload: true,
            allowImageRemote: false,
            uploadJson: './upload/single?kind=editor',
            themesPath: now.cfg.nowjs + 'kindeditor/themes/',
            cssData: 'body {font-size: 14px;font-family:"Microsoft YaHei";}',  // 设置默认字体大小14px，微软雅黑
            items: [
                'source', 'fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold', 'italic', 'underline',
                'removeformat', '|', 'justifyleft', 'justifycenter', 'justifyright', '|', 'image', 'link']
        };
    };

    Gyxwgl.prototype = {
        constructor: Gyxwgl,

        /**
         * 公益新闻管理
         *
         * @author zlt
         */
        gyxwgl: function () {
            var self = this;
            $('#divMain').tpl('main/xwgl/xwgl', {}, function () {
                var grid = $('#topicGrid');
                var frm = $('#topicFrm');

                grid.grid({
                    fid: 'topicId',
                    data: '/topic/list',
                    para: {type: self.type},
                    fields: [
                        {head: '标题', name: 'title'},
                        {head: '发布时间', name: 'addTime', render:function(colValue){
                        	return now.timeStr(colValue, true);
                        }},
                        {
                            head: '状态', name: 'status', render: function (colValue, rowData, rowIndex) {
                            return self.topicStatus[colValue];
                        }
                        },
                        {
                            head: '操作', name: 'topicId', render: function (colValue, rowData, rowIdx) {
                            var html = now.getLinkStr({'修改': ['mdf', {topicId: colValue}]});
                            html += now.getLinkStr({'删除': ['del', {topicId: colValue}]});
                            return html;
                        }
                        }
                    ]
                }).on('click', 'a.mdf', function (event, data) {
                    var topicId = $(this).attr('topicId');
                    grid.grid('getRow', topicId, function (rowData) {
                        var dataCopy = $.extend({}, rowData);
                        dataCopy.add_time = now.timeStr(dataCopy.addTime, true);
                        self.mode = 'mdf';
                        frm.find('.modal-header h3').html('修改' + self.name);
                        frm.frm({cmd: '/topic/mdf', para: {'topic[type]': self.type, 'topic[topic_id]': topicId}});
                        frm.frm('clear');
                        frm.frm('fill', {data: dataCopy, tbl: 'topic'});
                        frm.frm('fill', {data: dataCopy, tbl: 'topic_detail'});
                        setPic(rowData.tpic);
                        frm.modal('show');
                    });
                }).on('click', 'a.del', function (event, data) {
                    var topicId = $(this).attr('topicId');
                    $.confirm('确定要删除这个' + self.name + '吗?', function () {
                        sys.cmd('/topic/del', {topic_id: topicId}, function (ret) {
                            $.actMsg('删除成功! ');
                            grid.grid('reload');
                        })
                    }, '删除确认');
                });

                //弹窗初始化
                frm.quickfrm({
                    title: '新增' + self.name,
                    fields: [
                        {text: '标题：', name: 'topic[title]', must: true, check: 'must str-2-100'},
                        {
                            text: '首页图片：', id: 'picPath', type: 'div', nui: {
                            upload: {
                                fileExt: '*.jpg;*.png;*.gif;*.jpeg;',
                                fieldName: 'file',
                                fileSize: 2048,
                                frmName: 'tpicAdd',
                                uploadUrl: now.cfg.index + '/upload/single?kind=news_pic'
                            }
                        }
                        },
                        {text: '', id: 'picPathShow', type: 'div', val: ''},
                        {text: '来源：', name: 'topic[publisher]', type: 'text', check: 'str-0-30'},
                        {
                            text: '发布时间：', name: 'topic[add_time]', must: true, check: 'must date', nui: {
                            datepick: {}
                        }
                        },
                        {text: '概述：', name: 'topic[summary]', must: true, type: 'textarea', check: 'must str-0-100'},
                        {
                            text: '详细内容：', name: 'topic_detail[content]', id: 'topicContent', type: 'textarea', must: true, check: 'must str-5-65000', nui: {
                            editor: {width: 420, height: 250, keOpt: self.editorOp, pastePicJson: {cmd: '/upload/single', kind: 'editor'}}
                        }
                        },
                        {text: '状态：', name: 'topic[status]', must: true, type: 'select', selectData: self.topicStatus, val: '1', check: 'must int-0-1'},
                        {text: '', name: 'topic[tpic]', id: 'tpicPath', type: 'hidden'}
                    ],
                    cmd: '/topic/add',
                    para: {'topic[type]': self.type},
                    dialog: true,
                    submit: '保存',
                    enter: false,
                    scroll: true,
                    otherCss: 'ul-quickform xlong-label',
                    width: 650,
                    maxHeight: 500
                }).on('cmdOk', function () {
                    frm.modal('hide');
                    var msg = '';
                    if (self.mode === 'add') {
                        msg = '新增' + self.name + '成功';
                    }
                    if (self.mode === 'mdf') {
                        msg = '修改' + self.name + '成功';
                    }
                    $.actMsg('提示信息', msg);
                    // 新闻列表重载
                    grid.grid('reload');
                }).on('shown', function () {
                    $(document).off('focusin.modal');
                });

                var tpicPath = $('#tpicPath');
                var picPathShow = $('#picPathShow');

                //新增按钮
                $('#btnAddTopic').on('click', function (event, data) {
                	var myDate = new Date();
                	var mytime = myDate.getTime()/1000;
                	var rowData = {
                		add_time:now.timeStr(mytime, true)
                	};
                    self.mode = 'add';
                    frm.find('.modal-header h3').html('新增' + self.name);
                    frm.frm({cmd: '/topic/add', para: {'topic[type]': self.type}});
                    setPic('');
                    frm.frm('clear');
                    frm.frm('fill', {data: rowData, tbl: 'topic'});
                    frm.modal('show');
                });

                // 图片上传回调
                $('#picPath').on('uploadOk', function (event, resp) {
                    setPic(resp.o.path);
                }).on('click', '.upload-close', function () {
                    setPic('');
                });

                function setPic(picPath) {
                    var new_path = picPath;
                    tpicPath.val(new_path);
                    if (new_path !== '') {
                        picPathShow.html('<img style="max-height:100px;max-width:200px;" src="' + new_path + '">');
                    } else {
                        picPathShow.html('');
                    }
                }
            });
        }
    };

    return new Gyxwgl();
});