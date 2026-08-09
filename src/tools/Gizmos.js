import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

/**
 * Transform gizmo manager.
 *
 * Handles:
 * - Move / rotate / scale gizmos
 * - Selecting the active object
 * - Attaching and detaching objects
 * - Axis constraints
 * - World/local transform modes
 * - Gizmo visibility
 * - Change events
 * - Undo callbacks
 *
 * Designed for the JavaScript + Vite + GitHub Pages setup.
 */
export default class Gizmos {
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

        this.visible =
            options.visible !== false;

        this.mode =
            options.mode || "translate";

        this.space =
            options.space || "world";

        this.size =
            Number.isFinite(options.size)
                ? options.size
                : 1;

        this.snapping =
            options.snapping !== false;

        this.translationSnap =
            Number.isFinite(
                options.translationSnap
            )
                ? options.translationSnap
                : 0.1;

        this.rotationSnap =
            Number.isFinite(
                options.rotationSnap
            )
                ? options.rotationSnap
                : THREE.MathUtils.degToRad(15);

        this.scaleSnap =
            Number.isFinite(
                options.scaleSnap
            )
                ? options.scaleSnap
                : 0.1;

        this.controls =
            null;

        this.object =
            null;

        this.dragging =
            false;

        this.beforeTransform =
            null;

        this.listeners = {
            mode: [],
            attach: [],
            detach: [],
            change: [],
            dragging: [],
        };

