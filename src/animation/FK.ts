import {
    Bone,
    Quaternion,
    Vector3,
} from "three";

export default class FK {
    rotateBone(
        bone: Bone,
        rotation: Quaternion
    ): void {
        bone.quaternion.copy(
            rotation
        );
    }

    setRotation(
        bone: Bone,
        x: number,
        y: number,
        z: number
    ): void {
        bone.rotation.set(
            x,
            y,
            z
        );
    }

    getRotation(
        bone: Bone
    ): Quaternion {
        return bone.quaternion.clone();
    }

    moveBone(
        bone: Bone,
        position: Vector3
    ): void {
        bone.position.copy(
            position
        );
    }

    offsetBone(
        bone: Bone,
        offset: Vector3
    ): void {
        bone.position.add(
            offset
        );
    }

    copyPose(
        source: Bone,
        target: Bone
    ): void {
        target.position.copy(
            source.position
        );

        target.quaternion.copy(
            source.quaternion
        );

        target.scale.copy(
            source.scale
        );

        source.children.forEach(
            (
                child,
                index
            ) => {
                const targetChild =
                    target.children[index];

                if (
                    child instanceof Bone &&
                    targetChild instanceof Bone
                ) {
                    this.copyPose(
                        child,
                        targetChild
                    );
                }
            }
        );
    }

    resetBone(
        bone: Bone
    ): void {
        bone.position.set(
            0,
            0,
            0
        );

        bone.rotation.set(
            0,
            0,
            0
        );

        bone.scale.set(
            1,
            1,
            1
        );
    }
}
