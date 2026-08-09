import * as THREE from "three";

/**
 * Scale / Resize tool.
 *
 * Handles:
 * - Object scaling
 * - Uniform scaling
 * - X/Y/Z axis constraints
 * - Scale snapping
 * - Pointer dragging
 * - Keyboard scaling
 * - Undo integration
 * - Change events
 */
export default class ScaleTool {
    constructor(options = {}) {
        this.scene =
            options.scene || null;

        this.camera =
            options.camera || null;

        this.renderer =
            options.renderer || null;

        this.selection =
            options.selection || null;

        this.undo =
            options.undo || null;

        this.enabled =
            options.enabled !== false;

        this.snapEnabled =
            options.snapEnabled !== false;

        this.snapSize =
            Number.isFinite(
                options.snapSize
            )
                ? options.snapSize
                : 0.1;

        this.uniform =
            options.uniform !== false;

        this.axis =
            null;

        this.activeObject =
            null;

        this.dragging =
            false;

        this.dragStart =
            new THREE.Vector2();

        this.dragCurrent =
            new THREE.Vector2();

        this.startScale =
            new THREE.Vector3(
                1,
                1,
                1
            );

        this.currentScale =
            new THREE.Vector3(
                1,
                1,
                1
            );

        this.dragCenter =
            new THREE.Vector3();

        this.dragStartDistance =
            0;

        this.raycaster =
            new THREE.Raycaster();

        this.pointer =
            new THREE.Vector2();

        this.listeners = {
            start: [],
            move: [],
            end: [],
            change: [],
        };

        this._boundPointerDown =
            this.onPointerDown.bind(
                this
            );

        this._boundPointerMove =
            this.onPointerMove.bind(
                this
            );

        this._boundPointerUp =
            this.onPointerUp.bind(
                this
            );

        this.attachEvents();
    }

    setScene(
        scene
    ) {
        this.scene =
            scene || null;

        return this;
    }

    setCamera(
        camera
    ) {
        this.camera =
            camera || null;

        return this;
    }

    setRenderer(
        renderer
    ) {
        this.detachEvents();

        this.renderer =
            renderer || null;

        this.attachEvents();

        return this;
    }

    setSelection(
        selection
    ) {
        this.selection =
            selection || null;

        return this;
    }

    setUndo(
        undo
    ) {
        this.undo =
            undo || null;

        return this;
    }

    setEnabled(
        enabled
    ) {
        this.enabled =
            Boolean(
                enabled
            );

        if (
            !this.enabled
        ) {
            this.cancelDrag();
        }

        return this;
    }

    setUniform(
        uniform
    ) {
        this.uniform =
            Boolean(
                uniform
            );

        return this;
    }

    toggleUniform() {
        this.uniform =
            !this.uniform;

        return this.uniform;
    }

    setSnap(
        enabled,
        size = this.snapSize
    ) {
        this.snapEnabled =
            Boolean(
                enabled
            );

        if (
            Number.isFinite(
                size
            ) &&
            size > 0
        ) {
            this.snapSize =
                size;
        }

        return this;
    }

    setAxis(
        axis
    ) {
        if (
            axis ===
                "x" ||
            axis ===
                "y" ||
            axis ===
                "z"
        ) {
            this.axis =
                axis;
        } else {
            this.axis =
                null;
        }

        return this;
    }

    toggleAxis(
        axis
    ) {
        if (
            this.axis ===
            axis
        ) {
            this.axis =
                null;
        } else {
            this.setAxis(
                axis
            );
        }

        return this;
    }

    getSelectedObject() {
        if (
            this.activeObject
        ) {
            return this.activeObject;
        }

        if (
            !this.selection
        ) {
            return null;
        }

        if (
            typeof this.selection.getSelectedObject ===
            "function"
        ) {
            return this.selection.getSelectedObject();
        }

        if (
            typeof this.selection.getSelected ===
            "function"
        ) {
            return this.selection.getSelected();
        }

        if (
            this.selection.object
        ) {
            return this.selection.object;
        }

        return null;
    }

    selectObject(
        object
    ) {
        this.activeObject =
            object || null;

        if (
            this.selection &&
            typeof this.selection.select ===
                "function"
        ) {
            this.selection.select(
                object
            );
        }

        return this.activeObject;
    }

