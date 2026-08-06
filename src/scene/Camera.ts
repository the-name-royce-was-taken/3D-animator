import {
    PerspectiveCamera,
    Vector3,
} from "three";

export default class CameraController {
    public camera: PerspectiveCamera;

    constructor(
        aspectRatio: number = 1
    ) {
        this.camera =
            new PerspectiveCamera(
                45,
                aspectRatio,
                0.1,
                1000
            );

        this.camera.position.set(
            5,
            4,
            5
        );

        this.camera.lookAt(
            new Vector3(0, 1, 0)
        );
    }

    resize(
        width: number,
        height: number
    ): void {
        this.camera.aspect =
            width / height;

        this.camera.updateProjectionMatrix();
    }

    setPosition(
        x: number,
        y: number,
        z: number
    ): void {
        this.camera.position.set(
            x,
            y,
            z
        );
    }

    lookAt(
        x: number,
        y: number,
        z: number
    ): void {
        this.camera.lookAt(
            new Vector3(
                x,
                y,
                z
            )
        );
    }

    getCamera(): PerspectiveCamera {
        return this.camera;
    }
}
