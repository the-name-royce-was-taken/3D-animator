import {
    Object3D,
    Euler,
    Quaternion,
} from "three";

export default class Rotate {
    private target:
        | Object3D
        | null;

    constructor() {
        this.target = null;
    }

    setTarget(
        object: Object3D | null
    ): void {
        this.target = object;
    }

    rotateTo(
        rotation: Euler
    ): void {
        if (!this.target) {
            return;
        }

        this.target.rotation.copy(
            rotation
        );
    }

    rotateBy(
        rotation: Euler
    ): void {
        if (!this.target) {
            return;
        }

        this.target.rotation.x +=
            rotation.x;

        this.target.rotation.y +=
            rotation.y;

        this.target.rotation.z +=
            rotation.z;
    }

    rotateQuaternion(
        quaternion: Quaternion
    ): void {
        if (!this.target) {
            return;
        }

        this.target.quaternion.copy(
            quaternion
        );
    }

    rotateX(
        amount: number
    ): void {
        if (!this.target) {
            return;
        }

        this.target.rotation.x +=
            amount;
    }

    rotateY(
        amount: number
    ): void {
        if (!this.target) {
            return;
        }

        this.target.rotation.y +=
            amount;
    }

    rotateZ(
        amount: number
    ): void {
        if (!this.target) {
            return;
        }

        this.target.rotation.z +=
            amount;
    }

    getRotation():
        Euler | null {
        if (!this.target) {
            return null;
        }

        return this.target.rotation.clone();
    }

    clear(): void {
        this.target = null;
    }
}
