
var WV = {};

WV.imageServer = "http://localhost:8001/";
WV.prevEndId = null;
WV.numDrones = 0;
WV.MAX_NUM_DRONES = 30;
WV.numPhotos = 0;
WV.MAX_NUM_PHOTOS = 30;
WV.numBillboards = 0;
WV.handler = null;
WV.bbScaleUnselected = 0.08;
WV.bbScaleSelected = 0.12;
WV.currentBillboard = null;
WV.keepSending = true;
WV.LAYERS = ["drone", "photos"];
WV.DRONE_RECS = null;
WV.DRONE_BILLBOARDS = {};
WV.PHOTO_BILLBOARDS = null;

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
//var billboards = scene.primitives.add(new Cesium.BillboardCollection());
var droneBillboards = null;
var twitterBillboards = null;
//var billboards = new Cesium.BillboardCollection();
//scene.primitives.add(billboards);

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
    WV.DRONE_RECS = {};
    WV.DRONE_BILLBOARDS = {};
    droneBillboards = new Cesium.BillboardCollection();
    scene.primitives.add(droneBillboards);
    var recs = data;
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	if (!rec.yahooId) {
            report("skipping recs with no yahoo video");
        }
        report("rec "+i+" "+JSON.stringify(rec));
        if (!rec.yahooId)
            continue;
        WV.numDrones++;
        if (WV.numDrones > WV.MAX_NUM_DRONES)
            return;
        var imageUrl = "drone.png";
        var lon = rec.lon;
        var lat = rec.lat;
        id = "tbd_"+rec.id;
        WV.DRONE_RECS[id] = rec;
        var b = addBillboard(droneBillboards, lat, lon, imageUrl, id);
        WV.DRONE_BILLBOARDS[id] = b;
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

function setDroneVisibility(visible)
{
    if (visible) {
	if (WV.DRONE_RECS == null) {
	    getDroneVids("tbd_data.json");
	}
	else {
	    setObjsAttr(WV.DRONE_BILLBOARDS, "show", true);
	}
    }
    else {
	setObjsAttr(WV.DRONE_BILLBOARDS, "show", false);
	/*
	scene.primitives.remove(droneBillboards);
        WV.DRONE_RECS = null;
	droneBillboards = null;
	*/
	//billboards = new Cesium.BillboardCollection();
	//scene.primitives.add(billboards);
    }
}



function getTwitterImages(url)
{
    if (url) {
        WV.keepSending = false;
    }
    else {
        url = WV.imageServer+"imageTweets/?maxNum=10";
        if (WV.prevEndId)
            url += "&prevEndNum="+WV.prevEndId;
    }
    if (WV.PHOTO_BILLBOARDS == null)
	WV.PHOTO_BILLBOARDS = {};
    twitterBillboards = new Cesium.BillboardCollection();
    scene.primitives.add(twitterBillboards);
    report("downloadImageRecs "+url);
    $.getJSON(url, handleImageRecs)
}

function handleImageRecs(data)
{
    report("handleImageRecs");
    data.images = data.images.slice(0,100);
    var imageList = data.images;
    for (var i=0; i<imageList.length; i++) {
        WV.numPhotos++;
        if (WV.numPhotos > WV.MAX_NUM_PHOTOS)
            return;
        var ispec = imageList[i];
        //report(" i: "+i+"  "+JSON.stringify(ispec));
	var id = ispec.id;
        WV.prevEndId = id;
        var imageUrl = ispec.imageUrl;
        if (!imageUrl)
            imageUrl = WV.imageServer+"images/twitter_images/"+id+"_p2.jpg";
        //imageUrl = "image1.jpg";
        var lon = ispec.lonlat[0];
        var lat = ispec.lonlat[1];
        var b = addBillboard(twitterBillboards, lat, lon, imageUrl, id);
        WV.PHOTO_BILLBOARDS[id] = b;
	b._wvid = id;
	report("ispec: "+JSON.stringify(ispec));
    }
    if (WV.keepSending)				      
        setTimeout(getTwitterImages, 1000);
}

function setPhotoVisibility(visible)
{
    report("setPhotoVisibility "+visible);
    if (visible) {
	if (WV.PHOTO_BILLBOARDS == null) {
	    getTwitterImages();
	}
	else {
	    setObjsAttr(WV.PHOTO_BILLBOARDS, "show", true);
	}
    }
    else {
	setObjsAttr(WV.PHOTO_BILLBOARDS, "show", false);
    }
}


function setupCesium()
{
    // If the mouse is over the billboard, change its scale and color
    WV.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    WV.handler.setInputAction(function(movement) {
        var pickedObject = scene.pick(movement.endPosition);
	if (!Cesium.defined(pickedObject)) {
            if (WV.currentBillboard)
                WV.currentBillboard.scale = WV.bbScaleUnselected;
            WV.currentBillboard = null;
            return;
        }
        mpo = pickedObject;
        var id = pickedObject.id;
        report("move over id "+id);
        var b = WV.DRONE_BILLBOARDS[id];
        if (WV.currentBillboard && b != WV.currentBillboard) {
            WV.currentBillboard.scale = WV.bbScaleUnselected;
        }
        WV.currentBillboard = b;
        report("b.scale "+b.scale);
        b.scale = WV.bbScaleSelected;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    WV.handler.setInputAction(function(e) {
        report("click.....");
        var pickedObject = scene.pick(e.position);
	if (!Cesium.defined(pickedObject)) {
            return;
        }
        cpo = pickedObject;
        var id = pickedObject.id;
        report("click picked..... pickedObject._id "+id);
        var rec = WV.DRONE_RECS[id];
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


function setupLayers()
{
    var layers = WV.LAYERS;
    var cbList = $("#cbListDiv");
    for (var i=0; i<layers.length; i++) {
        var layer = layers[i];
        var id = "cb_"+layer;
        var desc = "View "+layer;
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

function toggleLayer(layer)
{
    report("toggleLayer "+layer);
    var id = "cb_"+layer;
    var checked = $("#"+id).is(":checked");
    report(" checked: "+checked);
    if (layer == "drone")
	setDroneVisibility(checked);
    if (layer == "photos")
	setPhotoVisibility(checked);
}

$(document).ready(function() {
   report("Starting...");
   setupCesium();
   setupLayers();
});
