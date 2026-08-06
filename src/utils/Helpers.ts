export function createID(
    prefix: string = "id"
): string {
    return (
        prefix +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10) +
        "_" +
        Date.now()
            .toString(36)
    );
}

export function downloadFile(
    data: Blob,
    filename: string
): void {
    const url =
        URL.createObjectURL(
            data
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

export function fileExtension(
    filename: string
): string {
    const parts =
        filename
            .split(".");

    return (
        parts[
            parts.length - 1
        ] ?? ""
    )
        .toLowerCase();
}

export function isModelFile(
    filename: string
): boolean {
    const extension =
        fileExtension(
            filename
        );

    return (
        extension === "glb" ||
        extension === "gltf" ||
        extension === "fbx"
    );
}

export function formatTime(
    seconds: number
): string {
    const minutes =
        Math.floor(
            seconds / 60
        );

    const remaining =
        Math.floor(
            seconds % 60
        );

    return (
        minutes
            .toString()
            .padStart(2, "0") +
        ":" +
        remaining
            .toString()
            .padStart(2, "0")
    );
}

export function deepClone<T>(
    value: T
): T {
    return JSON.parse(
        JSON.stringify(
            value
        )
    );
}

export function wait(
    milliseconds: number
): Promise<void> {
    return new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}
