
WV.ShareCam = {};

WV.ShareCam.watch = function()
{
    var data = [
       {
	   't': WV.getClockTime(),
	   'name': 'don',
	   'lon': -120,
	   'lat': 45,
	   'sessionId': '123',
	   'tagStr': 'ShareCam',
	   'clientType': 'sharecam_android',
	   'numUsers': 1
       }
    ]
    WV.ShareCam.handleData(data, "sharecam");
    var layer = WV.layers["sharecam"];
    layer.visible = true;
    layer.hideFun = WV.ShareCam.hide;
    //layer.polylines = new Cesium.PolylineCollection();
    wvCom.subscribe("sharecam", WV.ShareCam.handleData);
}


WV.ShareCam.handleData = function(data, layerName)
{
    report("handleShareCamData");
    var layer = WV.layers["sharecam"];
    if (!layer.visible) {
	return;
    }
    WV.setPeopleVisibility(true);
    //    WV.setTethersVisibility(true);
    //    WV.setPeopleBillboardsVisibility(true);
    if (layer.recs == null) {
	report("initing PeopleData layer");
	layer.recs = {};
	layer.billboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    //var curPosImageUrl = "eagle1.png";
    var iconUrl = layer.iconUrl;
    if (!iconUrl)
	iconUrl = "jumpChat.png";
    report("data: "+JSON.stringify(data));
    //var recs = WV.getRecords(data);
    var recs = data;
    var t = WV.getClockTime();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	report("***************** rec: "+JSON.stringify(rec));
        layer.numObjs++;
	var dt = t - rec.t;
	if (dt > WV.shownUserTimeout) {
	    report("ignoring view that is too old...");
	    continue;
	}
        var lat =   rec.lat;
        var lon =   rec.lon;
	var scale = 0.1;
	var height = 300000;
        var id = "sharecam_"+rec.sessionId;
	rec.layerName = layerName;
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	var b = layer.billboards[id];
	if (b == null) {
	    var ob = WV.addBillboard(layer.bbCollection, lat, lon,
				    iconUrl, id, scale, height);
	    layer.billboards[id] = ob;
	}
	else {
	    report("billboard exists "+id);
	    var pos = Cesium.Cartesian3.fromDegrees(lon, lat, height);
	    layer.billboards[id].position = pos;
	}
    }
    for (var id in layer.recs) {
	var rec = layer.recs[id];
	var dt = t - rec.t;
	report("dt: "+dt);
	if (dt < WV.shownUserTimeout) {
	    report("skipping new views...");
	    continue;
	}
	//TODO: Should actually delete these, not just hide them
	layer.billboards[id].show = false;
    }
}

WV.ShareCam.hide = function()
{
    WV.ShareCam.setVisibility(false);
}

WV.ShareCam.handleClick = function(rec)
{
    report("ShareCam.handleClick "+JSON.stringify(rec));
    var room = rec.room;
    if (room == null || room == "null") {
	report("No room.... nothing to do");
	return;
    }
    var url = "https://jumpchat.paldeploy.com/sharedcam/?room="+room;
    report("ShareCam.JumpChat url: "+url);
    setTimeout(function() {
		window.open(url, "JumpChat");
	}, 300);
}

WV.ShareCam.setVisibility = function(v)
{
    var layer = WV.layers["people"];
    setObjsAttr(layer.tethers, "show", v);
    setObjsAttr(layer.curPosBillboards, "show", v);
}

