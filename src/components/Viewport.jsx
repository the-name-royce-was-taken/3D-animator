import {
    useEffect,
    useRef,
    useState,
} from "react";

import * as THREE from "three";

import {
    OrbitControls,
} from "three/examples/jsm/controls/OrbitControls.js";

import {
    TransformControls,
} from "three/examples/jsm/controls/TransformControls.js";

export default function Viewport({
    selectedTool = "select",
    onSelectionChange = () => {},
    onStatusChange = () => {},
}) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const transformRef = useRef(null);
    const objectsRef = useRef([]);
    const selectedRef = useRef(null);
    const animationRef = useRef(0);

    const [ready, setReady] = useState(false);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return undefined;
        }

        const scene = new THREE.Scene();

        scene.background =
            new THREE.Color(0x171717);

        sceneRef.current = scene;

        const camera =
            new THREE.PerspectiveCamera(
                50,
                1,
                0.1,
                2000
            );

        camera.position.set(
            5,
            4,
            7
        );

        camera.lookAt(
            0,
            1,
            0
        );

        cameraRef.current = camera;

        const renderer =
            new THREE.WebGLRenderer({
                antialias: true,
                alpha: false,
                preserveDrawingBuffer: true,
            });

        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                2
            )
        );

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type =
            THREE.PCFSoftShadowMap;

        renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        renderer.toneMapping =
            THREE.ACESFilmicToneMapping;

        renderer.toneMappingExposure = 1;

        renderer.domElement.style.width =
            "100%";

        renderer.domElement.style.height =
            "100%";

        renderer.domElement.style.display =
            "block";

        rendererRef.current = renderer;

        container.appendChild(
            renderer.domElement
        );

        const orbit =
            new OrbitControls(
                camera,
                renderer.domElement
            );

        orbit.enableDamping = true;
        orbit.dampingFactor = 0.08;
        orbit.target.set(
            0,
            1,
            0
        );

        controlsRef.current = orbit;

        const transform =
            new TransformControls(
                camera,
                renderer.domElement
            );

        transform.setMode("translate");
        transform.setSpace("world");
        transform.size = 0.8;

        transform.addEventListener(
            "dragging-changed",
            (event) => {
                orbit.enabled =
                    !event.value;
            }
        );

        transform.addEventListener(
            "objectChange",
            () => {
                if (
                    selectedRef.current
                ) {
                    onStatusChange(
                        "Object transformed"
                    );
                }
            }
        );

        scene.add(transform);

        transformRef.current =
            transform;

        const ambient =
            new THREE.AmbientLight(
                0xffffff,
                1.5
            );

        scene.add(ambient);

        const key =
            new THREE.DirectionalLight(
                0xffffff,
                3
            );

        key.position.set(
            5,
            10,
            5
        );

        key.castShadow = true;

        key.shadow.mapSize.width = 2048;
        key.shadow.mapSize.height = 2048;

        scene.add(key);

        const fill =
            new THREE.DirectionalLight(
                0x88aaff,
                1
            );

        fill.position.set(
            -5,
            4,
            -4
        );

        scene.add(fill);

        const grid =
            new THREE.GridHelper(
                20,
                40,
                0x555555,
                0x292929
            );

        grid.position.y = 0;

        scene.add(grid);

        const axes =
            new THREE.AxesHelper(2);

        scene.add(axes);

        const floor =
            new THREE.Mesh(
                new THREE.PlaneGeometry(
                    20,
                    20
                ),
                new THREE.MeshStandardMaterial(
                    {
                        color: 0x202020,
                        roughness: 0.9,
                        metalness: 0,
                    }
                )
            );

        floor.rotation.x =
            -Math.PI / 2;

        floor.receiveShadow = true;

        floor.name =
            "Viewport Floor";

        scene.add(floor);

        const group =
            new THREE.Group();

        group.name =
            "Character";

        const body =
            new THREE.Mesh(
                new THREE.CapsuleGeometry(
                    0.65,
                    1.8,
                    8,
                    16
                ),
                new THREE.MeshStandardMaterial(
                    {
                        color: 0x6688aa,
                        roughness: 0.7,
                        metalness: 0.05,
                    }
                )
            );

        body.position.y = 1.75;
        body.castShadow = true;
        body.receiveShadow = true;

        body.name =
            "Character Body";

        group.add(body);

        const head =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.55,
                    24,
                    16
                ),
                new THREE.MeshStandardMaterial(
                    {
                        color: 0x8899aa,
                        roughness: 0.65,
                    }
                )
            );

        head.position.y = 3.25;
        head.castShadow = true;
        head.receiveShadow = true;

        head.name =
            "Character Head";

        group.add(head);

        const leftArm =
            createLimb(
                0.18,
                1.5,
                0x557799
            );

        leftArm.position.set(
            -0.85,
            2,
            0
        );

        leftArm.rotation.z =
            -0.15;

        leftArm.name =
            "Left Arm";

        group.add(leftArm);

        const rightArm =
            createLimb(
                0.18,
                1.5,
                0x557799
            );

        rightArm.position.set(
            0.85,
            2,
            0
        );

        rightArm.rotation.z =
            0.15;

        rightArm.name =
            "Right Arm";

        group.add(rightArm);

        const leftLeg =
            createLimb(
                0.22,
                1.8,
                0x446688
            );

        leftLeg.position.set(
            -0.32,
            0.65,
            0
        );

        leftLeg.name =
            "Left Leg";

        group.add(leftLeg);

        const rightLeg =
            createLimb(
                0.22,
                1.8,
                0x446688
            );

        rightLeg.position.set(
            0.32,
            0.65,
            0
        );

        rightLeg.name =
            "Right Leg";

        group.add(rightLeg);

        scene.add(group);

        objectsRef.current = [
            body,
            head,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
        ];

        const raycaster =
            new THREE.Raycaster();

        const pointer =
            new THREE.Vector2();

        const handlePointerDown =
            (event) => {
                const rect =
                    renderer.domElement.getBoundingClientRect();

                pointer.x =
                    ((event.clientX -
                        rect.left) /
                        rect.width) *
                        2 -
                    1;

                pointer.y =
                    -(
                        ((event.clientY -
                            rect.top) /
                            rect.height) *
                            2 -
                        1
                    );

                raycaster.setFromCamera(
                    pointer,
                    camera
                );

                const hits =
                    raycaster.intersectObjects(
                        objectsRef.current,
                        true
                    );

                if (hits.length === 0) {
                    clearSelection();
                    return;
                }

                const object =
                    hits[0].object;

                selectObject(object);
            };

        renderer.domElement.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        const resize =
            () => {
                const width =
                    Math.max(
                        container.clientWidth,
                        1
                    );

                const height =
                    Math.max(
                        container.clientHeight,
                        1
                    );

                camera.aspect =
                    width / height;

                camera.updateProjectionMatrix();

                renderer.setSize(
                    width,
                    height,
                    false
                );
            };

        const observer =
            new ResizeObserver(
                resize
            );

        observer.observe(
            container
        );

        resize();

        const clock =
            new THREE.Clock();

        const animate =
            () => {
                animationRef.current =
                    requestAnimationFrame(
                        animate
                    );

                const delta =
                    clock.getDelta();

                orbit.update();

                if (
                    selectedRef.current &&
                    selectedRef.current.userData
                        .idleAnimation
                ) {
                    selectedRef.current.rotation.y +=
                        delta * 0.15;
                }

                renderer.render(
                    scene,
                    camera
                );
            };

        animate();

        setReady(true);

        onStatusChange(
            "3D viewport ready"
        );

        return () => {
            cancelAnimationFrame(
                animationRef.current
            );

            observer.disconnect();

            renderer.domElement.removeEventListener(
                "pointerdown",
                handlePointerDown
            );

            transform.detach();

            orbit.dispose();

            renderer.dispose();

            scene.traverse(
                (object) => {
                    if (
                        object.geometry
                    ) {
                        object.geometry.dispose();
                    }

                    if (
                        object.material
                    ) {
                        disposeMaterial(
                            object.material
                        );
                    }
                }
            );

            if (
                renderer.domElement.parentNode ===
                container
            ) {
                container.removeChild(
                    renderer.domElement
                );
            }

            sceneRef.current = null;
            cameraRef.current = null;
            rendererRef.current = null;
            controlsRef.current = null;
            transformRef.current = null;
            objectsRef.current = [];
            selectedRef.current = null;
        };
    }, [
        onSelectionChange,
        onStatusChange,
    ]);

    useEffect(() => {
        const transform =
            transformRef.current;

        if (!transform) {
            return;
        }

        const modeMap = {
            select: "translate",
            move: "translate",
            rotate: "rotate",
            scale: "scale",
        };

        transform.setMode(
            modeMap[selectedTool] ||
                "translate"
        );
    }, [selectedTool]);

    const selectObject =
        (object) => {
            const transform =
                transformRef.current;

            if (
                selectedRef.current
            ) {
                restoreMaterial(
                    selectedRef.current
                );
            }

            selectedRef.current =
                object;

            highlightMaterial(
                object
            );

            if (transform) {
                transform.attach(
                    object
                );
            }

            onSelectionChange(
                object
            );

            onStatusChange(
                `Selected ${object.name || "object"}`
            );
        };

    const clearSelection =
        () => {
            const transform =
                transformRef.current;

            if (
                selectedRef.current
            ) {
                restoreMaterial(
                    selectedRef.current
                );
            }

            selectedRef.current =
                null;

            if (transform) {
                transform.detach();
            }

            onSelectionChange(
                null
            );

            onStatusChange(
                "Nothing selected"
            );
        };

    const resetView =
        () => {
            const camera =
                cameraRef.current;

            const controls =
                controlsRef.current;

            if (
                !camera ||
                !controls
            ) {
                return;
            }

            camera.position.set(
                5,
                4,
                7
            );

            controls.target.set(
                0,
                1,
                0
            );

            controls.update();

            onStatusChange(
                "Viewport reset"
            );
        };

    return (
        <div
            ref={containerRef}
            className="viewport-container"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: "300px",
                overflow: "hidden",
                background: "#171717",
            }}
        >
            {!ready && (
                <div
                    style={{
                        position:
                            "absolute",
                        inset: 0,
                        zIndex: 5,
                        display:
                            "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        background:
                            "#171717",
                        color:
                            "#aaa",
                        fontFamily:
                            "Arial, sans-serif",
                    }}
                >
                    Loading 3D viewport...
                </div>
            )}

            <div
                style={{
                    position:
                        "absolute",
                    top: "12px",
                    left: "12px",
                    zIndex: 10,
                    display:
                        "flex",
                    gap: "6px",
                    pointerEvents:
                        "auto",
                }}
            >
                <button
                    type="button"
                    onClick={
                        resetView
                    }
                >
                    Reset View
                </button>

                <div
                    style={{
                        padding:
                            "7px 10px",
                        background:
                            "rgba(20,20,20,.8)",
                        border:
                            "1px solid #444",
                        borderRadius:
                            "4px",
                        color:
                            "#aaa",
                        fontSize:
                            "12px",
                        fontFamily:
                            "monospace",
                    }}
                >
                    {selectedTool.toUpperCase()}
                </div>
            </div>
        </div>
    );
}

