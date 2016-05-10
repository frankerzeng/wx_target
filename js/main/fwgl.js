define(function (require) {
    "use strict";
    var sys = require('sys'),
        N = require('now');



    var Fwgl = function () {
    	
    };

    Fwgl.prototype = {
        constructor: Fwgl,

        /**
         * 服务管理
         * @author zxh
         */
        fwgl : function () {
        	$('#divMain').tpl('main/fwgl/fwlist', {}, function (ret) {
        	    var jqServiceGrid = $("#serviceGrid"),
        	        jqTopTip = $("#topTip");

        	    
        	    jqServiceGrid.grid({
                    fid:'code',
                    row:false,
                    para:{},
                    fields:[
                        {head: '服务名称', name: 'name'},
                        {head:'操作', name:'code', render:function(colValue, colDate){
                            return N.getLinkStr({
                                '管理' : [' manage ', {code:colValue}]
                            });
                        }}
                    ],
                    pagesize : 15,
                    listKey : "rows"
                }).on('click', 'a.manage', function() {
                    var code = $(this).attr("code");
                    sys.cmd("/sdp/" + code, {}, function(ret) {
                        $("#openWin").attr("action",ret.o.requestUrl).submit();
                    });
                });
        	    
        	    sys.cmd('/sdp/apps',{},function(ret){
        	        jqTopTip.find("span").text(ret.o.rows.length);
        	        jqServiceGrid.grid({data:ret.o.rows}).grid("reload");
                });
            });
        }
    }
    return new Fwgl();
});