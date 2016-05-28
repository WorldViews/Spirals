/*
  In TeleViewer, a layer is a collection of information that is logically grouped together
  and may be turned on (made visible) or off as a collection.  When on, items of data in
  the layer may be visually presented as billboards, images, etc.  Those depitons may have
  some behaviors, such as enlargement on mouse over, launching video windows on click, etc.

  Each type of layer is implemented as a LayerType, which is a set of handlers and functions
  for presenting the items and handling UI interactions.  The LayerType also has a data
  handler for processing records in files or incoming streams of objects associated with
  that type of layer.

  Each layer is assigned a type, which handles interactions for that layer.

  When TeleViewer is run, a layers file is read which defines the layers that the user
  can choose from.  The each layer has a name and a type (maybe implicit).
*/

WV.layerTypes = {};
WV.layers = {};

WV.LayerType = function(name, opts)
{
    this.name = name;
    WV.layerTypes[name] = this;
    this.dataHandler = opts.dataHandler;
    this.clickHandler = opts.clickHandler;
    this.setVisibility = opts.setVisibility;
    if (!this.dataHandler)
	report("*** Warning LayerType "+name+"  no dataHandler");
    if (!this.clickHandler)
	report("*** Warning LayerType "+name+"  no clickHandler");
}

WV.registerLayerType = function(name, opts)
{
    report("WV.registerLayerType "+name+" "+JSON.stringify(opts));
    return new WV.LayerType(name, opts);
}


WV.Layer = function(spec)
{
    var name = spec.name;
    this.visible = false;
    this.scale = 0.2;
    this.height = 100000;
    this.showTethers = false;
    for (var key in spec) {
	this[key] = spec[key];
    }
    this.initializedLoad = false;
    this.showFun = null;
    this.hideFun = null;
    this.spec = spec;
    this.numObjs = 0;
    this.recs = null;
    this.billboards = null;
    this.bbCollection = null;
    this.pickHandler = WV.simplePickHandler;
    this.clickHandler = WV.simpleClickHandler;
    WV.layers[name] = this;
    this.layerType = null;
    if (!this.mediaType) { // Is this a good idea?  Maybe its too loose.
	report("***** No mediaType for layer "+name+" using mediaType="+name);
	this.mediaType = name;
    }
    if (this.mediaType) {
	this.layerType = WV.layerTypes[this.mediaType];
    }
    else {
	report("***** No mediaType for layer "+name);
    }

    this.loaderFun = function() {
	if (this.initializedLoad) {
	    report("already initializedLoad for layer "+this.name);
	    return;
	}
	var layer = WV.layers[this.name];
	var name = this.name;
	var layerType = this.layerType;
	if (layerType) {
	    layer.clickHandler = layerType.clickHandler;
	    report(">>>>>>>> subscribe "+name+" "+this.layerType.name);
	    wvCom.subscribe(name, layerType.dataHandler, {dataFile: layer.dataFile});
	}
	else {
	    report("**** no LayerType for "+name);
	}
	if (name == "photos")
	    WV.getTwitterImages();
	this.initializedLoad = true;
    }

    this.setVisibility = function(visible) {
	if (!this.initializedLoad)
	    this.loaderFun();
	if (this.layerType && this.layerType.setVisibility) {
	    report("***** Using override setVisibility function ******");
	    this.layerType.setVisibility(visible);
	    return;
	}
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
		WV.setBillboardsVisibility(this.billboards, true, this.showTethers);
	    }
	}
	else {
	    if (this.hideFun) {
		report("calling hideFun for "+this.name);
		this.hideFun();
	    }
	    WV.setBillboardsVisibility(this.billboards, false);
	}
        var id = "cb_"+this.name;
	$("#"+id).prop('checked', this.visible);
    }
}


WV.handleVideoRecs = function(data, layerName)
{
    report("handleVideoRecs "+layerName);
    var layer = WV.layers[layerName];
    layer.recs = {};
    layer.billboards = {};
    layer.bbCollection = new Cesium.BillboardCollection();
    WV.scene.primitives.add(layer.bbCollection);
    var recs = WV.getRecords(data);
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
        var b = WV.addBillboard(layer.bbCollection, lat, lon, imageUrl, id,
				layer.scale, layer.height, layer.showTethers);
        layer.billboards[id] = b;
    }
}


WV.handleHTMLRecs = function(data, layerName)
{
    report("*** handleHTMLRecs "+layerName);
    //report("data:\n"+WV.toJSON(data));
    var layer = WV.layers[layerName];
    if (layer.recs == null) {
	layer.recs = {};
	layer.billboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    var recs = WV.getRecords(data);
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	report("rec:\n"+WV.toJSON(rec));
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
	h = 100000;
	if (layer.height)
	    h = layer.height;
        var b = WV.addBillboard(layer.bbCollection, lat, lon, imageUrl,
				id, layer.scale, h, layer.showTethers);
        layer.billboards[id] = b;
    }
}

/*
  This loads the layer information, and then sets up the GUI
  to show those layers.  For now the layer information is hard
  coded into this program, but could be loaded from the server
  and user specific.
 */
WV.getLayers = function()
{
    //$.getJSON(WV.layersUrl, setupLayers);
    WV.getJSON(WV.layersUrl, WV.setupLayers);
    //setupLayers(WV.LAYER_DATA);
}

/*
  This creates the Jquery UI for showing layers with checkboxes.
 */
WV.setupLayers = function(layerData)
{
    var layers = layerData.layers;
    var layersDiv = $("#layersDiv");
    var cbList = $('<div />', { type: 'div', id: 'cbListDiv'}
                   ).appendTo(layersDiv);
    //var cbList = $("#cbListDiv");
    for (var i=0; i<layers.length; i++) {
        var layer = new WV.Layer(layers[i]);
	var name = layer.name;
        var id = "cb_"+layer.name;
        var desc = layer.description;
        $('<input />',
            { type: 'checkbox', id: id, value: desc,
	      click: WV.Layer.toggleCB}).appendTo(cbList);
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
		cbList.hide(100);
	    }
	    else {
		$("#layersLabel").html("Hide Layers");
		cbList.show(100);
	    }
	});

    for (var i=0; i<layers.length; i++) {
        var layer = WV.layers[layers[i].name];
	if (layer.visible) {
	    layer.setVisibility(true);
	}
    }
}

WV.Layer.toggleCB = function(e)
{
    report("e: "+e.target.id);
    var layer = e.target.id.slice(3);
    report("checked.... "+$("#"+e.target.id).is(":checked"));
    WV.Layer.toggle(layer);
}

WV.Layer.toggle = function(layerName)
{
    report("toggleLayer "+layerName);
    var layer = WV.layers[layerName];
    var id = "cb_"+layerName;
    var checked = $("#"+id).is(":checked");
    report(" checked: "+checked);
    layer.setVisibility(checked);
}


$(document).ready(function() {
    new WV.LayerType("youtube", {
         dataHandler: WV.handleVideoRecs,
	 clickHandler: WV.playVid
    });
    new WV.LayerType("html", {
         dataHandler: WV.handleHTMLRecs,
         clickHandler: WV.showPage
    });
});


