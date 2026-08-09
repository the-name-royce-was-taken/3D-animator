import * as THREE from "three";

/**
 * Forward Kinematics system.
 *
 * Handles:
 * - Bone rotation
 * - Bone position
 * - Bone scale
 * - Local/world transforms
 * - Pose capture and application
 * - FK chain manipulation
 * - Blending between poses
 */
export default class FKSystem {
    constructor(options = {}) {
        this.scene =
            options.scene || null;

        this.skeleton =
            options.skeleton || null;

        this.enabled =
            true;

        this.chains =
            new Map();

        this.listeners = {
            chainAdded: [],
            chainRemoved: [],
            changed: [],
            poseApplied: [],
        };
    }

    setScene(
        scene
    ) {
        this.scene =
            scene || null;

        return this;
    }

    setSkeleton(
        skeleton
    ) {
        this.skeleton =
            skeleton || null;

        return this;
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

    createChain(
        id,
        bones = [],
        options = {}
    ) {
        if (
            !id
        ) {
            return null;
        }

        const chain = {
            id,

            bones:
                Array.isArray(
                    bones
                )
                    ? bones.slice()
                    : [],

            enabled:
                options.enabled !==
                false,

            inheritRotation:
                options.inheritRotation !==
                false,

            inheritPosition:
                options.inheritPosition !==
                false,

            inheritScale:
                options.inheritScale !==
                false,
        };

        this.chains.set(
            id,
            chain
        );

        this.emit(
            "chainAdded",
            chain
        );

        return chain;
    }

    addChain(
        id,
        bones = [],
        options = {}
    ) {
        return this.createChain(
            id,
            bones,
            options
        );
    }

    removeChain(
        id
    ) {
        const chain =
            this.chains.get(
                id
            );

        if (
            !chain
        ) {
            return false;
        }

        this.chains.delete(
            id
        );

        this.emit(
            "chainRemoved",
            chain
        );

        return true;
    }

    getChain(
        id
    ) {
        return (
            this.chains.get(
                id
            ) || null
        );
    }

    getChains() {
        return Array.from(
            this.chains.values()
        );
    }

    clearChains() {
        this.chains.clear();
    }

    setBoneRotation(
        bone,
        rotation,
        space = "local"
    ) {
        if (
            !this.enabled ||
            !bone
        ) {
            return false;
        }

        const quaternion =
            this.toQuaternion(
                rotation
            );

        if (
            space ===
            "world"
        ) {
            this.setWorldQuaternion(
                bone,
                quaternion
            );
        } else {
            bone.quaternion.copy(
                quaternion
            );

            bone.updateMatrixWorld(
                true
            );
        }

        this.emit(
            "changed",
            {
                bone,
                property:
                    "rotation",
                space,
            }
        );

        return true;
    }

    rotateBone(
        bone,
        rotation,
        space = "local"
    ) {
        if (
            !this.enabled ||
            !bone
        ) {
            return false;
        }

        const quaternion =
            this.toQuaternion(
                rotation
            );

        if (
            space ===
            "world"
        ) {
            const current =
                new THREE.Quaternion();

            bone.getWorldQuaternion(
                current
            );

            current.multiply(
                quaternion
            );

            this.setWorldQuaternion(
                bone,
                current
            );
        } else {
            bone.quaternion.multiply(
                quaternion
            );

            bone.updateMatrixWorld(
                true
            );
        }

        this.emit(
            "changed",
            {
                bone,
                property:
                    "rotation",
                space,
            }
        );

        return true;
    }

    setBonePosition(
        bone,
        position,
        space = "local"
    ) {
        if (
            !this.enabled ||
            !bone
        ) {
            return false;
        }

        const value =
            this.toVector3(
                position
            );

        if (
            space ===
            "world"
        ) {
            this.setWorldPosition(
                bone,
                value
            );
        } else {
            bone.position.copy(
                value
            );

            bone.updateMatrixWorld(
                true
            );
        }

        this.emit(
            "changed",
            {
                bone,
                property:
                    "position",
                space,
            }
        );

        return true;
    }

    moveBone(
        bone,
        offset,
        space = "local"
    ) {
        if (
            !this.enabled ||
            !bone
        ) {
            return false;
        }

        const value =
            this.toVector3(
                offset
            );

        if (
            space ===
            "world"
        ) {
            const position =
                this.getWorldPosition(
                    bone
                );

            position.add(
                value
            );

            this.setWorldPosition(
                bone,
                position
            );
        } else {
            bone.position.add(
                value
            );

            bone.updateMatrixWorld(
                true
            );
        }

        this.emit(
            "changed",
            {
                bone,
                property:
                    "position",
                space,
            }
        );

        return true;
    }

    setBoneScale(
        bone,
        scale
    ) {
        if (
            !this.enabled ||
            !bone
        ) {
            return false;
        }

        bone.scale.copy(
            this.toVector3(
                scale
            )
        );

        bone.updateMatrixWorld(
            true
        );

        this.emit(
            "changed",
            {
                bone,
                property:
                    "scale",
            }
        );

        return true;
    }

    applyTransform(
        bone,
        transform = {},
        space = "local"
    ) {
        if (
            !bone
        ) {
            return false;
        }

        if (
            transform.position !==
            undefined
        ) {
            this.setBonePosition(
                bone,
                transform.position,
                space
            );
        }

        if (
            transform.rotation !==
            undefined
        ) {
            this.setBoneRotation(
                bone,
                transform.rotation,
                space
            );
        }

        if (
            transform.quaternion !==
            undefined
        ) {
            this.setBoneRotation(
                bone,
                transform.quaternion,
                space
            );
        }

        if (
            transform.scale !==
            undefined
        ) {
            this.setBoneScale(
                bone,
                transform.scale
            );
        }

        return true;
    }

    getBoneTransform(
        bone,
        space = "local"
    ) {
        if (
            !bone
        ) {
            return null;
        }

        if (
            space ===
            "world"
        ) {
            const position =
                new THREE.Vector3();

            const quaternion =
                new THREE.Quaternion();

            const scale =
                new THREE.Vector3();

            bone.getWorldPosition(
                position
            );

            bone.getWorldQuaternion(
                quaternion
            );

            bone.getWorldScale(
                scale
            );

            return {
                position,
                quaternion,
                rotation:
                    new THREE.Euler().setFromQuaternion(
                        quaternion,
                        bone.rotation.order
                    ),
                scale,
            };
        }

        return {
            position:
                bone.position.clone(),

            quaternion:
                bone.quaternion.clone(),

            rotation:
                bone.rotation.clone(),

            scale:
                bone.scale.clone(),
        };
    }

    capturePose(
        bones = null,
        options = {}
    ) {
        const resolvedBones =
            this.resolveBones(
                bones
            );

        const pose = {
            name:
                options.name ||
                "Pose",

            bones: {},
        };

        resolvedBones.forEach(
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

                    rotation:
                        bone.rotation.clone(),

                    scale:
                        bone.scale.clone(),
                };
            }
        );

