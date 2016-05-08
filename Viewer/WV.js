
var WV = {};

WV.screenSpaceEventHandler = null;
WV.layersUrl = "layers.json";
WV.defaultBillboardIconURL = "/images/mona_cat.jpg";
//WV.playInPopup = false;
WV.playInPopup = true;
WV.prevEndId = null;
WV.numBillboards = 0;
WV.bbScaleUnselected = 0.08;
WV.bbScaleSelected = 0.12;
WV.currentBillboard = null;
WV.keepSending = true;
WV.layers = {};
WV.viewer = null;
WV.scene = null;
WV.thisPersonData = null;
WV.origin = [0,0];
WV.curPos = null;
WV.myId = "_anon_"+new Date().getTime();
WV.numPolls = 0;
WV.recs = {};
WV.useSocketIO = false;
WV.statusInterval = 1000;
var wvCom = null;

WV.viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
        url : 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
    }),
    baseLayerPicker : false
});
WV.entities = WV.viewer.entities;
WV.scene = WV.viewer.scene;				 
WV.scene.globe.depthTestAgainstTerrain = true;

/*
WV.LAYER_DATA =
{
    "layers": [
       {
          'name': 'drones',
          'description': 'drone videos',
	  'maxNum': 100,
	  'visible': false,
	  'iconUrl': "drone.png",
	  'mediaType': 'youtube',
	  'dataFile': 'tbd_data.json'
       },
       {
          'name': 'climbing',
          'description': 'rock climbing',
	  'maxNum': 100,
	  'visible': true,
	  'iconUrl': "climber.png",
	  'mediaType': 'youtube',
	  'dataFile': 'climbing_data.json'
       },
       {
          'name': 'hiking',
          'description': 'hiking',
	  'maxNum': 5000,
	  'visible': false,
	  'height': 10000,
	  'iconUrl': "hiking.png",
	  'mediaType': 'youtube',
	  'dataFile': 'hiking_data.json'
       },
       {
          'name': 'surfing',
          'description': 'surfing videos',
	  'maxNum': 8000,
	  'visible': false,
	  'iconUrl': "surfing.png",
	  'mediaType': 'youtube',
	  'dataFile': 'surfing_data.json'
       },
       {
          'name': 'photos',
          'description': 'recently tweeted images',
	  'maxNum': 100,
	  // 'imageServer': 'http://localhost:8001/'
	  'imageServer': '/'
       },
       {
          'name': 'people',
          'description': 'people watching now',
	  'maxNum': 100,
	  'visible': false,
       },
       {
          'name': 'indoorMaps',
          'description': 'indoor maps',
       }
    ]
};
*/

WV.getLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(WV.handleLocation);
    } else {
        report("Geolocation is not supported by this browser.");
    }
}

WV.handleLocation = function(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    WV.origin = [lat,lon];
    WV.curPos = [lat,lon, 1000000];
    report("lat: " + lat + "lon: " + lon);
    report("pos: "+JSON.stringify(position));
    WV.thisPersonData = { 'op': 'create',
			  'id': 'person0',
			  't': getClockTime(),
			  'origin': WV.origin };
}

function WVLayer(spec)
{
    var name = spec.name;
    this.visible = false;
    for (var key in spec) {
	this[key] = spec[key];
    }
    this.showFun = null;
    this.hideFun = null;
    this.spec = spec;
    this.numObjs = 0;
    this.recs = null;
    this.billboards = null;
    this.bbCollection = null;
    this.pickHandler = WV.simplePickHandler;
    WV.layers[name] = this;

    this.loaderFun = function() {
	var layer = WV.layers[this.name];
	var name = this.name;
	if (layer.mediaType == "youtube") {
	    layer.pickHandler = WV.playVid;
	    wvCom.subscribe(name,
			    handleVideoRecs,
			    {dataFile: layer.dataFile});
	}
	if (layer.mediaType == "html") {
	    layer.pickHandler = WV.showPage;
	    wvCom.subscribe(name,
			    handleHTMLRecs,
			    {dataFile: layer.dataFile});
	}
	if (name == "photos")
	    getTwitterImages();
	if (name == "people")
	    WV.watchPeople();
	if (name == "indoorMaps")
	    WV.getIndoorMapData();
	if (name == "chat")
	    WV.watchChat();
    }

    this.setVisibility = function(visible) {
	this.visible = visible;
	report("setVisibility "+this.name+" "+visible);
	if (visible) {
	    if (this.showFun) {
		//report("calling showFun for "+this.name);
		this.showFun();
	    }
	    if (this.billboards == null) {
		this.loaderFun();
	    }
	    else {
		setObjsAttr(this.billboards, "show", true);
	    }
	}
	else {
	    if (this.hideFun) {
		report("calling hideFun for "+this.name);
		this.hideFun();
	    }
	    setObjsAttr(this.billboards, "show", false);
	}
        var id = "cb_"+this.name;
	$("#"+id).prop('checked', this.visible);
    }
}

