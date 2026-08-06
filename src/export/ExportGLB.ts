import {
    Object3D,
} from "three";

import {
    GLTFExporter,
} from "three-stdlib";

export default class ExportGLB {
    private exporter:
        GLTFExporter;

    constructor() {
        this.exporter =
            new GLTFExporter();
    }

    export(
        object: Object3D,
        filename: string = "model.glb"
    ): void {
        this.exporter.parse(
            object,
            (result) => {
                const blob =
                    result instanceof ArrayBuffer
                        ? new Blob(
                              [result],
                              {
                                  type:
                                      "model/gltf-binary",
                              }
                          )
                        : new Blob(
                              [
                                  JSON.stringify(
                                      result
                                  ),
                              ],
                              {
                                  type:
                                      "application/json",
                              }
                          );

                this.download(
                    blob,
                    filename
                );
            },
            (error) => {
                console.error(
                    "GLB export failed",
                    error
                );
            },
            {
                binary: true,
            }
        );
    }

    private download(
        blob: Blob,
        filename: string
    ): void {
        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            filename;

        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );

        URL.revokeObjectURL(
            url
        );
    }
}
