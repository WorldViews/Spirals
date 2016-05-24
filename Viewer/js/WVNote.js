
WV.Note = {};
WV.noteWidget = null;
WV.Note.currentNote = null;

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
    return msg;
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
    var recs = WV.getRecords(data);
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	rec.layerName = layerName;
        layer.numObjs++;
        if (layer.numObjs > layer.maxNum)
            return;
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
        var imageUrl = "images/note.png";
	if (rec.comments) {
	    report("comments:" + JSON.stringify(rec.comments));
	    //scale *= rec.comments.length;
	    var imageUrl = "images/noteWithReply.png";
	    //scale *= 2;
	}
	h = 100000;
	if (layer.height)
	    h = layer.height;
        var b = layer.billboards[id];
	if (b != null) {
	    b.show = false; //TODO: delete it...
	}
	if (1) {
	    b = addBillboard(layer.bbCollection, lat, lon, imageUrl, id, scale, h);
	}
	else {
	    var color = "rgb(250,250,0)";
	    if (rec.comments)
		color = "rgb(200,160,50)";
	    var opts = {text: rec.text, h: h, width: 200, height: 30, color: color}
	    var b = WV.addSVGBillboard(lon, lat, opts);
	}
	report("b: "+b);
        layer.billboards[id] = b;
	if (WV.noteWidget && WV.noteWidget.noteId == rec.id) {
	    WV.Note.pickHandler(rec);
	}
    }
}

WV.Note.postComment = function(text)
{
    report("**** postComment: "+text);
    var w = WV.noteWidget;
    var noteId = w.noteId;
    if (noteId == null) { // This is a brand new note...
	msg = WV.Note.sendNote(w.lon, w.lat, text);
	w.noteId = msg.id;
    }
    else { // This is a comment on existing note...
	var url = "/comment/notes?parent="+noteId+"&comment="+text;
	report("url: "+url);
	WV.getJSON(url, function(x) { 
		report("post successful");
	    });
    }
}

WV.Note.getNoteWidget = function()
{
    if (WV.noteWidget == null) {
	WV.noteWidget = new WV.WindowWidget("note");
	WV.noteWidget.noteId = null;
	WV.noteWidget.handleInput = WV.Note.postComment;
    }
    return WV.noteWidget;
}

WV.Note.pickHandler = function(rec)
{
    report("WV.Note.pickHandler: "+JSON.stringify(rec));
    WV.Note.getNoteWidget();
    var text = rec.text;
    text += '<hr style="margin-left:5px;width:80%;">\n';
    if (rec.comments) {
	for (var i=0; i<rec.comments.length; i++) {
	    var comment = rec.comments[i];
	    var ctext = comment;
	    text = text + "<br>\n" + ctext;
	    text += '<hr style="margin-left:5px;width:20%;">\n';
	}
    }
    WV.noteWidget.setText(text);
    WV.noteWidget.noteId = rec.id;
    WV.noteWidget.show();
}

WV.Note.initNote = function(lon, lat)
{
    var w = WV.Note.getNoteWidget();
    w.setText("");
    w.noteId = null;
    w.lon = lon;
    w.lat = lat;
    w.show();
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
    if (!WV.noteWidget)
	return;
    if (v) {
	WV.noteWidget.show();
    }
    else {
	WV.noteWidget.hide();
    }
}

