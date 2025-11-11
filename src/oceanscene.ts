
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
