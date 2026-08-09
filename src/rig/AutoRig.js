import * as THREE from "three";
import Skeleton from "./Skeleton.js";
import RigDetector from "../import/RigDetector.js";

export default class AutoRig {
    constructor(options = {}) {
        this.options = {
            createMissingBones:
                options.createMissingBones !==
                false,

            createHelperSkeleton:
                options.createHelperSkeleton !==
                false,

            autoWeight:
                options.autoWeight !==
                false,

            preserveOriginal:
                options.preserveOriginal !==
                false,
        };

        this.detector =
            options.detector ||
            new RigDetector();

        this.skeleton =
            options.skeleton ||
            null;

        this.object =
            options.object ||
            null;

        this.result =
            null;

        this.listeners = {
            started: [],
            progress: [],
            completed: [],
            error: [],
        };
    }

    setObject(
        object
    ) {
        this.object =
            object ||
            null;

        return this;
    }

    setSkeleton(
        skeleton
    ) {
        this.skeleton =
            skeleton ||
            null;

        return this;
    }

    analyze(
        object = this.object
    ) {
        if (
            !object ||
            !object.isObject3D
        ) {
            throw new Error(
                "AutoRig: a valid Three.js Object3D is required."
            );
        }

        this.object =
            object;

        const detection =
            this.detector.detect(
                object
            );

        const skeleton =
            new Skeleton({
                object,
            });

        this.skeleton =
            skeleton;

        const mapping =
            this.createBoneMapping(
                detection,
                skeleton
            );

        const result = {
            object,
            detection,
            skeleton,
            mapping,
            ready:
                detection.detected &&
                skeleton.hasBones(),
        };

        this.result =
            result;

        return result;
    }

    async rig(
        object = this.object,
        options = {}
    ) {
        if (
            !object ||
            !object.isObject3D
        ) {
            throw new Error(
                "AutoRig: a valid Three.js Object3D is required."
            );
        }

        this.object =
            object;

        const settings = {
            ...this.options,
            ...options,
        };

        this.emit(
            "started",
            {
                object,
            }
        );

        try {
            this.reportProgress(
                0.1,
                "Analyzing model"
            );

            const analysis =
                this.analyze(
                    object
                );

            this.reportProgress(
                0.3,
                "Mapping skeleton"
            );

            let mapping =
                analysis.mapping;

            if (
                settings.createMissingBones &&
                mapping.missing.length >
                    0
            ) {
                this.reportProgress(
                    0.45,
                    "Creating missing bones"
                );

                mapping =
                    this.createMissingBones(
                        mapping,
                        object,
                        settings
                    );
            }

            this.reportProgress(
                0.6,
                "Preparing rig"
            );

            const rig =
                this.createRig(
                    analysis,
                    mapping,
                    settings
                );

            this.reportProgress(
                0.8,
                "Applying rig"
            );

            this.applyRig(
                rig,
                settings
            );

            if (
                settings.autoWeight
            ) {
                this.reportProgress(
                    0.9,
                    "Calculating weights"
                );

                this.calculateWeights(
                    rig,
                    settings
                );
            }

            this.reportProgress(
                1,
                "Rig complete"
            );

            const result = {
                ...analysis,

                mapping,

                rig,

                success: true,
            };

            this.result =
                result;

            this.emit(
                "completed",
                result
            );

            return result;
        } catch (
            error
        ) {
            this.emit(
                "error",
                {
                    object,
                    error,
                }
            );

            throw error;
        }
    }

