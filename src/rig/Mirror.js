import * as THREE from "three";

export default class Mirror {
    constructor(options = {}) {
        this.skeleton =
            options.skeleton || null;

        this.axis =
            options.axis || "x";

        this.enabled =
            options.enabled !== false;

        this.nameRules =
            options.nameRules || {
                left: [
                    "_L",
                    ".L",
                    "-L",
                    "Left",
                    "left",
                ],
                right: [
                    "_R",
                    ".R",
                    "-R",
                    "Right",
                    "right",
                ],
            };

        this.listeners = {
            mirrored: [],
            changed: [],
        };
    }

    setSkeleton(
        skeleton
    ) {
        this.skeleton =
            skeleton || null;

        return this;
    }

    setAxis(
        axis
    ) {
        if (
            !["x", "y", "z"].includes(
                axis
            )
        ) {
            return false;
        }

        this.axis =
            axis;

        this.emit(
            "changed",
            {
                type: "axis",
                axis,
            }
        );

        return true;
    }

    getAxis() {
        return this.axis;
    }

    setEnabled(
        enabled
    ) {
        this.enabled =
            Boolean(enabled);

        return this;
    }

    isEnabled() {
        return this.enabled;
    }

    mirrorPosition(
        position
    ) {
        const result =
            position?.isVector3
                ? position.clone()
                : new THREE.Vector3(
                      position?.[0] || 0,
                      position?.[1] || 0,
                      position?.[2] || 0
                  );

        result[
            this.axis
        ] *= -1;

        return result;
    }

    mirrorQuaternion(
        quaternion
    ) {
        if (
            !quaternion
        ) {
            return new THREE.Quaternion();
        }

        const q =
            quaternion.isQuaternion
                ? quaternion.clone()
                : new THREE.Quaternion(
                      quaternion[0] || 0,
                      quaternion[1] || 0,
                      quaternion[2] || 0,
                      quaternion[3] ??
                          1
                  );

        /*
         * Reflecting a rotation across a
         * coordinate plane can be represented
         * by changing the signs of the two
         * quaternion components associated
         * with the reflected axes.
         */
        if (
            this.axis === "x"
        ) {
            q.y *= -1;
            q.z *= -1;
        } else if (
            this.axis === "y"
        ) {
            q.x *= -1;
            q.z *= -1;
        } else {
            q.x *= -1;
            q.y *= -1;
        }

        return q.normalize();
    }

    mirrorEuler(
        euler
    ) {
        if (
            !euler
        ) {
            return new THREE.Euler();
        }

        const result =
            euler.isEuler
                ? euler.clone()
                : new THREE.Euler(
                      euler[0] || 0,
                      euler[1] || 0,
                      euler[2] || 0,
                      euler[3] ||
                          "XYZ"
                  );

        if (
            this.axis === "x"
        ) {
            result.y *= -1;
            result.z *= -1;
        } else if (
            this.axis === "y"
        ) {
            result.x *= -1;
            result.z *= -1;
        } else {
            result.x *= -1;
            result.y *= -1;
        }

        return result;
    }

    mirrorScale(
        scale
    ) {
        const result =
            scale?.isVector3
                ? scale.clone()
                : new THREE.Vector3(
                      scale?.[0] ??
                          1,
                      scale?.[1] ??
                          1,
                      scale?.[2] ??
                          1
                  );

        /*
         * Scale itself normally stays the
         * same when a pose is reflected.
         */
        return result;
    }

    getMirrorName(
        name
    ) {
        if (
            !name
        ) {
            return name;
        }

        const leftRules =
            this.nameRules.left ||
            [];

        const rightRules =
            this.nameRules.right ||
            [];

        for (
            let i = 0;
            i <
            leftRules.length;
            i++
        ) {
            const rule =
                leftRules[i];

            if (
                name.includes(
                    rule
                )
            ) {
                return name.replace(
                    rule,
                    rightRules[i] ||
                        "_R"
                );
            }
        }

        for (
            let i = 0;
            i <
            rightRules.length;
            i++
        ) {
            const rule =
                rightRules[i];

            if (
                name.includes(
                    rule
                )
            ) {
                return name.replace(
                    rule,
                    leftRules[i] ||
                        "_L"
                );
            }
        }

        return name;
    }

    isLeftName(
        name
    ) {
        return (
            this.nameRules.left ||
            []
        ).some(
            (rule) =>
                name.includes(
                    rule
                )
        );
    }

    isRightName(
        name
    ) {
        return (
            this.nameRules.right ||
            []
        ).some(
            (rule) =>
                name.includes(
                    rule
                )
        );
    }

