/******************************************************************************
* KindEditor - WYSIWYG HTML Editor for Internet
* Copyright (C) 2014-2019 nd.91.com
*
* @author Liwenhu
* @site http://www.kindsoft.net/
* @licence http://www.kindsoft.net/license.php
*******************************************************************************/

KindEditor.plugin('formula', function(K) {
	var self = this, name = 'formula', lang = self.lang(name + '.'),
    extraParams = K.undef(self.extraFileUploadParams, {}),
    uploadJson = K.undef(self.uploadJson, '');//文件上传路径
    formulaData = K.undef(self.formulaData, ''), formulaWin = null;;
	self.plugin.formula = {
		edit : function() {
			var html = [
				'<div style="width:500px;height:300px;">'
                , '<iframe id="formula_' + K.id + '" style="width:830px;height:570px;" name="formula_iframe" frameborder="no" src="' + K.basePath + 'plugins/formula/formula.html"></iframe>'
                ,'</div>'
				].join('');
			var dialog = self.createDialog({
				name : name,
				width : 850,
                height: 570,
				title : self.lang(name),
				body : html,
				yesBtn : {
					name : self.lang('yes'),
					click : function(e) {
                        if(formulaWin!=null){
                            var imgUrl = formulaWin.editOk();
                            if(imgUrl!==''){
                                self.exec('inserthtml','<img src="'+imgUrl+'">').hideDialog().focus();
                            }
                        }
					}
				}
			}),
			div = dialog.div;
            //公式编辑器窗口
            var formulaWin = window.frames['formula_iframe'];
            setTimeout(function(){
                formulaWin.document.body.onload = function(){
                    formulaWin.initFomulaEditor(K, uploadJson, formulaData);
                };
            }, 100);

		}
	};
	self.clickToolbar(name, self.plugin.formula.edit);
});
