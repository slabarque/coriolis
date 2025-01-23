import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import getStarfield from './getStarfield.js';

const canvas = document.querySelector('#c');
const mainView = document.querySelector('#mainView');
const observerView = document.querySelector('#observerView');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
const loader = new THREE.TextureLoader();

const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
camera.position.z = 5;
const controls = new OrbitControls(camera, mainView);
controls.target.set(0, 0, 0);
controls.update();

const gui = new GUI({ container: document.getElementById("gui") });
const settings = {
    showCameraHelper: false,
    sphereRotationSpeed: 1600,
    particleSpeed: 100,
    showEarth: false

};
gui.add(settings, "showCameraHelper").name("Show observer camera");
gui.add(settings, "sphereRotationSpeed", 100, 5000).name("Rotation speed");
gui.add(settings, "particleSpeed", 10, 1000).name("Wind speed");
gui.add(settings, "showEarth").name("Show earth");

const observerCamera = new THREE.PerspectiveCamera(100, 2, 0.1, 1000);
observerCamera.position.z = 1.2;
observerCamera.position.y = -0.22;
observerCamera.lookAt(0, 5, 0);
const cameraHelper = new THREE.CameraHelper(observerCamera);
cameraHelper.material.opacity = 0;
//cameraHelper.setColors(new THREE.Color(0x000000), new THREE.Color(0x00ff00), new THREE.Color(0x0000ff), 0xff0000, 0x000000);
// const observerControls = new OrbitControls(observerCamera, view2Elem);
// observerControls.target.set(0, 0, 0);
// observerControls.update();
//observerCamera.position.z = 0;//.geometry.setAttribute("position", new THREE.Vector3(0,0,0));

const scene = new THREE.Scene();
scene.background = new THREE.Color('black');
scene.add(cameraHelper);
//#region
//Sphere
const sphereGeometry = new THREE.IcosahedronGeometry(1, 8);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x5d5d5d, wireframe: true });
const earthTexture = loader.load("../textures/earthmap1k.jpg");
const sphereEarthMaterial = new THREE.MeshBasicMaterial({
    map: earthTexture
});
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereEarthMaterial);
const sphereGroup = new THREE.Group();
const earthGroup = new THREE.Group();
earthGroup.add(sphereMesh);
earthGroup.rotation.x = 90 * Math.PI / 180;// = 23.4 * Math.Pi / 180;
sphereGroup.add(earthGroup);
// const observer = new THREE.BufferGeometry();
// observer.setAttribute("position",
//     new THREE.Float32BufferAttribute([-0.1, 0.1, 0,
//         0.1, 0.1, 0,
//         0, -0.1, 0], 3)
// );
// const observerMesh = new THREE.Mesh(observer, circleMaterial);
// circleGroup.add(observerMesh);
sphereGroup.add(observerCamera);
scene.add(sphereGroup);
function rotateSphere() {
    sphereGroup.rotation.z += settings.sphereRotationSpeed / 100000;
    if (settings.showEarth && sphereMesh.material.wireframe)
        sphereMesh.material = sphereEarthMaterial;
    if (!settings.showEarth && !sphereMesh.material.wireframe)
        sphereMesh.material = sphereMaterial;
}

//Starts
const stars = getStarfield();
scene.add(stars);

//Particle
const particleGeometry = new THREE.SphereGeometry(0.05, 16, 16);
const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xcc0000 });
const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
let particleLat = 0;
const initialPosition = calculatePosition(particleLat, 0, 1);
console.log(initialPosition);
particleMesh.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
scene.add(particleMesh);
function moveParticleCircle() {
    particleLat -= Math.PI / 180 * (settings.particleSpeed / 10);
    particleLat = particleLat % 360;
    const position = calculatePosition(particleLat, 0, 1);
    console.log(particleLat);
    console.log(position);

    particleMesh.position.set(position.x, position.y, position.z);
}

function calculatePosition(lat, lon, radius) {
    const phi = (lat) * (Math.PI / 180);
    const theta = (lon) * (Math.PI / 180);

    // const x = Math.round(radius * Math.cos(phi) * Math.sin(theta), 100);
    // const y = Math.round(radius * Math.sin(phi), 100);
    // const z = Math.round(radius * Math.cos(phi) * Math.cos(theta), 100);
    const x = radius * Math.cos(phi) * Math.sin(theta);
    const y = radius * Math.sin(phi);
    const z = radius * Math.cos(phi) * Math.cos(theta);
    return new THREE.Vector3(x, y, z);
}