    createBoneMapping(
        detection,
        skeleton
    ) {
        const mapping = {
            root:
                null,

            hips:
                null,

            pelvis:
                null,

            spine:
                null,

            chest:
                null,

            neck:
                null,

            head:
                null,

            leftShoulder:
                null,

            rightShoulder:
                null,

            leftUpperArm:
                null,

            rightUpperArm:
                null,

            leftForearm:
                null,

            rightForearm:
                null,

            leftHand:
                null,

            rightHand:
                null,

            leftUpperLeg:
                null,

            rightUpperLeg:
                null,

            leftLowerLeg:
                null,

            rightLowerLeg:
                null,

            leftFoot:
                null,

            rightFoot:
                null,

            leftToes:
                null,

            rightToes:
                null,

            missing: [],
        };

        const landmarks =
            detection?.landmarks ||
            {};

        Object.keys(
            mapping
        ).forEach(
            (key) => {
                if (
                    key ===
                    "missing"
                ) {
                    return;
                }

                mapping[key] =
                    landmarks[
                        key
                    ] ||
                    this.findFallbackBone(
                        skeleton,
                        key
                    );
            }
        );

        Object.keys(
            mapping
        ).forEach(
            (key) => {
                if (
                    key ===
                    "missing"
                ) {
                    return;
                }

                if (
                    !mapping[key]
                ) {
                    mapping.missing.push(
                        key
                    );
                }
            }
        );

        return mapping;
    }

    findFallbackBone(
        skeleton,
        role
    ) {
        const keywords =
            this.getRoleKeywords(
                role
            );

        if (
            !keywords.length
        ) {
            return null;
        }

        for (
            const keyword of keywords
        ) {
            const bone =
                skeleton.findBone(
                    keyword
                );

            if (
                bone
            ) {
                return bone;
            }
        }

        return null;
    }

    getRoleKeywords(
        role
    ) {
        const keywords = {
            root: [
                "root",
                "armature",
                "rig",
            ],

            hips: [
                "hips",
                "hip",
                "pelvis",
            ],

            pelvis: [
                "pelvis",
                "hips",
            ],

            spine: [
                "spine",
                "spine1",
            ],

            chest: [
                "chest",
                "spine2",
            ],

            neck: [
                "neck",
            ],

            head: [
                "head",
            ],

            leftShoulder: [
                "left_shoulder",
                "leftshoulder",
                "shoulder_l",
                "clavicle_l",
            ],

            rightShoulder: [
                "right_shoulder",
                "rightshoulder",
                "shoulder_r",
                "clavicle_r",
            ],

            leftUpperArm: [
                "left_upper_arm",
                "leftupperarm",
                "upperarm_l",
                "arm_l",
            ],

            rightUpperArm: [
                "right_upper_arm",
                "rightupperarm",
                "upperarm_r",
                "arm_r",
            ],

            leftForearm: [
                "left_forearm",
                "leftforearm",
                "forearm_l",
                "lowerarm_l",
            ],

            rightForearm: [
                "right_forearm",
                "rightforearm",
                "forearm_r",
                "lowerarm_r",
            ],

            leftHand: [
                "left_hand",
                "lefthand",
                "hand_l",
            ],

            rightHand: [
                "right_hand",
                "righthand",
                "hand_r",
            ],

            leftUpperLeg: [
                "left_thigh",
                "leftthigh",
                "thigh_l",
                "upperleg_l",
            ],

            rightUpperLeg: [
                "right_thigh",
                "rightthigh",
                "thigh_r",
                "upperleg_r",
            ],

            leftLowerLeg: [
                "left_calf",
                "leftcalf",
                "calf_l",
                "shin_l",
                "lowerleg_l",
            ],

            rightLowerLeg: [
                "right_calf",
                "rightcalf",
                "calf_r",
                "shin_r",
                "lowerleg_r",
            ],

            leftFoot: [
                "left_foot",
                "leftfoot",
                "foot_l",
            ],

            rightFoot: [
                "right_foot",
                "rightfoot",
                "foot_r",
            ],

            leftToes: [
                "left_toes",
                "lefttoes",
                "toe_l",
                "toes_l",
            ],

            rightToes: [
                "right_toes",
                "righttoes",
                "toe_r",
                "toes_r",
            ],
        };

        return keywords[
            role
        ] || [];
    }

