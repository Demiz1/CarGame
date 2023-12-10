import * as THREE from './Three/build/three.module.js';
import { OrbitControls } from './Three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from './Three/examples/jsm/loaders/GLTFLoader.js'
import { GUI } from './lil-gui.js'
import * as CANNON from './Cannon/dist/cannon-es.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(2, 0.5, 2);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set(0, 0, 0);
controls.update();

const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
})

{
    const planeSize = 40;

    const loader = new THREE.TextureLoader();
    const texture = loader.load( 'checker.png' );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    const repeats = planeSize / 2;
    texture.repeat.set( repeats, repeats );

    const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
    const planeMat = new THREE.MeshPhongMaterial( {
        map: texture,
        side: THREE.DoubleSide,
    } );
    const mesh = new THREE.Mesh( planeGeo, planeMat );
    mesh.rotation.x = Math.PI * - .5;
    mesh.position.set(0,-1,0)
    scene.add( mesh );
    
    const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane(),
      })
      groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
      world.addBody(groundBody)  
}

{
    const cubeSize = 4;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = new THREE.MeshPhongMaterial({color: '#8AC'});
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(cubeSize + 1, cubeSize / 2, 0);
    scene.add(mesh);
}

let cannon_sphereBody = null
let three_mesh = null
{
    const sphereRadius = 3;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
    const sphereMat = new THREE.MeshPhongMaterial({color: '#CA8'});
    three_mesh = new THREE.Mesh(sphereGeo, sphereMat);
    three_mesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
    scene.add(three_mesh);
    // Create a sphere body
    const radius = 3 // m
    cannon_sphereBody = new CANNON.Body({
    mass: 5, // kg
    shape: new CANNON.Sphere(radius),
    })
    cannon_sphereBody.position.set(...three_mesh.position) // m
    world.addBody(cannon_sphereBody)
}

{
    class ColorGUIHelper {
        constructor(object, prop) {
            this.object = object;
            this.prop = prop;
        }
        get value() {
            return `#${this.object[this.prop].getHexString()}`;
        }
        set value(hexString) {
            this.object[this.prop].set(hexString);
        }
    }

    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);

    const gui = new GUI();
    gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
    gui.add(light, 'intensity', 0, 2, 0.01);
}

  
let modelWheelHelper = null
const GLTFloader = new GLTFLoader();
GLTFloader.load( 'car_a3.glb', function (gltf){
    scene.add(gltf.scene);
    
    var flwa = scene.getObjectByName( "FrontLeftAxel", true );
    var frwa = scene.getObjectByName( "FrontRightAxel", true );

    var flw = scene.getObjectByName( "FrontLeftWheel", true );
    var frw = scene.getObjectByName( "FrontRightWheel", true );
    var bw = scene.getObjectByName( "BackWheels", true );
    let car = scene.getObjectByName("Car_MainBody",true);
    modelWheelHelper = {
        setTurnAngle: function(angle){
            flwa.rotation.y = angle
            frwa.rotation.y = angle
        },
        setRotationAngle: function(angle){
            flw.rotation.y = -angle
            frw.rotation.y = -angle
            bw.rotation.x = angle
        },
        car: car
    }
}, undefined, function(error){
	console.error(error);
});


//todo fix proper resizing when development tab is open.
function resizeRendererToDisplaySize( renderer ) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if ( needResize ) {
        renderer.setSize( width, height, false );
    }
    return needResize;
}

function render(timestamp) {
    if ( resizeRendererToDisplaySize( renderer ) ) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    world.fixedStep()

    three_mesh.position.copy(cannon_sphereBody.position)
    three_mesh.quaternion.copy(cannon_sphereBody.quaternion)

    //update the car model
    if(modelWheelHelper != null) { 
        let ang = Math.sin(timestamp/1000) * Math.PI/10;
        modelWheelHelper.setTurnAngle(ang)
        modelWheelHelper.setRotationAngle(timestamp/100)
        modelWheelHelper.car.position.z = Math.sin(timestamp/1000)
    }
    
    renderer.render( scene, camera );
    requestAnimationFrame( render );
}
requestAnimationFrame( render );