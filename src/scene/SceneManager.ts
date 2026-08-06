import {
    Scene,
    Object3D,
    Group,
    Color,
} from "three";

export default class SceneManager {
    public scene: Scene;
    public root: Group;

    constructor() {
        this.scene = new Scene();

        this.scene.background =
            new Color("#151515");

        this.root = new Group();
        this.root.name = "AnimatorRoot";

        this.scene.add(this.root);
    }

    addObject(
        object: Object3D
    ): void {
        this.root.add(object);
    }

    removeObject(
        object: Object3D
    ): void {
        this.root.remove(object);
    }

    clear(): void {
        while (
            this.root.children.length > 0
        ) {
            const child =
                this.root.children[0];

            this.root.remove(child);
        }
    }

    findObject(
        name: string
    ): Object3D | undefined {
        return this.root.getObjectByName(
            name
        );
    }

    getObjects(): Object3D[] {
        return [
            ...this.root.children,
        ];
    }

    setBackground(
        color: string
    ): void {
        this.scene.background =
            new Color(color);
    }

    getScene(): Scene {
        return this.scene;
    }
}
