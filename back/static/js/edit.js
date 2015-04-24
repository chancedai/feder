(function(window, undefined) {
	var id = 'Feder_20150421104106';
	var getNodes = function(wrap,attr) {
		attr = attr||'node-type';
		wrap = $(wrap);
		var nodes = $("[" + attr + "]", wrap);
		var nodesObj = {};
		nodesObj.wrap = wrap;
		nodes.each(function(i) {
			var item = $(this);
			nodesObj[item.attr(attr)] = item;
		});
		return nodesObj;
	};
	var dom = getNodes('#Feder_20150421104106','feder-type');
	console.log(dom);

	var editor = CodeMirror.fromTextArea(dom.content[0], {
	  value: dom.content.val(),
	  lineNumbers: true,
	  lineWrapping: true,
	  styleActiveLine: true,
	  mode: FEDERDATA.mode,
	  keyMap: 'sublime',
	  autoCloseBrackets: true,
	  matchBrackets: true,
	  showCursorWhenSelecting: true,
	  theme: 'monokai'
	});

	dom.form.on('submit',function(e){
		var url = dom.form.attr('action');
		$.ajax({
			url:url,
			data:{
				file:dom.file.val(),
				content:dom.content.val(),
				type:'json'
			},
			dataType:'json',
			type:'post',
			success:function(msg){
				console.log(msg);
			},
			error:function(XMLHttpRequest, textStatus, errorThrown){
				console.log('error',XMLHttpRequest, textStatus, errorThrown);
			}


		});
		e.preventDefault();
	});

})(window);