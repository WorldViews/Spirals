/*
 * Cloth Simulation using a relaxed constrains solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf

function report(str)
{
    console.log(str);
}


SKIRT = {};
SKIRT.CRANK_ANGLE = null;
SKIRT.DAMPING = 0.005;
SKIRT.DRAG = 1 - SKIRT.DAMPING;
SKIRT.MASS = 0.1;
SKIRT.useDiagonals = false;
SKIRT.restDistance = 25;
SKIRT.clothRotationSpeed = 0.2; // revolutions per second

SKIRT.rotateSkirts = false;

SKIRT.xSegs = 12; //
SKIRT.ySegs = 12; //
//SKIRT.ySegs = 6; //
SKIRT.flare = 1.9;
SKIRT.numRotations = 1.0; // how many rotations of fabric to set up.

SKIRT.GRAVITY = 981 * 1.4; // 
SKIRT.gravity = new THREE.Vector3( 0, -SKIRT.GRAVITY, 0 ).multiplyScalar(SKIRT.MASS);

SKIRT.TIMESTEP = 18 / 1000;
SKIRT.TIMESTEP_SQ = SKIRT.TIMESTEP * SKIRT.TIMESTEP;

SKIRT.skirts = [];

SKIRT.wind = false;
SKIRT.windStrength = .2;
SKIRT.windForce = new THREE.Vector3(0,0,0);

var ballPosition = new THREE.Vector3(0, -45, 0);
var ballSize = 60; //40

SKIRT.tmpForce = new THREE.Vector3();

SKIRT.lastTime;
SKIRT.closeSeams = true;


function plane(width, height) {
	return function(u, v) {
		var x = (u - 0.5) * width;
		var y = (v + 0.5) * height;
		var z = 0;

		return new THREE.Vector3(x, y, z);
	};
}

/*
  Here width is the circumference of fabric.
 */
function circ(skirt, width, height, x0, z0) {
    //report("circ 0 w,h: "+width+" "+height+ " x0,y0: "+x0+" "+z0);
    //report(" skirt: "+skirt);
    var y0 = 0;
    var r = width/(2*Math.PI);
    var f = 2*Math.PI;
    r /= SKIRT.numRotations;
    f *= SKIRT.numRotations;
    report("r: "+r+" f:"+f);

    return function(u, v) {
	var theta = u;
	var x = x0 + r*Math.cos(f*theta + skirt.theta0);
	var y = y0 + (v + 0.5) * height;
	var z = z0 + r*Math.sin(f*theta + skirt.theta0);
	var p = new THREE.Vector3(x, y, z);
	//report("circ "+u+" "+v+" "+JSON.stringify(p));
	return p;
    };
}

function Particle(skirt, x, y, z, mass, ij) {
    this.skirt = skirt;
    this.ij = ij; // label used for debugging only
    this.position = skirt.clothFunction(x, y); // position
    this.previous = skirt.clothFunction(x, y); // previous
    this.original = skirt.clothFunction(x, y);
    this.uv = [x,y];
    this.a = new THREE.Vector3(0, 0, 0); // acceleration
    this.mass = mass;
    this.invMass = 1 / mass;
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();
}

// Force -> Acceleration
Particle.prototype.addForce = function(force) {
	this.a.add(
		this.tmp2.copy(force).multiplyScalar(this.invMass)
	);
};


// Performs verlet integration
Particle.prototype.integrate = function(timesq) {
	var newPos = this.tmp.subVectors(this.position, this.previous);
	newPos.multiplyScalar(SKIRT.DRAG).add(this.position);
	newPos.add(this.a.multiplyScalar(timesq));

	this.tmp = this.previous;
	this.previous = this.position;
	this.position = newPos;

	this.a.set(0, 0, 0);
}


var diff = new THREE.Vector3();

function satisfyConstrains(p1, p2, distance) {
    //report("satisfy "+p1.uv+" -- "+p2.uv+"  "+distance);
	diff.subVectors(p2.position, p1.position);
	var currentDist = diff.length();
	if (currentDist == 0) return; // prevents division by 0
	var correction = diff.multiplyScalar(1 - distance / currentDist);
	var correctionHalf = correction.multiplyScalar(0.5);
	p1.position.add(correctionHalf);
	p2.position.sub(correctionHalf);
}

// This is used to give flare to the skirt by letting it be wider at the base
function rdf(s)
{
//  var f = 1 + 4*v/ySegs;
//    var s = v/ySegs;
    //var f = 1 + 2*s*s;
    //var f = 1 + 2*Math.sqrt(s);
    var f = 1 + SKIRT.flare*s;
    return f;
}

