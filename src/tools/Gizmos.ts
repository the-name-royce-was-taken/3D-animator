import {
    Object3D,
    Camera,
    Vector3,
} from "three";

import {
    TransformControls,
} from "three-stdlib";

export type GizmoMode =
    | "translate"
    | "rotate"
    | "scale";

export default class Gizmos {
    public controls: TransformControls;

    private mode: GizmoMode;

    constructor(
        camera: Camera,
        domElement: HTMLElement
    ) {
        this.controls =
            new TransformControls(
                camera,
                domElement
            );

        this.mode =
            "translate";

        this.controls.setMode(
            this.mode
        );
    }

    attach(
        object: Object3D
    ): void {
        this.controls.attach(
            object
        );
    }

    detach(): void {
        this.controls.detach();
    }

    setMode(
        mode: GizmoMode
    ): void {
        this.mode = mode;

        this.controls.setMode(
            mode
        );
    }

    getMode(): GizmoMode {
        return this.mode;
    }

    setPosition(
        position: Vector3
    ): void {
        const object =
            this.controls.object;

        if (!object) {
            return;
        }

        object.position.copy(
            position
        );
    }

    setEnabled(
        enabled: boolean
    ): void {
        this.controls.enabled =
            enabled;
    }

    update(): void {
        this.controls.update();
    }

    addToScene(
        scene: Object3D
    ): void {
        scene.add(
            this.controls
        );
    }

    removeFromScene(): void {
        this.controls.parent?.remove(
            this.controls
        );
    }
}
