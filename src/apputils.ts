
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
    if(topocentric.range === undefined) {
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
    if(radius !== undefined) {
        v.multiplyScalar(radius);
    } 
    return v;
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
    const sunScene = sunECI.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (-Math.PI/2 * 1.25));
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
    return sunECI.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
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

export function createXAxisLine(len: number): THREE.Line {
    const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(len, 0, 0)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Grn
    return new THREE.Line(geometry, material);
}

export function createYAxisLine(len: number): THREE.Line {
    const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, len, 0)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff }); // Blue
    return new THREE.Line(geometry, material);
}

export function createZAxisLine(len: number): THREE.Line {
    const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, len)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red
    return new THREE.Line(geometry, material);
}

export function addAxisHelperToScene(scene: THREE.Scene, len: number = 10000) {
    const x = createXAxisLine(len);
    const y = createYAxisLine(len);
    const z = createZAxisLine(len);
    scene.add(x);
    scene.add(y);
    scene.add(z);
}



