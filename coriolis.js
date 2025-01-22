import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
new OrbitControls(camera, renderer.domElement);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;
const particleRadius = 1.1;
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0077be, wireframe: true });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
const earthGroup = new THREE.Group();
earthGroup.add(sphere);

scene.add(earthGroup);

// Rotation logic
function rotateEarth() {
    //earthGroup.rotation.y += 0.01; // Simulate Earth's rotation
}
const particles = [];
const particleGeometry = new THREE.SphereGeometry(0.05, 16, 16);

function createParticle(lat, lon, color = 0xff0000) {
    const particleMaterial = new THREE.MeshBasicMaterial({ color: color });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    const [x, y, z] = calculatePosition(lat, lon, particleRadius);
    particle.position.set(x, y, z);

    const trailMaterial = new THREE.LineBasicMaterial({ color: color });
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([], 3)
    );

    const trail = new THREE.Line(trailGeometry, trailMaterial);

    particles.push({
        mesh: particle,
        lat,
        lon,
        velocity: { x: 0.01, y: 0 },
        trail: [],
        trailMesh: trail
    });

    scene.add(trail);

    scene.add(particle);
}

function calculatePosition(lat, lon, radius) {
    const phi = (lat) * (Math.PI / 180);
    const theta = (lon) * (Math.PI / 180);

    const x = radius * Math.cos(phi) * Math.sin(theta);
    const y = radius * Math.sin(phi);
    const z = radius * Math.cos(phi) * Math.cos(theta);
    return [x, y, z];
}

function updateTrails() {
    particles.forEach((particleObj) => {
        const { mesh, trail, trailMesh } = particleObj;

        // Add the current position to the trail
        trail.push(mesh.position.clone());

        // Limit the length of the trail
        if (trail.length > 10000) {
            trail.shift();
        }

        // Update the trail geometry
        const trailPositions = [];
        trail.forEach((pos) => {
            trailPositions.push(pos.x, pos.y, pos.z);
        });

        trailMesh.geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(trailPositions, 3)
        );
        trailMesh.geometry.computeBoundingSphere();
    });
}


// Add some particles
createParticle(1, 0); // Equator
createParticle(45, 180, 0x00ff00); // Mid-latitude
function applyCoriolisEffect() {
    //const omega = 0.00007292; // Earth's angular velocity (radians/second)
    const omega = 0.01;//0.00007292; // Earth's angular velocity (radians/second)

    particles.forEach((particleObj) => {
        const { mesh, lat, velocity } = particleObj;

        // Approximate Coriolis force (simplified for demonstration)
        const coriolisForce = 2 * omega * velocity.x * Math.sin(lat * (Math.PI / 180));
        velocity.y += coriolisForce;

        // Update longitude and latitude
        particleObj.lon += velocity.x;
        particleObj.lat += velocity.y;

        const [x, y, z] = calculatePosition(particleObj.lat, particleObj.lon, particleRadius);
        mesh.position.set(x, y, z);
    });
}
function animate() {
    requestAnimationFrame(animate);

    rotateEarth();
    applyCoriolisEffect();
    updateTrails();

    renderer.render(scene, camera);
}

animate();
