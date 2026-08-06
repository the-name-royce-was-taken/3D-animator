import {
    Bone,
    Skeleton as ThreeSkeleton,
    Matrix4,
} from "three";

export default class Skeleton {
    public bones: Bone[];

    public skeleton:
        | ThreeSkeleton
        | null;

    constructor() {
        this.bones = [];
        this.skeleton = null;
    }

    addBone(
        bone: Bone
    ): void {
        this.bones.push(bone);
    }

    removeBone(
        bone: Bone
    ): void {
        this.bones =
            this.bones.filter(
                (item) =>
                    item !== bone
            );
    }

    create(): ThreeSkeleton {
        this.skeleton =
            new ThreeSkeleton(
                this.bones,
                this.createBoneMatrices()
            );

        return this.skeleton;
    }

    getSkeleton():
        | ThreeSkeleton
        | null {
        return this.skeleton;
    }

    getBones(): Bone[] {
        return this.bones;
    }

    clear(): void {
        this.bones = [];
        this.skeleton = null;
    }

    private createBoneMatrices():
        Matrix4[] {
        return this.bones.map(
            () => new Matrix4()
        );
    }
}
