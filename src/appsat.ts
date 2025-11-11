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
import * as satellite from 'satellite.js';

export type AppSatPosition = {
    threejs: THREE.Vector3;
    position: satellite.EciVec3<number>;
    velocity: satellite.EciVec3<number>;
    ecf: satellite.EcfVec3<number>;
    gp: satellite.GeodeticLocation | null;
}

export class AppSat {

    line0: string | null = null;
    line1: string | null = null;
    line2: string | null = null;

    epoch: Date | null = null;
    epochNumeric: number | null = null;
    satrec: satellite.SatRec | null = null;

    // Internal variables to support ThreeJS plotting.
    private spot: THREE.Mesh | null = null;
    private oldSpot: THREE.Mesh | null = null;
    private spotColor: number = 0xffff00;
    private spotRadius: number = 10;
    private spotSegWidth: number = 16;
    private spotSegNum: number = 16;

    // The moment in time when a propagation was calculated.
    public positionAtTime: Date | null = null;

    // State vectors in ThreeJS reference frame (not ECI).
    public position: THREE.Vector3 | null = null;
    public velocity: THREE.Vector3 | null = null;

    // State vector in ECI reference frame (not ThreeJS).
    public posVel: satellite.PositionAndVelocity | null = null;
    public groundPoint: satellite.GeodeticLocation | null = null;

    private constructor() {}

    public static Factory_FromTLE(line1: string, line2: string, line0: string | null): AppSat | null {
        let sat:AppSat = new AppSat();
        if(sat.setFromTLE(line1, line2, line0) === null) return null;
        return sat;
    }

    public static Factory_FromJsonOMM(in_oom: satellite.OMMJsonObject): AppSat | null {
        const sat:AppSat = new AppSat();
        if(sat.setFromJsonOOM(in_oom) === null) return null;
        return sat;
    }

    public update(clock: Date, color: number | null = null, radius: number | null = null): AppSat | false | null {
        if(this.satrec === null) return false;
        if(this.updatePositionAT(clock)) {
            this.createSpot(color, radius);
        }
        else {
            this.spot = null;
        }
        return this;
    }

    public static satRecTest(satrec: satellite.SatRec, attime: Date | null): boolean {
        if(attime === null) attime = new Date();
        const j: number = satellite.jday(attime);
        const m: number = (j - satrec.jdsatepoch) * 1440.0;
        if(satellite.sgp4(satrec, m) === null) return false; 
        return true;
    }

    private updatePositionAT(in_date: Date) : boolean {
        if(this.satrec !== null) {
            const dtime: Date = new Date(in_date.getTime());
            const j: number = satellite.jday(dtime);
            const m: number = (j - this.satrec.jdsatepoch) * 1440.0;
            this.posVel = satellite.sgp4(this.satrec, m); 
            const gmst: satellite.GMSTime = satellite.gstime(dtime);
            if(!this.posVel) return false;
            const posEci: satellite.EciVec3<number> = this.posVel.position;
            if (!posEci) return false;
            const posEcf = satellite.eciToEcf(posEci, gmst);
            this.position = new THREE.Vector3(posEcf.x, posEcf.z, -posEcf.y); // ECI to THREE
            const velEcf = satellite.eciToEcf(this.posVel.velocity, gmst);
            this.velocity = new THREE.Vector3(velEcf.x, velEcf.z, -velEcf.y); // ECI to THREE
            this.groundPoint = this.calculateGeodeticGroundPoint(gmst);
            this.positionAtTime = in_date;
            return true;
        }
        return false;
    }

    private calculateGeodeticGroundPoint(gmst: satellite.GMSTime): satellite.GeodeticLocation | null {
        if(this.posVel !== null) {
            const geo = satellite.eciToGeodetic(this.posVel.position, gmst);
            return geo;
        }
        return null;
    }

    public setFromTLE(line1: string, line2: string, line0: string | null) : AppSat | null {
        this.epoch = null;
        this.line1 = line1;
        this.line2 = line2;
        this.line0 = (line0 !== null) ? line0 : "";
        this.satrec = satellite.twoline2satrec(this.line1, this.line2);
        if(this.satrec !== null) {
            this.epoch = AppSat.tleEpochToUTC_Num(this.satrec.jdsatepoch);
            this.epochNumeric = Number(this.satrec.jdsatepoch);
            return this;
        }
        return null;
    }

    public setFromJsonOOM(in_oom: satellite.OMMJsonObject) : AppSat | null {
        this.satrec = satellite.json2satrec(in_oom);
        if(this.satrec !== null) {
            this.line0 = in_oom.OBJECT_NAME;
            this.epoch = AppSat.tleEpochToUTC_Num(this.satrec.jdsatepoch);
            this.epochNumeric = Number(this.satrec.jdsatepoch);
            return this;
        }
        return null;
    }
   