function Skirt(w, h, x0, y0) {
	w = w || SKIRT.xSegs;
	h = h || SKIRT.ySegs;
	SKIRT.skirts.push(this);
	var restDistance = SKIRT.restDistance;
	this.rotSpeed = SKIRT.clothRotationSpeed;
	this.w = w;
	this.h = h;
	this.theta0 = 0;
	//clothFunction = circ(this, restDistance * xSegs, restDistance * ySegs, x0, y0);
	clothFunction = circ(this, restDistance * w, restDistance * h, x0, y0);
	this.clothFunction = clothFunction;

	var particles = [];
	var constrains = [];

	var u, v;

	// Create particles
	for (v = 0; v <= h; v ++) {
            for (u = 0; u <= w; u ++) {
                var mass = SKIRT.MASS;
                if (u == 0 || u == w) {
		    // mass *= 1.5;
		}
	 	particles.push(
                    new Particle(this, u / w, v / h, 0, mass, [u,v])
		);
	    }
	}

	// setup pins
	this.pins = [];
	//var numSegs = xSegs;
	var numSegs = w;
	//for (var i=0; i<=skirt1.w; i++)
	for (var i=0; i<=numSegs; i++)
	    this.pins.push(i);						      

	// Structural

	for (v = 0; v < h; v ++) {
		for (u = 0; u < w; u ++) {
			constrains.push([
				particles[index(u, v)],
				particles[index(u, v + 1)],
				restDistance
			]);
			constrains.push([
				particles[index(u, v)],
				particles[index(u + 1, v)],
				restDistance*rdf(v/h)
			]);
		}
	}

        // Last column
	for (u = w, v = 0; v < h; v ++) {
		constrains.push([
			particles[index(u, v)],
			particles[index(u, v + 1)],
			restDistance

		]);
	}

        // Last row
	for (v = h, u = 0; u < w; u ++) {
		constrains.push([
			particles[index(u, v)],
			particles[index(u + 1, v)],
			restDistance*rdf(v/h)
		]);
	}

	if (SKIRT.closeSeams) {
            report("Adding constraintes to close seam.");
	    for (u = w, v = 0; v <= h; v ++) {
		constrains.push([
			particles[index(0, v)],
			particles[index(u, v)],
			//restDistance
			//restDistance*rdf(v/h)
			0
		]);
	    }
	}

	// While many system uses shear and bend springs,
	// the relax constrains model seem to be just fine
	// using structural springs.
	// Shear
	if (SKIRT.useDiagonals) {
	    report("*** Including diagonal terms ***");
	    var rd2 = restDistance * restDistance;
	    for (v=0;v<h;v++) {
	 	for (u=0;u<w;u++) {
                    var dx = restDistance*rdf(v/h);
                    var dd = Math.sqrt(rd2 + dx*dx);
		    constrains.push([
			 particles[index(u, v)],
			 particles[index(u+1, v+1)],
			 dd
		    ]);

		    constrains.push([
			 particles[index(u+1, v)],
			 particles[index(u, v+1)],
			 dd
		    ]);
	 	}
	    }
	}
	else {
	    report("*** skipping diagonal constraints ***");
	}

	//dumpConstraints();



	this.particles = particles;
	this.constrains = constrains;

	function index(u, v) {
		return u + v * (w + 1);
	}
	this.index = index;

	function dumpConstraints() {
	    var n = constrains.length;
	    for (var i = 0; i<n; i++) {
		var c = constrains[i];
		var p1 = c[0];
		var p2 = c[1];
		var d = c[2];
		var u1 = p1.uv[0];
		var v1 = p1.uv[1];
		var u2 = p2.uv[0];
		var v2 = p2.uv[1];
		report(""+i+" "+
		       p1.ij[0]+" "+p1.ij[1]+" <--> "+
		       p2.ij[0]+" "+p2.ij[1]+"  "+d);
            }
	}


	function simulate(time) {
	    if (!SKIRT.lastTime) {
		SKIRT.lastTime = time;
		return;
	    }

	    var i, il, particles, particle, pt, constrains, constrain;

	    // Aerodynamics forces
	    if (SKIRT.wind) {

		var windMag = SKIRT.windStrength * (Math.cos( time / 7000 ) * 20 + 40);
		SKIRT.windForce.set( Math.sin( time / 2000 ),
				     Math.cos( time / 3000 ),
				     Math.sin( time / 1000 ) ).normalize().multiplyScalar( windMag );

		//var face, faces = clothGeometry.faces, normal;
		var face, faces = this.geometry.faces, normal;

		//particles = skirt1.particles;
		particles = this.particles;

		for (i = 0,il = faces.length; i < il; i ++) {
		    face = faces[i];
		    normal = face.normal;

		    SKIRT.tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(SKIRT.windForce));
		    particles[face.a].addForce(SKIRT.tmpForce);
		    particles[face.b].addForce(SKIRT.tmpForce);
		    particles[face.c].addForce(SKIRT.tmpForce);
		}
	    }
	
	    for (particles = this.particles, i = 0, il = particles.length
		     ; i < il; i ++) {
		particle = particles[i];
		particle.addForce(SKIRT.gravity);
		particle.integrate(SKIRT.TIMESTEP_SQ);
	    }

	    // Start Constrains

	    constrains = this.constrains,
		il = constrains.length;
	    for (i = 0; i < il; i ++) {
		constrain = constrains[i];
		satisfyConstrains(constrain[0], constrain[1], constrain[2]);
	    }

	    // Ball Constrains
	    /*
	    ballPosition.z = -Math.sin(Date.now() / 600) * 90 ; //+ 40;
	    ballPosition.x = Math.cos(Date.now() / 400) * 70;

	    if (sphere.visible) {
		for (particles = this.particles, i = 0, il = particles.length
			 ; i < il; i ++) {
		    particle = particles[i];
		    pos = particle.position;
		    diff.subVectors(pos, ballPosition);
		    if (diff.length() < ballSize) {
			// collided
			diff.normalize().multiplyScalar(ballSize);
			pos.copy(ballPosition).add(diff);
		    }
		}
	    }
	    */

	    // Floor Constains
	    for (particles = this.particles, i = 0, il = particles.length
		     ; i < il; i ++) {
		particle = particles[i];
		pos = particle.position;
		if (pos.y < -250) {
		    pos.y = -250;
		}
	    }

	    if (SKIRT.rotateSkirts) {
		//report("rotateSkirt "+time);
		var dt = time - SKIRT.lastTime;
		var rs = this.rotSpeed * Math.sin(time / (20*1000));
                //this.theta0 = this.rotSpeed*2*Math.PI*dt/1000;
		this.theta0 = rs*2*Math.PI*dt/1000;
		if (SKIRT.CRANK_ANGLE != null) {
                    //report("CRANK_ANGLE: "+SKIRT.CRANK_ANGLE);
		    this.theta0 = SKIRT.CRANK_ANGLE;
                }
		for (i = 0, il = this.pins.length; i < il; i ++) {
		    var xy = this.pins[i];
		    var p = particles[xy];
		    var uv = p.uv;
		    var u = uv[0];
		    var v = uv[1];
		    //report("xy: "+xy+" u:"+u+"  v: "+v);
		    p.original.copy(this.clothFunction(u, v)); // position
		}
	    }

	    // Pin Constrains
	    for (i = 0, il = this.pins.length; i < il; i ++) {
		var xy = this.pins[i];
		var p = particles[xy];
		p.position.copy(p.original);
		p.previous.copy(p.original);
	    }

	    this.updateClothGeometry();
	}

	this.simulate = simulate;

	function updateClothGeometry() {
	    var skirt = this;
	    var cgeom = skirt.geometry;
	    var p = skirt.particles;
	    for ( var i = 0, il = p.length; i < il; i ++ ) {
		cgeom.vertices[ i ].copy( p[ i ].position );
	    }
	    cgeom.computeFaceNormals();
	    cgeom.computeVertexNormals();
	    cgeom.normalsNeedUpdate = true;
	    cgeom.verticesNeedUpdate = true;
	}
	this.updateClothGeometry = updateClothGeometry;

	this.togglePins = function() {
	    report("skirt.togglePins");
	    if (this.pins.length > 0)
		this.pins = [];
	    else {
		for (var i=0; i<numSegs; i++)
		    this.pins.push(i);
	    }
	}
}

