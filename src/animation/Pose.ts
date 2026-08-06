import {
    Bone,
    Vector3,
    Quaternion,
} from "three";

export interface BonePose {
    name: string;
    position: Vector3;
    rotation: Quaternion;
    scale: Vector3;
}

export default class Pose {
    private bones: BonePose[];

    constructor() {
        this.bones = [];
    }

    capture(
        root: Bone
    ): BonePose[] {
        this.bones = [];

        this.captureBone(
            root
        );

        return this.bones;
    }

    apply(
        root: Bone
    ): void {
        this.applyBone(
            root
        );
    }

    private captureBone(
        bone: Bone
    ): void {
        this.bones.push({
            name: bone.name,
            position:
                bone.position.clone(),
            rotation:
                bone.quaternion.clone(),
            scale:
                bone.scale.clone(),
        });

        bone.children.forEach(
            (child) => {
                if (
                    child instanceof Bone
                ) {
                    this.captureBone(
                        child
                    );
                }
            }
        );
    }

    private applyBone(
        bone: Bone
    ): void {
        const saved =
            this.bones.find(
                (item) =>
                    item.name ===
                    bone.name
            );

        if (saved) {
            bone.position.copy(
                saved.position
            );

            bone.quaternion.copy(
                saved.rotation
            );

            bone.scale.copy(
                saved.scale
            );
        }

        bone.children.forEach(
            (child) => {
                if (
                    child instanceof Bone
                ) {
                    this.applyBone(
                        child
                    );
                }
            }
        );
    }

    clear(): void {
        this.bones = [];
    }

    getBones(): BonePose[] {
        return this.bones;
    }

    serialize(): string {
        return JSON.stringify(
            this.bones,
            (
                _key,
                value
            ) => {
                if (
                    value?.isVector3 ||
                    value?.isQuaternion
                ) {
                    return {
                        x: value.x,
                        y: value.y,
                        z: value.z,
                        w: value.w,
                    };
                }

                return value;
            }
        );
    }
}
