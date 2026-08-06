import type { SaveData } from "./SaveProject";

export default class LoadProject {
    loadFromStorage(
        projectName: string
    ): SaveData | null {
        const saved =
            localStorage.getItem(
                `3d-animator-${projectName}`
            );

        if (!saved) {
            return null;
        }

        return JSON.parse(
            saved
        ) as SaveData;
    }

    async loadFile(
        file: File
    ): Promise<SaveData> {
        const text =
            await file.text();

        return JSON.parse(
            text
        ) as SaveData;
    }

    openFilePicker():
        Promise<SaveData | null> {
        return new Promise(
            (resolve) => {
                const input =
                    document.createElement(
                        "input"
                    );

                input.type =
                    "file";

                input.accept =
                    ".json,.zip";

                input.onchange =
                    async () => {
                        const file =
                            input.files?.[0];

                        if (!file) {
                            resolve(
                                null
                            );

                            return;
                        }

                        const project =
                            await this.loadFile(
                                file
                            );

                        resolve(
                            project
                        );
                    };

                input.click();
            }
        );
    }

    validate(
        project: unknown
    ): project is SaveData {
        if (
            typeof project !==
            "object" ||
            project === null
        ) {
            return false;
        }

        const data =
            project as Partial<SaveData>;

        return (
            typeof data.projectName ===
                "string" &&
            typeof data.created ===
                "number" &&
            typeof data.updated ===
                "number"
        );
    }
}
