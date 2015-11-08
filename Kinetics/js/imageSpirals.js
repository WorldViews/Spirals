
var P = null;
var HORIZONTAL = true;
THREE.ImageUtils.crossOrigin = '';

ISPIRAL = {};

ISPIRAL.CRANK_ANGLE = null;

function report(s)
{
   console.log(s);
}

ISPIRAL.getImageBox = function(spiral, imageUrl)
{
   //var material = new THREE.MeshPhongMaterial( { color: 0x7733dd } );
   //var material = new THREE.MeshPhongMaterial(
   var material = new THREE.MeshLambertMaterial(
      { color: 0xdddddd, map: THREE.ImageUtils.loadTexture(imageUrl) });
   var geometry = new THREE.BoxGeometry( spiral.boxW, spiral.boxH, spiral.boxD );
   var obj = new THREE.Mesh( geometry, material );
   var box = new THREE.Object3D();
   box.add(obj);
   obj.position.y += 0.5*spiral.boxH + spiral.boxD;
   obj.position.x += 0.0*spiral.boxW;
   obj.position.z += 0.0*spiral.boxD;
   return box;
}

ISPIRAL.getImageCard = function(spiral, imageUrl)
{
   //report("getImageCard "+imageUrl);
   var material = new THREE.MeshLambertMaterial(
      { color: 0xdddddd, map: THREE.ImageUtils.loadTexture(imageUrl) });
   material.side = THREE.DoubleSide;
   var geometry = new THREE.PlaneGeometry( spiral.boxW, spiral.boxH );
   var obj = new THREE.Mesh( geometry, material );
   var card = new THREE.Object3D();
   card.add(obj);
   obj.position.y += 0.5*spiral.boxH + spiral.boxD;
   obj.position.x += 0.0*spiral.boxW;
   obj.position.z += 0.0*spiral.boxD;
   return card;
}

ISPIRAL.getBall = function(spiral)
{
   //report("getImageCard "+imageUrl);
   var size = spiral.ballSize;
   var material = new THREE.MeshPhongMaterial( { color: 0xff2222 } );
   material.color.setHSL(spiral.hue, .9, .5);
   material.transparent = true;
   material.opacity = .8;
   var geometry = new THREE.SphereGeometry( size, 20, 20 );
   var mesh = new THREE.Mesh( geometry, material );
   mesh.scale.x = 10;
   var ball = new THREE.Object3D();
   ball.add(mesh);
   mesh.position.y += 0.5*size;
   return ball;
}

function ImageSpiral(imageList, opts)
{
      opts = opts || {};
      this.boxW = 1.5;
      this.boxH = 0.8;
      this.boxD = 0.1;
      report("getImageSpiral "+JSON.stringify(opts));
      var imageObjs = [];
      this.imageObjs = imageObjs;
      var images = new THREE.Object3D();
      for (var i=0; i<imageList.length; i++) {
          var imageUrl = imageList[i];
          //var imageObj = ISPIRAL.getImageBox(this, imageUrl);
          var imageObj = ISPIRAL.getImageCard(this, imageUrl);
          images.add(imageObj);
	  imageObjs.push(imageObj)
      }
      this.images = images;
      if (opts.scale) {
          report("Setting spiral scale "+opts.scale);
	  images.scale.x = opts.scale[0];
	  images.scale.y = opts.scale[1];
	  images.scale.z = opts.scale[2];
      }
      if (opts.position) {
          report("Setting spiral position "+opts.position);
	  images.position.x = opts.position[0];
	  images.position.y = opts.position[1];
	  images.position.z = opts.position[2];
      }
      function adjust(t0) {
	  ISPIRAL.adjustImageObjs(this, t0);
      }
      this.adjust = adjust;
      this.adjust();
}

function BallSpiral(numItems, opts)
{
      opts = opts || {};
      report("getBallSpiral "+numItems+" "+JSON.stringify(opts));
      var objs = [];
      this.ballSize = .1;
      this.hue = opts.hue || (300/360)
      this.objs = objs;
      this.numItems = numItems;
      var group = new THREE.Object3D();
      for (var i=0; i<numItems; i++) {
          var obj = ISPIRAL.getBall(this);
          group.add(obj);
	  objs.push(obj)
      }
      this.group = group;
      if (opts.scale) {
          report("Setting spiral scale "+opts.scale);
	  group.scale.x = opts.scale[0];
	  group.scale.y = opts.scale[1];
	  group.scale.z = opts.scale[2];
      }
      if (opts.position) {
          report("Setting spiral position "+opts.position);
	  group.position.x = opts.position[0];
	  group.position.y = opts.position[1];
	  group.position.z = opts.position[2];
      }
      function adjust(t0) {
	  ISPIRAL.adjustObjs(this, t0);
      }
      this.adjust = adjust;
      this.adjust();
}


