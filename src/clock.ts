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
export class Clock {

    public Date: Date;
    private initMS: number;


    constructor(in_date: Date | null) {
        if(in_date === null) {
            this.Date = new Date();
        }
        else {
            this.Date = in_date;
        }
        this.initMS = Date.now();
    }

    // To be called in the animate loop to
    // ensure that internal clock advances.
    update() {
        const currMS = Date.now();
        const delta = currMS - this.initMS;
        this.initMS = currMS;
        this.Date.setTime(this.Date.getTime() + delta);
    }
}