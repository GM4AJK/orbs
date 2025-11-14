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
import * as THREE from 'three';
import { APPUTILS } from './apputils.ts'; // your scaling function

/* Usage example
const satPosKm = new THREE.Vector3(7000, 0, 0); // 7,000 km from Earth's center
const sat = new SatelliteVisual('SAT-1', satPosKm, scene, {
  radiusKm: 2,
  visualSize: 0.01, // override to make it visible
  color: 0x00ffcc,
  label: true,
});
*/
export class SatelliteVisual {
    mesh: THREE.Mesh;
    label?: THREE.Sprite;

    constructor(
        name: string,
        positionKm: THREE.Vector3, // real-world position in kilometers
        scene: THREE.Scene,
        options?: {
            radiusKm?: number;       // physical size (for realism)
            visualSize?: number;     // override for visibility
            color?: number;
            label?: boolean;
        }
    ) {
        const radius = options?.visualSize ?? APPUTILS.km(options?.radiusKm ?? 2); // exaggerate for visibility
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: options?.color ?? 0xffcc00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.toSceneCoords(positionKm));
        scene.add(this.mesh);

        if (options?.label) {
            this.label = this.createLabel(name);
            this.label.position.copy(this.mesh.position.clone().add(new THREE.Vector3(0, radius * 2, 0)));
            scene.add(this.label);
        }
    }

    updatePosition(positionKm: THREE.Vector3) {
        const scenePos = this.toSceneCoords(positionKm);
        this.mesh.position.copy(scenePos);
        if (this.label) {
            this.label.position.copy(scenePos.clone().add(new THREE.Vector3(0, this.mesh.geometry.boundingSphere!.radius * 2, 0)));
        }
    }


    private toSceneCoords(posKm: THREE.Vector3): THREE.Vector3 {
        return posKm.clone().multiplyScalar(APPUTILS.km(1)); // km → scene units
    }

    private createLabel(text: string): THREE.Sprite {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, size / 2, size / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.05, 0.05, 1); // adjust for scene scale
        return sprite;
    }
}
