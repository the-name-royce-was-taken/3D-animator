import * as THREE from "three";

/**
 * Rotate / Rotation tool.
 *
 * Handles:
 * - Object rotation
 * - World/local rotation
 * - X/Y/Z axis constraints
 * - Angle snapping
 * - Pointer dragging
 * - Keyboard rotation
 * - Undo integration
 * - Change events
 */
export default class RotateTool {
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

        this.snapAngle =
            Number.isFinite(
                options.snapAngle
            )
                ? options.snapAngle
                : THREE.MathUtils.degToRad(
                      15
                  );

        this.space =
            options.space ===
            "local"
                ? "local"
                : "world";

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

        this.startQuaternion =
            new THREE.Quaternion();

        this.startEuler =
            new THREE.Euler();

        this.startRotation =
            new THREE.Euler();

        this.dragCenter =
            new THREE.Vector3();

        this.dragStartVector =
            new THREE.Vector3();

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

    setSpace(
        space
    ) {
        this.space =
            space ===
            "local"
                ? "local"
                : "world";

        return this;
    }

    setSnap(
        enabled,
        angle = this.snapAngle
    ) {
        this.snapEnabled =
            Boolean(
                enabled
            );

        if (
            Number.isFinite(
                angle
            ) &&
            angle > 0
        ) {
            this.snapAngle =
                angle;
        }

        return this;
    }

