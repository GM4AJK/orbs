
/*
import './style.css'
import * as THREE from 'three'
//import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'
//import { HumanCamera } from './humanint.js';


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010); // deep night sky

// Debug grid helper
// const size = 500;
// const divisions = 10;
// const gridHelper = new THREE.GridHelper(size, divisions, 0xAAAAAA, 0x888888);
// scene.add(gridHelper);
const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);
import { debugGridsHelper } from './debug_utils.js';
const [gridXZ, gridXY, gridYZ] = debugGridsHelper(100, 50);
scene.add(gridXZ, gridXY, gridYZ);

import { meridians } from './debug_utils.js';
const meridianLines = meridians(10);
meridianLines.forEach(line => scene.add(line));

// Camera and Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);

import { PanAndTiltControls } from './PanAndTiltControls.js';
const panAndTilt = new PanAndTiltControls(camera);

// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.05;
// controls.enablePan = false;
// controls.minDistance = 50;
// controls.maxDistance = 500;
// controls.target.set(0, 0, 0);
// controls.update();
// camera.position.set(0, 100, 0);

scene.add(new THREE.AxesHelper(100));

const stats = new Stats();
document.body.appendChild(stats.dom);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
})

// import { defaultOceanSceneParams, getOceanScene } from './oceanscene.js';
// const oceanscene = getOceanScene({
//   ...defaultOceanSceneParams,
//   radius: 500, 
// });
// scene.add(oceanscene);

import { defaultLandSceneParams, getLandScene } from './landscene.js';
const landscene = getLandScene({
    ...defaultLandSceneParams,
    radius: 500,
    color: 0x002000
});
scene.add(landscene);

import { getStarField } from './starfield.js';
const starField = getStarField();
scene.add(starField);

// import { tiltAxisHelper } from './debug_utils.js';
// scene.add(tiltAxisHelper(camera));

// var camworld = new THREE.Vector3();
// camera.getWorldPosition(camworld);

function animate() {
  requestAnimationFrame(animate);
  //controls.update();
  panAndTilt.update();
  renderer.render(scene, camera);
  stats.update();
  //const v = THREE.Vector3(0,0,0);
  //oceanscene.material.uniforms['time'].value += 1.0 / 60.0;
  // const p = new THREE.Vector3();
  // camera.getWorldPosition(p);
  // // if(p !== camworld) {
  //   //console.log(`Camera position: x=${p.x.toFixed(2)} y=${p.y.toFixed(2)} z=${p.z.toFixed(2)}`);
  //   camworld = p;
  // }

}

animate()
*/