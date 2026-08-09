import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class GLBImporter {
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
            new GLTFLoader(
                this.loadingManager
            );

        this.dracoLoader =
            options.dracoLoader ||
            null;

        this.meshoptDecoder =
            options.meshoptDecoder ||
            null;

        this.listeners = {
            started: [],
            progress: [],
            loaded: [],
            error: [],
        };

        this.configureLoader();
    }

    configureLoader() {
        if (
            this.dracoLoader &&
            typeof this.loader.setDRACOLoader ===
                "function"
        ) {
            this.loader.setDRACOLoader(
                this.dracoLoader
            );
        }

        if (
            this.meshoptDecoder &&
            typeof this.loader.setMeshoptDecoder ===
                "function"
        ) {
            this.loader.setMeshoptDecoder(
                this.meshoptDecoder
            );
        }
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
                "GLBImporter: invalid GLTFLoader."
            );
        }

        this.loader =
            loader;

        this.configureLoader();
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
                "No GLB/GLTF source was provided."
            );
        }

        this.emit(
            "started",
            {
                source,
            }
        );

        try {
            const gltf =
                await this.load(
                    source
                );

            const result =
                this.processGLTF(
                    gltf,
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
            "Unsupported GLB source. Expected a URL, File, Blob, or ArrayBuffer."
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
                "GLBImporter.parse expects an ArrayBuffer."
            );
        }

        return new Promise(
            (
                resolve,
                reject
            ) => {
                this.loader.parse(
                    arrayBuffer,
                    "",
                    resolve,
                    reject
                );
            }
        );
    }

    processGLTF(
        gltf,
        options = {}
    ) {
        if (
            !gltf ||
            !gltf.scene
        ) {
            throw new Error(
                "The GLB/GLTF file did not contain a valid scene."
            );
        }

        const root =
            gltf.scene;

        const name =
            options.name ||
            root.name ||
            "Imported Model";

        root.name =
            name;

        root.userData =
            root.userData ||
            {};

        root.userData.imported =
            true;

        root.userData.sourceFormat =
            "glb";

        root.userData.assetType =
            "model";

        this.prepareObject(
            root,
            options
        );

        if (
            options.addToScene !==
            false
        ) {
            this.addToScene(
                root,
                options
            );
        }

        const metadata =
            this.collectMetadata(
                gltf,
                root
            );

        return {
            gltf,
            scene:
                root,
            root,
            animations:
                gltf.animations ||
                [],
            cameras:
                gltf.cameras ||
                [],
            asset:
                gltf.asset ||
                null,
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

                    if (
                        options.castShadow !==
                        false
                    ) {
                        child.castShadow =
                            true;
                    }

                    if (
                        options.receiveShadow !==
                        false
                    ) {
                        child.receiveShadow =
                            true;
                    }

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

        this.centerObject(
            object,
            options
        );

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

                const maps = [
                    "map",
                    "normalMap",
                    "roughnessMap",
                    "metalnessMap",
                    "aoMap",
                    "emissiveMap",
                    "alphaMap",
                    "bumpMap",
                    "displacementMap",
                ];

                maps.forEach(
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
        if (
            options.center ===
            false
        ) {
            return;
        }

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
            return;
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
            "GLBImporter: no scene or SceneManager is available."
        );
    }

    collectMetadata(
        gltf,
        root
    ) {
        let meshes = 0;
        let skinnedMeshes = 0;
        let bones = 0;
        let cameras = 0;
        let lights = 0;
        let objects = 0;

        root.traverse(
            (object) => {
                objects += 1;

                if (
                    object.isMesh
                ) {
                    meshes += 1;
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

        return {
            version:
                gltf.asset
                    ?.version ||
                null,

            generator:
                gltf.asset
                    ?.generator ||
                null,

            copyright:
                gltf.asset
                    ?.copyright ||
                null,

            objects,

            meshes,

            skinnedMeshes,

            bones,

            cameras,

            lights,

            animations:
                gltf.animations
                    ?.length ||
                0,

            rootName:
                root.name,
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
                        (
                            material
                        ) => {
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

    getAnimations(
        gltf
    ) {
        return gltf?.animations ||
            [];
    }

    getAnimationNames(
        gltf
    ) {
        return this.getAnimations(
            gltf
        ).map(
            (clip) =>
                clip.name ||
                "Unnamed Animation"
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

        if (!listeners) {
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

        if (!listeners) {
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
                            `GLBImporter event error (${event}):`,
                            error
                        );
                    }
                }
            );
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
