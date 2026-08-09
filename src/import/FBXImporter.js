import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

export default class FBXImporter {
    constructor(options = {}) {
        this.sceneManager =
            options.sceneManager ||
            null;

        this.scene =
            options.sceneManager?.scene ||
            options.scene ||
            null;

        this.loadingManager =
            options.loadingManager ||
            new THREE.LoadingManager();

        this.loader =
            new FBXLoader(
                this.loadingManager
            );

        this.listeners = {
            started: [],
            progress: [],
            loaded: [],
            error: [],
        };
    }

    setSceneManager(
        sceneManager
    ) {
        this.sceneManager =
            sceneManager || null;

        this.scene =
            sceneManager?.scene ||
            null;
    }

    setScene(
        scene
    ) {
        this.scene =
            scene?.scene ||
            scene ||
            null;
    }

    setLoader(
        loader
    ) {
        if (
            !loader ||
            typeof loader.load !==
                "function"
        ) {
            throw new Error(
                "FBXImporter: invalid FBXLoader."
            );
        }

        this.loader =
            loader;
    }

    async import(
        source,
        options = {}
    ) {
        if (
            source ===
            undefined ||
            source ===
            null
        ) {
            throw new Error(
                "No FBX source was provided."
            );
        }

        this.emit(
            "started",
            {
                source,
            }
        );

        try {
            const object =
                await this.load(
                    source
                );

            const result =
                this.processObject(
                    object,
                    options
                );

            this.emit(
                "loaded",
                result
            );

            return result;
        } catch (
            error
        ) {
            this.emit(
                "error",
                {
                    source,
                    error,
                }
            );

            throw error;
        }
    }

    async load(
        source
    ) {
        if (
            source instanceof
            ArrayBuffer
        ) {
            return this.parse(
                source
            );
        }

        if (
            source instanceof
            Blob
        ) {
            const buffer =
                await source.arrayBuffer();

            return this.parse(
                buffer
            );
        }

        if (
            source instanceof
            File
        ) {
            const buffer =
                await source.arrayBuffer();

            return this.parse(
                buffer
            );
        }

        if (
            typeof source ===
            "string"
        ) {
            return this.loadUrl(
                source
            );
        }

        throw new Error(
            "Unsupported FBX source. Expected a URL, File, Blob, or ArrayBuffer."
        );
    }

    loadUrl(
        url
    ) {
        return new Promise(
            (
                resolve,
                reject
            ) => {
                this.loader.load(
                    url,
                    resolve,
                    (progress) => {
                        this.emit(
                            "progress",
                            {
                                url,
                                loaded:
                                    progress
                                        ?.loaded ||
                                    0,
                                total:
                                    progress
                                        ?.total ||
                                    0,
                                progress:
                                    progress
                                        ?.total
                                        ? progress
                                              .loaded /
                                          progress
                                              .total
                                        : 0,
                            }
                        );
                    },
                    reject
                );
            }
        );
    }

    parse(
        arrayBuffer
    ) {
        if (
            !(arrayBuffer instanceof
                ArrayBuffer)
        ) {
            throw new Error(
                "FBXImporter.parse expects an ArrayBuffer."
            );
        }

        return new Promise(
            (
                resolve,
                reject
            ) => {
                try {
                    const object =
                        this.loader.parse(
                            arrayBuffer,
                            ""
                        );

                    resolve(
                        object
                    );
                } catch (
                    error
                ) {
                    reject(
                        error
                    );
                }
            }
        );
    }

    processObject(
        object,
        options = {}
    ) {
        if (
            !object ||
            !object.isObject3D
        ) {
            throw new Error(
                "The FBX file did not produce a valid Three.js object."
            );
        }

        object.name =
            options.name ||
            object.name ||
            "Imported FBX";

        object.userData =
            object.userData ||
            {};

        object.userData.imported =
            true;

        object.userData.sourceFormat =
            "fbx";

        object.userData.assetType =
            "model";

        this.prepareObject(
            object,
            options
        );

        if (
            options.addToScene !==
            false
        ) {
            this.addToScene(
                object,
                options
            );
        }

        const metadata =
            this.collectMetadata(
                object
            );

        return {
            object,
            root:
                object,
            animations:
                object.animations ||
                [],
            metadata,
        };
    }

