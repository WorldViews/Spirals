

WV.chatInitialized = false;
WV.watchingChat = false;
WV.showTimeStamps = true;

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
    report("handleChatData "+name);
    //report("data: "+WV.toJSON(data));
    var layer = WV.layers["chat"];
    if (!layer.visible) {
	return;
    }
    var t = WV.getClockTime();
    var recs = WV.getRecords(data);
    recs.sort(function(a,b) { return a.t-b.t; })
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	if (rec.t == null) {
	    report("Bad rec with no time "+JSON.stringify(rec));
	    continue;
	}
	//report("chat rec: "+JSON.stringify(rec));
	var dt = t - rec.t;
	var str = rec.name+": "+rec.text;
	if (WV.showTimeStamps)
	    str = WV.toTimeStr(rec.t) + " " + str
	WV.chatWidget.prepend(str+"<br>");
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

    //WV.noteWidget = new ChatWidget("note");
    //WV.commentWidget = new ChatWidget("comment");
    //    WV.noteWidget = new ChatWidget("note");
});