function createLimb(
    radius,
    height,
    color
) {
    const mesh =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                radius,
                height,
                6,
                12
            ),
            new THREE.MeshStandardMaterial(
                {
                    color,
                    roughness: 0.75,
                }
            )
        );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}

function highlightMaterial(
    object
) {
    if (!object.material) {
        return;
    }

    if (
        Array.isArray(
            object.material
        )
    ) {
        object.userData.originalMaterials =
            object.material.map(
                (material) => ({
                    material,
                    color:
                        material.color
                            ? material.color.clone()
                            : null,
                    emissive:
                        material.emissive
                            ? material.emissive.clone()
                            : null,
                })
            );

        object.material.forEach(
            (material) => {
                if (
                    material.emissive
                ) {
                    material.emissive.set(
                        0x224466
                    );
                }
            }
        );

        return;
    }

    const material =
        object.material;

    object.userData.originalMaterial = {
        color:
            material.color
                ? material.color.clone()
                : null,
        emissive:
            material.emissive
                ? material.emissive.clone()
                : null,
    };

    if (
        material.emissive
    ) {
        material.emissive.set(
            0x224466
        );
    }
}

function restoreMaterial(
    object
) {
    if (!object.material) {
        return;
    }

    const original =
        object.userData.originalMaterial;

    if (original) {
        if (
            original.color &&
            object.material.color
        ) {
            object.material.color.copy(
                original.color
            );
        }

        if (
            original.emissive &&
            object.material.emissive
        ) {
            object.material.emissive.copy(
                original.emissive
            );
        }

        delete object.userData
            .originalMaterial;
    }

    const originals =
        object.userData
            .originalMaterials;

    if (
        originals &&
        Array.isArray(
            object.material
        )
    ) {
        originals.forEach(
            ({
                material,
                color,
                emissive,
            }) => {
                if (
                    color &&
                    material.color
                ) {
                    material.color.copy(
                        color
                    );
                }

                if (
                    emissive &&
                    material.emissive
                ) {
                    material.emissive.copy(
                        emissive
                    );
                }
            }
        );

        delete object.userData
            .originalMaterials;
    }
}

function disposeMaterial(
    material
) {
    const materials =
        Array.isArray(material)
            ? material
            : [material];

    materials.forEach(
        (item) => {
            if (
                item.map
            ) {
                item.map.dispose();
            }

            if (
                item.normalMap
            ) {
                item.normalMap.dispose();
            }

            if (
                item.roughnessMap
            ) {
                item.roughnessMap.dispose();
            }

            if (
                item.metalnessMap
            ) {
                item.metalnessMap.dispose();
            }

            item.dispose();
        }
    );
}
