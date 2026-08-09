import * as THREE from "three";

export default class SceneManager {
    constructor(options = {}) {
        this.container =
            options.container || null;

        this.scene =
            options.scene ||
            new THREE.Scene();

        this.camera =
            options.camera ||
            null;

        this.renderer =
            options.renderer ||
            null;

        this.objects = new Map();

        this.selectedObject =
            null;

        this.helpers = new Map();

        this.backgroundColor =
            options.backgroundColor ||
            0x181818;

        this.scene.background =
            new THREE.Color(
                this.backgroundColor
            );

        this.clock =
            new THREE.Clock();

        this.running =
            false;

        this.animationFrame =
            null;

        this.listeners = {
            objectAdded: [],
            objectRemoved: [],
            selectionChanged: [],
            sceneChanged: [],
        };

        this._boundAnimate =
            this.animate.bind(this);

        this._boundResize =
            this.handleResize.bind(
                this
            );

        if (
            this.container
        ) {
            this.setupRenderer();
        }
    }

    setupRenderer() {
        if (
            !this.renderer
        ) {
            this.renderer =
                new THREE.WebGLRenderer(
                    {
                        antialias: true,
                        alpha: false,
                        powerPreference:
                            "high-performance",
                    }
                );

            this.renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio ||
                        1,
                    2
                )
            );

            this.renderer.setSize(
                this.container.clientWidth ||
                    800,
                this.container.clientHeight ||
                    500,
                false
            );

            this.renderer.outputColorSpace =
                THREE.SRGBColorSpace;

            this.renderer.shadowMap.enabled =
                true;

