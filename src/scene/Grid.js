import * as THREE from "three";

export default class Grid {
    constructor(scene, options = {}) {
        this.scene =
            scene?.scene ||
            scene ||
            null;

        this.size =
            Number.isFinite(
                options.size
            )
                ? options.size
                : 20;

        this.divisions =
            Number.isFinite(
                options.divisions
            )
                ? Math.max(
                      1,
                      Math.floor(
                          options.divisions
                      )
                  )
                : 20;

        this.majorColor =
            options.majorColor ||
            0x444444;

        this.minorColor =
            options.minorColor ||
            0x282828;

        this.visible =
            options.visible !== false;

        this.height =
            Number.isFinite(
                options.height
            )
                ? options.height
                : 0;

        this.group =
            new THREE.Group();

        this.group.name =
            "__grid";

        this.group.userData.isHelper =
            true;

        this.grid =
            null;

        this.axes =
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

        if (
            !this.scene
        ) {
            return null;
        }

        const existing =
            this.scene.getObjectByName(
                "__grid"
            );

        if (
            existing
        ) {
            this.group =
                existing;

            this.grid =
                existing.getObjectByName(
                    "Grid"
                );

            this.axes =
                existing.getObjectByName(
                    "Axes"
                );

            this.initialized =
                true;

            this.setVisible(
                this.visible
            );

            return this.group;
        }

        this.createGrid();

        this.createAxes();

        this.scene.add(
            this.group
        );

        this.initialized =
            true;

        this.setVisible(
            this.visible
        );

        return this.group;
    }

    createGrid() {
        if (
            this.grid
        ) {
            this.group.remove(
                this.grid
            );

            this.grid.geometry?.dispose();
            this.grid.material?.dispose();
        }

        this.grid =
            new THREE.GridHelper(
                this.size,
                this.divisions,
                this.majorColor,
                this.minorColor
            );

        this.grid.name =
            "Grid";

        this.grid.position.y =
            this.height;

        this.grid.userData.isHelper =
            true;

        this.group.add(
            this.grid
        );

        return this.grid;
    }

    createAxes(
        size = 3
    ) {
        if (
            this.axes
        ) {
            this.group.remove(
                this.axes
            );

            this.axes.geometry?.dispose();
            this.axes.material?.dispose();
        }

        this.axes =
            new THREE.AxesHelper(
                size
            );

        this.axes.name =
            "Axes";

        this.axes.position.y =
            this.height +
            0.002;

        this.axes.userData.isHelper =
            true;

        this.group.add(
            this.axes
        );

        return this.axes;
    }

    setSize(
        size
    ) {
        const nextSize =
            Number(size);

        if (
            !Number.isFinite(
                nextSize
            ) ||
            nextSize <= 0
        ) {
            return;
        }

        this.size =
            nextSize;

        this.createGrid();
    }

    setDivisions(
        divisions
    ) {
        const nextDivisions =
            Math.max(
                1,
                Math.floor(
                    Number(
                        divisions
                    ) || 1
                )
            );

        this.divisions =
            nextDivisions;

        this.createGrid();
    }

    setHeight(
        height
    ) {
        const nextHeight =
            Number(height);

        if (
            !Number.isFinite(
                nextHeight
            )
        ) {
            return;
        }

        this.height =
            nextHeight;

        if (
            this.grid
        ) {
            this.grid.position.y =
                nextHeight;
        }

        if (
            this.axes
        ) {
            this.axes.position.y =
                nextHeight +
                0.002;
        }
    }

    setColors(
        majorColor,
        minorColor
    ) {
        if (
            majorColor !==
            undefined
        ) {
            this.majorColor =
                majorColor;
        }

        if (
            minorColor !==
            undefined
        ) {
            this.minorColor =
                minorColor;
        }

        this.createGrid();
    }

    setVisible(
        visible
    ) {
        this.visible =
            Boolean(visible);

        if (
            this.group
        ) {
            this.group.visible =
                this.visible;
        }
    }

    toggle() {
        this.setVisible(
            !this.visible
        );

        return this.visible;
    }

    isVisible() {
        return this.visible;
    }

    setAxesVisible(
        visible
    ) {
        if (
            this.axes
        ) {
            this.axes.visible =
                Boolean(visible);
        }
    }

    setAxesSize(
        size
    ) {
        if (
            !this.axes
        ) {
            return;
        }

        const nextSize =
            Number(size);

        if (
            !Number.isFinite(
                nextSize
            ) ||
            nextSize <= 0
        ) {
            return;
        }

        this.group.remove(
            this.axes
        );

        this.axes.geometry?.dispose();
        this.axes.material?.dispose();

        this.createAxes(
            nextSize
        );
    }

    getGrid() {
        return this.grid;
    }

    getAxes() {
        return this.axes;
    }

    getGroup() {
        return this.group;
    }

    getState() {
        return {
            size:
                this.size,

            divisions:
                this.divisions,

            majorColor:
                this.majorColor,

            minorColor:
                this.minorColor,

            visible:
                this.visible,

            height:
                this.height,

            axesVisible:
                this.axes
                    ? this.axes.visible
                    : false,
        };
    }

    setState(
        state = {}
    ) {
        if (
            Number.isFinite(
                state.size
            )
        ) {
            this.size =
                state.size;
        }

        if (
            Number.isFinite(
                state.divisions
            )
        ) {
            this.divisions =
                Math.max(
                    1,
                    Math.floor(
                        state.divisions
                    )
                );
        }

        if (
            state.majorColor !==
            undefined
        ) {
            this.majorColor =
                state.majorColor;
        }

        if (
            state.minorColor !==
            undefined
        ) {
            this.minorColor =
                state.minorColor;
        }

        if (
            Number.isFinite(
                state.height
            )
        ) {
            this.height =
                state.height;
        }

        this.createGrid();

        this.setHeight(
            this.height
        );

        if (
            typeof state.visible ===
            "boolean"
        ) {
            this.setVisible(
                state.visible
            );
        }

        if (
            typeof state.axesVisible ===
            "boolean"
        ) {
            this.setAxesVisible(
                state.axesVisible
            );
        }
    }

    dispose() {
        if (
            !this.group
        ) {
            return;
        }

        if (
            this.grid
        ) {
            this.grid.geometry?.dispose();

            if (
                Array.isArray(
                    this.grid.material
                )
            ) {
                this.grid.material.forEach(
                    (material) =>
                        material.dispose()
                );
            } else {
                this.grid.material?.dispose();
            }
        }

        if (
            this.axes
        ) {
            this.axes.geometry?.dispose();

            if (
                Array.isArray(
                    this.axes.material
                )
            ) {
                this.axes.material.forEach(
                    (material) =>
                        material.dispose()
                );
            } else {
                this.axes.material?.dispose();
            }
        }

        if (
            this.group.parent
        ) {
            this.group.parent.remove(
                this.group
            );
        }

        this.grid =
            null;

        this.axes =
            null;

        this.group =
            null;

        this.scene =
            null;

        this.initialized =
            false;
    }
}
