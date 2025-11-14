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

import { km } from './globals.ts';
import { geodeticToECEF  } from './apputils.ts';

export type HorizonPlaneParams = {
    latitude: number; // Latitude in degrees, required
    longitude: number; // Longitude in degrees, required
    altitude: number; // Altitude in kilometers, required
    radius: number; // Horizon radius, required

    widthSegments ? : number; // Number of segments
    heightSegments ? : number; // Height of the segments
    phiStart?: number; // Start angle for longitude (most cases 0)
    phiLength?: number; // The full 360 degrees
    thetaStart?: number; // Start angle for latitude (top of the sphere)
    thetaLength?: number; // Half the vertical length (to the equator)
    baseSegments?: number; // How many segments for the base circle
    domeTransparency?: boolean; // Dome transparency on/off
    domeOpacitiy?: number; // Dome opacity
    domeShininess?: number; // How shiney is the dome
    domeColor?: THREE.Color;
    baseTransparency?: boolean; // Base transparency on/off
    baseOpacitiy?: number; // Base opacity
    baseShininess?: number; // How shiney is the base
    baseColor?: THREE.Color;
}

export class HorizonPlane  {

    protected latitude: number; // Latitude in degrees
    protected longitude: number; // Longitude in degrees
    protected altitude: number; // Altitude in kilometers

    protected params: HorizonPlaneParams;
    protected base: THREE.Mesh;
    private pointingVector: THREE.Vector3; // From the origin 0,0,0 a pointer to teh lat/lon
    private Q: THREE.Quaternion | null;
    public grp: THREE.Group;

    constructor(p: HorizonPlaneParams) {
        this.init(p);
        this.params = p;
        this.base = this.createCircleBase(p);
        this.grp = new THREE.Group();
        this.latitude = p.latitude;
        this.longitude = p.longitude;
        this.altitude = p.altitude;
        this.pointingVector = geodeticToECEF(p.latitude, p.longitude, km(6371.0)).normalize(); //.multiplyScalar(6371.0);
        const pos = this.pointingVector.clone().multiplyScalar(km(6371.0) + p.altitude);
        this.grp.position.set(pos.x, pos.y, pos.z);
        const defaultUp = new THREE.Vector3(0, 1, 0); // orthogonal to the vector, tangent to surface
        this.Q = new THREE.Quaternion().setFromUnitVectors(defaultUp, this.pointingVector);
        this.grp.quaternion.copy(this.Q);
        this.grp.add(this.base);
    }

    public getDomeParams(): HorizonPlaneParams {
        return this.params;
    }

    public setBaseRadius(radius: number) {
        if(this.base !== null) {
            const geometry:THREE.CircleGeometry = new THREE.CircleGeometry(
                this.params.radius = radius,
                this.params.baseSegments,
                this.params.thetaStart,
                this.params.thetaLength
            );
            this.base.geometry.dispose();
            this.base.geometry = geometry;
        }
    }

    private createCircleBase(p: HorizonPlaneParams): THREE.Mesh {
        const geometry:THREE.CircleGeometry = new THREE.CircleGeometry(
            p.radius,
            p.baseSegments,
            p.thetaStart,
            p.thetaLength
        );
        const material = new THREE.MeshBasicMaterial({
            color: p.baseColor,
            side: THREE.DoubleSide,
            transparent: p.baseTransparency,
            opacity: p.baseOpacitiy,
            polygonOffset: true,
            polygonOffsetFactor: -100, // or +1 depending on which should appear on top
            polygonOffsetUnits: -1,

        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotateX(Math.PI/2);
        return mesh;
    }

    private init(p: HorizonPlaneParams) {
        if(undefined === p.domeShininess) p.domeShininess = 0;
        if(undefined === p.domeOpacitiy) p.domeOpacitiy = 0.25;
        if(undefined === p.domeTransparency) p.domeTransparency = true;
        if(undefined === p.domeColor) p.domeColor = new THREE.Color('grey');
        if(undefined === p.widthSegments) p.widthSegments = 16;
        if(undefined === p.heightSegments) p.heightSegments = 32;
        if(undefined === p.phiStart) p.phiStart = 0;
        if(undefined === p.phiLength) p.phiLength = Math.PI*2;
        if(undefined === p.thetaStart) p.thetaStart = 0;
        if(undefined === p.thetaLength) p.thetaLength = Math.PI*2;
        if(undefined === p.baseSegments) p.baseSegments = 32;
        if(undefined === p.baseShininess) p.baseShininess = 0;
        if(undefined === p.baseOpacitiy) p.baseOpacitiy = 0.25;
        if(undefined === p.baseTransparency) p.baseTransparency = true;
        if(undefined === p.baseColor) p.baseColor = new THREE.Color('grey');
    }
}