        return pose;
    }

    applyPose(
        pose,
        options = {}
    ) {
        if (
            !this.enabled ||
            !pose ||
            !pose.bones
        ) {
            return false;
        }

        const weight =
            THREE.MathUtils.clamp(
                Number.isFinite(
                    options.weight
                )
                    ? options.weight
                    : 1,
                0,
                1
            );

        const bones =
            options.bones
                ? this.resolveBones(
                      options.bones
                  )
                : this.resolveBones(
                      Object.keys(
                          pose.bones
                      )
                  );

        bones.forEach(
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
                    const position =
                        this.toVector3(
                            saved.position
                        );

                    bone.position.lerp(
                        position,
                        weight
                    );
                }

                if (
                    saved.quaternion
                ) {
                    const quaternion =
                        this.toQuaternion(
                            saved.quaternion
                        );

                    bone.quaternion.slerp(
                        quaternion,
                        weight
                    );
                } else if (
                    saved.rotation
                ) {
                    const quaternion =
                        this.toQuaternion(
                            saved.rotation
                        );

                    bone.quaternion.slerp(
                        quaternion,
                        weight
                    );
                }

                if (
                    saved.scale
                ) {
                    const scale =
                        this.toVector3(
                            saved.scale
                        );

                    bone.scale.lerp(
                        scale,
                        weight
                    );
                }

                bone.updateMatrixWorld(
                    true
                );
            }
        );

        this.emit(
            "poseApplied",
            {
                pose,
                weight,
                bones,
            }
        );

        return true;
    }

    blendPoses(
        poseA,
        poseB,
        weight,
        options = {}
    ) {
        if (
            !poseA ||
            !poseB
        ) {
            return null;
        }

        const amount =
            THREE.MathUtils.clamp(
                weight,
                0,
                1
            );

        const result = {
            name:
                options.name ||
                "Blended Pose",

            bones: {},
        };

        const names =
            new Set([
                ...Object.keys(
                    poseA.bones ||
                        {}
                ),
                ...Object.keys(
                    poseB.bones ||
                        {}
                ),
            ]);

        names.forEach(
            (name) => {
                const a =
                    poseA.bones[
                        name
                    ];

                const b =
                    poseB.bones[
                        name
                    ];

                if (
                    !a &&
                    !b
                ) {
                    return;
                }

                if (
                    !a
                ) {
                    result.bones[
                        name
                    ] =
                        this.cloneTransform(
                            b
                        );

                    return;
                }

                if (
                    !b
                ) {
                    result.bones[
                        name
                    ] =
                        this.cloneTransform(
                            a
                        );

                    return;
                }

                const position =
                    this.toVector3(
                        a.position
                    ).lerp(
                        this.toVector3(
                            b.position
                        ),
                        amount
                    );

                const quaternionA =
                    this.toQuaternion(
                        a.quaternion ||
                            a.rotation
                    );

                const quaternionB =
                    this.toQuaternion(
                        b.quaternion ||
                            b.rotation
                    );

                const quaternion =
                    quaternionA.slerp(
                        quaternionB,
                        amount
                    );

                const scale =
                    this.toVector3(
                        a.scale
                    ).lerp(
                        this.toVector3(
                            b.scale
                        ),
                        amount
                    );

                result.bones[
                    name
                ] = {
                    position,
                    quaternion,
                    rotation:
                        new THREE.Euler().setFromQuaternion(
                            quaternion
                        ),
                    scale,
                };
            }
        );

        return result;
    }

    applyChainRotation(
        chainId,
        rotations,
        options = {}
    ) {
        if (
            !this.enabled
        ) {
            return false;
        }

        const chain =
            this.getChain(
                chainId
            );

        if (
            !chain ||
            !chain.enabled
        ) {
            return false;
        }

        const bones =
            this.resolveBones(
                chain.bones
            );

        if (
            !Array.isArray(
                rotations
            )
        ) {
            return false;
        }

        bones.forEach(
            (
                bone,
                index
            ) => {
                if (
                    rotations[
                        index
                    ] ===
                    undefined
                ) {
                    return;
                }

                const weight =
                    THREE.MathUtils.clamp(
                        Number.isFinite(
                            options.weight
                        )
                            ? options.weight
                            : 1,
                        0,
                        1
                    );

                const target =
                    this.toQuaternion(
                        rotations[
                            index
                        ]
                    );

                bone.quaternion.slerp(
                    target,
                    weight
                );

                bone.updateMatrixWorld(
                    true
                );
            }
        );

        this.emit(
            "changed",
            {
                chain,
                property:
                    "rotation",
            }
        );

        return true;
    }

    resetBone(
        bone,
        reference = null
    ) {
        if (
            !bone
        ) {
            return false;
        }

        if (
            reference
        ) {
            if (
                reference.position
            ) {
                bone.position.copy(
                    this.toVector3(
                        reference.position
                    )
                );
            }

            if (
                reference.quaternion
            ) {
                bone.quaternion.copy(
                    this.toQuaternion(
                        reference.quaternion
                    )
                );
            } else if (
                reference.rotation
            ) {
                bone.quaternion.copy(
                    this.toQuaternion(
                        reference.rotation
                    )
                );
            }

            if (
                reference.scale
            ) {
                bone.scale.copy(
                    this.toVector3(
                        reference.scale
                    )
                );
            }
        } else {
            bone.position.set(
                0,
                0,
                0
            );

            bone.quaternion.identity();

            bone.scale.set(
                1,
                1,
                1
            );
        }

        bone.updateMatrixWorld(
            true
        );

        this.emit(
            "changed",
            {
                bone,
                property:
                    "reset",
            }
        );

        return true;
    }

    resetChain(
        chainId,
        pose = null
    ) {
        const chain =
            this.getChain(
                chainId
            );

        if (
            !chain
        ) {
            return false;
        }

        const bones =
            this.resolveBones(
                chain.bones
            );

        bones.forEach(
            (bone) => {
                const reference =
                    pose?.bones?.[
                        bone.name
                    ] || null;

                this.resetBone(
                    bone,
                    reference
                );
            }
        );

        return true;
    }

    solve(
        chainId
    ) {
        const chain =
            this.getChain(
                chainId
            );

        if (
            !chain ||
            !chain.enabled
        ) {
            return null;
        }

        const bones =
            this.resolveBones(
                chain.bones
            );

        if (
            bones.length ===
            0
        ) {
            return null;
        }

        bones.forEach(
            (bone) => {
                bone.updateMatrixWorld(
                    true
                );
            }
        );

        return bones.map(
            (bone) =>
                this.getBoneTransform(
                    bone,
                    "world"
                )
        );
    }

    solveAll() {
        const results = [];

        this.chains.forEach(
            (chain) => {
                const result =
                    this.solve(
                        chain.id
                    );

                if (
                    result
                ) {
                    results.push({
                        chain,
                        result,
                    });
                }
            }
        );

        return results;
    }

    resolveBones(
        bones
    ) {
        if (
            bones ===
            null ||
            bones ===
            undefined
        ) {
            if (
                this.skeleton?.bones
            ) {
                return this.skeleton.bones.slice();
            }

            return [];
        }

        if (
            !Array.isArray(
                bones
            )
        ) {
            bones = [
                bones,
            ];
        }

        return bones
            .map(
                (bone) => {
                    if (
                        typeof bone ===
                        "string"
                    ) {
                        return this.findBone(
                            bone
                        );
                    }

                    return bone;
                }
            )
            .filter(
                Boolean
            );
    }

    findBone(
        name
    ) {
        if (
            this.skeleton
        ) {
            if (
                typeof this.skeleton.getBone ===
                "function"
            ) {
                const bone =
                    this.skeleton.getBone(
                        name
                    );

                if (
                    bone
                ) {
                    return bone;
                }
            }

            if (
                typeof this.skeleton.findBone ===
                "function"
            ) {
                const bone =
                    this.skeleton.findBone(
                        name
                    );

                if (
                    bone
                ) {
                    return bone;
                }
            }

            if (
                Array.isArray(
                    this.skeleton.bones
                )
            ) {
                const bone =
                    this.skeleton.bones.find(
                        (
                            item
                        ) =>
                            item.name ===
                            name
                    );

                if (
                    bone
                ) {
                    return bone;
                }
            }
        }

        if (
            this.scene &&
            typeof this.scene.getObjectByName ===
                "function"
        ) {
            return this.scene.getObjectByName(
                name
            );
        }

        return null;
    }

    getWorldPosition(
        bone
    ) {
        const position =
            new THREE.Vector3();

        if (
            bone &&
            typeof bone.getWorldPosition ===
                "function"
        ) {
            bone.getWorldPosition(
                position
            );
        }

        return position;
    }

    setWorldPosition(
        bone,
        position
    ) {
        if (
            !bone
        ) {
            return false;
        }

        const value =
            this.toVector3(
                position
            );

        if (
            bone.parent
        ) {
            bone.parent.worldToLocal(
                value
            );
        }

        bone.position.copy(
            value
        );

        bone.updateMatrixWorld(
            true
        );

        return true;
    }

    setWorldQuaternion(
        bone,
        quaternion
    ) {
        if (
            !bone
        ) {
            return false;
        }

        const worldQuaternion =
            this.toQuaternion(
                quaternion
            );

        if (
            bone.parent
        ) {
            const parentQuaternion =
                new THREE.Quaternion();

            bone.parent.getWorldQuaternion(
                parentQuaternion
            );

            parentQuaternion
                .invert();

            bone.quaternion.copy(
                parentQuaternion.multiply(
                    worldQuaternion
                )
            );
        } else {
            bone.quaternion.copy(
                worldQuaternion
            );
        }

        bone.updateMatrixWorld(
            true
        );

        return true;
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
            value instanceof
            THREE.Euler
        ) {
            return new THREE.Quaternion()
                .setFromEuler(
                    value
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

        if (
            value &&
            typeof value.x ===
                "number" &&
            typeof value.y ===
                "number" &&
            typeof value.z ===
                "number"
        ) {
            return new THREE.Quaternion()
                .setFromEuler(
                    new THREE.Euler(
                        value.x,
                        value.y,
                        value.z
                    )
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
                return new THREE.Quaternion(
                    Number(
                        value[0] || 0
                    ),
                    Number(
                        value[1] || 0
                    ),
                    Number(
                        value[2] || 0
                    ),
                    Number(
                        value[3] ?? 1
                    )
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

        return new THREE.Quaternion();
    }

    cloneTransform(
        transform
    ) {
        if (
            !transform
        ) {
            return null;
        }

        const quaternion =
            transform.quaternion
                ? this.toQuaternion(
                      transform.quaternion
                  )
                : transform.rotation
                  ? this.toQuaternion(
                        transform.rotation
                    )
                  : new THREE.Quaternion();

        return {
            position:
                this.toVector3(
                    transform.position
                ),

            quaternion,

            rotation:
                new THREE.Euler().setFromQuaternion(
                    quaternion
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
                            `FK event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.clearChains();

        this.scene =
            null;

        this.skeleton =
            null;

        this.listeners = {
            chainAdded: [],
            chainRemoved: [],
            changed: [],
            poseApplied: [],
        };
    }
}
