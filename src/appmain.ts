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

import { Sun } from './sun';
import { Clock as AppClock } from './clock';
import { Earth } from './earth';
import { Globals, km } from './globals';
import { addAxisHelperToScene } from './apputils';
import { ECIControls } from './ECIControls';

const SIDEREAL_DAY_SECONDS = 86164;
const earthRotationRate = (2 * Math.PI) / SIDEREAL_DAY_SECONDS;

export class AppMain {

    static readonly AU = 1;
    static readonly SCENE_SCALE = 1/this.AU;

    public static SCALE(i: number): number { return i * this.SCENE_SCALE; }

    appClock: AppClock;
    scene: THREE.Scene;
    stats: Stats;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    amblight: THREE.AmbientLight;
    controls: OrbitControls | ECIControls | null;

    currFrameTimeMS: number;
    lastFrameTimeMS: number;

    sun: Sun;

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

        this.stats = new Stats();
        this.scene = new THREE.Scene();
        this.sun = new Sun(this.appClock.Date, this.scene, null);
        this.scene.add(this.sun.getSun());
        this.amblight = new THREE.AmbientLight( 0x242824 );
        //this.scene.add(this.amblight);

        this.stats.dom.id = "systemstats";
        this.stats.dom.style.color = '#00FF00';
        document.body.appendChild(this.stats.dom);

        if(Globals.display_axis_helper) {
            // X red vernal equinox
            // Y blu north pole
            // Z grn the remaining orthoganal direction
            addAxisHelperToScene(this.scene);
        }
        this.scene.background = new THREE.Color(0x101010); // deep night sky
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0, km(200e6));
        this.camera.position.set(km(10000), km(10000), km(10000));
        const vec = new THREE.Vector3(0, 0, 0);
        this.camera.lookAt(vec);
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.earth = new Earth(this.scene, this.appClock);
        this.selectControls(false);
        this.appClock.setSpeed(100);
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
        if (deltaMS > 100) {
            this.updateEarthRotation(this.appClock.getDelta());
            this.sun.update(this.appClock.Date);
            //this.updateSunPos(this.appClock.Date);
            //this.earth.addISS(this.scene, this.appClock.Date);
            //this.earth.addCSS(this.scene, this.appClock.Date);
            this.earth.update(this.appClock.Date);
            this.lastFrameTimeMS = nowMS;
            this.renderer.render(this.scene, this.camera);
            console.log(`Camera: X=${this.camera.position.x}, Y=${this.camera.position.y}, Z=${this.camera.position.z}`);
        }
        //this.renderer.render(this.scene, this.camera);
    }

    private selectControls(eci: boolean = false) {
        if (eci === false) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        }
        else {
            this.controls = new ECIControls(this.camera, this.renderer.domElement);
            this.scene.up.set(0, 0, 1); // Because ECI is +Z UP
            this.camera.up.set(0, 0, 1); // Because ECI is +Z UP
            this.earth.earthMesh.rotation.x - Math.PI / 2; // Because ECI is +Z UP
        }
    }

    private updateEarthRotation(deltaTime: number) {
        // Rotate the Earth.
        const rotRate = earthRotationRate * (deltaTime / 1000);
        this.earth.planet.rotation.y += rotRate;
    }
}

