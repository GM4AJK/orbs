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

import { AU, SCALE_FACTOR, km } from './globals.ts'

const SUN_DIAMETER = 1392000.0 * SCALE_FACTOR; // Sun diameter km

export class Sun {

    private sun: THREE.Group;
    private color: number = 0xfffff;
    private intensity: number = 3;
    private light: THREE.DirectionalLight;
    private lightvec: THREE.Vector3 | null = null;
    private sphere: THREE.Mesh;
    private target: THREE.Object3D | null = null;
    private scene: THREE.Scene | null = null;
    private helper: THREE.DirectionalLightHelper | null = null;

    constructor(
        clock: Date,
        scene: THREE.Scene | null = null,
        target: THREE.Object3D | null = null
    ) {
        const d = SUN_DIAMETER / 4;
        this.sun = new THREE.Group;
        this.light = new THREE.DirectionalLight(this.color, this.intensity);
        this.light.castShadow = true;
        this.light.shadow.camera.left = -d;
        this.light.shadow.camera.right = d;
        this.light.shadow.camera.top = d;
        this.light.shadow.camera.bottom = -d;
        this.light.shadow.camera.near = 1;
        this.light.shadow.camera.far = AU * 2;
        this.light.shadow.mapSize.width = 2048;
        this.light.shadow.mapSize.height = 2048;
        this.sun.add(this.light);
        if (target !== null) {
            this.target = target;
            this.light.target = target;
        }
        if (scene !== null) {
            this.scene = scene;
            this.helper = new THREE.DirectionalLightHelper(this.light, SUN_DIAMETER);
            scene.add(this.helper);
            const dummyTarget = new THREE.Object3D();
            dummyTarget.position.set(0, 0, 0);
            this.light.target = dummyTarget;
            scene.add(dummyTarget);
        }
        this.sphere = this.getSimSun();
        this.sun.add(this.sphere);
        if (clock !== undefined) {
            this.update(clock);
        }
    }

    public getSun(): THREE.Group {
        return this.sun;
    }

    public getScene(): THREE.Scene | null {
        if (this.scene !== null) {
            return this.scene;
        }
        return null;
    }

    public getTarget(): THREE.Object3D | null {
        if (this.target !== null) {
            return this.target;
        }
        return null;
    }

    public setTarget(target: THREE.Object3D) {
        this.target = target;
        this.light.target = target;
    }

    public update(clock: Date) {
        const sunECI = this.positionECI(clock);
        this.updateLight(sunECI);
        this.light.target.updateMatrixWorld();
        if (this.helper !== null) {
            this.helper.update();
        }
    }

    private updateLight(vec: THREE.Vector3) {
        const dirNormalized = vec.clone().normalize();
        const q = new THREE.Quaternion().setFromAxisAngle(dirNormalized, Math.PI); // Z up to Y up
        dirNormalized.applyQuaternion(q);
        this.lightvec = dirNormalized.multiplyScalar(AU);
        this.sun.position.copy(this.lightvec);
    }

    private getSimSun(): THREE.Mesh {
        const radius = SUN_DIAMETER / 2;
        const geometry = new THREE.SphereGeometry(
            radius,
            128,
            128,
        );
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
        });
        return new THREE.Mesh(geometry, material);
    }

    private positionECI(date: Date): THREE.Vector3 {
        const deg2rad = Math.PI / 180;
        // Julian Date
        const JD = date.getTime() / 86400000 + 2440587.5;
        const T = (JD - 2451545.0) / 36525; // Julian centuries since J2000
        // Mean longitude of the Sun (deg)
        const L0 = (280.46646 + 36000.76983 * T) % 360;
        // Mean anomaly of the Sun (deg)
        const M = (357.52911 + 35999.05029 * T) % 360;
        // Equation of center (deg)
        const C =
            (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * deg2rad) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * M * deg2rad) +
            0.000289 * Math.sin(3 * M * deg2rad);
        // True longitude (deg)
        const trueLon = L0 + C;
        // Obliquity of the ecliptic (deg)
        const epsilon = 23.439291 - 0.0130042 * T;
        // Convert to ECI unit vector
        const lonRad = trueLon * deg2rad;
        const epsRad = epsilon * deg2rad;
        const x = Math.cos(lonRad);
        const y = Math.cos(epsRad) * Math.sin(lonRad);
        const z = Math.sin(epsRad) * Math.sin(lonRad);
        let v = new THREE.Vector3(x, z, -y); // ECI is Z UP, ThreeJS is Y UP
        return v.multiplyScalar(149597870700); // in kilometers
    }

    private positionECI_Unused(date: Date): THREE.Vector3 {
        const deg2rad = Math.PI / 180;
        // Julian Date
        const JD = date.getTime() / 86400000 + 2440587.5;
        const T = (JD - 2451545.0) / 36525; // Julian centuries since J2000
        // Mean longitude of the Sun (deg)
        const L0 = (280.46646 + 36000.76983 * T) % 360;
        // Mean anomaly of the Sun (deg)
        const M = (357.52911 + 35999.05029 * T) % 360;
        // Equation of center (deg)
        const C =
            (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * deg2rad) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * M * deg2rad) +
            0.000289 * Math.sin(3 * M * deg2rad);
        // True longitude (deg)
        const trueLon = L0 + C;
        // Obliquity of the ecliptic (deg)
        const epsilon = 23.439291 - 0.0130042 * T;
        // Convert to ECI unit vector
        const lonRad = trueLon * deg2rad;
        const epsRad = epsilon * deg2rad;
        const x = Math.cos(lonRad);
        const y = Math.cos(epsRad) * Math.sin(lonRad);
        const z = Math.sin(epsRad) * Math.sin(lonRad);
        let v = new THREE.Vector3(x, z, -y); // ECI is Z UP, ThreeJS is Y UP
        return v.multiplyScalar(km(AU)); // in kilometers
    }
}
