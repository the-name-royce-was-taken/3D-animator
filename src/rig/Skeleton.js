import * as THREE from "three";

export default class Skeleton {
    constructor(options = {}) {
        this.root =
            options.root ||
            null;

        this.object =
            options.object ||
            this.root ||
            null;

        this.name =
            options.name ||
            this.object?.name ||
            "Skeleton";

        this.bones =
            [];

        this.boneMap =
            new Map();

        this.selectedBone =
            null;

        this.bindMatrices =
            new Map();

        this.listeners = {
            changed: [],
            selected: [],
        };

        if (
            this.object
        ) {
            this.build(
                this.object
            );
        }
    }

    build(
        object
    ) {
        this.object =
            object ||
            this.object;

        this.root =
            object ||
            this.root;

        this.bones =
            [];

        this.boneMap.clear();

        this.bindMatrices.clear();

        if (
            !object ||
            !object.isObject3D
        ) {
            return this;
        }

        object.traverse(
            (child) => {
                if (
                    child.isBone
                ) {
                    this.bones.push(
                        child
                    );

                    this.boneMap.set(
                        child.uuid,
                        child
                    );

                    if (
                        child.name
                    ) {
                        this.boneMap.set(
                            child.name,
                            child
                        );
                    }

                    this.bindMatrices.set(
                        child.uuid,
                        {
                            position:
                                child.position.clone(),
                            quaternion:
                                child.quaternion.clone(),
                            scale:
                                child.scale.clone(),
                        }
                    );
                }
            }
        );

        return this;
    }

    rebuild() {
        return this.build(
            this.object
        );
    }

    getBone(
        identifier
    ) {
        if (
            !identifier
        ) {
            return null;
        }

        if (
            identifier.isBone
        ) {
            return identifier;
        }

        return (
            this.boneMap.get(
                identifier
            ) || null
        );
    }

    getBones() {
        return [
            ...this.bones,
        ];
    }

    getBoneCount() {
        return this.bones.length;
    }

    hasBones() {
        return (
            this.bones.length >
            0
        );
    }

    getRootBones() {
        return this.bones.filter(
            (bone) =>
                !bone.parent ||
                !bone.parent.isBone
        );
    }

    getChildren(
        bone
    ) {
        const target =
            this.getBone(
                bone
            );

        if (
            !target
        ) {
            return [];
        }

        return target.children.filter(
            (child) =>
                child.isBone
        );
    }

    getParent(
        bone
    ) {
        const target =
            this.getBone(
                bone
            );

        if (
            !target?.parent?.isBone
        ) {
            return null;
        }

        return target.parent;
    }

    getSiblings(
        bone
    ) {
        const parent =
            this.getParent(
                bone
            );

        if (
            !parent
        ) {
            return [];
        }

        return parent.children.filter(
            (child) =>
                child.isBone &&
                child !==
                    this.getBone(
                        bone
                    )
        );
    }

    getDepth(
        bone
    ) {
        let depth =
            0;

        let current =
            this.getBone(
                bone
            );

        while (
            current?.parent
        ) {
            if (
                current.parent
                    .isBone
            ) {
                depth += 1;
            }

            current =
                current.parent;
        }

        return depth;
    }

    getAncestors(
        bone
    ) {
        const ancestors =
            [];

        let current =
            this.getParent(
                bone
            );

        while (
            current
        ) {
            ancestors.push(
                current
            );

            current =
                this.getParent(
                    current
                );
        }

        return ancestors;
    }

    getDescendants(
        bone
    ) {
        const target =
            this.getBone(
                bone
            );

        if (
            !target
        ) {
            return [];
        }

        const descendants =
            [];

        const visit =
            (current) => {
                current.children.forEach(
                    (child) => {
                        if (
                            !child.isBone
                        ) {
                            return;
                        }

                        descendants.push(
                            child
                        );

                        visit(
                            child
                        );
                    }
                );
            };

        visit(
            target
        );

        return descendants;
    }

    getChain(
        startBone,
        endBone
    ) {
        const start =
            this.getBone(
                startBone
            );

        const end =
            this.getBone(
                endBone
            );

        if (
            !start ||
            !end
        ) {
            return [];
        }

        const chain =
            [];

        let current =
            end;

        while (
            current
        ) {
            chain.unshift(
                current
            );

            if (
                current ===
                start
            ) {
                return chain;
            }

            current =
                this.getParent(
                    current
                );
        }

        return [];
    }