    scale(
        object,
        scale,
        options = {}
    ) {
        if (
            !object ||
            !scale
        ) {
            return false;
        }

        const previous =
            object.scale.clone();

        const factor =
            this.toVector3(
                scale
            );

        const axis =
            options.axis ||
            this.axis;

        const uniform =
            options.uniform !==
            undefined
                ? Boolean(
                      options.uniform
                  )
                : this.uniform;

        if (
            uniform
        ) {
            const value =
                factor.x;

            factor.set(
                value,
                value,
                value
            );
        }

        if (
            axis
        ) {
            this.applyAxisConstraint(
                factor,
                axis
            );
        }

        if (
            options.absolute
        ) {
            object.scale.copy(
                factor
            );
        } else {
            object.scale.x *=
                factor.x;

            object.scale.y *=
                factor.y;

            object.scale.z *=
                factor.z;
        }

        this.clampScale(
            object.scale
        );

        if (
            options.snap !==
                false &&
            this.snapEnabled
        ) {
            this.snapVector(
                object.scale,
                options.snapSize
            );

            this.clampScale(
                object.scale
            );
        }

        object.updateMatrixWorld(
            true
        );

        const current =
            object.scale.clone();

        if (
            !previous.equals(
                current
            )
        ) {
            this.recordUndo(
                object,
                previous,
                current,
                options.name ||
                    "Scale"
            );

            this.emit(
                "change",
                {
                    object,
                    previous,
                    current,
                }
            );
        }

        return true;
    }

    scaleTo(
        object,
        scale,
        options = {}
    ) {
        if (
            !object ||
            !scale
        ) {
            return false;
        }

        const previous =
            object.scale.clone();

        const target =
            this.toVector3(
                scale
            );

        const uniform =
            options.uniform !==
            undefined
                ? Boolean(
                      options.uniform
                  )
                : this.uniform;

        if (
            uniform
        ) {
            const value =
                target.x;

            target.set(
                value,
                value,
                value
            );
        }

        const axis =
            options.axis ||
            this.axis;

        if (
            axis ===
            "x"
        ) {
            target.y =
                previous.y;

            target.z =
                previous.z;
        }

        if (
            axis ===
            "y"
        ) {
            target.x =
                previous.x;

            target.z =
                previous.z;
        }

        if (
            axis ===
            "z"
        ) {
            target.x =
                previous.x;

            target.y =
                previous.y;
        }

        if (
            options.snap !==
                false &&
            this.snapEnabled
        ) {
            this.snapVector(
                target,
                options.snapSize
            );
        }

        this.clampScale(
            target
        );

        object.scale.copy(
            target
        );

        object.updateMatrixWorld(
            true
        );

        const current =
            object.scale.clone();

        if (
            !previous.equals(
                current
            )
        ) {
            this.recordUndo(
                object,
                previous,
                current,
                options.name ||
                    "Scale"
            );

            this.emit(
                "change",
                {
                    object,
                    previous,
                    current,
                }
            );
        }

        return true;
    }

    scaleSelected(
        scale,
        options = {}
    ) {
        const object =
            this.getSelectedObject();

        if (
            !object
        ) {
            return false;
        }

        return this.scale(
            object,
            scale,
            options
        );
    }

    scaleUniform(
        factor,
        options = {}
    ) {
        return this.scaleSelected(
            new THREE.Vector3(
                factor,
                factor,
                factor
            ),
            {
                ...options,
                uniform: true,
            }
        );
    }

    scaleX(
        factor,
        options = {}
    ) {
        return this.scaleSelected(
            new THREE.Vector3(
                factor,
                1,
                1
            ),
            {
                ...options,
                axis: "x",
                uniform: false,
            }
        );
    }

    scaleY(
        factor,
        options = {}
    ) {
        return this.scaleSelected(
            new THREE.Vector3(
                1,
                factor,
                1
            ),
            {
                ...options,
                axis: "y",
                uniform: false,
            }
        );
    }

    scaleZ(
        factor,
        options = {}
    ) {
        return this.scaleSelected(
            new THREE.Vector3(
                1,
                1,
                factor
            ),
            {
                ...options,
                axis: "z",
                uniform: false,
            }
        );
    }

    startDrag(
        object,
        pointer,
        axis = this.axis
    ) {
        if (
            !this.enabled ||
            !object ||
            !this.camera
        ) {
            return false;
        }

        this.activeObject =
            object;

        this.axis =
            axis || null;

        this.dragging =
            true;

        this.dragStart.copy(
            pointer
        );

        this.dragCurrent.copy(
            pointer
        );

        this.startScale.copy(
            object.scale
        );

        this.currentScale.copy(
            object.scale
        );

        this.dragCenter.copy(
            object.getWorldPosition(
                new THREE.Vector3()
            )
        );

        this.dragStartDistance =
            this.getPointerDistanceFromCenter(
                pointer
            );

        this.emit(
            "start",
            {
                object,
                scale:
                    object.scale.clone(),
                axis:
                    this.axis,
            }
        );

        return true;
    }

