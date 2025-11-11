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

import * as satellite from 'satellite.js';
import { Clock as AppClock } from './clock.ts';
import { AppSat } from './appsat.ts';

const EARTH_TILT_DEGREES = 23.4;

const ISS: satellite.OMMJsonObject = {
    "OBJECT_NAME": "ISS (ZARYA)",
    "OBJECT_ID": "1998-067A",
    "EPOCH": "2025-11-10T19:21:41.474592",
    "MEAN_MOTION": 15.49512626,
    "ECCENTRICITY": 0.00041371,
    "INCLINATION": 51.6337,
    "RA_OF_ASC_NODE": 300.5531,
    "ARG_OF_PERICENTER": 56.1394,
    "MEAN_ANOMALY": 303.9988,
    "EPHEMERIS_TYPE": 0,
    "CLASSIFICATION_TYPE": "U",
    "NORAD_CAT_ID": 25544,
    "ELEMENT_SET_NO": 999,
    "REV_AT_EPOCH": 53790,
    "BSTAR": 0.00020668468,
    "MEAN_MOTION_DOT": 0.00011159,
    "MEAN_MOTION_DDOT": 0
  };

  const CSS: satellite.OMMJsonObject =  {
    "OBJECT_NAME": "CSS (TIANHE)",
    "OBJECT_ID": "2021-035A",
    "EPOCH": "2025-11-10T22:38:39.077376",
    "MEAN_MOTION": 15.60859823,
    "ECCENTRICITY": 0.00047056,
    "INCLINATION": 41.4651,
    "RA_OF_ASC_NODE": 209.7335,
    "ARG_OF_PERICENTER": 1.026,
    "MEAN_ANOMALY": 359.0588,
    "EPHEMERIS_TYPE": 0,
    "CLASSIFICATION_TYPE": "U",
    "NORAD_CAT_ID": 48274,
    "ELEMENT_SET_NO": 999,
    "REV_AT_EPOCH": 25906,
    "BSTAR": 0.0004154796,
    "MEAN_MOTION_DOT": 0.00035552,
    "MEAN_MOTION_DDOT": 0
  };

// const iss_l0: string = "ISS (ZARYA)";
// const iss_l1: string = "1 25544U 98067A   25313.96830531  .00008626  00000+0  16179-3 0  9997";
// const iss_l2: string = "2 25544  51.6342 304.7042 0004075  52.7615 307.3745 15.49490024537771";

export class Earth {

    // Allow modules to add and remove ThreeJS objects.
    public earth: THREE.Group;

    private appSatArray: Map<string, AppSat>;
    private appClock: AppClock;
    private iss: AppSat | null;
    private css: AppSat | null;
    private earthRadiusKm: number = 6371; // Earth's mean radius in kilometers
    private earthMesh: THREE.Mesh;
    private _satelliteOrbitsMap: Map<string, THREE.Line<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>>;
    private _satelliteSpotsMap: Map<string, THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>>;

    constructor(scene: THREE.Scene | null, appClock: AppClock) {
        this.appSatArray = new Map();
        this.iss = AppSat.Factory_FromJsonOMM(ISS);
        if(this.iss !== null) {
            this.appSatArray.set("iss", this.iss);
        }
        this.css = AppSat.Factory_FromJsonOMM(CSS);
        if(this.css !== null) {
            this.appSatArray.set("css", this.css);
        }
        this.earth = new THREE.Group();
        this.appClock = appClock;
        this._satelliteSpotsMap = new Map<string, THREE.Mesh>; 
        this._satelliteOrbitsMap = new Map<string, THREE.Line>; 
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
        this.earth.rotation.x = THREE.MathUtils.degToRad(EARTH_TILT_DEGREES);
        if(scene !== null) {
            this.earth.add(this.getEquator());
            this.earth.add(this.getMeridian()); 
            scene.add(this.earth);
        }
    }

    private specialCases(name: string): [number, number] | [null, null] {
        // ISS and CSS are special cases so color them
        if(name == 'ISS (ZARYA)') { 
            return [0xff0000, 50];
        }
        if(name == 'CSS (TIANHE)') { 
            return [0xffff00, 50];
        }
        return [null, null];
    }

    public update(clock: Date) {
        this.appSatArray.forEach((sat:AppSat, _name:string) => {
            let color = null;
            let radius = null;
            if(sat.line0 !== null) {
                [color, radius] = this.specialCases(sat.line0);
            }
            const result = sat.update(clock, color, radius);
            if(result !== null) {
                const spot = sat.getSpot();
                if(spot !== null) {
                    const old = sat.getOldSpot();
                    if(old !== null) {
                        this.earth.remove(old);
                        sat.spotDispose(old);
                    }
                    this.earth.add(spot);
                    //console.log(sat.toString());
                }
            }
        });
    }

    getEarth(): THREE.Mesh {
        return this.earthMesh;
    }

    getEquator(): THREE.LineLoop {
        const ring = this.createGreatCircleRing(this.earthRadiusKm + 250, 256, 0xff0000); // Red
        ring.rotation.y = Math.PI / 2; // Lay flat in XY plane
        return ring;
    }

    getMeridian(): THREE.LineLoop {
        const ring = this.createGreatCircleRing(this.earthRadiusKm + 250, 256, 0x00ff00); // Green
        ring.rotateX(Math.PI/2);
        return ring;
    }
 
/*
    createOrbitFromTLE(tleJson: satellite.OMMJsonObjectV3, color: number = 0x00ffff, seconds: number = 10): THREE.Line | null {
        const satrec = satellite.json2satrec(tleJson);
        const points = [];
        if(satrec !== null) {
            for (let i = -seconds; i <= seconds+10; i++) {
                const time = new Date(this.appClock.Date.getTime() + i * 1000);
                const info = this.iss?.positionAT(time, true, true);
                if(info !== null && info !== undefined) {
                    points.push(info.threejs); 
                    continue;
                }
                //const time = this.appClock.Date(now.getTime() + i * 60 * 1000);
                const prop = satellite.propagate(satrec, time);
                if(prop !== null) {
                    const positionEci = prop.position;
                    if (positionEci === null) continue;
                    const gmst = satellite.gstime(time);
                    //const geo = satellite.eciToGeodetic(positionEci, gmst);
                    //console.log(`Satellite Lat:${geo.latitude} Lon:${geo.longitude}`);
                    const positionEcf = satellite.eciToEcf(positionEci, gmst);
                    // Convert to Three.js Y-up (Z-up ECI → Y-up Three.js)
                    const x = positionEcf.x;
                    const y = positionEcf.z; // Z-up to Y-up conversion
                    const z = -positionEcf.y;
                    let vec = new THREE.Vector3(x, y, z);
                    vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2);
                    //vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(23.4));
                    points.push(vec); 
                }
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color });
            const orbitLine = new THREE.Line(geometry, material);
            return orbitLine;
        }
        return null;
    }

    createSatelliteSpot(tleJson: any, attime: Date, color: number = 0xffff00): THREE.Mesh | null {
        const info = this.iss?.positionAT(attime);
        if(info !== null && info !== undefined) {
            const geometry = new THREE.SphereGeometry(50, 16, 16); // 50 km radius spot
            const material = new THREE.MeshBasicMaterial({ color });
            const spot = new THREE.Mesh(geometry, material);
            spot.position.set(info.threejs.x, info.threejs.y, info.threejs.z);
            return spot;
        }
        else {
            return null;
        }
    }
*/

    createGreatCircleRing(radius: number, segments: number, color: number): THREE.LineLoop {
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