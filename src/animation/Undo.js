import * as THREE from "three";

/**
 * Undo / Redo history system.
 *
 * Handles:
 * - Undo
 * - Redo
 * - Pose snapshots
 * - Transform snapshots
 * - Named actions
 * - History limits
 * - Undo/redo events
 */
export default class UndoSystem {
    constructor(options = {}) {
        this.maxHistory =
            Number.isFinite(
                options.maxHistory
            )
                ? Math.max(
                      1,
                      options.maxHistory
                  )
                : 100;

        this.undoStack =
            [];

        this.redoStack =
            [];

        this.enabled =
            true;

        this.isApplying =
            false;

        this.listeners = {
            undo: [],
            redo: [],
            change: [],
            cleared: [],
        };
    }

    setEnabled(
        enabled
    ) {
        this.enabled =
            Boolean(
                enabled
            );

        return this;
    }

    setMaxHistory(
        value
    ) {
        if (
            !Number.isFinite(
                value
            )
        ) {
            return this;
        }

        this.maxHistory =
            Math.max(
                1,
                Math.floor(
                    value
                )
            );

        while (
            this.undoStack.length >
            this.maxHistory
        ) {
            this.undoStack.shift();
        }

        this.emitChange();

        return this;
    }

    /**
     * Add an undoable action.
     *
     * An action can contain:
     * {
     *     name: "Move Bone",
     *     undo: () => {},
     *     redo: () => {}
     * }
     */
    execute(
        action
    ) {
        if (
            !this.enabled ||
            !action
        ) {
            return false;
        }

        if (
            typeof action.redo ===
            "function"
        ) {
            this.isApplying =
                true;

            try {
                action.redo();
            } finally {
                this.isApplying =
                    false;
            }
        }

        this.push(
            action
        );

        return true;
    }

    /**
     * Add an already-applied action.
     */
    push(
        action
    ) {
        if (
            !this.enabled ||
            this.isApplying ||
            !action
        ) {
            return false;
        }

        if (
            typeof action.undo !==
                "function" ||
            typeof action.redo !==
                "function"
        ) {
            return false;
        }

        this.undoStack.push(
            action
        );

        this.redoStack =
            [];

        while (
            this.undoStack.length >
            this.maxHistory
        ) {
            this.undoStack.shift();
        }

        this.emitChange();

        return true;
    }

    /**
     * Create a simple property-change action.
     */
    createAction(
        name,
        target,
        property,
        before,
        after
    ) {
        if (
            !target ||
            !property
        ) {
            return null;
        }

        const previous =
            this.cloneValue(
                before
            );

        const next =
            this.cloneValue(
                after
            );

        return {
            name:
                name ||
                `Change ${property}`,

            target,

            property,

            timestamp:
                Date.now(),

            undo: () => {
                this.applyValue(
                    target,
                    property,
                    previous
                );
            },

            redo: () => {
                this.applyValue(
                    target,
                    property,
                    next
                );
            },
        };
    }

    /**
     * Record a property change.
     */
    recordChange(
        name,
        target,
        property,
        before,
        after
    ) {
        const action =
            this.createAction(
                name,
                target,
                property,
                before,
                after
            );

        if (
            !action
        ) {
            return false;
        }

        return this.push(
            action
        );
    }

    /**
     * Capture a Three.js object's transform.
     */
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
                object.position
                    ? object.position.clone()
                    : new THREE.Vector3(),

            quaternion:
                object.quaternion
                    ? object.quaternion.clone()
                    : new THREE.Quaternion(),

