import {
    Group,
} from "three";

import GLBImporter from "./GLBImporter";
import FBXImporter from "./FBXImporter";

export type SupportedModel =
    | "glb"
    | "gltf"
    | "fbx";

export default class ImportManager {
    private glbImporter: GLBImporter;
    private fbxImporter: FBXImporter;

    constructor() {
        this.glbImporter =
            new GLBImporter();

        this.fbxImporter =
            new FBXImporter();
    }

    async import(
        file: File
    ): Promise<Group> {
        const extension =
            this.getExtension(
                file.name
            );

        switch (extension) {
            case "glb":
            case "gltf":
                return this.glbImporter.load(
                    file
                );

            case "fbx":
                return this.fbxImporter.load(
                    file
                );

            default:
                throw new Error(
                    `Unsupported file type: ${extension}`
                );
        }
    }

    canImport(
        file: File
    ): boolean {
        const extension =
            this.getExtension(
                file.name
            );

        return (
            extension === "glb" ||
            extension === "gltf" ||
            extension === "fbx"
        );
    }

    private getExtension(
        filename: string
    ): string {
        const parts =
            filename
                .toLowerCase()
                .split(".");

        return parts[
            parts.length - 1
        ];
    }
}
