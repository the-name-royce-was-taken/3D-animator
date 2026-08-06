import JSZip from "jszip";

export interface ProjectFile {
    name: string;
    data: string | Blob | ArrayBuffer;
}

export default class ExportZIP {
    private zip: JSZip;

    constructor() {
        this.zip = new JSZip();
    }

    async export(
        files: ProjectFile[],
        filename: string = "project.zip"
    ): Promise<void> {
        const zip =
            new JSZip();

        files.forEach(
            (file) => {
                zip.file(
                    file.name,
                    file.data
                );
            }
        );

        const blob =
            await zip.generateAsync({
                type: "blob",
            });

        this.download(
            blob,
            filename
        );
    }

    async create(
        project: Record<string, unknown>,
        assets: ProjectFile[] = [],
        filename: string = "project.zip"
    ): Promise<void> {
        const zip =
            new JSZip();

        zip.file(
            "project.json",
            JSON.stringify(
                project,
                null,
                2
            )
        );

        const assetsFolder =
            zip.folder(
                "assets"
            );

        if (assetsFolder) {
            assets.forEach(
                (asset) => {
                    assetsFolder.file(
                        asset.name,
                        asset.data
                    );
                }
            );
        }

        const blob =
            await zip.generateAsync({
                type: "blob",
            });

        this.download(
            blob,
            filename
        );
    }

    async load(
        file: File
    ): Promise<{
        project: unknown;
        files: Record<string, Blob>;
    }> {
        const zip =
            await JSZip.loadAsync(
                file
            );

        const files:
            Record<string, Blob> = {};

        let project:
            unknown = {};

        for (
            const path of Object.keys(
                zip.files
            )
        ) {
            const entry =
                zip.files[path];

            if (
                entry.dir
            ) {
                continue;
            }

            const blob =
                await entry.async(
                    "blob"
                );

            files[path] =
                blob;

            if (
                path ===
                "project.json"
            ) {
                project =
                    JSON.parse(
                        await blob.text()
                    );
            }
        }

        return {
            project,
            files,
        };
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
