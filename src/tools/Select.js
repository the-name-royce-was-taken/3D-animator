import * as THREE from "three";

/**
 * Selection tool.
 *
 * Handles:
 * - Clicking objects to select them
 * - Ctrl/Cmd multi-selection
 * - Shift multi-selection
 * - Clicking empty space to clear selection
 * - Raycasting
 * - Selection events
 * - Highlighting selected objects
 * - Parent/child selection
 */
export default class SelectTool {
    constructor(options = {}) {
        this.scene =
            options.scene || null;

        this.camera =
            options.camera || null;

        this.renderer =
            options.renderer || null;

        this.enabled =
            options.enabled !== false;

        this.selectableObjects =
            options.selectableObjects || null;

        this.selectChildren =
            options.selectChildren !== false;

        this.selectParent =
            options.selectParent !== false;

        this.multiSelect =
            options.multiSelect !== false;

        this.highlightEnabled =
            options.highlightEnabled !== false;

        this.highlightColor =
            options.highlightColor ||
            0x3399ff;

        this.highlightOpacity =
            Number.isFinite(
                options.highlightOpacity
            )
                ? options.highlightOpacity
                : 0.2;

        this.selectedObjects =
            [];

        this.hoveredObject =
            null;

        this.pointer =
            new THREE.Vector2();

        this.raycaster =
            new THREE.Raycaster();

        this.listeners = {
            select: [],
            deselect: [],
            change: [],
            hover: [],
            clear: [],
        };

        this.originalMaterials =
            new Map();

        this.highlightMaterials =
            new Map();

        this._boundPointerDown =
            this.onPointerDown.bind(
                this
            );

        this._boundPointerMove =
            this.onPointerMove.bind(
                this
            );

        this._boundPointerLeave =
            this.onPointerLeave.bind(
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
            this.clear();
        }

        return this;
    }

    setMultiSelect(
        enabled
    ) {
        this.multiSelect =
            Boolean(
                enabled
            );

        return this;
    }

    setHighlightEnabled(
        enabled
    ) {
        this.highlightEnabled =
            Boolean(
                enabled
            );

        this.refreshHighlights();

        return this;
    }

    getSelectedObjects() {
        return [
            ...this.selectedObjects,
        ];
    }

    getSelectedObject() {
        return (
            this.selectedObjects[0] ||
            null
        );
    }

    getSelected() {
        return this.getSelectedObject();
    }

    isSelected(
        object
    ) {
        return this.selectedObjects.includes(
            object
        );
    }

    select(
        object,
        options = {}
    ) {
        if (
            !object
        ) {
            if (
                options.clearOnNull !==
                false
            ) {
                this.clear();
            }

            return null;
        }

        const target =
            this.resolveSelectableObject(
                object
            );

        if (
            !target
        ) {
            return null;
        }

        const additive =
            options.additive ===
                true ||
            options.multi ===
                true;

        if (
            !additive ||
            !this.multiSelect
        ) {
            this.clear(
                false
            );
        }

        if (
            this.isSelected(
                target
            )
        ) {
            if (
                options.toggle ===
                true
            ) {
                this.deselect(
                    target
                );
            }

            return target;
        }

        this.selectedObjects.push(
            target
        );

        this.applyHighlight(
            target
        );

        this.emit(
            "select",
            {
                object:
                    target,
                selectedObjects:
                    this.getSelectedObjects(),
            }
        );

        this.emit(
            "change",
            this.getSelectedObjects()
        );

        return target;
    }

    deselect(
        object
    ) {
        if (
            !object
        ) {
            return false;
        }

        const index =
            this.selectedObjects.indexOf(
                object
            );

        if (
            index ===
            -1
        ) {
            return false;
        }

        this.selectedObjects.splice(
            index,
            1
        );

        this.removeHighlight(
            object
        );

        this.emit(
            "deselect",
            {
                object,
                selectedObjects:
                    this.getSelectedObjects(),
            }
        );

        this.emit(
            "change",
            this.getSelectedObjects()
        );

        return true;
    }

