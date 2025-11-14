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
import * as satellite from 'satellite.js';

export type TopocentricCoordDegrees = {
    azimuth: number;
    elevation: number;
    range?: number;
}

export type TopocentricCoordRadians = {
    azimuth: number;
    elevation: number;
    range?: number;
}

export function TopocentricCoordRadToXYZ(topocentric: TopocentricCoordRadians): THREE.Vector3 {
    const azRad = -topocentric.azimuth;
    const elRad = topocentric.elevation;
    const r = topocentric.range ? topocentric.range : 1.0;
    const x = r * Math.cos(elRad) * Math.sin(azRad);
    const y = r * Math.sin(elRad);
    const z = r * Math.cos(elRad) * Math.cos(azRad);
    const v = new THREE.Vector3(x, y, z);
    if (topocentric.range === undefined) {
        v.normalize();
    }
    return v;
}

export function TopocentricCoordDegToXYZ(topocentric: TopocentricCoordDegrees): THREE.Vector3 {
    return TopocentricCoordRadToXYZ({
        azimuth: THREE.MathUtils.degToRad(topocentric.azimuth),
        elevation: THREE.MathUtils.degToRad(topocentric.elevation),
        range: topocentric.range
    });
}

export type GeodeticCoordDegrees = {
    latitude: number;
    longitude: number;
    altitude?: number;
};

export type GeodeticCoordRadians = {
    latitude: number;
    longitude: number;
    altitude?: number;
};

// Convert latitude and longitude to XYZ coordinates
export function GeodeticCoorRadToXYZ(geo: GeodeticCoordDegrees, radius?: number): THREE.Vector3 {
    const phi = geo.latitude;
    const theta = geo.longitude;
    const x = Math.cos(phi) * Math.sin(theta);
    const y = Math.sin(phi);
    const z = Math.cos(phi) * Math.cos(theta);
    const v = new THREE.Vector3(x, y, z).normalize();
    if (radius !== undefined) {
        v.multiplyScalar(radius);
    }
    return v;
}

/**
 * This is satellite.geodeticToEcf() function but rewrite
 * to remove the repeated calls to Math functions and only
 * doing them once.
 * @ref https://github.com/shashwatak/satellite-js/blob/develop/src/transforms.ts#L47
 * @param param0
 * @returns 
 */
export function geodeticToEcf_fast({ longitude, latitude, height }:
    satellite.GeodeticLocation): satellite.EcfVec3<satellite.Kilometer> {
    const a = 6378.137;
    const b = 6356.7523142;
    const f = (a - b) / a;
    const e2 = ((2 * f) - (f * f));
    const lat_sin: number = Math.sin(latitude);
    const lat_cos: number = Math.cos(latitude);
    const lon_sin: number = Math.sin(longitude);
    const lon_cos: number = Math.cos(longitude);
    const normal = a / Math.sqrt(1 - (e2 * (lat_sin * lat_sin)));
    const norm_height = normal + height;
    const x = norm_height * lat_cos * lon_cos;
    const y = norm_height * lat_cos * lon_sin;
    const z = ((normal * (1 - e2)) + height) * lat_sin;
    return { x, y, z };
}

/**
 * This is satellite.ecfToEci() function but rewrite
 * to remove the repeated calls to Math functions and only
 * doing them once.
 * @ref https://github.com/shashwatak/satellite-js/blob/develop/src/transforms.ts#L101C1-L112C2
 * @param ecf 
 * @param gmst 
 * @returns 
 */
export function ecfToEci_fast(ecf: satellite.EcfVec3<number>, gmst: satellite.GMSTime):
    satellite.EciVec3<number> {
    // ccar.colorado.edu/ASEN5070/handouts/coordsys.doc
    //
    // [X]     [C -S  0][X]
    // [Y]  =  [S  C  0][Y]
    // [Z]eci  [0  0  1][Z]ecf
    //
    const gmst_cos: number = Math.cos(gmst);
    const gmst_sin: number = Math.sin(gmst);
    const X = (ecf.x * gmst_cos) - (ecf.y * gmst_sin);
    const Y = (ecf.x * (gmst_sin)) + (ecf.y * gmst_cos);
    const Z = ecf.z;
    return { x: X, y: Y, z: Z };
}

