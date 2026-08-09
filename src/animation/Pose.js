import * as THREE from "three";

/**
 * Pose management system.
 *
 * Handles:
 * - Creating poses
 * - Capturing poses from a skeleton
 * - Applying poses
 * - Blending poses
 * - Mirroring poses
 * - Copying and resetting poses
 * - Serializing poses for project saving
 */
export default class PoseSystem {
    constructor(options = {}) {
        this.scene =
            options.scene || null;

        this.skeleton =
            options.skeleton || null;

        this.poses =
            new Map();

        this.currentPose =
            null;

        this.listeners = {
            poseCreated: [],
            poseRemoved: [],
            poseApplied: [],
            poseChanged: [],
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

    createPose(
        name = "Pose",
        options = {}
    ) {
        let poseName =
            String(
                name ||
                    "Pose"
            );

        if (
            this.poses.has(
                poseName
            )
        ) {
            let index = 2;

            while (
                this.poses.has(
                    `${poseName}.${String(
                        index
                    ).padStart(
                        3,
                        "0"
                    )}`
                )
            ) {
                index++;
            }

            poseName =
                `${poseName}.${String(
                    index
                ).padStart(
                    3,
                    "0"
                )}`;
        }

        const pose = {
            id:
                options.id ||
                this.createId(),

            name:
                poseName,

            bones: {},

            metadata:
                options.metadata
                    ? {
                          ...options.metadata,
                      }
                    : {},

            createdAt:
                options.createdAt ||
                Date.now(),

            modifiedAt:
                Date.now(),
        };

        this.poses.set(
            poseName,
            pose
        );

        this.emit(
            "poseCreated",
            pose
        );

        return pose;
    }

    addPose(
        pose
    ) {
        if (
            !pose
        ) {
            return null;
        }

        const copy =
            this.clonePose(
                pose
            );

        if (
            !copy.name
        ) {
            copy.name =
                "Pose";
        }

        this.poses.set(
            copy.name,
            copy
        );

        this.emit(
            "poseCreated",
            copy
        );

        return copy;
    }

    removePose(
        name
    ) {
        const pose =
            this.poses.get(
                name
            );

        if (
            !pose
        ) {
            return false;
        }

        this.poses.delete(
            name
        );

        if (
            this.currentPose ===
            pose
        ) {
            this.currentPose =
                null;
        }

        this.emit(
            "poseRemoved",
            pose
        );

        return true;
    }

    renamePose(
        oldName,
        newName
    ) {
        const pose =
            this.poses.get(
                oldName
            );

        if (
            !pose
        ) {
            return false;
        }

        const name =
            String(
                newName ||
                    oldName
            ).trim();

        if (
            !name
        ) {
            return false;
        }

        if (
            name !==
                oldName &&
            this.poses.has(
                name
            )
        ) {
            return false;
        }

        this.poses.delete(
            oldName
        );

        pose.name =
            name;

        pose.modifiedAt =
            Date.now();

        this.poses.set(
            name,
            pose
        );

        this.emit(
            "poseChanged",
            pose
        );

        return true;
    }

    getPose(
        name
    ) {
        return (
            this.poses.get(
                name
            ) || null
        );
    }

    getPoses() {
        return Array.from(
            this.poses.values()
        );
    }

    clear() {
        this.poses.clear();

        this.currentPose =
            null;
    }

    capture(
        name = "Pose",
        bones = null,
        options = {}
    ) {
        const pose =
            this.createPose(
                name,
                options
            );

        const resolvedBones =
            this.resolveBones(
                bones
            );

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
                ] =
                    this.captureBone(
                        bone
                    );
            }
        );

        pose.modifiedAt =
            Date.now();

        this.emit(
            "poseChanged",
            pose
        );