    toggle(
        object
    ) {
        if (
            this.isSelected(
                object
            )
        ) {
            return this.deselect(
                object
            );
        }

        return this.select(
            object,
            {
                additive:
                    true,
            }
        );
    }

    clear(
        emitEvent = true
    ) {
        const previous =
            this.getSelectedObjects();

        for (
            const object of previous
        ) {
            this.removeHighlight(
                object
            );
        }

        this.selectedObjects =
            [];

        if (
            emitEvent
        ) {
            this.emit(
                "clear",
                {
                    previous,
                }
            );

            this.emit(
                "change",
                []
            );
        }

        return previous;
    }

    selectAll() {
        if (
            !this.scene
        ) {
            return [];
        }

        this.clear(
            false
        );

        const objects =
            this.getSelectableMeshes();

        for (
            const object of objects
        ) {
            if (
                !this.selectedObjects.includes(
                    object
                )
            ) {
                this.selectedObjects.push(
                    object
                );

                this.applyHighlight(
                    object
                );
            }
        }

        this.emit(
            "change",
            this.getSelectedObjects()
        );

        return this.getSelectedObjects();
    }

    selectByName(
        name,
        options = {}
    ) {
        if (
            !this.scene ||
            !name
        ) {
            return null;
        }

        let found =
            null;

        this.scene.traverse(
            (object) => {
                if (
                    found
                ) {
                    return;
                }

                if (
                    object.name ===
                    name
                ) {
                    found =
                        object;
                }
            }
        );

        if (
            !found
        ) {
            return null;
        }

        return this.select(
            found,
            options
        );
    }

    selectByUUID(
        uuid,
        options = {}
    ) {
        if (
            !this.scene ||
            !uuid
        ) {
            return null;
        }

        let found =
            null;

        this.scene.traverse(
            (object) => {
                if (
                    found
                ) {
                    return;
                }

                if (
                    object.uuid ===
                    uuid
                ) {
                    found =
                        object;
                }
            }
        );

        if (
            !found
        ) {
            return null;
        }

        return this.select(
            found,
            options
        );
    }

    getSelectableMeshes() {
        if (
            this.selectableObjects
        ) {
            return this.selectableObjects.filter(
                (object) =>
                    object &&
                    object.visible !==
                        false
            );
        }

        if (
            !this.scene
        ) {
            return [];
        }

        const objects =
            [];

        this.scene.traverse(
            (object) => {
                if (
                    object.isMesh &&
                    object.visible
                ) {
                    objects.push(
                        object
                    );
                }
            }
        );

        return objects;
    }

    resolveSelectableObject(
        object
    ) {
        if (
            !object
        ) {
            return null;
        }

        if (
            this.selectableObjects &&
            this.selectableObjects.includes(
                object
            )
        ) {
            return object;
        }

        if (
            object.isMesh
        ) {
            if (
                this.selectParent &&
                object.userData &&
                object.userData.selectableParent
            ) {
                return (
                    object.userData
                        .selectableParent ||
                    object
                );
            }

            return object;
        }

        if (
            this.selectChildren
        ) {
            let childMesh =
                null;

            object.traverse(
                (child) => {
                    if (
                        !childMesh &&
                        child.isMesh
                    ) {
                        childMesh =
                            child;
                    }
                }
            );

            if (
                childMesh
            ) {
                return this.resolveSelectableObject(
                    childMesh
                );
            }
        }

        return object;
    }

    raycast(
        pointer
    ) {
        if (
            !this.camera
        ) {
            return [];
        }

        this.updatePointer(
            pointer
        );

        this.raycaster.setFromCamera(
            this.pointer,
            this.camera
        );

        const objects =
            this.getSelectableMeshes();

        return this.raycaster.intersectObjects(
            objects,
            true
        );
    }

