define(function (require) {
    "use strict";
    var sys = require('sys'),
        N = require('now');



    var Dwxx = function () {
    	
    };

    Dwxx.prototype = {
        constructor: Dwxx,

        /**
         * 单位信息
         * @author zxh
         */
        dwxx : function () {
        	var self = this;
        	$('#divMain').tpl('main/dwxx/dwlist', {_c:'/member/getunit'}, function (ret) {
        		ret = $.extend({}, ret.o);
        		//修改学校信息表单
                $('#unitFrm').quickfrm({
                    fields: [
                        {name: 'name',  text: '单位名称：', must: true},
                        {name: 'appDesc',  text: '单位描述：', type: 'textarea'},
                        {name: 'addr',  text: '详细地址：'},
                        {name: 'memberId', type:'hidden', text:''}
                    ],
                    submit: '保存',
                    submitCss: 'btn-long',
                    otherCss: 'xxxlong-label',
                    scroll: true,
                    enter: false
                }).frm({
                        cmd: '/member/updateunit',
                        para: {}
                    }).frm('fill',{
                        tbl: '', data: ret
                    }).on('cmdOk', function () {
                        self.dwxx();
                        // 修改当前教学点名称
//                        var unitName = $.trim($('#unitFrm input[name="unit[name]"]').val());
//                        $('#userName').html(unitName);
                        $.actMsg('提示', '修改成功');
                    });
        	});
        }
    }
    return new Dwxx();
});