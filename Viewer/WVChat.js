
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
	$("#chatWindow").show();
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
	layer.visible = false;
	$("#chatWindow").hide(200);
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

$(document).ready(function()
{
    $("#chatForm").submit(function(){
	    WV.postChatMessage($("#chatText").val());
	    $("#chatText").val("");
            return false;
	});
    $('#dismissChat').click(function(e) {
        WV.setChatVisibility(false);
    });
    $('#chatTitle').on('mousedown', function(e) {
        var offs0 = $('#chatWindow').offset();
        var p0 = {x: e.pageX, y: e.pageY};
        report(" offset: "+offs0.top+" "+offs0.left);
        $('#chatWindow').on('mousemove', function(e) {
            $('#chatWindow').offset({
                top: offs0.top + (e.pageY - p0.y),
                left: offs0.left + (e.pageX-p0.x)
            }).on('mouseup', function() {
                report("mouseup");
                //$('#chatWindow').off('mousemove', false);
                $('#chatWindow').off('mousemove');
            });
        });
        e.preventDefault();
    });

});