    pick(
        pointer
    ) {
        const hits =
            this.raycast(
                pointer
            );

        if (
            hits.length ===
            0
        ) {
            return null;
        }

        return this.resolveSelectableObject(
            hits[0].object
        );
    }

    hover(
        pointer
    ) {
        if (
            !this.enabled
        ) {
            return null;
        }

        const object =
            this.pick(
                pointer
            );

        if (
            object ===
            this.hoveredObject
        ) {
            return object;
        }

        const previous =
            this.hoveredObject;

        if (
            previous
        ) {
            this.removeHoverHighlight(
                previous
            );
        }

        this.hoveredObject =
            object;

        if (
            object
        ) {
            this.applyHoverHighlight(
                object
            );
        }

        this.emit(
            "hover",
            {
                object,
                previous,
            }
        );

        return object;
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

        const pointer =
            this.eventToPointer(
                event
            );

        const object =
            this.pick(
                pointer
            );

        const additive =
            event.shiftKey ||
            event.ctrlKey ||
            event.metaKey;

        if (
            object
        ) {
            this.select(
                object,
                {
                    additive,
                    toggle:
                        additive,
                }
            );
        } else if (
            !additive
        ) {
            this.clear();
        }
    }

    onPointerMove(
        event
    ) {
        if (
            !this.enabled ||
            !this.renderer ||
            !this.camera
        ) {
            return;
        }

        const pointer =
            this.eventToPointer(
                event
            );

        this.hover(
            pointer
        );
    }

    onPointerLeave() {
        if (
            this.hoveredObject
        ) {
            this.removeHoverHighlight(
                this.hoveredObject
            );

            const previous =
                this.hoveredObject;

            this.hoveredObject =
                null;

            this.emit(
                "hover",
                {
                    object:
                        null,
                    previous,
                }
            );
        }
    }