    findBone(
        name,
        options = {}
    ) {
        if (
            !name
        ) {
            return null;
        }

        const target =
            this.normalizeName(
                name
            );

        let best =
            null;

        let bestScore =
            -Infinity;

        this.bones.forEach(
            (bone) => {
                const boneName =
                    this.normalizeName(
                        bone.name
                    );

                let score =
                    0;

                if (
                    boneName ===
                    target
                ) {
                    score +=
                        100;
                } else if (
                    boneName.includes(
                        target
                    )
                ) {
                    score +=
                        50;
                }

                if (
                    options.side
                ) {
                    score +=
                        this.sideScore(
                            boneName,
                            options.side
                        );
                }

                if (
                    options.keywords
                ) {
                    options.keywords.forEach(
                        (keyword) => {
                            if (
                                boneName.includes(
                                    this.normalizeName(
                                        keyword
                                    )
                                )
                            ) {
                                score +=
                                    10;
                            }
                        }
                    );
                }

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
        );

        return bestScore >
            0
            ? best
            : null;
    }

    findBones(
        query
    ) {
        if (
            !query
        ) {
            return [];
        }

        const normalized =
            this.normalizeName(
                query
            );

        return this.bones.filter(
            (bone) =>
                this.normalizeName(
                    bone.name
                ).includes(
                    normalized
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

    sideScore(
        name,
        side
    ) {
        const left =
            [
                "left",
                "l",
                "_l",
                ".l",
                "-l",
                "lf",
            ];

        const right =
            [
                "right",
                "r",
                "_r",
                ".r",
                "-r",
                "rt",
            ];

        const values =
            side ===
            "left"
                ? left
                : right;

        let score =
            0;

        values.forEach(
            (value) => {
                if (
                    name ===
                    value
                ) {
                    score +=
                        10;
                } else if (
                    name.startsWith(
                        value
                    ) ||
                    name.endsWith(
                        value
                    ) ||
                    name.includes(
                        value
                    )
                ) {
                    score +=
                        3;
                }
            }
        );

        return score;
    }

    selectBone(
        bone
    ) {
        const target =
            this.getBone(
                bone
            );

        if (
            this.selectedBone ===
            target
        ) {
            return target;
        }

        this.selectedBone =
            target;

        this.emit(
            "selected",
            target
        );

        return target;
    }

    clearSelection() {
        this.selectBone(
            null
        );
    }

    getSelectedBone() {
        return this.selectedBone;
    }

    capturePose(
        options = {}
    ) {
        const pose = {
            name:
                options.name ||
                "Pose",

            bones: {},

            timestamp:
                Date.now(),
        };

        this.bones.forEach(
            (bone) => {
                pose.bones[
                    bone.uuid
                ] = {
                    uuid:
                        bone.uuid,

                    name:
                        bone.name,

                    position:
                        [
                            bone.position
                                .x,
                            bone.position
                                .y,
                            bone.position
                                .z,
                        ],

                    quaternion:
                        [
                            bone.quaternion
                                .x,
                            bone.quaternion
                                .y,
                            bone.quaternion
                                .z,
                            bone.quaternion
                                .w,
                        ],

                    rotation:
                        [
                            bone.rotation
                                .x,
                            bone.rotation
                                .y,
                            bone.rotation
                                .z,
                        ],

                    scale:
                        [
                            bone.scale.x,
                            bone.scale.y,
                            bone.scale.z,
                        ],
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
            !pose?.bones
        ) {
            return false;
        }

        let changed =
            false;

        Object.values(
            pose.bones
        ).forEach(
            (data) => {
                const bone =
                    this.getBone(
                        data.uuid
                    ) ||
                    this.findBone(
                        data.name
                    );

                if (
                    !bone
                ) {
                    return;
                }

                if (
                    Array.isArray(
                        data.position
                    ) &&
                    options.position !==
                        false
                ) {
                    bone.position.set(
                        data.position[0],
                        data.position[1],
                        data.position[2]
                    );

                    changed =
                        true;
                }

                if (
                    Array.isArray(
                        data.quaternion
                    ) &&
                    options.rotation !==
                        false
                ) {
                    bone.quaternion.set(
                        data.quaternion[0],
                        data.quaternion[1],
                        data.quaternion[2],
                        data.quaternion[3]
                    );

                    changed =
                        true;
                }

                if (
                    Array.isArray(
                        data.scale
                    ) &&
                    options.scale !==
                        false
                ) {
                    bone.scale.set(
                        data.scale[0],
                        data.scale[1],
                        data.scale[2]
                    );

                    changed =
                        true;
                }

                bone.updateMatrix();
                bone.updateMatrixWorld(
                    true
                );
            }
        );

        if (
            changed
        ) {
            this.emit(
                "changed",
                {
                    type:
                        "poseApplied",
                    pose,
                }
            );
        }

        return changed;
    }

    resetPose(
        options = {}
    ) {
        let changed =
            false;

        this.bones.forEach(
            (bone) => {
                const bind =
                    this.bindMatrices.get(
                        bone.uuid
                    );

                if (
                    !bind
                ) {
                    return;
                }

                if (
                    options.position !==
                    false
                ) {
                    bone.position.copy(
                        bind.position
                    );
                }

                if (
                    options.rotation !==
                    false
                ) {
                    bone.quaternion.copy(
                        bind.quaternion
                    );
                }

                if (
                    options.scale !==
                    false
                ) {
                    bone.scale.copy(
                        bind.scale
                    );
                }

                bone.updateMatrix();
                bone.updateMatrixWorld(
                    true
                );

                changed =
                    true;
            }
        );

        if (
            changed
        ) {
            this.emit(
                "changed",
                {
                    type:
                        "poseReset",
                }
            );
        }

        return changed;
    }

    getBindPose(
        bone
    ) {
        const target =
            this.getBone(
                bone
            );

        if (
            !target
        ) {
            return null;
        }

        return (
            this.bindMatrices.get(
                target.uuid
            ) || null
        );
    }

    storeCurrentAsBindPose() {
        this.bindMatrices.clear();

        this.bones.forEach(
            (bone) => {
                this.bindMatrices.set(
                    bone.uuid,
                    {
                        position:
                            bone.position.clone(),

                        quaternion:
                            bone.quaternion.clone(),

                        scale:
                            bone.scale.clone(),
                    }
                );
            }
        );

        return this.bindMatrices;
    }

    getWorldPosition(
        bone
    ) {
        const target =
            this.getBone(
                bone
            );

        if (
            !target
        ) {
            return null;
        }

        const position =
            new THREE.Vector3();

        target.getWorldPosition(
            position
        );

        return position;
    }

    getWorldQuaternion(
        bone
    ) {
        const target =
            this.getBone(
                bone
            );

        if (
            !target
        ) {
            return null;
        }

        const quaternion =
            new THREE.Quaternion();

        target.getWorldQuaternion(
            quaternion
        );

        return quaternion;
    }

    getWorldScale(
        bone
    ) {
        const target =
            this.getBone(
                bone
            );

        if (
            !target
        ) {
            return null;
        }

        const scale =
            new THREE.Vector3();

        target.getWorldScale(
            scale
        );

        return scale;
    }

    getBoneLength(
        bone
    ) {
        const target =
            this.getBone(
                bone
            );

        if (
            !target
        ) {
            return 0;
        }

        const child =
            target.children.find(
                (item) =>
                    item.isBone
            );

        if (
            !child
        ) {
            return 0;
        }

        const a =
            this.getWorldPosition(
                target
            );

        const b =
            this.getWorldPosition(
                child
            );

        if (
            !a ||
            !b
        ) {
            return 0;
        }

        return a.distanceTo(
            b
        );
    }

    getTotalHeight() {
        const roots =
            this.getRootBones();

        let minY =
            Infinity;

        let maxY =
            -Infinity;

        const position =
            new THREE.Vector3();

        this.bones.forEach(
            (bone) => {
                bone.getWorldPosition(
                    position
                );

                minY =
                    Math.min(
                        minY,
                        position.y
                    );

                maxY =
                    Math.max(
                        maxY,
                        position.y
                    );
            }
        );

        if (
            minY === Infinity ||
            maxY === -Infinity
        ) {
            return 0;
        }

        return Math.max(
            0,
            maxY - minY
        );
    }

    createBoneLines(
        options = {}
    ) {
        const vertices =
            [];

        const color =
            options.color ||
            0x00ff00;

        const positionA =
            new THREE.Vector3();

        const positionB =
            new THREE.Vector3();

        this.bones.forEach(
            (bone) => {
                bone.getWorldPosition(
                    positionA
                );

                bone.children
                    .filter(
                        (child) =>
                            child.isBone
                    )
                    .forEach(
                        (child) => {
                            child.getWorldPosition(
                                positionB
                            );

                            vertices.push(
                                positionA.x,
                                positionA.y,
                                positionA.z,

                                positionB.x,
                                positionB.y,
                                positionB.z
                            );
                        }
                    );
            }
        );

        const geometry =
            new THREE.BufferGeometry();

        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(
                vertices,
                3
            )
        );

        const material =
            new THREE.LineBasicMaterial(
                {
                    color,
                }
            );

        return new THREE.LineSegments(
            geometry,
            material
        );
    }

    getHierarchy() {
        return this.bones.map(
            (bone) => ({
                uuid:
                    bone.uuid,

                name:
                    bone.name,

                parent:
                    bone.parent?.isBone
                        ? bone.parent
                              .uuid
                        : null,

                children:
                    bone.children
                        .filter(
                            (child) =>
                                child.isBone
                        )
                        .map(
                            (
                                child
                            ) =>
                                child.uuid
                        ),

                depth:
                    this.getDepth(
                        bone
                    ),
            })
        );
    }

    getStats() {
        return {
            name:
                this.name,

            boneCount:
                this.bones.length,

            rootCount:
                this.getRootBones()
                    .length,

            selectedBone:
                this.selectedBone
                    ?.name ||
                null,

            height:
                this.getTotalHeight(),
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
                            `Skeleton event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.bones =
            [];

        this.boneMap.clear();

        this.bindMatrices.clear();

        this.selectedBone =
            null;

        this.object =
            null;

        this.root =
            null;

        this.listeners = {
            changed: [],
            selected: [],
        };
    }
}
