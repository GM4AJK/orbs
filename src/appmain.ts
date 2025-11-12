/*
MIT license

Copyright (c) 2025 Andy Kirkham All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation, to use the software and to copy, 
distribute, and/or modify this software for any purpose, provided that the above 
copyright notice and this permission notice appear in all copies and substantial 
portions of the software.

THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE 
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THIS SOFTWARE.
*/
import * as THREE from 'three'
import Stats from 'three/addons/libs/stats.module.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { Earth } from './earth';
import { addAxisHelperToScene } from './apputils';
import { getSunECIPosition } from './apputils';
import { ECIControls } from './ECIControls';
import { Clock as AppClock } from './clock';
import { Globals } from './globals';

const SIDEREAL_DAY_SECONDS = 86164;
const earthRotationRate = (2 * Math.PI) / SIDEREAL_DAY_SECONDS;

export class AppMain {

    appClock: AppClock;
    scene: THREE.Scene;
    stats : Stats;
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

    public constructor() {
        // this.firstrun = true;
        // this.lastsuntime = new Date();
        // this.futuresuntime = new Date();
        this.appClock = new AppClock(new Date());
        this.controls = null;
        this.currFrameTimeMS = this.appClock.Date.getMilliseconds();
        this.lastFrameTimeMS = this.appClock.Date.getMilliseconds() - 1000;
        this.sunlight = null;
        this.sundim = null;
        this.stats = new Stats();
        this.scene = new THREE.Scene();

        this.stats.dom.id = "systemstats";
        this.stats.dom.style.color = '#00FF00';
        document.body.appendChild(this.stats.dom);
        
        addAxisHelperToScene(this.scene);
        this.scene.background = new THREE.Color(0x101010); // deep night sky
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

    public main() {
        // maintain the AppClock
        this.appClock.update();
        
        // Handle controls (if required)
        this.controls?.update();

        // Update the stats
        this.stats?.update();

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

    private selectControls(eci: boolean = false) {
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

    private updateSunPos(nowtime: Date) {
        if(this.sunlight !== null) {
            this.scene.remove(this.sunlight);
            this.sunlight.dispose();
        }
        // Sun "dim" genetally highlights the night side of the
        // Earth otherwise it's just a black circle and nothing
        // can be seen. It's positioned opposite to the Sun.
        if(this.sundim !== null) {
            this.scene.remove(this.sundim);
            this.sundim.dispose();
        }
        const sunECI = getSunECIPosition(nowtime);
        const sunDirNormalized = sunECI.clone().normalize();
        // Convert this from ECI Z UP to ThreeJS Y UP
        const q = new THREE.Quaternion().setFromAxisAngle(sunDirNormalized, Math.PI);
        sunDirNormalized.applyQuaternion(q);
        // Now scale it out to the Sun's position in ECI.
        const sunDir = sunDirNormalized.multiplyScalar(150e6);
        this.sunlight = new THREE.DirectionalLight(0xffffff, 1.75);
        this.sunlight.position.copy(sunDir);
        this.sunlight.position.set(sunDir.x, sunDir.y, sunDir.z);
        this.scene.add(this.sunlight);
        this.sundim = new THREE.DirectionalLight(0xC0C0C0, 0.175);
        const antiSunPos = sunDir.clone().multiplyScalar(-1);
        this.sundim.position.set(antiSunPos.x, antiSunPos.y, antiSunPos.z);
        this.scene.add(this.sundim);
        if(Globals.log_sun_position_updates) {
            console.log("Sun updated at " + nowtime.toUTCString());
            console.log(`   with: ${sunDir.x}, ${sunDir.y}, ${sunDir.z}`);
        }
    }

    private updateEarthRotation(deltaTime: number) {
        if(deltaTime >= 100 && deltaTime < 5000) { // Don't break ThreeJS
            // Rotate the Earth.
            const rotRate = earthRotationRate * (deltaTime/1000);
            this.earth.earth.rotation.y += rotRate;
            // Reposition the Sun in the ECI frame
            this.updateSunPos(this.appClock.Date);
        }
    }
}