//Observed trail
const observedTrailMaterial = new THREE.LineBasicMaterial({ color: 0xcc0000 });
const observedTrailGeometry = new THREE.BufferGeometry();
observedTrailGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([], 3)
);
const observedTrailMesh = new THREE.Line(observedTrailGeometry, observedTrailMaterial);
sphereGroup.add(observedTrailMesh);
const observedTrailLength = 500;
function updateObservedTrail() {
    const position = observedTrailMesh.geometry.getAttribute("position");
    const trailPositions = [...position.array];
    if (trailPositions.length > 3 * observedTrailLength) {
        trailPositions.shift();
        trailPositions.shift();
        trailPositions.shift();
    }
    const vertex = observedTrailMesh.worldToLocal(particleMesh.position.clone());
    trailPositions.push(vertex.x, vertex.y, vertex.z)
    observedTrailMesh.geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(trailPositions, 3)
    );
    observedTrailMesh.geometry.computeBoundingSphere();
}
//Theoretic trail
const theoreticTrailMaterial = new THREE.LineBasicMaterial({ color: 0x00cc00 });
const theoreticTrailGeometry = new THREE.BufferGeometry();
theoreticTrailGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([], 3)
);
const theoreticTrailMesh = new THREE.Line(theoreticTrailGeometry, theoreticTrailMaterial);
scene.add(theoreticTrailMesh);
const theoreticTrailLength = 300;
function updateTheoreticTrail() {
    const position = theoreticTrailMesh.geometry.getAttribute("position");
    const trailPositions = [...position.array];
    if (trailPositions.length > 3 * theoreticTrailLength) {
        trailPositions.shift();
        trailPositions.shift();
        trailPositions.shift();
    }
    trailPositions.push(particleMesh.position.x, particleMesh.position.y, particleMesh.position.z)
    theoreticTrailMesh.geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(trailPositions, 3)
    );
    theoreticTrailMesh.geometry.computeBoundingSphere();
}


const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(hemiLight);
//#endregion

function animate() {
    render();
    requestAnimationFrame(animate);
    rotateSphere();
    moveParticleCircle();
    updateObservedTrail();
    updateTheoreticTrail();
    //renderer.render(scene, camera);
}
animate();

function render() {

    resizeRendererToDisplaySize(renderer);

    // turn on the scissor
    renderer.setScissorTest(true);

    // render the original view
    {
        const aspect = setScissorForElement(mainView);

        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        //cameraHelper.update();

        cameraHelper.visible = settings.showCameraHelper;

        renderer.render(scene, camera);
    }

    // render from the 2nd camera
    {
        const aspect = setScissorForElement(observerView);

        observerCamera.aspect = aspect;
        observerCamera.updateProjectionMatrix();

        cameraHelper.visible = false;

        renderer.render(scene, observerCamera);
    }
}


function resizeRendererToDisplaySize(renderer) {

    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {

        renderer.setSize(width, height, false);

    }

    return needResize;

}

function setScissorForElement(elem) {

    const canvasRect = canvas.getBoundingClientRect();
    const elemRect = elem.getBoundingClientRect();

    // compute a canvas relative rectangle
    const right = Math.min(elemRect.right, canvasRect.right) - canvasRect.left;
    const left = Math.max(0, elemRect.left - canvasRect.left);
    const bottom = Math.min(elemRect.bottom, canvasRect.bottom) - canvasRect.top;
    const top = Math.max(0, elemRect.top - canvasRect.top);

    const width = Math.min(canvasRect.width, right - left);
    const height = Math.min(canvasRect.height, bottom - top);

    // setup the scissor to only render to that part of the canvas
    const positiveYUpBottom = canvasRect.height - bottom;
    renderer.setScissor(left, positiveYUpBottom, width, height);
    renderer.setViewport(left, positiveYUpBottom, width, height);

    // return the aspect
    return width / height;

}

// function handleWindowResize() {
//     const w = window.innerWidth;
//     const h = window.innerHeight;
//     camera.aspect = w / h;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// }
// window.addEventListener('resize', handleWindowResize, false);
//renderer.setAnimationLoop(animate);