    public toString(): string | null {
        if(this.satrec === null || this.positionAtTime === null) return null;
        let log:string = "";
        log += `Sat: ${this.line0} Time: ${this.positionAtTime.toISOString()}\n`;
        if(this.groundPoint !== null) {
            log += `  GP: Lat: ${(this.groundPoint.latitude*180/Math.PI).toFixed(2)}°, Lon: ${(this.groundPoint.longitude*180/Math.PI).toFixed(2)}°, Alt: ${this.groundPoint.height.toFixed(3)} km\n`;
        }
        if(this.posVel !== null) {
            log += `   P:  x = ${this.posVel.position.x}, y = ${this.posVel.position.y}, z = ${this.posVel.position.z}\n`;
            log += `   V:  xdot = ${this.posVel.velocity.x}, ydot = ${this.posVel.velocity.y}, zdot = ${this.posVel.velocity.z}\n`;
        }
        if(this.position !== null) {
            log += `  JS:  X = ${this.position.x}, Y = ${this.position.y}, Z = ${this.position.z}`
        }
        return log;
    }

    /**
     * Create the satellite spot THREE.Mesh 
     * @param color 
     * @returns AppSat instance
     */
    private createSpot(in_color: number | null, in_radius: number | null): AppSat {
        let color:number = this.spotColor;
        if(in_color !== null) {
            color = in_color;
        }
        let radius: number = this.spotRadius;
        if(in_radius !== null) {
            radius = in_radius;
        }
        if(this.position !== null) {
            const geometry = new THREE.SphereGeometry(radius, this.spotSegWidth, this.spotSegNum);
            const material = new THREE.MeshBasicMaterial({ color });
            const spot = new THREE.Mesh(geometry, material); 
            spot.position.set(this.position.x, this.position.y, this.position.z);
            this.oldSpot = this.spot; // Store the previous spot so it can be removed.
            this.spot = spot;
        }
        return this;
    }

    public spotDispose(spot: THREE.Mesh) {
        spot.geometry.dispose();
        (spot.material as THREE.Material).dispose();
    }

    /**
     * Getter for the spot mesh.
     * Returns the internal spot mesh (or null if not created).
     * @returns THREE.Mesh
     */
    public getSpot(): THREE.Mesh | null {
        return this.spot;
    }

    public getOldSpot(): THREE.Mesh | null {
        return this.oldSpot;
    }
    
    /**
     * Example usage:
     * const epoch = 25313.96830531;
     * console.log(tleEpochToUTC_Num(epoch)); // "2025-11-09T23:14:21.578Z"
     * @param epoch: number 
     * @returns Date object
     */
    public static tleEpochToUTC_Num(epoch: number): Date {
        // Extract YY and DDD.ddddd
        // e.g. epoch = 25313.96830531 -> yy = 25, dayOfYear = 313.96830531
        const yy = Math.floor(epoch / 1000);
        const dayOfYear = epoch - yy * 1000;
        const year = 2000 + yy; // Interpret two-digit year as 2000-2099
        const dayInteger = Math.floor(dayOfYear); // 1..366
        const fractionalDay = dayOfYear - dayInteger;
        // Base: Jan 1 of year at 00:00:00 UTC
        const jan1ms = Date.UTC(year, 0, 1, 0, 0, 0, 0);
        const msPerDay = 24 * 60 * 60 * 1000;
        // Compute milliseconds offset (use floor to avoid rounding microseconds up)
        const fractionalMs = Math.floor(fractionalDay * msPerDay);
        // dayInteger - 1 because Jan 1 is day 1
        const resultMs = jan1ms + (dayInteger - 1) * msPerDay + fractionalMs;
        return new Date(resultMs);
    }

    /**
     * Example usage:
     * const epoch = "25313.96830531";
     * console.log(tleEpochToUTC_Str(epoch).toISOString()); // "2025-11-09T23:14:21.578Z"
     * @param epoch: string
     * @returns Date object
     */
    public static tleEpochToUTC_Str(epoch: string): Date {
        const yearPart = epoch.slice(0, 2);
        const dayPart = epoch.slice(2);
        const year = 2000 + parseInt(yearPart, 10); // TLE epoch years are 2000+ for 2000-2099
        const dayOfYear = parseFloat(dayPart);
        // Calculate the date
        const jan1 = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
        // Add days (dayOfYear - 1 because Jan 1 is day 1)
        const msPerDay = 24 * 60 * 60 * 1000;
        const msOffset = (dayOfYear - 1) * msPerDay;
        return new Date(jan1.getTime() + msOffset);
    }
}