    prepareObject(
        object,
        options = {}
    ) {
        object.traverse(
            (child) => {
                child.userData =
                    child.userData ||
                    {};

                if (
                    child.isMesh
                ) {
                    child.userData.type =
                        "mesh";

                    child.userData.selectable =
                        true;

                    child.castShadow =
                        options.castShadow !==
                        false;

                    child.receiveShadow =
                        options.receiveShadow !==
                        false;

                    this.prepareMaterial(
                        child
                    );
                }

                if (
                    child.isSkinnedMesh
                ) {
                    child.userData.type =
                        "skinnedMesh";

                    child.userData.selectable =
                        true;

                    child.castShadow =
                        true;

                    child.receiveShadow =
                        true;
                }

                if (
                    child.isBone
                ) {
                    child.userData.type =
                        "bone";

                    child.userData.selectable =
                        true;
                }

                if (
                    child.isGroup
                ) {
                    child.userData.type =
                        "group";
                }
            }
        );

        if (
            options.center !==
            false
        ) {
            this.centerObject(
                object,
                options
            );
        }

        if (
            options.scale
        ) {
            this.applyScale(
                object,
                options.scale
            );
        }
    }

    prepareMaterial(
        mesh
    ) {
        if (
            !mesh.material
        ) {
            return;
        }

        const materials =
            Array.isArray(
                mesh.material
            )
                ? mesh.material
                : [
                      mesh.material,
                  ];

        materials.forEach(
            (material) => {
                if (
                    !material
                ) {
                    return;
                }

                if (
                    "needsUpdate" in
                    material
                ) {
                    material.needsUpdate =
                        true;
                }

                [
                    "map",
                    "normalMap",
                    "roughnessMap",
                    "metalnessMap",
                    "aoMap",
                    "emissiveMap",
                    "alphaMap",
                    "bumpMap",
                    "displacementMap",
                ].forEach(
                    (key) => {
                        const texture =
                            material[
                                key
                            ];

                        if (
                            texture
                        ) {
                            texture.colorSpace =
                                key ===
                                    "map" ||
                                key ===
                                    "emissiveMap"
                                    ? THREE.SRGBColorSpace
                                    : THREE.NoColorSpace;

                            texture.needsUpdate =
                                true;
                        }
                    }
                );
            }
        );
    }

    centerObject(
        object,
        options = {}
    ) {
        const box =
            new THREE.Box3().setFromObject(
                object
            );

        if (
            box.isEmpty()
        ) {
            return;
        }

        const center =
            box.getCenter(
                new THREE.Vector3()
            );

        if (
            options.centerMode ===
            "base"
        ) {
            object.position.x -=
                center.x;

            object.position.z -=
                center.z;

            object.position.y -=
                box.min.y;

            return;
        }

        object.position.sub(
            center
        );
    }

    applyScale(
        object,
        scale
    ) {
        if (
            scale?.isVector3
        ) {
            object.scale.copy(
                scale
            );

            return;
        }

        if (
            typeof scale ===
            "number"
        ) {
            object.scale.setScalar(
                scale
            );

            return;
        }

        if (
            typeof scale ===
            "object"
        ) {
            object.scale.set(
                Number(scale.x) ||
                    1,
                Number(scale.y) ||
                    1,
                Number(scale.z) ||
                    1
            );
        }
    }

    addToScene(
        object,
        options = {}
    ) {
        if (
            !object
        ) {
            return null;
        }

        if (
            this.sceneManager &&
            typeof this.sceneManager
                .addObject ===
                "function"
        ) {
            return this.sceneManager.addObject(
                object,
                {
                    id:
                        options.id ||
                        undefined,
                    type:
                        "model",
                }
            );
        }

        if (
            this.scene
        ) {
            this.scene.add(
                object
            );

            return object;
        }

        throw new Error(
            "FBXImporter: no scene or SceneManager is available."
        );
    }

