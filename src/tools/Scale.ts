import {
    Object3D,
    Vector3,
} from "three";

export default class Scale {
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

    scaleTo(
        scale: Vector3
    ): void {
        if (!this.target) {
            return;
        }

        this.target.scale.copy(
            scale
        );
    }

    scaleBy(
        amount: Vector3
    ): void {
        if (!this.target) {
            return;
        }

        this.target.scale.multiply(
            amount
        );
    }

    scaleUniform(
        amount: number
    ): void {
        if (!this.target) {
            return;
        }

        this.target.scale.set(
            amount,
            amount,
            amount
        );
    }

    scaleX(
        amount: number
    ): void {
        if (!this.target) {
            return;
        }

        this.target.scale.x =
            amount;
    }

    scaleY(
        amount: number
    ): void {
        if (!this.target) {
            return;
        }

        this.target.scale.y =
            amount;
    }

    scaleZ(
        amount: number
    ): void {
        if (!this.target) {
            return;
        }

        this.target.scale.z =
            amount;
    }

    getScale():
        Vector3 | null {
        if (!this.target) {
            return null;
        }

        return this.target.scale.clone();
    }

    clear(): void {
        this.target = null;
    }
}
