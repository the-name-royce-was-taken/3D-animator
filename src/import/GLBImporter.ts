import {
    GLTFLoader,
} from "three-stdlib";

import {
    Group,
} from "three";

export default class GLBImporter {
    private loader: GLTFLoader;

    constructor() {
        this.loader =
            new GLTFLoader();
    }

    load(
        file: File
    ): Promise<Group> {
        return new Promise(
            (resolve, reject) => {
                const url =
                    URL.createObjectURL(
                        file
                    );

                this.loader.load(
                    url,
                    (gltf) => {
                        URL.revokeObjectURL(
                            url
                        );

                        const scene =
                            gltf.scene;

                        scene.name =
                            file.name.replace(
                                ".glb",
                                ""
                            );

                        resolve(scene);
                    },
                    undefined,
                    (error) => {
                        URL.revokeObjectURL(
                            url
                        );

                        reject(error);
                    }
                );
            }
        );
    }

    loadFromURL(
        url: string
    ): Promise<Group> {
        return new Promise(
            (resolve, reject) => {
                this.loader.load(
                    url,
                    (gltf) => {
                        resolve(
                            gltf.scene
                        );
                    },
                    undefined,
                    (error) => {
                        reject(error);
                    }
                );
            }
        );
    }
}