    collectMetadata(
        root
    ) {
        let objects = 0;
        let meshes = 0;
        let skinnedMeshes = 0;
        let bones = 0;
        let cameras = 0;
        let lights = 0;
        let materials = 0;

        const materialSet =
            new Set();

        root.traverse(
            (object) => {
                objects += 1;

                if (
                    object.isMesh
                ) {
                    meshes += 1;

                    if (
                        object.material
                    ) {
                        if (
                            Array.isArray(
                                object.material
                            )
                        ) {
                            object.material.forEach(
                                (
                                    material
                                ) => {
                                    if (
                                        material
                                    ) {
                                        materialSet.add(
                                            material
                                        );
                                    }
                                }
                            );
                        } else {
                            materialSet.add(
                                object.material
                            );
                        }
                    }
                }

                if (
                    object.isSkinnedMesh
                ) {
                    skinnedMeshes +=
                        1;
                }

                if (
                    object.isBone
                ) {
                    bones += 1;
                }

                if (
                    object.isCamera
                ) {
                    cameras += 1;
                }

                if (
                    object.isLight
                ) {
                    lights += 1;
                }
            }
        );

        materials =
            materialSet.size;

        return {
            rootName:
                root.name,

            objects,

            meshes,

            skinnedMeshes,

            bones,

            cameras,

            lights,

            materials,

            animations:
                root.animations
                    ?.length ||
                0,

            hasSkeleton:
                bones > 0 ||
                skinnedMeshes > 0,
        };
    }

    getMeshes(
        root
    ) {
        const meshes =
            [];

        if (
            !root
        ) {
            return meshes;
        }

        root.traverse(
            (object) => {
                if (
                    object.isMesh
                ) {
                    meshes.push(
                        object
                    );
                }
            }
        );

        return meshes;
    }

    getSkinnedMeshes(
        root
    ) {
        const meshes =
            [];

        if (
            !root
        ) {
            return meshes;
        }

        root.traverse(
            (object) => {
                if (
                    object.isSkinnedMesh
                ) {
                    meshes.push(
                        object
                    );
                }
            }
        );

        return meshes;
    }

    getBones(
        root
    ) {
        const bones =
            [];

        if (
            !root
        ) {
            return bones;
        }

        root.traverse(
            (object) => {
                if (
                    object.isBone
                ) {
                    bones.push(
                        object
                    );
                }
            }
        );

        return bones;
    }

    getMaterials(
        root
    ) {
        const materials =
            new Set();

        if (
            !root
        ) {
            return [];
        }

        root.traverse(
            (object) => {
                if (
                    !object.isMesh ||
                    !object.material
                ) {
                    return;
                }

                if (
                    Array.isArray(
                        object.material
                    )
                ) {
                    object.material.forEach(
                        (material) => {
                            if (
                                material
                            ) {
                                materials.add(
                                    material
                                );
                            }
                        }
                    );
                } else {
                    materials.add(
                        object.material
                    );
                }
            }
        );

        return Array.from(
            materials
        );
    }

    getAnimations(
        root
    ) {
        return root?.animations ||
            [];
    }

    getAnimationNames(
        root
    ) {
        return this.getAnimations(
            root
        ).map(
            (clip) =>
                clip.name ||
                "Unnamed Animation"
        );
    }

    hasSkeleton(
        root
    ) {
        return (
            this.getBones(
                root
            ).length > 0 ||
            this.getSkinnedMeshes(
                root
            ).length > 0
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
                            `FBXImporter event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose(
        root
    ) {
        if (
            !root
        ) {
            return;
        }

        root.traverse(
            (object) => {
                if (
                    object.geometry
                ) {
                    object.geometry.dispose();
                }

                if (
                    object.material
                ) {
                    this.disposeMaterial(
                        object.material
                    );
                }
            }
        );
    }

    disposeMaterial(
        material
    ) {
        if (
            Array.isArray(
                material
            )
        ) {
            material.forEach(
                (item) =>
                    this.disposeMaterial(
                        item
                    )
            );

            return;
        }

        if (
            !material
        ) {
            return;
        }

        Object.keys(
            material
        ).forEach(
            (key) => {
                const value =
                    material[key];

                if (
                    value &&
                    value.isTexture
                ) {
                    value.dispose();
                }
            }
        );

        material.dispose?.();
    }

    destroy() {
        this.listeners = {
            started: [],
            progress: [],
            loaded: [],
            error: [],
        };

        this.sceneManager =
            null;

        this.scene =
            null;

        this.loader =
            null;
    }
}
