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
// github.com/GM4AJK/BSC5P-JSON-XYZ/catalogs/bubble_min.json"
import BSC5_JSON from './bubble_min.json';
import * as THREE from 'three';

// Add stars from BSC5 JSON
export function getStarField(Nlimit = 4.0): THREE.Points {
  let starCounter = 0;
  let skyMultipler = 1.0;
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  BSC5_JSON.forEach(starDef => {
    if (starDef.N !== null && starDef.N < Nlimit) {
      if (starDef.K) {
        positions.push(starDef.x * skyMultipler, starDef.y * skyMultipler, starDef.z * skyMultipler);
        colors.push(starDef.K.r, starDef.K.g, starDef.K.b);
        sizes.push(Math.max(0.5, 5 - starDef.N * 0.1));
        starCounter++;
      }
    }
  });
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  const material = new THREE.PointsMaterial({
    vertexColors: true,
    size: 2,
    sizeAttenuation: true,
    transparent: false,
    opacity: 1.0
  });
  const starField = new THREE.Points(geometry, material);
  console.log(`Added ${starCounter} stars`);
  return starField
}
