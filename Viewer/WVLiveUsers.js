
WV.tetherPolylines = null;

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
    //WV.tetherPolylines = new Cesium.PolylineCollection();
    //WV.entities.add(WV.tetherPolylines);
    WV.tetherPolylines = WV.entities;
    var data = [
       {
	   't': 1E100,
	   'op': 'create',
	   'id': 'person1', 
	   'origin': [0, 0],
	   'curPos': [0, 0, 1000000]
       }
    ]
    //    if (WV.thisPersonData)
    //	data.push(WV.thisPersonData);
    WV.handlePeopleData(data, "people");
    var layer = WV.layers["people"];
    //layer.polylines = new Cesium.PolylineCollection();
    wvCom.subscribe("people", WV.handlePeopleData);
}

WV.getTetherPoints = function(lat0, lon0, h0, lat1, lon1, h1)
{
    report("lat,lon 0: "+lat0+" "+lon0);
    report("lat,lon 1: "+lat1+" "+lon1);
    var positions = [Cesium.Cartesian3.fromDegrees(lon0, lat0, 0),
		     Cesium.Cartesian3.fromDegrees(lon1, lat1, h1)];
    return positions;
}

WV.handlePeopleData = function(data, name)
{
    report("handlePeopleData");
    var showOriginBillboards = false;
    var layer = WV.layers["people"];
    if (layer.recs == null) {
	report("initing PeopleData layer");
	layer.recs = {};
	layer.tethers = {};
	layer.originBillboards = {};
	layer.curPosBillboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    var originImageUrl = "person0.png";
    var curPosImageUrl = "eagle1.png";
    var recs = data;
    var t = getClockTime();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	if (rec.id == WV.myId) {
	    report("******** SKIPPING MY OWN RECORD *********");
	    continue;
	}
        //report("rec "+i+" "+JSON.stringify(rec));
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
	if (dt > 30) {
	    report("ignoring view that is too old...");
	    continue;
	}
	if (rec.id == "person0") {
	    //report("******** skipping person0 ********");
	    continue;
	}
        var lat0 =   rec.origin[0];
        var lon0 =   rec.origin[1];
	var height0 = 30000;
        var lat =    rec.curPos[0];
        var lon =    rec.curPos[1];
	var height = rec.curPos[2];
        var id = "person_"+rec.id;
        //var id = "person_"+layer.numObjs;
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	var scale = 0.25;
	//var height = 300000;
	var points = WV.getTetherPoints(lat0, lon0, height0, lat, lon, height);
	var b = layer.originBillboards[id];
	if (showOriginBillboards && b == null) {
	    var ob = addBillboard(layer.bbCollection, lat0, lon0,
				    originImageUrl, id, scale, height0);
	    layer.originBillboards[id] = ob;
	}
	var cb = layer.curPosBillboards[id];
	if (cb == null) {
	    cb = addBillboard(layer.bbCollection, lat, lon,
			      curPosImageUrl, id, scale, height);
	    layer.curPosBillboards[id] = cb;
	    var tetherId = "tether_"+rec.id;
	    var material = new Cesium.PolylineGlowMaterialProperty({
		    color : Cesium.Color.RED,
		    glowPower : 0.15});
	    var opts = { positions : points,
			 id: tetherId,
			 width : 3.0,
			 material : material };
	    var tether = null;
	    if (WV.tetherPolylines != null) {
		tether = WV.tetherPolylines.add({polyline: opts});
		tether = tether.polyline;
	    }
	    layer.tethers[id] = tether;
	}
	else {
	    report("billboard exists "+id);
	    var pos = Cesium.Cartesian3.fromDegrees(lon, lat, height);
	    layer.curPosBillboards[id].position = pos;
	    var tether = layer.tethers[id];
	    if (tether)
		tether.positions = points;
	}
    }
}

