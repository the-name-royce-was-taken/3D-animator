import GLBImporter from "./GLBImporter.js";
import FBXImporter from "./FBXImporter.js";

export default class ImportManager {
    constructor(options = {}) {
        this.sceneManager =
            options.sceneManager ||
            null;

        this.scene =
            options.scene ||
            options.sceneManager?.scene ||
            null;

        this.glbImporter =
            options.glbImporter ||
            new GLBImporter({
                sceneManager:
                    this.sceneManager,
                scene: this.scene,
            });

        this.fbxImporter =
            options.fbxImporter ||
            new FBXImporter({
                sceneManager:
                    this.sceneManager,
                scene: this.scene,
            });

        this.listeners = {
            started: [],
            progress: [],
            loaded: [],
            error: [],
        };

        this.imports =
            [];

        this.lastImport =
            null;

        this.setupImporterEvents();
    }

    setupImporterEvents() {
        this.glbImporter.on(
            "started",
            (data) => {
                this.emit(
                    "started",
                    {
                        ...data,
                        format: "glb",
                    }
                );
            }
        );

        this.glbImporter.on(
            "progress",
            (data) => {
                this.emit(
                    "progress",
                    {
                        ...data,
                        format: "glb",
                    }
                );
            }
        );

        this.glbImporter.on(
            "loaded",
            (data) => {
                this.emit(
                    "loaded",
                    {
                        ...data,
                        format: "glb",
                    }
                );
            }
        );

        this.glbImporter.on(
            "error",
            (data) => {
                this.emit(
                    "error",
                    {
                        ...data,
                        format: "glb",
                    }
                );
            }
        );

        this.fbxImporter.on(
            "started",
            (data) => {
                this.emit(
                    "started",
                    {
                        ...data,
                        format: "fbx",
                    }
                );
            }
        );

        this.fbxImporter.on(
            "progress",
            (data) => {
                this.emit(
                    "progress",
                    {
                        ...data,
                        format: "fbx",
                    }
                );
            }
        );

        this.fbxImporter.on(
            "loaded",
            (data) => {
                this.emit(
                    "loaded",
                    {
                        ...data,
                        format: "fbx",
                    }
                );
            }
        );

        this.fbxImporter.on(
            "error",
            (data) => {
                this.emit(
                    "error",
                    {
                        ...data,
                        format: "fbx",
                    }
                );
            }
        );
    }

    setSceneManager(
        sceneManager
    ) {
        this.sceneManager =
            sceneManager || null;

        this.scene =
            sceneManager?.scene ||
            null;

        this.glbImporter?.setSceneManager(
            sceneManager
        );

        this.fbxImporter?.setSceneManager(
            sceneManager
        );
    }

    setScene(
        scene
    ) {
        this.scene =
            scene?.scene ||
            scene ||
            null;

        this.glbImporter?.setScene(
            this.scene
        );

        this.fbxImporter?.setScene(
            this.scene
        );
    }

    async import(
        source,
        options = {}
    ) {
        const format =
            this.detectFormat(
                source,
                options.format
            );

        if (
            !format
        ) {
            throw new Error(
                "Unable to determine the model format. Supported formats: GLB, GLTF, and FBX."
            );
        }

        const importer =
            this.getImporter(
                format
            );

        if (
            !importer
        ) {
            throw new Error(
                `No importer is available for ${format.toUpperCase()}.`
            );
        }

        const importOptions = {
            ...options,
            format,
        };

        delete importOptions.file;
        delete importOptions.url;

        try {
            const result =
                await importer.import(
                    source,
                    importOptions
                );

            const record =
                this.createImportRecord(
                    result,
                    source,
                    format,
                    importOptions
                );

            this.imports.push(
                record
            );

            this.lastImport =
                record;

            return {
                ...result,
                format,
                record,
            };
        } catch (
            error
        ) {
            throw this.normalizeError(
                error,
                format
            );
        }
    }

