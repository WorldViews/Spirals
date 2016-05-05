
WV.geo = function(lon, lat)
{
    return new Cesium.Cartographic(lon, lat, 0);
}

WV.drawImage = function(image, lon0, lat0, wid, len, height, rot) {
	report("drawImage");
	report("lon0: "+lon0+"  lat0: "+lat0+" wid: "+wid+" len: "+len+" h: "+height+" rot: "+rot);
	var entity      = new Cesium.Entity();
	var dp = 0.0001;
	var g = new Cesium.EllipsoidGeodesic(WV.geo(lon0,lat0), WV.geo(lon0+dp,lat0));
	var dlonPerDs = dp/g.surfaceDistance;
	var g = new Cesium.EllipsoidGeodesic(WV.geo(lon0,lat0), WV.geo(lon0,lat0+dp));
	var dlatPerDs = dp/g.surfaceDistance;
	report("dlonPerDs: "+dlonPerDs+"     dlatPerDs: "+dlatPerDs);
	var dlon = wid * dlonPerDs;
	var dlat = len * dlatPerDs;
	var lon1 = lon0 + dlon;
	var lat1 = lat0 + dlat;
	report("lon0: "+lon0+"  lat0: "+lat0+"  lon1: "+lon1+" lat1: "+lat1);
	var rect = Cesium.Rectangle.fromDegrees(lon0, lat0, lon1, lat1);
	entity.rectangle = new Cesium.RectangleGraphics(
		{
		    coordinates: rect,
		    material: new Cesium.ImageMaterialProperty( {image: image} ),
		    rotation: rot,
		    stRotation: rot,
		    height: height
                }
	);
        WV.viewer.entities.add(entity);
	//return entity;
	return entity.rectangle;
};

//WV.addImageLayer = function(imageUrl, latLow, lonLow, latHigh, lonHigh)
WV.addImageLayer = function(imageUrl, lon0, lat0, lon1, lat1)
{
    var imageryLayers = WV.viewer.imageryLayers;
    //var rect = Cesium.Rectangle.fromDegrees(latLow, lonLow, latHigh, lonHigh);
    report("lon0: "+lon0+"  lat0: "+lat0+"  lon1: "+lon1+" lat1: "+lat1);
    var rect = Cesium.Rectangle.fromDegrees(lon0, lat0, lon1, lat1);
    var provider = new Cesium.SingleTileImageryProvider({
	    //url : 'PorterFloorPlan.png',
	    url : imageUrl,
	    rectangle : rect
	});
    var ilayer = imageryLayers.addImageryProvider(provider);
    ilayer.alpha = 1.0;
    ilayer.show = true;
    return ilayer;
}

function testy()
{
    WV.drawImage("person0.png", -86, 30, 1000, 1000, 10, -0.5);
    WV.drawImage("eye1.png", -120, 50, 300, 300, 10, 0.5);
}


WV.getIndoorMapData = function()
{
    testy();
    report("WV.getIndoorMapData");
    var data = [
       {
          'id': 'map1', 
	  'lonRange': [-115.0, -107],
	  'latRange': [38.0,     39.75],
          'url': 'PorterFloorPlan.png',
	  'width': 100000,
	  'height': 100000,
       },
       {
          'id': 'map2', 
	  'lonRange': [-105.0, -100],
	  'latRange': [35.0,     38.0],
          'url': 'PorterFloorPlan.png',
	  'width': 100000,
	  'height': 100000,
       },
       {
          'id': 'map3', 
	  'lonRange': [-122.21, -122.20], 
          'latRange': [37.41, 37.42],
          'url': 'PorterFloorPlan.png',
	  'width': 100000,
	  'height': 100000,
       }
    ]
    url = "indoormaps_data.json";
    //url = "indoormaps_err_data.json";
    report("url: "+url);
    $.getJSON(url, function(data) {
	    WV.handleIndoorMapData(data, "indoorMaps");
	});
    //WV.handleIndoorMapData(data);
}

WV.handleIndoorMapData = function(data, name)
{
    report("handleIndoorMapData");
    var layer = WV.layers["indoorMaps"];
    layer.showFun = WV.getIndoorMapData;
    layer.visible = true;
    if (layer.recs != null) {
	//WV.setIndoorMapsVisibility(true);
	//return;
    }
    if (layer.recs == null) {
	layer.recs = {};
	layer.billboards = {};
	layer.ilayers = {};
	//layer.showFun = WV.showIndoorMaps;
	layer.hideFun = WV.hideIndoorMaps;
	layer.bbCollection = new Cesium.BillboardCollection();
    }
    var recs = data;
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
        //report("rec "+i+" "+JSON.stringify(rec));
        var imageUrl = "person0.png";
	var lon;
	var lon;
	var latLow;
	var latHigh;
	var h = 10;
	if (rec.lonRange != null) {
            lon = rec.lonRange[0];
            lonHigh = rec.lonRange[1];
	}
	else
	    lon = rec.lon;
	if (rec.latRange != null) {
	    lat = rec.latRange[0];
	    var latHigh = rec.latRange[1];
	}
	else
	    lat = rec.lat;
	if (rec.height != null)
	    h = rec.height;
        var id = rec.id;
	var rot = 0;
	if (rec.rot) {
	    rot = toRadians(rec.rot);
	}
	if (layer.ilayers[id]) {
	    report("************* Hiding map we already have...");
	    layer.ilayers[id].show = false;
	}
        layer.recs[id] = rec;
	var width = rec.width;
	var len = rec.length;
	report("len: "+len+" width: "+width+"  rot: "+rot);
	//ilayer = WV.addImageLayer(rec.url, lon, lat, lonHigh, latHigh);
	ilayer = WV.drawImage(rec.url,   lon, lat, width, len, h, rot);
	ilayer.name = name;
	layer.ilayers[id] = ilayer;
    }
}

WV.showIndoorMaps = function()
{
    WV.setIndoorMapsVisibility(true);
}

WV.hideIndoorMaps = function()
{
    WV.setIndoorMapsVisibility(false);
}

WV.setIndoorMapsVisibility = function(v)
{
    var layer = WV.layers["indoorMaps"];
    setObjsAttr(layer.ilayers, "show", v);
    //if (v)
    //	setObjsAttr(layer.ilayers, "alpha", 1);
    //else
    //  setObjsAttr(layer.ilayers, "alpha", 0.2);
}
