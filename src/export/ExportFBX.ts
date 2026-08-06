import {
    Object3D,
} from "three";

import {
    FBXExporter,
} from "three-stdlib";

export default class ExportFBX {
    private exporter:
        FBXExporter;

    constructor() {
        this.exporter =
            new FBXExporter();
    }

    export(
        object: Object3D,
        filename: string = "model.fbx"
    ): void {
        try {
            const result =
                this.exporter.parse(
                    object
                );

            const blob =
                new Blob(
                    [
                        result,
                    ],
                    {
                        type:
                            "application/octet-stream",
                    }
                );

            this.download(
                blob,
                filename
            );
        } catch (error) {
            console.error(
                "FBX export failed",
                error
            );
        }
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

        link.href =
            url;

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
