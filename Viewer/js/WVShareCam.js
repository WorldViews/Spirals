
WV.ShareCam = {};

WV.ShareCam.initLayer = function(layer)
{
    report("layer: "+WV.toJSON(layer));
    report("initing PeopleData layer");
    layer.recs = {};
    layer.billboards = {};
    layer.bbCollection = new Cesium.BillboardCollection();
    WV.scene.primitives.add(layer.bbCollection);
    layer.showFun = function() {
	if (!WV.ShareCam.keepPolling) {
	    WV.ShareCam.keepPolling = true;
	    WV.ShareCam.watchForPics(layer);
	}
    }
}

WV.ShareCam.handleData = function(data, layerName)
{
    report("handleShareCamData");
    var layer = WV.layers["sharecam"];
    if (!WV.ShareCam.keepPolling) {
	WV.ShareCam.keepPolling = true;
	WV.ShareCam.watchForPics();
    }
    if (!layer.visible) {
	return;
    }
    //WV.setPeopleVisibility(true);
    //    WV.setTethersVisibility(true);
    //    WV.setPeopleBillboardsVisibility(true);
    /*
    if (layer.recs == null) {
	report("initing PeopleData layer");
	layer.recs = {};
	layer.billboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    */
    //var curPosImageUrl = "eagle1.png";
    var iconUrl = layer.iconUrl;
    if (!iconUrl)
	iconUrl = "jumpChat.png";
    report("data: "+JSON.stringify(data));
    //var recs = WV.getRecords(data);
    var recs = data;
    var t = WV.getClockTime();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	report("***************** rec: "+JSON.stringify(rec));
        layer.numObjs++;
	var dt = t - rec.t;
	if (dt > WV.shownUserTimeout) {
	    report("ignoring view that is too old...");
	    continue;
	}
        var lat =   rec.lat;
        var lon =   rec.lon;
	var scale = 0.1;
	var height = 300000;
        var id = "sharecam_"+rec.sessionId;
	rec.layerName = layerName;
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	var b = layer.billboards[id];
	if (b == null) {
	    var ob = WV.addBillboard(layer.bbCollection, lat, lon,
				    iconUrl, id, scale, height);
	    layer.billboards[id] = ob;
	}
	else {
	    report("billboard exists "+id);
	    var pos = Cesium.Cartesian3.fromDegrees(lon, lat, height);
	    layer.billboards[id].position = pos;
	}
    }
    /*
    for (var id in layer.recs) {
	var rec = layer.recs[id];
	var dt = t - rec.t;
	report("dt: "+dt);
	if (dt < WV.shownUserTimeout) {
	    report("skipping new views...");
	    continue;
	}
	//TODO: Should actually delete these, not just hide them
	layer.billboards[id].show = false;
    }
    */
}

WV.ShareCam.handleClick = function(rec)
{
    report("ShareCam.handleClick "+JSON.stringify(rec));
    var room = rec.room;
    if (room == null || room == "null") {
	report("No room.... nothing to do");
	return;
    }
    var url = "https://jumpchat.paldeploy.com/sharedcam/?room="+room;
    report("ShareCam.JumpChat url: "+url);
    setTimeout(function() {
		window.open(url, "JumpChat");
	}, 200);
}

/******************************************************************
 This stuff below was added as a hack, and doesn't follow the same
 overal event notification scheme as the other stuff.  It has the
 client poll for new pictures.
 ******************************************************************/

WV.ShareCam.newest_photo_hash = "";
WV.ShareCam.hashes = {};
WV.ShareCam.keepPolling = false;

WV.ShareCam.watchForPics = function(layer)
{
    report("WV.ShareCam.watchForPics...");
    //var layer = WV.layers["sharecam"];
    var fetchRecentUrl = "https://sharedcam.paldeploy.com/recent/" +
                               WV.ShareCam.newest_photo_hash + "?json=true";
                WV.getJSON( fetchRecentUrl, function(data) {
		    try{ 
			WV.ShareCam.handleShareCamData(data, layer);
		    }
		    catch (err) {
			report("error: "+err);
		    }
		    if (WV.ShareCam.keepPolling)
			setTimeout(function() {
				WV.ShareCam.watchForPics(layer)}, 4000);
	        });
}


WV.ShareCam.handleShareCamData = function( objs, layer ) {
      var layerName = layer.name;
      report("WV.ShareCam.handleShareCamData "+layerName);
      var t0 = WV.getClockTime();
      for(var i=0; i<objs.length; i++) {
          var obj = objs[i];
          var hash = obj.hash;
          if (WV.ShareCam.hashes[hash])
              continue;
          WV.ShareCam.hashes[hash] = obj;
          var metadata = obj.metadata;
          //report("metadata: "+metadata);
          try {
              metadata = JSON.parse(metadata);
          }
          catch (e) {
	     report("error for obj "+i+" hash: "+hash);
             continue;
          }
          var lat = metadata.latitude;
          var lon = metadata.longitude;
          report("obj "+i+": "+JSON.stringify(obj));
	  var dateUploadedStr = obj.date_uploaded;
	  report("dateUploadedStr: "+dateUploadedStr);
	  var t = new Date(dateUploadedStr).getTime()/1000.0;
	  report("t: "+t);
	  var age = t0 - t;
	  var ageInDays = age/(24*60*60);
	  report("ageInDays: "+ageInDays);
	  if (ageInDays > 60) {
	      report("Picture too old... skipping...");
	      continue;
	  }
          //report("meta: " + JSON.stringify(metadata));
          //report("latLon: "+lat+" "+lon);
          if (!lat || !lon)
             continue;
	  rec = obj;
	  rec.t = t0;
	  rec.layerName = layerName;
          report("obj "+i+" lat: "+lat+" lon: "+lon+" hash: "+hash);
          var imgUrl = "https://sharedcam.paldeploy.com/thumb/" + hash;
          report("imgUrl "+imgUrl);
	  var id = "scp_"+hash;
	  layer.recs[id] = rec;
	  WV.recs[id] = rec;
	  var b = layer.billboards[id];
	  scale = .6;
	  //height = 1500000;
	  height = 10000;
	  if (b == null) {
	      var ob = WV.addBillboard(layer.bbCollection, lat, lon,
				       imgUrl, id, scale, height);
	    layer.billboards[id] = ob;
	  }
	  else {
	      report("billboard exists "+id);
	      var pos = Cesium.Cartesian3.fromDegrees(lon, lat, height);
	      layer.billboards[id].position = pos;
	  }
      }
      //console.log( "Load was performed. New max content id", WV.ShareCam.newest_photo_hash );
}


$(document).ready(function() {
    WV.registerLayerType("sharecam", {
         initFun: WV.ShareCam.initLayer,
         dataHandler: WV.ShareCam.handleData,
         clickHandler: WV.ShareCam.handleClick
	     });
});