    createMissingBones(
        mapping,
        object,
        options = {}
    ) {
        const updated = {
            ...mapping,
            missing: [
                ...mapping.missing,
            ],
            created: [],
        };

        const skeleton =
            this.skeleton;

        if (
            !skeleton
        ) {
            return updated;
        }

        const root =
            mapping.root ||
            skeleton.getRootBones()[0] ||
            object;

        for (
            const role of mapping.missing
        ) {
            const bone =
                this.createBoneForRole(
                    role,
                    mapping,
                    root,
                    options
                );

            if (
                bone
            ) {
                updated[role] =
                    bone;

                updated.created.push(
                    bone
                );
            }
        }

        updated.missing =
            Object.keys(
                updated
            ).filter(
                (key) =>
                    key !==
                        "missing" &&
                    key !==
                        "created" &&
                    !updated[key]
            );

        return updated;
    }

    createBoneForRole(
        role,
        mapping,
        root,
        options
    ) {
        const position =
            this.estimateBonePosition(
                role,
                mapping
            );

        if (
            !position
        ) {
            return null;
        }

        const bone =
            new THREE.Bone();

        bone.name =
            this.roleToBoneName(
                role
            );

        bone.position.copy(
            position
        );

        bone.userData =
            bone.userData ||
            {};

        bone.userData.autoRig =
            true;

        bone.userData.rigRole =
            role;

        const parent =
            this.findRoleParent(
                role,
                mapping
            ) ||
            root;

        if (
            parent &&
            parent.isObject3D
        ) {
            parent.add(
                bone
            );
        } else if (
            this.object
        ) {
            this.object.add(
                bone
            );
        }

        if (
            this.skeleton
        ) {
            this.skeleton.bones.push(
                bone
            );

            this.skeleton.boneMap.set(
                bone.uuid,
                bone
            );

            this.skeleton.boneMap.set(
                bone.name,
                bone
            );
        }

        return bone;
    }

    findRoleParent(
        role,
        mapping
    ) {
        const parents = {
            root: null,

            hips:
                mapping.root,

            pelvis:
                mapping.root,

            spine:
                mapping.hips ||
                mapping.pelvis,

            chest:
                mapping.spine,

            neck:
                mapping.chest ||
                mapping.spine,

            head:
                mapping.neck,

            leftShoulder:
                mapping.chest ||
                mapping.spine,

            rightShoulder:
                mapping.chest ||
                mapping.spine,

            leftUpperArm:
                mapping.leftShoulder ||
                mapping.chest,

            rightUpperArm:
                mapping.rightShoulder ||
                mapping.chest,

            leftForearm:
                mapping.leftUpperArm,

            rightForearm:
                mapping.rightUpperArm,

            leftHand:
                mapping.leftForearm,

            rightHand:
                mapping.rightForearm,

            leftUpperLeg:
                mapping.hips ||
                mapping.pelvis,

            rightUpperLeg:
                mapping.hips ||
                mapping.pelvis,

            leftLowerLeg:
                mapping.leftUpperLeg,

            rightLowerLeg:
                mapping.rightUpperLeg,

            leftFoot:
                mapping.leftLowerLeg,

            rightFoot:
                mapping.rightLowerLeg,

            leftToes:
                mapping.leftFoot,

            rightToes:
                mapping.rightFoot,
        };

        return (
            parents[role] ||
            null
        );
    }