            scale:
                object.scale
                    ? object.scale.clone()
                    : new THREE.Vector3(
                          1,
                          1,
                          1
                      ),
        };
    }

    /**
     * Restore a Three.js object's transform.
     */
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
            object.position &&
            transform.position
        ) {
            object.position.copy(
                this.toVector3(
                    transform.position
                )
            );
        }

        if (
            object.quaternion &&
            transform.quaternion
        ) {
            object.quaternion.copy(
                this.toQuaternion(
                    transform.quaternion
                )
            );
        }

        if (
            object.scale &&
            transform.scale
        ) {
            object.scale.copy(
                this.toVector3(
                    transform.scale
                )
            );
        }

        if (
            typeof object.updateMatrixWorld ===
            "function"
        ) {
            object.updateMatrixWorld(
                true
            );
        }

        return true;
    }

    /**
     * Record a Three.js transform change.
     */
    recordTransform(
        object,
        before,
        after,
        name = "Transform"
    ) {
        if (
            !object ||
            !before ||
            !after
        ) {
            return false;
        }

        const previous =
            this.cloneTransform(
                before
            );

        const next =
            this.cloneTransform(
                after
            );

        return this.push({
            name,

            target:
                object,

            timestamp:
                Date.now(),

            undo: () => {
                this.restoreTransform(
                    object,
                    previous
                );
            },

            redo: () => {
                this.restoreTransform(
                    object,
                    next
                );
            },
        });
    }

    /**
     * Capture an entire pose from bones.
     */
    capturePose(
        bones = []
    ) {
        const pose = {
            bones: {},
        };

        const list =
            this.resolveBones(
                bones
            );

        list.forEach(
            (bone) => {
                if (
                    !bone ||
                    !bone.name
                ) {
                    return;
                }

                pose.bones[
                    bone.name
                ] = {
                    position:
                        bone.position.clone(),

                    quaternion:
                        bone.quaternion.clone(),

                    scale:
                        bone.scale.clone(),
                };
            }
        );

        return pose;
    }

    /**
     * Restore a captured pose.
     */
    restorePose(
        pose,
        bones = []
    ) {
        if (
            !pose ||
            !pose.bones
        ) {
            return false;
        }

        const list =
            this.resolveBones(
                bones
            );

        list.forEach(
            (bone) => {
                const saved =
                    pose.bones[
                        bone.name
                    ];

                if (
                    !saved
                ) {
                    return;
                }

                if (
                    saved.position
                ) {
                    bone.position.copy(
                        this.toVector3(
                            saved.position
                        )
                    );
                }

                if (
                    saved.quaternion
                ) {
                    bone.quaternion.copy(
                        this.toQuaternion(
                            saved.quaternion
                        )
                    );
                }

                if (
                    saved.scale
                ) {
                    bone.scale.copy(
                        this.toVector3(
                            saved.scale
                        )
                    );
                }

                if (
                    typeof bone.updateMatrixWorld ===
                    "function"
                ) {
                    bone.updateMatrixWorld(
                        true
                    );
                }
            }
        );

        return true;
    }

    /**
     * Record a complete pose change.
     */
    recordPose(
        bones,
        before,
        after,
        name = "Pose Change"
    ) {
        if (
            !before ||
            !after
        ) {
            return false;
        }

        const previous =
            this.clonePose(
                before
            );

        const next =
            this.clonePose(
                after
            );

        const list =
            this.resolveBones(
                bones
            );

        return this.push({
            name,

            timestamp:
                Date.now(),

            undo: () => {
                this.restorePose(
                    previous,
                    list
                );
            },

            redo: () => {
                this.restorePose(
                    next,
                    list
                );
            },
        });
    }

    /**
     * Undo the latest action.
     */
    undo() {
        if (
            !this.enabled ||
            this.undoStack.length ===
                0
        ) {
            return false;
        }

        const action =
            this.undoStack.pop();

        this.isApplying =
            true;

        try {
            action.undo();
        } catch (
            error
        ) {
            console.error(
                "Undo failed:",
                error
            );

            this.undoStack.push(
                action
            );

            return false;
        } finally {
            this.isApplying =
                false;
        }

        this.redoStack.push(
            action
        );

        this.emit(
            "undo",
            action
        );

        this.emitChange();

        return true;
    }

    /**
     * Redo the latest undone action.
     */
    redo() {
        if (
            !this.enabled ||
            this.redoStack.length ===
                0
        ) {
            return false;
        }

        const action =
            this.redoStack.pop();

        this.isApplying =
            true;

        try {
            action.redo();
        } catch (
            error
        ) {
            console.error(
                "Redo failed:",
                error
            );

            this.redoStack.push(
                action
            );

            return false;
        } finally {
            this.isApplying =
                false;
        }

        this.undoStack.push(
            action
        );

        this.emit(
            "redo",
            action
        );

        this.emitChange();

        return true;
    }

    canUndo() {
        return (
            this.undoStack.length >
            0
        );
    }

    canRedo() {
        return (
            this.redoStack.length >
            0
        );
    }

    getUndoCount() {
        return this.undoStack.length;
    }

    getRedoCount() {
        return this.redoStack.length;
    }

    getUndoAction() {
        if (
            this.undoStack.length ===
            0
        ) {
            return null;
        }

        return this.undoStack[
            this.undoStack.length -
                1
        ];
    }

    getRedoAction() {
        if (
            this.redoStack.length ===
            0
        ) {
            return null;
        }

        return this.redoStack[
            this.redoStack.length -
                1
        ];
    }

    getUndoName() {
        const action =
            this.getUndoAction();

        return action
            ? action.name ||
                  "Undo"
            : null;
    }

    getRedoName() {
        const action =
            this.getRedoAction();

        return action
            ? action.name ||
                  "Redo"
            : null;
    }

    /**
     * Undo several actions.
     */
    undoMany(
        count = 1
    ) {
        const amount =
            Math.max(
                0,
                Math.floor(
                    count
                )
            );

        let completed =
            0;

        for (
            let i = 0;
            i < amount;
            i++
        ) {
            if (
                !this.undo()
            ) {
                break;
            }

            completed++;
        }

        return completed;
    }

    /**
     * Redo several actions.
     */
    redoMany(
        count = 1
    ) {
        const amount =
            Math.max(
                0,
                Math.floor(
                    count
                )
            );

        let completed =
            0;

        for (
            let i = 0;
            i < amount;
            i++
        ) {
            if (
                !this.redo()
            ) {
                break;
            }

            completed++;
        }

        return completed;
    }

    /**
     * Start a grouped transaction.
     *
     * All actions recorded inside the group
     * become one undo/redo action.
     */
    beginGroup(
        name = "Group"
    ) {
        if (
            this.group
        ) {
            return false;
        }

        this.group = {
            name,

            actions: [],
        };

        return true;
    }

    addToGroup(
        action
    ) {
        if (
            !this.group ||
            !action
        ) {
            return false;
        }

        if (
            typeof action.undo !==
                "function" ||
            typeof action.redo !==
                "function"
        ) {
            return false;
        }

        this.group.actions.push(
            action
        );

        return true;
    }

    endGroup() {
        if (
            !this.group
        ) {
            return false;
        }

        const group =
            this.group;

        this.group =
            null;

        if (
            group.actions.length ===
            0
        ) {
            return false;
        }

        const action = {
            name:
                group.name,

            timestamp:
                Date.now(),

            undo: () => {
                for (
                    let i =
                        group.actions
                            .length -
                        1;
                    i >= 0;
                    i--
                ) {
                    group.actions[
                        i
                    ].undo();
                }
            },

            redo: () => {
                group.actions.forEach(
                    (
                        item
                    ) => {
                        item.redo();
                    }
                );
            },
        };

        return this.push(
            action
        );
    }

    cancelGroup() {
        this.group =
            null;
    }

    clear() {
        this.undoStack =
            [];

        this.redoStack =
            [];

        this.group =
            null;

        this.emit(
            "cleared"
        );

        this.emitChange();
    }

    clearRedo() {
        this.redoStack =
            [];

        this.emitChange();
    }

    getHistory() {
        return {
            undo:
                this.undoStack.slice(),

            redo:
                this.redoStack.slice(),
        };
    }

    /**
     * Find a bone from a skeleton or
     * object array.
     */
    resolveBones(
        bones
    ) {
        if (
            !Array.isArray(
                bones
            )
        ) {
            if (
                bones
            ) {
                return [
                    bones,
                ];
            }

            return [];
        }

        return bones.filter(
            Boolean
        );
    }

    applyValue(
        target,
        property,
        value
    ) {
        if (
            !target ||
            !property
        ) {
            return false;
        }

        const current =
            target[
                property
            ];

        if (
            current instanceof
            THREE.Vector3
        ) {
            current.copy(
                this.toVector3(
                    value
                )
            );
        } else if (
            current instanceof
            THREE.Quaternion
        ) {
            current.copy(
                this.toQuaternion(
                    value
                )
            );
        } else if (
            current instanceof
            THREE.Euler
        ) {
            if (
                value instanceof
                THREE.Euler
            ) {
                current.copy(
                    value
                );
            } else {
                current.copy(
                    new THREE.Euler(
                        value?.x ||
                            0,
                        value?.y ||
                            0,
                        value?.z ||
                            0,
                        current.order
                    )
                );
            }
        } else {
            target[
                property
            ] =
                this.cloneValue(
                    value
                );
        }

        if (
            typeof target.updateMatrixWorld ===
            "function"
        ) {
            target.updateMatrixWorld(
                true
            );
        }

        return true;
    }

    cloneValue(
        value
    ) {
        if (
            value ===
            null ||
            value ===
            undefined
        ) {
            return value;
        }

        if (
            value instanceof
            THREE.Vector3
        ) {
            return value.clone();
        }

        if (
            value instanceof
            THREE.Quaternion
        ) {
            return value.clone();
        }

        if (
            value instanceof
            THREE.Euler
        ) {
            return value.clone();
        }

        if (
            value instanceof
            THREE.Matrix4
        ) {
            return value.clone();
        }

        if (
            Array.isArray(
                value
            )
        ) {
            return value.map(
                (
                    item
                ) =>
                    this.cloneValue(
                        item
                    )
            );
        }

        if (
            typeof value ===
                "object"
        ) {
            const result = {};

            Object.keys(
                value
            ).forEach(
                (
                    key
                ) => {
                    result[
                        key
                    ] =
                        this.cloneValue(
                            value[
                                key
                            ]
                        );
                }
            );

            return result;
        }

        return value;
    }

    cloneTransform(
        transform
    ) {
        return {
            position:
                this.toVector3(
                    transform.position
                ),

            quaternion:
                this.toQuaternion(
                    transform.quaternion
                ),

            scale:
                this.toVector3(
                    transform.scale ||
                        [
                            1,
                            1,
                            1,
                        ]
                ),
        };
    }

    clonePose(
        pose
    ) {
        const copy = {
            bones: {},
        };

        Object.entries(
            pose.bones ||
                {}
        ).forEach(
            ([
                name,
                bone,
            ]) => {
                copy.bones[
                    name
                ] = {
                    position:
                        this.toVector3(
                            bone.position
                        ),

                    quaternion:
                        this.toQuaternion(
                            bone.quaternion
                        ),

                    scale:
                        this.toVector3(
                            bone.scale ||
                                [
                                    1,
                                    1,
                                    1,
                                ]
                        ),
                };
            }
        );

        return copy;
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
            typeof value.x ===
                "number" &&
            typeof value.y ===
                "number" &&
            typeof value.z ===
                "number"
        ) {
            return new THREE.Vector3(
                value.x,
                value.y,
                value.z
            );
        }

        return new THREE.Vector3(
            0,
            0,
            0
        );
    }

    toQuaternion(
        value
    ) {
        if (
            value instanceof
            THREE.Quaternion
        ) {
            return value.clone();
        }

        if (
            value?.quaternion
        ) {
            return this.toQuaternion(
                value.quaternion
            );
        }

        if (
            Array.isArray(
                value
            )
        ) {
            if (
                value.length >=
                4
            ) {
                return new THREE.Quaternion()
                    .fromArray(
                        value
                    );
            }

            return new THREE.Quaternion()
                .setFromEuler(
                    new THREE.Euler(
                        Number(
                            value[0] || 0
                        ),
                        Number(
                            value[1] || 0
                        ),
                        Number(
                            value[2] || 0
                        )
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
                "number" &&
            typeof value.w ===
                "number"
        ) {
            return new THREE.Quaternion(
                value.x,
                value.y,
                value.z,
                value.w
            );
        }

        return new THREE.Quaternion();
    }

    emitChange() {
        this.emit(
            "change",
            {
                undoCount:
                    this.undoStack
                        .length,

                redoCount:
                    this.redoStack
                        .length,

                canUndo:
                    this.canUndo(),

                canRedo:
                    this.canRedo(),
            }
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
                            `Undo event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.clear();

        this.listeners = {
            undo: [],
            redo: [],
            change: [],
            cleared: [],
        };
    }
}
