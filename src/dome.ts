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

export type DomeParams = {
    radius: number; // Dome radius, required
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

export class Dome  {

    protected params: DomeParams;
    protected hemisphere: THREE.Mesh;
    protected base: THREE.Mesh | null = null;
    public grp: THREE.Group;

    constructor(p: DomeParams) {
        this.init(p);
        this.params = p;
        this.hemisphere = this.createHemisphere(p);
        this.base = this.createCircleBase(p);
        this.grp = new THREE.Group();
        if(this.base !== null) {
            this.grp.add(this.base);
        }
        this.grp.add(this.hemisphere);
    }

    public getDomeParams(): DomeParams {
        return this.params;
    }

    public setBaseRadius(radius: number) {
        if(this.base !== null) {
            const geometry:THREE.CircleGeometry = new THREE.CircleGeometry(
                this.params.radius + radius,
                this.params.baseSegments,
                this.params.thetaStart,
                this.params.thetaLength
            );
            this.base.geometry.dispose();
            this.base.geometry = geometry;
        }
    }

    private createCircleBase(p: DomeParams): THREE.Mesh {
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
            opacity: p.baseOpacitiy
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotateX(Math.PI/2);
        return mesh;
    }

    private createHemisphere(p: DomeParams):  THREE.Mesh {
        if(p.radius === undefined) p.radius = km(100);
        if(p.widthSegments === undefined) p.widthSegments = 32;
        if(p.heightSegments === undefined) p.heightSegments = 16;
        const phiStart = 0; // Start angle for longitude (most cases 0)
        const phiLength = Math.PI * 2; // The full 360 degrees
        const thetaStart = 0; // Start angle for latitude (top of the sphere)
        const thetaLength = Math.PI / 2; // Half the vertical length (to the equator)
        const geometry = new THREE.SphereGeometry(
            p.radius,
            p.widthSegments,
            p.heightSegments,
            phiStart,
            phiLength,
            thetaStart,
            thetaLength
        );
        const material = new THREE.MeshBasicMaterial({ //new THREE.MeshPhongMaterial({ new THREE.MeshBasicMaterial
            transparent: p.domeTransparency,
            opacity: p.domeOpacitiy
        });
        return new THREE.Mesh(geometry, material); 
    }

    private init(p: DomeParams) {
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