function report(str)
{
    console.log(str);
}

function addBillboard(bbCollection, lat, lon, imgUrl, id, scale, height)
{
    WV.numBillboards++;
    report("Adding billboard "+WV.numBillboards);
    // Example 1:  Add a billboard, specifying all the default values.
    if (!imgUrl)
	imgUrl = WV.defaultBillboardIconURL;
    if (!scale)
       scale = WV.bbScaleUnselected;
    if (!height)
       height = 100000;
    var b = bbCollection.add({
       show : true,
       position : Cesium.Cartesian3.fromDegrees(lon, lat, height),
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

function handleVideoRecs(data, layerName)
{
    report("handleVideoRecs "+layerName);
    var layer = WV.layers[layerName];
    layer.recs = {};
    layer.billboards = {};
    layer.bbCollection = new Cesium.BillboardCollection();
    WV.scene.primitives.add(layer.bbCollection);
    var recs = null;
    try {
	recs = data.records;
    }
    catch (err) {
	recs = data;
    }
    if (recs == null)
	recs = data;
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	rec.layerName = layerName;
	if (!rec.youtubeId) {
            report("skipping recs with no youtube video");
        }
        if (!rec.youtubeId)
            continue;
        layer.numObjs++;
        if (layer.numObjs > layer.maxNum)
            return;
        var imageUrl = layer.iconUrl;
        var lon = rec.lon;
        var lat = rec.lat;
        id = layerName+"_"+rec.id;
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	scale = WV.bbScaleUnselected;
	h = 100000;
	if (layer.height)
	    h = layer.height;
        var b = addBillboard(layer.bbCollection, lat, lon, imageUrl, id, scale, h);
        layer.billboards[id] = b;
    }
}


function setObjsAttr(objs, attr, val)
{
    report("setObjsAttr "+attr+" "+val+" objs: "+objs);
    for (id in objs) {
	//report("set objs["+id+"]."+attr+" = "+val);
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
    WV.scene.primitives.add(layer.bbCollection);
    wvCom.subscribe("photos", handleImageRecs);
}

//function handleImageRecs(data)
function handleImageRecs(recs)
{
    report("handleImageRecs");
    var layer = WV.layers["photos"];
    var imageList = recs;
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
}

function handleHTMLRecs(data, layerName)
{
    report("*** handleHTMLRecs "+layerName);
    var layer = WV.layers[layerName];
    layer.recs = {};
    layer.billboards = {};
    layer.bbCollection = new Cesium.BillboardCollection();
    WV.scene.primitives.add(layer.bbCollection);
    var recs = null;
    try {
	recs = data.records;
    }
    catch (err) {
	recs = data;
    }
    if (recs == null)
	recs = data;
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	rec.layerName = layerName;
        layer.numObjs++;
        if (layer.numObjs > layer.maxNum)
            return;
        var imageUrl = layer.iconUrl;
        var lon = rec.lon;
        var lat = rec.lat;
        id = layerName+"_"+rec.id;
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	scale = WV.bbScaleUnselected;
	h = 100000;
	if (layer.height)
	    h = layer.height;
        var b = addBillboard(layer.bbCollection, lat, lon, imageUrl, id, scale, h);
        layer.billboards[id] = b;
    }
}

function setupCesium()
{
    // If the mouse is over the billboard, change its scale and color
    var handler = new Cesium.ScreenSpaceEventHandler(WV.scene.canvas);
    WV.screenSpaceEventHandler = handler;
    var layerName = "drones";
    //var layerName = "photos";
    handler.setInputAction(function(movement) {
        var pickedObject = WV.scene.pick(movement.endPosition);
	if (!Cesium.defined(pickedObject)) {
            if (WV.currentBillboard)
                WV.currentBillboard.scale = WV.bbScaleUnselected;
            WV.currentBillboard = null;
            return;
        }
        mpo = pickedObject;
        var id = pickedObject.id;
	var rec = WV.recs[id];
	if (rec == null) {
	    report("***** setupCesium no rec for id: "+id);
	    return;
	}
	var layerName = WV.recs[id].layerName;
	var layer = WV.layers[layerName];
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
        var pickedObject = WV.scene.pick(e.position);
	if (!Cesium.defined(pickedObject)) {
            return;
        }
        cpo = pickedObject;
        var id = pickedObject.id;
	var layerName = WV.recs[id].layerName;
	var layer = WV.layers[layerName];
        report("click picked..... pickedObject._id "+id);
        var rec = layer.recs[id];
	layer.pickHandler(rec);
        //WV.playVid(rec);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
}

WV.playVidInPopup = function(rec)
{
    var youtubeId = rec.youtubeId;
    var url = "https://www.youtube.com/watch?v="+youtubeId;
    setTimeout(function() {
        window.open(url, "DroneVidioView");
    }, 400);
}

WV.playVidInIFrame = function(rec)
{
    var youtubeId = rec.youtubeId;
    WVYT.playVideo(youtubeId);
    /*
    var url = "https://www.youtube.com/watch?v="+youtubeId;
    setTimeout(function() {
        window.open(url, "DroneVidioView");
    }, 400);
    */
}

WV.playVid = function(rec)
{
    if (WV.playInPopup)
	WV.playVidInPopup(rec);
    else
	WV.playVidInIFrame(rec);
}

WV.showPage = function(rec)
{
    report("show page: "+JSON.stringify(rec));
    setTimeout(function() {
        window.open(rec.url, "HTMLPages");
    }, 400);
}

WV.simplePickHandler = function(rec)
{
    report("picked record: "+JSON.stringify(rec));
}

/*
  Use this instead of $.getJSON() because this will give
  an error message in the console if there is a parse error
  in the JSON.
 */
WV.getJSON = function(url, handler)
{
    report(">>>>> getJSON: "+url);
    //$.getJSON(url, function(data) {
    //   //report(">>>> got data... calling handler");
    //   handler(data);
    //});
    $.ajax({
        url: url,
	dataType: 'text',
	success: function(str) {
		data = JSON.parse(str);
		handler(data);
	    }
	});
}

/*
  This loads the layer information, and then sets up the GUI
  to show those layers.  For now the layer information is hard
  coded into this program, but could be loaded from the server
  and user specific.
 */
function getLayers()
{
    //$.getJSON(WV.layersUrl, setupLayers);
    WV.getJSON(WV.layersUrl, setupLayers);
    //setupLayers(WV.LAYER_DATA);
}

/*
  This creates the Jquery UI for showing layers with checkboxes.
 */
function setupLayers(layerData)
{
    var layers = layerData.layers;
    var layersDiv = $("#layersDiv");
    var cbList = $('<div />', { type: 'div', id: 'cbListDiv'}
                   ).appendTo(layersDiv);
    //var cbList = $("#cbListDiv");
    for (var i=0; i<layers.length; i++) {
        var layer = new WVLayer(layers[i]);
	var name = layer.name;
        var id = "cb_"+layer.name;
        var desc = layer.description;
        $('<input />',
            { type: 'checkbox', id: id, value: desc,
	      click: toggleLayerCB}).appendTo(cbList);
        $('<label />',
            { 'for': id, text: desc, style: "color:white" }).appendTo(cbList);
        $('<br />').appendTo(cbList);
    }
    $("#layersLabel").click(function(e) {
	    report("******** click *******");
            var txt = $("#layersLabel").html();
            report("txt: "+txt);
	    if (txt == "Hide Layers") {
		$("#layersLabel").html("Show Layers");
		cbList.hide();
	    }
	    else {
		$("#layersLabel").html("Hide Layers");
		cbList.show();
	    }
	});

    for (var i=0; i<layers.length; i++) {
        var layer = WV.layers[layers[i].name];
	if (layer.visible) {
	    layer.setVisibility(true);
	}
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

function getClockTime()
{
    return new Date().getTime()/1000.0;
}

function toDegrees(r)
{
    return r*180/Math.PI;
}

function toRadians(d)
{
    return d*Math.PI/180;
}

function getStatusObj()
{
    WV.numPolls++;
    var cpos = WV.viewer.camera.positionCartographic;
    var clat = toDegrees(cpos.latitude);
    var clon = toDegrees(cpos.longitude);
    WV.curPos = [clat, clon, cpos.height];
    var t = getClockTime();
    var status = {
	'type': 'people',
	'id': WV.myId,
	'origin': WV.origin,
	'curPos': WV.curPos,
	't': t,
	'n': WV.numPolls};
    return status;
}

function reportStatus()
{
//    report("reportStatus");
    var status = getStatusObj();
    wvCom.sendStatus(status);
    setTimeout(reportStatus, WV.statusInterval);
}

$(document).ready(function() {
    report("Starting...");
    wvCom = new WV.WVCom();
    getLayers();
    setupCesium();
    WV.getLocation();
    setTimeout(reportStatus, WV.statusInterval);
});
