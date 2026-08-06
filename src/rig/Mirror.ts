import {
    Bone,
    Vector3,
} from "three";

export default class Mirror {
    mirrorBone(
        bone: Bone
    ): Bone {
        const mirrored =
            bone.clone();

        mirrored.name =
            this.getMirrorName(
                bone.name
            );

        mirrored.position.x =
            -mirrored.position.x;

        return mirrored;
    }

    mirrorHierarchy(
        bone: Bone
    ): Bone {
        const root =
            this.mirrorBone(
                bone
            );

        bone.children.forEach(
            (child) => {
                if (
                    child instanceof Bone
                ) {
                    root.add(
                        this.mirrorHierarchy(
                            child
                        )
                    );
                }
            }
        );

        return root;
    }

    mirrorPosition(
        position: Vector3
    ): Vector3 {
        return new Vector3(
            -position.x,
            position.y,
            position.z
        );
    }

    private getMirrorName(
        name: string
    ): string {
        const replacements: [
            string,
            string
        ][] = [
            [
                "Left",
                "Right",
            ],
            [
                "Right",
                "Left",
            ],
            [
                "_L",
                "_R",
            ],
            [
                "_R",
                "_L",
            ],
            [
                ".L",
                ".R",
            ],
            [
                ".R",
                ".L",
            ],
        ];

        for (
            const [
                from,
                to,
            ] of replacements
        ) {
            if (
                name.includes(
                    from
                )
            ) {
                return name.replace(
                    from,
                    to
                );
            }
        }

        return `${name}_Mirror`;
    }
}
