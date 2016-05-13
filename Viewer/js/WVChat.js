

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

WV.toDMYHMS = function(t)
{
    var tm = new Date(t*1000);
    var mdy = (tm.getMonth()+1)+"/"+
               tm.getDate()+"/"+
               tm.getFullYear();
    var hms =  tm.getHours()+":"+
               tm.getMinutes()+":"+
               tm.getSeconds();
    return mdy +" "+ hms;
}

WV.toHMS = function(t)
{
    var tm = new Date(t*1000);
    var hms =  tm.getHours()+":"+
               tm.getMinutes()+":"+
               tm.getSeconds();
    return hms;
}

WV.toTimeStr = function(t)
{
    var tm0 = new Date();
    var tm = new Date(t*1000);
    var h = ""+tm.getHours();
    if (h.length == 1)
	h = " "+h;
    var m = ""+tm.getMinutes();
    if (m.length == 1)
	m = "0"+m;
    var s = ""+tm.getSeconds();
    if (s.length == 1)
	s = "0"+s;
    var hms =  h+":"+m+":"+s;
    var dt = tm0 - tm;
    if (dt < 24*60*60*1000 && tm0.getDate() == tm.getDate()) {
	return hms;
    }
    var mdy = (tm.getMonth()+1)+"/"+
               tm.getDate()+"/"+
               tm.getFullYear();
    return mdy +" "+ hms;
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

    WV.pageWidget = new WV.IframeWidget("page");
    //WV.pageWidget.show();
    WV.pageWidget.hide();
    WV.pageWidget.setSrc("http://fxpal.com");
    //WV.noteWidget = new ChatWidget("note");
    //WV.commentWidget = new ChatWidget("comment");
    //    WV.noteWidget = new ChatWidget("note");
});


