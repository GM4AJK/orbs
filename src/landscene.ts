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
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export type LandSceneParams = {
    radius: number;
    segments: number;
    color: number;
};

export const defaultLandSceneParams = {
    radius: 1000,
    segments: 256,
    color: 0x00FF00
};

export function getLandScene(params: LandSceneParams): THREE.Mesh {
    const landGeometry = new THREE.CircleGeometry(params.radius, params.segments);
    const landMaterial = new THREE.MeshBasicMaterial({
        color: params.color,
        side: THREE.DoubleSide
    });
    const disk = new THREE.Mesh(landGeometry, landMaterial);
    
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const compassPoints = [
            { label: 'S', angle: 0 },
            { label: 'W', angle: Math.PI / 2 },
            { label: 'N', angle: Math.PI },
            { label: 'E', angle: -Math.PI / 2 }
        ];  
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        compassPoints.forEach(({ label, angle }) => {
            const textGeometry = new TextGeometry(label, {
                font: font,
                size: 3,
                curveSegments: 4
            })
            textGeometry.computeBoundingBox();
            if(textGeometry.boundingBox !== null) {
                const centerOffset = (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) / 2;
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                // Position around disk
                const x = params.radius * Math.sin(angle);
                const z = params.radius * Math.cos(angle);
                textMesh.position.set(x - centerOffset, 0.01, z);
                textMesh.rotation.x = -Math.PI / 2;
                //textMesh.rotation.z = -angle;
                disk.add(textMesh);
            }
        });
    });
        
        // const x = (params.radius * 0.25) * Math.sin(angle);
        // const y = (params.radius * 0.25) * Math.cos(angle);
        // const pos = new THREE.Vector3(x, y, 0);
        // const mark = createCompassLabel(label, pos);
        // if(mark !== null) {
        //     disk.attach(mark);
        // }
    disk.rotation.x = - Math.PI / 2;
    disk.position.x = -2;
    return disk;
}


function createCompassLabel(text: string, position: THREE.Vector3): THREE.Sprite | null {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if(ctx !== null) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 100px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(10, 10, 5); // Adjust size
        sprite.position.copy(position);
        sprite.rotateX(Math.PI);
        return sprite;
    }
    return null;
}

