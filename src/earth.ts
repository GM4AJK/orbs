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

//import { Globals as Globals } from './globals.ts';

import * as satellite from 'satellite.js';

import { Clock as AppClock } from './clock.ts';
import { AppSat } from './appsat.ts';
import { AppSatMgr } from './appsatmgr.ts';
import { geodeticToECEF } from './apputils.ts';

export class Earth {

    // Allow modules to add and remove ThreeJS objects.
    public earth: THREE.Group;

    private appSatArray: Map<string, AppSat>;
    private appSatMgr: AppSatMgr | null = null;
    private appClock: AppClock;
    private iss: AppSat | null = null;
    private css: AppSat | null = null;
    private earthRadiusKm: number = 6371; // Earth's mean radius in kilometers
    private earthMesh: THREE.Mesh;

    // @ts-ignore
    private satelliteOrbitsMap: Map<string, THREE.Line<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>>;

    // @ts-ignore
    private satelliteSpotsMap: Map<string, THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>>;

    constructor(scene: THREE.Scene | null, appClock: AppClock) {
        this.appSatArray = new Map();
        this.appSatMgr = new AppSatMgr(this);
        //this.appSatMgr.init();
        this.appSatMgr.init("TLEs/starlink/grouped_shells_json/shell_300km/plane_20.json");
        this.earth = new THREE.Group();
        this.appClock = appClock;
        this.satelliteSpotsMap = new Map<string, THREE.Mesh>;
        this.satelliteOrbitsMap = new Map<string, THREE.Line>;
        const textureLoader = new THREE.TextureLoader();
        const earthTexture = textureLoader.load('textures/2_no_clouds_8k.jpg');
        const earthGeometry = new THREE.SphereGeometry(this.earthRadiusKm, 256, 256);
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: earthTexture,
            specular: new THREE.Color('grey'),
            shininess: 5
        });
        this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial); // Default alignment is meridian aligned X axis
        this.earth.add(this.earthMesh);
        // Align the mesh to GMST
        const now = this.appClock.Date;
        const gmst = satellite.gstime(now);
        this.earth.rotation.y = gmst;
        //this.earth.rotation.x = THREE.MathUtils.degToRad(EARTH_TILT_DEGREES);
        if (scene !== null) {
            const london = this.createSurfaceSpot(51.5, -0.12, 0.1);
            this.earth.add(london);
            const edinburgh = this.createSurfaceSpot(56.5, -3.12, 0.1);
            this.earth.add(edinburgh);
            this.earth.add(this.getEquator());
            this.earth.add(this.getMeridian());
            scene.add(this.earth);
        }
    }

    private updateCounter: number = 0;

    public update(clock: Date) {
        this.appSatMgr?.updateSatellitesNew(clock);
    }

    public getEarthMesh(): THREE.Mesh {
        return this.earthMesh;
    }

    private getEquator(): THREE.LineLoop {
        const ring = this.createGreatCircleRing(this.earthRadiusKm + 250, 256, 0xff0000); // Red
        ring.rotation.y = Math.PI / 2; // Lay flat in XY plane
        return ring;
    }

    private getMeridian(): THREE.LineLoop {
        const ring = this.createGreatCircleRing(this.earthRadiusKm + 250, 256, 0x00ff00); // Green
        ring.rotateX(Math.PI / 2);
        return ring;
    }

    /**
     * Note, when adding surface markers like a spot to the this.earth object
     * then time (gmst) does not need to be considered as the this.earth object
     * is rotated as required and carries along with it any child objects.
     * @param lat_deg number in degrees
     * @param lon_deg number in degrees
     * @param alt_km  number in kilometers
     * @returns 
     */
    public createSurfaceSpot(lat_deg: number, lon_deg: number, alt_km: number): THREE.Mesh {
        const ecef: THREE.Vector3 = geodeticToECEF(lat_deg, lon_deg, alt_km);
        const color: number = 0xff00ff;
        const geometry = new THREE.SphereGeometry(50, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color });
        let spot = new THREE.Mesh(geometry, material);
        spot.position.set(ecef.x, ecef.y, ecef.z);
        return spot;
    }

    private createGreatCircleRing(radius: number, segments: number, color: number): THREE.LineLoop {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * 2 * Math.PI;
            points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)
            ));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color });
        return new THREE.LineLoop(geometry, material);
    }
}