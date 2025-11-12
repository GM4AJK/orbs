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
import * as satellite from 'satellite.js';
import { AppSat } from './appsat.ts';
import { Earth } from './earth.ts';
import { Globals as Globals } from './globals.ts';

export class AppSatMgr {

    public numOfArrays: number = 32;
    private appSatArrayIndex: number = 0;

    private earth: Earth;

    // Set true when sats loaded.
    public recs_loaded: boolean = false;

    //! Map of AppSats.
    public appSatsMap: Map<number, AppSat>;
    public appSatsArrayMap: Array<Map<number, AppSat>>;

    constructor(earth: Earth) {
        this.earth = earth;
        this.appSatsMap = new Map<number, AppSat>;
        this.appSatsArrayMap = new Array<Map<number, AppSat>>;
        for (let i: number = 0; i < this.numOfArrays; i++) {
            const map = new Map<number, AppSat>;
            this.appSatsArrayMap[i] = map;
        }
    }

    private hasSat(satId: number): [number, number, number] | null {
        for (let i = 0; i < this.numOfArrays; i++) {
            if (this.appSatsArrayMap[i].has(satId)) {
                const appSat: AppSat | undefined = this.appSatsArrayMap[i].get(satId);
                if (appSat !== undefined) {
                    const epochValue = appSat.epochNumeric;
                    if (epochValue !== null) {
                        return [satId, i, epochValue];
                    }
                }
            }
        }
        return null;
    }

    private replaceSat(index: number, satId: number, a: AppSat) {
        this.appSatsArrayMap[index].delete(satId);
        this.appSatsArrayMap[index].set(satId, a);
    }

    private starlinkShells(): String {
        const dir = Globals.starlinkShellsDir;
        return "";
    }

    async init(filename: string = "TLEs/stations.json"): Promise<void> {
        if (Globals.opmode == "prd") {
            filename = "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json";
        }
        console.log(`Loading ${filename}...`);
        const response = await fetch(filename);
        const data = await response.json();
        const d: Date = new Date();
        let loopIndex: number = 0;
        data.forEach((record: satellite.OMMJsonObject, _index: number) => {
            if (record !== null) {
                const satId: number = Number(record.NORAD_CAT_ID);
                const s: satellite.SatRec = satellite.json2satrec(record);
                if (AppSat.satRecTest(s, d)) { // Test the TLE can propagate.
                    const a = AppSat.Factory_FromJsonOMM(record);
                    if (a !== null) {
                        //          satId   index   epochNum
                        const has: [number, number, number] | null = this.hasSat(satId);
                        if (has !== null) {
                            const index: number = has[1];
                            const otherEpoch: number = has[2];
                            const myEpoch: number | null = a.epochNumeric;
                            if (myEpoch !== null) {
                                if (myEpoch > otherEpoch) {
                                    this.replaceSat(index, satId, a);
                                }
                            }
                        }
                        else {
                            this.appSatsArrayMap[loopIndex++].set(satId, a);
                            if (loopIndex >= this.numOfArrays) loopIndex = 0;
                        }
                        if (this.appSatsMap.has(satId)) {
                            const inlist: AppSat | undefined = this.appSatsMap.get(satId);
                            if (inlist && a.epochNumeric != null && inlist.epochNumeric != null) {
                                const otherEpoch = AppSat.tleEpochToUTC_Num(inlist.epochNumeric);
                                const thisEpoch = AppSat.tleEpochToUTC_Num(a.epochNumeric);
                                if (thisEpoch > otherEpoch) {
                                    // This is a newer TLE, remove the older one from the list and insert this one
                                    this.appSatsMap.delete(satId);
                                    this.appSatsMap.set(satId, a);
                                }
                            }
                        }
                        else {
                            this.appSatsMap.set(satId, a);
                        }
                    }
                }
            }
        });
        console.log(`Done.`);
        this.recs_loaded = true;
    }

