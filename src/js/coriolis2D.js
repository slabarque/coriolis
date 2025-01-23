import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import getStarfield from './getStarfield.js';

const canvas = document.querySelector('#c');
const view1Elem = document.querySelector('#mainView');
const view2Elem = document.querySelector('#observerView');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
camera.position.z = 5;
const controls = new OrbitControls(camera, view1Elem);
controls.target.set(0, 0, 0);
controls.update();

const observerCamera = new THREE.PerspectiveCamera(100, 2, 0.1, 1000);
observerCamera.position.z = 0.2;
observerCamera.position.y = -0.22;
observerCamera.lookAt(0,5,0);
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
//Circle
const circleGeometry = new THREE.CircleGeometry(1, 32);
const circleMaterial = new THREE.MeshBasicMaterial({ color: 0x5d5d5d, wireframe: true });
const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);
const circleRotationSpeed = 0.005;
const circleGroup = new THREE.Group();
circleGroup.add(circleMesh);
// const observer = new THREE.BufferGeometry();
// observer.setAttribute("position",
//     new THREE.Float32BufferAttribute([-0.1, 0.1, 0,
//         0.1, 0.1, 0,
//         0, -0.1, 0], 3)
// );
// const observerMesh = new THREE.Mesh(observer, circleMaterial);
// circleGroup.add(observerMesh);
circleGroup.add(observerCamera);
scene.add(circleGroup);
function rotateCircle() {
    circleGroup.rotation.z += circleRotationSpeed;
}

//Starts
const stars = getStarfield();
scene.add(stars);

//Particle
const particleGeometry = new THREE.SphereGeometry(0.05, 16, 16);
const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xcc0000 });
const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
particleMesh.position.set(0, 0, 0.0);
scene.add(particleMesh);
let particleSmoothWave = 0.0;
const particleSpeed = 1;
function moveParticleSineWave() {
    particleSmoothWave += Math.PI / 180 * particleSpeed;
    particleSmoothWave = particleSmoothWave % 360;
    particleMesh.position.y = Math.sin(particleSmoothWave);
}

//Observed trail
const observedTrailMaterial = new THREE.LineBasicMaterial({ color: 0xcc0000 });
const observedTrailGeometry = new THREE.BufferGeometry();
observedTrailGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([], 3)
);
const observedTrailMesh = new THREE.Line(observedTrailGeometry, observedTrailMaterial);
circleGroup.add(observedTrailMesh);
const observedTrailLength = 100;
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
    rotateCircle();
    moveParticleSineWave();
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

        const aspect = setScissorForElement(view1Elem);

        // adjust the camera for this aspect
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        //cameraHelper.update();

        // don't draw the camera helper in the original view
        //cameraHelper.visible = false;

        //scene.background.set(0x000000);

        // render
        renderer.render(scene, camera);

    }

    // render from the 2nd camera
    {

        const aspect = setScissorForElement(view2Elem);

        // adjust the camera for this aspect
        observerCamera.aspect = aspect;
        observerCamera.updateProjectionMatrix();

        // draw the camera helper in the 2nd view
        //cameraHelper.visible = true;

        //scene.background.set(0x004040);

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