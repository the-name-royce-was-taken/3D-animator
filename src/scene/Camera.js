import * as THREE from "three";

export default class CameraController {
    constructor(options = {}) {
        this.container =
            options.container || null;

        this.camera =
            options.camera ||
            this.createCamera(
                options
            );

        this.mode =
            options.mode ||
            "perspective";

        this.fov =
            Number.isFinite(
                options.fov
            )
                ? options.fov
                : 45;

        this.near =
            Number.isFinite(
                options.near
            )
                ? options.near
                : 0.01;

        this.far =
            Number.isFinite(
                options.far
            )
                ? options.far
                : 5000;

        this.distance =
            Number.isFinite(
                options.distance
            )
                ? options.distance
                : 6;

        this.target =
            new THREE.Vector3(
                0,
                1,
                0
            );

        this.position =
            new THREE.Vector3(
                4,
                3,
                6
            );

        this.up =
            new THREE.Vector3(
                0,
                1,
                0
            );

        this.minDistance =
            Number.isFinite(
                options.minDistance
            )
                ? options.minDistance
                : 0.1;

        this.maxDistance =
            Number.isFinite(
                options.maxDistance
            )
                ? options.maxDistance
                : 5000;

        this.orthoSize =
            Number.isFinite(
                options.orthoSize
            )
                ? options.orthoSize
                : 10;

        this.listeners = {
            changed: [],
        };

        this.updateProjection();
        this.lookAtTarget();
    }

    createCamera(
        options
    ) {
        const width =
            this.container?.clientWidth ||
            800;

        const height =
            this.container?.clientHeight ||
            600;

        const aspect =
            width / height;

        return new THREE.PerspectiveCamera(
            Number.isFinite(
                options.fov
            )
                ? options.fov
                : 45,
            aspect,
            Number.isFinite(
                options.near
            )
                ? options.near
                : 0.01,
            Number.isFinite(
                options.far
            )
                ? options.far
                : 5000
        );
    }

    setContainer(
        container
    ) {
        this.container =
            container;

        this.updateProjection();
    }

    getCamera() {
        return this.camera;
    }

    getObject() {
        return this.camera;
    }

    setMode(
        mode
    ) {
        if (
            mode !==
                "perspective" &&
            mode !==
                "orthographic"
        ) {
            return;
        }

        if (
            mode ===
            this.mode
        ) {
            return;
        }

        const oldPosition =
            this.camera.position.clone();

        const oldTarget =
            this.target.clone();

        this.mode =
            mode;

        if (
            mode ===
            "perspective"
        ) {
            const width =
                this.container?.clientWidth ||
                800;

            const height =
                this.container?.clientHeight ||
                600;

            this.camera =
                new THREE.PerspectiveCamera(
                    this.fov,
                    width /
                        height,
                    this.near,
                    this.far
                );
        } else {
            const width =
                this.container?.clientWidth ||
                800;

            const height =
                this.container?.clientHeight ||
                600;

            const aspect =
                width / height;

            this.camera =
                new THREE.OrthographicCamera(
                    (-this.orthoSize *
                        aspect) /
                        2,
                    (this.orthoSize *
                        aspect) /
                        2,
                    this.orthoSize /
                        2,
                    (-this.orthoSize) /
                        2,
                    this.near,
                    this.far
                );

            this.camera.userData.viewSize =
                this.orthoSize;
        }

        this.camera.position.copy(
            oldPosition
        );

        this.camera.up.copy(
            this.up
        );

        this.target.copy(
            oldTarget
        );

        this.lookAtTarget();
        this.emitChanged();
    }

    toggleMode() {
        this.setMode(
            this.mode ===
                "perspective"
                ? "orthographic"
                : "perspective"
        );

        return this.mode;
    }