    async importFile(
        file,
        options = {}
    ) {
        if (
            !file
        ) {
            throw new Error(
                "No file was selected."
            );
        }

        const format =
            this.detectFormat(
                file,
                options.format
            );

        if (
            !format
        ) {
            throw new Error(
                `Unsupported file type: ${
                    file.name ||
                    "unknown"
                }. Use .glb, .gltf, or .fbx.`
            );
        }

        return this.import(
            file,
            {
                ...options,
                format,
            }
        );
    }

    async importFiles(
        files,
        options = {}
    ) {
        if (
            !files
        ) {
            return [];
        }

        const list =
            Array.from(
                files
            );

        const results =
            [];

        for (
            const file of list
        ) {
            try {
                const result =
                    await this.importFile(
                        file,
                        options
                    );

                results.push(
                    result
                );
            } catch (
                error
            ) {
                this.emit(
                    "error",
                    {
                        source:
                            file,
                        error,
                    }
                );

                if (
                    options.stopOnError
                ) {
                    throw error;
                }
            }
        }

        return results;
    }

    async importUrl(
        url,
        options = {}
    ) {
        if (
            !url ||
            typeof url !==
                "string"
        ) {
            throw new Error(
                "A model URL is required."
            );
        }

        const format =
            this.detectFormat(
                url,
                options.format
            );

        if (
            !format
        ) {
            throw new Error(
                "Unable to determine the model format from the URL."
            );
        }

        return this.import(
            url,
            {
                ...options,
                format,
            }
        );
    }

    detectFormat(
        source,
        explicitFormat
    ) {
        if (
            explicitFormat
        ) {
            const normalized =
                String(
                    explicitFormat
                )
                    .toLowerCase()
                    .replace(
                        ".",
                        ""
                    );

            if (
                normalized ===
                    "glb" ||
                normalized ===
                    "gltf"
            ) {
                return "glb";
            }

            if (
                normalized ===
                "fbx"
            ) {
                return "fbx";
            }
        }

        if (
            typeof File !==
                "undefined" &&
            source instanceof File
        ) {
            return this.formatFromFilename(
                source.name
            );
        }

        if (
            typeof Blob !==
                "undefined" &&
            source instanceof Blob
        ) {
            const type =
                source.type
                    ?.toLowerCase() ||
                "";

            if (
                type.includes(
                    "fbx"
                )
            ) {
                return "fbx";
            }

            if (
                type.includes(
                    "gltf"
                ) ||
                type.includes(
                    "glb"
                )
            ) {
                return "glb";
            }
        }

        if (
            typeof source ===
            "string"
        ) {
            return this.formatFromFilename(
                source
            );
        }

        return null;
    }

    formatFromFilename(
        filename
    ) {
        if (
            !filename ||
            typeof filename !==
                "string"
        ) {
            return null;
        }

        const cleanName =
            filename
                .split("?")[0]
                .split("#")[0]
                .toLowerCase();

        if (
            cleanName.endsWith(
                ".glb"
            ) ||
            cleanName.endsWith(
                ".gltf"
            )
        ) {
            return "glb";
        }

        if (
            cleanName.endsWith(
                ".fbx"
            )
        ) {
            return "fbx";
        }

        return null;
    }

    getImporter(
        format
    ) {
        switch (
            String(
                format
            ).toLowerCase()
        ) {
            case "glb":
            case "gltf":
                return this.glbImporter;

            case "fbx":
                return this.fbxImporter;

            default:
                return null;
        }
    }

    createImportRecord(
        result,
        source,
        format,
        options
    ) {
        const object =
            result?.root ||
            result?.scene ||
            result?.object ||
            null;

        return {
            id:
                this.createId(),

            name:
                object?.name ||
                options.name ||
                this.getSourceName(
                    source
                ),

            format,

            object,

            animations:
                result?.animations ||
                [],

            metadata:
                result?.metadata ||
                {},

            importedAt:
                new Date().toISOString(),
        };
    }

