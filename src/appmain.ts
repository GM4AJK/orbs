

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { Earth } from './earth';
import { addAxisHelperToScene } from './apputils';
import { getSunECIPosition } from './apputils';
import { ECIControls } from './ECIControls';
import { Clock as AppClock } from './clock';

const SIDEREAL_DAY_SECONDS = 86164;
const earthRotationRate = (2 * Math.PI) / SIDEREAL_DAY_SECONDS;

export class AppMain {

    appClock: AppClock;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer:THREE.WebGLRenderer;
    sunlight: THREE.DirectionalLight | THREE.PointLight | null;
    sundim: THREE.DirectionalLight | THREE.PointLight | null;
    controls: OrbitControls | ECIControls | null;
    
    currFrameTimeMS: number;
    lastFrameTimeMS: number;

    earth: any;

    // How THREE axis are aligned.
    // +X = vernal equinox
    // +Y = north pole
    // +Z = completes the right handed system

    constructor() {
        // this.firstrun = true;
        // this.lastsuntime = new Date();
        // this.futuresuntime = new Date();
        this.appClock = new AppClock(new Date());
        this.controls = null;
        this.currFrameTimeMS = this.appClock.Date.getMilliseconds();
        this.lastFrameTimeMS = this.appClock.Date.getMilliseconds() - 1000;
        this.sunlight = null;
        this.sundim = null;
        this.scene = new THREE.Scene();
        
        addAxisHelperToScene(this.scene);
        this.scene.background = new THREE.Color(0x000010); // deep night sky
        //const axesHelper = new THREE.AxesHelper(10000);
        //this.scene.add(axesHelper);
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50000);
        this.camera.position.set(10000, 10000, 10000);
        const vec = new THREE.Vector3(0, 0, 0);
        this.camera.lookAt(vec);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.earth = new Earth(this.scene, this.appClock);
        this.selectControls(false);
        document.body.appendChild(this.renderer.domElement);
    }

    main() {
        // maintain the AppClock
        this.appClock.update();
        
        // Handle controls (if required)
        this.controls?.update();

        //let nowT = this.appClock.getMilliseconds(); //Date.now();
        //this.earth.addISS(this.scene, this.appClock);
        //let delaTime: number = nowT - this.lastFrameTime;
        //let delaTime: number = this.appClock

        let nowMS = this.appClock.Date.getTime();
        let deltaMS = nowMS - this.lastFrameTimeMS;
        //this.lastFrameTimeMS = nowMS;
        if(deltaMS > 100) {
            this.updateEarthRotation(deltaMS);
            this.updateSunPos(this.appClock.Date);
            //this.earth.addISS(this.scene, this.appClock.Date);
            //this.earth.addCSS(this.scene, this.appClock.Date);
            this.earth.update(this.appClock.Date);
            this.lastFrameTimeMS = nowMS;
            this.renderer.render(this.scene, this.camera);
            //console.log(`Camera: X=${this.camera.position.x}, Y=${this.camera.position.y}, Z=${this.camera.position.z}`);
        }
        //this.renderer.render(this.scene, this.camera);
    }

    selectControls(eci: boolean = false) {
        if(eci === false) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        }
        else {
            this.controls = new ECIControls(this.camera, this.renderer.domElement);
            this.scene.up.set(0, 0, 1); // Because ECI is +Z UP
            this.camera.up.set(0, 0, 1); // Because ECI is +Z UP
            this.earth.earthMesh.rotation.x - Math.PI/2; // Because ECI is +Z UP
        }
    }

    updateSunPos(nowtime: Date) {
        if(this.sunlight !== null) {
            this.scene.remove(this.sunlight);
            this.sunlight.dispose();
        }
        if(this.sundim !== null) {
            this.scene.remove(this.sundim);
            this.sundim.dispose();
        }
        //const sunECI = getSunECIPosition(nowtime);
        //const sunECI = getSunSceneAlignedPosition(nowtime);
        const sunECI = getSunECIPosition(nowtime);
        const sunDir = sunECI.clone().normalize().multiplyScalar(150e6);
        //sunDir.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
        this.sunlight = new THREE.DirectionalLight(0xffffff, 0.75);
        this.sunlight.position.copy(sunDir);
        //this.sunlight = new THREE.PointLight(0xffffff, 1000000, 150e6, 2);
        this.sunlight.position.set(sunDir.x, sunDir.y, sunDir.z);
        this.scene.add(this.sunlight);

        this.sundim = new THREE.DirectionalLight(0xB08080, 0.175);
        const antiSunPos = sunDir.clone().multiplyScalar(-1);
        this.sundim.position.set(antiSunPos.x, antiSunPos.y, antiSunPos.z);
        this.scene.add(this.sundim);
        //console.log("Sun updated at " + nowtime.toUTCString());
        //console.log(`   with: ${sunDir.x}, ${sunDir.y}, ${sunDir.z}`);
    }

    updateEarthRotation(deltaTime: number) {
        if(deltaTime >= 100 && deltaTime < 5000) { // Don't break ThreeJS
            // Rotate the Earth.
            const rotRate = earthRotationRate * (deltaTime/1000);
            //this.earth.earthMesh.rotation.y += rotRate;
            this.earth.earth.rotation.y += rotRate;

            // Reposition the Sun in the ECI frame
            //const d = new Date();
            this.updateSunPos(this.appClock.Date);
        }
    }
}