    estimateBonePosition(
        role,
        mapping
    ) {
        const parent =
            this.findRoleParent(
                role,
                mapping
            );

        const parentPosition =
            parent
                ? this.getWorldPosition(
                      parent
                  )
                : new THREE.Vector3();

        const reference =
            this.getRoleReference(
                role,
                mapping
            );

        if (
            reference
        ) {
            const world =
                this.getWorldPosition(
                    reference
                );

            if (
                parent
            ) {
                const local =
                    parent.worldToLocal(
                        world.clone()
                    );

                return local;
            }

            return world;
        }

        const offsets = {
            hips:
                new THREE.Vector3(
                    0,
                    0,
                    0
                ),

            pelvis:
                new THREE.Vector3(
                    0,
                    0,
                    0
                ),

            spine:
                new THREE.Vector3(
                    0,
                    0.2,
                    0
                ),

            chest:
                new THREE.Vector3(
                    0,
                    0.25,
                    0
                ),

            neck:
                new THREE.Vector3(
                    0,
                    0.2,
                    0
                ),

            head:
                new THREE.Vector3(
                    0,
                    0.2,
                    0
                ),

            leftShoulder:
                new THREE.Vector3(
                    -0.2,
                    0,
                    0
                ),

            rightShoulder:
                new THREE.Vector3(
                    0.2,
                    0,
                    0
                ),

            leftUpperArm:
                new THREE.Vector3(
                    -0.25,
                    0,
                    0
                ),

            rightUpperArm:
                new THREE.Vector3(
                    0.25,
                    0,
                    0
                ),

            leftForearm:
                new THREE.Vector3(
                    -0.3,
                    0,
                    0
                ),

            rightForearm:
                new THREE.Vector3(
                    0.3,
                    0,
                    0
                ),

            leftHand:
                new THREE.Vector3(
                    -0.25,
                    0,
                    0
                ),

            rightHand:
                new THREE.Vector3(
                    0.25,
                    0,
                    0
                ),

            leftUpperLeg:
                new THREE.Vector3(
                    -0.15,
                    -0.4,
                    0
                ),

            rightUpperLeg:
                new THREE.Vector3(
                    0.15,
                    -0.4,
                    0
                ),

            leftLowerLeg:
                new THREE.Vector3(
                    0,
                    -0.45,
                    0
                ),

            rightLowerLeg:
                new THREE.Vector3(
                    0,
                    -0.45,
                    0
                ),

            leftFoot:
                new THREE.Vector3(
                    0,
                    -0.4,
                    0.1
                ),

            rightFoot:
                new THREE.Vector3(
                    0,
                    -0.4,
                    0.1
                ),

            leftToes:
                new THREE.Vector3(
                    0,
                    0,
                    0.15
                ),

            rightToes:
                new THREE.Vector3(
                    0,
                    0,
                    0.15
                ),
        };

        return (
            offsets[role]?.clone() ||
            parentPosition
        );
    }

    getRoleReference(
        role,
        mapping
    ) {
        const references = {
            root:
                mapping.root,

            hips:
                mapping.pelvis,

            pelvis:
                mapping.hips,

            spine:
                mapping.chest,

            chest:
                mapping.neck,

            neck:
                mapping.head,

            head:
                null,

            leftShoulder:
                mapping.leftUpperArm,

            rightShoulder:
                mapping.rightUpperArm,

            leftUpperArm:
                mapping.leftForearm,

            rightUpperArm:
                mapping.rightForearm,

            leftForearm:
                mapping.leftHand,

            rightForearm:
                mapping.rightHand,

            leftHand:
                null,

            rightHand:
                null,

            leftUpperLeg:
                mapping.leftLowerLeg,

            rightUpperLeg:
                mapping.rightLowerLeg,

            leftLowerLeg:
                mapping.leftFoot,

            rightLowerLeg:
                mapping.rightFoot,

            leftFoot:
                mapping.leftToes,

            rightFoot:
                mapping.rightToes,

            leftToes:
                null,

            rightToes:
                null,
        };

        return (
            references[role] ||
            null
        );
    }

    roleToBoneName(
        role
    ) {
        const names = {
            root:
                "Root",

            hips:
                "Hips",

            pelvis:
                "Pelvis",

            spine:
                "Spine",

            chest:
                "Chest",

            neck:
                "Neck",

            head:
                "Head",

            leftShoulder:
                "LeftShoulder",

            rightShoulder:
                "RightShoulder",

            leftUpperArm:
                "LeftUpperArm",

            rightUpperArm:
                "RightUpperArm",

            leftForearm:
                "LeftForearm",

            rightForearm:
                "RightForearm",

            leftHand:
                "LeftHand",

            rightHand:
                "RightHand",

            leftUpperLeg:
                "LeftUpperLeg",

            rightUpperLeg:
                "RightUpperLeg",

            leftLowerLeg:
                "LeftLowerLeg",

            rightLowerLeg:
                "RightLowerLeg",

            leftFoot:
                "LeftFoot",

            rightFoot:
                "RightFoot",

            leftToes:
                "LeftToes",

            rightToes:
                "RightToes",
        };

        return (
            names[role] ||
            role
        );
    }