export function geodeticToECI_Yup(latDeg: number, lonDeg: number, altKm: number, gmst: number): THREE.Vector3 {
    const latRad = satellite.degreesToRadians(latDeg);
    const lonRad = satellite.degreesToRadians(lonDeg);
    //const gmst = satellite.gstime(utcDate);
    //const ecef = geodeticToEcf_fast({ latitude: latRad, longitude: lonRad, height: altKm });
    //const eci = ecfToEci_fast(ecef, gmst);
    const ecef = satellite.geodeticToEcf({ latitude: latRad, longitude: lonRad, height: altKm });
    const eci = satellite.ecfToEci(ecef, 0); //gmst);

    const eciVec = new THREE.Vector3(eci.x, eci.y, eci.z);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    eciVec.applyQuaternion(q);
    return eciVec;

    // Everyone loves a Quaternion but the following is alot faster to go 
    // from Z-up to Y-up than using a Quaternion in a non-dynamic frame (stoopid AI).
    return new THREE.Vector3(eci.x, eci.z, -eci.y);
}

export function geodeticToECEF(latDeg: number, lonDeg: number, altKm: number): THREE.Vector3 {
    const latRad = satellite.degreesToRadians(latDeg);
    const lonRad = satellite.degreesToRadians(lonDeg);
    const ecef = satellite.geodeticToEcf({
        latitude: latRad,
        longitude: lonRad,
        height: altKm,
    });

    // Convert to Three.js Y-up: ECEF is already Z-up, so rotate -90° around X
    const vec = new THREE.Vector3(ecef.x, ecef.y, ecef.z);
    vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    return vec;
}


export function GeodeticCoordDegToXYZ(geo: GeodeticCoordDegrees, radius?: number): THREE.Vector3 {
    return GeodeticCoorRadToXYZ({
        latitude: THREE.MathUtils.degToRad(geo.latitude),
        longitude: THREE.MathUtils.degToRad(geo.longitude),
        altitude: geo.altitude
    }, radius);
}

export function getSunECIPositionSatLib(date: Date): THREE.Vector3 {
    const jday = satellite.jday(date);
    const sunPos = satellite.sunPos(jday);
    let v = new THREE.Vector3(sunPos.rsun[0], sunPos.rsun[1], sunPos.rsun[2]);
    v.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    return v;
}

export function getSunInScene(date: Date): THREE.Vector3 {
    const sunECI = getSunECIPosition(date);
    const sunScene = sunECI.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (-Math.PI / 2 * 1.25));
    return sunScene;
}

export function getSunECIPosition(date: Date): THREE.Vector3 {
    const deg2rad = Math.PI / 180;
    const AU = 149597870.7; // Astronomical Unit in km

    // Julian Date
    const JD = date.getTime() / 86400000 + 2440587.5;
    const T = (JD - 2451545.0) / 36525; // Julian centuries since J2000

    // Mean longitude of the Sun (deg)
    const L0 = (280.46646 + 36000.76983 * T) % 360;

    // Mean anomaly of the Sun (deg)
    const M = (357.52911 + 35999.05029 * T) % 360;

    // Equation of center (deg)
    const C =
        (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * deg2rad) +
        (0.019993 - 0.000101 * T) * Math.sin(2 * M * deg2rad) +
        0.000289 * Math.sin(3 * M * deg2rad);

    // True longitude (deg)
    const trueLon = L0 + C;

    // Obliquity of the ecliptic (deg)
    const epsilon = 23.439291 - 0.0130042 * T;

    // Convert to ECI unit vector
    const lonRad = trueLon * deg2rad;
    const epsRad = epsilon * deg2rad;

    const x = Math.cos(lonRad);
    const y = Math.cos(epsRad) * Math.sin(lonRad);
    const z = Math.sin(epsRad) * Math.sin(lonRad);
    let v = new THREE.Vector3(x, z, -y); // ECI is Z UP, ThreeJS is Y UP
    return v.multiplyScalar(AU); // in kilometers
}

