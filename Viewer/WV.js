
var WV = {};

WV.LAYER_DATA =
{
    "layers": [
       {
          'name': 'drones',
          'description': 'drone videos',
	  'maxNum': 30,
       },
       {
          'name': 'photos',
          'description': 'recently tweeted images',
	  'maxNum': 30,
	  'imageServer': 'http://localhost:8001/'
       }
    ]
};

WV.screenSpaceEventHandler = null;
WV.prevEndId = null;
WV.numBillboards = 0;
WV.bbScaleUnselected = 0.08;
WV.bbScaleSelected = 0.12;
WV.currentBillboard = null;
WV.keepSending = true;
WV.layers = {};

function WVLayer(spec)
{
    var name = spec.name;
    for (var key in spec) {
	this[key] = spec[key];
    }
    this.spec = spec;
    this.numObjs = 0;
    this.recs = null;
    this.billboards = null;
    this.bbCollection = null;
    WV.layers[name] = this;

    this.loaderFun = function() {
	if (this.name == "photos")
	    getTwitterImages();
	if (this.name == "drones")
	    getDroneVids("tbd_data.json");
    }

    this.setVisibility = function(visible) {
	report("setVisibility "+this.name+" "+visible);
	if (visible) {
	    if (this.billboards == null) {
		this.loaderFun();
	    }
	    else {
		setObjsAttr(this.billboards, "show", true);
	    }
	}
	else {
	    setObjsAttr(this.billboards, "show", false);
	}
    }
}

function report(str)
{
    console.log(str);
}

var viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
        url : 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
    }),
    baseLayerPicker : false
});

var scene = viewer.scene;				 
scene.globe.depthTestAgainstTerrain = true;
var droneBillboards = null;
var twitterBillboards = null;

function addBillboard(bbCollection, lat, lon, imgUrl, id, scale)
{
    WV.numBillboards++;
    report("Adding billboard "+WV.numBillboards);
    // Example 1:  Add a billboard, specifying all the default values.
    if (!imgUrl)
       imgUrl = MONACAT_URL;
    if (!scale)
       scale = WV.bbScaleUnselected;
    var b = bbCollection.add({
       show : true,
       position : Cesium.Cartesian3.fromDegrees(lon, lat, 1000000),
       pixelOffset : Cesium.Cartesian2.ZERO,
       eyeOffset : Cesium.Cartesian3.ZERO,
       horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
       verticalOrigin : Cesium.VerticalOrigin.CENTER,
       'scale' : scale,
       image : imgUrl,
       color : Cesium.Color.WHITE,
       id : id
    });
    bb = b;//to make debugging easier..
    return b;
}

function getDroneVids(url)
{
    report("getDroneRecs "+url);
    $.getJSON(url, handleDroneRecs)
}

function handleDroneRecs(data)
{
    report("handleDroneRecs");
    var layer = WV.layers["drones"];
    layer.recs = {};
    layer.billboards = {};
    layer.bbCollection = new Cesium.BillboardCollection();
    scene.primitives.add(layer.bbCollection);
    var recs = data;
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	if (!rec.yahooId) {
            report("skipping recs with no yahoo video");
        }
        report("rec "+i+" "+JSON.stringify(rec));
        if (!rec.yahooId)
            continue;
        layer.numObjs++;
        if (layer.numObjs > layer.maxNum)
            return;
        var imageUrl = "drone.png";
        var lon = rec.lon;
        var lat = rec.lat;
        id = "tbd_"+rec.id;
        layer.recs[id] = rec;
        var b = addBillboard(layer.bbCollection, lat, lon, imageUrl, id);
        layer.billboards[id] = b;
    }
}

function setObjsAttr(objs, attr, val)
{
    report("setObjsAttr "+attr+" "+val+" objs: "+objs);
    for (id in objs) {
	report("set objs["+id+"]."+attr+" = "+val);
	objs[id][attr] = val;
    }
}


