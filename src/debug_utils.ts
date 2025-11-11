import * as THREE from 'three'


export function debugGlobeSphere(radius = 500, widthSegments = 32, heightSegments = 32): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const material = new THREE.MeshBasicMaterial({ color: 0x2233ff, wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    return sphere;
}

export function debugGridHelper(v: THREE.Vector3, c: THREE.Color, size = 500, divisions = 10, ): THREE.GridHelper {
    const gridHelper = new THREE.GridHelper(size, divisions, c, c);
    gridHelper.position.set(v.x, v.y, v.z);
    return gridHelper;
}

export function debugGridsHelper(size: number, divisions: number)
    : [ THREE.GridHelper, THREE.GridHelper, THREE.GridHelper ] 
{
    const gridHelperXZ = new THREE.GridHelper(size, divisions, 0xff0000, 0xff0000);
    const gridHelperXY = new THREE.GridHelper(size, divisions, 0x00ff00, 0x00ff00);
    gridHelperXY.rotateX(Math.PI / 2);
    const gridHelperYZ = new THREE.GridHelper(size, divisions, 0x0000ff, 0x0000ff);
    gridHelperYZ.rotateZ(Math.PI / 2);  
    return [ gridHelperXZ, gridHelperXY, gridHelperYZ ];
}

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


export function TopocentricCoordDegToXYZ(topocentric: TopocentricCoordDegrees): THREE.Vector3 {
    const azRad = THREE.MathUtils.degToRad(topocentric.azimuth);
    const elRad = THREE.MathUtils.degToRad(topocentric.elevation); 
    const r = topocentric.range ? topocentric.range : 1.0;
    const x = r * Math.cos(elRad) * Math.sin(azRad);
    const y = r * Math.sin(elRad);
    const z = r * Math.cos(elRad) * Math.cos(azRad);
    const v = new THREE.Vector3(x, y, z);
    if(topocentric.range !== undefined) {
        v.normalize();
    }
    return v;
}

export function TopocentricCoordRadToXYZ(topocentric: TopocentricCoordRadians): THREE.Vector3 {
    const azRad = topocentric.azimuth;
    const elRad = topocentric.elevation;
    const r = topocentric.range ? topocentric.range : 1.0;
    const x = r * Math.cos(elRad) * Math.sin(azRad);
    const y = r * Math.sin(elRad);
    const z = r * Math.cos(elRad) * Math.cos(azRad);
    const v = new THREE.Vector3(x, y, z);
    if(topocentric.range !== undefined) {
        v.normalize();
    }
    return v;
}

export type GeodeticCoordDegrees = {
    latitude: number;
    longitude: number;
    altitude?: number;
};

// Convert latitude and longitude to XYZ coordinates
function latLonToXYZ(geo: GeodeticCoordDegrees, radius?: number): THREE.Vector3 {
    const phi = THREE.MathUtils.degToRad(geo.latitude);
    const theta = THREE.MathUtils.degToRad(geo.longitude);
    const x = Math.cos(phi) * Math.sin(theta);
    const y = Math.sin(phi);
    const z = Math.cos(phi) * Math.cos(theta);
    const v = new THREE.Vector3(x, y, z).normalize(); 
    if(radius !== undefined) {
        v.multiplyScalar(radius);
    } 
    return v;
}

export function meridian(longitude: number = 0, radius: number = 500): THREE.Line {
    const points: THREE.Vector3[] = [];
    for (let lat = -90; lat <= 90; lat += 1) {
        const geo: GeodeticCoordDegrees = { latitude: lat, longitude: longitude };
        const point = latLonToXYZ(geo, radius);
        points.push(point);
    }       
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const line = new THREE.Line(geometry, material);
    return line;
}

export function meridians(stepDegrees: number = 10) : THREE.Line[] {
    const lines: THREE.Line[] = [];
    for (let lon = -180; lon < 180; lon += stepDegrees) {
        const line = meridian(lon, 500);
        lines.push(line);
    }
    return lines;
}

export function tiltAxisHelper(camera: THREE.Camera) {
    return new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), // local X axis
        camera.position,
        10,
        0xff0000
    );
}


