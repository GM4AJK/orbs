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
import { Water } from 'three/addons/objects/Water.js';

export type OceanSceneParams = {
    radius: number;
    segments: number;
    withFog: boolean;
};

export const defaultOceanSceneParams = {
    radius: 1000,
    segments: 256,
    withFog: false
};

export function getOceanScene(params: OceanSceneParams): Water {
    if(params.withFog === undefined) { params.withFog = false; }
    const waterGeometry = new THREE.CircleGeometry(params.radius, params.segments);
    const water = new Water(waterGeometry, {
        textureWidth: 1512,
        textureHeight: 1512,
        waterNormals: new THREE.TextureLoader()
            .load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
        alpha: 1.0,
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x002e4f,
        distortionScale: 3.7,
        fog: params.withFog
    });
    water.rotation.x = - Math.PI / 2;
    water.position.x = -2;
    return water;
}

import { Water  as Water2 } from 'three/addons/objects/Water2.js';

export function getOceanScene2(params: OceanSceneParams): Water {
    if(params.withFog === undefined) { params.withFog = false; }
    const waterGeometry = new THREE.CircleGeometry(params.radius, params.segments);
    const water = new Water2(waterGeometry, {
        textureWidth: 1512,
        textureHeight: 1512,
        reflectivity: 0.1
        //waterNormals: new THREE.TextureLoader()
        //    .load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
        //        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        //    }),
        //alpha: 1.0,
        //sunDirection: new THREE.Vector3(),
        //sunColor: 0xffffff,
        //waterColor: 0x002e4f,
        //distortionScale: 3.7,
        //fog: params.withFog
    });
    water.rotation.x = - Math.PI / 2;
    water.position.x = -2;
    return water;
}