    setSnapDegrees(
        enabled,
        degrees
    ) {
        this.snapEnabled =
            Boolean(
                enabled
            );

        if (
            Number.isFinite(
                degrees
            ) &&
            degrees > 0
        ) {
            this.snapAngle =
                THREE.MathUtils.degToRad(
                    degrees
                );
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

    rotate(
        object,
        rotation,
        options = {}
    ) {
        if (
            !object ||
            !rotation
        ) {
            return false;
        }

        const previous =
            object.quaternion.clone();

        const euler =
            this.toEuler(
                rotation
            );

        const axis =
            options.axis ||
            this.axis;

        if (
            axis
        ) {
            this.applyAxisConstraint(
                euler,
                axis
            );
        }

        if (
            options.snap !==
                false &&
            this.snapEnabled
        ) {
            this.snapEuler(
                euler,
                options.snapAngle
            );
        }

        const deltaQuaternion =
            new THREE.Quaternion()
                .setFromEuler(
                    euler
                );

        if (
            options.absolute
        ) {
            object.quaternion.copy(
                deltaQuaternion
            );
        } else if (
            this.space ===
            "local" &&
            options.world !==
                true
        ) {
            object.quaternion.multiply(
                deltaQuaternion
            );
        } else {
            object.quaternion.premultiply(
                deltaQuaternion
            );
        }

        object.rotation.setFromQuaternion(
            object.quaternion
        );

        object.updateMatrixWorld(
            true
        );

        const current =
            object.quaternion.clone();

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
                    "Rotate"
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

    rotateTo(
        object,
        rotation,
        options = {}
    ) {
        if (
            !object ||
            !rotation
        ) {
            return false;
        }

        const previous =
            object.quaternion.clone();

        const euler =
            this.toEuler(
                rotation
            );

        const axis =
            options.axis ||
            this.axis;

        if (
            axis
        ) {
            const current =
                object.rotation;

            if (
                axis ===
                "x"
            ) {
                euler.y =
                    current.y;

                euler.z =
                    current.z;
            }

            if (
                axis ===
                "y"
            ) {
                euler.x =
                    current.x;

                euler.z =
                    current.z;
            }

            if (
                axis ===
                "z"
            ) {
                euler.x =
                    current.x;

                euler.y =
                    current.y;
            }
        }

        if (
            options.snap !==
                false &&
            this.snapEnabled
        ) {
            this.snapEuler(
                euler,
                options.snapAngle
            );
        }

        object.rotation.copy(
            euler
        );

        object.updateMatrixWorld(
            true
        );

        const current =
            object.quaternion.clone();

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
                    "Rotate"
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

    rotateSelected(
        rotation,
        options = {}
    ) {
        const object =
            this.getSelectedObject();

        if (
            !object
        ) {
            return false;
        }

        return this.rotate(
            object,
            rotation,
            options
        );
    }

    rotateX(
        degrees,
        options = {}
    ) {
        return this.rotateSelected(
            new THREE.Euler(
                THREE.MathUtils.degToRad(
                    degrees
                ),
                0,
                0
            ),
            {
                ...options,
                axis: "x",
            }
        );
    }

    rotateY(
        degrees,
        options = {}
    ) {
        return this.rotateSelected(
            new THREE.Euler(
                0,
                THREE.MathUtils.degToRad(
                    degrees
                ),
                0
            ),
            {
                ...options,
                axis: "y",
            }
        );
    }

    rotateZ(
        degrees,
        options = {}
    ) {
        return this.rotateSelected(
            new THREE.Euler(
                0,
                0,
                THREE.MathUtils.degToRad(
                    degrees
                )
            ),
            {
                ...options,
                axis: "z",
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

        this.startQuaternion.copy(
            object.quaternion
        );

        this.startEuler.copy(
            object.rotation
        );

        this.startRotation.copy(
            object.rotation
        );

        this.dragCenter.copy(
            object.getWorldPosition(
                new THREE.Vector3()
            )
        );

        this.dragStartVector =
            this.getScreenDirection(
                pointer,
                this.dragCenter
            );

        this.emit(
            "start",
            {
                object,
                rotation:
                    object.rotation.clone(),
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

        const angle =
            this.calculateDragAngle(
                pointer
            );

        const rotation =
            this.startEuler.clone();

        if (
            this.axis ===
            "x"
        ) {
            rotation.x +=
                angle;
        } else if (
            this.axis ===
            "y"
        ) {
            rotation.y +=
                angle;
        } else if (
            this.axis ===
            "z"
        ) {
            rotation.z +=
                angle;
        } else {
            rotation.y +=
                angle;
        }

        if (
            this.snapEnabled
        ) {
            this.snapEuler(
                rotation
            );
        }

        this.activeObject.rotation.copy(
            rotation
        );

        this.activeObject.updateMatrixWorld(
            true
        );

        this.emit(
            "move",
            {
                object:
                    this.activeObject,

                rotation:
                    rotation.clone(),

                angle,
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
            this.startQuaternion.clone();

        const after =
            object.quaternion.clone();

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
                    "Rotate"
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
            object.quaternion.copy(
                this.startQuaternion
            );

            object.rotation.setFromQuaternion(
                object.quaternion
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

    calculateDragAngle(
        pointer
    ) {
        if (
            !this.camera
        ) {
            return 0;
        }

        const currentVector =
            this.getScreenDirection(
                pointer,
                this.dragCenter
            );

        if (
            currentVector.lengthSq() ===
            0 ||
            this.dragStartVector.lengthSq() ===
                0
        ) {
            return 0;
        }

        const a =
            this.dragStartVector.clone()
                .normalize();

        const b =
            currentVector.clone()
                .normalize();

        const dot =
            THREE.MathUtils.clamp(
                a.dot(
                    b
                ),
                -1,
                1
            );

        let angle =
            Math.acos(
                dot
            );

        const cross =
            a.cross(
                b
            );

        if (
            cross.z <
            0
        ) {
            angle =
                -angle;
        }

        return angle;
    }

    getScreenDirection(
        pointer,
        worldPosition
    ) {
        if (
            !this.camera
        ) {
            return new THREE.Vector3(
                1,
                0,
                0
            );
        }

        const projected =
            worldPosition.clone()
                .project(
                    this.camera
                );

        const dx =
            pointer.x -
            projected.x;

        const dy =
            pointer.y -
            projected.y;

        return new THREE.Vector3(
            dx,
            dy,
            0
        );
    }

    snapEuler(
        euler,
        angle = this.snapAngle
    ) {
        const step =
            Number.isFinite(
                angle
            ) &&
            angle > 0
                ? angle
                : this.snapAngle;

        euler.x =
            Math.round(
                euler.x /
                    step
            ) *
            step;

        euler.y =
            Math.round(
                euler.y /
                    step
            ) *
            step;

        euler.z =
            Math.round(
                euler.z /
                    step
            ) *
            step;

        return euler;
    }

    applyAxisConstraint(
        euler,
        axis
    ) {
        if (
            axis ===
            "x"
        ) {
            euler.y =
                0;

            euler.z =
                0;
        }

        if (
            axis ===
            "y"
        ) {
            euler.x =
                0;

            euler.z =
                0;
        }

        if (
            axis ===
            "z"
        ) {
            euler.x =
                0;

            euler.y =
                0;
        }

        return euler;
    }

    toEuler(
        value
    ) {
        if (
            value instanceof
            THREE.Euler
        ) {
            return value.clone();
        }

        if (
            value instanceof
            THREE.Quaternion
        ) {
            return new THREE.Euler()
                .setFromQuaternion(
                    value
                );
        }

        if (
            Array.isArray(
                value
            )
        ) {
            return new THREE.Euler(
                Number(
                    value[0] || 0
                ),
                Number(
                    value[1] || 0
                ),
                Number(
                    value[2] || 0
                )
            );
        }

        if (
            value &&
            typeof value.x ===
                "number" &&
            typeof value.y ===
                "number" &&
            typeof value.z ===
                "number"
        ) {
            return new THREE.Euler(
                value.x,
                value.y,
                value.z,
                value.order ||
                    "XYZ"
            );
        }

        return new THREE.Euler();
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
                        before.clone(),

                    scale:
                        object.scale.clone(),
                },
                {
                    position:
                        object.position.clone(),

                    quaternion:
                        after.clone(),

                    scale:
                        object.scale.clone(),
                },
                name
            );
        }
    }

    updatePointer(
        pointer
    ) {
        if (
            pointer instanceof
            THREE.Vector2
        ) {
            this.pointer.copy(
                pointer
            );
        } else if (
            pointer &&
            Number.isFinite(
                pointer.x
            ) &&
            Number.isFinite(
                pointer.y
            )
        ) {
            this.pointer.set(
                pointer.x,
                pointer.y
            );
        }

        return this.pointer;
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
                            `Rotate tool event error (${event}):`,
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
