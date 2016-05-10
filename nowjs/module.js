!function ($) {
    'use strict';

    var _mdl = {
            nowjs: ['now', 'nui', 'ubb2', 'md5', 'socketio'],
            nowPath: './nowjs/',
            jsPath: '/',
            jsExt: '.js',
            module: {},
            cache: {},
            stack: []
        },
        _getUrl = function (name) {
            var i;
            for (i = 0; i < _mdl.nowjs.length; i++) {
                if (_mdl.nowjs[i] === name) {
                    return _mdl.nowPath + name + _mdl.jsExt;
                }
            }

            return _mdl.jsPath + name + _mdl.jsExt;
        },

        setup = function (jsPath, defMdl, nowPath) {
            _mdl.jsPath = jsPath;
            if(nowPath){
                _mdl.nowPath = nowPath;
            }
            if ($.isArray(defMdl)) {
                $.each(defMdl, function (idx, mdl) {
                    require(mdl);
                });
            }
        },

        require = function (name) {
            if (!_mdl.cache[name]) {
                _mdl.stack.push(name);
                $.ajax({
                    url: _getUrl(name),
                    async: false,
                    dataType: 'script',
                    error: function (jqxhr, status, thrown) {
                        window.console.log(jqxhr);
                    }
                });
            }
            return _mdl.module[name];
        },

        define = function (cb, js_ext) {
            if (js_ext === '.min') {
                _mdl.jsExt = '.min.js';
            }
            var exports = {};
            var ret = cb(require, exports), _name = _mdl.stack.pop();
            if (ret !== undefined) {
                _mdl.module[_name] = ret;
            }else {
                _mdl.module[_name] = exports;
            }
            _mdl.cache[_name] = 1;
        };

    window.define = define;
    window.setup = setup;
    if(window._mdlNowPath !== undefined){
        _mdl.nowPath = window._mdlNowPath;
    }
    if (!window.console) {
        window.console = {
            log: function (msg) {
            }
        };
    }

}(jQuery);