    updateDrag(
        pointer
    ) {
        if (
            !this.dragging ||
            !this.activeObject
        ) {
            return false;
        }

        this.dragCurrent.copy(
            pointer
        );

        const currentDistance =
            this.getPointerDistanceFromCenter(
                pointer
            );

        let ratio =
            1;

        if (
            this.dragStartDistance >
            0.000001
        ) {
            ratio =
                currentDistance /
                this.dragStartDistance;
        }

        ratio =
            THREE.MathUtils.clamp(
                ratio,
                0.01,
                100
            );

        const target =
            this.startScale.clone();

        if (
            this.uniform ||
            !this.axis
        ) {
            target.multiplyScalar(
                ratio
            );
        } else if (
            this.axis ===
            "x"
        ) {
            target.x =
                this.startScale.x *
                ratio;
        } else if (
            this.axis ===
            "y"
        ) {
            target.y =
                this.startScale.y *
                ratio;
        } else if (
            this.axis ===
            "z"
        ) {
            target.z =
                this.startScale.z *
                ratio;
        }

        if (
            this.snapEnabled
        ) {
            this.snapVector(
                target
            );
        }

        this.clampScale(
            target
        );

        this.activeObject.scale.copy(
            target
        );

        this.activeObject.updateMatrixWorld(
            true
        );

        this.currentScale.copy(
            target
        );

        this.emit(
            "move",
            {
                object:
                    this.activeObject,

                scale:
                    target.clone(),

                ratio,
            }
        );

        return true;
    }

    endDrag(
        options = {}
    ) {
        if (
            !this.dragging
        ) {
            return false;
        }

        const object =
            this.activeObject;

        const before =
            this.startScale.clone();

        const after =
            object.scale.clone();

        this.dragging =
            false;

        if (
            object &&
            !before.equals(
                after
            )
        ) {
            this.recordUndo(
                object,
                before,
                after,
                options.name ||
                    "Scale"
            );
        }

        this.emit(
            "end",
            {
                object,
                before,
                after,
            }
        );

        return true;
    }

    cancelDrag() {
        if (
            !this.dragging
        ) {
            return false;
        }

        const object =
            this.activeObject;

        if (
            object
        ) {
            object.scale.copy(
                this.startScale
            );

            object.updateMatrixWorld(
                true
            );
        }

        this.dragging =
            false;

        this.emit(
            "end",
            {
                object,
                cancelled:
                    true,
            }
        );

        return true;
    }

    getPointerDistanceFromCenter(
        pointer
    ) {
        if (
            !this.camera
        ) {
            return 0;
        }

        const projected =
            this.dragCenter.clone()
                .project(
                    this.camera
                );

        const dx =
            pointer.x -
            projected.x;

        const dy =
            pointer.y -
            projected.y;

        return Math.sqrt(
            dx * dx +
                dy * dy
        );
    }

    snapVector(
        vector,
        size = this.snapSize
    ) {
        if (
            !vector
        ) {
            return vector;
        }

        const step =
            Number.isFinite(
                size
            ) &&
            size > 0
                ? size
                : this.snapSize;

        vector.x =
            Math.round(
                vector.x /
                    step
            ) *
            step;

        vector.y =
            Math.round(
                vector.y /
                    step
            ) *
            step;

        vector.z =
            Math.round(
                vector.z /
                    step
            ) *
            step;

        return vector;
    }

    applyAxisConstraint(
        vector,
        axis
    ) {
        if (
            axis ===
            "x"
        ) {
            vector.y =
                1;

            vector.z =
                1;
        }

        if (
            axis ===
            "y"
        ) {
            vector.x =
                1;

            vector.z =
                1;
        }

        if (
            axis ===
            "z"
        ) {
            vector.x =
                1;

            vector.y =
                1;
        }

        return vector;
    }

    clampScale(
        scale
    ) {
        const minimum =
            0.001;

        scale.x =
            Math.max(
                minimum,
                scale.x
            );

        scale.y =
            Math.max(
                minimum,
                scale.y
            );

        scale.z =
            Math.max(
                minimum,
                scale.z
            );

        return scale;
    }

    toVector3(
        value
    ) {
        if (
            value instanceof
            THREE.Vector3
        ) {
            return value.clone();
        }

        if (
            Array.isArray(
                value
            )
        ) {
            return new THREE.Vector3(
                Number(
                    value[0] ?? 1
                ),
                Number(
                    value[1] ?? 1
                ),
                Number(
                    value[2] ?? 1
                )
            );
        }

        if (
            value &&
            Number.isFinite(
                value.x
            ) &&
            Number.isFinite(
                value.y
            ) &&
            Number.isFinite(
                value.z
            )
        ) {
            return new THREE.Vector3(
                value.x,
                value.y,
                value.z
            );
        }

        return new THREE.Vector3(
            1,
            1,
            1
        );
    }

