
var P = null;

THREE.ImageUtils.crossOrigin = '';

IMVIEWS = {};
IMVIEWS.loader = null;

IMVIEWS.getLoader = function()
{
    if (!IMVIEWS.loader)
	IMVIEWS.loader = new THREE.TextureLoader();
    return IMVIEWS.loader
}

IMVIEWS.CRANK_ANGLE = null;

function report(s)
{
   console.log(s);
}


IMVIEWS.getImageCard = function(view, imageUrl)
{
   //report("getImageCard "+imageUrl);
   var material = new THREE.MeshLambertMaterial(
      { color: 0xdddddd,
	//map: THREE.ImageUtils.loadTexture(imageUrl)
	map: IMVIEWS.getLoader().load(imageUrl),
	transparent: true
      });
   material.side = THREE.DoubleSide;
   var geometry = new THREE.PlaneGeometry( view.boxW, view.boxH );
   var obj = new THREE.Mesh( geometry, material );
   var card = new THREE.Object3D();
   card.add(obj);
   obj.rotation.z = Math.PI/2;
   obj.rotation.y = - Math.PI;
   obj.scale.y = 1;
   obj.scale.x = 1;
   obj.position.y += 0.5*view.boxH + view.boxD;
   obj.position.x += 0.0*view.boxW;
   obj.position.z += 0.0*view.boxD;
   card.obj = obj;
   return card;
}


IMVIEWS.ImageView = function(earth, imageSpec, opts)
{
      opts = opts || {};
      this.earth = earth;
      this.boxW = 1.5;
      this.boxH = 0.8;
      this.boxD = 0.1;
      var h = 5000;  // extra height above earth
      var s = 2500;  // scale sets size of pictures
      this.lookAtPos = null;
      if (opts.lookAtPos)
	  this.lookAtPos = opts.lookAtPos;
      report("getImageView "+JSON.stringify(opts));
      var imageObjs = [];
      this.imageObjs = imageObjs;
      var imageView = new THREE.Object3D();

      var ispec = imageSpec;
      var imageUrl = ispec.url
      var imageObj = IMVIEWS.getImageCard(this, imageUrl);
      imageObj.url = imageUrl;
      var lon = ispec.lonlat[0];
      var lat = ispec.lonlat[1];
      report(" lat: "+lat+"   lon: "+lon);
      imageView.add(imageObj);
      earth.addMarker(lat, lon);
      var v3 = vec3(0,h,0);
      report("v3: "+JSON.stringify(v3));
      this.imageView = imageView;
      imageView.scale.x = s;
      imageView.scale.y = s;
      imageView.scale.z = s;
      imageView.position.copy(v3);
      earth.addObject(imageView, lat, lon);
      if (opts.lookAtPos) {
	  report("lookAt "+JSON.stringify(opts.lookAtPos));
	  imageView.lookAt(opts.lookAtPos);
      }

      this.update = function(t0) {
	  report("update is no-op for image card");
      }
}

IMVIEWS.numUpdates = 0;

IMVIEWS.adjustImageObjs = function(spiral, t0)
{
}