// this updates the simulation of all Skirt objects.
SKIRT.simulate = function(time) {
    for (var j=0; j<SKIRT.skirts.length; j++) {
	SKIRT.skirts[j].simulate(time);
    }
}

SKIRT.setupSkirt = function(scene, texPath, pos) {
    if (!pos)
        pos = new THREE.Vector3(0,0,0)
    var skirt = new Skirt(SKIRT.xSegs, SKIRT.ySegs, pos.x, pos.z);
    //skirts.push(skirt);
    var clothTexture = THREE.ImageUtils.loadTexture( texPath );
    clothTexture.wrapS = clothTexture.wrapT = THREE.RepeatWrapping;
    clothTexture.anisotropy = 16;
    var clothMaterial = new THREE.MeshPhongMaterial( { alphaTest: 0.5, color: 0xffffff,
						   specular: 0x030303, emissive: 0x111111, shiness: 10,
						   map: clothTexture, side: THREE.DoubleSide } );

    // cloth geometry
    var clothGeometry = new THREE.ParametricGeometry( skirt.clothFunction, skirt.w, skirt.h );
    clothGeometry.dynamic = true;
    clothGeometry.computeFaceNormals();

    // cloth mesh

    var object = new THREE.Mesh( clothGeometry, clothMaterial );
    object.position.set( 0, 0, 0 );
    object.castShadow = true;
    object.receiveShadow = true;
    scene.add( object );

    var useShaders = false;
    if (useShaders) {
        report("Setting up to use shaders.");
        var uniforms = { texture:  { type: "t", value: clothTexture } };
        var vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
        var fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;
        object.customDepthMaterial = new THREE.ShaderMaterial(
					   { uniforms: uniforms,
					     vertexShader: vertexShader,
					     fragmentShader: fragmentShader } );
    }
    skirt.geometry = clothGeometry;
    return skirt;
}

SKIRT.togglePins = function()
{
    report("SKIRT.togglePins");
    for (var i=0; i<SKIRT.skirts.length; i++)
	SKIRT.skirts[i].togglePins();
}
