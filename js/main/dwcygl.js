define(function (require) {
    "use strict";
    var sys = require('sys'),
        N = require('now');



    var Dwcygl = function () {
    	
    };

    Dwcygl.prototype = {
        constructor: Dwcygl,

        /**
         * 成员管理
         * @author zxh
         */
        dwcygl : function () {
        	$('#divMain').tpl('main/dwcygl/cylist', {}, function (ret) {
        		
        	});
        }
    }
    return new Dwcygl();
});