    updateProjection() {
        if (
            !this.camera
        ) {
            return;
        }

        const width =
            this.container?.clientWidth ||
            800;

        const height =
            this.container?.clientHeight ||
            600;

        const aspect =
            Math.max(
                1,
                width /
                    Math.max(
                        1,
                        height
                    )
            );

        if (
            this.camera
                .isPerspectiveCamera
        ) {
            this.camera.aspect =
                aspect;

            this.camera.fov =
                this.fov;

            this.camera.near =
                this.near;

            this.camera.far =
                this.far;

            this.camera.updateProjectionMatrix();

            return;
        }

        if (
            this.camera
                .isOrthographicCamera
        ) {
            this.camera.left =
                (-this.orthoSize *
                    aspect) /
                2;

            this.camera.right =
                (this.orthoSize *
                    aspect) /
                2;

            this.camera.top =
                this.orthoSize /
                2;

            this.camera.bottom =
                (-this.orthoSize) /
                2;

            this.camera.near =
                this.near;

            this.camera.far =
                this.far;

            this.camera.userData.viewSize =
                this.orthoSize;

            this.camera.updateProjectionMatrix();
        }
    }

    resize(
        width,
        height
    ) {
        if (
            this.container
        ) {
            this.updateProjection();
            return;
        }

        const safeWidth =
            Math.max(
                1,
                Number(width) ||
                    1
            );

        const safeHeight =
            Math.max(
                1,
                Number(height) ||
                    1
            );

        const aspect =
            safeWidth /
            safeHeight;

        if (
            this.camera
                .isPerspectiveCamera
        ) {
            this.camera.aspect =
                aspect;

            this.camera.updateProjectionMatrix();
        } else if (
            this.camera
                .isOrthographicCamera
        ) {
            this.camera.left =
                (-this.orthoSize *
                    aspect) /
                2;

            this.camera.right =
                (this.orthoSize *
                    aspect) /
                2;

            this.camera.updateProjectionMatrix();
        }
    }

    setPosition(
        x,
        y,
        z
    ) {
        if (
            x?.isVector3
        ) {
            this.camera.position.copy(
                x
            );
        } else {
            this.camera.position.set(
                Number(x) || 0,
                Number(y) || 0,
                Number(z) || 0
            );
        }

        this.position.copy(
            this.camera.position
        );

        this.lookAtTarget();
        this.emitChanged();
    }

    getPosition() {
        return this.camera.position.clone();
    }

    setTarget(
        x,
        y,
        z
    ) {
        if (
            x?.isVector3
        ) {
            this.target.copy(
                x
            );
        } else {
            this.target.set(
                Number(x) || 0,
                Number(y) || 0,
                Number(z) || 0
            );
        }

        this.lookAtTarget();
        this.emitChanged();
    }

    getTarget() {
        return this.target.clone();
    }

    lookAtTarget() {
        if (
            !this.camera
        ) {
            return;
        }

        this.camera.lookAt(
            this.target
        );

        this.position.copy(
            this.camera.position
        );
    }

    orbit(
        deltaX,
        deltaY
    ) {
        const offset =
            this.camera.position
                .clone()
                .sub(
                    this.target
                );

        const spherical =
            new THREE.Spherical();

        spherical.setFromVector3(
            offset
        );

        const rotationSpeed =
            0.005;

        spherical.theta -=
            Number(deltaX) *
            rotationSpeed;

        spherical.phi -=
            Number(deltaY) *
            rotationSpeed;

        const epsilon =
            0.01;

        spherical.phi =
            THREE.MathUtils.clamp(
                spherical.phi,
                epsilon,
                Math.PI -
                    epsilon
            );

        spherical.radius =
            THREE.MathUtils.clamp(
                spherical.radius,
                this.minDistance,
                this.maxDistance
            );

        offset.setFromSpherical(
            spherical
        );

        this.camera.position
            .copy(
                this.target
            )
            .add(offset);

        this.lookAtTarget();
        this.emitChanged();
    }

    pan(
        deltaX,
        deltaY
    ) {
        const distance =
            this.camera.position.distanceTo(
                this.target
            );

        const scale =
            distance *
            0.0015;

        const right =
            new THREE.Vector3();

        const up =
            new THREE.Vector3();

        this.camera.getWorldDirection(
            new THREE.Vector3()
        );

        right
            .setFromMatrixColumn(
                this.camera.matrixWorld,
                0
            )
            .normalize();

        up
            .setFromMatrixColumn(
                this.camera.matrixWorld,
                1
            )
            .normalize();

        const movement =
            new THREE.Vector3();

        movement.addScaledVector(
            right,
            -Number(deltaX) *
                scale
        );

        movement.addScaledVector(
            up,
            Number(deltaY) *
                scale
        );

        this.camera.position.add(
            movement
        );

        this.target.add(
            movement
        );

        this.lookAtTarget();
        this.emitChanged();
    }

