import * as THREE from "three";

export default class Selection {
    constructor(scene, camera, options = {}) {
        this.scene =
            scene?.scene ||
            scene ||
            null;

        this.camera =
            camera?.camera ||
            camera ||
            null;

        this.enabled =
            options.enabled !== false;

        this.objects =
            [];

        this.selected =
            null;

        this.hovered =
            null;

        this.multiSelect =
            options.multiSelect !== false;

        this.highlightColor =
            options.highlightColor ||
            0x6d8baa;

        this.hoverColor =
            options.hoverColor ||
            0x8aa8c0;

        this.outlineColor =
            options.outlineColor ||
            0x6d8baa;

        this.raycaster =
            new THREE.Raycaster();

        this.pointer =
            new THREE.Vector2(
                0,
                0
            );

        this.selectionHelper =
            null;

        this.hoverHelper =
            null;

        this.listeners = {
            changed: [],
            hovered: [],
        };

        this._boundPointerMove =
            this.handlePointerMove.bind(
                this
            );

        this._boundPointerDown =
            this.handlePointerDown.bind(
                this
            );

        this._boundKeyDown =
            this.handleKeyDown.bind(
                this
            );

        this.domElement =
            options.domElement ||
            null;

        this.attach(
            this.domElement
        );
    }

    attach(
        element
    ) {
        if (
            this.domElement
        ) {
            this.detach();
        }

        this.domElement =
            element ||
            null;

        if (
            !this.domElement
        ) {
            return;
        }

        this.domElement.addEventListener(
            "pointermove",
            this._boundPointerMove
        );

        this.domElement.addEventListener(
            "pointerdown",
            this._boundPointerDown
        );

        window.addEventListener(
            "keydown",
            this._boundKeyDown
        );
    }

    detach() {
        if (
            !this.domElement
        ) {
            return;
        }

        this.domElement.removeEventListener(
            "pointermove",
            this._boundPointerMove
        );

        this.domElement.removeEventListener(
            "pointerdown",
            this._boundPointerDown
        );

        window.removeEventListener(
            "keydown",
            this._boundKeyDown
        );
    }

    setScene(
        scene
    ) {
        this.scene =
            scene?.scene ||
            scene ||
            null;
    }

    setCamera(
        camera
    ) {
        this.camera =
            camera?.camera ||
            camera ||
            null;
    }

    setEnabled(
        enabled
    ) {
        this.enabled =
            Boolean(enabled);

        if (
            !this.enabled
        ) {
            this.clearHover();
        }
    }

    isEnabled() {
        return this.enabled;
    }

    setObjects(
        objects
    ) {
        this.objects =
            Array.isArray(
                objects
            )
                ? objects.filter(
                      (object) =>
                          object &&
                          object.isObject3D
                  )
                : [];

        this.cleanupSelection();
    }

    addObject(
        object
    ) {
        if (
            !object ||
            !object.isObject3D
        ) {
            return;
        }

        if (
            !this.objects.includes(
                object
            )
        ) {
            this.objects.push(
                object
            );
        }
    }

    removeObject(
        object
    ) {
        const index =
            this.objects.indexOf(
                object
            );

        if (
            index !== -1
        ) {
            this.objects.splice(
                index,
                1
            );
        }

        if (
            this.selected ===
            object
        ) {
            this.removeFromSelection(
                object
            );
        }

        if (
            this.hovered ===
            object
        ) {
            this.clearHover();
        }
    }

    clearObjects() {
        this.objects =
            [];

        this.clear();
        this.clearHover();
    }

    getSelectableObjects() {
        return this.objects.filter(
            (object) =>
                object &&
                object.visible
        );
    }

    handlePointerMove(
        event
    ) {
        if (
            !this.enabled
        ) {
            return;
        }

        if (
            !this.camera ||
            !this.domElement
        ) {
            return;
        }

        this.updatePointer(
            event
        );

        const object =
            this.pick(
                event
            );

        this.setHovered(
            object
        );
    }