    createRig(
        analysis,
        mapping,
        options
    ) {
        const rig = {
            object:
                analysis.object,

            skeleton:
                analysis.skeleton,

            mapping,

            type:
                analysis.detection
                    ?.type ||
                "custom",

            bones:
                Object.values(
                    mapping
                ).filter(
                    (value) =>
                        value?.isBone
                ),

            helpers: [],

            weights: null,
        };

        if (
            options.createHelperSkeleton
        ) {
            const helper =
                this.createSkeletonHelper(
                    rig
                );

            if (
                helper
            ) {
                rig.helpers.push(
                    helper
                );
            }
        }

        return rig;
    }

    createSkeletonHelper(
        rig
    ) {
        if (
            !rig.skeleton ||
            !rig.skeleton.hasBones()
        ) {
            return null;
        }

        try {
            const helper =
                new THREE.SkeletonHelper(
                    rig.object
                );

            helper.name =
                "AutoRig Skeleton";

            helper.userData =
                helper.userData ||
                {};

            helper.userData.autoRig =
                true;

            helper.visible =
                false;

            return helper;
        } catch (
            error
        ) {
            console.warn(
                "Unable to create skeleton helper:",
                error
            );

            return null;
        }
    }

    applyRig(
        rig,
        options = {}
    ) {
        if (
            !rig?.object
        ) {
            return false;
        }

        rig.object.userData =
            rig.object.userData ||
            {};

        rig.object.userData.rigged =
            true;

        rig.object.userData.rigType =
            rig.type;

        rig.object.userData.rig =
            {
                type:
                    rig.type,

                boneCount:
                    rig.bones.length,

                generated:
                    true,
            };

        if (
            rig.skeleton
        ) {
            rig.skeleton.rebuild();
        }

        return true;
    }

    calculateWeights(
        rig,
        options = {}
    ) {
        if (
            !rig?.object ||
            !rig?.bones?.length
        ) {
            return null;
        }

        const meshes =
            [];

        rig.object.traverse(
            (child) => {
                if (
                    child.isMesh
                ) {
                    meshes.push(
                        child
                    );
                }
            }
        );

        const weights = {
            meshes: [],
            bones:
                rig.bones,
        };

        meshes.forEach(
            (mesh) => {
                if (
                    mesh.isSkinnedMesh &&
                    mesh.skeleton
                ) {
                    weights.meshes.push(
                        {
                            mesh,
                            existing:
                                true,
                            skeleton:
                                mesh.skeleton,
                        }
                    );

                    return;
                }

                weights.meshes.push(
                    {
                        mesh,
                        existing:
                            false,
                        skeleton:
                            null,
                    }
                );
            }
        );

        rig.weights =
            weights;

        return weights;
    }

    getResult() {
        return this.result;
    }

    getMapping() {
        return (
            this.result?.mapping ||
            null
        );
    }

    getRig() {
        return (
            this.result?.rig ||
            null
        );
    }

    getSkeleton() {
        return (
            this.result?.skeleton ||
            this.skeleton ||
            null
        );
    }

    getBone(
        role
    ) {
        return (
            this.getMapping()?.[
                role
            ] || null
        );
    }

    isRigged() {
        return Boolean(
            this.result?.success
        );
    }

    reportProgress(
        progress,
        message
    ) {
        this.emit(
            "progress",
            {
                progress:
                    Math.max(
                        0,
                        Math.min(
                            1,
                            progress
                        )
                    ),

                message,
            }
        );
    }

    getWorldPosition(
        object
    ) {
        if (
            !object
        ) {
            return null;
        }

        const position =
            new THREE.Vector3();

        object.getWorldPosition(
            position
        );

        return position;
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

        if (
            !listeners
        ) {
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
                            `AutoRig event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        if (
            this.result?.rig
                ?.helpers
        ) {
            this.result.rig.helpers.forEach(
                (helper) => {
                    helper.geometry?.dispose?.();
                    helper.material?.dispose?.();
                }
            );
        }

        this.result =
            null;

        this.skeleton =
            null;

        this.object =
            null;

        this.listeners = {
            started: [],
            progress: [],
            completed: [],
            error: [],
        };
    }
}
