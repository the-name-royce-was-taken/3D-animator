import * as THREE from "three";

export default class RigDetector {
    constructor(options = {}) {
        this.minBones =
            Number.isFinite(
                options.minBones
            )
                ? Math.max(
                      1,
                      Math.floor(
                          options.minBones
                      )
                  )
                : 2;

        this.listeners = {
            detected: [],
            error: [],
        };
    }

    detect(
        object
    ) {
        try {
            if (
                !object ||
                !object.isObject3D
            ) {
                return this.createResult(
                    null
                );
            }

            const bones =
                this.findBones(
                    object
                );

            const skeletons =
                this.findSkeletons(
                    object
                );

            const skinnedMeshes =
                this.findSkinnedMeshes(
                    object
                );

            const boneNames =
                bones.map(
                    (bone) =>
                        bone.name ||
                        ""
                );

            const hierarchy =
                this.buildHierarchy(
                    bones
                );

            const landmarks =
                this.detectLandmarks(
                    bones
                );

            const type =
                this.detectRigType(
                    bones,
                    skinnedMeshes
                );

            const result =
                this.createResult(
                    object,
                    {
                        bones,
                        skeletons,
                        skinnedMeshes,
                        boneNames,
                        hierarchy,
                        landmarks,
                        type,
                    }
                );

            this.emit(
                "detected",
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

    findBones(
        object
    ) {
        const bones =
            [];

        object.traverse(
            (child) => {
                if (
                    child.isBone
                ) {
                    bones.push(
                        child
                    );
                }
            }
        );

        return bones;
    }

    findSkeletons(
        object
    ) {
        const skeletons =
            [];

        object.traverse(
            (child) => {
                if (
                    child.isSkinnedMesh &&
                    child.skeleton
                ) {
                    if (
                        !skeletons.includes(
                            child.skeleton
                        )
                    ) {
                        skeletons.push(
                            child.skeleton
                        );
                    }
                }
            }
        );

        return skeletons;
    }

    findSkinnedMeshes(
        object
    ) {
        const meshes =
            [];

        object.traverse(
            (child) => {
                if (
                    child.isSkinnedMesh
                ) {
                    meshes.push(
                        child
                    );
                }
            }
        );

        return meshes;
    }

    createResult(
        object,
        data = {}
    ) {
        const bones =
            data.bones ||
            [];

        const skeletons =
            data.skeletons ||
            [];

        const skinnedMeshes =
            data.skinnedMeshes ||
            [];

        const boneCount =
            bones.length;

        const hasSkeleton =
            skeletons.length >
                0 ||
            skinnedMeshes.length >
                0;

        const isRigged =
            boneCount >=
                this.minBones &&
            hasSkeleton;

        return {
            object:
                object ||
                null,

            detected:
                isRigged,

            isRigged,

            type:
                data.type ||
                "none",

            boneCount,

            bones,

            skeletons,

            skinnedMeshes,

            boneNames:
                data.boneNames ||
                [],

            hierarchy:
                data.hierarchy ||
                [],

            landmarks:
                data.landmarks ||
                {},

            confidence:
                this.calculateConfidence(
                    {
                        boneCount,
                        skeletons,
                        skinnedMeshes,
                        landmarks:
                            data.landmarks ||
                            {},
                        type:
                            data.type ||
                            "none",
                    }
                ),
        };
    }

    calculateConfidence(
        data
    ) {
        if (
            !data.boneCount
        ) {
            return 0;
        }

        let score =
            0;

        if (
            data.boneCount >=
            this.minBones
        ) {
            score += 0.3;
        }

        if (
            data.skeletons.length >
            0
        ) {
            score += 0.3;
        }

        if (
            data.skinnedMeshes.length >
            0
        ) {
            score += 0.2;
        }

        const landmarkCount =
            Object.values(
                data.landmarks ||
                    {}
            ).filter(Boolean)
                .length;

        if (
            landmarkCount >= 3
        ) {
            score += 0.2;
        } else if (
            landmarkCount > 0
        ) {
            score += 0.1;
        }

        return Math.min(
            1,
            score
        );
    }

    detectRigType(
        bones,
        skinnedMeshes
    ) {
        if (
            bones.length <
            this.minBones
        ) {
            return "none";
        }

        const names =
            bones.map(
                (bone) =>
                    this.normalizeName(
                        bone.name
                    )
            );

        const hasHumanKeywords =
            this.hasAnyKeyword(
                names,
                [
                    "hips",
                    "pelvis",
                    "spine",
                    "chest",
                    "neck",
                    "head",
                    "shoulder",
                    "upperarm",
                    "forearm",
                    "hand",
                    "thigh",
                    "calf",
                    "shin",
                    "foot",
                    "toe",
                ]
            );

        const hasMixamoKeywords =
            this.hasAnyKeyword(
                names,
                [
                    "mixamorig",
                ]
            );

        const hasBipedKeywords =
            this.hasAnyKeyword(
                names,
                [
                    "bip01",
                    "bip001",
                    "bip_",
                    "pelvis",
                ]
            );

        const hasAnimalKeywords =
            this.hasAnyKeyword(
                names,
                [
                    "tail",
                    "snout",
                    "muzzle",
                    "paw",
                    "hoof",
                    "wing",
                ]
            );

        if (
            hasMixamoKeywords
        ) {
            return "mixamo";
        }

        if (
            hasBipedKeywords
        ) {
            return "biped";
        }

        if (
            hasHumanKeywords
        ) {
            return "humanoid";
        }

        if (
            hasAnimalKeywords
        ) {
            return "animal";
        }

        if (
            skinnedMeshes.length >
                0 &&
            bones.length >= 4
        ) {
            return "custom";
        }

        return "unknown";
    }

    detectLandmarks(
        bones
    ) {
        const landmarks = {
            root: null,
            hips: null,
            pelvis: null,
            spine: null,
            chest: null,
            upperChest: null,
            neck: null,
            head: null,

            leftShoulder: null,
            rightShoulder: null,

            leftUpperArm: null,
            rightUpperArm: null,

            leftForearm: null,
            rightForearm: null,

            leftHand: null,
            rightHand: null,

            leftUpperLeg: null,
            rightUpperLeg: null,

            leftLowerLeg: null,
            rightLowerLeg: null,

            leftFoot: null,
            rightFoot: null,

            leftToes: null,
            rightToes: null,
        };

        if (
            bones.length === 0
        ) {
            return landmarks;
        }

        landmarks.root =
            this.findBestBone(
                bones,
                [
                    "root",
                    "armature",
                    "rig",
                    "skeleton",
                ]
            );

        landmarks.hips =
            this.findBestBone(
                bones,
                [
                    "hips",
                    "hip",
                    "pelvis",
                ]
            );

        landmarks.pelvis =
            landmarks.hips ||
            this.findBestBone(
                bones,
                [
                    "pelvis",
                ]
            );

        landmarks.spine =
            this.findBestBone(
                bones,
                [
                    "spine",
                    "spine1",
                    "spine01",
                ]
            );

        landmarks.chest =
            this.findBestBone(
                bones,
                [
                    "chest",
                    "spine2",
                    "spine02",
                ]
            );

        landmarks.upperChest =
            this.findBestBone(
                bones,
                [
                    "upperchest",
                    "upper_chest",
                    "spine3",
                    "spine03",
                ]
            );

        landmarks.neck =
            this.findBestBone(
                bones,
                [
                    "neck",
                ]
            );

        landmarks.head =
            this.findBestBone(
                bones,
                [
                    "head",
                ]
            );

        landmarks.leftShoulder =
            this.findBestSideBone(
                bones,
                "left",
                [
                    "shoulder",
                    "clavicle",
                ]
            );

        landmarks.rightShoulder =
            this.findBestSideBone(
                bones,
                "right",
                [
                    "shoulder",
                    "clavicle",
                ]
            );

        landmarks.leftUpperArm =
            this.findBestSideBone(
                bones,
                "left",
                [
                    "upperarm",
                    "upper_arm",
                    "arm",
                ]
            );

        landmarks.rightUpperArm =
            this.findBestSideBone(
                bones,
                "right",
                [
                    "upperarm",
                    "upper_arm",
                    "arm",
                ]
            );

        landmarks.leftForearm =
            this.findBestSideBone(
                bones,
                "left",
                [
                    "forearm",
                    "lowerarm",
                    "lower_arm",
                ]
            );

        landmarks.rightForearm =
            this.findBestSideBone(
                bones,
                "right",
                [
                    "forearm",
                    "lowerarm",
                    "lower_arm",
                ]
            );

        landmarks.leftHand =
            this.findBestSideBone(
                bones,
                "left",
                [
                    "hand",
                ]
            );

        landmarks.rightHand =
            this.findBestSideBone(
                bones,
                "right",
                [
                    "hand",
                ]
            );

        landmarks.leftUpperLeg =
            this.findBestSideBone(
                bones,
                "left",
                [
                    "thigh",
                    "upperleg",
                    "upper_leg",
                ]
            );

        landmarks.rightUpperLeg =
            this.findBestSideBone(
                bones,
                "right",
                [
                    "thigh",
                    "upperleg",
                    "upper_leg",
                ]
            );

        landmarks.leftLowerLeg =
            this.findBestSideBone(
                bones,
                "left",
                [
                    "calf",
                    "shin",
                    "lowerleg",
                    "lower_leg",
                ]
            );

        landmarks.rightLowerLeg =
            this.findBestSideBone(
                bones,
                "right",
                [
                    "calf",
                    "shin",
                    "lowerleg",
                    "lower_leg",
                ]
            );

        landmarks.leftFoot =
            this.findBestSideBone(
                bones,
                "left",
                [
                    "foot",
                ]
            );

        landmarks.rightFoot =
            this.findBestSideBone(
                bones,
                "right",
                [
                    "foot",
                ]
            );

        landmarks.leftToes =
            this.findBestSideBone(
                bones,
                "left",
                [
                    "toe",
                    "toes",
                ]
            );

        landmarks.rightToes =
            this.findBestSideBone(
                bones,
                "right",
                [
                    "toe",
                    "toes",
                ]
            );

        return landmarks;
    }

    findBestBone(
        bones,
        keywords
    ) {
        let best =
            null;

        let bestScore =
            -Infinity;

        for (
            const bone of bones
        ) {
            const name =
                this.normalizeName(
                    bone.name
                );

            const score =
                this.scoreName(
                    name,
                    keywords
                );

            if (
                score >
                bestScore
            ) {
                bestScore =
                    score;

                best =
                    bone;
            }
        }

        return bestScore >
            0
            ? best
            : null;
    }

    findBestSideBone(
        bones,
        side,
        keywords
    ) {
        const sideNames =
            side === "left"
                ? [
                      "left",
                      "l",
                      "_l",
                      ".l",
                      "-l",
                      "lf",
                  ]
                : [
                      "right",
                      "r",
                      "_r",
                      ".r",
                      "-r",
                      "rt",
                  ];

        let best =
            null;

        let bestScore =
            -Infinity;

        for (
            const bone of bones
        ) {
            const name =
                this.normalizeName(
                    bone.name
                );

            const sideScore =
                this.scoreSide(
                    name,
                    sideNames
                );

            if (
                sideScore <=
                0
            ) {
                continue;
            }

            const keywordScore =
                this.scoreName(
                    name,
                    keywords
                );

            const score =
                sideScore +
                keywordScore;

            if (
                score >
                bestScore
            ) {
                bestScore =
                    score;

                best =
                    bone;
            }
        }

        return bestScore >
            0
            ? best
            : null;
    }

    scoreName(
        name,
        keywords
    ) {
        if (
            !name ||
            !Array.isArray(
                keywords
            )
        ) {
            return 0;
        }

        let score =
            0;

        for (
            const keyword of keywords
        ) {
            const normalizedKeyword =
                this.normalizeName(
                    keyword
                );

            if (
                !normalizedKeyword
            ) {
                continue;
            }

            if (
                name ===
                normalizedKeyword
            ) {
                score += 10;
            } else if (
                name.includes(
                    normalizedKeyword
                )
            ) {
                score += 5;
            }
        }

        return score;
    }

    scoreSide(
        name,
        sideNames
    ) {
        let score =
            0;

        for (
            const side of sideNames
        ) {
            const normalized =
                this.normalizeName(
                    side
                );

            if (
                name ===
                normalized
            ) {
                score += 5;
            } else if (
                name.startsWith(
                    normalized
                ) ||
                name.endsWith(
                    normalized
                ) ||
                name.includes(
                    normalized
                )
            ) {
                score += 2;
            }
        }

        return score;
    }

    hasAnyKeyword(
        names,
        keywords
    ) {
        return names.some(
            (name) =>
                keywords.some(
                    (keyword) =>
                        name.includes(
                            this.normalizeName(
                                keyword
                            )
                        )
                )
        );
    }

    normalizeName(
        name
    ) {
        return String(
            name || ""
        )
            .toLowerCase()
            .replace(
                /mixamorig[:._-]?/g,
                ""
            )
            .replace(
                /[\s\-:.]+/g,
                "_"
            )
            .replace(
                /[^a-z0-9_]/g,
                ""
            );
    }

    buildHierarchy(
        bones
    ) {
        return bones.map(
            (bone) => ({
                bone,
                name:
                    bone.name ||
                    "",
                parent:
                    bone.parent?.isBone
                        ? bone.parent
                        : null,
                children:
                    bone.children.filter(
                        (child) =>
                            child.isBone
                    ),
                depth:
                    this.getBoneDepth(
                        bone
                    ),
            })
        );
    }

    getBoneDepth(
        bone
    ) {
        let depth =
            0;

        let current =
            bone;

        while (
            current?.parent
        ) {
            if (
                current.parent
                    .isBone
            ) {
                depth +=
                    1;
            }

            current =
                current.parent;
        }

        return depth;
    }

    getRootBones(
        bones
    ) {
        return bones.filter(
            (bone) =>
                !bone.parent ||
                !bone.parent.isBone
        );
    }

    getBonePath(
        bone
    ) {
        const path =
            [];

        let current =
            bone;

        while (
            current
        ) {
            if (
                current.isBone
            ) {
                path.unshift(
                    current
                );
            }

            current =
                current.parent;
        }

        return path;
    }

    getBoneNames(
        object
    ) {
        return this.findBones(
            object
        ).map(
            (bone) =>
                bone.name ||
                ""
        );
    }

    isHumanoid(
        object
    ) {
        const result =
            this.detect(
                object
            );

        return (
            result.type ===
                "humanoid" ||
            result.type ===
                "mixamo" ||
            result.type ===
                "biped"
        );
    }

    getLandmark(
        object,
        landmark
    ) {
        const result =
            this.detect(
                object
            );

        return (
            result.landmarks?.[
                landmark
            ] || null
        );
    }

    getStats(
        object
    ) {
        const result =
            this.detect(
                object
            );

        return {
            detected:
                result.detected,

            type:
                result.type,

            confidence:
                result.confidence,

            boneCount:
                result.boneCount,

            skeletonCount:
                result.skeletons.length,

            skinnedMeshCount:
                result.skinnedMeshes
                    .length,

            landmarkCount:
                Object.values(
                    result.landmarks
                ).filter(Boolean)
                    .length,
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
                            `RigDetector event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.listeners = {
            detected: [],
            error: [],
        };
    }
}