    findMirrorBone(
        bone
    ) {
        if (
            !bone
        ) {
            return null;
        }

        const mirrorName =
            this.getMirrorName(
                bone.name
            );

        if (
            mirrorName ===
            bone.name
        ) {
            return null;
        }

        return this.findBoneByName(
            mirrorName
        );
    }

    findBoneByName(
        name
    ) {
        if (
            !name
        ) {
            return null;
        }

        if (
            this.skeleton
        ) {
            if (
                typeof this.skeleton
                    .getBoneByName ===
                "function"
            ) {
                const found =
                    this.skeleton.getBoneByName(
                        name
                    );

                if (
                    found
                ) {
                    return found;
                }
            }

            if (
                Array.isArray(
                    this.skeleton.bones
                )
            ) {
                const found =
                    this.skeleton.bones.find(
                        (item) =>
                            item.name ===
                            name
                    );

                if (
                    found
                ) {
                    return found;
                }
            }

            if (
                this.skeleton
                    .skeleton
            ) {
                const found =
                    this.skeleton.skeleton.bones.find(
                        (item) =>
                            item.name ===
                            name
                    );

                if (
                    found
                ) {
                    return found;
                }
            }
        }

        return null;
    }

    getBones() {
        if (
            !this.skeleton
        ) {
            return [];
        }

        if (
            typeof this.skeleton
                .getBones ===
            "function"
        ) {
            return (
                this.skeleton.getBones() ||
                []
            );
        }

        if (
            Array.isArray(
                this.skeleton.bones
            )
        ) {
            return this.skeleton.bones;
        }

        if (
            this.skeleton.skeleton
        ) {
            return (
                this.skeleton.skeleton
                    .bones || []
            );
        }

        return [];
    }

    getMirrorPairs() {
        const bones =
            this.getBones();

        const pairs =
            [];

        const used =
            new Set();

        bones.forEach(
            (bone) => {
                if (
                    !bone?.isBone ||
                    used.has(
                        bone
                    )
                ) {
                    return;
                }

                const mirror =
                    this.findMirrorBone(
                        bone
                    );

                if (
                    !mirror ||
                    mirror ===
                        bone ||
                    used.has(
                        mirror
                    )
                ) {
                    return;
                }

                pairs.push(
                    {
                        left:
                            this.isLeftName(
                                bone.name
                            )
                                ? bone
                                : mirror,

                        right:
                            this.isRightName(
                                bone.name
                            )
                                ? bone
                                : mirror,
                    }
                );

                used.add(
                    bone
                );

                used.add(
                    mirror
                );
            }
        );

        return pairs;
    }

    mirrorBone(
        source,
        target = null,
        options = {}
    ) {
        if (
            !source?.isBone
        ) {
            return false;
        }

        if (
            !this.enabled &&
            options.force !== true
        ) {
            return false;
        }

        const destination =
            target ||
            this.findMirrorBone(
                source
            );

        if (
            !destination?.isBone
        ) {
            return false;
        }

        const world =
            options.world !==
            false;

        if (
            world
        ) {
            const position =
                new THREE.Vector3();

            const quaternion =
                new THREE.Quaternion();

            const scale =
                new THREE.Vector3();

            source.getWorldPosition(
                position
            );

            source.getWorldQuaternion(
                quaternion
            );

            source.getWorldScale(
                scale
            );

            const mirroredPosition =
                this.mirrorPosition(
                    position
                );

            const mirroredQuaternion =
                this.mirrorQuaternion(
                    quaternion
                );

            if (
                destination.parent
            ) {
                destination.parent
                    .worldToLocal(
                        mirroredPosition
                    );

                const parentQuaternion =
                    new THREE.Quaternion();

                destination.parent
                    .getWorldQuaternion(
                        parentQuaternion
                    );

                parentQuaternion.invert();

                destination.quaternion
                    .copy(
                        parentQuaternion
                    )
                    .multiply(
                        mirroredQuaternion
                    );
            } else {
                destination.quaternion.copy(
                    mirroredQuaternion
                );
            }

            destination.position.copy(
                mirroredPosition
            );

            destination.scale.copy(
                scale
            );
        } else {
            destination.position.copy(
                this.mirrorPosition(
                    source.position
                )
            );

            destination.quaternion.copy(
                this.mirrorQuaternion(
                    source.quaternion
                )
            );

            destination.scale.copy(
                this.mirrorScale(
                    source.scale
                )
            );
        }

        destination.updateMatrix();
        destination.updateMatrixWorld(
            true
        );

        this.emit(
            "mirrored",
            {
                source,
                target:
                    destination,
            }
        );

        return true;
    }

