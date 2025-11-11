
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
    private satelliteOrbitsMap: Map<string, THREE.Line<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>>;
    private satelliteSpotsMap: Map<string, THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>>;

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
        this.earth.rotation.x = THREE.MathUtils.degToRad(EARTH_TILT_DEGREES);
        if(scene !== null) {
            this.earth.add(this.getEquator());
            this.earth.add(this.getMeridian()); 
            scene.add(this.earth);
        }
    }

    public update(clock: Date) {
        this.appSatArray.forEach((sat:AppSat, name:string) => {
            const result = sat.update(clock);
            if(result !== null) {
                const spot = sat.getSpot();
                if(spot !== null) {
                    const old = sat.getOldSpot();
                    if(old !== null) {
                        this.earth.remove(old);
                        sat.spotDispose(old);
                    }
                    this.earth.add(spot);
                    console.log(name + " " + sat.toString());
                }
            }
        });
    }

    getEarth(): THREE.Mesh {
        return this.earthMesh;
    }

    /*
    addISS() {
        const oldOrbit = this.satelliteOrbitsMap.get('ISS');
        if(oldOrbit) {
            this.earth.remove(oldOrbit);
            oldOrbit.geometry.dispose();
            (oldOrbit.material as THREE.Material).dispose();
        }
        const issOrbit = this.createOrbitFromTLE(ISS, 0xffffff, 10);
        if(issOrbit !== null) {
            this.satelliteOrbitsMap.set('ISS', issOrbit);
            this.earth.add(issOrbit);
        }
        const oldSpot = this.satelliteSpotsMap.get('ISS');
        if(oldSpot) {
            this.earth.remove(oldSpot);
            oldSpot.geometry.dispose();
            (oldSpot.material as THREE.Material).dispose();
        }
        const now = this.appClock.Date;
        const issPos = this.createSatelliteSpot(ISS, now);
        if(issPos !== null) {
            this.satelliteSpotsMap.set('ISS', issPos);
            this.earth.add(issPos);
        }
    }
    */

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