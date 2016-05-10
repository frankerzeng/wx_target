!function ($) {
    "use strict";
    var Uitest = function () {
        this._init();
        this.code = [];
        this.isStart = false;
        this.isQuickMode = true;
    };
    Uitest.prototype = {
        constructor: Uitest, _init: function () {
            var self = this;
            $(document).on('click', 'a', function(){
                if (self.isStart && self._notInExclude($(this))){
                    var qid = self.isQuickMode?self._getQuickFormId($(this)):'';
                    if (qid!==''){
                        return;
                    }

                    self._click($(this));
                }
            }).on('click', 'button', function(){
                if (self.isStart && self._notInExclude($(this))){
                    var qid = self.isQuickMode?self._getQuickFormId($(this)):'';
                    if (qid!==''){
                        self._setQuickForm(qid);
                    }else{
                        self._click($(this));
                    }
                }
            }).on('blur', 'input', function(){
                if (self.isStart && self._notInExclude($(this))){
                    var qid = self.isQuickMode?self._getQuickFormId($(this)):'';
                    if (qid!==''){
                        return;
                    }
                    self._fill($(this));
                }
            }).on('blur', 'textarea', function(){
                if (self.isStart && self._notInExclude($(this))){
                    var qid = self.isQuickMode?self._getQuickFormId($(this)):'';
                    if (qid!==''){
                        return;
                    }
                    self._fill($(this));
                }
            }).on('change', 'select', function(){
                if (self.isStart && self._notInExclude($(this))){
                    var qid = self.isQuickMode?self._getQuickFormId($(this)):'';
                    if (qid!==''){
                        return;
                    }
                    self._sel($(this));
                }
            }).on('select', '.nui-drop', function(){
                if (self.isStart && self._notInExclude($(this))){
                    var qid = self.isQuickMode?self._getQuickFormId($(this)):'';
                    if (qid!==''){
                        return;
                    }
                    self._nuiDrop($(this));
                }
            });
        },start: function() {
            this.isStart = true;
            this.code = [];
            $('#testOuput').html('');
        },stop: function(){
            this.isStart = false;
        },down: function(name, desc){

        },_getParentId: function(el){
            var p = el.parent();
            while(p.length>0 && p.attr('id')===undefined){
                p = p.parent();
            }
            return p.attr('id');
        },_click: function(el){//点击
            var self = this,
                id = el.attr('id'),
                txt = el.text(),
                name = el.attr('name');

            if (id!==undefined && id.indexOf('__')===false) {
                self._appendCode("self.click('#"+id+"')    # 点击"+txt);
            }else{
                if (txt!==''){
                    self._appendCode("self.click_text('#"+self._getParentId(el)+"', '"+txt+"')    # 点击"+txt);
                }else if(name!==''){
                    self._appendCode("self.click('#"+self._getParentId(el)+" [name=\""+name+"\"]')    # 点击"+txt);
                }else{
                    self._appendCode("self.click('#"+self._getParentId(el)+" 未找到')    # 点击");
                }
            }
        },_fill: function(el){//填充
            var self = this,
                id = el.attr('id'),
                type = el.attr('type'),
                name = el.attr('name'),
                val = el.val();

            if(type==='radio') {
                self._appendCode("self.click('input[name=\""+name+"\"][value=\""+val+"\"]')    # 点击单选按钮"+name);
                return;
            }else if(type==='submit' || type==='checkbox' ){
                self._click(el);
                return;
            }

            if (el.hasClass('nui-date')) {//日期控件
                self._appendCode("#输入日期控件，TODO日期不一定正确");
                var dateEl = $('#_nui_datepick .day .active');
                val = dateEl.attr('ym')+dateEl.text();
            }

            if (id!==undefined && id.indexOf('__')===false){
                self._appendCode("self.set_val('#"+id+"', '"+val+"')    # 填写文本框"+name);
            }else{
                self._appendCode("self.set_val('#"+self._getParentId(el)+" [name=\""+name+"\"]', '"+val+"')    # 填写文本框"+name);
            }
        },_sel: function(el){//选择下拉框
            var self = this,
                id = el.attr('id'),
                name = el.attr('name'),
                val = el.val(),
                txt = el.find('option[value='+val+']').text();
            if (id!==undefined && id.indexOf('__')===false){
                self._appendCode("self.select_text('#"+id+"', '"+txt+"')    # 选择下拉框"+name);
            }else{
                self._appendCode("self.select_text('#"+self._getParentId(el)+" [name=\""+name+"\"]', '"+txt+"')    # 选择下拉框"+name);
            }
        },_nuiDrop: function(el) {
            var self = this,
                id = el.attr('id'),
                val = el.find('.dropdown-toggle input').val(),
                txt = el.find('.dropdown-toggle a').text();

            self._appendCode("self.click('#"+id+" .dropdown-menu li[id="+val+"]')    # 填写下拉框"+txt);
        },_notInExclude: function(el){//点击这些按钮不生成录制代码
            var id = el.attr('id'),
                ex = 'testStart,testStop,testCode,testIsQuick,testShow,testFuncName,testFuncDesc,testDownBtn,testDownLink,';
            if (ex.indexOf(id+',')!==-1){
                return false;
            }else{
                return true;
            }
        },_getQuickFormId: function(el) {//是否是表单模式的开关
            var p = el.parent();
            while(p.length>0 && !p.hasClass('nui-quickform')){
                p = p.parent();
            }
            return p.hasClass('nui-quickform')?p.attr('id'):'';
        },_setQuickForm: function(id) {//填写表单
            var self = this;
            $('#'+id).frm('val', function(data){
                if (data[0]){
                    self._appendCode("check(self.val_frm('"+id+"', '', "+JSON.stringify(data[1])+"), 'eql', True)    # 填写表单"+id);
                    self._appendCode('#check(self.click_and_get_errmsg(\'#'+id+' [type=submit]\'), \'eql\', \'消息\')');
                    self._appendCode('#check(self.click_and_get_okmsg(\'#'+id+' [type=submit]\'), \'eql\', \'消息\')');
                    self._appendCode('#self.find_text(\'#表单ID\', \'要查找的值\')');
                }else{
                    self._appendCode("check(self.val_frm('"+id+"', '', "+JSON.stringify(data[1])+"), 'eql', False)    # 填写表单"+id);
                }
            });
        },_appendCode: function(code) {
            this.code.push(code);
            $('#testOuput').append('&nbsp;&nbsp;&nbsp;&nbsp;'+code+'\r\n\n');
            console.log(code);
        }
    };

    var divTest = '<div id="_uitest_mask" class="" style="position: absolute;left: 0px;top:0px;background-color: red;z-index: 99999;">';
    divTest += '<button id="testStart" class="btn btn-primary">开始</button>&nbsp;&nbsp;&nbsp;<button id="testStop" class="btn">停止</button>&nbsp;&nbsp;&nbsp;';
    divTest += '<input id="testIsQuick" type="checkbox" checked/>表单模式&nbsp;&nbsp;&nbsp;<input id="testCode" type="checkbox"/>显示代码';
    divTest += '<div id="testShow" style="width:500px;height:400px;display:none;background-color: yellow"><br/><textarea id="testOuput" style="width:480px;height:320px;overflow:scroll;"></textarea>';
    divTest += '<div>用例名称：<input id="testFuncName" type="text" style="width:100px;" value="test"/>&nbsp;&nbsp;';
    divTest += '用例描述：<input id="testFuncDesc" type="text" style="width:150px;" value="注释"/>&nbsp;&nbsp;';
    divTest += '<a id="testDownBtn" class="btn" href="javascript:;">生成</a><a id="testDownLink" download="test.py" href="data:text/plain," class="">下载</a></div>';
    divTest += '</div>';
    divTest += '</div>';
    $('body').append(divTest);

    var uitest = new Uitest();
    $('#testStart').click(function(){
        $(this).removeClass('btn-primary');
        $('#testStop').addClass('btn-primary');
        $('#testCode').removeClass('btn-primary');
        uitest.start();
    });
    $('#testStop').click(function(){
        $(this).removeClass('btn-primary');
        $('#testStart').addClass('btn-primary');
        $('#testCode').addClass('btn-primary');
        uitest.stop();
    });
    $('#testCode').click(function(){
        if ($(this).is(':checked')){
            $('#testShow').show();
        }else{
            $('#testShow').hide();
        }
    });
    $('#testIsQuick').click(function(){
        uitest.isQuickMode = $('#testIsQuick').is(':checked');
    });
    $('#testDownBtn').click(function(){
        var func = $('#testFuncName').val(),
            desc = $('#testFuncDesc').val(),
            code = '';
        if(func==='') {
            func = 'test';
        }
        if(desc==='') {
            desc = '注释';
        }
        code = 'def '+func+':    # '+desc+String.fromCharCode(13,10);
        for(var i=0;i<uitest.code.length;i++) {
            code += '    '+uitest.code[i]+String.fromCharCode(13,10);
        }
        var blob = new Blob([code]);

        $('#testDownLink').attr('download',func+'.py');
        $('#testDownLink').attr('href',URL.createObjectURL(blob));
    });

}(jQuery);
