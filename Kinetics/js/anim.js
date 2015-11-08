
ANIM = {}
ANIM.viewNum = 0;
ANIM.viewNames = [];
ANIM.views = {};
ANIM.idx = 0;
ANIM.bookmarksURL_ = "/Kinetics/bookmarks.json";
ANIM.activeAnimations = [];

// ANIM.Interpolator is like a base class.  Each one
// should have
// lowVal, highVal, targets

//Untested...
ANIM.Vector3Interpolator = function(p0, p1, target)
{
    this.p0 = p0;
    this.p1 = p1;
    this.range = 1.0;
    this.target = target;

    this.setVal = function(s) {
	report("setVal "+s);
	var f = s/this.range;
	target.lerpVectors(p0, p1, f);
    }
    //    P.camera.updateProjectionMatrix();
}

// THis version uses linear interpolation or rotations, which is not
// really correct
ANIM.ViewInterpolatorLerp = function(p0, r0, p1, r1, camera)
{
    report("ViewInterpolator p0:"+JSON.stringify(p0)+" p1: "+JSON.stringify(p1));
    this.p0 = p0;
    this.r0 = new THREE.Vector3(r0.x, r0.y, r0.z);
    this.p1 = p1;
    this.r1 = new THREE.Vector3(r1.x, r1.y, r1.z);
    this.p = new THREE.Vector3(0,0,0);
    this.r = new THREE.Vector3(0,0,0);
    this.camera = camera;
    this.range = 1.0;
    this.targetP;
    this.targetR;

    this.setVal = function(s) {
	report("setVal "+s);
	var f = s/this.range;
        this.p.lerpVectors(this.p0, this.p1, f);
	report("p: "+JSON.stringify(this.p));
	camera.position.x = this.p.x;
	camera.position.y = this.p.y;
	camera.position.z = this.p.z;
	this.r.lerpVectors(this.r0, this.r1, f);
	report("r: "+JSON.stringify(this.r));
	camera.rotation.x = this.r.x;
	camera.rotation.y = this.r.y;
	camera.rotation.z = this.r.z;
    }
    //    P.camera.updateProjectionMatrix();
}

// THis version uses linear interpolation or rotations, which is not
// really correct
ANIM.ViewInterpolator = function(p0, r0, p1, r1, camera)
{
    report("ViewInterpolator p0:"+JSON.stringify(p0)+" p1: "+JSON.stringify(p1));
    this.p0 = p0;
    this.q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler().setFromVector3(r0));
    this.p1 = p1;
    this.q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler().setFromVector3(r1));
    this.p = new THREE.Vector3(0,0,0);
    this.q = new THREE.Quaternion();
    this.camera = camera;
    this.range = 1.0;
    this.targetP;
    this.targetR;

    this.setVal = function(s) {
	report("setVal "+s);
	var f = s/this.range;
        this.p.lerpVectors(this.p0, this.p1, f);
	report("p: "+JSON.stringify(this.p));
	camera.position.x = this.p.x;
	camera.position.y = this.p.y;
	camera.position.z = this.p.z;
	THREE.Quaternion.slerp(this.q0, this.q1, this.q, f);
	report("q: "+JSON.stringify(this.q));
	camera.rotation.setFromQuaternion(this.q)
    }
    //    P.camera.updateProjectionMatrix();
}

ANIM.Animation = function(name, dur, interpolator)
{
    if (!name)
	name = "anon";
    if (dur == null)
	dur = 1;
    this.name = name;
    this.running = false;
    this.t0 = 0;
    this.t1 = dur;
    this.interpolators = []
    if (interpolator)
	this.interpolators.push(interpolator);

    this.playTime = 0;

    function update() {
	if (!this.running) {
	    report("*** anim "+this.name+" updated but not running");
	    this.deactivate();
	    return;
	}
	var ct = Date.now()/1000;
	var dt = ct - this.lastClockTime;
	var pt = this.playTime + dt;
	this.lastClockTime = ct;
	this.playTime = pt;
	report("ANIM run "+pt+" update");
	var dur = this.t1-this.t0;
	var f = pt/dur;
	for (var i=0; i<this.interpolators.length; i++) {
	    try {
		this.interpolators[i].setVal(f);
	    }
	    catch (e) {
		report("error: "+e);
	    }
	}
	if (this.playTime >= this.t1) {
	    report("anim "+this.name+" finished!!");
	    this.deactivate();
	}
    }
    this.update = update;

    this.activate = function() {
	this.playTime = 0;
	this.lastClockTime = Date.now()/1000.0;
	this.running = true;
	ANIM.activeAnimations.push(this);
    };

    this.deactivate = function() {
	this.running = false;
	var i = ANIM.activeAnimations.indexOf(this);
	if (i >= 0) {
	    ANIM.activeAnimations.splice(i,1);
	}
    }
}

