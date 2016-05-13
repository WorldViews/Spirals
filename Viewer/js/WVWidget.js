
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
		WV.postChatMessage($(inputId).val());
		$(inputId).val("");
		return false;
	});
	$(dismissId).click(function(e) {
		WV.setChatVisibility(false);
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

    this.show = function() {
	report("WV.ChatWidget.show");
	$(windowId).show(100);
    }

    this.hide = function() {
	report("WV.ChatWidget.hide");
	$(windowId).hide(100);
    }

    build();
    rig();
}
