import * as THREE from "three";

export default class WeightPaint {
    constructor(options = {}) {
        this.scene =
            options.scene ||
            null;

        this.skeleton =
            options.skeleton ||
            null;

        this.mesh =
            options.mesh ||
            null;

        this.radius =
            Number.isFinite(
                options.radius
            )
                ? Math.max(
                      0.001,
                      options.radius
                  )
                : 0.5;

        this.strength =
            Number.isFinite(
                options.strength
            )
                ? Math.max(
                      0,
                      Math.min(
                          1,
                          options.strength
                      )
                  )
                : 1;

        this.activeBone =
            options.activeBone ||
            null;

        this.enabled =
            false;

        this.weights =
            new Map();

        this.debugHelper =
            null;

        this.listeners = {
            changed: [],
            painted: [],
            selected: [],
        };

        if (
            this.mesh
        ) {
            this.prepareMesh(
                this.mesh
            );
        }
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

    setMesh(
        mesh
    ) {
        this.mesh =
            mesh || null;

        if (
            mesh
        ) {
            this.prepareMesh(
                mesh
            );
        }

        return this;
    }

    prepareMesh(
        mesh
    ) {
        if (
            !mesh
        ) {
            return false;
        }

        if (
            !mesh.geometry
        ) {
            return false;
        }

        const geometry =
            mesh.geometry;

        const position =
            geometry.getAttribute(
                "position"
            );

        if (
            !position
        ) {
            return false;
        }

        const skinIndex =
            geometry.getAttribute(
                "skinIndex"
            );

        const skinWeight =
            geometry.getAttribute(
                "skinWeight"
            );

        if (
            skinIndex &&
            skinWeight
        ) {
            this.cacheWeights(
                mesh
            );

            return true;
        }

        return false;
    }

    cacheWeights(
        mesh = this.mesh
    ) {
        if (
            !mesh?.geometry
        ) {
            return false;
        }

        const geometry =
            mesh.geometry;

        const skinIndex =
            geometry.getAttribute(
                "skinIndex"
            );

        const skinWeight =
            geometry.getAttribute(
                "skinWeight"
            );

        if (
            !skinIndex ||
            !skinWeight
        ) {
            return false;
        }

        const vertexCount =
            geometry.getAttribute(
                "position"
            )?.count || 0;

        this.weights.clear();

        for (
            let i = 0;
            i < vertexCount;
            i++
        ) {
            this.weights.set(
                i,
                {
                    indices: [
                        skinIndex.getX(i),
                        skinIndex.getY(i),
                        skinIndex.getZ(i),
                        skinIndex.getW(i),
                    ],

                    values: [
                        skinWeight.getX(i),
                        skinWeight.getY(i),
                        skinWeight.getZ(i),
                        skinWeight.getW(i),
                    ],
                }
            );
        }

        return true;
    }

    setRadius(
        radius
    ) {
        if (
            !Number.isFinite(
                radius
            )
        ) {
            return this;
        }

        this.radius =
            Math.max(
                0.001,
                radius
            );

        this.emit(
            "changed",
            {
                type:
                    "radius",
                value:
                    this.radius,
            }
        );

        return this;
    }

    getRadius() {
        return this.radius;
    }

    setStrength(
        strength
    ) {
        if (
            !Number.isFinite(
                strength
            )
        ) {
            return this;
        }

        this.strength =
            Math.max(
                0,
                Math.min(
                    1,
                    strength
                )
            );

        this.emit(
            "changed",
            {
                type:
                    "strength",
                value:
                    this.strength,
            }
        );

        return this;
    }

    getStrength() {
        return this.strength;
    }

    setActiveBone(
        bone
    ) {
        if (
            bone &&
            !bone.isBone
        ) {
            return false;
        }

        this.activeBone =
            bone || null;

        this.emit(
            "selected",
            this.activeBone
        );

        return true;
    }

    getActiveBone() {
        return this.activeBone;
    }

    enable() {
        this.enabled =
            true;

        return this;
    }

    disable() {
        this.enabled =
            false;

        return this;
    }

    toggle() {
        this.enabled =
            !this.enabled;

        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    paintAt(
        worldPosition,
        options = {}
    ) {
        if (
            !this.enabled ||
            !this.mesh ||
            !this.activeBone
        ) {
            return {
                changed: false,
                vertices: [],
            };
        }

        if (
            !worldPosition
        ) {
            return {
                changed: false,
                vertices: [],
            };
        }

        const position =
            worldPosition.isVector3
                ? worldPosition
                : new THREE.Vector3(
                      worldPosition[0] || 0,
                      worldPosition[1] || 0,
                      worldPosition[2] || 0
                  );

        const mode =
            options.mode ||
            "add";

        const radius =
            Number.isFinite(
                options.radius
            )
                ? Math.max(
                      0.001,
                      options.radius
                  )
                : this.radius;

        const strength =
            Number.isFinite(
                options.strength
            )
                ? Math.max(
                      0,
                      Math.min(
                          1,
                          options.strength
                      )
                  )
                : this.strength;

        const affected =
            this.findVerticesInRadius(
                position,
                radius
            );

        const changed =
            [];

        affected.forEach(
            (item) => {
                const result =
                    this.paintVertex(
                        item.index,
                        this.activeBone,
                        strength,
                        mode
                    );

                if (
                    result
                ) {
                    changed.push(
                        item.index
                    );
                }
            }
        );

        if (
            changed.length
        ) {
            this.writeWeights();

            this.emit(
                "painted",
                {
                    vertices:
                        changed,
                    bone:
                        this.activeBone,
                    mode,
                    strength,
                }
            );
        }

        return {
            changed:
                changed.length >
                0,

            vertices:
                changed,
        };
    }

    paintVertex(
        vertexIndex,
        bone,
        strength = this.strength,
        mode = "add"
    ) {
        if (
            !this.mesh?.geometry ||
            !bone?.isBone
        ) {
            return false;
        }

        const skinIndex =
            this.mesh.geometry.getAttribute(
                "skinIndex"
            );

        const skinWeight =
            this.mesh.geometry.getAttribute(
                "skinWeight"
            );

        if (
            !skinIndex ||
            !skinWeight
        ) {
            return false;
        }

        const boneIndex =
            this.getBoneIndex(
                bone
            );

        if (
            boneIndex < 0
        ) {
            return false;
        }

        const data =
            this.getVertexWeights(
                vertexIndex
            );

        if (
            !data
        ) {
            return false;
        }

        const slot =
            this.findOrCreateWeightSlot(
                data,
                boneIndex
            );

        if (
            slot < 0
        ) {
            return false;
        }

        const oldValue =
            data.values[slot];

        let newValue =
            oldValue;

        if (
            mode ===
            "replace"
        ) {
            newValue =
                strength;
        } else if (
            mode ===
            "subtract" ||
            mode ===
            "erase"
        ) {
            newValue =
                oldValue *
                (1 - strength);
        } else if (
            mode ===
            "smooth"
        ) {
            newValue =
                (
                    oldValue +
                    strength
                ) /
                2;
        } else {
            newValue =
                oldValue +
                strength *
                    (1 - oldValue);
        }

        data.values[slot] =
            Math.max(
                0,
                Math.min(
                    1,
                    newValue
                )
            );

        this.normalizeWeights(
            data
        );

        this.setVertexWeights(
            vertexIndex,
            data
        );

        return (
            Math.abs(
                oldValue -
                    data.values[
                        slot
                    ]
            ) > 0.000001
        );
    }

    findVerticesInRadius(
        worldPosition,
        radius
    ) {
        if (
            !this.mesh?.geometry
        ) {
            return [];
        }

        const geometry =
            this.mesh.geometry;

        const position =
            geometry.getAttribute(
                "position"
            );

        if (
            !position
        ) {
            return [];
        }

        const inverseMatrix =
            this.mesh.matrixWorld
                .clone()
                .invert();

        const localCenter =
            worldPosition
                .clone()
                .applyMatrix4(
                    inverseMatrix
                );

        const radiusSquared =
            radius * radius;

        const result =
            [];

        const vertex =
            new THREE.Vector3();

        for (
            let i = 0;
            i < position.count;
            i++
        ) {
            vertex.fromBufferAttribute(
                position,
                i
            );

            const distanceSquared =
                vertex.distanceToSquared(
                    localCenter
                );

            if (
                distanceSquared <=
                radiusSquared
            ) {
                result.push(
                    {
                        index: i,

                        distance:
                            Math.sqrt(
                                distanceSquared
                            ),
                    }
                );
            }
        }

        return result;
    }

    getBoneIndex(
        bone
    ) {
        if (
            !bone ||
            !this.mesh?.skeleton
        ) {
            return -1;
        }

        const bones =
            this.mesh.skeleton
                .bones;

        const direct =
            bones.indexOf(
                bone
            );

        if (
            direct >= 0
        ) {
            return direct;
        }

        const name =
            bone.name;

        if (
            name
        ) {
            return bones.findIndex(
                (item) =>
                    item.name ===
                    name
            );
        }

        return -1;
    }

    getBone(
        boneIndex
    ) {
        if (
            !this.mesh?.skeleton
        ) {
            return null;
        }

        return (
            this.mesh.skeleton
                .bones[
                boneIndex
            ] || null
        );
    }

    getVertexWeights(
        vertexIndex
    ) {
        if (
            !this.mesh?.geometry
        ) {
            return null;
        }

        const geometry =
            this.mesh.geometry;

        const skinIndex =
            geometry.getAttribute(
                "skinIndex"
            );

        const skinWeight =
            geometry.getAttribute(
                "skinWeight"
            );

        if (
            !skinIndex ||
            !skinWeight ||
            vertexIndex < 0 ||
            vertexIndex >=
                skinIndex.count
        ) {
            return null;
        }

        return {
            indices: [
                skinIndex.getX(
                    vertexIndex
                ),
                skinIndex.getY(
                    vertexIndex
                ),
                skinIndex.getZ(
                    vertexIndex
                ),
                skinIndex.getW(
                    vertexIndex
                ),
            ],

            values: [
                skinWeight.getX(
                    vertexIndex
                ),
                skinWeight.getY(
                    vertexIndex
                ),
                skinWeight.getZ(
                    vertexIndex
                ),
                skinWeight.getW(
                    vertexIndex
                ),
            ],
        };
    }

    setVertexWeights(
        vertexIndex,
        data
    ) {
        if (
            !this.mesh?.geometry ||
            !data
        ) {
            return false;
        }

        const geometry =
            this.mesh.geometry;

        const skinIndex =
            geometry.getAttribute(
                "skinIndex"
            );

        const skinWeight =
            geometry.getAttribute(
                "skinWeight"
            );

        if (
            !skinIndex ||
            !skinWeight
        ) {
            return false;
        }

        if (
            vertexIndex < 0 ||
            vertexIndex >=
                skinIndex.count
        ) {
            return false;
        }

        skinIndex.setXYZW(
            vertexIndex,
            data.indices[0] || 0,
            data.indices[1] || 0,
            data.indices[2] || 0,
            data.indices[3] || 0
        );

        skinWeight.setXYZW(
            vertexIndex,
            data.values[0] || 0,
            data.values[1] || 0,
            data.values[2] || 0,
            data.values[3] || 0
        );

        skinIndex.needsUpdate =
            true;

        skinWeight.needsUpdate =
            true;

        return true;
    }

    findOrCreateWeightSlot(
        data,
        boneIndex
    ) {
        const existing =
            data.indices.indexOf(
                boneIndex
            );

        if (
            existing >= 0
        ) {
            return existing;
        }

        let smallest =
            0;

        for (
            let i = 1;
            i <
            data.values.length;
            i++
        ) {
            if (
                data.values[i] <
                data.values[
                    smallest
                ]
            ) {
                smallest =
                    i;
            }
        }

        data.indices[
            smallest
        ] =
            boneIndex;

        data.values[
            smallest
        ] = 0;

        return smallest;
    }

    normalizeWeights(
        data
    ) {
        if (
            !data?.values
        ) {
            return;
        }

        let total =
            data.values.reduce(
                (
                    sum,
                    value
                ) =>
                    sum +
                    Math.max(
                        0,
                        value
                    ),
                0
            );

        if (
            total <=
            0
        ) {
            data.values[0] =
                1;

            for (
                let i = 1;
                i <
                data.values.length;
                i++
            ) {
                data.values[i] =
                    0;
            }

            return;
        }

        data.values =
            data.values.map(
                (value) =>
                    Math.max(
                        0,
                        value
                    ) /
                    total
            );
    }

    writeWeights() {
        if (
            !this.mesh?.geometry
        ) {
            return false;
        }

        const geometry =
            this.mesh.geometry;

        const skinIndex =
            geometry.getAttribute(
                "skinIndex"
            );

        const skinWeight =
            geometry.getAttribute(
                "skinWeight"
            );

        if (
            !skinIndex ||
            !skinWeight
        ) {
            return false;
        }

        this.weights.forEach(
            (data, index) => {
                if (
                    index >=
                    skinIndex.count
                ) {
                    return;
                }

                skinIndex.setXYZW(
                    index,
                    data.indices[0] ||
                        0,
                    data.indices[1] ||
                        0,
                    data.indices[2] ||
                        0,
                    data.indices[3] ||
                        0
                );

                skinWeight.setXYZW(
                    index,
                    data.values[0] ||
                        0,
                    data.values[1] ||
                        0,
                    data.values[2] ||
                        0,
                    data.values[3] ||
                        0
                );
            }
        );

        skinIndex.needsUpdate =
            true;

        skinWeight.needsUpdate =
            true;

        return true;
    }

    getWeight(
        vertexIndex,
        bone
    ) {
        const data =
            this.getVertexWeights(
                vertexIndex
            );

        if (
            !data
        ) {
            return 0;
        }

        const boneIndex =
            this.getBoneIndex(
                bone
            );

        if (
            boneIndex < 0
        ) {
            return 0;
        }

        const slot =
            data.indices.indexOf(
                boneIndex
            );

        return slot >= 0
            ? data.values[slot]
            : 0;
    }

    setWeight(
        vertexIndex,
        bone,
        weight
    ) {
        if (
            !bone?.isBone
        ) {
            return false;
        }

        const data =
            this.getVertexWeights(
                vertexIndex
            );

        if (
            !data
        ) {
            return false;
        }

        const boneIndex =
            this.getBoneIndex(
                bone
            );

        if (
            boneIndex < 0
        ) {
            return false;
        }

        const slot =
            this.findOrCreateWeightSlot(
                data,
                boneIndex
            );

        data.values[slot] =
            Math.max(
                0,
                Math.min(
                    1,
                    Number(
                        weight
                    ) || 0
                )
            );

        this.normalizeWeights(
            data
        );

        return this.setVertexWeights(
            vertexIndex,
            data
        );
    }

    smoothVertex(
        vertexIndex,
        bone,
        amount = 0.5
    ) {
        const data =
            this.getVertexWeights(
                vertexIndex
            );

        if (
            !data ||
            !bone
        ) {
            return false;
        }

        const neighbors =
            this.getNeighborVertices(
                vertexIndex
            );

        if (
            !neighbors.length
        ) {
            return false;
        }

        let average =
            0;

        neighbors.forEach(
            (neighbor) => {
                average +=
                    this.getWeight(
                        neighbor,
                        bone
                    );
            }
        );

        average /=
            neighbors.length;

        const current =
            this.getWeight(
                vertexIndex,
                bone
            );

        const next =
            THREE.MathUtils.lerp(
                current,
                average,
                Math.max(
                    0,
                    Math.min(
                        1,
                        amount
                    )
                )
            );

        return this.setWeight(
            vertexIndex,
            bone,
            next
        );
    }

    getNeighborVertices(
        vertexIndex
    ) {
        if (
            !this.mesh?.geometry
        ) {
            return [];
        }

        const geometry =
            this.mesh.geometry;

        const index =
            geometry.getIndex();

        const neighbors =
            new Set();

        if (
            !index
        ) {
            if (
                vertexIndex > 0
            ) {
                neighbors.add(
                    vertexIndex - 1
                );
            }

            if (
                vertexIndex <
                geometry.getAttribute(
                    "position"
                ).count -
                    1
            ) {
                neighbors.add(
                    vertexIndex + 1
                );
            }

            return [
                ...neighbors,
            ];
        }

        for (
            let i = 0;
            i < index.count;
            i += 3
        ) {
            const a =
                index.getX(i);

            const b =
                index.getX(i + 1);

            const c =
                index.getX(i + 2);

            if (
                a ===
                vertexIndex
            ) {
                neighbors.add(b);
                neighbors.add(c);
            }

            if (
                b ===
                vertexIndex
            ) {
                neighbors.add(a);
                neighbors.add(c);
            }

            if (
                c ===
                vertexIndex
            ) {
                neighbors.add(a);
                neighbors.add(b);
            }
        }

        return [
            ...neighbors,
        ];
    }

    getInfluenceColor(
        weight
    ) {
        const value =
            Math.max(
                0,
                Math.min(
                    1,
                    Number(
                        weight
                    ) || 0
                )
            );

        const color =
            new THREE.Color();

        if (
            value <=
            0.25
        ) {
            color.setRGB(
                value * 4,
                0,
                1
            );
        } else if (
            value <=
            0.5
        ) {
            color.setRGB(
                1,
                0,
                1 -
                    (value -
                        0.25) *
                        4
            );
        } else if (
            value <=
            0.75
        ) {
            color.setRGB(
                1,
                (value -
                    0.5) *
                    4,
                0
            );
        } else {
            color.setRGB(
                1 -
                    (value -
                        0.75) *
                        4,
                1,
                0
            );
        }

        return color;
    }

    createWeightPreview(
        bone = this.activeBone
    ) {
        if (
            !this.mesh?.geometry ||
            !bone
        ) {
            return null;
        }

        const geometry =
            this.mesh.geometry;

        const position =
            geometry.getAttribute(
                "position"
            );

        if (
            !position
        ) {
            return null;
        }

        const colors =
            new Float32Array(
                position.count * 3
            );

        for (
            let i = 0;
            i < position.count;
            i++
        ) {
            const weight =
                this.getWeight(
                    i,
                    bone
                );

            const color =
                this.getInfluenceColor(
                    weight
                );

            colors[i * 3] =
                color.r;

            colors[i * 3 + 1] =
                color.g;

            colors[i * 3 + 2] =
                color.b;
        }

        const colorAttribute =
            new THREE.BufferAttribute(
                colors,
                3
            );

        geometry.setAttribute(
            "color",
            colorAttribute
        );

        colorAttribute.needsUpdate =
            true;

        return colorAttribute;
    }

    clearWeightPreview() {
        if (
            !this.mesh?.geometry
        ) {
            return;
        }

        this.mesh.geometry.deleteAttribute(
            "color"
        );
    }

    createDebugHelper() {
        if (
            !this.activeBone
        ) {
            return null;
        }

        if (
            this.debugHelper
        ) {
            this.removeDebugHelper();
        }

        const position =
            new THREE.Vector3();

        this.activeBone.getWorldPosition(
            position
        );

        const geometry =
            new THREE.SphereGeometry(
                this.radius,
                16,
                12
            );

        const material =
            new THREE.MeshBasicMaterial(
                {
                    wireframe:
                        true,
                }
            );

        this.debugHelper =
            new THREE.Mesh(
                geometry,
                material
            );

        this.debugHelper.position.copy(
            position
        );

        this.debugHelper.name =
            "Weight Paint Brush";

        if (
            this.scene
        ) {
            this.scene.add(
                this.debugHelper
            );
        }

        return this.debugHelper;
    }

    updateDebugHelper(
        worldPosition
    ) {
        if (
            !this.debugHelper
        ) {
            return;
        }

        if (
            worldPosition
        ) {
            this.debugHelper.position.copy(
                worldPosition
            );
        }

        this.debugHelper.scale.setScalar(
            this.radius
        );
    }

    removeDebugHelper() {
        if (
            !this.debugHelper
        ) {
            return;
        }

        this.debugHelper.parent?.remove(
            this.debugHelper
        );

        this.debugHelper.geometry?.dispose();
        this.debugHelper.material?.dispose();

        this.debugHelper =
            null;
    }

    getStatistics(
        bone = this.activeBone
    ) {
        if (
            !this.mesh?.geometry ||
            !bone
        ) {
            return {
                vertexCount: 0,
                influencedVertices: 0,
                averageWeight: 0,
                maximumWeight: 0,
            };
        }

        const position =
            this.mesh.geometry.getAttribute(
                "position"
            );

        if (
            !position
        ) {
            return {
                vertexCount: 0,
                influencedVertices: 0,
                averageWeight: 0,
                maximumWeight: 0,
            };
        }

        let influenced =
            0;

        let total =
            0;

        let maximum =
            0;

        for (
            let i = 0;
            i < position.count;
            i++
        ) {
            const weight =
                this.getWeight(
                    i,
                    bone
                );

            if (
                weight >
                0
            ) {
                influenced +=
                    1;

                total +=
                    weight;

                maximum =
                    Math.max(
                        maximum,
                        weight
                    );
            }
        }

        return {
            vertexCount:
                position.count,

            influencedVertices:
                influenced,

            averageWeight:
                influenced >
                0
                    ? total /
                      influenced
                    : 0,

            maximumWeight:
                maximum,
        };
    }

    normalizeAllWeights() {
        if (
            !this.mesh?.geometry
        ) {
            return false;
        }

        const position =
            this.mesh.geometry.getAttribute(
                "position"
            );

        if (
            !position
        ) {
            return false;
        }

        for (
            let i = 0;
            i < position.count;
            i++
        ) {
            const data =
                this.getVertexWeights(
                    i
                );

            if (
                data
            ) {
                this.normalizeWeights(
                    data
                );

                this.setVertexWeights(
                    i,
                    data
                );
            }
        }

        return true;
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
                            `WeightPaint event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.removeDebugHelper();

        this.weights.clear();

        this.mesh =
            null;

        this.skeleton =
            null;

        this.scene =
            null;

        this.activeBone =
            null;

        this.listeners = {
            changed: [],
            painted: [],
            selected: [],
        };
    }
}
