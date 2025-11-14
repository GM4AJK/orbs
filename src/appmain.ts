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

import { Sun } from './sun.ts';
import { Earth } from './earth';
import { Clock as AppClock } from './clock';
import { Globals } from './globals';
import { APPUTILS } from './apputils';

// How THREE axis are aligned.
// +X = vernal equinox
// +Y = north pole
// +Z = completes the right handed system

export class AppMain {

    public appClock: AppClock;
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    
    public sun: Sun;
    public earth: Earth;

    private stats: Stats;
    private controls: OrbitControls;

    public constructor() {
        this.appClock = new AppClock(new Date());
        this.appClock.setSpeed(1000);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x101010); // deep night sky
        // The large distance is needed to pick out the simulated Sun -----------------------------v
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 350000); 
        this.camera.position.set(100, 0, 0);
        const vec = new THREE.Vector3(0, 0, 0);
        this.camera.lookAt(vec);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.stats = new Stats();
        this.stats.dom.id = "systemstats";
        this.stats.dom.style.color = '#00FF00';
        this.earth = new Earth(this);
        if(Globals.showWorldAxisHelperArrows === true) {
           this.scene.add(APPUTILS.createWorldAxisHelper(20));
        }
        if(Globals.useAmbientLight === true) {
            const ambientLight = new THREE.AmbientLight( Globals.ambientLightValue );
            this.scene.add(ambientLight);
        }
        this.sun = new Sun(this);
        this.scene.add(this.sun.sun);
        document.body.appendChild(this.renderer.domElement);
        document.body.appendChild(this.stats.dom);
    }

    public animate() {
        // maintain the AppClock
        this.appClock.update();
        // Handle controls (if required)
        this.controls?.update();
        // Update the stats
        this.stats?.update();
        this.sun?.update(this.appClock.Date);
        // Update Earth
        this.earth?.update(this.appClock.Date);
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    private updateSunPos(nowtime: Date) {
        if (this.sunlight !== null) {
            this.scene.remove(this.sunlight);
            this.sunlight.dispose();
        }
        // Sun "dim" genetally highlights the night side of the
        // Earth otherwise it's just a black circle and nothing
        // can be seen. It's positioned opposite to the Sun.
        if (this.sundim !== null) {
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
        if (Globals.log_sun_position_updates) {
            console.log("Sun updated at " + nowtime.toUTCString());
            console.log(`   with: ${sunDir.x}, ${sunDir.y}, ${sunDir.z}`);
        }
    }

    private updateEarthRotation(deltaTime: number) {
        if (deltaTime >= 100 && deltaTime < 5000) { // Don't break ThreeJS
            // Rotate the Earth.
            const rotRate = earthRotationRate * (deltaTime / 1000);
            this.earth.earth.rotation.y += rotRate;
            // Reposition the Sun in the ECI frame
            this.updateSunPos(this.appClock.Date);
        }
    }
}

