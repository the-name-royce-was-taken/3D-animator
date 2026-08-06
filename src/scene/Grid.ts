import {
    GridHelper,
    Scene,
    Color,
} from "three";

export default class Grid {
    public grid: GridHelper;

    constructor(
        size: number = 20,
        divisions: number = 20
    ) {
        this.grid = new GridHelper(
            size,
            divisions,
            new Color("#666666"),
            new Color("#333333")
        );

        this.grid.name =
            "EditorGrid";
    }

    addToScene(
        scene: Scene
    ): void {
        scene.add(this.grid);
    }

    setVisible(
        visible: boolean
    ): void {
        this.grid.visible =
            visible;
    }

    setSize(
        size: number,
        divisions: number
    ): void {
        const newGrid =
            new GridHelper(
                size,
                divisions,
                new Color("#666666"),
                new Color("#333333")
            );

        newGrid.name =
            "EditorGrid";

        this.grid.parent?.add(
            newGrid
        );

        this.grid.parent?.remove(
            this.grid
        );

        this.grid = newGrid;
    }
}
