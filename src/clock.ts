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

    // The Date object shared out across things that need the sim date and time.
    public Date: Date;

    // Internal variables to maintain the clock.
    private lastRealMS: number;
    private speedMultiplier: number;
    private lastDeltaMS: number = 0; // stores last delta

    constructor(
        startDate: Date | null = null, // Initial, optional, starting date.
        speedMultiplier: number = 1    // Speed multipler.
    ) {
        this.Date = startDate ? new Date(startDate) : new Date();
        this.lastRealMS = Date.now();
        this.speedMultiplier = speedMultiplier;
    }

    public update() {
        const now = Date.now();
        const realDelta = now - this.lastRealMS;
        this.lastRealMS = now;
        const simulatedDelta = realDelta * this.speedMultiplier;
        this.lastDeltaMS = simulatedDelta;
        this.Date = new Date(this.Date.getTime() + simulatedDelta);
    }

    public getDelta(): number {
        return this.lastDeltaMS;
    }

    public setSpeed(
        multiplier: number
    ) {
        this.speedMultiplier = multiplier;
    }

    public setDate(
        newDate: Date
    ) {
        this.Date = new Date(newDate);
        this.lastRealMS = Date.now(); // reset anchor
        this.lastDeltaMS = 0; // reset delta
    }

    public getTime(): number {
        return this.Date.getTime();
    }

    public getDate(): Date {
        return this.Date;
    }
}
