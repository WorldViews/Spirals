
var WV = {};

WV.screenSpaceEventHandler = null;
WV.layersUrl = "data/layers.json";
WV.defaultBillboardIconURL = "/images/mona_cat.jpg";
WV.playVideoInIframe = false;
WV.showPagesInIframe = true;
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
WV.myName = "anon";
WV.numPolls = 0;
WV.recs = {};
WV.useSocketIO = false;
WV.statusInterval = 1000;
var wvCom = null;

WV.viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
        url : 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
	enablePickFeatures: false
    }),
    animation: false,
    timeline : false,
    //animation: true,
    //timeline : true,
    baseLayerPicker : false
});
WV.entities = WV.viewer.entities;
WV.scene = WV.viewer.scene;				 
WV.scene.globe.depthTestAgainstTerrain = true;

WV.toJSON = function(obj) { return JSON.stringify(obj, null, 3); }

WV.getUniqueId = function(name)
{
    if (!name)
	name = "obj";
    var id = name+"_"+ new Date().getTime()+"_"+Math.floor(10000*Math.random());
    return id;
}

WV.getRecords = function(v)
{
    if (v instanceof Array)
	return v;
    return v.records;
}

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
			  't': WV.getClockTime(),
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
	if (name == "notes")
	    WV.Note.watch();
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
       scale : scale,
       image : imgUrl,
       color : Cesium.Color.WHITE,
       id : id
    });
    return b;
}

//http://stackoverflow.com/questions/24869733/how-to-draw-custom-dynamic-billboards-in-cesium-js
WV.addSVGBillboard = function(text, lon, lat, h, size)
{
   // create the svg image string
   if (h == null)
	h = 1000000;
   var width = 100;
   var height = 100;
   if (size) {
       width = size;
       height = size;
   }
   var cx = Math.floor(width/2);
   var cy = Math.floor(height/2);
   var r = Math.floor(0.45*width);
   var svgDataDeclare = "data:image/svg+xml,";
   var svgPrefix = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="|WIDTH|px" height="|HEIGHT|px" xml:space="preserve">';
   var svgSuffix = "</svg>";
   var svgCircle1 = '<circle cx="|CX|" cy="|CY|" r="|R|" stroke="black" stroke-width="3" fill="red" /> ';
   var svgText1   = '<text x="5" y="|CY|">|TEXT|</text>\n ';
   var svgString = svgPrefix + svgCircle1 + svgText1 + svgSuffix;
   svgString = svgString.replace("|CX|", ""+cx);
   svgString = svgString.replace("|CY|", ""+cy);
   svgString = svgString.replace("|CY|", ""+cy);
   svgString = svgString.replace("|R|", ""+r);
   svgString = svgString.replace("|WIDTH|", width);
   svgString = svgString.replace("|HEIGHT|", height);
   svgString = svgString.replace("|TEXT|", text);
   
   // create the cesium entity
   var svgEntityImage = svgDataDeclare + svgString;
   report("svgString: "+svgString);
   var pos = Cesium.Cartesian3.fromDegrees(lon, lat, h);
   report(" pos: "+JSON.stringify(pos));
   WV.viewer.entities.add({
	   position: pos,
           billboard: { image: svgEntityImage }
     });

   // test the image in a dialog
   /*
   $("#dialog").html(svgString );
   $("#dialog").dialog({
                 position: {my: "left top", at: "left bottom"}
       });
   */
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

    // Tried this to get rid of default action of looking for feature
    // but it didn't work.
    //handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function(e) {
	    report("LEFT_CLICK e: "+JSON.stringify(e));
	    //WV.viewer.trackedEntity = undefined;
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function(e) {
	    report("LEFT_DOUBLE_CLICK e: "+JSON.stringify(e));
	    WV.handleNoteClick(e);
	    //WV.viewer.trackedEntity = undefined;
	    //WV.hideAnimationWidget();
	}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

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
    if (WV.playVideoInIframe)
	WV.playVidInIFrame(rec);
    else
	WV.playVidInPopup(rec);
}

WV.showPage = function(rec)
{
    report("show page: "+JSON.stringify(rec));
    setTimeout(function() {
	    if (WV.showPagesInIframe) {
		WV.pageWidget.show();
		WV.pageWidget.setSrc(rec.url);
	    }
	    else {
		window.open(rec.url, "HTMLPages");
	    }
    }, 300);
}

WV.handleNoteClick = function(e)
{
    report("handleClick e: "+JSON.stringify(e));
    var cartesian = WV.viewer.camera.pickEllipsoid(e.position, WV.scene.globe.ellipsoid);
    if (cartesian) {
	var gpos = Cesium.Cartographic.fromCartesian(cartesian);
	var lon = Cesium.Math.toDegrees(gpos.longitude);
	var lat = Cesium.Math.toDegrees(gpos.latitude);
	report("picked: "+lon+" "+lat);
	WV.Note.sendNote(lon, lat, "This is a note made at "+new Date());
    }
    else {
	report("no intersect...");
    }
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

WV.getClockTime = function()
{
    return new Date().getTime()/1000.0;
}

function getClockTime()
{
    report("**********************************************");
    report("*** change getClockTIme to WV.getClockTime ***");
    report("**********************************************");
    return WV.getClockTime();
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
    var t = WV.getClockTime();
    var status = {
	'type': 'people',
	'userId': WV.myId,
	'name': WV.myName,
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

// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

WV.hideAnimationWidget = function()
{
    if (WV.viewer.animation)
	WV.viewer.animation.destroy();
    if (WV.viewer.timeline)
	WV.viewer.timeline.destroy();
}

$(document).ready(function() {
    report("Starting...");
    wvCom = new WV.WVCom();
    var userName = getParameterByName("user", document.location.search);
    report("*********************** userName: "+userName);
    if (userName) {
	WV.myName = userName;
    }
    getLayers();
    setupCesium();
    WV.getLocation();
    setTimeout(reportStatus, WV.statusInterval);
    //WV.addSVGBillboard("Miami", -80.12, 25.46, 1000000, 50);
    //WV.addSVGBillboard("Over Miami", -80.2, 25.46, 10000);
    //WV.addSVGBillboard("Midwest", -100.12, 35.46, 1000000);
});