        this.createControls();
        this.attachEvents();
    }

    createControls() {
        if (
            !this.camera ||
            !this.renderer
        ) {
            return;
        }

        this.controls =
            new TransformControls(
                this.camera,
                this.renderer.domElement
            );

        this.controls.setMode(
            this.mode
        );

        this.controls.setSpace(
            this.space
        );

        this.controls.setSize(
            this.size
        );

        this.controls.visible =
            this.visible;

        this.controls.enabled =
            this.enabled;

        this.updateSnapping();

        if (
            this.scene
        ) {
            this.scene.add(
                this.controls
            );
        }
    }

    setScene(
        scene
    ) {
        if (
            this.scene &&
            this.controls
        ) {
            this.scene.remove(
                this.controls
            );
        }

        this.scene =
            scene || null;

        if (
            this.scene &&
            this.controls
        ) {
            this.scene.add(
                this.controls
            );
        }

        return this;
    }

    setCamera(
        camera
    ) {
        this.camera =
            camera || null;

        this.recreateControls();

        return this;
    }

    setRenderer(
        renderer
    ) {
        this.renderer =
            renderer || null;

        this.recreateControls();

        return this;
    }

    recreateControls() {
        const currentObject =
            this.object;

        const oldControls =
            this.controls;

        if (
            oldControls
        ) {
            this.detachEvents();

            if (
                this.scene
            ) {
                this.scene.remove(
                    oldControls
                );
            }

            oldControls.dispose();
        }

        this.controls =
            null;

        if (
            this.camera &&
            this.renderer
        ) {
            this.createControls();
            this.attachEvents();

            if (
                currentObject
            ) {
                this.attach(
                    currentObject
                );
            }
        }
    }

    setEnabled(
        enabled
    ) {
        this.enabled =
            Boolean(
                enabled
            );

        if (
            this.controls
        ) {
            this.controls.enabled =
                this.enabled;
        }

        return this;
    }

    setVisible(
        visible
    ) {
        this.visible =
            Boolean(
                visible
            );

        if (
            this.controls
        ) {
            this.controls.visible =
                this.visible;
        }

        return this;
    }

    setMode(
        mode
    ) {
        const validModes = [
            "translate",
            "rotate",
            "scale",
        ];

        if (
            !validModes.includes(
                mode
            )
        ) {
            return false;
        }

        this.mode =
            mode;

        if (
            this.controls
        ) {
            this.controls.setMode(
                mode
            );
        }

        this.updateSnapping();

        this.emit(
            "mode",
            mode
        );

        return true;
    }

    getMode() {
        return this.mode;
    }

    setSpace(
        space
    ) {
        if (
            space !==
                "world" &&
            space !==
                "local"
        ) {
            return false;
        }

        this.space =
            space;

        if (
            this.controls
        ) {
            this.controls.setSpace(
                space
            );
        }

        return true;
    }

    toggleSpace() {
        return this.setSpace(
            this.space ===
                "world"
                ? "local"
                : "world"
        );
    }

    setSize(
        size
    ) {
        if (
            !Number.isFinite(
                size
            )
        ) {
            return false;
        }

        this.size =
            Math.max(
                0.1,
                size
            );

        if (
            this.controls
        ) {
            this.controls.setSize(
                this.size
            );
        }

        return true;
    }

    setSnapping(
        enabled
    ) {
        this.snapping =
            Boolean(
                enabled
            );

        this.updateSnapping();

        return this;
    }

    toggleSnapping() {
        return this.setSnapping(
            !this.snapping
        );
    }

    setTranslationSnap(
        value
    ) {
        if (
            Number.isFinite(
                value
            ) &&
            value > 0
        ) {
            this.translationSnap =
                value;

            this.updateSnapping();
        }

        return this;
    }

    setRotationSnapDegrees(
        degrees
    ) {
        if (
            Number.isFinite(
                degrees
            ) &&
            degrees > 0
        ) {
            this.rotationSnap =
                THREE.MathUtils.degToRad(
                    degrees
                );

            this.updateSnapping();
        }

        return this;
    }

    setRotationSnap(
        radians
    ) {
        if (
            Number.isFinite(
                radians
            ) &&
            radians > 0
        ) {
            this.rotationSnap =
                radians;

            this.updateSnapping();
        }

        return this;
    }

    setScaleSnap(
        value
    ) {
        if (
            Number.isFinite(
                value
            ) &&
            value > 0
        ) {
            this.scaleSnap =
                value;

            this.updateSnapping();
        }

        return this;
    }

    updateSnapping() {
        if (
            !this.controls
        ) {
            return;
        }

        if (
            !this.snapping
        ) {
            this.controls.setTranslationSnap(
                null
            );

            this.controls.setRotationSnap(
                null
            );

            this.controls.setScaleSnap(
                null
            );

            return;
        }

        this.controls.setTranslationSnap(
            this.translationSnap
        );

        this.controls.setRotationSnap(
            this.rotationSnap
        );

        this.controls.setScaleSnap(
            this.scaleSnap
        );
    }

    attach(
        object
    ) {
        if (
            !object ||
            !this.controls
        ) {
            return false;
        }

        this.object =
            object;

        this.controls.attach(
            object
        );

        this.beforeTransform =
            this.captureTransform(
                object
            );

        this.emit(
            "attach",
            {
                object,
            }
        );

        return true;
    }

    attachSelected() {
        const object =
            this.getSelectedObject();

        if (
            !object
        ) {
            return false;
        }

        return this.attach(
            object
        );
    }

    detach() {
        const object =
            this.object;

        if (
            this.controls
        ) {
            this.controls.detach();
        }

        this.object =
            null;

        this.beforeTransform =
            null;

        this.dragging =
            false;

        if (
            object
        ) {
            this.emit(
                "detach",
                {
                    object,
                }
            );
        }

        return object;
    }

    getSelectedObject() {
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

    syncSelection() {
        const selected =
            this.getSelectedObject();

        if (
            selected !==
            this.object
        ) {
            if (
                selected
            ) {
                this.attach(
                    selected
                );
            } else {
                this.detach();
            }
        }

        return this.object;
    }

    captureTransform(
        object
    ) {
        if (
            !object
        ) {
            return null;
        }

        return {
            position:
                object.position.clone(),

            quaternion:
                object.quaternion.clone(),

            rotation:
                object.rotation.clone(),

            scale:
                object.scale.clone(),
        };
    }

    restoreTransform(
        object,
        transform
    ) {
        if (
            !object ||
            !transform
        ) {
            return false;
        }

        if (
            transform.position
        ) {
            object.position.copy(
                transform.position
            );
        }

        if (
            transform.quaternion
        ) {
            object.quaternion.copy(
                transform.quaternion
            );
        } else if (
            transform.rotation
        ) {
            object.rotation.copy(
                transform.rotation
            );
        }

        if (
            transform.scale
        ) {
            object.scale.copy(
                transform.scale
            );
        }

        object.updateMatrixWorld(
            true
        );

        return true;
    }

    onMouseDown() {
        if (
            !this.object
        ) {
            return;
        }

        this.beforeTransform =
            this.captureTransform(
                this.object
            );

        this.dragging =
            true;

        this.emit(
            "dragging",
            {
                dragging:
                    true,
                object:
                    this.object,
            }
        );
    }

    onMouseUp() {
        if (
            !this.dragging
        ) {
            return;
        }

        const object =
            this.object;

        const before =
            this.beforeTransform;

        const after =
            this.captureTransform(
                object
            );

        this.dragging =
            false;

        if (
            object &&
            before &&
            after
        ) {
            this.recordUndo(
                object,
                before,
                after
            );

            this.emit(
                "change",
                {
                    object,
                    before,
                    after,
                }
            );
        }

        this.emit(
            "dragging",
            {
                dragging:
                    false,
                object,
            }
        );

        this.beforeTransform =
            after;
    }

    onObjectChange() {
        if (
            !this.object
        ) {
            return;
        }

        this.emit(
            "change",
            {
                object:
                    this.object,
                transform:
                    this.captureTransform(
                        this.object
                    ),
            }
        );
    }

    recordUndo(
        object,
        before,
        after
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
                before,
                after,
                `Transform: ${this.mode}`
            );

            return;
        }

        if (
            typeof this.undo.add ===
            "function"
        ) {
            this.undo.add({
                name:
                    `Transform: ${this.mode}`,

                undo: () => {
                    this.restoreTransform(
                        object,
                        before
                    );
                },

                redo: () => {
                    this.restoreTransform(
                        object,
                        after
                    );
                },
            });
        }
    }

    attachEvents() {
        if (
            !this.controls
        ) {
            return;
        }

        this.controls.addEventListener(
            "mouseDown",
            this._boundMouseDown ||
                (
                    this._boundMouseDown =
                        this.onMouseDown.bind(
                            this
                        )
                )
        );

        this.controls.addEventListener(
            "mouseUp",
            this._boundMouseUp ||
                (
                    this._boundMouseUp =
                        this.onMouseUp.bind(
                            this
                        )
                )
        );

        this.controls.addEventListener(
            "objectChange",
            this._boundObjectChange ||
                (
                    this._boundObjectChange =
                        this.onObjectChange.bind(
                            this
                        )
                )
        );
    }

    detachEvents() {
        if (
            !this.controls
        ) {
            return;
        }

        if (
            this._boundMouseDown
        ) {
            this.controls.removeEventListener(
                "mouseDown",
                this._boundMouseDown
            );
        }

        if (
            this._boundMouseUp
        ) {
            this.controls.removeEventListener(
                "mouseUp",
                this._boundMouseUp
            );
        }

        if (
            this._boundObjectChange
        ) {
            this.controls.removeEventListener(
                "objectChange",
                this._boundObjectChange
            );
        }
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
                            `Gizmos event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.detachEvents();

        if (
            this.controls
        ) {
            if (
                this.scene
            ) {
                this.scene.remove(
                    this.controls
                );
            }

            this.controls.dispose();

            this.controls =
                null;
        }

        this.object =
            null;

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

        this.listeners = {
            mode: [],
            attach: [],
            detach: [],
            change: [],
            dragging: [],
        };
    }
}