    dolly(
        amount
    ) {
        const direction =
            this.camera.position
                .clone()
                .sub(
                    this.target
                )
                .normalize();

        const currentDistance =
            this.camera.position.distanceTo(
                this.target
            );

        const nextDistance =
            THREE.MathUtils.clamp(
                currentDistance +
                    Number(
                        amount
                    ),
                this.minDistance,
                this.maxDistance
            );

        this.camera.position.copy(
            this.target
        ).add(
            direction.multiplyScalar(
                nextDistance
            )
        );

        this.distance =
            nextDistance;

        this.lookAtTarget();
        this.emitChanged();
    }

    zoom(
        amount
    ) {
        if (
            this.mode ===
            "orthographic"
        ) {
            this.orthoSize =
                THREE.MathUtils.clamp(
                    this.orthoSize +
                        Number(
                            amount
                        ),
                    0.1,
                    10000
                );

            this.updateProjection();
            this.emitChanged();

            return;
        }

        this.dolly(
            Number(amount)
        );
    }

    focusObject(
        object,
        options = {}
    ) {
        if (
            !object
        ) {
            return false;
        }

        const box =
            new THREE.Box3().setFromObject(
                object
            );

        if (
            box.isEmpty()
        ) {
            return false;
        }

        const center =
            box.getCenter(
                new THREE.Vector3()
            );

        const size =
            box.getSize(
                new THREE.Vector3()
            );

        const maxDimension =
            Math.max(
                size.x,
                size.y,
                size.z,
                0.1
            );

        const padding =
            Number.isFinite(
                options.padding
            )
                ? options.padding
                : 1.5;

        const distance =
            maxDimension *
            padding;

        this.target.copy(
            center
        );

        const direction =
            this.camera.position
                .clone()
                .sub(
                    this.target
                )
                .normalize();

        if (
            direction.lengthSq() ===
            0
        ) {
            direction.set(
                0.5,
                0.4,
                0.8
            ).normalize();
        }

        this.camera.position
            .copy(
                this.target
            )
            .add(
                direction.multiplyScalar(
                    Math.max(
                        distance,
                        this.minDistance
                    )
                )
            );

        if (
            this.mode ===
            "orthographic"
        ) {
            this.orthoSize =
                Math.max(
                    maxDimension *
                        padding,
                    0.1
                );

            this.updateProjection();
        }

        this.lookAtTarget();
        this.emitChanged();

        return true;
    }

    frameObject(
        object,
        options = {}
    ) {
        return this.focusObject(
            object,
            options
        );
    }

    reset(
        options = {}
    ) {
        const position =
            options.position ||
            {
                x: 4,
                y: 3,
                z: 6,
            };

        const target =
            options.target ||
            {
                x: 0,
                y: 1,
                z: 0,
            };

        this.camera.position.set(
            position.x,
            position.y,
            position.z
        );

        this.target.set(
            target.x,
            target.y,
            target.z
        );

        this.orthoSize =
            Number.isFinite(
                options.orthoSize
            )
                ? options.orthoSize
                : 10;

        this.lookAtTarget();
        this.updateProjection();
        this.emitChanged();
    }

    front() {
        const distance =
            this.camera.position.distanceTo(
                this.target
            );

        this.camera.position.set(
            this.target.x,
            this.target.y,
            this.target.z +
                Math.max(
                    distance,
                    1
                )
        );

        this.lookAtTarget();
        this.emitChanged();
    }

    back() {
        const distance =
            this.camera.position.distanceTo(
                this.target
            );

        this.camera.position.set(
            this.target.x,
            this.target.y,
            this.target.z -
                Math.max(
                    distance,
                    1
                )
        );

        this.lookAtTarget();
        this.emitChanged();
    }

