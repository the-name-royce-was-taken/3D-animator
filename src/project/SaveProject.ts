export interface SaveData {
    projectName: string;
    created: number;
    updated: number;
    data: unknown;
}

export default class SaveProject {
    save(
        projectName: string,
        data: unknown
    ): SaveData {
        return {
            projectName,
            created: Date.now(),
            updated: Date.now(),
            data,
        };
    }

    saveToStorage(
        projectName: string,
        data: unknown
    ): void {
        const project =
            this.save(
                projectName,
                data
            );

        localStorage.setItem(
            `3d-animator-${projectName}`,
            JSON.stringify(
                project
            )
        );
    }

    download(
        projectName: string,
        data: unknown
    ): void {
        const project =
            this.save(
                projectName,
                data
            );

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        project,
                        null,
                        2
                    ),
                ],
                {
                    type:
                        "application/json",
                }
            );

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
            `${projectName}.json`;

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
