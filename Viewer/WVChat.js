
WV.chatRunning = false;

WV.watchChat = function()
{
    var layer = WV.layers["chat"];
    layer.visible = true;
    if (WV.chatRunning)
	return;
    WV.chatRunning = true;
    layer.hideFun = WV.hideChat;
    //layer.polylines = new Cesium.PolylineCollection();
    wvCom.subscribe("chat", WV.handleChatData);
    chatter();
}

WV.handleChatData = function(data, name)
{
    report("handleChatData");
    var layer = WV.layers["chat"];
    if (!layer.visible) {
	return;
    }
    WV.setChatVisibility(true);
    var recs = data;
    var t = getClockTime();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	report("chat rec: "+JSON.stringify(rec));
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

function chatter()
{
    WV.postChatMessage("hello.  I am sam");
    setTimeout(chatter, 5000);
}

