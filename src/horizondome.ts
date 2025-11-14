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

import { km } from './globals.ts'
import { Dome, type DomeParams } from './dome.ts';
import { geodeticToECEF  } from './apputils.ts';

type HorizonDomeParams = {
    latitude: number; // Latitude in degrees
    longitude: number; // Longitude in degrees
    altitude: number; // Altitude in kilometers
    dome: DomeParams;
}

export class HorizonDome extends Dome {

    protected latitude: number; // Latitude in degrees
    protected longitude: number; // Longitude in degrees
    protected altitude: number; // Altitude in kilometers

    protected extraPlane: THREE.Mesh | null = null;

    private pointingVector: THREE.Vector3; // From the origin 0,0,0 a pointer to teh lat/lon
    private Q: THREE.Quaternion | null;

    constructor(p: HorizonDomeParams) {
        p.dome.domeTransparency = true;
        p.dome.domeOpacitiy = 0.25;
        p.dome.baseSegments = 128;
        p.dome.widthSegments = 128;
        super(p.dome);
        this.latitude = p.latitude;
        this.longitude = p.longitude;
        this.altitude = p.altitude;
        this.pointingVector = geodeticToECEF(p.latitude, p.longitude, km(6371.0)).normalize(); //.multiplyScalar(6371.0);
        const pos = this.pointingVector.clone().multiplyScalar(km(6371.0) + p.altitude);
        this.grp.position.set(pos.x, pos.y, pos.z);
        const defaultUp = new THREE.Vector3(0, 1, 0); // dome's flat side
        this.Q = new THREE.Quaternion().setFromUnitVectors(defaultUp, this.pointingVector);
        this.grp.quaternion.copy(this.Q);
    }
}