    getSourceName(
        source
    ) {
        if (
            typeof source ===
            "string"
        ) {
            const parts =
                source
                    .split("/")
                    .pop()
                    ?.split("?")[0];

            return (
                parts ||
                "Imported Model"
            );
        }

        if (
            source?.name
        ) {
            return source.name;
        }

        return "Imported Model";
    }

    createId() {
        return (
            "import_" +
            Date.now().toString(
                36
            ) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );
    }

    getImports() {
        return [
            ...this.imports,
        ];
    }

    getLastImport() {
        return this.lastImport;
    }

    getImportById(
        id
    ) {
        return (
            this.imports.find(
                (item) =>
                    item.id ===
                    id
            ) || null
        );
    }

    removeImport(
        id,
        options = {}
    ) {
        const index =
            this.imports.findIndex(
                (item) =>
                    item.id ===
                    id
            );

        if (
            index === -1
        ) {
            return false;
        }

        const record =
            this.imports[index];

        if (
            options.dispose !==
            false
        ) {
            const importer =
                this.getImporter(
                    record.format
                );

            importer?.dispose?.(
                record.object
            );
        }

        this.imports.splice(
            index,
            1
        );

        if (
            this.lastImport?.id ===
            id
        ) {
            this.lastImport =
                this.imports[
                    this.imports.length -
                        1
                ] || null;
        }

        return true;
    }

    clearImports(
        options = {}
    ) {
        const dispose =
            options.dispose !==
            false;

        if (
            dispose
        ) {
            this.imports.forEach(
                (record) => {
                    const importer =
                        this.getImporter(
                            record.format
                        );

                    importer?.dispose?.(
                        record.object
                    );
                }
            );
        }

        this.imports =
            [];

        this.lastImport =
            null;
    }

    getSupportedExtensions() {
        return [
            ".glb",
            ".gltf",
            ".fbx",
        ];
    }

    getAcceptString() {
        return [
            ".glb",
            ".gltf",
            ".fbx",
        ].join(",");
    }

    isSupportedFile(
        file
    ) {
        return Boolean(
            this.detectFormat(
                file
            )
        );
    }

    normalizeError(
        error,
        format
    ) {
        if (
            error instanceof
            Error
        ) {
            error.format =
                format;

            return error;
        }

        const normalized =
            new Error(
                typeof error ===
                    "string"
                    ? error
                    : `Failed to import ${format.toUpperCase()} file.`
            );

        normalized.originalError =
            error;

        normalized.format =
            format;

        return normalized;
    }

    on(
        event,
        callback
    ) {
        if (
            !this.listeners[
                event
            ] ||
            typeof callback !==
                "function"
        ) {
            return () => {};
        }

        this.listeners[
            event
        ].push(
            callback
        );

        return () =>
            this.off(
                event,
                callback
            );
    }

    off(
        event,
        callback
    ) {
        const listeners =
            this.listeners[
                event
            ];

        if (
            !listeners
        ) {
            return;
        }

        const index =
            listeners.indexOf(
                callback
            );

        if (
            index !== -1
        ) {
            listeners.splice(
                index,
                1
            );
        }
    }

    emit(
        event,
        data
    ) {
        const listeners =
            this.listeners[
                event
            ];

        if (
            !listeners
        ) {
            return;
        }

        listeners
            .slice()
            .forEach(
                (callback) => {
                    try {
                        callback(
                            data
                        );
                    } catch (
                        error
                    ) {
                        console.error(
                            `ImportManager event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    destroy() {
        this.clearImports({
            dispose: false,
        });

        this.glbImporter?.destroy?.();
        this.fbxImporter?.destroy?.();

        this.glbImporter =
            null;

        this.fbxImporter =
            null;

        this.sceneManager =
            null;

        this.scene =
            null;

        this.listeners = {
            started: [],
            progress: [],
            loaded: [],
            error: [],
        };
    }
}
