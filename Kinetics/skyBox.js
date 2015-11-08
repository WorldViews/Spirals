
function getSkyBox()
{
    var path = "textures/cube/skybox/";
    var format = '.jpg';
    var urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];
    var textureCube = THREE.ImageUtils.loadTextureCube( urls, THREE.CubeRefractionMapping );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, envMap: textureCube, refractionRatio: 0.95 } );
    var sbox = {
        'textureCube': textureCube,
        'material': material
    };

    var shader = THREE.ShaderLib[ "cube" ];
    shader.uniforms[ "tCube" ].value = textureCube;
    var material = new THREE.ShaderMaterial( {
					fragmentShader: shader.fragmentShader,
					vertexShader: shader.vertexShader,
					uniforms: shader.uniforms,
					depthWrite: false,
					side: THREE.BackSide
				} ),
    mesh = new THREE.Mesh( new THREE.BoxGeometry( 100, 100, 100 ), material );
    sbox.mesh = mesh;
    return sbox;
}