        return pose;
    }

    captureBone(
        bone
    ) {
        if (
            !bone
        ) {
            return null;
        }

        return {
            position:
                bone.position.toArray(),

            quaternion:
                bone.quaternion.toArray(),

            rotation: [
                bone.rotation.x,
                bone.rotation.y,
                bone.rotation.z,
            ],

            scale:
                bone.scale.toArray(),
        };
    }

    apply(
        pose,
        options = {}
    ) {
        if (
            !pose
        ) {
            return false;
        }

        const actualPose =
            typeof pose ===
            "string"
                ? this.getPose(
                      pose
                  )
                : pose;

        if (
            !actualPose
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

        const names =
            options.bones
                ? this.resolveBones(
                      options.bones
                  ).map(
                      (
                          bone
                      ) =>
                          bone.name
                  )
                : Object.keys(
                      actualPose.bones ||
                          {}
                  );

        names.forEach(
            (name) => {
                const bone =
                    this.findBone(
                        name
                    );

                const saved =
                    actualPose.bones?.[
                        name
                    ];

                if (
                    !bone ||
                    !saved
                ) {
                    return;
                }

                this.applyBone(
                    bone,
                    saved,
                    weight
                );
            }
        );

        this.currentPose =
            actualPose;

        this.emit(
            "poseApplied",
            {
                pose:
                    actualPose,

                weight,
            }
        );

        return true;
    }

    applyBone(
        bone,
        saved,
        weight = 1
    ) {
        if (
            !bone ||
            !saved
        ) {
            return false;
        }

        const amount =
            THREE.MathUtils.clamp(
                weight,
                0,
                1
            );

        if (
            saved.position
        ) {
            const target =
                new THREE.Vector3()
                    .fromArray(
                        saved.position
                    );

            bone.position.lerp(
                target,
                amount
            );
        }

        if (
            saved.quaternion
        ) {
            const target =
                new THREE.Quaternion()
                    .fromArray(
                        saved.quaternion
                    );

            bone.quaternion.slerp(
                target,
                amount
            );
        } else if (
            saved.rotation
        ) {
            const target =
                new THREE.Euler(
                    saved.rotation[0] ||
                        0,
                    saved.rotation[1] ||
                        0,
                    saved.rotation[2] ||
                        0,
                    bone.rotation.order
                );

            const quaternion =
                new THREE.Quaternion()
                    .setFromEuler(
                        target
                    );

            bone.quaternion.slerp(
                quaternion,
                amount
            );
        }

        if (
            saved.scale
        ) {
            const target =
                new THREE.Vector3()
                    .fromArray(
                        saved.scale
                    );

            bone.scale.lerp(
                target,
                amount
            );
        }

        bone.updateMatrixWorld(
            true
        );

        return true;
    }

    updatePoseFromSkeleton(
        pose,
        bones = null
    ) {
        const actualPose =
            typeof pose ===
            "string"
                ? this.getPose(
                      pose
                  )
                : pose;

        if (
            !actualPose
        ) {
            return false;
        }

        const resolvedBones =
            this.resolveBones(
                bones
            );

        resolvedBones.forEach(
            (bone) => {
                if (
                    !bone ||
                    !bone.name
                ) {
                    return;
                }

                actualPose.bones[
                    bone.name
                ] =
                    this.captureBone(
                        bone
                    );
            }
        );

        actualPose.modifiedAt =
            Date.now();

        this.emit(
            "poseChanged",
            actualPose
        );

        return true;
    }

    blend(
        poseA,
        poseB,
        weight,
        options = {}
    ) {
        const a =
            typeof poseA ===
            "string"
                ? this.getPose(
                      poseA
                  )
                : poseA;

        const b =
            typeof poseB ===
            "string"
                ? this.getPose(
                      poseB
                  )
                : poseB;

        if (
            !a ||
            !b
        ) {
            return null;
        }

        const amount =
            THREE.MathUtils.clamp(
                Number(
                    weight
                ) || 0,
                0,
                1
            );

        const result = {
            id:
                this.createId(),

            name:
                options.name ||
                `${a.name} + ${b.name}`,

            bones: {},

            metadata: {
                blendedFrom: [
                    a.name,
                    b.name,
                ],
            },

            createdAt:
                Date.now(),

            modifiedAt:
                Date.now(),
        };

        const names =
            new Set([
                ...Object.keys(
                    a.bones ||
                        {}
                ),
                ...Object.keys(
                    b.bones ||
                        {}
                ),
            ]);

        names.forEach(
            (name) => {
                const boneA =
                    a.bones?.[
                        name
                    ];

                const boneB =
                    b.bones?.[
                        name
                    ];

                if (
                    boneA &&
                    boneB
                ) {
                    result.bones[
                        name
                    ] =
                        this.blendBone(
                            boneA,
                            boneB,
                            amount
                        );
                } else if (
                    boneA
                ) {
                    result.bones[
                        name
                    ] =
                        this.cloneBone(
                            boneA
                        );
                } else if (
                    boneB
                ) {
                    result.bones[
                        name
                    ] =
                        this.cloneBone(
                            boneB
                        );
                }
            }
        );

        return result;
    }

    blendBone(
        boneA,
        boneB,
        weight
    ) {
        const positionA =
            this.toVector3(
                boneA.position
            );

        const positionB =
            this.toVector3(
                boneB.position
            );

        const position =
            positionA.lerp(
                positionB,
                weight
            );

        const quaternionA =
            this.toQuaternion(
                boneA
            );

        const quaternionB =
            this.toQuaternion(
                boneB
            );

        const quaternion =
            quaternionA.slerp(
                quaternionB,
                weight
            );

        const scaleA =
            this.toVector3(
                boneA.scale ||
                    [
                        1,
                        1,
                        1,
                    ]
            );

        const scaleB =
            this.toVector3(
                boneB.scale ||
                    [
                        1,
                        1,
                        1,
                    ]
            );

        const scale =
            scaleA.lerp(
                scaleB,
                weight
            );

        const rotation =
            new THREE.Euler()
                .setFromQuaternion(
                    quaternion
                );

        return {
            position:
                position.toArray(),

            quaternion:
                quaternion.toArray(),

            rotation: [
                rotation.x,
                rotation.y,
                rotation.z,
            ],

            scale:
                scale.toArray(),
        };
    }

    mirror(
        pose,
        options = {}
    ) {
        const actualPose =
            typeof pose ===
            "string"
                ? this.getPose(
                      pose
                  )
                : pose;

        if (
            !actualPose
        ) {
            return null;
        }

        const result = {
            id:
                this.createId(),

            name:
                options.name ||
                `${actualPose.name} Mirrored`,

            bones: {},

            metadata: {
                mirroredFrom:
                    actualPose.name,
            },

            createdAt:
                Date.now(),

            modifiedAt:
                Date.now(),
        };

        Object.entries(
            actualPose.bones ||
                {}
        ).forEach(
            ([
                name,
                bone,
            ]) => {
                const mirroredName =
                    this.getMirroredBoneName(
                        name,
                        options
                    );

                result.bones[
                    mirroredName
                ] =
                    this.mirrorBone(
                        bone
                    );
            }
        );

        return result;
    }

    mirrorBone(
        bone
    ) {
        const quaternion =
            this.toQuaternion(
                bone
            );

        /*
         * Mirror across the X axis.
         *
         * Quaternion reflection:
         * x remains unchanged while
         * Y/Z are inverted.
         */
        const mirroredQuaternion =
            new THREE.Quaternion(
                quaternion.x,
                -quaternion.y,
                -quaternion.z,
                quaternion.w
            );

        const position =
            this.toVector3(
                bone.position
            );

        position.x *=
            -1;

        const rotation =
            new THREE.Euler()
                .setFromQuaternion(
                    mirroredQuaternion
                );

        return {
            position:
                position.toArray(),

            quaternion:
                mirroredQuaternion.toArray(),

            rotation: [
                rotation.x,
                rotation.y,
                rotation.z,
            ],

            scale:
                this.toVector3(
                    bone.scale ||
                        [
                            1,
                            1,
                            1,
                        ]
                ).toArray(),
        };
    }

    getMirroredBoneName(
        name,
        options = {}
    ) {
        const leftTokens =
            options.leftTokens ||
            [
                "Left",
                "left",
                "_L",
                ".L",
                "-L",
            ];

        const rightTokens =
            options.rightTokens ||
            [
                "Right",
                "right",
                "_R",
                ".R",
                "-R",
            ];

        for (
            let i = 0;
            i <
            leftTokens.length;
            i++
        ) {
            if (
                name.includes(
                    leftTokens[i]
                )
            ) {
                return name.replace(
                    leftTokens[i],
                    rightTokens[
                        Math.min(
                            i,
                            rightTokens.length -
                                1
                        )
                    ]
                );
            }
        }

        for (
            let i = 0;
            i <
            rightTokens.length;
            i++
        ) {
            if (
                name.includes(
                    rightTokens[i]
                )
            ) {
                return name.replace(
                    rightTokens[i],
                    leftTokens[
                        Math.min(
                            i,
                            leftTokens.length -
                                1
                        )
                    ]
                );
            }
        }

        return name;
    }

    duplicate(
        pose,
        name = null
    ) {
        const actualPose =
            typeof pose ===
            "string"
                ? this.getPose(
                      pose
                  )
                : pose;

        if (
            !actualPose
        ) {
            return null;
        }

        let newName =
            name ||
            `${actualPose.name} Copy`;

        let index = 2;

        while (
            this.poses.has(
                newName
            )
        ) {
            newName =
                `${actualPose.name} Copy ${index}`;
            index++;
        }

        const copy =
            this.clonePose(
                actualPose
            );

        copy.id =
            this.createId();

        copy.name =
            newName;

        copy.createdAt =
            Date.now();

        copy.modifiedAt =
            Date.now();

        this.poses.set(
            newName,
            copy
        );

        this.emit(
            "poseCreated",
            copy
        );

        return copy;
    }

    clonePose(
        pose
    ) {
        const copy = {
            id:
                pose.id ||
                this.createId(),

            name:
                pose.name ||
                "Pose",

            bones: {},

            metadata: {
                ...(pose.metadata ||
                    {}),
            },

            createdAt:
                pose.createdAt ||
                Date.now(),

            modifiedAt:
                pose.modifiedAt ||
                Date.now(),
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
                ] =
                    this.cloneBone(
                        bone
                    );
            }
        );

        return copy;
    }

    cloneBone(
        bone
    ) {
        return {
            position:
                this.toVector3(
                    bone.position
                ).toArray(),

            quaternion:
                this.toQuaternion(
                    bone
                ).toArray(),

            rotation:
                bone.rotation
                    ? [
                          bone.rotation[
                              0
                          ] || 0,
                          bone.rotation[
                              1
                          ] || 0,
                          bone.rotation[
                              2
                          ] || 0,
                      ]
                    : [
                          0,
                          0,
                          0,
                      ],

            scale:
                this.toVector3(
                    bone.scale ||
                        [
                            1,
                            1,
                            1,
                        ]
                ).toArray(),
        };
    }

    reset(
        bones = null
    ) {
        const resolvedBones =
            this.resolveBones(
                bones
            );

        resolvedBones.forEach(
            (bone) => {
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

                bone.updateMatrixWorld(
                    true
                );
            }
        );

        return true;
    }

    serialize(
        pose
    ) {
        const actualPose =
            typeof pose ===
            "string"
                ? this.getPose(
                      pose
                  )
                : pose;

        if (
            !actualPose
        ) {
            return null;
        }

        return JSON.stringify(
            this.clonePose(
                actualPose
            )
        );
    }

    deserialize(
        data
    ) {
        try {
            const pose =
                typeof data ===
                "string"
                    ? JSON.parse(
                          data
                      )
                    : data;

            if (
                !pose ||
                !pose.bones
            ) {
                return null;
            }

            return this.clonePose(
                pose
            );
        } catch (
            error
        ) {
            console.error(
                "Failed to deserialize pose:",
                error
            );

            return null;
        }
    }

    savePose(
        pose
    ) {
        const actualPose =
            typeof pose ===
            "string"
                ? this.getPose(
                      pose
                  )
                : pose;

        if (
            !actualPose
        ) {
            return false;
        }

        this.poses.set(
            actualPose.name,
            actualPose
        );

        actualPose.modifiedAt =
            Date.now();

        this.emit(
            "poseChanged",
            actualPose
        );

        return true;
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
                Array.isArray(
                    this.skeleton?.bones
                )
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

        return new THREE.Quaternion();
    }

    createId() {
        return (
            "pose_" +
            Date.now().toString(
                36
            ) +
            "_" +
            Math.random()
                .toString(
                    36
                )
                .slice(
                    2,
                    8
                )
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
                            `Pose event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.clear();

        this.scene =
            null;

        this.skeleton =
            null;

        this.listeners = {
            poseCreated: [],
            poseRemoved: [],
            poseApplied: [],
            poseChanged: [],
        };
    }
}
