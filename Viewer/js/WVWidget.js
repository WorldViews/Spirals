
WV.chatDivTemplate =
' <div class="chat-window" id="|NAME|Window">\n' +
'    <div class="chat-title" id="|NAME|Title" style="background-color:grey">|NAME|:</div>\n' +
'    <div class="chat-text" id="|NAME|Text"></div>\n' +
'    <form action="" id="|NAME|Form">\n' +
'      <input id="|NAME|Input" autocomplete="off" style="width: 82%;" />\n' +
'      <button>Send</button>\n' +
'      <button id="|NAME|Dismiss">X</button>\n' +
'    </form>\n' +
'  </div>\n';


WV.WindowWidget = function(name)
{
    this.name = name;
    var windowId = "#"+name+"Window";
    var formId = "#"+name+"Form";
    var textId = "#"+name+"Text";
    var inputId = "#"+name+"Input";
    var titleId = "#"+name+"Title";
    var dismissId = "#"+name+"Dismiss";
    var inst = this;

    function build() {
	if (name == "chat") {
	    report("***** skipping......");
	    return;
	}
	if ($(titleId).length > 0) {
	    report("**** "+titleId+" already exists");
	    return;
	}
	var str = WV.chatDivTemplate.replace(/\|NAME\|/g, name);
	report("str:\n"+str);
	$("#notesLayerDiv").append(str);
    }

    function rig() {
	$(titleId).html(" "+name+":");
	$(formId).submit(function(){
		var text = $(inputId).val();
		$(inputId).val("");
		inst.handleInput(text);
		return false;
	});
	//$(dismissId).click(function(e) {
	//	WV.setChatVisibility(false);
	//});
	$(dismissId).click(function(e) {
		inst.dismiss(); 
	    });
	$(titleId).on('mousedown', function(e) {
		report("mouse down on "+name);
		var offs0 = $(windowId).offset();
		var p0 = {x: e.pageX, y: e.pageY};
		report(" offset: "+offs0.top+" "+offs0.left);
		$(windowId).on('mousemove', function(e) {
	            $(windowId).offset({
			top: offs0.top + (e.pageY - p0.y),
			left: offs0.left + (e.pageX-p0.x)
		    }).on('mouseup', function() {
			report("mouseup");
			$(windowId).off('mousemove');
		    });
                });
		e.preventDefault();
	    });
    }

    this.setText = function(text) {
	report("setText "+text);
	$(textId).html(text);
    }

    this.prepend = function(text) {
	report("prepend "+text);
	$(textId).prepend(text);
    }

    this.show = function() {
	report("WV.ChatWidget.show");
	$(windowId).show(100);
    }

    this.hide = function() {
	report("WV.ChatWidget.hide");
	$(windowId).hide(100);
    }

    this.dismiss = function() {
	this.hide();
    }

    this.handleInput = function(text)
    {
	report("text was entered: "+text);
    }

    build();
    rig();
}

WV.iframeWidgetTemplate =
' <div class="video-window" id="|NAME|Window">\n' +
'    <div class="video-title" id="|NAME|Title" style="background-color:grey">|NAME|    \n'+
'       <button id="|NAME|Dismiss">x</button>\n' +
'    </div>\n' +
'     <div class="video-body" id="|NAME|Div">\n' +
'        <iframe class="video-body" id="|NAME|Iframe" ></iframe>\n' +
'     </div>\n' +
' </div>\n';

WV.IframeWidget = function(name)
{
    this.name = name;
    var windowId = "#"+name+"Window";
    var iframeId = "#"+name+"Iframe";
    var titleId = "#"+name+"Title";
    var divId = "#"+name+"Div";
    var dismissId = "#"+name+"Dismiss";
    var inst = this;
    this.divId = divId;

    function build() {
	if ($(titleId).length > 0) {
	    report("**** "+titleId+" already exists");
	    return;
	}
	var str = WV.iframeWidgetTemplate.replace(/\|NAME\|/g, name);
	report("str:\n"+str);
	$("#notesLayerDiv").append(str);
    }

    function rig() {
	$(dismissId).click(function(e) {
		inst.dismiss(); 
	    });
	$(titleId).on('mousedown', function(e) {
		report("mouse down on "+name);
		var offs0 = $(windowId).offset();
		var p0 = {x: e.pageX, y: e.pageY};
		report(" offset: "+offs0.top+" "+offs0.left);
		$(windowId).on('mousemove', function(e) {
	            $(windowId).offset({
			top: offs0.top + (e.pageY - p0.y),
			left: offs0.left + (e.pageX-p0.x)
		    }).on('mouseup', function() {
			report("mouseup");
			$(windowId).off('mousemove');
		    });
                });
		e.preventDefault();
	    });
    }

    this.setSrc = function(url) {
	report("setSrc "+url);
	$(iframeId).attr('src', url);
    }

    this.show = function() {
	report("WV.IframeWidget.show");
	$(windowId).show(100);
    }

    this.hide = function() {
	report("WV.IframeWidget.hide");
	$(windowId).hide(100);
    }

    this.dismiss = function() {
	this.hide();
    }

    build();
    rig();
}
