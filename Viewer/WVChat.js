
WV.chatInitialized = false;
WV.watchingChat = false;

WV.watchChat = function()
{
    var layer = WV.layers["chat"];
    //WV.chatRunning = true;
    WV.setChatVisibility(true);
    if (!WV.chatInitialized) {
	layer.hideFun = WV.hideChat;
	WV.chatInitialized = true;
	wvCom.subscribe("chat", WV.handleChatData);
    }
}

WV.handleChatData = function(data, name)
{
    report("handleChatData");
    var layer = WV.layers["chat"];
    if (!layer.visible) {
	return;
    }
    //WV.setChatVisibility(true);
    var recs = data;
    var t = getClockTime();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	report("chat rec: "+JSON.stringify(rec));
	var str = rec.name+": "+rec.text;
	//$("#chatText").append(str+"<br>");
	$("#chatText").prepend(str+"<br>");
	if (rec.id == WV.myId) {
	    report("******** SKIPPING MY OWN RECORD *********");
	    continue;
	}
	var dt = t - rec.t;
	if (dt > WV.shownUserTimeout) {
	    report("ignoring view that is too old...");
	    continue;
	}
	if (rec.id == "person0") {
	    //report("******** skipping person0 ********");
	    continue;
	}
    }
}

WV.hideChat = function()
{
    WV.setChatVisibility(false);
}

WV.setChatVisibility = function(v)
{
    var layer = WV.layers["chat"];
    if (v) {
	report("Show #chatWindow ");
	$("#cb_chat").prop("checked", true);
	$("#chatWindow").show(200);
	$("#noteWindow").show(200);
	if (!WV.watchingChat)
	    WV.postChatMessage("[joining chat]");
	WV.watchingChat = true;
	if (!layer.visible)
	layer.visible = true;
	//$("#chatText").append("<br>");
	/*
	setTimeout(function() {
		report("ughhh......");
		$("#chatText").append("<br>");
	    }, 1000);
	*/
    }
    else {
	report("hide #chatWindow ");
	$("#cb_chat").prop("checked", false);
	layer.visible = false;
	$("#chatWindow").hide(200);
	$("#noteWindow").hide(200);
	if (WV.watchingChat)
	    WV.postChatMessage("[leaving chat]");
	WV.watchingChat = false;
    }
    //
}

//WV.WVCom.prototype.postMessage = function(text)
WV.postChatMessage = function(text)
{
    var msg = getStatusObj();
    msg.text = text;
    msg.type = "chat";
    var sStr = JSON.stringify(msg);
    report("postChatMessage sStr: "+sStr);
    if (WV.socket) {
	try {
	    WV.socket.emit('chat', sStr);
	}
	catch (err) {
	    report(""+err);
	}
    }
    else {
	jQuery.post("/chat/", sStr, function() {
		report("sent chat");
	    }, "json");
    }
}

WV.xxxx = 0;
function chatter()
{
    WV.xxxx++;
    WV.postChatMessage("hello.  I am sam "+WV.xxxx);
    setTimeout(chatter, 5000);
}

' <div class="chat-window" id="|NAME|Window">\n' +
'    <div class="chat-title" id="|NAME|Title" style="background-color:grey">|NAME|:</div>\n' +
'    <div class="chat-text" id="|NAME|Text"></div>\n' +
'    <form action="" id="|NAME|Form">\n' +
'      <input id="|NAME|Input" autocomplete="off" style="width: 82%;" />\n' +
'      <button>Send</button>\n' +
'      <button id="|NAME|Dismiss">X</button>\n' +
'    </form>\n' +
'  </div>\n';


function ChatWidget(name)
{
    this.name = name;
    var windowId = "#"+name+"Window";
    var formId = "#"+name+"Form";
    var textId = "#"+name+"Text";
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
	report("str:\n"+str);
	$("#notesLayerDiv").append(str);
    }

    function rig() {
	$(titleId).html(" "+name+":");
	$(formId).submit(function(){
		WV.postChatMessage($(textId).val());
		$(textId).val("");
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
    build();
    rig();
}

$(document).ready(function()
{
    WV.chatWidget = new ChatWidget("chat");
    //WV.noteWidget = new ChatWidget("note");
    //WV.commentWidget = new ChatWidget("comment");
    //    WV.noteWidget = new ChatWidget("note");
});


