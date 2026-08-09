import * as THREE from "three";

/**
 * Simple inverse-kinematics system for the 3D animator.
 *
 * Supports:
 * - Two-bone IK
 * - FABRIK chains
 * - Pole targets
 * - Position targets
 * - Iterative solving
 * - Applying solved rotations to THREE.Object3D bones
 */
export default class IKSystem {
    constructor(options = {}) {
        this.scene =
            options.scene || null;

        this.skeleton =
            options.skeleton || null;

        this.chains =
            new Map();

        this.enabled =
            true;

        this.maxIterations =
            Number.isFinite(
                options.maxIterations
            )
                ? options.maxIterations
                : 12;

        this.tolerance =
            Number.isFinite(
                options.tolerance
            )
                ? options.tolerance
                : 0.001;

        this.listeners = {
            chainAdded: [],
            chainRemoved: [],
            solved: [],
            changed: [],
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

    isEnabled() {
        return this.enabled;
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

            target:
                options.target ||
                null,

            pole:
                options.pole ||
                null,

            targetPosition:
                options.targetPosition
                    ? this.toVector3(
                          options.targetPosition
                      )
                    : new THREE.Vector3(),

            polePosition:
                options.polePosition
                    ? this.toVector3(
                          options.polePosition
                      )
                    : new THREE.Vector3(),

            enabled:
                options.enabled !==
                false,

            iterations:
                Number.isFinite(
                    options.iterations
                )
                    ? options.iterations
                    : this.maxIterations,

            tolerance:
                Number.isFinite(
                    options.tolerance
                )
                    ? options.tolerance
                    : this.tolerance,

            weight:
                Number.isFinite(
                    options.weight
                )
                    ? THREE.MathUtils.clamp(
                          options.weight,
                          0,
                          1
                      )
                    : 1,

            method:
                options.method ||
                "fabrik",

            preserveEndRotation:
                options.preserveEndRotation !==
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

    setTarget(
        chainId,
        target
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

        chain.target =
            target || null;

        return true;
    }

    setPole(
        chainId,
        pole
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

        chain.pole =
            pole || null;

        return true;
    }

    setTargetPosition(
        chainId,
        position
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

        chain.targetPosition.copy(
            this.toVector3(
                position
            )
        );

        return true;
    }

    setPolePosition(
        chainId,
        position
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

        chain.polePosition.copy(
            this.toVector3(
                position
            )
        );

        return true;
    }

    getTargetPosition(
        chain
    ) {
        if (
            chain.target
        ) {
            if (
                chain.target
                    .isObject3D
            ) {
                const position =
                    new THREE.Vector3();

                chain.target
                    .getWorldPosition(
                        position
                    );

                return position;
            }

            if (
                chain.target.position
            ) {
                return this.toVector3(
                    chain.target.position
                );
            }
        }

        return chain.targetPosition.clone();
    }

    getPolePosition(
        chain
    ) {
        if (
            chain.pole
        ) {
            if (
                chain.pole
                    .isObject3D
            ) {
                const position =
                    new THREE.Vector3();

                chain.pole
                    .getWorldPosition(
                        position
                    );

                return position;
            }

            if (
                chain.pole.position
            ) {
                return this.toVector3(
                    chain.pole.position
                );
            }
        }

        return chain.polePosition.clone();
    }

    solve(
        chainId
    ) {
        if (
            !this.enabled
        ) {
            return null;
        }

        const chain =
            typeof chainId ===
            "string"
                ? this.getChain(
                      chainId
                  )
                : chainId;

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
            bones.length <
            2
        ) {
            return null;
        }

        let result;

        if (
            chain.method ===
            "twoBone"
        ) {
            result =
                this.solveTwoBone(
                    bones,
                    this.getTargetPosition(
                        chain
                    ),
                    this.getPolePosition(
                        chain
                    )
                );
        } else {
            result =
                this.solveFABRIK(
                    bones,
                    this.getTargetPosition(
                        chain
                    ),
                );
        }

        if (
            result &&
            chain.pole
        ) {
            this.applyPoleConstraint(
                bones,
                this.getPolePosition(
                    chain
                )
            );
        }

        if (
            result &&
            chain.weight <
                1
        ) {
            this.applyWeight(
                bones,
                result.originalRotations,
                chain.weight
            );
        }

        this.emit(
            "solved",
            {
                chain,
                result,
            }
        );

        return result;
    }

    solveAll() {
        if (
            !this.enabled
        ) {
            return [];
        }

        const results = [];

        this.chains.forEach(
            (chain) => {
                const result =
                    this.solve(
                        chain
                    );

                if (
                    result
                ) {
                    results.push(
                        result
                    );
                }
            }
        );

        return results;
    }

    solveTwoBone(
        bones,
        target,
        pole
    ) {
        if (
            bones.length <
            2
        ) {
            return null;
        }

        const upper =
            bones[0];

        const lower =
            bones[
                bones.length - 1
            ];

        const originalRotations =
            bones.map(
                (bone) =>
                    bone.quaternion.clone()
            );

        const upperPosition =
            this.getWorldPosition(
                upper
            );

        const lowerPosition =
            this.getWorldPosition(
                lower
            );

        const endPosition =
            this.getEndPosition(
                lower
            );

        const upperLength =
            upperPosition.distanceTo(
                lowerPosition
            );

        const lowerLength =
            lowerPosition.distanceTo(
                endPosition
            );

        const targetDistance =
            upperPosition.distanceTo(
                target
            );

        const maxDistance =
            upperLength +
            lowerLength;

        const minDistance =
            Math.abs(
                upperLength -
                    lowerLength
            );

        const distance =
            THREE.MathUtils.clamp(
                targetDistance,
                minDistance +
                    0.0001,
                maxDistance -
                    0.0001
            );

        const direction =
            target
                .clone()
                .sub(
                    upperPosition
                )
                .normalize();

        const poleDirection =
            pole
                .clone()
                .sub(
                    upperPosition
                )
                .normalize();

        const bendDirection =
            new THREE.Vector3()
                .crossVectors(
                    direction,
                    new THREE.Vector3()
                        .crossVectors(
                            poleDirection,
                            direction
                        )
                        .normalize()
                )
                .normalize();

        const cosUpper =
            THREE.MathUtils.clamp(
                (
                    upperLength *
                        upperLength +
                    distance *
                        distance -
                    lowerLength *
                        lowerLength
                ) /
                    (
                        2 *
                        upperLength *
                        distance
                    ),
                -1,
                1
            );

        const upperAngle =
            Math.acos(
                cosUpper
            );

        const projectedTarget =
            upperPosition
                .clone()
                .add(
                    direction
                        .clone()
                        .multiplyScalar(
                            Math.cos(
                                upperAngle
                            ) *
                                upperLength
                        )
                )
                .add(
                    bendDirection
                        .clone()
                        .multiplyScalar(
                            Math.sin(
                                upperAngle
                            ) *
                                upperLength
                        )
                );

        this.rotateBoneToward(
            upper,
            projectedTarget,
            lowerPosition
        );

        this.updateWorld(
            upper
        );

        const newLowerPosition =
            this.getWorldPosition(
                lower
            );

        this.rotateBoneToward(
            lower,
            target,
            this.getEndPosition(
                lower
            )
        );

        this.updateWorld(
            lower
        );

        return {
            chainBones:
                bones,

            target:
                target.clone(),

            endPosition:
                this.getEndPosition(
                    lower
                ),

            distance:
                this.getEndPosition(
                    lower
                ).distanceTo(
                    target
                ),

            originalRotations,
        };
    }

    solveFABRIK(
        bones,
        target
    ) {
        const positions =
            bones.map(
                (bone) =>
                    this.getWorldPosition(
                        bone
                    )
            );

        const originalRotations =
            bones.map(
                (bone) =>
                    bone.quaternion.clone()
            );

        const lengths = [];

        for (
            let i = 0;
            i <
            positions.length -
                1;
            i++
        ) {
            lengths.push(
                positions[i].distanceTo(
                    positions[
                        i + 1
                    ]
                )
            );
        }

        const root =
            positions[0].clone();

        const totalLength =
            lengths.reduce(
                (
                    sum,
                    value
                ) =>
                    sum + value,
                0
            );

        const rootDistance =
            root.distanceTo(
                target
            );

        if (
            rootDistance >=
            totalLength
        ) {
            const direction =
                target
                    .clone()
                    .sub(root)
                    .normalize();

            positions[0].copy(
                root
            );

            for (
                let i = 1;
                i <
                positions.length;
                i++
            ) {
                positions[i]
                    .copy(
                        positions[
                            i - 1
                        ]
                    )
                    .add(
                        direction
                            .clone()
                            .multiplyScalar(
                                lengths[
                                    i - 1
                                ]
                            )
                    );
            }
        } else {
            for (
                let iteration = 0;
                iteration <
                    this.maxIterations;
                iteration++
            ) {
                positions[
                    positions.length - 1
                ].copy(
                    target
                );

                for (
                    let i =
                        positions.length -
                        2;
                    i >= 0;
                    i--
                ) {
                    const direction =
                        positions[i]
                            .clone()
                            .sub(
                                positions[
                                    i + 1
                                ]
                            )
                            .normalize();

                    positions[i].copy(
                        positions[
                            i + 1
                        ]
                    ).add(
                        direction.multiplyScalar(
                            lengths[i]
                        )
                    );
                }

                positions[0].copy(
                    root
                );

                for (
                    let i = 1;
                    i <
                    positions.length;
                    i++
                ) {
                    const direction =
                        positions[i]
                            .clone()
                            .sub(
                                positions[
                                    i - 1
                                ]
                            )
                            .normalize();

                    positions[i].copy(
                        positions[
                            i - 1
                        ]
                    ).add(
                        direction.multiplyScalar(
                            lengths[
                                i - 1
                            ]
                        )
                    );
                }

                const error =
                    positions[
                        positions.length -
                            1
                    ].distanceTo(
                        target
                    );

                if (
                    error <=
                    this.tolerance
                ) {
                    break;
                }
            }
        }

        for (
            let i = 0;
            i <
            bones.length - 1;
            i++
        ) {
            this.rotateBoneToward(
                bones[i],
                positions[i + 1],
                positions[i + 1]
            );

            this.updateWorld(
                bones[i]
            );
        }

        const lastBone =
            bones[
                bones.length - 1
            ];

        if (
            lastBone
        ) {
            this.rotateBoneToward(
                lastBone,
                target,
                this.getEndPosition(
                    lastBone
                )
            );

            this.updateWorld(
                lastBone
            );
        }

        return {
            chainBones:
                bones,

            target:
                target.clone(),

            endPosition:
                this.getEndPosition(
                    lastBone
                ),

            distance:
                this.getEndPosition(
                    lastBone
                ).distanceTo(
                    target
                ),

            originalRotations,
        };
    }

    rotateBoneToward(
        bone,
        desiredChildPosition,
        currentChildPosition
    ) {
        if (
            !bone
        ) {
            return;
        }

        const bonePosition =
            this.getWorldPosition(
                bone
            );

        const currentDirection =
            currentChildPosition
                .clone()
                .sub(
                    bonePosition
                )
                .normalize();

        const desiredDirection =
            desiredChildPosition
                .clone()
                .sub(
                    bonePosition
                )
                .normalize();

        if (
            currentDirection.lengthSq() <
                0.000001 ||
            desiredDirection.lengthSq() <
                0.000001
        ) {
            return;
        }

        const rotation =
            new THREE.Quaternion().setFromUnitVectors(
                currentDirection,
                desiredDirection
            );

        const worldQuaternion =
            new THREE.Quaternion();

        bone.getWorldQuaternion(
            worldQuaternion
        );

        worldQuaternion.premultiply(
            rotation
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
    }

    applyPoleConstraint(
        bones,
        pole
    ) {
        if (
            bones.length <
            3
        ) {
            return;
        }

        const root =
            this.getWorldPosition(
                bones[0]
            );

        const end =
            this.getEndPosition(
                bones[
                    bones.length - 1
                ]
            );

        const axis =
            end
                .clone()
                .sub(root)
                .normalize();

        if (
            axis.lengthSq() <
            0.000001
        ) {
            return;
        }

        for (
            let i = 1;
            i <
            bones.length - 1;
            i++
        ) {
            const joint =
                this.getWorldPosition(
                    bones[i]
                );

            const jointVector =
                joint
                    .clone()
                    .sub(root);

            const poleVector =
                pole
                    .clone()
                    .sub(root);

            const projectedJoint =
                this.projectOntoPlane(
                    jointVector,
                    axis
                );

            const projectedPole =
                this.projectOntoPlane(
                    poleVector,
                    axis
                );

            if (
                projectedJoint.lengthSq() <
                    0.000001 ||
                projectedPole.lengthSq() <
                    0.000001
            ) {
                continue;
            }

            projectedJoint.normalize();

            projectedPole.normalize();

            const angle =
                Math.acos(
                    THREE.MathUtils.clamp(
                        projectedJoint.dot(
                            projectedPole
                        ),
                        -1,
                        1
                    )
                );

            const cross =
                new THREE.Vector3()
                    .crossVectors(
                        projectedJoint,
                        projectedPole
                    );

            if (
                cross.dot(
                    axis
                ) < 0
            ) {
                angle =
                    -angle;
            }

            const rotation =
                new THREE.Quaternion()
                    .setFromAxisAngle(
                        axis,
                        angle
                    );

            const worldQuaternion =
                new THREE.Quaternion();

            bones[i].getWorldQuaternion(
                worldQuaternion
            );

            worldQuaternion.premultiply(
                rotation
            );

            if (
                bones[i].parent
            ) {
                const parentQuaternion =
                    new THREE.Quaternion();

                bones[i].parent.getWorldQuaternion(
                    parentQuaternion
                );

                parentQuaternion
                    .invert();

                bones[i].quaternion.copy(
                    parentQuaternion.multiply(
                        worldQuaternion
                    )
                );
            } else {
                bones[i].quaternion.copy(
                    worldQuaternion
                );
            }

            bones[i].updateMatrixWorld(
                true
            );
        }
    }

    applyWeight(
        bones,
        originalRotations,
        weight
    ) {
        const amount =
            THREE.MathUtils.clamp(
                weight,
                0,
                1
            );

        bones.forEach(
            (
                bone,
                index
            ) => {
                if (
                    !originalRotations[
                        index
                    ]
                ) {
                    return;
                }

                bone.quaternion.slerp(
                    originalRotations[
                        index
                    ],
                    1 - amount
                );

                bone.updateMatrixWorld(
                    true
                );
            }
        );
    }

    getWorldPosition(
        object
    ) {
        if (
            !object
        ) {
            return new THREE.Vector3();
        }

        if (
            object.isObject3D
        ) {
            const position =
                new THREE.Vector3();

            object.getWorldPosition(
                position
            );

            return position;
        }

        if (
            object.position
        ) {
            return this.toVector3(
                object.position
            );
        }

        return this.toVector3(
            object
        );
    }

    getEndPosition(
        bone
    ) {
        if (
            !bone
        ) {
            return new THREE.Vector3();
        }

        const end =
            new THREE.Vector3(
                0,
                1,
                0
            );

        if (
            bone.geometry &&
            bone.geometry.boundingBox
        ) {
            const box =
                bone.geometry.boundingBox;

            end.set(
                0,
                box.max.y,
                0
            );
        }

        if (
            bone.isBone
        ) {
            const world =
                new THREE.Vector3();

            bone.localToWorld(
                end
            );

            world.copy(
                end
            );

            return world;
        }

        if (
            bone.children &&
            bone.children.length
        ) {
            return this.getWorldPosition(
                bone.children[
                    bone.children.length -
                        1
                ]
            );
        }

        return this.getWorldPosition(
            bone
        );
    }

    resolveBones(
        bones
    ) {
        if (
            !Array.isArray(
                bones
            )
        ) {
            return [];
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
                this.skeleton.bones
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

    updateWorld(
        object
    ) {
        if (
            object &&
            typeof object.updateMatrixWorld ===
                "function"
        ) {
            object.updateMatrixWorld(
                true
            );
        }
    }

    projectOntoPlane(
        vector,
        normal
    ) {
        return vector
            .clone()
            .sub(
                normal
                    .clone()
                    .multiplyScalar(
                        vector.dot(
                            normal
                        )
                    )
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

        return new THREE.Vector3();
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
                            `IK event error (${event}):`,
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
            solved: [],
            changed: [],
        };
    }
}
