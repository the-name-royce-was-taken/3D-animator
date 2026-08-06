import {
    Bone,
    Vector3,
} from "three";

export interface IKTarget {
    bone: Bone;
    target: Vector3;
    strength: number;
}

export default class IK {
    private targets: IKTarget[];

    constructor() {
        this.targets = [];
    }

    addTarget(
        bone: Bone,
        target: Vector3,
        strength: number = 1
    ): void {
        this.targets.push({
            bone,
            target,
            strength,
        });
    }

    removeTarget(
        bone: Bone
    ): void {
        this.targets =
            this.targets.filter(
                (item) =>
                    item.bone !== bone
            );
    }

    solve(): void {
        this.targets.forEach(
            (item) => {
                const direction =
                    item.target.clone()
                        .sub(
                            item.bone.position
                        );

                item.bone.position.add(
                    direction.multiplyScalar(
                        item.strength * 0.1
                    )
                );
            }
        );
    }

    solveBone(
        bone: Bone,
        target: Vector3,
        iterations: number = 10
    ): void {
        for (
            let i = 0;
            i < iterations;
            i++
        ) {
            const direction =
                target.clone()
                    .sub(
                        bone.position
                    );

            bone.position.add(
                direction.multiplyScalar(
                    0.1
                )
            );
        }
    }

    clear(): void {
        this.targets = [];
    }

    getTargets(): IKTarget[] {
        return this.targets;
    }
}