ISPIRAL.vertical_adjustImageObjs = function(t0)
{
    if (!t0)
	t0 = 0;
    var z0 = 0;
    var dy = 0.2;
    var dt = 1;
    var omega = 0.2;
    var t = t0;
    var r = 3;
    var zspeed = .005;
    var N = spiral.imageObjs.length;
    for (var i=0; i<N; i++) {
        var s = 20.0/(100 + N - i);
        r = 7*s;
        var imageObj = spiral.imageObjs[i];
        t += dt;
        var theta = omega*t;
        var x = r*Math.cos(theta);
        var y = r*Math.sin(theta);
        var z = zspeed*i;
        report("imageObj "+i+"  x: "+x+"  y: "+y+"   z: "+z);
        imageObj.scale.x = s;
        imageObj.scale.y = s;
        imageObj.scale.z = s;
        imageObj.rotation.y = - theta + Math.PI/2;
        imageObj.position.x = x;
        imageObj.position.z = y;
	imageObj.position.y = z;
    }
}


ISPIRAL.horizontal_adjustImageObjs = function(spiral, t0)
{
    if (!t0)
	t0 = 0;
    var y0 = 0
    var z0 = 0;
    var dy = 0.2;
    var dt = 1;
    var omega = 4;
    var xMin = -10;
    var xMax = 10;
    var xMid = (xMin + xMax)/2.0;
    var xWid = xMax - xMin;
    var N = spiral.imageObjs.length;
    var dx = xWid / N;
    var drift = t0*0.05;
    iLow = Math.floor(0 - drift/dx - P.xbias/dx);
    var iHigh = iLow + N;
    for (var j=iLow; j<iHigh; j++) {
	i = (j + 100000*N) % N;
        x0 = xMin + dx*j;
        x = x0 + drift;
        var theta = x*omega + P.theta0;
        x += P.xbias;
        var dm = x-xMid;
        var s = (xMax*xMax - dm*dm)/(xMax*xMax);
        s = s*s*s*s + 0.001; // make sure not zero
	s = 1.1*s
        var r = 2.9*s;
        var obj = spiral.imageObjs[i];
        var y = y0 + r*Math.cos(theta);
        var z = z0 + r*Math.sin(theta);
        //report("imageObj "+i+"  x: "+x+"  y: "+y+"   z: "+z+" s: "+s+" theta: "+theta);
        obj.rotation.x = theta - Math.PI/2;
        obj.position.x = x;
	obj.position.y = y;
	obj.position.z = z;
        obj.scale.x = s;
	obj.scale.y = s;
	obj.scale.z = s;
    }
}

ISPIRAL.adjustImageObjs = function(spiral, t0)
{
    if (HORIZONTAL)
        return ISPIRAL.horizontal_adjustImageObjs(spiral, t0);
    else
        return ISPIRAL.vertical_adjustImageObjs(spiral, t0);
}


ISPIRAL.adjustObjs = function(spiral, t0)
{
    return ISPIRAL.horizontal_adjustObjs(spiral, t0);
}

ISPIRAL.horizontal_adjustObjs = function(spiral, t0)
{
    if (!t0)
	t0 = 0;
    var y0 = 0
    var z0 = 0;
    var dy = 0.2;
    var dt = 1;
    var omega = 4;
    var xMin = -10;
    var xMax = 10;
    var xMid = (xMin + xMax)/2.0;
    var xWid = xMax - xMin;
    var N = spiral.objs.length;
    var dx = xWid / N;
    var drift = t0*0.05;
    iLow = Math.floor(0 - drift/dx - P.xbias/dx);
    var iHigh = iLow + N;
    for (var j=iLow; j<iHigh; j++) {
	i = (j + 100000*N) % N;
        x0 = xMin + dx*j;
        x = x0 + drift;
        var theta = x*omega + P.theta0;
        x += P.xbias;
        var dm = x-xMid;
        var s = (xMax*xMax - dm*dm)/(xMax*xMax);
        s = s*s*s*s + 0.001; // make sure not zero
	s = 1.1*s
        var r = 2.9*s;
        var obj = spiral.objs[i];
        var y = y0 + r*Math.cos(theta);
        var z = z0 + r*Math.sin(theta);
        //report("imageObj "+i+"  x: "+x+"  y: "+y+"   z: "+z+" s: "+s+" theta: "+theta);
        obj.rotation.x = theta - Math.PI/2;
        obj.position.x = x;
	obj.position.y = y;
	obj.position.z = z;
        obj.scale.x = s;
	obj.scale.y = s;
	obj.scale.z = s;
    }
}

