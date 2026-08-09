import {
    useRef,
    useState,
} from "react";

export default function Toolbar({
    activeTool = "select",
    onToolChange = () => {},
    onImport = () => {},
    onExport = () => {},
    onSave = () => {},
    onLoad = () => {},
    onUndo = () => {},
    onRedo = () => {},
    onDelete = () => {},
    onDuplicate = () => {},
    onFrameSelected = () => {},
    onResetView = () => {},
    onStatusChange = () => {},
}) {
    const fileInputRef =
        useRef(null);

    const [exportOpen, setExportOpen] =
        useState(false);

    const tools = [
        {
            id: "select",
            label: "Select",
            shortcut: "Q",
        },
        {
            id: "move",
            label: "Move",
            shortcut: "W",
        },
        {
            id: "rotate",
            label: "Rotate",
            shortcut: "E",
        },
        {
            id: "scale",
            label: "Scale",
            shortcut: "R",
        },
    ];

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (
        event
    ) => {
        const files =
            Array.from(
                event.target.files || []
            );

        if (!files.length) {
            return;
        }

        onImport(files);

        onStatusChange(
            `${files.length} file${
                files.length === 1
                    ? ""
                    : "s"
            } selected for import`
        );

        event.target.value = "";
    };

    const handleTool = (
        tool
    ) => {
        onToolChange(tool);

        onStatusChange(
            `${tool
                .charAt(0)
                .toUpperCase()}${tool.slice(
                1
            )} tool selected`
        );
    };

    const handleExport = (
        format
    ) => {
        setExportOpen(false);
        onExport(format);

        onStatusChange(
            `Exporting ${format.toUpperCase()}`
        );
    };

    return (
        <header
            className="toolbar"
            style={{
                width: "100%",
                minHeight: "48px",
                display: "flex",
                alignItems:
                    "center",
                gap: "6px",
                padding:
                    "6px 8px",
                boxSizing:
                    "border-box",
                background:
                    "#202020",
                borderBottom:
                    "1px solid #333",
                color: "#ddd",
                userSelect:
                    "none",
                position:
                    "relative",
                zIndex: 50,
            }}
        >
            <div
                style={{
                    fontWeight:
                        "700",
                    fontSize:
                        "14px",
                    marginRight:
                        "10px",
                    whiteSpace:
                        "nowrap",
                }}
            >
                3D Animator
            </div>

            <div
                style={{
                    width: "1px",
                    height:
                        "28px",
                    background:
                        "#3b3b3b",
                    margin:
                        "0 3px",
                }}
            />

            <button
                type="button"
                onClick={
                    handleImportClick
                }
                title="Import a 3D model"
            >
                Import
            </button>

            <button
                type="button"
                onClick={onSave}
                title="Save project"
            >
                Save
            </button>

            <button
                type="button"
                onClick={onLoad}
                title="Load project"
            >
                Load
            </button>

            <div
                style={{
                    width: "1px",
                    height:
                        "28px",
                    background:
                        "#3b3b3b",
                    margin:
                        "0 3px",
                }}
            />

            <button
                type="button"
                onClick={
                    onUndo
                }
                title="Undo"
            >
                Undo
            </button>

            <button
                type="button"
                onClick={
                    onRedo
                }
                title="Redo"
            >
                Redo
            </button>

            <div
                style={{
                    width: "1px",
                    height:
                        "28px",
                    background:
                        "#3b3b3b",
                    margin:
                        "0 3px",
                }}
            />

            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap: "3px",
                }}
            >
                {tools.map(
                    (tool) => (
                        <button
                            key={
                                tool.id
                            }
                            type="button"
                            onClick={() =>
                                handleTool(
                                    tool.id
                                )
                            }
                            title={`${tool.label} (${tool.shortcut})`}
                            aria-pressed={
                                activeTool ===
                                tool.id
                            }
                            style={{
                                minWidth:
                                    "62px",
                                background:
                                    activeTool ===
                                    tool.id
                                        ? "#3d4f63"
                                        : undefined,
                                borderColor:
                                    activeTool ===
                                    tool.id
                                        ? "#6885a5"
                                        : undefined,
                            }}
                        >
                            {tool.label}
                        </button>
                    )
                )}
            </div>

            <div
                style={{
                    width: "1px",
                    height:
                        "28px",
                    background:
                        "#3b3b3b",
                    margin:
                        "0 3px",
                }}
            />

            <button
                type="button"
                onClick={
                    onDuplicate
                }
                title="Duplicate selected object"
            >
                Duplicate
            </button>

            <button
                type="button"
                onClick={
                    onDelete
                }
                title="Delete selected object"
            >
                Delete
            </button>

            <button
                type="button"
                onClick={
                    onFrameSelected
                }
                title="Frame selected object"
            >
                Frame
            </button>

            <button
                type="button"
                onClick={
                    onResetView
                }
                title="Reset viewport"
            >
                View
            </button>

            <div
                style={{
                    position:
                        "relative",
                    marginLeft:
                        "auto",
                }}
            >
                <button
                    type="button"
                    onClick={() =>
                        setExportOpen(
                            (open) =>
                                !open
                        )
                    }
                    aria-expanded={
                        exportOpen
                    }
                >
                    Export
                </button>

                {exportOpen && (
                    <div
                        style={{
                            position:
                                "absolute",
                            top:
                                "calc(100% + 5px)",
                            right: 0,
                            minWidth:
                                "150px",
                            padding:
                                "5px",
                            background:
                                "#242424",
                            border:
                                "1px solid #444",
                            borderRadius:
                                "5px",
                            boxShadow:
                                "0 10px 30px rgba(0,0,0,.45)",
                            display:
                                "flex",
                            flexDirection:
                                "column",
                            gap:
                                "3px",
                            zIndex:
                                100,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() =>
                                handleExport(
                                    "glb"
                                )
                            }
                            style={{
                                textAlign:
                                    "left",
                            }}
                        >
                            Export GLB
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                handleExport(
                                    "fbx"
                                )
                            }
                            style={{
                                textAlign:
                                    "left",
                            }}
                        >
                            Export FBX
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                handleExport(
                                    "zip"
                                )
                            }
                            style={{
                                textAlign:
                                    "left",
                            }}
                        >
                            Export Project ZIP
                        </button>
                    </div>
                )}
            </div>

            <input
                ref={
                    fileInputRef
                }
                type="file"
                accept=".glb,.gltf,.fbx,.zip,.json"
                multiple
                onChange={
                    handleFileChange
                }
                style={{
                    display: "none",
                }}
            />
        </header>
    );
}
