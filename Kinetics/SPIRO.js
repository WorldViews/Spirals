
var SPIRO = {};

SPIRO.prevClockTime = null;
SPIRO.spirals = [];
SPIRO.partsPerSpiral = 2;
SPIRO.graphics = null;


SPIRO.getSpiralGraphic = function(t, dur, pitch, material)
{
    var y0 = -6;
    var x0 = -8;
    var z0 = 0;
    var gap = .2;
    var w = .1;
    var h = PLAYER.distPerSec*dur;
    material.color.setHSL((pitch%12)/12.0, .6, .5);
    var geometry = new THREE.BoxGeometry( h, w, w );
    var ng = new THREE.Mesh( geometry, material );
    ng._mat = material;
    ng.position.x = x0 + PLAYER.distPerSec*t;
    ng.position.y = y0 + gap * pitch;
    ng.position.z = z0;
    return ng;
}


SPIRO.addGraphics = function()
{
    if (SPIRO.graphics) {
        scene.remove(SPIRO.graphics);
    }
    var nspirals = 100;
    var x0 = 0;
    var y0 = 2;
    var z0 = 0;
    var w = 10;
    SPIRO.spirals = [];
    report("Adding spirals");
    var gObj = new THREE.Object3D();
    for (var i=0; i<nspirals; i++) {
        var x = x0 + w * (Math.random() - 0.5);
        var y = y0 + w * (Math.random() - 0.5);
        var z = z0 + w * (Math.random() - 0.5);
	var g = SPIRO.getSpiralObj(x,y,z);
	gObj.add(g);
    }
    scene.add(gObj);
    SPIRO.graphics = gObj;
    return gObj;
}

SPIRO.update = function()
{
    if (!SPIRO.graphics)
	return;
    clockTime = Date.now()/1000;
    if (!SPIRO.prevClockTime)
	SPIRO.prevClockTime = clockTime;
    var dt = clockTime - SPIRO.prevClockTime;
    SPIRO.prevClockTime = clockTime;
    dt *= 10.0;
    var dx = dt*SPIRO.distPerSec*dt;
    for (var i=0; i<SPIRO.spirals.length; i++) {
        var sg = SPIRO.spirals[i];
        sg.rotation.y += dt;
    }
}

