
WV.Robots = {}

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
    layer.setVisibility(true);
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
	if (rec.type == "robotTrail") {
	    WV.Robots.addTrail(layer, rec);
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

WV.Robots.addTrail = function(layer, rec)
{
    report("WV.Robots.addTrail "+layer.name);
    var url = rec.dataUrl;
    WV.getJSON(url, function(data) {
	    WV.Robots.handleTrailData(layer, rec, data);
    });
}

WV.Robots.handleTrailData = function(layer, rec, data)
{
    var recs = data.recs;
    var coordSys = rec.coordSys;
    var points = [];
    var pathId = "robot_path_"+rec.id
    for (var i=0; i<recs.length; i++) {
	var tr = recs[i];
	var pos = tr.pos;
	var lla = WV.xyzToLla(tr.pos, coordSys);
	//report(" "+i+"  "+pos+"  "+lla);
	points.push(Cesium.Cartesian3.fromDegrees(lla[1], lla[0], 0));
    }
    var material = new Cesium.PolylineGlowMaterialProperty({
	    color : Cesium.Color.RED,
	    glowPower : 0.15});
    var opts = { positions : points,
		 id: pathId,
		 width : 3.0,
		 material : material };
    var route = null;
    var polylines = WV.getTetherPolylines();
    route = polylines.add({polyline: opts});
    route = route.polyline;
    return route;
}


WV.Robots.handleClick = function(rec)
{
    report("WV.Robots.handleClick rec: "+WV.toJSON(rec));
}

$(document).ready(function() {
    WV.registerLayerType("robots", {
         dataHandler: WV.Robots.handleRecs,
         clickHandler: WV.Robots.handleClick
	     });
});


