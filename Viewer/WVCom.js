/*
  This module encapsulates the methods for getting geo data to show
  for various layers.   To use it, create a WVCom object, and then
  subscribe to various event types, and register a handler for each
  type.

 */


WV.WVCom = function()
{
    this.types = {};
}

WV.Watcher = function(wvCom, evType)
{
    this.wvCom = wvCom;
    this.evType = evType;
    this.prevMaxId = null;
    report("Starting poll requests evType: "+evType);
    this.pollRequest();
}

WV.Watcher.prototype.pollRequest = function()
{
    report("WV.Wacher.pollRequest "+this.evType);
    //var url = "/imageTweets/?maxNum=10";
    var url = "/wvgetdata/?type="+this.evType;
    url += "&maxNum=10";
    if (this.prevMaxId)
	url += "&prevEndNum="+this.prevMaxId;
    report(" url: "+url);
    var inst = this;
    $.getJSON(url, function(data) { inst.pollHandler(data); });
}

WV.Watcher.prototype.pollHandler = function(data)
{
    report("WV.Watcher.pollHandler got data evType: "+this.evType);
    var inst = this;
    //var recs = data.images.slice(0,100);
    //report("data: "+JSON.stringify(data));
    var recs = data.recs;
    if (recs.length > 100)
	recs = recs.slice(0,100);
    for (var i=0; i<recs.length; i++) {
	var rec = recs[i];
	if (rec.id)
	    this.prevMaxId = rec.id;
    }
    var typeObj = this.wvCom.types[this.evType];
    if (typeObj.handler)
	typeObj.handler(recs);
    setTimeout(function() { inst.pollRequest()}, 1000);
}


WV.WVCom.prototype.subscribe = function(evType, handler, opts)
{
    report("WVCom.subscribe "+evType+" "+JSON.stringify(opts));
    if (opts == null)
	opts = {};
    var typeObj = {'eventType': evType}
    typeObj.handler = handler;
    this.types[evType] = typeObj;
    if (evType == "drones") {
	var url = "tbd_data.json";
        $.getJSON(url, handler);
    }
    else
	typeObj.watcher = new WV.Watcher(this, evType);
}

WV.WVCom.prototype.sendStatus = function(status)
{
    var sStr = JSON.stringify(status);
    //report("sStr: "+sStr);
    jQuery.post("/register/", sStr, function() {
	    report("registered");
	}, "json");
}