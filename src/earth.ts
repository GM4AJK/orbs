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

import { AppMain } from './appmain.ts';
import { Clock as AppClock } from './clock.ts';
import { AppSatMgr } from './appsatmgr.ts';
import { geodeticToECEF  } from './apputils.ts';
import { Globals, km } from './globals.ts';
import { addAxisHelperToGroup } from './apputils';
import { HorizonPlane } from './horizonplane.ts';


export class Earth {

    static readonly EARTH_RADIUS: number = km(6371);

    private scene: THREE.Scene | null;
    
    // Earth is a group and we can add surface features to the 
    // planet group to pick up the Earth's rotation.
    public planet: THREE.Group; 

    private appSatMgr: AppSatMgr | null = null;
    private appClock: AppClock;
    private earthMesh: THREE.Mesh;

    constructor(
        scene: THREE.Scene | null, 
        appClock: AppClock
    ) {
        this.scene = scene;
        this.appClock = appClock;
        this.appSatMgr = new AppSatMgr(this);
        this.appSatMgr.init();
        this.planet = new THREE.Group();
        const textureLoader = new THREE.TextureLoader();
        const earthTexture = textureLoader.load('textures/2_no_clouds_8k.jpg');
        const earthGeometry = new THREE.SphereGeometry(Earth.EARTH_RADIUS, 256, 256);
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: earthTexture,
            shininess: 5,
            transparent: true,
            opacity: 0.25,
        });
        this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial); // Default alignment is meridian aligned X axis
        this.earthMesh.castShadow = true;
        this.planet.add(this.earthMesh);
        if(Globals.display_earth_axis_helpers === true) {
            addAxisHelperToGroup(this.planet);
        }
        const now = this.appClock.Date;
        const gmst = satellite.gstime(now);
        this.planet.rotation.y = gmst;
        this.experiments();
        if(scene !== null) {
            scene.add(this.planet);
        }        
    }

    public update(clock: Date) {
        this.appSatMgr?.updateSatellitesNew(clock);
    }

    public getEarthMesh(): THREE.Mesh {
        return this.earthMesh;
    }

    private getEquator(): THREE.LineLoop {
        const ring = this.createGreatCircleRing(Earth.EARTH_RADIUS + km(250), 256, 0xff0000); // Red
        ring.rotation.y = Math.PI / 2; // Lay flat in XY plane
        return ring;
    }

    private getMeridian(): THREE.LineLoop {
        const ring = this.createGreatCircleRing(Earth.EARTH_RADIUS + km(250), 256, 0x00ff00); // Green
        ring.rotateX(Math.PI / 2);
        return ring;
    }

    public createOrbitalPlane(lat_deg: number = 0, lon_deg: number = 0): THREE.Group { 
        const g = new THREE.Group; 
        const size = km(15000); 
        const half = size / 2; 
        const shape = new THREE.Shape(); 
        shape.moveTo(-half, -half); 
        shape.lineTo( half, -half); 
        shape.lineTo( half,  half); 
        shape.lineTo(-half,  half); 
        shape.lineTo(-half, -half); 
        const planeHole = new THREE.Path(); 
        planeHole.absarc(0, 0, Earth.EARTH_RADIUS+km(150), 0, Math.PI * 2, true); 
        shape.holes.push(planeHole); 
        const planeGeometry = new THREE.ShapeGeometry(shape, 128); 
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            side: THREE.DoubleSide, 
            transparent: true, 
            opacity: 0.25 
        }); 
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial); 
        g.add(planeMesh); 
        const circle = this.createGreatCircleRing(half - km(500), 128, 0xffaaaa);
        circle.rotateX(Math.PI/2);
        g.add(circle); 
        const from = new THREE.Vector3 (-(planeMesh.position.x + Earth.EARTH_RADIUS), planeMesh.position.y, planeMesh.position.z) .clone().normalize(); 
        const to: THREE.Vector3 = geodeticToECEF(lat_deg, lon_deg, + Earth.EARTH_RADIUS).clone().normalize(); 
        const Q = new THREE.Quaternion().setFromUnitVectors(from, to); 
        g.applyQuaternion(Q); 
        return g; 
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
    public createSurfaceSpot(
        latDeg: number, 
        lonDeg: number, 
        altKm: number = 0, 
        size: number = km(50),
        color: number = 0xff00ff
    ): THREE.Mesh  {
        const ecef: THREE.Vector3 = geodeticToECEF(latDeg, lonDeg, altKm);
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color });
        let spot = new THREE.Mesh(geometry, material);
        spot.position.set(ecef.x, ecef.y, ecef.z);
        return spot;
    }

   /**
     * Note, when adding surface markers like a spot to the this.earth object
     * then time (gmst) does not need to be considered as the this.earth object
     * is rotated as required and carries along with it any child objects.
     * @param vec THREE.vector3
     * @returns 
     */
    public createSurfaceSpotXYZ(
        vec: THREE.Vector3,
        size: number = km(50),
        color: number = 0xff00ff
    ): THREE.Mesh  {
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color });
        let spot = new THREE.Mesh(geometry, material);
        spot.position.set(vec.x, vec.y, vec.z);
        return spot;
    }

    /**
     * Create a Great Circle around the earth
     * @param radius from the Earths centre (0,0,0)
     * @param segments 
     * @param color 
     * @returns 
     */
    public createGreatCircleRing(
        radius: number, 
        segments: number, 
        color: number
    ): THREE.LineLoop {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * 2 * Math.PI;
            points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)
            ));
        }
        return this.createGreatCircleRingV3(points, color);
    }

    /**
     * Create a Great Circle around the earth from a series of 
     * points defined by an array of THREE.Vector3 values.
     * @param radius 
     * @param color 
     * @returns 
     */
    public createGreatCircleRingV3(
        points: THREE.Vector3[] , 
        color: number = 0xff80ff
    ): THREE.LineLoop {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color });
        return new THREE.LineLoop(geometry, material);
    }

    private experiments() {
        return;
        if (this.scene !== null) {
            const london = this.createSurfaceSpot(51.5, -0.12, km(0.1));
            this.planet.add(london);
            const edinburgh = this.createSurfaceSpot(56.5, -3.12, km(0.1));
            this.planet.add(edinburgh);
            if(Globals.display_equator_line) {
                this.planet.add(this.getEquator());
            }
            if(Globals.display_meridian_line) {
                this.planet.add(this.getMeridian());
            }
            // const ksc1 = this.createOrbitalPlane(28.0, -80.6849531);
            // this.planet.add(ksc1);
            // const ksc2 = this.createOrbitalPlane(28.0, -50.6849531);
            // this.planet.add(ksc2);
            //const leven = this.createOrbitalPlane(56.2, -3.005);
            //this.planet.add(leven);

            // Simulated orbital planes.
            // if(this.scene !== null) {
            //     for(let i = 0; i < Math.PI*2; i += Math.PI/8) {
            //         const A45 = THREE.MathUtils.degToRad(53);
            //         const c = this.createGreatCircleRing(this.earthRadiusKm+300, 128, 0xffffff);  
            //         //c.rotateX(A45);
            //         c.rotateY(i);
            //         c.rotateOnAxis(new THREE.Vector3(1, 0, 0), A45);
            //         this.scene.add(c);
            //     }
            // }

            // const ediHorizonDome = new HorizonDome({
            //     latitude: 56.5,
            //     longitude: -3.12,
            //     altitude: 100.0,
            //     dome: {
            //         radius: 500,
            //     }
            // });
            // //ediHorizon.setBaseRadius(1000);
            // this.planet.add(ediHorizonDome.grp);

            const ediHorizonPlane = new HorizonPlane({
                latitude: 56.5,
                longitude: -3.12,
                altitude: km(25.0),
                radius: km(2000),
                baseOpacitiy: 0.2,
                baseColor: new THREE.Color(256, 0, 0),
            });
            this.planet.add(ediHorizonPlane.grp);

            const sat = this.createGreatCircleRing(Earth.EARTH_RADIUS+km(300), 128, 0xffffff);  
            this.scene?.add(sat);
            sat.rotateZ(Math.PI/2);
            sat.rotateX(THREE.MathUtils.degToRad(-23.0));



            this.scene.add(this.planet);
        }
    }
}

