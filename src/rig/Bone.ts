import {
    Bone as ThreeBone,
    Vector3,
    Quaternion,
} from "three";

export default class Bone {
    public bone: ThreeBone;

    constructor(
        name: string = "Bone"
    ) {
        this.bone =
            new ThreeBone();

        this.bone.name =
            name;
    }

    setName(
        name: string
    ): void {
        this.bone.name =
            name;
    }

    getName(): string {
        return this.bone.name;
    }

    setPosition(
        position: Vector3
    ): void {
        this.bone.position.copy(
            position
        );
    }

    getPosition(): Vector3 {
        return this.bone.position.clone();
    }

    setRotation(
        rotation: Quaternion
    ): void {
        this.bone.quaternion.copy(
            rotation
        );
    }

    getRotation(): Quaternion {
        return this.bone.quaternion.clone();
    }

    addChild(
        child: Bone
    ): void {
        this.bone.add(
            child.bone
        );
    }

    removeChild(
        child: Bone
    ): void {
        this.bone.remove(
            child.bone
        );
    }

    getObject(): ThreeBone {
        return this.bone;
    }
}
