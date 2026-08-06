import {
    Object3D,
    Bone,
    SkinnedMesh,
} from "three";

export interface RigInfo {
    hasRig: boolean;
    bones: Bone[];
    meshes: SkinnedMesh[];
    boneCount: number;
}

export default class RigDetector {
    detect(
        object: Object3D
    ): RigInfo {
        const bones: Bone[] = [];
        const meshes: SkinnedMesh[] = [];

        object.traverse(
            (child) => {
                if (
                    child instanceof Bone
                ) {
                    bones.push(child);
                }

                if (
                    child instanceof SkinnedMesh
                ) {
                    meshes.push(child);
                }
            }
        );

        return {
            hasRig:
                bones.length > 0 &&
                meshes.length > 0,

            bones,

            meshes,

            boneCount:
                bones.length,
        };
    }

    hasSkeleton(
        object: Object3D
    ): boolean {
        return this.detect(object)
            .hasRig;
    }

    getBones(
        object: Object3D
    ): Bone[] {
        return this.detect(object)
            .bones;
    }

    getMeshes(
        object: Object3D
    ): SkinnedMesh[] {
        return this.detect(object)
            .meshes;
    }
}
