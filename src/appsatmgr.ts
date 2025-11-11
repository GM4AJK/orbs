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
import { Globals as Globals } from './globals.ts';

export class AppSatMgr {

    // Set true when sats loaded.
    public recs_loaded: boolean = false;

    //! Map of AppSats.
    public appSatsMap: Map<number, AppSat>;

    constructor() {
        this.appSatsMap = new Map<number, AppSat>;
    }

    async init(filename: string = "TLEs/starlink.json"): Promise<void> {
        if(Globals.opmode == "prd") {
            filename = "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json";
        }
        console.log(`Loading ${filename}...`);
        const response = await fetch(filename);
        const data = await response.json();
        const d:Date = new Date();
        data.forEach((record: satellite.OMMJsonObject, _index: number) => {
            if(record !== null) {
                const satId: number = Number(record.NORAD_CAT_ID);
                const s: satellite.SatRec = satellite.json2satrec(record);
                if(AppSat.satRecTest(s, d)) { // Test the TLE can propagate.
                    const a = AppSat.Factory_FromJsonOMM(record);
                    if(a !== null) {
                        if(this.appSatsMap.has(satId)) {
                            const inlist:AppSat | undefined = this.appSatsMap.get(satId);
                            if(inlist && a.epochNumeric!= null && inlist.epochNumeric != null) {
                                const otherEpoch = AppSat.tleEpochToUTC_Num(inlist.epochNumeric);
                                const thisEpoch = AppSat.tleEpochToUTC_Num(a.epochNumeric);
                                if(thisEpoch > otherEpoch) {
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
}
