

function report(s)
{
   console.log(s);
}

audioOn = false;

function toggleAudio()
{
    if ($("#audio").prop("checked"))
        audioOn = true;
    else
        audioOn = false;
}

function toggleColor()
{
    P.doColors = $("#colors").prop("checked");
}


function getHelix(P)
{
    var x = P.x0;
    var r = P.helixR;
    //var omega = .5;
    var omega = 2*Math.PI/12.0;
    var obj = new THREE.Object3D();
    var r = P.helixR;
    for (var i=0; i<P.ncubes; i++) {
      var material = new THREE.MeshPhongMaterial( { color: 0x00dddd } );
      var geometry = new THREE.BoxGeometry( P.cubeW, P.cubeW, P.cubeL );
      var cube = new THREE.Mesh( geometry, material );
      cube._mat = material;
      P.cubes[i] = cube;
      //P.speeds[i] = P.v0 + P.dv*i;
      var theta = omega * i;
      cube.position.x = x;
      cube.position.y = r*Math.cos(theta);
      cube.position.z = r*Math.sin(theta);
      x += P.gap;
      obj.add( cube );
    }
    return obj;
}

function reset()
{
   getValsFromForm();
   var x = P.x0;
   var omega = 2*Math.PI/12.0;
   var r = P.helixR;
   for (var i=0; i<P.ncubes; i++) {
      var cube = P.cubes[i];
      var theta = omega * i;
      cube.rotation.x = 0;
      cube.position.x = x;
      cube.position.y = r*Math.cos(theta);
      cube.position.z = r*Math.sin(theta);
      x += P.gap;
   }
}

function setupWorld()
{
      container = document.createElement( 'div');
      document.body.appendChild(container);

      P = {};
      P.helixR = 0.4;
      P.ncubes = 88;
      P.cubeW = .2;
      P.cubeL = 0.7;
      P.gap = .4;
      P.x0 = - P.ncubes*(P.gap)/2.0;
      P.v0 = 0.01;
      P.hv0 = 3*P.v0;
      P.dv = 0.0005;
      P.cs1 = .01;
      P.cs2 = 0.9;
      P.doColors = 0;
      var controls = null;

      scene = new THREE.Scene();
      P.scene = scene;
      camera = new THREE.PerspectiveCamera( 75,
                             window.innerWidth/window.innerHeight, 0.1, 1000 );

      //renderer = new THREE.WebGLRenderer();
      renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.setSize( window.innerWidth, window.innerHeight );
      //document.body.appendChild( renderer.domElement );
      container.appendChild( renderer.domElement );

      //var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
      //var material = new THREE.MeshPhongMaterial( { color: 0xdddddd } );

      P.cubes = {};
      P.speeds = {};
      var cube = null;
      var x = P.x0;

      P.helix = getHelix(P);
      scene.add(P.helix)

      var sbox = getSkyBox();
      scene.add(sbox.mesh);
      // LIGHT
      var light;
      light = new THREE.PointLight(0xeeeeff);
      light.position.set(0,150,100);
      scene.add(light);
      light = new THREE.PointLight(0xeeffee);
      light.position.set(100,50,150);
      scene.add(light);
      light = new THREE.PointLight(0xffeeee);
      light.position.set(-150,50,150);
      scene.add(light);
      // FLOOR
      var floorTexture = new THREE.ImageUtils.loadTexture( 'images/floor.jpg' );
      floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
      floorTexture.repeat.set( 10, 10 );
      var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
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

      camera.position.z = 5;
      var steps = 0;

      var render = function () {
          //report("render n: "+steps);			  
	  requestAnimationFrame( render );
          P.helix.rotation.x += P.hv0;
          steps += 1;
          adjust = 1;
          if (adjust) {
              omega = 2*Math.PI/12.0;
              for (i=0; i<P.ncubes; i++) {
                  var speed = P.v0 + P.dv*i;
                  var ax0 = P.cubes[i].rotation.x;
                  var ax1 = ax0 + speed;
                  P.cubes[i].rotation.x = ax1;
		  ax0 = ax0 % (2*Math.PI);
                  ax1 = ax1 % (2*Math.PI);
                  var clicked = 0;
		  if (ax0-ax1 > Math.PI) {
	              //report("step "+steps+" v "+i);
                      P.cubes[i].clicked = 10;
	              if (audioOn) {
			 MIDI.noteOn(  0, i+21, 100);
			 MIDI.noteOff( 0, i+21,  .1);
                      }
                  }
                  else {
                      if (P.cubes[i].clicked)
                          P.cubes[i].clicked--;
                  }
                  if (P.doColors) {			      
                      h = P.cs1*steps;
                      h += P.cs2*i/P.ncubes;
                      h = h % 1.0;
                      if (P.cubes[i].clicked) {
                          P.cubes[i]._mat.color.setHSL(h,1,0);
                      }
                      else {
                          P.cubes[i]._mat.color.setHSL(h,.6,.3);
                      }
                  }
              }
         }
         renderer.render(scene, camera);
         if (controls && controls.update) {
            controls.update();
         }
	  if (PLAYER)
	      PLAYER.update();
      }
      setupGUI();

      trackball = 1;
      if (trackball) {
          //controls = new THREE.TrackballControls( camera, container );
          controls = new THREE.OrbitControls( camera, container );
          controls.rotateSpeed = 2.0;
          controls.zoomSpeed = 1.2;
          controls.panSpeed = 0.8;

          controls.noZoom = false;
          controls.noPan = false;

          controls.staticMoving = true;
          controls.dynamicDampingFactor = 0.3;

          controls.keys = [ 65, 83, 68 ];
          //controls.addEventListener( 'change', render );
      };

      render();

      return P;
}

function loadInstrument(instr, successFn)
{
    instrument = instr;
    MIDI.loadPlugin({
        soundfontUrl: "./soundfont/",
	instrument: instrument,
        onprogress:function(state,progress){
           MIDI.loader.setValue(progress*100);
        },
        onprogress: function(state,progress)
		{
                      MIDI.loader.setValue(progress*100);
		},
	onsuccess: function()
		{
		    MIDI.programChange(0, instr);
		    if (successFn)
			successFn();
		}
    });
}

window.onload=function(){
    report("***** setting up midi ******");
    var instrument;
    instrument = "acoustic_grand_piano";
    //instrument = "choir_aahs";
    MIDI.loader=new sketch.ui.Timer;
    loadInstrument("acoustic_grand_piano");
    /*
    MIDI.loadPlugin({
        soundfontUrl: "./soundfont/",
        instrument: instrument,
        onprogress:function(state,progress){
           MIDI.loader.setValue(progress*100);
        },
        onsuccess:function(){
            report("**** midi plugin ready ****");
	    MIDI.Soundfont.acoustic_grand_piano = MIDI.Soundfont.choir_aahs;
        }
    });
    */
}

//setupWorld();