            this.renderer.shadowMap.type =
                THREE.PCFSoftShadowMap;
        }

        if (
            this.renderer.domElement
                .parentElement !==
            this.container
        ) {
            this.container.appendChild(
                this.renderer
                    .domElement
            );
        }

        window.addEventListener(
            "resize",
            this._boundResize
        );

        this.handleResize();
    }

    handleResize() {
        if (
            !this.container ||
            !this.renderer
        ) {
            return;
        }

        const width =
            Math.max(
                1,
                this.container
                    .clientWidth
            );

        const height =
            Math.max(
                1,
                this.container
                    .clientHeight
            );

        this.renderer.setSize(
            width,
            height,
            false
        );

        if (
            this.camera &&
            this.camera.isPerspectiveCamera
        ) {
            this.camera.aspect =
                width /
                height;

            this.camera.updateProjectionMatrix();
        }

        if (
            this.camera &&
            this.camera.isOrthographicCamera
        ) {
            this.updateOrthographicCamera(
                width,
                height
            );
        }
    }

    updateOrthographicCamera(
        width,
        height
    ) {
        if (
            !this.camera ||
            !this.camera.isOrthographicCamera
        ) {
            return;
        }

        const aspect =
            width / height;

        const viewSize =
            this.camera.userData
                ?.viewSize || 10;

        this.camera.left =
            (-viewSize * aspect) /
            2;

        this.camera.right =
            (viewSize * aspect) /
            2;

        this.camera.top =
            viewSize / 2;

        this.camera.bottom =
            -viewSize / 2;

        this.camera.updateProjectionMatrix();
    }

    setCamera(camera) {
        this.camera =
            camera;

        this.handleResize();

        this.emit(
            "sceneChanged",
            {
                type:
                    "cameraChanged",
                camera,
            }
        );
    }

    setRenderer(renderer) {
        if (
            this.renderer
        ) {
            this.renderer.domElement.remove();
        }

        this.renderer =
            renderer;

        if (
            this.container &&
            this.renderer
        ) {
            this.container.appendChild(
                this.renderer
                    .domElement
            );

            this.handleResize();
        }
    }

    addObject(
        object,
        options = {}
    ) {
        if (
            !object ||
            !object.isObject3D
        ) {
            console.warn(
                "SceneManager.addObject: invalid object"
            );

            return null;
        }

        const id =
            options.id ||
            object.userData
                ?.id ||
            createId();

        object.userData =
            object.userData ||
            {};

        object.userData.id =
            id;

        if (
            options.type
        ) {
            object.userData.type =
                options.type;
        }

        this.objects.set(
            id,
            object
        );

        if (
            !object.parent
        ) {
            this.scene.add(
                object
            );
        }

        this.emit(
            "objectAdded",
            {
                object,
                id,
            }
        );

        this.emit(
            "sceneChanged",
            {
                type:
                    "objectAdded",
                object,
            }
        );

        return object;
    }

    add(
        object,
        options = {}
    ) {
        return this.addObject(
            object,
            options
        );
    }

    removeObject(
        objectOrId
    ) {
        const object =
            this.resolveObject(
                objectOrId
            );

        if (!object) {
            return false;
        }

        const id =
            object.userData
                ?.id;

        if (
            object.parent
        ) {
            object.parent.remove(
                object
            );
        }

        this.disposeObject(
            object
        );

        if (id) {
            this.objects.delete(
                id
            );
        }

        if (
            this.selectedObject ===
            object
        ) {
            this.selectObject(
                null
            );
        }

        this.emit(
            "objectRemoved",
            {
                object,
                id,
            }
        );

        this.emit(
            "sceneChanged",
            {
                type:
                    "objectRemoved",
                object,
            }
        );

        return true;
    }

    remove(
        objectOrId
    ) {
        return this.removeObject(
            objectOrId
        );
    }

    resolveObject(
        objectOrId
    ) {
        if (
            !objectOrId
        ) {
            return null;
        }

        if (
            objectOrId.isObject3D
        ) {
            return objectOrId;
        }

        return (
            this.objects.get(
                objectOrId
            ) || null
        );
    }

    getObject(id) {
        return (
            this.objects.get(
                id
            ) || null
        );
    }

    getObjects() {
        return Array.from(
            this.objects.values()
        );
    }

    findObjectByName(
        name
    ) {
        if (!name) {
            return null;
        }

        let result =
            null;

        this.scene.traverse(
            (object) => {
                if (
                    !result &&
                    object.name ===
                        name
                ) {
                    result =
                        object;
                }
            }
        );

        return result;
    }

    findObjectsByType(
        type
    ) {
        const results =
            [];

        this.scene.traverse(
            (object) => {
                if (
                    object.userData
                        ?.type ===
                    type
                ) {
                    results.push(
                        object
                    );
                }
            }
        );

        return results;
    }

    selectObject(
        objectOrId
    ) {
        const object =
            this.resolveObject(
                objectOrId
            );

        if (
            object ===
            this.selectedObject
        ) {
            return object;
        }

        const previous =
            this.selectedObject;

        this.clearSelectionHelper();

        this.selectedObject =
            object;

        if (
            object
        ) {
            this.createSelectionHelper(
                object
            );
        }

        this.emit(
            "selectionChanged",
            {
                object,
                previous,
            }
        );

        this.emit(
            "sceneChanged",
            {
                type:
                    "selectionChanged",
                object,
            }
        );

        return object;
    }

    clearSelection() {
        return this.selectObject(
            null
        );
    }

    getSelectedObject() {
        return this.selectedObject;
    }

    createSelectionHelper(
        object
    ) {
        if (
            !object ||
            !object.isObject3D
        ) {
            return null;
        }

        const helper =
            new THREE.BoxHelper(
                object,
                0x6d8baa
            );

        helper.name =
            "__selectionHelper";

        helper.renderOrder =
            999;

        this.scene.add(
            helper
        );

        this.helpers.set(
            "selection",
            helper
        );

        return helper;
    }

    clearSelectionHelper() {
        const helper =
            this.helpers.get(
                "selection"
            );

        if (!helper) {
            return;
        }

        this.scene.remove(
            helper
        );

        helper.geometry?.dispose();

        if (
            helper.material
        ) {
            helper.material.dispose();
        }

        this.helpers.delete(
            "selection"
        );
    }

    updateSelectionHelper() {
        const helper =
            this.helpers.get(
                "selection"
            );

        if (
            helper &&
            this.selectedObject
        ) {
            helper.update();
        }
    }

    addGrid(
        size = 20,
        divisions = 20,
        color1 = 0x383838,
        color2 = 0x242424
    ) {
        const existing =
            this.scene.getObjectByName(
                "__grid"
            );

        if (
            existing
        ) {
            this.scene.remove(
                existing
            );
        }

        const grid =
            new THREE.GridHelper(
                size,
                divisions,
                color1,
                color2
            );

        grid.name =
            "__grid";

        grid.userData.isHelper =
            true;

        this.scene.add(
            grid
        );

        return grid;
    }

    addAxes(
        size = 3
    ) {
        const existing =
            this.scene.getObjectByName(
                "__axes"
            );

        if (
            existing
        ) {
            this.scene.remove(
                existing
            );
        }

        const axes =
            new THREE.AxesHelper(
                size
            );

        axes.name =
            "__axes";

        axes.userData.isHelper =
            true;

        this.scene.add(
            axes
        );

        return axes;
    }

    addLights() {
        const existing =
            this.scene.getObjectByName(
                "__lights"
            );

        if (
            existing
        ) {
            return existing;
        }

        const group =
            new THREE.Group();

        group.name =
            "__lights";

        group.userData.isHelper =
            true;

        const ambient =
            new THREE.HemisphereLight(
                0xffffff,
                0x202020,
                1.4
            );

        ambient.name =
            "AmbientLight";

        group.add(
            ambient
        );

        const key =
            new THREE.DirectionalLight(
                0xffffff,
                2
            );

        key.name =
            "KeyLight";

        key.position.set(
            5,
            8,
            5
        );

        key.castShadow =
            true;

        key.shadow.mapSize.set(
            1024,
            1024
        );

        group.add(
            key
        );

        const fill =
            new THREE.DirectionalLight(
                0x9db7d1,
                0.6
            );

        fill.name =
            "FillLight";

        fill.position.set(
            -5,
            4,
            -3
        );

        group.add(
            fill
        );

        this.scene.add(
            group
        );

        return group;
    }

    clearScene(
        options = {}
    ) {
        const keepHelpers =
            options.keepHelpers !==
            false;

        const keepCamera =
            options.keepCamera !==
            false;

        const preserve =
            new Set();

        if (
            keepHelpers
        ) {
            this.scene.traverse(
                (object) => {
                    if (
                        object
                            .userData
                            ?.isHelper
                    ) {
                        preserve.add(
                            object
                        );
                    }
                }
            );
        }

        if (
            keepCamera &&
            this.camera
        ) {
            preserve.add(
                this.camera
            );
        }

        const objects =
            [];

        this.scene.traverse(
            (object) => {
                if (
                    object !==
                        this.scene &&
                    !preserve.has(
                        object
                    )
                ) {
                    objects.push(
                        object
                    );
                }
            }
        );

        const roots =
            objects.filter(
                (object) =>
                    !objects.includes(
                        object.parent
                    )
            );

        roots.forEach(
            (object) => {
                this.scene.remove(
                    object
                );

                this.disposeObject(
                    object
                );
            }
        );

        this.objects.clear();

        this.selectObject(
            null
        );

        this.emit(
            "sceneChanged",
            {
                type:
                    "sceneCleared",
            }
        );
    }

    disposeObject(
        object
    ) {
        if (
            !object
        ) {
            return;
        }

        object.traverse(
            (child) => {
                if (
                    child.geometry
                ) {
                    child.geometry.dispose();
                }

                if (
                    child.material
                ) {
                    disposeMaterial(
                        child.material
                    );
                }
            }
        );
    }

    setBackground(
        color
    ) {
        this.backgroundColor =
            color;

        this.scene.background =
            new THREE.Color(
                color
            );

        this.emit(
            "sceneChanged",
            {
                type:
                    "backgroundChanged",
                color,
            }
        );
    }

    start() {
        if (
            this.running
        ) {
            return;
        }

        this.running =
            true;

        this.clock.start();

        this.animationFrame =
            requestAnimationFrame(
                this._boundAnimate
            );
    }

    stop() {
        this.running =
            false;

        if (
            this.animationFrame !==
            null
        ) {
            cancelAnimationFrame(
                this.animationFrame
            );

            this.animationFrame =
                null;
        }
    }

    animate() {
        if (
            !this.running
        ) {
            return;
        }

        const delta =
            this.clock.getDelta();

        this.update(
            delta
        );

        this.render();

        this.animationFrame =
            requestAnimationFrame(
                this._boundAnimate
            );
    }

    update(delta) {
        this.updateSelectionHelper();

        this.emit(
            "sceneChanged",
            {
                type:
                    "update",
                delta,
            }
        );
    }

    render() {
        if (
            !this.renderer ||
            !this.camera
        ) {
            return;
        }

        this.renderer.render(
            this.scene,
            this.camera
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
                            `SceneManager event error (${event})`,
                            error
                        );
                    }
                }
            );
    }

    getScene() {
        return this.scene;
    }

    getRenderer() {
        return this.renderer;
    }

    getCamera() {
        return this.camera;
    }

    destroy() {
        this.stop();

        window.removeEventListener(
            "resize",
            this._boundResize
        );

        this.clearSelectionHelper();

        this.objects.forEach(
            (object) => {
                this.disposeObject(
                    object
                );
            }
        );

        this.objects.clear();

        if (
            this.renderer
        ) {
            this.renderer.dispose();

            if (
                this.renderer
                    .domElement
                    .parentElement
            ) {
                this.renderer
                    .domElement
                    .parentElement.removeChild(
                        this.renderer
                            .domElement
                    );
            }
        }

        this.listeners = {
            objectAdded: [],
            objectRemoved: [],
            selectionChanged: [],
            sceneChanged: [],
        };
    }
}

function createId() {
    return (
        "object_" +
        Math.random()
            .toString(36)
            .slice(2, 10) +
        "_" +
        Date.now().toString(
            36
        )
    );
}

function disposeMaterial(
    material
) {
    if (
        Array.isArray(
            material
        )
    ) {
        material.forEach(
            disposeMaterial
        );
        return;
    }

    if (!material) {
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