    handlePointerDown(
        event
    ) {
        if (
            !this.enabled
        ) {
            return;
        }

        if (
            event.button !== 0
        ) {
            return;
        }

        if (
            !this.camera ||
            !this.domElement
        ) {
            return;
        }

        this.updatePointer(
            event
        );

        const object =
            this.pick(
                event
            );

        const additive =
            event.shiftKey ||
            event.ctrlKey ||
            event.metaKey;

        if (
            object
        ) {
            if (
                additive &&
                this.multiSelect
            ) {
                this.toggle(
                    object
                );
            } else {
                this.select(
                    object
                );
            }
        } else if (
            !additive
        ) {
            this.clear();
        }
    }

    handleKeyDown(
        event
    ) {
        if (
            !this.enabled
        ) {
            return;
        }

        if (
            event.key ===
                "Escape"
        ) {
            this.clear();
        }
    }

    updatePointer(
        event
    ) {
        const rect =
            this.domElement.getBoundingClientRect();

        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            return;
        }

        this.pointer.x =
            ((event.clientX -
                rect.left) /
                rect.width) *
                2 -
            1;

        this.pointer.y =
            -(
                (event.clientY -
                    rect.top) /
                    rect.height
            ) *
                2 +
            1;
    }

    pick(
        event
    ) {
        if (
            !this.camera
        ) {
            return null;
        }

        if (
            event
        ) {
            this.updatePointer(
                event
            );
        }

        this.raycaster.setFromCamera(
            this.pointer,
            this.camera
        );

        const objects =
            this.getSelectableObjects();

        const intersections =
            this.raycaster.intersectObjects(
                objects,
                true
            );

        for (
            const hit of intersections
        ) {
            const object =
                this.findSelectableParent(
                    hit.object
                );

            if (
                object
            ) {
                return object;
            }
        }

        return null;
    }

    findSelectableParent(
        object
    ) {
        let current =
            object;

        while (
            current &&
            current !==
                this.scene
        ) {
            if (
                this.isSelectable(
                    current
                )
            ) {
                return current;
            }

            current =
                current.parent;
        }

        return null;
    }

    isSelectable(
        object
    ) {
        if (
            !object ||
            !object.isObject3D
        ) {
            return false;
        }

        if (
            object.userData
                ?.selectable ===
            false
        ) {
            return false;
        }

        if (
            object.userData
                ?.isHelper
        ) {
            return false;
        }

        return (
            this.objects.includes(
                object
            ) ||
            object.userData
                ?.selectable ===
                true
        );
    }

    select(
        object,
        options = {}
    ) {
        if (
            !object
        ) {
            this.clear();
            return null;
        }

        if (
            !this.isSelectable(
                object
            )
        ) {
            return null;
        }

        const additive =
            options.additive === true;

        if (
            additive &&
            this.multiSelect
        ) {
            return this.toggle(
                object
            );
        }

        const previous =
            this.getSelected();

        this.clearHelpers();

        this.selected =
            [object];

        this.createSelectionHelpers();

        this.emitChanged(
            previous
        );

        return object;
    }

    selectMultiple(
        objects
    ) {
        if (
            !this.multiSelect
        ) {
            return;
        }

        const valid =
            Array.isArray(
                objects
            )
                ? objects.filter(
                      (object) =>
                          this.isSelectable(
                              object
                          )
                  )
                : [];

        const previous =
            this.getSelected();

        this.clearHelpers();

        this.selected =
            uniqueObjects(
                valid
            );

        this.createSelectionHelpers();

        this.emitChanged(
            previous
        );
    }

    addToSelection(
        object
    ) {
        if (
            !this.isSelectable(
                object
            )
        ) {
            return;
        }

        if (
            this.selected.includes(
                object
            )
        ) {
            return;
        }

        const previous =
            this.getSelected();

        this.selected.push(
            object
        );

        this.createSelectionHelpers();

        this.emitChanged(
            previous
        );
    }

    removeFromSelection(
        object
    ) {
        const index =
            this.selected.indexOf(
                object
            );

        if (
            index === -1
        ) {
            return;
        }

        const previous =
            this.getSelected();

        this.selected.splice(
            index,
            1
        );

        this.createSelectionHelpers();

        this.emitChanged(
            previous
        );
    }

    toggle(
        object
    ) {
        if (
            !this.isSelectable(
                object
            )
        ) {
            return;
        }

        if (
            this.selected.includes(
                object
            )
        ) {
            this.removeFromSelection(
                object
            );
        } else {
            this.addToSelection(
                object
            );
        }

        return object;
    }

    clear() {
        if (
            this.selected.length ===
            0
        ) {
            return;
        }

        const previous =
            this.getSelected();

        this.selected =
            [];

        this.clearHelpers();

        this.emitChanged(
            previous
        );
    }

    getSelected() {
        return [
            ...this.selected,
        ];
    }

    getPrimary() {
        return (
            this.selected[
                this.selected.length -
                    1
            ] || null
        );
    }

    hasSelection() {
        return (
            this.selected.length >
            0
        );
    }

    isSelected(
        object
    ) {
        return this.selected.includes(
            object
        );
    }

    setHovered(
        object
    ) {
        if (
            object ===
            this.hovered
        ) {
            return;
        }

        const previous =
            this.hovered;

        this.clearHoverHelper();

        this.hovered =
            object;

        if (
            object &&
            !this.isSelected(
                object
            )
        ) {
            this.createHoverHelper(
                object
            );
        }

        this.emit(
            "hovered",
            {
                object,
                previous,
            }
        );
    }

    clearHover() {
        if (
            !this.hovered
        ) {
            return;
        }

        const previous =
            this.hovered;

        this.clearHoverHelper();

        this.hovered =
            null;

        this.emit(
            "hovered",
            {
                object: null,
                previous,
            }
        );
    }

    getHovered() {
        return this.hovered;
    }

    createSelectionHelpers() {
        this.clearSelectionHelpers();

        for (
            const object of this
                .selected
        ) {
            const helper =
                this.createBoxHelper(
                    object,
                    this.highlightColor
                );

            if (
                helper
            ) {
                helper.name =
                    "__selection";
                helper.userData.isHelper =
                    true;

                this.scene?.add(
                    helper
                );
            }
        }
    }

    clearSelectionHelpers() {
        if (
            !this.scene
        ) {
            return;
        }

        const helpers =
            [];

        this.scene.traverse(
            (object) => {
                if (
                    object.userData
                        ?.isSelectionHelper
                ) {
                    helpers.push(
                        object
                    );
                }
            }
        );

        helpers.forEach(
            (helper) => {
                this.scene.remove(
                    helper
                );

                helper.geometry?.dispose();

                disposeMaterial(
                    helper.material
                );
            }
        );
    }

    createSelectionHelper(
        object
    ) {
        if (
            !object
        ) {
            return null;
        }

        const helper =
            this.createBoxHelper(
                object,
                this.highlightColor
            );

        if (
            !helper
        ) {
            return null;
        }

        helper.name =
            "__selection";

        helper.userData.isHelper =
            true;

        helper.userData.isSelectionHelper =
            true;

        this.scene?.add(
            helper
        );

        return helper;
    }

    createHoverHelper(
        object
    ) {
        if (
            !object ||
            !this.scene
        ) {
            return null;
        }

        const helper =
            this.createBoxHelper(
                object,
                this.hoverColor
            );

        if (
            !helper
        ) {
            return null;
        }

        helper.name =
            "__hover";

        helper.userData.isHelper =
            true;

        helper.userData.isHoverHelper =
            true;

        this.scene.add(
            helper
        );

        this.hoverHelper =
            helper;

        return helper;
    }

    createBoxHelper(
        object,
        color
    ) {
        if (
            !object
        ) {
            return null;
        }

        const helper =
            new THREE.BoxHelper(
                object,
                color
            );

        helper.material.depthTest =
            false;

        helper.material.transparent =
            true;

        helper.material.opacity =
            0.9;

        helper.renderOrder =
            1000;

        return helper;
    }

    clearHoverHelper() {
        if (
            !this.hoverHelper
        ) {
            return;
        }

        const helper =
            this.hoverHelper;

        if (
            helper.parent
        ) {
            helper.parent.remove(
                helper
            );
        }

        helper.geometry?.dispose();

        disposeMaterial(
            helper.material
        );

        this.hoverHelper =
            null;
    }

    clearHelpers() {
        this.clearSelectionHelpers();
        this.clearHoverHelper();
    }

    cleanupSelection() {
        const valid =
            this.selected.filter(
                (object) =>
                    this.isSelectable(
                        object
                    ) &&
                    this.objects.includes(
                        object
                    )
            );

        if (
            valid.length !==
            this.selected.length
        ) {
            const previous =
                this.getSelected();

            this.selected =
                valid;

            this.createSelectionHelpers();

            this.emitChanged(
                previous
            );
        }
    }

    selectAll() {
        if (
            !this.multiSelect
        ) {
            return;
        }

        const previous =
            this.getSelected();

        this.clearHelpers();

        this.selected =
            this.getSelectableObjects()
                .filter(
                    (object) =>
                        this.isSelectable(
                            object
                        )
                );

        this.createSelectionHelpers();

        this.emitChanged(
            previous
        );
    }

    invertSelection() {
        if (
            !this.multiSelect
        ) {
            return;
        }

        const previous =
            this.getSelected();

        const selectable =
            this.getSelectableObjects()
                .filter(
                    (object) =>
                        this.isSelectable(
                            object
                        )
                );

        this.clearHelpers();

        this.selected =
            selectable.filter(
                (object) =>
                    !this.selected.includes(
                        object
                    )
            );

        this.createSelectionHelpers();

        this.emitChanged(
            previous
        );
    }

    selectByName(
        name,
        options = {}
    ) {
        if (
            !name
        ) {
            return null;
        }

        const object =
            this.objects.find(
                (item) =>
                    item.name ===
                    name
            );

        if (
            !object
        ) {
            return null;
        }

        this.select(
            object,
            options
        );

        return object;
    }

    selectById(
        id,
        options = {}
    ) {
        const object =
            this.objects.find(
                (item) =>
                    item.userData
                        ?.id ===
                    id
            );

        if (
            !object
        ) {
            return null;
        }

        this.select(
            object,
            options
        );

        return object;
    }

    focusSelection(
        cameraController
    ) {
        const primary =
            this.getPrimary();

        if (
            !primary ||
            !cameraController
        ) {
            return false;
        }

        if (
            typeof cameraController
                .focusObject ===
            "function"
        ) {
            return cameraController.focusObject(
                primary
            );
        }

        return false;
    }

    getState() {
        return {
            selectedIds:
                this.selected
                    .map(
                        (object) =>
                            object
                                .userData
                                ?.id
                    )
                    .filter(Boolean),

            hoveredId:
                this.hovered
                    ?.userData
                    ?.id ||
                null,

            enabled:
                this.enabled,

            multiSelect:
                this.multiSelect,
        };
    }

    setState(
        state = {}
    ) {
        if (
            typeof state.enabled ===
            "boolean"
        ) {
            this.enabled =
                state.enabled;
        }

        if (
            typeof state.multiSelect ===
            "boolean"
        ) {
            this.multiSelect =
                state.multiSelect;
        }

        if (
            Array.isArray(
                state.selectedIds
            )
        ) {
            const selected =
                state.selectedIds
                    .map(
                        (id) =>
                            this.objects.find(
                                (
                                    object
                                ) =>
                                    object
                                        .userData
                                        ?.id ===
                                    id
                            )
                    )
                    .filter(Boolean);

            this.selectMultiple(
                selected
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

    emit(
        event,
        data
    ) {
        const listeners =
            this.listeners[
                event
            ];

        if (!listeners) {
            return;
        }

        listeners
            .slice()
            .forEach(
                (callback) => {
                    try {
                        callback(
                            data
                        );
                    } catch (
                        error
                    ) {
                        console.error(
                            `Selection event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    emitChanged(
        previous
    ) {
        this.emit(
            "changed",
            {
                selected:
                    this.getSelected(),

                primary:
                    this.getPrimary(),

                previous:
                    previous || [],
            }
        );
    }

    dispose() {
        this.detach();

        this.clearHelpers();

        this.objects =
            [];

        this.selected =
            [];

        this.hovered =
            null;

        this.scene =
            null;

        this.camera =
            null;

        this.domElement =
            null;

        this.listeners = {
            changed: [],
            hovered: [],
        };
    }
}

function uniqueObjects(
    objects
) {
    return Array.from(
        new Set(
            objects
        )
    );
}

function disposeMaterial(
    material
) {
    if (
        Array.isArray(
            material
        )
    ) {
        material.forEach(
            disposeMaterial
        );

        return;
    }

    if (
        !material
    ) {
        return;
    }

    Object.keys(
        material
    ).forEach(
        (key) => {
            const value =
                material[key];

            if (
                value &&
                value.isTexture
            ) {
                value.dispose();
            }
        }
    );

    material.dispose?.();
}
