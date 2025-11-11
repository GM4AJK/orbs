

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