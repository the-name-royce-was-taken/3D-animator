import {
    FBXLoader,
} from "three-stdlib";

import {
    Group,
} from "three";

export default class FBXImporter {
    private loader: FBXLoader;

    constructor() {
        this.loader =
            new FBXLoader();
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

                try {
                    const model =
                        this.loader.load(
                            url,
                            (object) => {
                                URL.revokeObjectURL(
                                    url
                                );

                                object.name =
                                    file.name.replace(
                                        ".fbx",
                                        ""
                                    );

                                resolve(
                                    object
                                );
                            },
                            undefined,
                            (error) => {
                                URL.revokeObjectURL(
                                    url
                                );

                                reject(error);
                            }
                        );
                } catch (error) {
                    URL.revokeObjectURL(
                        url
                    );

                    reject(error);
                }
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
                    (object) => {
                        resolve(
                            object
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
