import * as THREE from "three";

export default class Lighting {
    constructor(scene, options = {}) {
        this.scene =
            scene?.scene ||
            scene ||
            null;

        this.enabled =
            options.enabled !== false;

        this.ambientIntensity =
            Number.isFinite(
                options.ambientIntensity
            )
                ? options.ambientIntensity
                : 1.2;

        this.keyIntensity =
            Number.isFinite(
                options.keyIntensity
            )
                ? options.keyIntensity
                : 2.0;

        this.fillIntensity =
            Number.isFinite(
                options.fillIntensity
            )
                ? options.fillIntensity
                : 0.6;

        this.ambientColor =
            options.ambientColor ||
            0xffffff;

        this.groundColor =
            options.groundColor ||
            0x202020;

        this.keyColor =
            options.keyColor ||
            0xffffff;

        this.fillColor =
            options.fillColor ||
            0x9db7d1;

        this.group =
            new THREE.Group();

        this.group.name =
            "__lighting";

        this.group.userData.isHelper =
            true;

        this.ambient =
            null;

        this.key =
            null;

        this.fill =
            null;

        this.rim =
            null;

        this.hemi =
            null;

        this.initialized =
            false;

        if (
            this.scene
        ) {
            this.setup();
        }
    }

    setup() {
        if (
            this.initialized
        ) {
            return this.group;
        }

        if (!this.scene) {
            return null;
        }

        const existing =
            this.scene.getObjectByName(
                "__lighting"
            );

        if (
            existing
        ) {
            this.group =
                existing;

            this.findLights();

            this.initialized =
                true;

            return this.group;
        }

        this.createAmbient();
        this.createKey();
        this.createFill();
        this.createRim();

        this.scene.add(
            this.group
        );

        this.initialized =
            true;

        this.setEnabled(
            this.enabled
        );

        return this.group;
    }

    createAmbient() {
        this.ambient =
            new THREE.AmbientLight(
                this.ambientColor,
                this.ambientIntensity
            );

        this.ambient.name =
            "AmbientLight";

        this.group.add(
            this.ambient
        );

        return this.ambient;
    }

    createKey() {
        this.key =
            new THREE.DirectionalLight(
                this.keyColor,
                this.keyIntensity
            );

        this.key.name =
            "KeyLight";

        this.key.position.set(
            5,
            8,
            5
        );

        this.key.castShadow =
            true;

        this.configureShadow(
            this.key
        );

        this.group.add(
            this.key
        );

        return this.key;
    }

    createFill() {
        this.fill =
            new THREE.DirectionalLight(
                this.fillColor,
                this.fillIntensity
            );

        this.fill.name =
            "FillLight";

        this.fill.position.set(
            -5,
            4,
            -3
        );

        this.fill.castShadow =
            false;

        this.group.add(
            this.fill
        );

        return this.fill;
    }

    createRim() {
        this.rim =
            new THREE.DirectionalLight(
                0xffffff,
                0.5
            );

        this.rim.name =
            "RimLight";

        this.rim.position.set(
            2,
            5,
            -6
        );

        this.rim.castShadow =
            false;

        this.group.add(
            this.rim
        );

        return this.rim;
    }

    createHemisphere(
        options = {}
    ) {
        if (
            this.hemi
        ) {
            return this.hemi;
        }

        this.hemi =
            new THREE.HemisphereLight(
                options.skyColor ||
                    0xffffff,
                options.groundColor ||
                    this.groundColor,
                Number.isFinite(
                    options.intensity
                )
                    ? options.intensity
                    : 0.8
            );

        this.hemi.name =
            "HemisphereLight";

        this.group.add(
            this.hemi
        );

        return this.hemi;
    }

    configureShadow(
        light
    ) {
        if (
            !light ||
            !light.shadow
        ) {
            return;
        }

        light.shadow.mapSize.width =
            1024;

        light.shadow.mapSize.height =
            1024;

        light.shadow.camera.near =
            0.1;

        light.shadow.camera.far =
            100;

        light.shadow.camera.left =
            -20;

        light.shadow.camera.right =
            20;

        light.shadow.camera.top =
            20;

        light.shadow.camera.bottom =
            -20;

        light.shadow.bias =
            -0.0001;

        light.shadow.normalBias =
            0.02;
    }

    findLights() {
        if (
            !this.group
        ) {
            return;
        }

        this.ambient =
            this.group.getObjectByName(
                "AmbientLight"
            );

        this.key =
            this.group.getObjectByName(
                "KeyLight"
            );

        this.fill =
            this.group.getObjectByName(
                "FillLight"
            );

        this.rim =
            this.group.getObjectByName(
                "RimLight"
            );

        this.hemi =
            this.group.getObjectByName(
                "HemisphereLight"
            );
    }

    setEnabled(
        enabled
    ) {
        this.enabled =
            Boolean(enabled);

        if (
            !this.group
        ) {
            return;
        }

        this.group.visible =
            this.enabled;
    }

