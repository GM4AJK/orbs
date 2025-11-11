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

import { Globals as Globals } from './globals.ts';

export class AppSatMgr {

    public recs_loaded: boolean = false;
    public recs: Array<satellite.OMMJsonObject>;

    constructor() {
        this.recs = new Array<satellite.OMMJsonObject>;
    }

    async init(filename: string = "TLEs/stations.json"): Promise<void> {
        if(Globals.opmode == "dev") {
            const response = await fetch(filename);
            const data = await response.json();
            data.forEach((record: satellite.OMMJsonObject, _index: number) => {
                this.recs.push(record);
            });
        }
        this.recs_loaded = true;
    }
}
