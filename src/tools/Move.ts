import {
    Object3D,
    Vector3,
} from "three";

export default class Move {
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

    moveTo(
        position: Vector3
    ): void {
        if (!this.target) {
            return;
        }

        this.target.position.copy(
            position
        );
    }

    moveBy(
        offset: Vector3
    ): void {
        if (!this.target) {
            return;
        }

        this.target.position.add(
            offset
        );
    }

    moveX(
        amount: number
    ): void {
        if (!this.target) {
            return;
        }

        this.target.position.x +=
            amount;
    }

    moveY(
        amount: number
    ): void {
        if (!this.target) {
            return;
        }

        this.target.position.y +=
            amount;
    }

    moveZ(
        amount: number
    ): void {
        if (!this.target) {
            return;
        }

        this.target.position.z +=
            amount;
    }

    getPosition():
        Vector3 | null {
        if (!this.target) {
            return null;
        }

        return this.target.position.clone();
    }

    clear(): void {
        this.target = null;
    }
}
