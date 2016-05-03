

WV.getIndoorMapData = function()
{
    report(">>>> WV.getIndoorMapData");
    var data = [
       {
          'id': 'map1', 
	  'latRange': [-115.0, -107],
	  'lonRange': [38.0,     39.75],
          'url': 'PorterFloorPlan.png',
	  'width': 100000,
	  'height': 100000,
       },
       {
          'id': 'map2', 
	  'latRange': [-105.0, -100],
	  'lonRange': [35.0,     38.0],
          'url': 'PorterFloorPlan.png',
	  'width': 100000,
	  'height': 100000,
       }

    ]
    WV.handleIndoorMapData(data);
}

WV.handleIndoorMapData = function(data, name)
{
    report("handleIndoorMapData");
    var layer = WV.layers["indoorMaps"];
    layer.visible = true;
    var imageryLayers = WV.viewer.imageryLayers;
    report("1111111111111111 layer.recs: "+layer.recs);
    if (layer.recs != null) {
	WV.setIndoorMapsVisibility(true);
	report("*****>>>>>>-------->>>> quick dips....");
	return;
    }
    if (layer.recs == null) {
	layer.recs = {};
	layer.billboards = {};
	layer.ilayers = {};
	layer.showFun = WV.showIndoorMaps;
	layer.hideFun = WV.hideIndoorMaps;
	layer.bbCollection = new Cesium.BillboardCollection();
    }
    var recs = data;
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
        //report("rec "+i+" "+JSON.stringify(rec));
        var imageUrl = "person0.png";
        var lonLow = rec.lonRange[0];
        var lonHigh = rec.lonRange[1];
        var latLow = rec.latRange[0];
        var latHigh = rec.latRange[1];
        var id = rec.id;
	if (layer.ilayers[id]) {
	    report("Skipping map we already have...");
	    continue;
	}
        layer.recs[id] = rec;

        var provider = new Cesium.SingleTileImageryProvider({
	        //url : 'PorterFloorPlan.png',
	        url : rec.url,
                //rectangle : Cesium.Rectangle.fromDegrees(-115.0, 38.0, -107, 39.75)
                rectangle : Cesium.Rectangle.fromDegrees(latLow, lonLow, latHigh, lonHigh)
	});
        var ilayer = imageryLayers.addImageryProvider(provider);
        ilayer.alpha = 1.0;
        ilayer.show = true;
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
