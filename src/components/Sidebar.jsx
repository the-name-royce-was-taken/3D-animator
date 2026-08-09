import {
    useState,
} from "react";

export default function Sidebar({
    selectedObject = null,
    objects = [],
    activePanel = "scene",
    onPanelChange = () => {},
    onObjectSelect = () => {},
    onAddObject = () => {},
    onDeleteObject = () => {},
    onDuplicateObject = () => {},
    onImport = () => {},
    onStatusChange = () => {},
}) {
    const [expanded, setExpanded] =
        useState({
            scene: true,
            objects: true,
            tools: false,
        });

    const panels = [
        {
            id: "scene",
            label: "Scene",
        },
        {
            id: "properties",
            label: "Properties",
        },
        {
            id: "rig",
            label: "Rig",
        },
    ];

    const toggleSection = (
        section
    ) => {
        setExpanded(
            (current) => ({
                ...current,
                [section]:
                    !current[
                        section
                    ],
            })
        );
    };

    const handleAdd = () => {
        onAddObject();
        onStatusChange(
            "Add object requested"
        );
    };

    const handleDelete = () => {
        if (!selectedObject) {
            onStatusChange(
                "Select an object first"
            );
            return;
        }

        onDeleteObject(
            selectedObject
        );

        onStatusChange(
            `${selectedObject.name || "Object"} deleted`
        );
    };

    const handleDuplicate = () => {
        if (!selectedObject) {
            onStatusChange(
                "Select an object first"
            );
            return;
        }

        onDuplicateObject(
            selectedObject
        );

        onStatusChange(
            `${selectedObject.name || "Object"} duplicated`
        );
    };

    const handleImport = () => {
        onImport();
        onStatusChange(
            "Import requested"
        );
    };

    return (
        <aside
            className="sidebar"
            style={{
                width:
                    "260px",
                minWidth:
                    "220px",
                height:
                    "100%",
                display:
                    "flex",
                flexDirection:
                    "column",
                background:
                    "#1b1b1b",
                borderRight:
                    "1px solid #333",
                color:
                    "#ddd",
                overflow:
                    "hidden",
                boxSizing:
                    "border-box",
            }}
        >
            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "4px",
                    padding:
                        "7px",
                    borderBottom:
                        "1px solid #333",
                    background:
                        "#222",
                }}
            >
                {panels.map(
                    (panel) => (
                        <button
                            key={
                                panel.id
                            }
                            type="button"
                            onClick={() =>
                                onPanelChange(
                                    panel.id
                                )
                            }
                            aria-pressed={
                                activePanel ===
                                panel.id
                            }
                            style={{
                                flex:
                                    "1",
                                fontSize:
                                    "11px",
                                padding:
                                    "7px 4px",
                                background:
                                    activePanel ===
                                    panel.id
                                        ? "#3b4b5d"
                                        : undefined,
                                borderColor:
                                    activePanel ===
                                    panel.id
                                        ? "#607890"
                                        : undefined,
                            }}
                        >
                            {
                                panel.label
                            }
                        </button>
                    )
                )}
            </div>

            <div
                style={{
                    flex:
                        "1",
                    overflowY:
                        "auto",
                    overflowX:
                        "hidden",
                }}
            >
                {activePanel ===
                    "scene" && (
                    <>
                        <SectionHeader
                            label="Scene"
                            expanded={
                                expanded.scene
                            }
                            onClick={() =>
                                toggleSection(
                                    "scene"
                                )
                            }
                        />

                        {expanded.scene && (
                            <div
                                style={{
                                    padding:
                                        "8px",
                                    display:
                                        "flex",
                                    flexDirection:
                                        "column",
                                    gap:
                                        "6px",
                                }}
                            >
                                <div
                                    style={{
                                        display:
                                            "grid",
                                        gridTemplateColumns:
                                            "1fr 1fr",
                                        gap:
                                            "5px",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={
                                            handleAdd
                                        }
                                    >
                                        Add
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleImport
                                        }
                                    >
                                        Import
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleDuplicate
                                        }
                                    >
                                        Duplicate
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleDelete
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}

                        <SectionHeader
                            label="Objects"
                            expanded={
                                expanded.objects
                            }
                            onClick={() =>
                                toggleSection(
                                    "objects"
                                )
                            }
                        />

                        {expanded.objects && (
                            <div
                                style={{
                                    padding:
                                        "5px 6px 10px",
                                }}
                            >
                                {objects.length ===
                                    0 && (
                                    <div
                                        style={{
                                            padding:
                                                "15px 8px",
                                            textAlign:
                                                "center",
                                            color:
                                                "#777",
                                            fontSize:
                                                "12px",
                                        }}
                                    >
                                        No objects
                                    </div>
                                )}

                                {objects.map(
                                    (
                                        object
                                    ) => (
                                        <ObjectRow
                                            key={
                                                object.id
                                            }
                                            object={
                                                object
                                            }
                                            selected={
                                                selectedObject?.id ===
                                                object.id
                                            }
                                            onClick={() =>
                                                onObjectSelect(
                                                    object
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}

                        <SectionHeader
                            label="Tools"
                            expanded={
                                expanded.tools
                            }
                            onClick={() =>
                                toggleSection(
                                    "tools"
                                )
                            }
                        />

                        {expanded.tools && (
                            <div
                                style={{
                                    padding:
                                        "8px",
                                    color:
                                        "#888",
                                    fontSize:
                                        "12px",
                                    lineHeight:
                                        "1.5",
                                }}
                            >
                                <div>
                                    Select:
                                    {" "}
                                    Q
                                </div>

                                <div>
                                    Move:
                                    {" "}
                                    W
                                </div>

                                <div>
                                    Rotate:
                                    {" "}
                                    E
                                </div>

                                <div>
                                    Scale:
                                    {" "}
                                    R
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activePanel ===
                    "properties" && (
                    <PropertiesPanel
                        selectedObject={
                            selectedObject
                        }
                    />
                )}

                {activePanel ===
                    "rig" && (
                    <RigPanel
                        selectedObject={
                            selectedObject
                        }
                        onStatusChange={
                            onStatusChange
                        }
                    />
                )}
            </div>

            <div
                style={{
                    padding:
                        "7px 9px",
                    borderTop:
                        "1px solid #333",
                    background:
                        "#202020",
                    color:
                        "#777",
                    fontSize:
                        "10px",
                    fontFamily:
                        "monospace",
                    display:
                        "flex",
                    justifyContent:
                        "space-between",
                    gap:
                        "8px",
                }}
            >
                <span>
                    {objects.length} object
                    {objects.length ===
                    1
                        ? ""
                        : "s"}
                </span>

                <span>
                    {selectedObject
                        ? "Selected"
                        : "None"}
                </span>
            </div>
        </aside>
    );
}

function SectionHeader({
    label,
    expanded,
    onClick,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                width:
                    "100%",
                height:
                    "32px",
                display:
                    "flex",
                alignItems:
                    "center",
                gap:
                    "7px",
                padding:
                    "0 9px",
                textAlign:
                    "left",
                border:
                    "none",
                borderBottom:
                    "1px solid #303030",
                borderRadius:
                    "0",
                background:
                    "#242424",
                color:
                    "#ccc",
                fontSize:
                    "11px",
                fontWeight:
                    "700",
                textTransform:
                    "uppercase",
                letterSpacing:
                    "0.05em",
                cursor:
                    "pointer",
            }}
        >
            <span
                style={{
                    display:
                        "inline-block",
                    width:
                        "10px",
                    color:
                        "#777",
                }}
            >
                {expanded
                    ? "▼"
                    : "▶"}
            </span>

            <span>
                {label}
            </span>
        </button>
    );
}

function ObjectRow({
    object,
    selected,
    onClick,
}) {
    const type =
        object.type ||
        "Object";

    const icon =
        getObjectIcon(
            type
        );

    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                width:
                    "100%",
                minHeight:
                    "30px",
                display:
                    "flex",
                alignItems:
                    "center",
                gap:
                    "7px",
                padding:
                    "4px 7px",
                marginBottom:
                    "2px",
                border:
                    "1px solid transparent",
                borderRadius:
                    "3px",
                background:
                    selected
                        ? "#35485d"
                        : "transparent",
                borderColor:
                    selected
                        ? "#526b84"
                        : "transparent",
                color:
                    selected
                        ? "#fff"
                        : "#ccc",
                textAlign:
                    "left",
                cursor:
                    "pointer",
            }}
        >
            <span
                style={{
                    width:
                        "18px",
                    textAlign:
                        "center",
                    color:
                        selected
                            ? "#fff"
                            : "#888",
                    fontSize:
                        "12px",
                }}
            >
                {icon}
            </span>

            <span
                style={{
                    flex:
                        "1",
                    minWidth:
                        "0",
                    overflow:
                        "hidden",
                    textOverflow:
                        "ellipsis",
                    whiteSpace:
                        "nowrap",
                    fontSize:
                        "12px",
                }}
            >
                {object.name ||
                    "Unnamed Object"}
            </span>

            <span
                style={{
                    color:
                        "#666",
                    fontSize:
                        "9px",
                    textTransform:
                        "uppercase",
                }}
            >
                {type}
            </span>
        </button>
    );
}

function PropertiesPanel({
    selectedObject,
}) {
    if (!selectedObject) {
        return (
            <div
                style={{
                    padding:
                        "20px 12px",
                    color:
                        "#777",
                    fontSize:
                        "12px",
                    textAlign:
                        "center",
                }}
            >
                Select an object to view
                its properties.
            </div>
        );
    }

    const position =
        selectedObject.position ||
        {
            x: 0,
            y: 0,
            z: 0,
        };

    const rotation =
        selectedObject.rotation ||
        {
            x: 0,
            y: 0,
            z: 0,
        };

    const scale =
        selectedObject.scale ||
        {
            x: 1,
            y: 1,
            z: 1,
        };

    return (
        <div>
            <SectionHeader
                label="Transform"
                expanded={
                    true
                }
                onClick={() => {}}
            />

            <VectorGroup
                label="Position"
                value={
                    position
                }
            />

            <VectorGroup
                label="Rotation"
                value={
                    rotation
                }
            />

            <VectorGroup
                label="Scale"
                value={
                    scale
                }
            />

            <SectionHeader
                label="Object"
                expanded={
                    true
                }
                onClick={() => {}}
            />

            <div
                style={{
                    padding:
                        "9px",
                    display:
                        "flex",
                    flexDirection:
                        "column",
                    gap:
                        "8px",
                    fontSize:
                        "11px",
                }}
            >
                <div>
                    <span
                        style={{
                            color:
                                "#777",
                        }}
                    >
                        Name
                    </span>

                    <div
                        style={{
                            marginTop:
                                "3px",
                            color:
                                "#ddd",
                        }}
                    >
                        {selectedObject.name ||
                            "Unnamed"}
                    </div>
                </div>

                <div>
                    <span
                        style={{
                            color:
                                "#777",
                        }}
                    >
                        Type
                    </span>

                    <div
                        style={{
                            marginTop:
                                "3px",
                            color:
                                "#ddd",
                        }}
                    >
                        {selectedObject.type ||
                            "Object"}
                    </div>
                </div>

                <div>
                    <span
                        style={{
                            color:
                                "#777",
                        }}
                    >
                        ID
                    </span>

                    <div
                        style={{
                            marginTop:
                                "3px",
                            color:
                                "#888",
                            fontFamily:
                                "monospace",
                            wordBreak:
                                "break-all",
                        }}
                    >
                        {selectedObject.id ||
                            "—"}
                    </div>
                </div>
            </div>
        </div>
    );
}

function VectorGroup({
    label,
    value,
}) {
    return (
        <div
            style={{
                padding:
                    "8px 9px",
                borderBottom:
                    "1px solid #292929",
            }}
        >
            <div
                style={{
                    color:
                        "#888",
                    fontSize:
                        "10px",
                    marginBottom:
                        "5px",
                }}
            >
                {label}
            </div>

            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "repeat(3, 1fr)",
                    gap:
                        "4px",
                }}
            >
                <ValueBox
                    label="X"
                    value={
                        value.x
                    }
                />

                <ValueBox
                    label="Y"
                    value={
                        value.y
                    }
                />

                <ValueBox
                    label="Z"
                    value={
                        value.z
                    }
                />
            </div>
        </div>
    );
}

function ValueBox({
    label,
    value,
}) {
    return (
        <div
            style={{
                background:
                    "#151515",
                border:
                    "1px solid #303030",
                borderRadius:
                    "3px",
                padding:
                    "5px",
                minWidth:
                    "0",
            }}
        >
            <div
                style={{
                    color:
                        "#666",
                    fontSize:
                        "9px",
                    marginBottom:
                        "2px",
                }}
            >
                {label}
            </div>

            <div
                style={{
                    color:
                        "#bbb",
                    fontFamily:
                        "monospace",
                    fontSize:
                        "10px",
                    overflow:
                        "hidden",
                    textOverflow:
                        "ellipsis",
                }}
            >
                {formatValue(
                    value
                )}
            </div>
        </div>
    );
}

function RigPanel({
    selectedObject,
    onStatusChange,
}) {
    const hasSelection =
        Boolean(
            selectedObject
        );

    const startRig =
        () => {
            if (!hasSelection) {
                onStatusChange(
                    "Select a character before rigging"
                );
                return;
            }

            onStatusChange(
                `Rig wizard started for ${
                    selectedObject.name ||
                    "selected object"
                }`
            );
        };

    return (
        <div>
            <SectionHeader
                label="Rigging"
                expanded={
                    true
                }
                onClick={() => {}}
            />

            <div
                style={{
                    padding:
                        "10px",
                    display:
                        "flex",
                    flexDirection:
                        "column",
                    gap:
                        "8px",
                }}
            >
                <div
                    style={{
                        color:
                            "#888",
                        fontSize:
                            "11px",
                        lineHeight:
                            "1.5",
                    }}
                >
                    {hasSelection
                        ? `Selected: ${
                              selectedObject.name ||
                              "Object"
                          }`
                        : "Select a character model to begin rigging."}
                </div>

                <button
                    type="button"
                    onClick={
                        startRig
                    }
                    disabled={
                        !hasSelection
                    }
                >
                    Auto Rig
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onStatusChange(
                            "Bone creation mode requested"
                        )
                    }
                    disabled={
                        !hasSelection
                    }
                >
                    Create Bones
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onStatusChange(
                            "Weight paint mode requested"
                        )
                    }
                    disabled={
                        !hasSelection
                    }
                >
                    Weight Paint
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onStatusChange(
                            "Mirror rig requested"
                        )
                    }
                    disabled={
                        !hasSelection
                    }
                >
                    Mirror Rig
                </button>
            </div>
        </div>
    );
}

function getObjectIcon(
    type
) {
    const normalized =
        String(type)
            .toLowerCase();

    if (
        normalized.includes(
            "camera"
        )
    ) {
        return "◉";
    }

    if (
        normalized.includes(
            "light"
        )
    ) {
        return "☼";
    }

    if (
        normalized.includes(
            "bone"
        )
    ) {
        return "⌁";
    }

    if (
        normalized.includes(
            "mesh"
        )
    ) {
        return "◆";
    }

    if (
        normalized.includes(
            "group"
        )
    ) {
        return "◇";
    }

    return "●";
}

function formatValue(
    value
) {
    const number =
        Number(value);

    if (
        !Number.isFinite(
            number
        )
    ) {
        return "0.000";
    }

    return number.toFixed(
        3
    );
}
