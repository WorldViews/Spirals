
var P = null;

THREE.ImageUtils.crossOrigin = '';

ISPIRAL = {};
ISPIRAL.loader = null;

ISPIRAL.getLoader = function()
{
    if (!ISPIRAL.loader)
	ISPIRAL.loader = new THREE.TextureLoader();
    return ISPIRAL.loader
}

ISPIRAL.CRANK_ANGLE = null;

function report(s)
{
   console.log(s);
}


ISPIRAL.getImageCard = function(spiral, imageUrl)
{
   //report("getImageCard "+imageUrl);
   var material = new THREE.MeshLambertMaterial(
      { color: 0xdddddd,
	//map: THREE.ImageUtils.loadTexture(imageUrl)
	map: ISPIRAL.getLoader().load(imageUrl),
	transparent: true
      });
   material.side = THREE.DoubleSide;
   var geometry = new THREE.PlaneGeometry( spiral.boxW, spiral.boxH );
   var obj = new THREE.Mesh( geometry, material );
   var card = new THREE.Object3D();
   card.add(obj);
   obj.rotation.z = - Math.PI/2;
   obj.scale.y = 2;
   obj.scale.x = 0.5;
   obj.position.y += 0.5*spiral.boxH + spiral.boxD;
   obj.position.x += 0.0*spiral.boxW;
   obj.position.z += 0.0*spiral.boxD;
   card.obj = obj;
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

ISPIRAL.ImageSpiral = function(earth, imageList, opts)
{
      opts = opts || {};
      this.earth = earth;
      this.boxW = 1.5;
      this.boxH = 0.8;
      this.boxD = 0.1;
      this.N = imageList.length;
      this.h = 10;
      if (opts.N)
	  this.N = opts.N;
      if (opts.h)
	  this.h = opts.h;
      this.lookAtPos = null;
      if (opts.lookAtPos)
	  this.lookAtPos = opts.lookAtPos;
      report("getImageSpiral "+JSON.stringify(opts));
      report("getImageSpiral N: "+this.N+" h: "+this.h);
      var imageObjs = [];
      this.imageObjs = imageObjs;
      var images = new THREE.Object3D();
      for (var i=0; i<this.N; i++) {
          var imageUrl = imageList[i % imageList.length];
          var imageObj = ISPIRAL.getImageCard(this, imageUrl);
          images.add(imageObj);
	  imageObjs.push(imageObj)
      }
      this.images = images;
      if (opts.scale) {
          report("Setting spiral scale "+opts.scale);
	  //images.scale.copy(opts.scale);
	  images.scale.x = opts.scale[0];
	  images.scale.y = opts.scale[1];
	  images.scale.z = opts.scale[2];
      }
      if (opts.position) {
          report("Setting spiral position "+opts.position);
	  images.position.copy(opts.position);
	  images.position.x = opts.position[0];
	  images.position.y = opts.position[1];
	  images.position.z = opts.position[2];
      }

      this.adjust = function(t) {
	  report("please use update instead of adjust");
	  this.update(t);
      }

      function update(t0) {
	  ISPIRAL.adjustImageObjs(this, t0);
      }
      this.update = update;

      this.update();
}

ISPIRAL.numUpdates = 0;

ISPIRAL.adjustImageObjs = function(spiral, t0)
{
    if (!t0)
	t0 = 0;
    var y0 = 0
    var z0 = 0;
    var N = spiral.N;
    var h = spiral.h;
    var dLon = 25;
    var dLat = 1.8;
    var lat = 90 + 2*t0;
    var lon = 0;
    for (var j=0; j<N; j++) {
        var phi = lat * Math.PI / 180;
        var f = Math.cos(phi);
	f = 1 / (Math.abs(f) + 0.5);
	i = (j + 100000*N) % N;
        lon += (dLon*f) % 360;
        lat -= dLat*f;
        var theta = lon * Math.PI / 180;
	var s = 10000;
        var obj = spiral.imageObjs[i];
        var v3 = spiral.earth.latLonToVector3(lat, lon, h);
        //report("imageObj "+i+"  x: "+x+"  y: "+y+"   z: "+z+" s: "+s+" theta: "+theta);
	if (ISPIRAL.numUpdates == 0)
            report("imageObj i:"+i+" lat: "+lat+" lon: "+lon+" phi: "+phi+" f: "+f+" pos: "+JSON.stringify(v3));
        //obj.rotation.x = theta - Math.PI/2;
        obj.position.copy(v3);
        obj.scale.x = s;
	obj.scale.y = s;
	obj.scale.z = s;
	faceUp = false;
	if (faceUp) {
	    obj.obj.rotation.y = - Math.PI/2;
	    obj.obj.rotation.x = - Math.PI/2;
	}
	if (spiral.lookAtPos)
	    obj.lookAt(spiral.lookAtPos);
    }
    ISPIRAL.numUpdates += 1;
}


