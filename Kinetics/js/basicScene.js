

ISPIRAL = {};


function setupWorld()
{
      container = document.createElement( 'div');
      document.body.appendChild(container);

      P = {};

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

      spiral = new ImageSpiral(imageList);
      images = spiral.images;
      P.root = images;
      scene.add(images);

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