    toggle() {
        this.setEnabled(
            !this.enabled
        );

        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    setAmbientIntensity(
        value
    ) {
        this.ambientIntensity =
            Math.max(
                0,
                Number(value) || 0
            );

        if (
            this.ambient
        ) {
            this.ambient.intensity =
                this.ambientIntensity;
        }
    }

    setKeyIntensity(
        value
    ) {
        this.keyIntensity =
            Math.max(
                0,
                Number(value) || 0
            );

        if (
            this.key
        ) {
            this.key.intensity =
                this.keyIntensity;
        }
    }

    setFillIntensity(
        value
    ) {
        this.fillIntensity =
            Math.max(
                0,
                Number(value) || 0
            );

        if (
            this.fill
        ) {
            this.fill.intensity =
                this.fillIntensity;
        }
    }

    setRimIntensity(
        value
    ) {
        if (
            !this.rim
        ) {
            return;
        }

        this.rim.intensity =
            Math.max(
                0,
                Number(value) || 0
            );
    }

    setAmbientColor(
        color
    ) {
        this.ambientColor =
            color;

        if (
            this.ambient
        ) {
            this.ambient.color.set(
                color
            );
        }
    }

    setKeyColor(
        color
    ) {
        this.keyColor =
            color;

        if (
            this.key
        ) {
            this.key.color.set(
                color
            );
        }
    }

    setFillColor(
        color
    ) {
        this.fillColor =
            color;

        if (
            this.fill
        ) {
            this.fill.color.set(
                color
            );
        }
    }

    setKeyPosition(
        x,
        y,
        z
    ) {
        if (
            !this.key
        ) {
            return;
        }

        if (
            x?.isVector3
        ) {
            this.key.position.copy(
                x
            );
        } else {
            this.key.position.set(
                Number(x) || 0,
                Number(y) || 0,
                Number(z) || 0
            );
        }
    }

    setFillPosition(
        x,
        y,
        z
    ) {
        if (
            !this.fill
        ) {
            return;
        }

        if (
            x?.isVector3
        ) {
            this.fill.position.copy(
                x
            );
        } else {
            this.fill.position.set(
                Number(x) || 0,
                Number(y) || 0,
                Number(z) || 0
            );
        }
    }

    setRimPosition(
        x,
        y,
        z
    ) {
        if (
            !this.rim
        ) {
            return;
        }

        if (
            x?.isVector3
        ) {
            this.rim.position.copy(
                x
            );
        } else {
            this.rim.position.set(
                Number(x) || 0,
                Number(y) || 0,
                Number(z) || 0
            );
        }
    }

    aimLight(
        light,
        target
    ) {
        if (
            !light ||
            !target
        ) {
            return;
        }

        const targetPosition =
            target.isObject3D
                ? target.position
                : target;

        const direction =
            targetPosition
                .clone()
                .sub(
                    light.position
                )
                .normalize();

        light.rotation.set(
            0,
            0,
            0
        );

        light.lookAt(
            light.position
                .clone()
                .add(
                    direction
                )
        );
    }

    aimKeyAt(
        target
    ) {
        this.aimLight(
            this.key,
            target
        );
    }

    aimFillAt(
        target
    ) {
        this.aimLight(
            this.fill,
            target
        );
    }

    aimRimAt(
        target
    ) {
        this.aimLight(
            this.rim,
            target
        );
    }

    setShadowEnabled(
        enabled
    ) {
        if (
            this.key
        ) {
            this.key.castShadow =
                Boolean(enabled);
        }
    }

    setShadowMapSize(
        size
    ) {
        if (
            !this.key
        ) {
            return;
        }

        const mapSize =
            Math.max(
                128,
                Number(size) ||
                    1024
            );

        this.key.shadow.mapSize.set(
            mapSize,
            mapSize
        );

        this.key.shadow.map?.dispose();

        this.key.shadow.map =
            null;
    }

    setShadowCamera(
        options = {}
    ) {
        if (
            !this.key
        ) {
            return;
        }

        const camera =
            this.key.shadow.camera;

        if (
            Number.isFinite(
                options.near
            )
        ) {
            camera.near =
                options.near;
        }

        if (
            Number.isFinite(
                options.far
            )
        ) {
            camera.far =
                options.far;
        }

        if (
            Number.isFinite(
                options.left
            )
        ) {
            camera.left =
                options.left;
        }

        if (
            Number.isFinite(
                options.right
            )
        ) {
            camera.right =
                options.right;
        }

        if (
            Number.isFinite(
                options.top
            )
        ) {
            camera.top =
                options.top;
        }

        if (
            Number.isFinite(
                options.bottom
            )
        ) {
            camera.bottom =
                options.bottom;
        }

        camera.updateProjectionMatrix();
    }

    setAllIntensity(
        value
    ) {
        const intensity =
            Math.max(
                0,
                Number(value) || 0
            );

        if (
            this.ambient
        ) {
            this.ambient.intensity =
                intensity;
        }

        if (
            this.key
        ) {
            this.key.intensity =
                intensity;
        }

        if (
            this.fill
        ) {
            this.fill.intensity =
                intensity * 0.5;
        }

        if (
            this.rim
        ) {
            this.rim.intensity =
                intensity * 0.25;
        }
    }

    getState() {
        return {
            enabled:
                this.enabled,

            ambient: {
                color:
                    this.ambient
                        ?.color
                        .getHex(),
                intensity:
                    this.ambient
                        ?.intensity ??
                    0,
            },

            key: {
                color:
                    this.key
                        ?.color
                        .getHex(),
                intensity:
                    this.key
                        ?.intensity ??
                    0,
                position:
                    this.key
                        ? {
                              x:
                                  this.key
                                      .position
                                      .x,
                              y:
                                  this.key
                                      .position
                                      .y,
                              z:
                                  this.key
                                      .position
                                      .z,
                          }
                        : null,
                castShadow:
                    this.key
                        ?.castShadow ??
                    false,
            },

            fill: {
                color:
                    this.fill
                        ?.color
                        .getHex(),
                intensity:
                    this.fill
                        ?.intensity ??
                    0,
                position:
                    this.fill
                        ? {
                              x:
                                  this.fill
                                      .position
                                      .x,
                              y:
                                  this.fill
                                      .position
                                      .y,
                              z:
                                  this.fill
                                      .position
                                      .z,
                          }
                        : null,
            },

            rim: {
                color:
                    this.rim
                        ?.color
                        .getHex(),
                intensity:
                    this.rim
                        ?.intensity ??
                    0,
                position:
                    this.rim
                        ? {
                              x:
                                  this.rim
                                      .position
                                      .x,
                              y:
                                  this.rim
                                      .position
                                      .y,
                              z:
                                  this.rim
                                      .position
                                      .z,
                          }
                        : null,
            },
        };
    }

    setState(
        state = {}
    ) {
        if (
            typeof state.enabled ===
            "boolean"
        ) {
            this.setEnabled(
                state.enabled
            );
        }

        if (
            state.ambient
        ) {
            if (
                state.ambient
                    .color !==
                undefined
            ) {
                this.setAmbientColor(
                    state.ambient
                        .color
                );
            }

            if (
                Number.isFinite(
                    state.ambient
                        .intensity
                )
            ) {
                this.setAmbientIntensity(
                    state.ambient
                        .intensity
                );
            }
        }

        if (
            state.key
        ) {
            if (
                state.key.color !==
                undefined
            ) {
                this.setKeyColor(
                    state.key.color
                );
            }

            if (
                Number.isFinite(
                    state.key
                        .intensity
                )
            ) {
                this.setKeyIntensity(
                    state.key
                        .intensity
                );
            }

            if (
                state.key.position
            ) {
                this.setKeyPosition(
                    state.key
                        .position.x,
                    state.key
                        .position.y,
                    state.key
                        .position.z
                );
            }

            if (
                typeof state.key
                    .castShadow ===
                "boolean"
            ) {
                this.setShadowEnabled(
                    state.key
                        .castShadow
                );
            }
        }

        if (
            state.fill
        ) {
            if (
                state.fill.color !==
                undefined
            ) {
                this.setFillColor(
                    state.fill.color
                );
            }

            if (
                Number.isFinite(
                    state.fill
                        .intensity
                )
            ) {
                this.setFillIntensity(
                    state.fill
                        .intensity
                );
            }

            if (
                state.fill.position
            ) {
                this.setFillPosition(
                    state.fill
                        .position.x,
                    state.fill
                        .position.y,
                    state.fill
                        .position.z
                );
            }
        }

        if (
            state.rim
        ) {
            if (
                Number.isFinite(
                    state.rim
                        .intensity
                )
            ) {
                this.setRimIntensity(
                    state.rim
                        .intensity
                );
            }

            if (
                state.rim.position
            ) {
                this.setRimPosition(
                    state.rim
                        .position.x,
                    state.rim
                        .position.y,
                    state.rim
                        .position.z
                );
            }
        }
    }

    getGroup() {
        return this.group;
    }

    dispose() {
        if (
            !this.group
        ) {
            return;
        }

        this.group.traverse(
            (object) => {
                if (
                    object.shadow?.map
                ) {
                    object.shadow.map.dispose();
                }
            }
        );

        if (
            this.group.parent
        ) {
            this.group.parent.remove(
                this.group
            );
        }

        this.ambient =
            null;

        this.key =
            null;

        this.fill =
            null;

        this.rim =
            null;

        this.hemi =
            null;

        this.group =
            null;

        this.initialized =
            false;
    }
}
