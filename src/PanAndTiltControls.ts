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
import * as THREE from 'three';
import { TopocentricCoordDegToXYZ } from './apputils.js';

class InputController {
    // Oneshot state
    oneShotKeyPress: {
        edge: Boolean;
        active: Boolean;
    };
    // Current state
    current: {
        mouseYDelta: number;
        mouseXDelta: number; 
        leftButton: boolean; 
        rightButton: boolean; 
        mouseX: number; 
        mouseY: number; 
    };
    // Previous state
    previous: { 
        leftButton: boolean; 
        rightButton: boolean; 
        mouseX: number; 
        mouseY: number; 
    };
    // Current keys pressed
    keys: { [key: string]: boolean };
    // Previous keys pressed
    previousKeys: { [key: string]: boolean };

    constructor() {
        this.oneShotKeyPress = {
            edge: false,
            active: false
        };
        this.current = { 
            leftButton: false, 
            rightButton: false, 
            mouseX: 0, 
            mouseY: 0,
            mouseXDelta: 0,
            mouseYDelta: 0
        };
        this.previous = { 
            leftButton: false, 
            rightButton: false, 
            mouseX: 0, 
            mouseY: 0 
        };
        this.keys = {};
        this.previousKeys = {}; 
        document.addEventListener('mousedown', (event) => this.onMouseDown(event), false);
        document.addEventListener('mouseup', (event) => this.onMouseUp(event), false);
        document.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        document.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        document.addEventListener('keyup', (event) => this.onKeyUp(event), false);          
    }
    onMouseDown(event: MouseEvent) {
        switch (event.button) {
            case 0:
                this.current.leftButton = false;
                break;
            case 2:
                this.current.rightButton = true;
                break;
        }
    }
    
    onMouseUp(event: MouseEvent) {
        switch (event.button) {
            case 0:
                this.current.leftButton = false;
                break;
            case 2:
                this.current.rightButton = false;
                break;
        }
    }

    onMouseMove(event: MouseEvent) {
        this.current.mouseX = event.pageX - window.innerWidth / 2;
        this.current.mouseY = event.pageY - window.innerHeight / 2;
        this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
        this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;
        this.previous = { ...this.current };
    }   

    // Keyboard event codes
    // ArrowLeft, ArrowUp, ArrowRight, ArrowDown
    // KeyW, KeyA, KeyS, KeyD
    // Space, ShiftLeft
    // Period
    // Comma

    onKeyDown(event: KeyboardEvent) {
        this.keys[event.code] = true;
    }

    onKeyUp(event: KeyboardEvent) {
        this.keys[event.code] = false;
    }

    update() {
        this.previous = { ...this.current };
    }
}


export class PanAndTiltControls {
        
    camera: THREE.Camera;
    controls: InputController;
    keyPressedCounter: number = 0;
    azimuth: number = 0; // in degrees
    elevation: number = 10; // in degrees
    range: number;
    stepInDegrees: number = 0.25;

    constructor(camera: THREE.Camera, range: number = 500) {
        this.camera = camera;
        this.range = range;
        camera.up.set(0, 1, 0);
        const vec = TopocentricCoordDegToXYZ({ azimuth: this.azimuth, elevation: this.elevation, range: this.range });
        camera.position.set(0, 10, 0);
        camera.lookAt(vec);
        this.controls = new InputController();
    }

    update() {
        this.controls.update();
        this.updateForKeyDown();
    }

    pan(degrees: number) {
        this.incAzimuthDegrees(degrees);
        this.camera.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(degrees));
    }   
    
    tilt(degrees: number) {
        this.incElevationDegrees(degrees);
        this.camera.rotateX(THREE.MathUtils.degToRad(degrees));
    }

    updateForKeyDown(): Boolean {
        let active: Boolean = false;
        if(this.controls.keys['ArrowLeft'] === true || this.controls.keys['KeyA'] === true) {
            this.pan(1.0);
            active = true;
        }
        else if(this.controls.keys['ArrowRight'] === true || this.controls.keys['KeyD'] === true) {
            this.pan(-1.0);
            active = true;
        }   
        else if(this.controls.keys['ArrowUp'] === true || this.controls.keys['KeyW'] === true) {
            if(this.getElevationDegrees() < 89.9) {
                this.tilt(1.0);
                active = true;
            }
        }
        else if(this.controls.keys['ArrowDown'] === true || this.controls.keys['KeyS'] === true) {
            if(this.getElevationDegrees() > -15.0) {
                this.tilt(-1.0);
                active = true;
            }
        }
        else if(this.controls.keys['Period'] === true) {
            this.camera.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(this.stepInDegrees));
            active = true;
        }
        else if(this.controls.keys['Comma'] === true) {
            this.camera.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(-this.stepInDegrees));
            active = true;
        }
        if(active !== false) {
            this.keyPressedCounter++;
            this.logCameraPosition();
        }
        return active;
    }

    getAzimuthDegrees(): number {
        return 360.0 - this.azimuth;
    }

    getAzimuthRadians(): number {
        return THREE.MathUtils.degToRad(this.azimuth);
    }

    incAzimuthDegrees(azm: number) {
        this.azimuth += azm;
        if(this.azimuth > 360.0) {
            this.azimuth -= 360.0;
        }
        else if(this.azimuth < 0) {
            this.azimuth += 360.0;
        }
    }

    incAzimuthRadians(azm: number) {
        this.azimuth += azm;
        if(this.azimuth > (Math.PI * 2)) {
            this.azimuth -= (Math.PI * 2);
        }
        else if(this.azimuth < 0) {
            this.azimuth += (Math.PI * 2);
        }
    }

    getElevationDegrees(): number {
        return this.elevation;
    }

    getElevationRadians(): number {
        return THREE.MathUtils.degToRad(this.elevation);
    }

    incElevationDegrees(ele: number) {
        this.elevation += ele;
        if(this.elevation > 90) {
            this.elevation -= 90;
        }
        else if(this.elevation < -90) {
            this.elevation += 90;
        }
    }

    incElevationradians(ele: number) {
        this.elevation += ele;
        if(this.elevation > (Math.PI / 2)) {
            this.elevation -= (Math.PI / 2);
        }
        else if(this.elevation < -(Math.PI / 2)) {
            this.elevation += (Math.PI / 2);
        }
    }
   
    logCameraPosition() {
        console.log(this.toString());
        let v = new THREE.Vector3();
        console.log("Pressed Counter = " + this.keyPressedCounter); 
        v = this.camera.position;
        this.logCameraPositionHelper("Lpos", v);
        this.camera.getWorldPosition(v);
        this.logCameraPositionHelper("Wpos", v);
    }

    logCameraPositionHelper(txt: string, vec: THREE.Vector3) {
        console.log(`${txt}: x=${vec.x.toFixed(2)} y=${vec.y.toFixed(2)} z=${vec.z.toFixed(2)}`);
    }

    toString(): string {
        const a = this.getAzimuthDegrees();
        const e = this.getElevationDegrees();
        let s = `Azm: ${a} Ele: ${e}`;
        return s;
    }
}