    left() {
        const distance =
            this.camera.position.distanceTo(
                this.target
            );

        this.camera.position.set(
            this.target.x -
                Math.max(
                    distance,
                    1
                ),
            this.target.y,
            this.target.z
        );

        this.lookAtTarget();
        this.emitChanged();
    }

    right() {
        const distance =
            this.camera.position.distanceTo(
                this.target
            );

        this.camera.position.set(
            this.target.x +
                Math.max(
                    distance,
                    1
                ),
            this.target.y,
            this.target.z
        );

        this.lookAtTarget();
        this.emitChanged();
    }

    top() {
        const distance =
            this.camera.position.distanceTo(
                this.target
            );

        this.camera.position.set(
            this.target.x,
            this.target.y +
                Math.max(
                    distance,
                    1
                ),
            this.target.z
        );

        this.lookAtTarget();
        this.emitChanged();
    }

    bottom() {
        const distance =
            this.camera.position.distanceTo(
                this.target
            );

        this.camera.position.set(
            this.target.x,
            this.target.y -
                Math.max(
                    distance,
                    1
                ),
            this.target.z
        );

        this.lookAtTarget();
        this.emitChanged();
    }

    setFov(
        fov
    ) {
        this.fov =
            THREE.MathUtils.clamp(
                Number(fov) ||
                    45,
                1,
                179
            );

        if (
            this.camera
                .isPerspectiveCamera
        ) {
            this.camera.fov =
                this.fov;

            this.camera.updateProjectionMatrix();
        }

        this.emitChanged();
    }

    setClipPlanes(
        near,
        far
    ) {
        this.near =
            Math.max(
                0.0001,
                Number(near) ||
                    0.01
            );

        this.far =
            Math.max(
                this.near + 1,
                Number(far) ||
                    5000
            );

        this.updateProjection();
        this.emitChanged();
    }

    getState() {
        return {
            mode: this.mode,

            position: {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z,
            },

            target: {
                x: this.target.x,
                y: this.target.y,
                z: this.target.z,
            },

            fov: this.fov,

            near: this.near,

            far: this.far,

            orthoSize:
                this.orthoSize,
        };
    }

    setState(
        state = {}
    ) {
        if (
            state.mode
        ) {
            this.setMode(
                state.mode
            );
        }

        if (
            state.position
        ) {
            this.camera.position.set(
                Number(
                    state.position
                        .x
                ) || 0,
                Number(
                    state.position
                        .y
                ) || 0,
                Number(
                    state.position
                        .z
                ) || 0
            );
        }

        if (
            state.target
        ) {
            this.target.set(
                Number(
                    state.target.x
                ) || 0,
                Number(
                    state.target.y
                ) || 0,
                Number(
                    state.target.z
                ) || 0
            );
        }

        if (
            Number.isFinite(
                state.fov
            )
        ) {
            this.fov =
                state.fov;
        }

        if (
            Number.isFinite(
                state.near
            )
        ) {
            this.near =
                state.near;
        }

        if (
            Number.isFinite(
                state.far
            )
        ) {
            this.far =
                state.far;
        }

        if (
            Number.isFinite(
                state.orthoSize
            )
        ) {
            this.orthoSize =
                state.orthoSize;
        }

        this.updateProjection();
        this.lookAtTarget();
        this.emitChanged();
    }

    on(
        event,
        callback
    ) {
        if (
            !this.listeners[
                event
            ] ||
            typeof callback !==
                "function"
        ) {
            return () => {};
        }

        this.listeners[
            event
        ].push(
            callback
        );

        return () =>
            this.off(
                event,
                callback
            );
    }

    off(
        event,
        callback
    ) {
        const listeners =
            this.listeners[
                event
            ];

        if (!listeners) {
            return;
        }

        const index =
            listeners.indexOf(
                callback
            );

        if (
            index !== -1
        ) {
            listeners.splice(
                index,
                1
            );
        }
    }

    emitChanged() {
        this.listeners.changed
            .slice()
            .forEach(
                (callback) => {
                    try {
                        callback(
                            this.getState()
                        );
                    } catch (
                        error
                    ) {
                        console.error(
                            "Camera change listener error:",
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.listeners.changed =
            [];
    }
}