    async initStarlinkPlane(filename: string = "TLEs/starlink/grouped_shells_json/shell_300km/plane_0.json"): Promise<void> {
        if (Globals.opmode == "prd") {
            filename = "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json";
        }
        console.log(`Loading ${filename}`);
        const response = await fetch(filename);
        const data = await response.json();
        const d: Date = new Date();
        let loopIndex: number = 0;
        data.forEach((record: satellite.OMMJsonObject, _index: number) => {
            if (record !== null) {
                const satId: number = Number(record.NORAD_CAT_ID);
                const s: satellite.SatRec = satellite.json2satrec(record);
                if (AppSat.satRecTest(s, d)) { // Test the TLE can propagate.
                    const a = AppSat.Factory_FromJsonOMM(record);
                    if (a !== null) {
                        //          satId   index   epochNum
                        const has: [number, number, number] | null = this.hasSat(satId);
                        if (has !== null) {
                            const index: number = has[1];
                            const otherEpoch: number = has[2];
                            const myEpoch: number | null = a.epochNumeric;
                            if (myEpoch !== null) {
                                if (myEpoch > otherEpoch) {
                                    this.replaceSat(index, satId, a);
                                }
                            }
                        }
                        else {
                            this.appSatsArrayMap[loopIndex++].set(satId, a);
                            if (loopIndex >= this.numOfArrays) loopIndex = 0;
                        }
                        if (this.appSatsMap.has(satId)) {
                            const inlist: AppSat | undefined = this.appSatsMap.get(satId);
                            if (inlist && a.epochNumeric != null && inlist.epochNumeric != null) {
                                const otherEpoch = AppSat.tleEpochToUTC_Num(inlist.epochNumeric);
                                const thisEpoch = AppSat.tleEpochToUTC_Num(a.epochNumeric);
                                if (thisEpoch > otherEpoch) {
                                    // This is a newer TLE, remove the older one from the list and insert this one
                                    this.appSatsMap.delete(satId);
                                    this.appSatsMap.set(satId, a);
                                }
                            }
                        }
                        else {
                            this.appSatsMap.set(satId, a);
                        }
                    }
                }
            }
        });
        console.log(`Done.`);
        this.recs_loaded = true;
    }

    public updateSatellites(clock: Date) {
        if (this.appSatsMap.size < 1) {
            return;
        }
        this.appSatsMap.forEach((sat: AppSat, _satId: number) => {
            let color = null, radius = null;
            if (sat.line0 !== null) {
                [color, radius] = this.specialCases(sat.line0);
            }
            const result = sat.update(clock, color, radius);
            if (result !== null) {
                const spot = sat.getSpot();
                if (spot !== null) {
                    const old = sat.getOldSpot();
                    if (old !== null) {
                        this.earth.earth.remove(old);
                        sat.spotDispose(old);
                    }
                    this.earth.earth.add(spot);
                    if (Globals.log_sat_updates === true && sat.line0 !== null) {
                        if (Globals.satNameArray.indexOf(sat.line0) > -1) {
                            console.log(sat.toString());
                        }
                    }
                }
            }
        });
    }

    private lastIndexUpdated: number = 0;

    public updateSatellitesNew(clock: Date) {
        if (this.appSatsMap.size < 1) {
            return;
        }
        const map: Map<number, AppSat> = this.appSatsArrayMap[this.lastIndexUpdated++];
        if (this.lastIndexUpdated >= this.numOfArrays) {
            this.lastIndexUpdated = 0;
        }
        map.forEach((sat: AppSat, _satId: number) => {
            let color = null, radius = null;
            if (sat.line0 !== null) {
                [color, radius] = this.specialCases(sat.line0);
            }
            const result = sat.update(clock, color, radius);
            if (result !== null) {
                const spot = sat.getSpot();
                if (spot !== null) {
                    const old = sat.getOldSpot();
                    if (old !== null) {
                        this.earth.earth.remove(old);
                        sat.spotDispose(old);
                    }
                    this.earth.earth.add(spot);
                    if (Globals.log_sat_updates === true && sat.line0 !== null) {
                        if (Globals.satNameArray.indexOf(sat.line0) > -1) {
                            console.log(sat.toString());
                        }
                    }
                }
            }
        });
    }

    private specialCases(name: string): [number, number] | [null, null] {
        // ISS and CSS are special cases so color and enlarge them
        if (name == 'ISS (ZARYA)') {
            return [0xff0000, 50];
        }
        if (name == 'CSS (TIANHE)') {
            return [0xffff00, 50];
        }
        return [null, null];
    }

}