    recordUndo(
        object,
        before,
        after,
        name
    ) {
        if (
            !this.undo
        ) {
            return;
        }

        if (
            typeof this.undo.recordTransform ===
            "function"
        ) {
            this.undo.recordTransform(
                object,
                {
                    position:
                        object.position.clone(),

                    quaternion:
                        object.quaternion.clone(),

                    scale:
                        before.clone(),
                },
                {
                    position:
                        object.position.clone(),

                    quaternion:
                        object.quaternion.clone(),

                    scale:
                        after.clone(),
                },
                name
            );
        }
    }

    onPointerDown(
        event
    ) {
        if (
            !this.enabled ||
            !this.renderer ||
            !this.camera
        ) {
            return;
        }

        const rect =
            this.renderer.domElement.getBoundingClientRect();

        const pointer =
            new THREE.Vector2(
                (
                    event.clientX -
                    rect.left
                ) /
                    rect.width *
                    2 -
                    1,

                -(
                    (
                        event.clientY -
                        rect.top
                    ) /
                        rect.height
                ) *
                    2 +
                    1
            );

        const ray =
            this.getPointerRay(
                pointer
            );

        if (
            !ray
        ) {
            return;
        }

        const object =
            this.getIntersectedObject(
                ray
            );

        if (
            !object
        ) {
            return;
        }

        this.selectObject(
            object
        );

        this.startDrag(
            object,
            pointer
        );
    }

    onPointerMove(
        event
    ) {
        if (
            !this.dragging ||
            !this.renderer
        ) {
            return;
        }

        const rect =
            this.renderer.domElement.getBoundingClientRect();

        const pointer =
            new THREE.Vector2(
                (
                    event.clientX -
                    rect.left
                ) /
                    rect.width *
                    2 -
                    1,

                -(
                    (
                        event.clientY -
                        rect.top
                    ) /
                        rect.height
                ) *
                    2 +
                    1
            );

        this.updateDrag(
            pointer
        );
    }

    onPointerUp() {
        if (
            this.dragging
        ) {
            this.endDrag();
        }
    }

    getPointerRay(
        pointer
    ) {
        if (
            !this.camera
        ) {
            return null;
        }

        this.raycaster.setFromCamera(
            pointer,
            this.camera
        );

        return this.raycaster.ray;
    }

    getIntersectedObject(
        ray
    ) {
        if (
            !this.scene
        ) {
            return null;
        }

        this.raycaster.ray.copy(
            ray
        );

        const objects =
            [];

        this.scene.traverse(
            (object) => {
                if (
                    object.visible &&
                    object.isMesh
                ) {
                    objects.push(
                        object
                    );
                }
            }
        );

        const hits =
            this.raycaster.intersectObjects(
                objects,
                true
            );

        if (
            hits.length ===
            0
        ) {
            return null;
        }

        return (
            hits[0].object ||
            null
        );
    }

    attachEvents() {
        if (
            !this.renderer?.domElement
        ) {
            return;
        }

        this.renderer.domElement.addEventListener(
            "pointerdown",
            this._boundPointerDown
        );

        window.addEventListener(
            "pointermove",
            this._boundPointerMove
        );

        window.addEventListener(
            "pointerup",
            this._boundPointerUp
        );
    }

    detachEvents() {
        if (
            this.renderer?.domElement
        ) {
            this.renderer.domElement.removeEventListener(
                "pointerdown",
                this._boundPointerDown
            );
        }

        window.removeEventListener(
            "pointermove",
            this._boundPointerMove
        );

        window.removeEventListener(
            "pointerup",
            this._boundPointerUp
        );
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

        if (
            !listeners
        ) {
            return;
        }

        const index =
            listeners.indexOf(
                callback
            );

        if (
            index !==
            -1
        ) {
            listeners.splice(
                index,
                1
            );
        }
    }

    emit(
        event,
        data
    ) {
        const listeners =
            this.listeners[
                event
            ];

        if (
            !listeners
        ) {
            return;
        }

        listeners
            .slice()
            .forEach(
                (
                    callback
                ) => {
                    try {
                        callback(
                            data
                        );
                    } catch (
                        error
                    ) {
                        console.error(
                            `Scale tool event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.detachEvents();

        this.cancelDrag();

        this.scene =
            null;

        this.camera =
            null;

        this.renderer =
            null;

        this.selection =
            null;

        this.undo =
            null;

        this.activeObject =
            null;

        this.listeners = {
            start: [],
            move: [],
            end: [],
            change: [],
        };
    }
}