    mirrorPose(
        options = {}
    ) {
        if (
            !this.enabled &&
            options.force !== true
        ) {
            return {
                mirrored: 0,
                pairs: [],
            };
        }

        const pairs =
            this.getMirrorPairs();

        const mirrored =
            [];

        pairs.forEach(
            (pair) => {
                const source =
                    options.direction ===
                    "rightToLeft"
                        ? pair.right
                        : pair.left;

                const target =
                    options.direction ===
                    "rightToLeft"
                        ? pair.left
                        : pair.right;

                if (
                    this.mirrorBone(
                        source,
                        target,
                        options
                    )
                ) {
                    mirrored.push(
                        {
                            source,
                            target,
                        }
                    );
                }
            }
        );

        return {
            mirrored:
                mirrored.length,

            pairs:
                mirrored,
        };
    }

    mirrorLeftToRight(
        options = {}
    ) {
        return this.mirrorPose(
            {
                ...options,
                direction:
                    "leftToRight",
            }
        );
    }

    mirrorRightToLeft(
        options = {}
    ) {
        return this.mirrorPose(
            {
                ...options,
                direction:
                    "rightToLeft",
            }
        );
    }

    mirrorSelected(
        bones,
        options = {}
    ) {
        if (
            !Array.isArray(
                bones
            )
        ) {
            return [];
        }

        const result =
            [];

        bones.forEach(
            (source) => {
                if (
                    !source?.isBone
                ) {
                    return;
                }

                const target =
                    this.findMirrorBone(
                        source
                    );

                if (
                    !target
                ) {
                    return;
                }

                if (
                    this.mirrorBone(
                        source,
                        target,
                        options
                    )
                ) {
                    result.push(
                        {
                            source,
                            target,
                        }
                    );
                }
            }
        );

        return result;
    }

    mirrorTransform(
        transform
    ) {
        if (
            !transform
        ) {
            return null;
        }

        const result =
            {
                ...transform,
            };

        if (
            transform.position
        ) {
            result.position =
                this.mirrorPosition(
                    transform.position
                ).toArray();
        }

        if (
            transform.quaternion
        ) {
            result.quaternion =
                this.mirrorQuaternion(
                    transform.quaternion
                ).toArray();
        }

        if (
            transform.rotation
        ) {
            result.rotation =
                this.mirrorEuler(
                    transform.rotation
                ).toArray();
        }

        if (
            transform.scale
        ) {
            result.scale =
                this.mirrorScale(
                    transform.scale
                ).toArray();
        }

        return result;
    }

    mirrorAnimationFrame(
        frame,
        options = {}
    ) {
        if (
            !frame
        ) {
            return null;
        }

        const result =
            {
                ...frame,
                bones: {},
            };

        const bones =
            frame.bones ||
            {};

        Object.entries(
            bones
        ).forEach(
            ([
                name,
                transform,
            ]) => {
                const mirrorName =
                    this.getMirrorName(
                        name
                    );

                result.bones[
                    mirrorName
                ] =
                    this.mirrorTransform(
                        transform
                    );
            }
        );

        if (
            options.preserveOriginal
        ) {
            Object.assign(
                result.bones,
                bones
            );
        }

        return result;
    }

    mirrorAnimation(
        animation,
        options = {}
    ) {
        if (
            !animation
        ) {
            return null;
        }

        const result =
            {
                ...animation,
            };

        if (
            Array.isArray(
                animation.frames
            )
        ) {
            result.frames =
                animation.frames.map(
                    (frame) =>
                        this.mirrorAnimationFrame(
                            frame,
                            options
                        )
                );
        }

        return result;
    }

    createMirrorPlane(
        size = 10
    ) {
        const geometry =
            new THREE.PlaneGeometry(
                size,
                size
            );

        const material =
            new THREE.MeshBasicMaterial(
                {
                    transparent:
                        true,

                    opacity:
                        0.08,

                    side:
                        THREE.DoubleSide,

                    depthWrite:
                        false,
                }
            );

        const plane =
            new THREE.Mesh(
                geometry,
                material
            );

        if (
            this.axis ===
            "x"
        ) {
            plane.rotation.y =
                Math.PI / 2;
        } else if (
            this.axis ===
            "y"
        ) {
            plane.rotation.x =
                Math.PI / 2;
        }

        plane.name =
            "Mirror Plane";

        return plane;
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
                            `Mirror event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.skeleton =
            null;

        this.listeners = {
            mirrored: [],
            changed: [],
        };
    }
}
