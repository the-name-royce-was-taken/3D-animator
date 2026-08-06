import {
    SkinnedMesh,
    BufferGeometry,
    Float32BufferAttribute,
} from "three";

export interface WeightData {
    vertex: number;
    boneIndices: number[];
    weights: number[];
}

export default class WeightPaint {
    createDefaultWeights(
        mesh: SkinnedMesh,
        boneCount: number
    ): WeightData[] {
        const geometry =
            mesh.geometry as BufferGeometry;

        const position =
            geometry.getAttribute(
                "position"
            );

        const weights: WeightData[] = [];

        for (
            let i = 0;
            i < position.count;
            i++
        ) {
            weights.push({
                vertex: i,
                boneIndices: [
                    0,
                ],
                weights: [
                    1,
                ],
            });
        }

        return weights.map(
            (item) => ({
                ...item,
                boneIndices:
                    item.boneIndices.slice(
                        0,
                        Math.min(
                            boneCount,
                            4
                        )
                    ),
            })
        );
    }

    applyWeights(
        mesh: SkinnedMesh,
        data: WeightData[]
    ): void {
        const geometry =
            mesh.geometry as BufferGeometry;

        const indices: number[] = [];
        const weights: number[] = [];

        data.forEach((item) => {
            const bones =
                [
                    ...item.boneIndices,
                    0,
                    0,
                    0,
                    0,
                ].slice(0, 4);

            const values =
                [
                    ...item.weights,
                    0,
                    0,
                    0,
                    0,
                ].slice(0, 4);

            indices.push(
                ...bones
            );

            weights.push(
                ...values
            );
        });

        geometry.setAttribute(
            "skinIndex",
            new Float32BufferAttribute(
                indices,
                4
            )
        );

        geometry.setAttribute(
            "skinWeight",
            new Float32BufferAttribute(
                weights,
                4
            )
        );

        geometry.attributes.skinIndex.needsUpdate =
            true;

        geometry.attributes.skinWeight.needsUpdate =
            true;
    }

    clear(
        mesh: SkinnedMesh
    ): void {
        const geometry =
            mesh.geometry as BufferGeometry;

        geometry.deleteAttribute(
            "skinIndex"
        );

        geometry.deleteAttribute(
            "skinWeight"
        );
    }
}