export function getSunSceneAlignedPosition(date: Date): THREE.Vector3 {
    const deg2rad = Math.PI / 180;
    const AU = 149597870.7; // Astronomical Unit in km
    // Julian Date
    const JD = date.getTime() / 86400000 + 2440587.5;
    const T = (JD - 2451545.0) / 36525;
    // Mean longitude and anomaly
    const L0 = (280.46646 + 36000.76983 * T) % 360;
    const M = (357.52911 + 35999.05029 * T) % 360;
    // Equation of center
    const C =
        (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * deg2rad) +
        (0.019993 - 0.000101 * T) * Math.sin(2 * M * deg2rad) +
        0.000289 * Math.sin(3 * M * deg2rad);
    // True longitude and obliquity
    const trueLon = L0 + C;
    const epsilon = 23.439291 - 0.0130042 * T;
    // ECI vector
    const lonRad = trueLon * deg2rad;
    const epsRad = epsilon * deg2rad;
    const x = Math.cos(lonRad);
    const y = Math.cos(epsRad) * Math.sin(lonRad);
    const z = Math.sin(epsRad) * Math.sin(lonRad);
    const sunECI = new THREE.Vector3(x, y, z).multiplyScalar(AU);
    // Rotate +90° around Y to match Three.js scene alignment
    return sunECI.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
}

export function eciToEcf(x: number, y: number, z: number, gmst: number): { x: number; y: number; z: number } {
    // Rotate around Z-axis by GMST to account for Earth's rotation 
    const cosGmst = Math.cos(gmst);
    const sinGmst = Math.sin(gmst);
    const xEcf = x * cosGmst + y * sinGmst;
    const yEcf = -x * sinGmst + y * cosGmst;
    const zEcf = z; // Z remains unchanged
    return { x: xEcf, y: yEcf, z: zEcf };
}

export function createLine(a: THREE.Vector3, b: THREE.Vector3, color: number = 0xff80ff): THREE.Line {
    const points = [
        a.clone(),
        b.clone()
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: color });
    return new THREE.Line(geometry, material);
}

export interface createHemisphereGeometryParams {
    radius: number;
    widthSegments: number;
    heightSegments: number;
}

export function createHemisphereGeometry(p: createHemisphereGeometryParams):  THREE.SphereGeometry {
    if(p.radius === undefined) p.radius = 100;
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
    return geometry;
}

export function createXAxisLine(len: number, color: number = 0xff0000): THREE.Line  | THREE.ArrowHelper {
    const origin = new THREE.Vector3(0,0,0);
    const dir = new THREE.Vector3(1, 0, 0);
    dir.normalize();
    return new THREE.ArrowHelper( dir, origin, len, color );
    // const points = [
    //     new THREE.Vector3(0, 0, 0),
    //     new THREE.Vector3(len, 0, 0)
    // ];
    // const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // const material = new THREE.LineBasicMaterial({ color: color });
    // return new THREE.Line(geometry, material);
}

export function createYAxisLine(len: number, color: number = 0x0000ff): THREE.Line | THREE.ArrowHelper {
    const origin = new THREE.Vector3(0,0,0);
    const dir = new THREE.Vector3(0, 1, 0);
    dir.normalize();
    return new THREE.ArrowHelper( dir, origin, len, color );
    // const points = [
    //     new THREE.Vector3(0, 0, 0),
    //     new THREE.Vector3(0, len, 0)
    // ];
    // const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // const material = new THREE.LineBasicMaterial({ color: color });
    // return new THREE.Line(geometry, material);
}

export function createZAxisLine(len: number, color: number = 0x00ff00): THREE.Line | THREE.ArrowHelper {
    const origin = new THREE.Vector3(0,0,0);
    const dir = new THREE.Vector3(0, 0, 1);
    dir.normalize();
    return new THREE.ArrowHelper( dir, origin, len, color );
    // const points = [
    //     new THREE.Vector3(0, 0, 0),
    //     new THREE.Vector3(0, 0, len)
    // ];
    // const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // const material = new THREE.LineBasicMaterial({ color: color }); 
    // return new THREE.Line(geometry, material);
}

export function addAxisHelperToScene(scene: THREE.Scene, len: number = 10000) {
    const x = createXAxisLine(len);
    const y = createYAxisLine(len);
    const z = createZAxisLine(len);
    scene.add(x);
    scene.add(y);
    scene.add(z);
}

export function addAxisHelperToGroup(group: THREE.Group, len: number = 10000) {
    const x = createXAxisLine(len, 0x00ffff);
    const y = createYAxisLine(len, 0x0000ff); // Keep blue for Y-up and match world/scene helper
    const z = createZAxisLine(len, 0xff00ff);
    group.add(x);
    group.add(y);
    group.add(z);
}

