define(function (require) {
    "use strict";
    var sys = require('sys'),
        N = require('now');



    var Cygl = function () {
    	
    };

    Cygl.prototype = {
        constructor: Cygl,

        /**
         * 公益成员管理
         * @author zxh
         */
        cygl : function () {
        	$('#divMain').tpl('main/cygl/gylist', {}, function (resp) {
                // 定义变量
                var $queryMember = $("#queryMember");
                var $memberList = $("#memberList");
                var $mdfMember = $("#mdfMember");
                var $mdfApply = $("#mdfApply");
                var $member_id = ''; //  定义Id
                var $msg = ""; // 定义消息
                var $is_first_load = true; // 是否第一次加载
                var editorOp = {
                		minWidth: 300,
                        resizeType: 1,
                        allowPreviewEmoticons: false,
                        allowImageUpload: true,
                        allowImageRemote : false,
                        uploadJson: './upload/single?kind=editor',
                        themesPath: N.cfg.nowjs + 'kindeditor/themes/',
                        cssData: 'body {font-size: 14px;font-family:"Microsoft YaHei";}',  // 设置默认字体大小14px，微软雅黑
                        items: [
                            'source', 'fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold', 'italic', 'underline',
                            'removeformat', '|', 'justifyleft', 'justifycenter', 'justifyright' , '|',  'image',  'link']
            	};

        		// 条件搜索
                $queryMember.quickfrm({
        			fields:[
        			        {name:'name', text:'机构名称:', id:'name', type:'text'}
        			        ],
			        direct: 'h',
                    submit: '搜索'
        		}).on('valOk', function(event, para){
        			// 成员列表重载
                    $memberList.grid({nowPage: 1,para:para}).grid('reload');
        		});
                
                // 修改申请时间
                var _to_format = function(regTime) {
                	var curDate = new Date();
                	var now = !regTime ? curDate : regTime;
                	var year = now.getFullYear();
                    var month =  now.getMonth() + 1;
                    var day =  now.getDate();
                    
                    return (year+'-'+month+'-'+day);
                };
        		
        		// 公益成员列表
                $memberList.grid({
                	fid:'topic_id',
                	data:'/member/getlist',
                	pagesize:15,
                	row:false,
                	para:{name:''},
                	fields:[
							{head: '机构名称', name: 'name'},
							{head: '联系人', name: 'contact'},
                	        {head:'电话', name:'tel'},
							{head: '管理员账号', name: 'account'},
                	        {head:'状态', name:'status', render:function(colValue) {
                	        	if (parseInt(colValue) === 0) {
                	        		return "审核中";
                	        	} else if(parseInt(colValue) === 1) {
                	        		return "审核通过";
                	        	} else {
                	        		return "审核不通过";
                	        	}
                	        }},
                	        {head:'申请日期', name:'regTime', render:function(colValue){
                	        	return N.timeStr(colValue, true);
                	        }},
                	        {head:'操作', name:'memberId', render:function(colValue, colDate){
                	        	return N.getLinkStr({
                                    '修改' : [' edit ', {member_id:colValue}],
                                    '删除' : [' del ', {member_id:colValue}],
                                    '应用管理' : [' apply ', {member_id:colValue}]
                                });
                	        }}
                	       ]
                }).on('click', 'a.edit', function(){
                	var member_id = $(this).attr('member_id');
                	N.cmd('/member/get', {memberid:member_id}, function(rowData){
                		rowData = $.extend({}, rowData.o);
                		//console.log(rowData);
                        $mdfMember.frm('clear').frm({
                        	title:'修改成员',
	                		cmd:'/member/update',
	                		para:{memberid:member_id}
	                	}).frm('fill',
	                			{tbl:'member', data:rowData}
	                	).css('top', 10).modal('show');
                        $mdfMember.find('.modal-header h3').text('修改成员');
                        setTimeout(function() { $(document).off('focusin.modal'); }, 250);
                        
                        // 状态
                        _changeApplyStatus($('#applyStatus'));
                        
                        // 申请时间
                        $('#applyDate').html(_to_format(new Date(rowData.regTime * 1000)));
                        
                        // 成立时间
                        if (parseInt(rowData.sinceTime) > 0) {
                        	$('#sinceTime').val(_to_format(new Date(rowData.sinceTime * 1000)));
                        } else {
                        	$('#sinceTime').val('');
                        }
                        
                        // 管理员账号和对应uc单位处理
                        $('#unitCodeId').html('');
                        if (rowData.account.length > 0) {
                        	$('#unitName').attr('readonly', true);
                        	$('#applyAccount').attr('readonly', true);
                        	$('#unitCodeId').html('<option value="'+rowData.unitCode+'">'+rowData.name+'</option>');
                        	$('#unitCodeId').attr('readonly', true);
                        } else {
                        	$('#unitName').attr('readonly', false);
                            $('#applyAccount').attr('readonly', false);
                            $('#unitCodeId').attr('readonly', false);
                        	$('#unitCodeId').html('');
                        }

                        // 添加数据
                        $('#wzglPicAddPreview').html('');
                        if (rowData.picPath !== '') {
                            //var new_path = N.cfg.index + rowData.picPath;
                            $('#wzglPicAddPreview').html('<img style="max-width:200px;max-height:200px;" src="'+rowData.picPath+'" />');
                            $('#tpicPath').val(rowData.picPath);
                        }
                        
                        $msg = "修改成功";
                	});
                }).on('click', 'a.del', function(){
                    var member_id = $(this).attr('member_id');
                    $.confirm('确定删除该公益成员？', function() {
                        N.cmd('/member/delete', {memberid:member_id}, function(){
                            $.actMsg('提示信息', '删除成功');
                            // 成员列表重载
                            $memberList.grid('reload');
                        }, '温馨提示');
                    });

                }).on('click', 'a.apply', function(){ // 编辑公益应用
                	var member_id = $(this).attr('member_id');
                	$member_id = member_id;
                	if ($member_id.length > 0) {
                		_load_member(); // 加载当前成员机构的应用列表
                	}
                });
                
                // 编辑应用管理
                $mdfApply.quickfrm({
                	title:'公益应用',
                	fileds:[],
                	dialog:true,
                	submit:'保存',
                	enter:false,
                    scroll:true,
                	otherCss:'ul-quickform xxxlong-label'
                }).on('cmdOk', function(){
                	$mdfApply.modal('hide');
                	$.actMsg('提示信息', '保存成功');
                });
                
                // 提交应用
            	$('#mdfApply #__submit1').on('click', function() {
            		var applyArr = [];
            		$('#mdfApply .modal-body table tbody').find('input[type=checkbox]').each(function(){
            			if ($(this).is(":checked")) {
            				var curId = $(this).parent().parent().attr('id');
            				applyArr.push(curId);
            			}
            		});
            		var result = applyArr.length > 0 ? applyArr.join(',') : '';
            		console.log('current：' + $member_id);
            		N.cmd('/member/saveApply', {memberid:$member_id, code:result}, function(){
            			$mdfApply.modal('hide');
                    	$.actMsg('提示信息', '保存成功');
            		});
            	});
                
                // 新增公益成员
                $mdfMember.quickfrm({
                	title:'新增成员',
                	fields:[
	                        {name: "member[name]",  text: "机构名称：", id:"unitName", must: true, check:"must  str-1-50"},
	                        {name: "member[contact]",  text: "联系人：", must: true, check:"must  str-1-30"},
	                        {name: "member[tel]",  text: "电话：", must: true, check:"must  tel str-1-13"},
	                        {name: "member[email]",  text: "E_mail：", must: true,  check:"mail str-0-50"},
	                        {name: "member[orgName]",  text: "主管单位：", check:"str-0-50"},
	                        {name: "member[sinceTime]",  text: "成立时间：", attr: {readonly: true},  id:"sinceTime", nui: {
	                            datepick: {clear:true}
	                        }},
	                        {name: "member[regNo]",  text: "登记证号：",  check:"str-0-30"},
	                        {name: "member[orgNo]",  text: "组织机构代码：",  check:"str-0-30"},
	                        {name: "member[corporate]", text: "法人代表：", check:"str-0-10"},
	                        {name: "member[domain]",  text: "网站域名：",  check:"url str-0-64"},
	                        {name: "member[business]",  text: "业务范围：",  check:"str-0-100"},
	                        {name: "member[addr]",  text: "机构地址：", check:"str-0-100"},
	                        {text: "申请日期：", type:"div", id:"applyDate"},
	                        {name: "member[status]",  text: "状态：", type: "select", id:"applyStatus", selectData: {"0": "审核中", "1": "审核通过", "2":"审核不通过"},must: true, val:"1"},
	                        {name: "member[account]",  text: "管理员账号：", id:"applyAccount",  check:"str-0-20"},
	                        {name: "member[unitCode]",  text: "对应UC单位：", id:"unitCodeId", type:"select"},
	                        {text: "机构logo：", id: "wzglPicAdd", type: "div", nui: {
	                            upload:{
                                    fileExt: '*.jpg;*.png;*.gif;*.jpeg',
	                                fieldName:'file',
                                    fileSize : 2048,
	                                frmName: 'tpicAdd',
	                                uploadUrl: N.cfg.index + '/upload/single?kind=member_pic'
	                            }
	                        }},
	                        {text: "预览：", id: 'wzglPicAddPreview', type: 'div', val: '---'},
	                        {name: "member[orgDesc]", text: '机构介绍：', id:'topicContent',  type: 'textarea', check:"str-0-65000",  nui:{
                                editor : {width:420, height:250, keOpt: editorOp, pastePicJson:{cmd:'/upload/single',kind:'editor'}}}
                            },
                            {name: "member[appDesc]", text: 'APP使用介绍：', id:'topicContent1',  type: 'textarea', check:"str-0-65000",  nui:{
                                editor : {width:420, height:250, keOpt: editorOp, pastePicJson:{cmd:'/upload/single',kind:'editor'}}}
                            },
	                        {name: "member[picPath]",  id:'tpicPath', type:'hidden', text:''},
                            {name: "member[preUnit]",  id:'tpreUnit', type:'hidden', text:''}
                	        ],
                    cmd:'/member/add',
                	dialog:true,
                	submit:'保存',
                	enter:false,
                    scroll:true,
                	otherCss:'ul-quickform xxxlong-label'
                }).on('cmdOk', function(){
                	$mdfMember.modal('hide');
                	$.actMsg('提示信息', $msg);
                	// 成员列表重载
                    $memberList.grid('reload');
                });
                
                var _changeApplyStatus = function(obj) { // 执行联动事件
                	var aStatus = parseInt(obj.val());
                	var aFlag = ['applyAccount', 'wzglPicAdd', 'topicContent', 'topicContent1'];
                	for(var i=0; i<aFlag.length; i++) {   
                		$('#'+aFlag[i]).parent().parent().find('label').find('.m-s-apply').remove();
	                	if (aStatus === 1) {
	                		var cHtml = $('#'+aFlag[i]).parent().parent().find('label').html();
	                		$('#'+aFlag[i]).parent().parent().find('label').html(cHtml + '<span class="field-must m-s-apply">*</span>');
	                	} else {
	                		$('.m-s-apply').remove();
	                	}
                	}
                };
                
                // 审核选择联动事件
                _changeApplyStatus($('#applyStatus'));
                $('#applyStatus').change(function() {
                	_changeApplyStatus($(this));
                });
                
                // 管理员账号填写
                $('#applyAccount').keyup(function() {
                	N.cmd('/member/getUserApply', {account:$('#applyAccount').val()}, function(ret) {
                		if (ret.s === true) {
                			ret.o = eval("(" + ret.o + ")");
                			var result = new Array();
                			var Html = '';
                			if (ret.o) {
	                			for(var i=0; i<ret.o.length; i++) {
	                				if (i === 0) {
	                					$('#tpreUnit').val(ret.o[i].full_name);
	                				}
	                				Html += '<option value="'+ret.o[i].name+'">'+ret.o[i].full_name+'</option>';
	                				result[ret.o[i].name] = ret.o[i].full_name;
	                				
	                			}
                			}
                			$('#unitCodeId').html(Html);
                			//$('#unitCodeId').sltFill(result);
                			console.log(result);
                			//stepSlt.sltFill(stepData).val(curStep).trigger("change");
                		}
                	});
                	
                	$('#unitCodeId').change(function() {
                		$('#tpreUnit').val($(this).text());
                	});
                	
                });
                
                // 时间填充
                $('#applyDate').html(_to_format(false));

                // 图片上传回调
                $('#wzglPicAdd').on('uploadOk', function(event, resp){
                    //var new_path = N.cfg.index + resp.o.path;
                    $('#wzglPicAddPreview').html('<img style="max-width:200px;max-height:200px;" src="'+resp.o.path+'" />');
                    $('#tpicPath').val(resp.o.path);
                    _run_del("#tpicPath", "#wzglPicAddPreview");
                });

                // 文本内容编辑
                $('#topicContent #topicContent1').css({width:300});

                
                // 触发新增成员方法
                $('#btnAddMember').on('click', function(){
                	$mdfMember.frm('clear').frm({
                			cmd:'/member/add',
                			para:{}
                	}).css('top', 10).modal('show');
                	$mdfMember.find('.modal-header h3').text('新增成员');
                    $('#wzglPicAddPreview').html('---');
                    $('#wzglAppendAddPreview').html('---');
                    $('#unitName').attr('readonly', false);
                    $('#applyAccount').attr('readonly', false);
                    $('#unitCodeId').attr('readonly', false);
                	$('#unitCodeId').html('');
                	$msg = "新增成功";
                    setTimeout(function() { $(document).off('focusin.modal'); }, 250);
                });
                
                // 删除图片方法
                var _run_del = function(savePath, showPath) {
                	$('.upload-close').on('click', function(){
                		$(savePath).val('');
                		$(showPath).html('---');
                	});
                };
                
                var _load_member = function(){ // 加载应用列表
                	$mdfApply.frm('clear').frm({
                	}).css('top', 10).modal('show');
                	$('#mdfApply .modal-body').grid({
                    	fid:'member_app_id',
                    	row:false,
                    	data:'/member/getlist',
                    	size:-1, // 不分页
                    	para:{memberid:$member_id},
                    	fields:[
                    	        {head:'服务名称', name:'name'},
                    	        {head:'开通状态', name:'status'}
                    	       ]
                    });
                	if ($is_first_load) { // 第一次加载
                		$('#mdfApply .modal-body').on('reloadOk', function() {
                			_run_load();
                			$is_first_load = false;
                		});
                	} else {
                		_run_load();
                	}
                	
                };
                
                var _run_load = function(){
                	var _bind_check = function(curCheck) { // 绑定checkbox事件
            			var status = curCheck === 0 ? true : false;
            			$('#mdfApply .modal-body .table tr').find('input[type=checkbox]').attr('checked', status);
            			$('#curCheck').val(curCheck === 0 ? 1 : 0);
                	};
                	
                	var _run_app_member = function() { // 获取当前成员机构的应用
                		N.cmd('/member/getApply', {memberid:$member_id}, function(ret) {
                			if (ret.o === null) {
                				// 初始化设置
                            	$('#sNum').text(0);
                            	_bind_check(1);
                            	$('#curCheck').val(0);
                			} else {
                				var info = ret.o;
                				_bind_check(1);
                				var applyArrs = ret.o.code.length > 0 ? (ret.o.code).split(',') : [];
                				$('#sNum').text(applyArrs.length);
                				if (applyArrs.length > 0) {
                					for(var j=0; j< applyArrs.length; j++) {
                						$('#mdfApply .modal-body .table tr[id='+applyArrs[j]+']').find('input[type=checkbox]').attr('checked', true);
                					}
                				}
                			}
	                	});
                	};
                	
                	var _before_handle = function() { // 加载后的视图
                		if ($('#mdfApply .modal-body .pagination').length > 0) {
                    		$('#mdfApply .modal-body .pagination').remove();
                    	}
                		var _all_check = $('#mdfApply .modal-body .table th:eq(1)').html();
                		if ($('#sTip').length <= 0) {
                			$('#mdfApply .modal-body').before('<div id="sTip" style="margin-left:19px;margin-top:10px; font-size:18px; color:black; font-weight:blod;">当前已经开通了<span style="color:red;" id="sNum">0</span>个服务</div>');
                		}
                		if ($('#allCheck').length <= 0) {
                			$('#mdfApply .modal-body .table th:eq(1)').html('<input type="checkbox" id="allCheck" /><input type="hidden" id="curCheck" value="0">' + _all_check);
                		}
                		if ($is_first_load) {
	                		$('#allCheck').on('click' , function(){
	                			_bind_check(parseInt($('#curCheck').val()));
	                		});
                		}
                		
                	};
                	
                	_before_handle(); // 加载后更新视图 删除分页 增加checkbox
                	
                	N.cmd('/member/applyList', {}, function(ret) { // 获取应用列表
                		var aData = ret.o, 
                			applyHtml = '';
                		for(var i=0; i< aData.length; i++) {
                			applyHtml += '<tr id="'+aData[i]['code']+'">';
                			applyHtml += '<td>'+aData[i]['name']+'</td>';
                			applyHtml += '<td><input type="checkbox" /></td>';
                			applyHtml += '</tr>';
                		}
                		$('#mdfApply .modal-body .table tbody').html(applyHtml);
                		_run_app_member(); // 获取当前成员应用
                	});
                };
            });

        }
    }

    return new Cygl();
});