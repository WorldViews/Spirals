
var P = null;
var HORIZONTAL = true;
THREE.ImageUtils.crossOrigin = '';

function report(s)
{
   console.log(s);
}


var imageObjs = [];
//var imageUrl = 'http://www.html5canvastutorials.com/demos/assets/crate.jpg';
var imageUrl = 'images/crate.jpg';
var testImageList = [
     'images/crate.jpg',
     'images/checkerboard.jpg'
];

function getImageBox(P, imageUrl)
{
   //var material = new THREE.MeshPhongMaterial( { color: 0x7733dd } );
   //var material = new THREE.MeshPhongMaterial(
   var material = new THREE.MeshLambertMaterial(
      { color: 0xdddddd, map: THREE.ImageUtils.loadTexture(imageUrl) });
   var geometry = new THREE.BoxGeometry( P.boxW, P.boxH, P.boxD );
   var obj = new THREE.Mesh( geometry, material );
   var box = new THREE.Object3D();
   box.add(obj);
   obj.position.y += 0.5*P.boxH + P.boxD;
   obj.position.x += 0.0*P.boxW;
   obj.position.z += 0.0*P.boxD;
   return box;
}

function getImageCard(P, imageUrl)
{
   var material = new THREE.MeshLambertMaterial(
      { color: 0xdddddd, map: THREE.ImageUtils.loadTexture(imageUrl) });
   material.side = THREE.DoubleSide;
   var geometry = new THREE.PlaneGeometry( P.boxW, P.boxH );
   var obj = new THREE.Mesh( geometry, material );
   var card = new THREE.Object3D();
   card.add(obj);
   obj.position.y += 0.5*P.boxH + P.boxD;
   obj.position.x += 0.0*P.boxW;
   obj.position.z += 0.0*P.boxD;
   return card;
}


function setupWorld(imageList)
{
    if (!imageList) {
        imageList = testImageList;
    }

      container = document.createElement( 'div');
      document.body.appendChild(container);

      P = {};
      P.numImages = 3;
      P.boxW = 1.5;
      P.boxH = 0.8;
      P.boxD = 0.1;
      P.v0 = 0.04;
      P.theta0 = 0;
      P.xbias = 0;
      P.lastTrackedTime = 0;
      P.pauseTime = 5;

      var controls = null;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera( 75,
                             window.innerWidth/window.innerHeight, 0.1, 1000 );
      P.camera = camera;
      P.scene = scene;

      trackball = 1;
      if (trackball) {
          //controls = new THREE.TrackballControls( camera );
          controls = new THREE.TrackballControls( camera, container );
          controls.rotateSpeed = 2.0;
          controls.zoomSpeed = 1.2;
          controls.panSpeed = 0.8;

          controls.noZoom = false;
          controls.noPan = false;

          controls.staticMoving = true;
          controls.dynamicDampingFactor = 0.3;

          controls.keys = [ 65, 83, 68 ];
          //controls.addEventListener( 'change', render );
      }

      //renderer = new THREE.WebGLRenderer();
      renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.setSize( window.innerWidth, window.innerHeight );
      //document.body.appendChild( renderer.domElement );
      container.appendChild( renderer.domElement );

      //var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
      //var material = new THREE.MeshPhongMaterial( { color: 0xdddddd } );

      var images = new THREE.Object3D();
      P.root = images;

      for (var i=0; i<imageList.length; i++) {
          var imageUrl = imageList[i];
          //var imageObj = getImageBox(P, imageUrl);
          var imageObj = getImageCard(P, imageUrl);
          images.add(imageObj);
	  imageObjs.push(imageObj)
      }
      scene.add(images);
      adjustImageObjs();

      var sbox = getSkyBox();
      scene.add(sbox.mesh);

      // LIGHT
      var light;
      light = new THREE.PointLight(0xeeeeff);
      light.position.set(0,150,1000);
      scene.add(light);
      light = new THREE.PointLight(0xffeeee);
      light.position.set(-150,50,1000);
      scene.add(light);
      light = new THREE.PointLight(0xffeeee);
      light.position.set(150,50,-1050);
      scene.add(light);
      // FLOOR
      var floorTexture = new THREE.ImageUtils.loadTexture( 'images/floor.jpg' );
      floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
      var fs = 40;
      floorTexture.repeat.set( 10, 10 );
      //floorTexture.repeat.set( fs, fs );
      var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
      //var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
      var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
      var floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.position.y = -100.0;
      floor.rotation.x = Math.PI / 2;
      scene.add(floor);
      // SKYBOX/FOG
      var skyBoxGeometry = new THREE.BoxGeometry( 10000, 10000, 10000 );
      var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
      var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
      scene.add(skyBox);
      scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );

//      P.root.position.y = floor.position.y + 10;

      camera.position.z = 5;
      var steps = 0;
      var t0 = 0;
      var render = function () {
          //report("------------------------------\nrender n: "+steps);
	  requestAnimationFrame( render );
          steps += 1;
	  var ct = new Date().getTime() / 1000;
	  adjust = 1;
          if (adjust) {
	      if (ct - P.lastTrackedTime > P.pauseTime)
		  t0 += P.v0;
              adjustImageObjs(t0);
          }
          renderer.render(scene, camera);
          if (controls) {
             controls.update();
          }
      };
      render();
}


function xadjustImageObjs(t0)
{
    if (!t0)
	t0 = 0;
    var z0 = 0;
    var dy = 0.2;
    var dt = 1;
    var omega = 0.2;
    var t = t0;
    var r = 3;
    var zspeed = .01;
    for (var i=0; i<imageObjs.length; i++) {
        var s = 20.0/(50 + imageObjs.length-i);
        r = 8*s;
        var imageObj = imageObjs[i];
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

function yadjustImageObjs(t0)
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
    for (var i=0; i<imageObjs.length; i++) {
        var s = 20.0/(50 + imageObjs.length-i);
        r = 7*s;
        var imageObj = imageObjs[i];
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

function vertical_adjustImageObjs(t0)
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
    for (var i=0; i<imageObjs.length; i++) {
        var s = 20.0/(100 + imageObjs.length-i);
        r = 7*s;
        var imageObj = imageObjs[i];
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

function adjustImageObjs(t0)
{
    if (HORIZONTAL)
        return horizontal_adjustImageObjs(t0);
    else
        return vertical_adjustImageObjs(t0);
}


function horizontal_adjustImageObjs(t0)
{
    if (!t0)
	t0 = 0;
    var y0 = 0
    var z0 = -5;
    var dy = 0.2;
    var dt = 1;
    var omega = 4;
    var xMin = -10;
    var xMax = 10;
    var xMid = (xMin + xMax)/2.0;
    var xWid = xMax - xMin;
    var dx = xWid / imageObjs.length;
    var N = imageObjs.length;
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
        var obj = imageObjs[i];
        var y = y0 + r*Math.cos(theta);
        var z = z0 + r*Math.sin(theta);
        obj = imageObjs[i];
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

