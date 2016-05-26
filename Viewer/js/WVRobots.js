

WV.Robots = {}

/*
WV.Robots.watch = function()
{
    var data = [
       {
	   't': 1E100,
	   'op': 'create',
	   'id': 'person1', 
	   'origin': [0, 0],
	   'curPos': [10, 25, 10000000]
       }
    ]
    WV.Robots.handleData(data, "robots");
    var layer = WV.layers["robots"];
    layer.visible = true;
    layer.hideFun = WV.Robots.hide;
    //layer.polylines = new Cesium.PolylineCollection();
    wvCom.subscribe("robots", WV.Robots.handleData);
}
*/

WV.Robots.handleRecs = function(data, name)
{
    report("WV.Robots.handleRecs");
    var layer = WV.layers["robots"];
    if (!layer.visible) {
	return;
    }
    //    WV.setPeopleBillboardsVisibility(true);
    if (layer.recs == null) {
	report("initing RobotData layer");
	layer.recs = {};
	layer.tethers = {};
	layer.billboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    WV.Robots.setVisibility(true);
    var imageUrl = layer.imageUrl;
    var recs = WV.getRecords(data);
    var t = WV.getClockTime();
    //var polylines = WV.getTetherPolylines();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	rec.layerName = "robots";
	if (rec.type == "CoordinateSystem") {
	    var csName = rec.coordSys;
	    report("**** adding CoordinateSystem "+csName);
	    WV.addCoordinateSystem(csName, rec);
	    continue;
	}
        report("rec "+i+" "+JSON.stringify(rec));
        layer.numObjs++;
	var dt = t - rec.t;
	var lat, lon;
	if (rec.position) {
	    var csName = rec.coordSys;
	    var lla = WV.xyzToLla(rec.position, csName);
	    lat = lla[0];
	    lon = lla[1];
	}
	else {
	    lat = rec.lat;
	    lon = rec.lon;
	}
	var h = 50000;
        var id = "robot_"+rec.id;
	var imageUrl = "images/BeamRobot.png";
	var scale = 0.2;
	if (layer.imageUrl)
	    imageUrl = layer.imageUrl;
	if (rec.robotType == "double") {
	    imageUrl = "images/double-robotics-2.png";
	    scale = 0.1;
	}
	if (rec.robotType == "beam") {
	    imageUrl = "images/BeamRobot.png";
	    scale = 0.2;
	}
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	var curPosScale = 0.1;
	var b = layer.billboards[id];
	if (b == null) {
	    b = WV.addBillboard(layer.bbCollection, lat, lon,
				 imageUrl, id, scale, h, false);
	    layer.billboards[id] = b;
	}
	else {
	    report("billboard exists "+id);
	    var pos = Cesium.Cartesian3.fromDegrees(lon, lat, h1);
	    layer.billboards[id].position = pos;
	    layer.billboards[id].show = true;
	}
    }
}

WV.Robots.handleClick = function(rec)
{
    report("WV.Robots.handleClick rec: "+WV.toJSON(rec));
}

WV.Robots.show = function()
{
    WV.Robots.setVisibility(true);
}

WV.Robots.hide = function()
{
    WV.Robots.setVisibility(false);
}

WV.Robots.setVisibility = function(v)
{
    var layer = WV.layers["robots"];
    WV.setBillboardsVisibility(layer.billboards, v, v);
}

