
WV.Note = {};

WV.Note.watch = function()
{
    report("**** WV.Note.watch ****");
    var layer = WV.layers["notes"];
    layer.visible = true;
    //layer.hideFun = WV.Notes.hideNotes;
    wvCom.subscribe("notes", WV.Note.handleData);
}

WV.Note.sendNote = function(lon, lat, str)
{
    var msg = getStatusObj();
    msg.type = 'notes';
    msg.id = WV.getUniqueId('note');
    msg.lon = lon;
    msg.lat = lat;
    msg.text = str;
    wvCom.sendNote(msg);
}


// THis code is very generic and should be inherited...
WV.Note.handleData = function(data, layerName)
{
    report("handleNoteData "+JSON.stringify(data));
    var layer = WV.layers[layerName];
    if (layer.recs == null) {
	layer.recs = {};
	layer.billboards = {};
	layer.hideFun = WV.Note.hide,
	layer.pickHandler = WV.Note.pickHandler;
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
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
        var imageUrl = "note.png";
        var lon = rec.lon;
        var lat = rec.lat;
	if (rec.id) {
	    id = layerName+"_"+rec.id;
	}
	else {
	    id = "note_"+layer.numObjs;
	    rec.id = id;
	}
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

WV.Note.pickHandler = function(rec)
{
    report("WV.Note.pickHandler: "+JSON.stringify(rec));
    if (WV.noteWidget == null) {
	WV.noteWidget = new WV.WindowWidget("note");
    }
    WV.noteWidget.setText(rec.text);
    WV.noteWidget.show();
}

WV.Note.hide = function()
{
    WV.Note.setVisibility(false);
}

WV.Note.setVisibility = function(v)
{
    report("WV.Note.setVisibility "+v);
    var layer = WV.layers["notes"];
    //setObjsAttr(layer.billboards, "show", v);
    if (v) {
	WV.noteWidget.show();
    }
    else {
	WV.noteWidget.hide();
    }
}

