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
export class Globals {

    /**
     * App operation mode. Setting this to "dev" loads files, like TLEs from
     * a local file store instead of downloading from Celestrak. Setting it 
     * to "prod" will cause downloads at app start.
     */
    public static opmode: string = 'dev';

    public static localTles = [
        "TLEs/visual.json",
        "TLEs/stations.json",
        //"TLEs/starlink.json",
    ];

    public static celestrakTles = [
        "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json",
        "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json",
        //"https://celestrak.org/NORAD/elements/gp.php?GROUP=starlinkl&FORMAT=json",
    ];

    public static debug: boolean = true;

    public static useAmbientLight: boolean = true;
    public static ambientLightValue: number = 0x242824;

    public static showWorldAxisHelperArrows: boolean = true;
    /**
     * Should the Earth.update() function console log when a satellite
     * propagation took place those details? Set to true to enable.
     * Additionally limit which satellites get logged because they are
     * very verbose and 1000s of satellites will flood the console log.
     */
    public static log_sat_updates: boolean = false;
    public static satNameArray: Array<string> = [
        'ISS (ZARYA)',
    ];


    public static starlinkShellsDir: Array<string> = [
        "public/TLEs/starlink/grouped_shells",
    ];


    public static log_sun_position_updates: boolean = false;

}
