import {
    Object3D,
    Raycaster,
    Camera,
    Vector2,
} from "three";

export default class Select {
    private raycaster: Raycaster;

    private selected:
        | Object3D
        | null;

    constructor() {
        this.raycaster =
            new Raycaster();

        this.selected = null;
    }

    select(
        object: Object3D | null
    ): void {
        this.selected = object;
    }

    selectFromScreen(
        x: number,
        y: number,
        camera: Camera,
        objects: Object3D[]
    ): Object3D | null {
        const pointer =
            new Vector2(
                x,
                y
            );

        this.raycaster.setFromCamera(
            pointer,
            camera
        );

        const hits =
            this.raycaster.intersectObjects(
                objects,
                true
            );

        if (hits.length === 0) {
            this.selected = null;
            return null;
        }

        this.selected =
            hits[0].object;

        return this.selected;
    }

    getSelected():
        | Object3D
        | null {
        return this.selected;
    }

    clear(): void {
        this.selected = null;
    }

    hasSelection(): boolean {
        return (
            this.selected !== null
        );
    }
}
