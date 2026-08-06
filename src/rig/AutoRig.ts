import {
    Bone,
    Group,
    Vector3,
} from "three";

export type RigType =
    | "humanoid"
    | "creature"
    | "custom";

export default class AutoRig {
    create(
        type: RigType = "humanoid"
    ): Group {
        const rig =
            new Group();

        rig.name =
            `${type}_rig`;

        const root =
            this.createBone(
                "Root",
                new Vector3(0, 0, 0)
            );

        rig.add(root);

        if (type === "humanoid") {
            this.createHumanoid(
                root
            );
        }

        if (type === "creature") {
            this.createCreature(
                root
            );
        }

        return rig;
    }

    private createHumanoid(
        root: Bone
    ): void {
        const pelvis =
            this.createBone(
                "Pelvis",
                new Vector3(0, 1, 0)
            );

        const spine =
            this.createBone(
                "Spine",
                new Vector3(0, 1, 0)
            );

        const chest =
            this.createBone(
                "Chest",
                new Vector3(0, 1, 0)
            );

        const neck =
            this.createBone(
                "Neck",
                new Vector3(0, 0.5, 0)
            );

        const head =
            this.createBone(
                "Head",
                new Vector3(0, 0.5, 0)
            );

        root.add(pelvis);
        pelvis.add(spine);
        spine.add(chest);
        chest.add(neck);
        neck.add(head);

        this.createArm(
            chest,
            "Left"
        );

        this.createArm(
            chest,
            "Right"
        );

        this.createLeg(
            pelvis,
            "Left"
        );

        this.createLeg(
            pelvis,
            "Right"
        );
    }

    private createCreature(
        root: Bone
    ): void {
        const body =
            this.createBone(
                "Body",
                new Vector3(0, 1, 0)
            );

        const head =
            this.createBone(
                "Head",
                new Vector3(0, 1, 0)
            );

        root.add(body);
        body.add(head);
    }

    private createArm(
        parent: Bone,
        side: string
    ): void {
        const upper =
            this.createBone(
                `${side}_UpperArm`,
                new Vector3(
                    side === "Left"
                        ? -1
                        : 1,
                    0,
                    0
                )
            );

        const lower =
            this.createBone(
                `${side}_LowerArm`,
                new Vector3(
                    0,
                    -1,
                    0
                )
            );

        const hand =
            this.createBone(
                `${side}_Hand`,
                new Vector3(
                    0,
                    -1,
                    0
                )
            );

        parent.add(upper);
        upper.add(lower);
        lower.add(hand);
    }

    private createLeg(
        parent: Bone,
        side: string
    ): void {
        const upper =
            this.createBone(
                `${side}_UpperLeg`,
                new Vector3(
                    side === "Left"
                        ? -0.5
                        : 0.5,
                    -1,
                    0
                )
            );

        const lower =
            this.createBone(
                `${side}_LowerLeg`,
                new Vector3(
                    0,
                    -1,
                    0
                )
            );

        const foot =
            this.createBone(
                `${side}_Foot`,
                new Vector3(
                    0,
                    -0.5,
                    0
                )
            );

        parent.add(upper);
        upper.add(lower);
        lower.add(foot);
    }

    private createBone(
        name: string,
        position: Vector3
    ): Bone {
        const bone =
            new Bone();

        bone.name =
            name;

        bone.position.copy(
            position
        );

        return bone;
    }
}