function getTwitterImages(url)
{
    var layer = WV.layers["photos"];
    if (url) {
        WV.keepSending = false;
    }
    else {
        url = layer.imageServer+"imageTweets/?maxNum=10";
        if (WV.prevEndId)
            url += "&prevEndNum="+WV.prevEndId;
    }
    if (layer.billboards == null)
	layer.billboards = {};
    layer.bbCollection = new Cesium.BillboardCollection();
    scene.primitives.add(layer.bbCollection);
    report("downloadImageRecs "+url);
    $.getJSON(url, handleImageRecs)
}

function handleImageRecs(data)
{
    report("handleImageRecs");
    var layer = WV.layers["photos"];
    data.images = data.images.slice(0,100);
    var imageList = data.images;
    for (var i=0; i<imageList.length; i++) {
        layer.numObjs++;
        if (layer.numObjs > layer.maxNum)
            return;
        var ispec = imageList[i];
        //report(" i: "+i+"  "+JSON.stringify(ispec));
	var id = ispec.id;
        WV.prevEndId = id;
        var imageUrl = ispec.imageUrl;
        if (!imageUrl)
            imageUrl = layer.imageServer+"images/twitter_images/"+id+"_p2.jpg";
        //imageUrl = "image1.jpg";
        var lon = ispec.lonlat[0];
        var lat = ispec.lonlat[1];
        var b = addBillboard(layer.bbCollection, lat, lon, imageUrl, id);
        layer.billboards[id] = b;
	b._wvid = id;
	report("ispec: "+JSON.stringify(ispec));
    }
    if (WV.keepSending)				      
        setTimeout(getTwitterImages, 1000);
}


function setupCesium()
{
    // If the mouse is over the billboard, change its scale and color
    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    WV.screenSpaceEventHandler = handler;
    var layerName = "drones";
    //var layerName = "photos";
    handler.setInputAction(function(movement) {
        var pickedObject = scene.pick(movement.endPosition);
	if (!Cesium.defined(pickedObject)) {
            if (WV.currentBillboard)
                WV.currentBillboard.scale = WV.bbScaleUnselected;
            WV.currentBillboard = null;
            return;
        }
	var layer = WV.layers[layerName];
        mpo = pickedObject;
        var id = pickedObject.id;
        report("move over id "+id);
        var b = layer.billboards[id];
        if (WV.currentBillboard && b != WV.currentBillboard) {
            WV.currentBillboard.scale = WV.bbScaleUnselected;
        }
        WV.currentBillboard = b;
        report("b.scale "+b.scale);
        b.scale = WV.bbScaleSelected;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(function(e) {
        report("click.....");
        var pickedObject = scene.pick(e.position);
	if (!Cesium.defined(pickedObject)) {
            return;
        }
        cpo = pickedObject;
        var id = pickedObject.id;
	var layer = WV.layers[layerName];
        report("click picked..... pickedObject._id "+id);
        var rec = layer.recs[id];
        playVid(rec);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
}

function playVid(rec)
{
    var yahooId = rec.yahooId;
    var url = "https://www.youtube.com/watch?v="+yahooId;
    setTimeout(function() {
        window.open(url, "DroneVidioView");
    }, 200);
}

function getLayers()
{
    setupLayers(WV.LAYER_DATA);
}

function setupLayers(layerData)
{
    var layers = layerData.layers;
    var cbList = $("#cbListDiv");
    for (var i=0; i<layers.length; i++) {
        var layer = new WVLayer(layers[i]);
	var name = layer.name;
        var id = "cb_"+layer.name;
        var desc = "View "+layer.description;
        $('<input />',
            { type: 'checkbox', id: id, value: desc,
	      click: toggleLayerCB}).appendTo(cbList);
        $('<label />',
            { 'for': id, text: desc, style: "color:white" }).appendTo(cbList);
        $('<br />').appendTo(cbList);
    }
}

function toggleLayerCB(e)
{
    report("e: "+e.target.id);
    var layer = e.target.id.slice(3);
    report("checked.... "+$("#"+e.target.id).is(":checked"));
    toggleLayer(layer);
}

function toggleLayer(layerName)
{
    report("toggleLayer "+layerName);
    var layer = WV.layers[layerName];
    var id = "cb_"+layerName;
    var checked = $("#"+id).is(":checked");
    report(" checked: "+checked);
    layer.setVisibility(checked);
}

$(document).ready(function() {
   report("Starting...");
   getLayers();
   setupCesium();
});
