

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
	//$("#chatWindow").show(200);
	WV.chatWidget.show();
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
	//$("#chatWindow").hide(200);
	WV.chatWidget.hide();
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
    msg.id = WV.getUniqueId('chat');
    wvCom.sendMsg('chat', msg);
}

WV.xxxx = 0;
function chatter()
{
    WV.xxxx++;
    WV.postChatMessage("hello.  I am sam "+WV.xxxx);
    setTimeout(chatter, 5000);
}


$(document).ready(function()
{
    WV.chatWidget = new WV.WindowWidget("chat");
    WV.chatWidget.dismiss = WV.hideChat;
    WV.chatWidget.handleInput = WV.postChatMessage;

    WV.pageWidget = new WV.IframeWidget("page");
    //WV.pageWidget.show();
    WV.pageWidget.hide();
    WV.pageWidget.setSrc("http://fxpal.com");
    //WV.noteWidget = new ChatWidget("note");
    //WV.commentWidget = new ChatWidget("comment");
    //    WV.noteWidget = new ChatWidget("note");
});


