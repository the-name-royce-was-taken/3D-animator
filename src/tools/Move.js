import * as THREE from "three";

/**
 * Move / Translate tool.
 *
 * Handles:
 * - Selecting an object
 * - Moving objects with keyboard input
 * - Moving objects programmatically
 * - World/local movement
 * - Grid snapping
 * - Undo integration
 * - Pointer dragging
 */
export default class MoveTool {
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
                : 0.25;

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

        this.dragPlane =
            new THREE.Plane();

        this.dragOffset =
            new THREE.Vector3();

        this.startPosition =
            new THREE.Vector3();

        this.currentPosition =
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
        if (
            this.renderer
        ) {
            this.detachEvents();
        }

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

    move(
        object,
        delta,
        options = {}
    ) {
        if (
            !object ||
            !delta
        ) {
            return false;
        }

        const vector =
            this.toVector3(
                delta
            );

        const previous =
            object.position.clone();

        if (
            options.axis
        ) {
            this.applyAxisConstraint(
                vector,
                options.axis
            );
        } else if (
            this.axis
        ) {
            this.applyAxisConstraint(
                vector,
                this.axis
            );
        }

        if (
            options.world ===
            true
        ) {
            object.position.add(
                vector
            );
        } else if (
            this.space ===
            "local"
        ) {
            const localDelta =
                vector.clone();

            localDelta.applyQuaternion(
                object.quaternion
            );

            object.position.add(
                localDelta
            );
        } else {
            object.position.add(
                vector
            );
        }

        if (
            options.snap !==
            false &&
            this.snapEnabled
        ) {
            this.snapPosition(
                object,
                options.snapSize
            );
        }

        object.updateMatrixWorld(
            true
        );

        const current =
            object.position.clone();

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
                    "Move"
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

    moveTo(
        object,
        position,
        options = {}
    ) {
        if (
            !object ||
            !position
        ) {
            return false;
        }

        const target =
            this.toVector3(
                position
            );

        const previous =
            object.position.clone();

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

        if (
            options.axis
        ) {
            if (
                options.axis ===
                "x"
            ) {
                target.y =
                    previous.y;

                target.z =
                    previous.z;
            }

            if (
                options.axis ===
                "y"
            ) {
                target.x =
                    previous.x;

                target.z =
                    previous.z;
            }

            if (
                options.axis ===
                "z"
            ) {
                target.x =
                    previous.x;

                target.y =
                    previous.y;
            }
        }

        object.position.copy(
            target
        );

        object.updateMatrixWorld(
            true
        );

        if (
            !previous.equals(
                target
            )
        ) {
            this.recordUndo(
                object,
                previous,
                target,
                options.name ||
                    "Move"
            );

            this.emit(
                "change",
                {
                    object,
                    previous,
                    current:
                        target.clone(),
                }
            );
        }

        return true;
    }

    moveSelected(
        delta,
        options = {}
    ) {
        const object =
            this.getSelectedObject();

        if (
            !object
        ) {
            return false;
        }

        return this.move(
            object,
            delta,
            options
        );
    }

    moveX(
        amount,
        options = {}
    ) {
        return this.moveSelected(
            new THREE.Vector3(
                amount,
                0,
                0
            ),
            {
                ...options,
                axis: "x",
            }
        );
    }

    moveY(
        amount,
        options = {}
    ) {
        return this.moveSelected(
            new THREE.Vector3(
                0,
                amount,
                0
            ),
            {
                ...options,
                axis: "y",
            }
        );
    }

    moveZ(
        amount,
        options = {}
    ) {
        return this.moveSelected(
            new THREE.Vector3(
                0,
                0,
                amount
            ),
            {
                ...options,
                axis: "z",
            }
        );
    }

    startDrag(
        object,
        pointer
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

        this.dragging =
            true;

        this.dragStart.copy(
            pointer
        );

        this.startPosition.copy(
            object.position
        );

        this.currentPosition.copy(
            object.position
        );

        this.setupDragPlane(
            object
        );

        this.emit(
            "start",
            {
                object,
                position:
                    object.position.clone(),
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

        this.updatePointer(
            pointer
        );

        const ray =
            this.raycaster.ray;

        const hit =
            new THREE.Vector3();

        if (
            !this.dragPlane.intersectLine(
                ray,
                hit
            )
        ) {
            return false;
        }

        const target =
            hit.sub(
                this.dragOffset
            );

        const position =
            target.clone();

        this.applyAxisToPosition(
            position,
            this.startPosition,
            this.axis
        );

        if (
            this.snapEnabled
        ) {
            this.snapVector(
                position
            );
        }

        this.activeObject.position.copy(
            position
        );

        this.activeObject.updateMatrixWorld(
            true
        );

        this.currentPosition.copy(
            position
        );

        this.emit(
            "move",
            {
                object:
                    this.activeObject,

                position:
                    position.clone(),
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
            this.startPosition.clone();

        const after =
            object.position.clone();

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
                    "Move"
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
            object.position.copy(
                this.startPosition
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

    setupDragPlane(
        object
    ) {
        const normal =
            new THREE.Vector3();

        if (
            this.axis ===
            "x"
        ) {
            normal.set(
                0,
                0,
                1
            );
        } else if (
            this.axis ===
            "y"
        ) {
            normal.set(
                0,
                0,
                1
            );
        } else if (
            this.axis ===
            "z"
        ) {
            normal.set(
                0,
                1,
                0
            );
        } else {
            this.camera.getWorldDirection(
                normal
            );
        }

        this.dragPlane.setFromNormalAndCoplanarPoint(
            normal,
            object.position
        );

        const ray =
            this.getPointerRay(
                this.dragStart
            );

        const hit =
            new THREE.Vector3();

        if (
            ray &&
            this.dragPlane.intersectLine(
                ray,
                hit
            )
        ) {
            this.dragOffset.copy(
                hit
            ).sub(
                object.position
            );
        } else {
            this.dragOffset.set(
                0,
                0,
                0
            );
        }
    }

    snapPosition(
        object,
        size = this.snapSize
    ) {
        if (
            !object
        ) {
            return false;
        }

        const value =
            Number.isFinite(
                size
            ) &&
            size > 0
                ? size
                : this.snapSize;

        this.snapVector(
            object.position,
            value
        );

        object.updateMatrixWorld(
            true
        );

        return true;
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

        const value =
            Number.isFinite(
                size
            ) &&
            size > 0
                ? size
                : this.snapSize;

        vector.x =
            Math.round(
                vector.x /
                    value
            ) *
            value;

        vector.y =
            Math.round(
                vector.y /
                    value
            ) *
            value;

        vector.z =
            Math.round(
                vector.z /
                    value
            ) *
            value;

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
                0;

            vector.z =
                0;
        }

        if (
            axis ===
            "y"
        ) {
            vector.x =
                0;

            vector.z =
                0;
        }

        if (
            axis ===
            "z"
        ) {
            vector.x =
                0;

            vector.y =
                0;
        }

        return vector;
    }

    applyAxisToPosition(
        position,
        start,
        axis
    ) {
        if (
            !axis ||
            !start
        ) {
            return position;
        }

        if (
            axis ===
            "x"
        ) {
            position.y =
                start.y;

            position.z =
                start.z;
        }

        if (
            axis ===
            "y"
        ) {
            position.x =
                start.x;

            position.z =
                start.z;
        }

        if (
            axis ===
            "z"
        ) {
            position.x =
                start.x;

            position.y =
                start.y;
        }

        return position;
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
                        before.clone(),

                    quaternion:
                        object.quaternion.clone(),

                    scale:
                        object.scale.clone(),
                },
                {
                    position:
                        after.clone(),

                    quaternion:
                        object.quaternion.clone(),

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

    getPointerRay(
        pointer
    ) {
        if (
            !this.camera
        ) {
            return null;
        }

        this.updatePointer(
            pointer
        );

        this.raycaster.setFromCamera(
            this.pointer,
            this.camera
        );

        return this.raycaster.ray;
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

        this.updatePointer(
            pointer
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
            !this.renderer ||
            !this.renderer.domElement
        ) {
            return;
        }

        const element =
            this.renderer.domElement;

        element.addEventListener(
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
                            `Move tool event error (${event}):`,
                            error
                        );
                    }
                }
            );
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

        return new THREE.Vector3();
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
