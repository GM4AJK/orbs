import {
    EventDispatcher,
    Matrix4,
    MOUSE,
    Spherical,
    TOUCH,
    Vector2,
    Vector3,
    PerspectiveCamera,
    OrthographicCamera
} from 'three';

class ECIControls extends EventDispatcher {
    object: PerspectiveCamera | OrthographicCamera;
    domElement: HTMLElement;

    // Public properties
    enabled: boolean = true;
    target: Vector3 = new Vector3();
    minDistance: number = 0;
    maxDistance: number = Infinity;
    minZoom: number = 0;
    maxZoom: number = Infinity;
    minPolarAngle: number = 0;
    maxPolarAngle: number = Math.PI;
    minAzimuthAngle: number = -Infinity;
    maxAzimuthAngle: number = Infinity;
    enableDamping: boolean = false;
    dampingFactor: number = 0.05;
    enableZoom: boolean = true;
    zoomSpeed: number = 1.0;
    enableRotate: boolean = true;
    rotateSpeed: number = 1.0;
    enablePan: boolean = true;
    panSpeed: number = 1.0;
    screenSpacePanning: boolean = true;
    keyPanSpeed: number = 7.0;
    autoRotate: boolean = false;
    autoRotateSpeed: number = 2.0;
    keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };
    mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
    touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };

    // Private properties
    private position: Vector3 = new Vector3();
    private offset: Vector3 = new Vector3();
    private spherical: Spherical = new Spherical();
    private sphericalDelta: Spherical = new Spherical();
    private scale: number = 1;
    private panOffset: Vector3 = new Vector3();
    private zoomChanged: boolean = false;
    private rotateStart: Vector2 = new Vector2();
    private rotateEnd: Vector2 = new Vector2();
    private rotateDelta: Vector2 = new Vector2();
    private panStart: Vector2 = new Vector2();
    private panEnd: Vector2 = new Vector2();
    private panDelta: Vector2 = new Vector2();
    private dollyStart: Vector2 = new Vector2();
    private dollyEnd: Vector2 = new Vector2();
    private dollyDelta: Vector2 = new Vector2();
    private ECI_UP: Vector3 = new Vector3(0, 0, 1); // +Z up for ECI frame

    constructor(object: PerspectiveCamera | OrthographicCamera, domElement: HTMLElement) {
        super();

        this.object = object;
        this.domElement = domElement;

        // Initialize position from current camera position
        this.position.copy(this.object.position);
        this.spherical.setFromVector3(this.position.sub(this.target));
        
        this.domElement.style.touchAction = 'none'; // Disable browser handling of all panning and zooming gestures

        this.domElement.addEventListener('contextmenu', this.onContextMenu);
        this.domElement.addEventListener('pointerdown', this.onPointerDown);
        this.domElement.addEventListener('pointercancel', this.onPointerUp);
        this.domElement.addEventListener('wheel', this.onMouseWheel);
        this.domElement.addEventListener('touchstart', this.onTouchStart);
        this.domElement.addEventListener('keydown', this.onKeyDown);

        this.update();
    }

    // Public methods
    getPolarAngle(): number {
        return this.spherical.phi;
    }

    getAzimuthalAngle(): number {
        return this.spherical.theta;
    }

    saveState(): void {
        this.target.copy(this.target);
    }

    reset(): void {
        this.target.set(0, 0, 0);
        this.object.position.copy(this.position);
        this.update();
    }

    update(): boolean {
        const offset = new Vector3();

        // Get current position relative to target
        offset.copy(this.object.position).sub(this.target);

        // Convert to spherical coordinates (we're in Z-up space)
        this.spherical.setFromVector3(offset);

        if (this.autoRotate && this.enableRotate) {
            this.sphericalDelta.theta -= 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
        }

        // Apply rotation deltas
        if (!this.enableDamping) {
            this.spherical.theta += this.sphericalDelta.theta;
            this.spherical.phi += this.sphericalDelta.phi;
        } else {
            this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
            this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
        }

        // Restrict phi to avoid the poles
        this.spherical.phi = Math.max(0.000001, Math.min(Math.PI - 0.000001, this.spherical.phi));

        // Convert back to cartesian
        offset.setFromSpherical(this.spherical);

        // Move target by pan offset
        this.target.add(this.panOffset);

        // Update camera position and orientation
        this.object.position.copy(this.target).add(offset);
        this.object.up.set(0, 0, 1);  // Maintain Z-up
        this.object.lookAt(this.target);

        // Reset deltas
        if (!this.enableDamping) {
            this.sphericalDelta.set(0, 0, 0);
            this.panOffset.set(0, 0, 0);
        } else {
            this.sphericalDelta.theta *= (1 - this.dampingFactor);
            this.sphericalDelta.phi *= (1 - this.dampingFactor);
            this.panOffset.multiplyScalar(1 - this.dampingFactor);
        }

        return this.zoomChanged;

        // Restrict phi to be between desired limits
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
        this.spherical.makeSafe();

        // Restrict theta to be between desired limits
        this.spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this.spherical.theta));

        // Move target by pan offset
        this.target.add(this.panOffset);

        // Convert back from spherical to cartesian
        offset.setFromSpherical(this.spherical);

        // Update position
        this.object.position.copy(this.target).add(offset);

        // Maintain camera up vector as +Z while looking at target
        this.object.up.set(0, 0, 1);
        this.object.lookAt(this.target);

        if (this.enableDamping) {
            this.sphericalDelta.theta *= (1 - this.dampingFactor);
            this.sphericalDelta.phi *= (1 - this.dampingFactor);
            this.panOffset.multiplyScalar(1 - this.dampingFactor);
        } else {
            this.sphericalDelta.set(0, 0, 0);
            this.panOffset.set(0, 0, 0);
        }

        this.scale = 1;

        return this.zoomChanged;
    }

    dispose(): void {
        this.domElement.removeEventListener('contextmenu', this.onContextMenu);
        this.domElement.removeEventListener('pointerdown', this.onPointerDown);
        this.domElement.removeEventListener('wheel', this.onMouseWheel);
        this.domElement.removeEventListener('touchstart', this.onTouchStart);
        this.domElement.removeEventListener('keydown', this.onKeyDown);
    }

    // Event handlers
    private onContextMenu = (event: Event): void => {
        event.preventDefault();
    }

    private onPointerDown = (event: PointerEvent): void => {
        if (!this.enabled) return;

        event.preventDefault();

        switch (event.button) {
            case 0: // LEFT
                if (this.mouseButtons.LEFT === MOUSE.ROTATE) {
                    this.rotateStart.set(event.clientX, event.clientY);
                    this.handleMouseDownRotate(event);
                }
                break;
            case 1: // MIDDLE
                if (this.mouseButtons.MIDDLE === MOUSE.DOLLY) {
                    this.dollyStart.set(event.clientX, event.clientY);
                    this.handleMouseDownDolly(event);
                }
                break;
            case 2: // RIGHT
                if (this.mouseButtons.RIGHT === MOUSE.PAN) {
                    this.panStart.set(event.clientX, event.clientY);
                    this.handleMouseDownPan(event);
                }
                break;
        }

        document.addEventListener('pointermove', this.onPointerMove);
        document.addEventListener('pointerup', this.onPointerUp);
    }

    private onPointerMove = (event: PointerEvent): void => {
        if (!this.enabled) return;

        event.preventDefault();

        if (event.buttons & 1) { // LEFT
            if (this.mouseButtons.LEFT === MOUSE.ROTATE) {
                this.rotateEnd.set(event.clientX, event.clientY);
                this.handleMouseMoveRotate(event);
            }
        }
        if (event.buttons & 4) { // MIDDLE
            if (this.mouseButtons.MIDDLE === MOUSE.DOLLY) {
                this.dollyEnd.set(event.clientX, event.clientY);
                this.handleMouseMoveDolly(event);
            }
        }
        if (event.buttons & 2) { // RIGHT
            if (this.mouseButtons.RIGHT === MOUSE.PAN) {
                this.panEnd.set(event.clientX, event.clientY);
                this.handleMouseMovePan(event);
            }
        }
        
        this.update();
    }

    private onPointerUp = (): void => {
        document.removeEventListener('pointermove', this.onPointerMove);
        document.removeEventListener('pointerup', this.onPointerUp);
    }

    private onMouseWheel = (event: WheelEvent): void => {
        if (!this.enabled || !this.enableZoom) return;

        event.preventDefault();

        if (event.deltaY < 0) {
            this.dollyIn(this.getZoomScale());
        } else {
            this.dollyOut(this.getZoomScale());
        }

        this.update();
    }

    private onTouchStart = (event: TouchEvent): void => {
        if (!this.enabled) return;

        event.preventDefault();

        switch (event.touches.length) {
            case 1:
                if (this.enableRotate) {
                    this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
                    this.handleTouchStartRotate(event);
                }
                break;
            case 2:
                if (this.enableZoom) {
                    const dx = event.touches[0].pageX - event.touches[1].pageX;
                    const dy = event.touches[0].pageY - event.touches[1].pageY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    this.dollyStart.set(0, distance);
                    this.handleTouchStartDolly(event);
                }
                break;
        }
    }

    private onKeyDown = (event: KeyboardEvent): void => {
        if (!this.enabled || !this.enablePan) return;

        switch (event.key) {
            case this.keys.UP:
                this.pan(0, this.keyPanSpeed);
                this.update();
                break;
            case this.keys.BOTTOM:
                this.pan(0, -this.keyPanSpeed);
                this.update();
                break;
            case this.keys.LEFT:
                this.pan(this.keyPanSpeed, 0);
                this.update();
                break;
            case this.keys.RIGHT:
                this.pan(-this.keyPanSpeed, 0);
                this.update();
                break;
        }
    }

    // Utility methods
    private getZoomScale(): number {
        return Math.pow(0.95, this.zoomSpeed);
    }

    private panLeft(distance: number, objectMatrix: Matrix4): void {
        const v = new Vector3();
        v.setFromMatrixColumn(objectMatrix, 0);
        v.multiplyScalar(-distance);
        this.panOffset.add(v);
    }

    private panUp(distance: number, objectMatrix: Matrix4): void {
        const v = new Vector3();
        if (this.screenSpacePanning) {
            v.setFromMatrixColumn(objectMatrix, 1);
        } else {
            v.setFromMatrixColumn(objectMatrix, 0);
            v.crossVectors(this.ECI_UP, v);
        }
        v.multiplyScalar(distance);
        this.panOffset.add(v);
    }

    private pan(deltaX: number, deltaY: number): void {
        const element = this.domElement;
        const offset = new Vector3();
        const position = this.object.position;

        offset.copy(position).sub(this.target);
        let targetDistance = offset.length();

        if (this.object instanceof PerspectiveCamera) {
            targetDistance *= Math.tan((this.object.fov / 2) * Math.PI / 180.0);
            this.panLeft(2 * deltaX * targetDistance / element.clientHeight, this.object.matrix);
            this.panUp(2 * deltaY * targetDistance / element.clientHeight, this.object.matrix);
        } else if (this.object instanceof OrthographicCamera) {
            this.panLeft(deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth, this.object.matrix);
            this.panUp(deltaY * (this.object.top - this.object.bottom) / this.object.zoom / element.clientHeight, this.object.matrix);
        }
    }

    private dollyIn(dollyScale: number): void {
        if (this.object instanceof PerspectiveCamera) {
            this.scale /= dollyScale;
        } else if (this.object instanceof OrthographicCamera) {
            this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale));
            this.object.updateProjectionMatrix();
            this.zoomChanged = true;
        }
    }

    private dollyOut(dollyScale: number): void {
        if (this.object instanceof PerspectiveCamera) {
            this.scale *= dollyScale;
        } else if (this.object instanceof OrthographicCamera) {
            this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale));
            this.object.updateProjectionMatrix();
            this.zoomChanged = true;
        }
    }

    // Mouse handlers
    private handleMouseDownRotate(event: MouseEvent): void {
        this.rotateStart.set(event.clientX, event.clientY);
    }

    private handleMouseMoveRotate(event: MouseEvent): void {
        this.rotateEnd.set(event.clientX, event.clientY);
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

        const element = this.domElement;
        
        // Swap X/Y and adjust signs for Z-up orientation
        this.sphericalDelta.phi = -2 * Math.PI * this.rotateDelta.x / element.clientHeight * this.rotateSpeed;
        this.sphericalDelta.theta = 2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed;

        this.rotateStart.copy(this.rotateEnd);
    }

    private handleMouseDownDolly(event: MouseEvent): void {
        this.dollyStart.set(event.clientX, event.clientY);
    }

    private handleMouseMoveDolly(event: MouseEvent): void {
        this.dollyEnd.set(event.clientX, event.clientY);
        this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

        if (this.dollyDelta.y > 0) {
            this.dollyOut(this.getZoomScale());
        } else if (this.dollyDelta.y < 0) {
            this.dollyIn(this.getZoomScale());
        }

        this.dollyStart.copy(this.dollyEnd);
        this.update();
    }

    private handleMouseDownPan(event: MouseEvent): void {
        this.panStart.set(event.clientX, event.clientY);
    }

    private handleMouseMovePan(event: MouseEvent): void {
        this.panEnd.set(event.clientX, event.clientY);
        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
        this.pan(this.panDelta.x, this.panDelta.y);
        this.panStart.copy(this.panEnd);
        this.update();
    }

    // Touch handlers
    private handleTouchStartRotate(event: TouchEvent): void {
        if (event.touches.length === 1) {
            this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
        }
    }

    private handleTouchStartDolly(event: TouchEvent): void {
        if (event.touches.length === 2) {
            const dx = event.touches[0].pageX - event.touches[1].pageX;
            const dy = event.touches[0].pageY - event.touches[1].pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.dollyStart.set(0, distance);
        }
    }
}

export { ECIControls };
