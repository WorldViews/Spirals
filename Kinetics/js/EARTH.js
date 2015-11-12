
EARTH = {};

EARTH.Earth = function(group, radius)
{
    radius = radius || 200;
    this.init = function() {
        this.loaded = false;
        var loader = new THREE.TextureLoader();
        loader.load( 'textures/land_ocean_ice_cloud_2048.jpg', function ( texture ) {
            var geometry = new THREE.SphereGeometry( radius, 30, 30 );
            var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5 } );
            this.mesh = new THREE.Mesh( geometry, material );
            group.add(this.mesh);
            this.loaded = true;
       });
    }

    this.init();
};