    eventToPointer(
        event
    ) {
        const rect =
            this.renderer.domElement.getBoundingClientRect();

        return new THREE.Vector2(
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

    applyHighlight(
        object
    ) {
        if (
            !this.highlightEnabled ||
            !object
        ) {
            return;
        }

        this.applyObjectHighlight(
            object
        );
    }

    removeHighlight(
        object
    ) {
        if (
            !object
        ) {
            return;
        }

        this.restoreObjectMaterial(
            object
        );
    }

    applyObjectHighlight(
        object
    ) {
        if (
            !object.isMesh
        ) {
            return;
        }

        if (
            this.originalMaterials.has(
                object
            )
        ) {
            return;
        }

        const original =
            object.material;

        this.originalMaterials.set(
            object,
            original
        );

        const materials =
            Array.isArray(
                original
            )
                ? original
                : [
                      original,
                  ];

        const highlighted =
            materials.map(
                (material) => {
                    if (
                        !material
                    ) {
                        return material;
                    }

                    const clone =
                        material.clone();

                    if (
                        "emissive" in
                        clone
                    ) {
                        clone.emissive =
                            new THREE.Color(
                                this.highlightColor
                            );

                        clone.emissiveIntensity =
                            0.5;
                    }

                    if (
                        "color" in
                        clone
                    ) {
                        clone.color =
                            clone.color.clone()
                                .lerp(
                                    new THREE.Color(
                                        this.highlightColor
                                    ),
                                    this.highlightOpacity
                                );
                    }

                    return clone;
                }
            );

        this.highlightMaterials.set(
            object,
            highlighted
        );

        object.material =
            Array.isArray(
                original
            )
                ? highlighted
                : highlighted[0];
    }

    restoreObjectMaterial(
        object
    ) {
        if (
            !this.originalMaterials.has(
                object
            )
        ) {
            return;
        }

        const original =
            this.originalMaterials.get(
                object
            );

        object.material =
            original;

        const highlighted =
            this.highlightMaterials.get(
                object
            );

        if (
            highlighted
        ) {
            for (
                const material of highlighted
            ) {
                if (
                    material &&
                    typeof material.dispose ===
                        "function"
                ) {
                    material.dispose();
                }
            }
        }

        this.highlightMaterials.delete(
            object
        );

        this.originalMaterials.delete(
            object
        );
    }

    applyHoverHighlight(
        object
    ) {
        if (
            this.isSelected(
                object
            )
        ) {
            return;
        }

        if (
            !object.isMesh
        ) {
            return;
        }

        if (
            this.originalMaterials.has(
                object
            )
        ) {
            return;
        }

        const original =
            object.material;

        this.originalMaterials.set(
            object,
            original
        );

        const materials =
            Array.isArray(
                original
            )
                ? original
                : [
                      original,
                  ];

        const highlighted =
            materials.map(
                (material) => {
                    if (
                        !material
                    ) {
                        return material;
                    }

                    const clone =
                        material.clone();

                    if (
                        "emissive" in
                        clone
                    ) {
                        clone.emissive =
                            new THREE.Color(
                                this.highlightColor
                            );

                        clone.emissiveIntensity =
                            0.2;
                    }

                    return clone;
                }
            );

        this.highlightMaterials.set(
            object,
            highlighted
        );

        object.material =
            Array.isArray(
                original
            )
                ? highlighted
                : highlighted[0];
    }

    removeHoverHighlight(
        object
    ) {
        if (
            this.isSelected(
                object
            )
        ) {
            return;
        }

        this.restoreObjectMaterial(
            object
        );
    }

    refreshHighlights() {
        for (
            const object of this.selectedObjects
        ) {
            this.removeHighlight(
                object
            );
        }

        if (
            this.highlightEnabled
        ) {
            for (
                const object of this.selectedObjects
            ) {
                this.applyHighlight(
                    object
                );
            }
        }

        if (
            this.hoveredObject &&
            !this.isSelected(
                this.hoveredObject
            )
        ) {
            this.applyHoverHighlight(
                this.hoveredObject
            );
        }
    }

    getSelectionBounds() {
        const box =
            new THREE.Box3();

        let hasObject =
            false;

        for (
            const object of this.selectedObjects
        ) {
            if (
                !object
            ) {
                continue;
            }

            const objectBox =
                new THREE.Box3()
                    .setFromObject(
                        object
                    );

            if (
                !objectBox.isEmpty()
            ) {
                box.union(
                    objectBox
                );

                hasObject =
                    true;
            }
        }

        return hasObject
            ? box
            : null;
    }

    getSelectionCenter() {
        const box =
            this.getSelectionBounds();

        if (
            !box
        ) {
            return new THREE.Vector3();
        }

        return box.getCenter(
            new THREE.Vector3()
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
                            `Select tool event error (${event}):`,
                            error
                        );
                    }
                }
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

        this.renderer.domElement.addEventListener(
            "pointermove",
            this._boundPointerMove
        );

        this.renderer.domElement.addEventListener(
            "pointerleave",
            this._boundPointerLeave
        );
    }

    detachEvents() {
        if (
            !this.renderer?.domElement
        ) {
            return;
        }

        this.renderer.domElement.removeEventListener(
            "pointerdown",
            this._boundPointerDown
        );

        this.renderer.domElement.removeEventListener(
            "pointermove",
            this._boundPointerMove
        );

        this.renderer.domElement.removeEventListener(
            "pointerleave",
            this._boundPointerLeave
        );
    }

    dispose() {
        this.detachEvents();

        this.clear(
            false
        );

        if (
            this.hoveredObject
        ) {
            this.removeHoverHighlight(
                this.hoveredObject
            );
        }

        this.scene =
            null;

        this.camera =
            null;

        this.renderer =
            null;

        this.selectableObjects =
            null;

        this.hoveredObject =
            null;

        this.listeners = {
            select: [],
            deselect: [],
            change: [],
            hover: [],
            clear: [],
        };
    }
}