ANIM.update = function()
{
    for (var i = ANIM.activeAnimations.length-1; i >= 0; i--) {
	var anim = ANIM.activeAnimations[i];
	anim.update();
    }
}

ANIM.bookmarkView = function(name)
{
    report("bookmarkView");
    if (!P.camera) {
        report("Cannot get camera");
        return;
    }
    if (!name) {
	do {
            ANIM.viewNum += 1;
            name = "View"+ANIM.viewNum;
        }
	while (ANIM.views[name]);
    }
    var pos = P.camera.position.clone();
    var eulerAngles = P.camera.rotation.clone();
    var view = {'name': name, 'position': pos, 'rotation': eulerAngles};
    ANIM.viewNames.push(name)
    ANIM.views[name] = view;
    report("bookmarkView name "+name);
    report("bookmarkView pos "+JSON.stringify(pos));
    report("bookmarkView rot "+JSON.stringify(eulerAngles));
    report("bookmarkView test.... "+JSON.stringify({'a': 3, 'b': {'c': 8}}));
    ANIM.uploadBookmarks();
    $("#viewNameSelection").append($('<option>', { value: name, text: name}));
    //    report("bookmarkView "+JSON.stringify(view));
}

ANIM.getBookmarksURL = function()
{
    //TODO: maybe make smarter...
    return ANIM.bookmarksURL_ ;
}

ANIM.downloadBookmarks = function()
{
    var url = ANIM.getBookmarksURL();
    report("downloadBookmarks "+url);
    $.getJSON(url, ANIM.handleBookmarks)
}

ANIM.handleBookmarks = function(obj)
{
    report("handleBookmarks");
    report("views: "+JSON.stringify(obj));
    ANIM.views = obj;
    ANIM.viewNames = Object.keys(ANIM.views);
    ANIM.viewNames.sort();
    $("#viewNameSelection").html();
    //for (var name in ANIM.views) {
    for (var i=0; i<ANIM.viewNames.length; i++) {
	var name = ANIM.viewNames[i];
        report("name: "+name+" view: "+JSON.stringify(ANIM.views[name]));
        //ANIM.viewNames.push(name);
        $("#viewNameSelection").append($('<option>', { value: name, text: name}));
    }
}

ANIM.uploadBookmarks = function()
{
    jstr = JSON.stringify(ANIM.views);
    var url = ANIM.getBookmarksURL();
    url = url.replace("/", "/update/");
    report("uploadBookmarks to "+url);
    jQuery.post(url, jstr, function () {
	    report("Succeeded at upload")}, "json");
}


ANIM.gotoView = function(name, dur)
{
    if (dur == null)
	dur = 1;
    report("gotoView "+name);
    if (!name) {
        ANIM.idx++;
        name = ANIM.viewNames[ANIM.idx % ANIM.viewNames.length];
    }
    report("gotoView "+name);
    view = ANIM.views[name];
    if (!view) {
	report("No viewpoint named "+name);
	return;
    }
    report("pos: "+view.position);
    report("rot: "+view.rotation);
    $("#currentViewName").html(name);
    if (dur > 0) {
        var c = P.camera;
	var pos0 = P.camera.position.clone();
	var pos1 = view.position;
        var interp = new ANIM.ViewInterpolator(pos0, c.rotation.clone(),
					       view.position, view.rotation, c);
	var anim = new ANIM.Animation("goto"+name, dur, interp);
	anim.activate();
	return;
    }

    if (view.position) {
       //P.camera.position = view.position;
       P.camera.position.x = view.position.x;
       P.camera.position.y = view.position.y;
       P.camera.position.z = view.position.z;
    }
    if (view.rotation) {
       P.camera.rotation.x = view.rotation.x;
       P.camera.rotation.y = view.rotation.y;
       P.camera.rotation.z = view.rotation.z;
    }
    P.camera.updateProjectionMatrix();
}

ANIM.viewSelectionChanged = function(e)
{
    var name = $("#viewNameSelection").val();
    ANIM.gotoView(name);
}

ANIM.createButtons = function()
{
    hstr = '';
    hstr += '<input id="markViewpoint" type="button" value="mark">\n';
    hstr += '<input id="nextViewpoint" type="button" value="next">\n';
    hstr += '&nbsp;&nbsp;';
    hstr += '<span id="currentViewName"></span>';
    hstr += '<select id="viewNameSelection"></select>';
    $("#viewControls").html(hstr);
    $("#viewNameSelection").change(ANIM.viewSelectionChanged);
}

ANIM.setupHTML = function()
{
    report("ANIM.setupHTML");
    var d = $("#viewControls");
    if (d.length == 0) {
        report("No View Controls");
    }
    ANIM.createButtons();
    $("#markViewpoint").click(function(e) { ANIM.bookmarkView()});
    $("#nextViewpoint").click(function(e) { ANIM.gotoView()});
}

$(document).ready(function(e) {
    ANIM.setupHTML();
    ANIM.downloadBookmarks();
});
