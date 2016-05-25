
WV.tetherPolylines = null;

WV.getTetherPolylines = function()
{
    WV.tetherPolylines = WV.entities;
    return WV.tetherPolylines;
}


WV.getTetherPoints = function(lat0, lon0, h0, lat1, lon1, h1)
{
    report("lat,lon 0: "+lat0+" "+lon0+" "+h0);
    report("lat,lon 1: "+lat1+" "+lon1+" "+h1);
    var positions = [Cesium.Cartesian3.fromDegrees(lon0, lat0, 0),
		     Cesium.Cartesian3.fromDegrees(lon1, lat1, h1),
		     Cesium.Cartesian3.fromDegrees(lon1, lat1, 0)];
    return positions;
}

WV.getTether = function(tetherId, points)
{
    report("WV.getTether id: "+tetherId+" "+JSON.stringify(points));
    var material = new Cesium.PolylineGlowMaterialProperty({
	    color : Cesium.Color.RED,
	    glowPower : 0.15});
    var opts = { positions : points,
		 id: tetherId,
		 width : 3.0,
		 material : material };
    var tether = null;
    var polylines = WV.getTetherPolylines();
    tether = polylines.add({polyline: opts});
    tether = tether.polyline;
    return tether;
}


WV.shownUserTimeout = 10; // How recently a user must have
                          // posted to be shown here

/*
xlines = null;

function drawPoly(lt0, ln0, lt1,ln1)
{
    report(">>>> drawLine "+lt0+" "+ln0+" <--> "+lt1+" "+ln1);
    //   points = [Cesium.Cartesian3.fromDegrees(45, -100, 1000),
    //      Cesium.Cartesian3.fromDegrees(46, -170, 1000)]
    var points = [Cesium.Cartesian3.fromDegrees(ln0, lt0, 1000),
		  Cesium.Cartesian3.fromDegrees(ln1, lt1, 1000000)];

    var col = xlines;
    //    var polyLine = WV.entities.add({
    var polyLine = col.add({
	    polyline : {
		positions : points,
		width : 3.0,
		material : new Cesium.PolylineGlowMaterialProperty({
			//color : Cesium.Color.DEEPSKYBLUE,
			color : Cesium.Color.GREEN,
			glowPower : 0.15
		    })
	    }
	});
    xp = polyLine;
    return polyLine;
    
}

drawLine = drawPoly;
function drawLines()
{
    drawLine(0, 0, 80, 0);
    drawLine(45,-100, 45, -160);
    drawLine(55, 30, 55, 80);
}

function tests()
{
    xlines = WV.entities;
    //xlines = new Cesium.PolylineCollection();
    //WV.entities.add(xlines);
    drawLines();
}
*/

WV.watchPeople = function()
{
    //tests();
    var data = [
       {
	   't': 1E100,
	   'op': 'create',
	   'id': 'person1', 
	   'origin': [0, 0],
	   'curPos': [10, 25, 10000000]
       }
    ]
    WV.handlePeopleData(data, "people");
    var layer = WV.layers["people"];
    layer.visible = true;
    layer.hideFun = WV.hidePeople;
    //layer.polylines = new Cesium.PolylineCollection();
    wvCom.subscribe("people", WV.handlePeopleData);
}

WV.handlePeopleData = function(data, name)
{
    report("handlePeopleData");
    var showOriginBillboards = false;
    var layer = WV.layers["people"];
    if (!layer.visible) {
	return;
    }
    //    WV.setPeopleBillboardsVisibility(true);
    if (layer.recs == null) {
	report("initing PeopleData layer");
	layer.recs = {};
	layer.tethers = {};
	layer.originBillboards = {};
	layer.curPosBillboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    WV.setPeopleVisibility(true);
    //    WV.setTethersVisibility(true);
    var originImageUrl = "person0.png";
    //var curPosImageUrl = "eagle1.png";
    var curPosImageUrl = "eye3.png";
    var recs = data;
    var t = WV.getClockTime();
    //var polylines = WV.getTetherPolylines();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	if (rec.userId == WV.myId) {
	    //report("******** SKIPPING MY OWN RECORD *********");
	    continue;
	}
        report("rec "+i+" "+JSON.stringify(rec));
        layer.numObjs++;
	if (rec.origin == null) {
	    report("no origin");
	    continue;
	}
	if (rec.curPos == null) {
	    report("no curPos");
	    continue;
	}
	var dt = t - rec.t;
	if (dt > WV.shownUserTimeout) {
	    report("ignoring view that is too old...");
	    continue;
	}
	if (rec.userId == "person0") {
	    //report("******** skipping person0 ********");
	    continue;
	}
        var lat0 =   rec.origin[0];
        var lon0 =   rec.origin[1];
	var height0 = 30000;
        var lat =    rec.curPos[0];
        var lon =    rec.curPos[1];
	var height = rec.curPos[2];
        var id = "person_"+rec.userId;
	var h1 = 0.1*height;
        //var id = "person_"+layer.numObjs;
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	var originScale = 0.25;
	var curPosScale = 0.1;
	//var height = 300000;
	var b = layer.originBillboards[id];
	var points = WV.getTetherPoints(lat0, lon0, height0, lat, lon, h1);
	if (showOriginBillboards && b == null) {
	    var ob = WV.addBillboard(layer.bbCollection, lat0, lon0,
				    originImageUrl, id, originScale, height0);
	    layer.originBillboards[id] = ob;
	}
	var cb = layer.curPosBillboards[id];
	if (cb == null) {
	    cb = WV.addBillboard(layer.bbCollection, lat, lon,
			      curPosImageUrl, id, curPosScale, h1);
	    layer.curPosBillboards[id] = cb;
	    var tetherId = "tether_"+rec.userId;
	    var tether = WV.getTether(tetherId, points);
	    layer.tethers[id] = tether;
	}
	else {
	    report("billboard exists "+id);
	    var pos = Cesium.Cartesian3.fromDegrees(lon, lat, h1);
	    layer.curPosBillboards[id].position = pos;
	    layer.curPosBillboards[id].show = true;
	    var tether = layer.tethers[id];
	    if (tether)
		tether.positions = points;
	}
    }
    for (var id in layer.recs) {
	var rec = layer.recs[id];
	var dt = t - rec.t;
	//report("dt: "+dt);
	if (dt < WV.shownUserTimeout) {
	    continue;
	}
	//TODO: Should actually delete these, not just hide them
	layer.curPosBillboards[id].show = false;
	layer.tethers[id].show = false;
    }
}

WV.hidePeople = function()
{
    WV.setPeopleVisibility(false);
}

WV.setPeopleVisibility = function(v)
{
    var layer = WV.layers["people"];
    setObjsAttr(layer.tethers, "show", v);
    setObjsAttr(layer.curPosBillboards, "show", v);
}

