import {
    useMemo,
    useState,
} from "react";

export default function Outliner({
    objects = [],
    selectedId = null,
    onSelect = () => {},
    onRename = () => {},
    onDelete = () => {},
    onDuplicate = () => {},
    onVisibilityChange = () => {},
    onLockChange = () => {},
    onStatusChange = () => {},
}) {
    const [search, setSearch] =
        useState("");

    const [expanded, setExpanded] =
        useState({
            scene: true,
            cameras: true,
            lights: true,
            meshes: true,
            bones: true,
            other: true,
        });

    const [editingId, setEditingId] =
        useState(null);

    const [editingName, setEditingName] =
        useState("");

    const filteredObjects =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {
                return objects;
            }

            return objects.filter(
                (object) =>
                    String(
                        object.name ||
                            ""
                    )
                        .toLowerCase()
                        .includes(query) ||
                    String(
                        object.type ||
                            ""
                    )
                        .toLowerCase()
                        .includes(query)
            );
        }, [
            objects,
            search,
        ]);

    const groups =
        useMemo(
            () =>
                groupObjects(
                    filteredObjects
                ),
            [filteredObjects]
        );

    const toggleGroup =
        (group) => {
            setExpanded(
                (current) => ({
                    ...current,
                    [group]:
                        !current[
                            group
                        ],
                })
            );
        };

    const beginRename =
        (object) => {
            setEditingId(
                object.id
            );

            setEditingName(
                object.name ||
                    "Object"
            );
        };

    const cancelRename =
        () => {
            setEditingId(null);
            setEditingName("");
        };

    const finishRename =
        (object) => {
            const name =
                editingName.trim();

            if (!name) {
                cancelRename();
                return;
            }

            onRename(
                object,
                name
            );

            onStatusChange(
                `Renamed to ${name}`
            );

            cancelRename();
        };

    const handleKeyDown =
        (
            event,
            object
        ) => {
            if (
                event.key ===
                "Enter"
            ) {
                finishRename(
                    object
                );
            }

            if (
                event.key ===
                "Escape"
            ) {
                cancelRename();
            }
        };

    const handleDelete =
        (object) => {
            onDelete(object);

            onStatusChange(
                `${object.name || "Object"} deleted`
            );
        };

    const handleDuplicate =
        (object) => {
            onDuplicate(
                object
            );

            onStatusChange(
                `${object.name || "Object"} duplicated`
            );
        };

    const handleVisibility =
        (
            event,
            object
        ) => {
            event.stopPropagation();

            onVisibilityChange(
                object,
                object.visible ===
                    false
                    ? true
                    : false
            );
        };

    const handleLock =
        (
            event,
            object
        ) => {
            event.stopPropagation();

            onLockChange(
                object,
                !object.locked
            );
        };

    return (
        <section
            className="outliner"
            style={{
                width:
                    "100%",
                height:
                    "100%",
                minHeight:
                    "180px",
                display:
                    "flex",
                flexDirection:
                    "column",
                background:
                    "#1b1b1b",
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
                    minHeight:
                        "38px",
                    display:
                        "flex",
                    alignItems:
                        "center",
                    padding:
                        "5px 7px",
                    gap:
                        "5px",
                    background:
                        "#242424",
                    borderBottom:
                        "1px solid #333",
                }}
            >
                <div
                    style={{
                        fontSize:
                            "11px",
                        fontWeight:
                            "700",
                        textTransform:
                            "uppercase",
                        letterSpacing:
                            "0.05em",
                        marginRight:
                            "5px",
                    }}
                >
                    Outliner
                </div>

                <span
                    style={{
                        color:
                            "#666",
                        fontSize:
                            "10px",
                    }}
                >
                    {objects.length}
                </span>

                <button
                    type="button"
                    onClick={() =>
                        setExpanded(
                            {
                                scene:
                                    true,
                                cameras:
                                    true,
                                lights:
                                    true,
                                meshes:
                                    true,
                                bones:
                                    true,
                                other:
                                    true,
                            }
                        )
                    }
                    style={{
                        marginLeft:
                            "auto",
                    }}
                    title="Expand all"
                >
                    +
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setExpanded(
                            {
                                scene:
                                    false,
                                cameras:
                                    false,
                                lights:
                                    false,
                                meshes:
                                    false,
                                bones:
                                    false,
                                other:
                                    false,
                            }
                        )
                    }
                    title="Collapse all"
                >
                    −
                </button>
            </div>

            <div
                style={{
                    padding:
                        "6px",
                    borderBottom:
                        "1px solid #303030",
                    background:
                        "#202020",
                }}
            >
                <input
                    type="search"
                    value={
                        search
                    }
                    onChange={(
                        event
                    ) =>
                        setSearch(
                            event.target
                                .value
                        )
                    }
                    placeholder="Search objects..."
                    aria-label="Search objects"
                    style={{
                        width:
                            "100%",
                        boxSizing:
                            "border-box",
                    }}
                />
            </div>

            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "1fr 28px 28px",
                    minHeight:
                        "27px",
                    alignItems:
                        "center",
                    padding:
                        "0 6px",
                    background:
                        "#202020",
                    borderBottom:
                        "1px solid #303030",
                    color:
                        "#666",
                    fontSize:
                        "9px",
                    textTransform:
                        "uppercase",
                    letterSpacing:
                        "0.04em",
                }}
            >
                <span>
                    Objects
                </span>

                <span
                    style={{
                        textAlign:
                            "center",
                    }}
                >
                    Vis
                </span>

                <span
                    style={{
                        textAlign:
                            "center",
                    }}
                >
                    Lock
                </span>
            </div>

            <div
                style={{
                    flex:
                        "1",
                    overflowY:
                        "auto",
                    overflowX:
                        "hidden",
                    padding:
                        "4px 0 10px",
                }}
            >
                <OutlinerGroup
                    label="Scene"
                    groupId="scene"
                    objects={
                        groups.scene
                    }
                    expanded={
                        expanded.scene
                    }
                    onToggle={
                        toggleGroup
                    }
                    selectedId={
                        selectedId
                    }
                    editingId={
                        editingId
                    }
                    editingName={
                        editingName
                    }
                    setEditingName={
                        setEditingName
                    }
                    onSelect={
                        onSelect
                    }
                    onBeginRename={
                        beginRename
                    }
                    onFinishRename={
                        finishRename
                    }
                    onCancelRename={
                        cancelRename
                    }
                    onKeyDown={
                        handleKeyDown
                    }
                    onDelete={
                        handleDelete
                    }
                    onDuplicate={
                        handleDuplicate
                    }
                    onVisibility={
                        handleVisibility
                    }
                    onLock={
                        handleLock
                    }
                />

                <OutlinerGroup
                    label="Cameras"
                    groupId="cameras"
                    objects={
                        groups.cameras
                    }
                    expanded={
                        expanded.cameras
                    }
                    onToggle={
                        toggleGroup
                    }
                    selectedId={
                        selectedId
                    }
                    editingId={
                        editingId
                    }
                    editingName={
                        editingName
                    }
                    setEditingName={
                        setEditingName
                    }
                    onSelect={
                        onSelect
                    }
                    onBeginRename={
                        beginRename
                    }
                    onFinishRename={
                        finishRename
                    }
                    onCancelRename={
                        cancelRename
                    }
                    onKeyDown={
                        handleKeyDown
                    }
                    onDelete={
                        handleDelete
                    }
                    onDuplicate={
                        handleDuplicate
                    }
                    onVisibility={
                        handleVisibility
                    }
                    onLock={
                        handleLock
                    }
                />

                <OutlinerGroup
                    label="Lights"
                    groupId="lights"
                    objects={
                        groups.lights
                    }
                    expanded={
                        expanded.lights
                    }
                    onToggle={
                        toggleGroup
                    }
                    selectedId={
                        selectedId
                    }
                    editingId={
                        editingId
                    }
                    editingName={
                        editingName
                    }
                    setEditingName={
                        setEditingName
                    }
                    onSelect={
                        onSelect
                    }
                    onBeginRename={
                        beginRename
                    }
                    onFinishRename={
                        finishRename
                    }
                    onCancelRename={
                        cancelRename
                    }
                    onKeyDown={
                        handleKeyDown
                    }
                    onDelete={
                        handleDelete
                    }
                    onDuplicate={
                        handleDuplicate
                    }
                    onVisibility={
                        handleVisibility
                    }
                    onLock={
                        handleLock
                    }
                />

                <OutlinerGroup
                    label="Meshes"
                    groupId="meshes"
                    objects={
                        groups.meshes
                    }
                    expanded={
                        expanded.meshes
                    }
                    onToggle={
                        toggleGroup
                    }
                    selectedId={
                        selectedId
                    }
                    editingId={
                        editingId
                    }
                    editingName={
                        editingName
                    }
                    setEditingName={
                        setEditingName
                    }
                    onSelect={
                        onSelect
                    }
                    onBeginRename={
                        beginRename
                    }
                    onFinishRename={
                        finishRename
                    }
                    onCancelRename={
                        cancelRename
                    }
                    onKeyDown={
                        handleKeyDown
                    }
                    onDelete={
                        handleDelete
                    }
                    onDuplicate={
                        handleDuplicate
                    }
                    onVisibility={
                        handleVisibility
                    }
                    onLock={
                        handleLock
                    }
                />

                <OutlinerGroup
                    label="Bones"
                    groupId="bones"
                    objects={
                        groups.bones
                    }
                    expanded={
                        expanded.bones
                    }
                    onToggle={
                        toggleGroup
                    }
                    selectedId={
                        selectedId
                    }
                    editingId={
                        editingId
                    }
                    editingName={
                        editingName
                    }
                    setEditingName={
                        setEditingName
                    }
                    onSelect={
                        onSelect
                    }
                    onBeginRename={
                        beginRename
                    }
                    onFinishRename={
                        finishRename
                    }
                    onCancelRename={
                        cancelRename
                    }
                    onKeyDown={
                        handleKeyDown
                    }
                    onDelete={
                        handleDelete
                    }
                    onDuplicate={
                        handleDuplicate
                    }
                    onVisibility={
                        handleVisibility
                    }
                    onLock={
                        handleLock
                    }
                />

                <OutlinerGroup
                    label="Other"
                    groupId="other"
                    objects={
                        groups.other
                    }
                    expanded={
                        expanded.other
                    }
                    onToggle={
                        toggleGroup
                    }
                    selectedId={
                        selectedId
                    }
                    editingId={
                        editingId
                    }
                    editingName={
                        editingName
                    }
                    setEditingName={
                        setEditingName
                    }
                    onSelect={
                        onSelect
                    }
                    onBeginRename={
                        beginRename
                    }
                    onFinishRename={
                        finishRename
                    }
                    onCancelRename={
                        cancelRename
                    }
                    onKeyDown={
                        handleKeyDown
                    }
                    onDelete={
                        handleDelete
                    }
                    onDuplicate={
                        handleDuplicate
                    }
                    onVisibility={
                        handleVisibility
                    }
                    onLock={
                        handleLock
                    }
                />

                {filteredObjects.length ===
                    0 && (
                    <div
                        style={{
                            padding:
                                "25px 10px",
                            textAlign:
                                "center",
                            color:
                                "#666",
                            fontSize:
                                "12px",
                        }}
                    >
                        {search
                            ? "No matching objects"
                            : "Scene is empty"}
                    </div>
                )}
            </div>
        </section>
    );
}

function OutlinerGroup({
    label,
    groupId,
    objects,
    expanded,
    onToggle,
    selectedId,
    editingId,
    editingName,
    setEditingName,
    onSelect,
    onBeginRename,
    onFinishRename,
    onCancelRename,
    onKeyDown,
    onDelete,
    onDuplicate,
    onVisibility,
    onLock,
}) {
    return (
        <div>
            <button
                type="button"
                onClick={() =>
                    onToggle(
                        groupId
                    )
                }
                style={{
                    width:
                        "100%",
                    height:
                        "27px",
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "6px",
                    padding:
                        "0 7px",
                    border:
                        "none",
                    borderRadius:
                        "0",
                    background:
                        "#222",
                    color:
                        "#999",
                    textAlign:
                        "left",
                    fontSize:
                        "10px",
                    fontWeight:
                        "700",
                    textTransform:
                        "uppercase",
                    letterSpacing:
                        "0.04em",
                    cursor:
                        "pointer",
                }}
            >
                <span
                    style={{
                        width:
                            "10px",
                    }}
                >
                    {expanded
                        ? "▼"
                        : "▶"}
                </span>

                <span>
                    {label}
                </span>

                <span
                    style={{
                        marginLeft:
                            "auto",
                        color:
                            "#555",
                    }}
                >
                    {
                        objects.length
                    }
                </span>
            </button>

            {expanded &&
                objects.map(
                    (
                        object
                    ) => (
                        <OutlinerRow
                            key={
                                object.id
                            }
                            object={
                                object
                            }
                            selected={
                                selectedId ===
                                object.id
                            }
                            editing={
                                editingId ===
                                object.id
                            }
                            editingName={
                                editingName
                            }
                            setEditingName={
                                setEditingName
                            }
                            onSelect={
                                onSelect
                            }
                            onBeginRename={
                                onBeginRename
                            }
                            onFinishRename={
                                onFinishRename
                            }
                            onCancelRename={
                                onCancelRename
                            }
                            onKeyDown={
                                onKeyDown
                            }
                            onDelete={
                                onDelete
                            }
                            onDuplicate={
                                onDuplicate
                            }
                            onVisibility={
                                onVisibility
                            }
                            onLock={
                                onLock
                            }
                        />
                    )
                )}
        </div>
    );
}

function OutlinerRow({
    object,
    selected,
    editing,
    editingName,
    setEditingName,
    onSelect,
    onBeginRename,
    onFinishRename,
    onCancelRename,
    onKeyDown,
    onDelete,
    onDuplicate,
    onVisibility,
    onLock,
}) {
    const visible =
        object.visible !==
        false;

    const locked =
        Boolean(
            object.locked
        );

    return (
        <div
            style={{
                display:
                    "grid",
                gridTemplateColumns:
                    "1fr 28px 28px",
                minHeight:
                    "31px",
                alignItems:
                    "center",
                padding:
                    "0 5px",
                background:
                    selected
                        ? "#35485d"
                        : "transparent",
                borderBottom:
                    "1px solid #222",
                color:
                    selected
                        ? "#fff"
                        : "#ccc",
            }}
        >
            <button
                type="button"
                onClick={() =>
                    onSelect(
                        object
                    )
                }
                onDoubleClick={() =>
                    onBeginRename(
                        object
                    )
                }
                style={{
                    minWidth:
                        "0",
                    height:
                        "30px",
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "6px",
                    padding:
                        "0 3px",
                    border:
                        "none",
                    borderRadius:
                        "0",
                    background:
                        "transparent",
                    color:
                        "inherit",
                    textAlign:
                        "left",
                    cursor:
                        "pointer",
                }}
                title="Double-click to rename"
            >
                <span
                    style={{
                        width:
                            "17px",
                        textAlign:
                            "center",
                        color:
                            selected
                                ? "#fff"
                                : "#777",
                        fontSize:
                            "11px",
                    }}
                >
                    {getIcon(
                        object.type
                    )}
                </span>

                {editing ? (
                    <input
                        autoFocus
                        value={
                            editingName
                        }
                        onChange={(
                            event
                        ) =>
                            setEditingName(
                                event
                                    .target
                                    .value
                            )
                        }
                        onKeyDown={(
                            event
                        ) =>
                            onKeyDown(
                                event,
                                object
                            )
                        }
                        onBlur={() =>
                            onFinishRename(
                                object
                            )
                        }
                        onClick={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                        style={{
                            minWidth:
                                "0",
                            width:
                                "100%",
                            height:
                                "21px",
                            boxSizing:
                                "border-box",
                        }}
                    />
                ) : (
                    <span
                        style={{
                            minWidth:
                                "0",
                            overflow:
                                "hidden",
                            textOverflow:
                                "ellipsis",
                            whiteSpace:
                                "nowrap",
                            fontSize:
                                "11px",
                        }}
                    >
                        {object.name ||
                            "Unnamed Object"}
                    </span>
                )}
            </button>

            <button
                type="button"
                onClick={(
                    event
                ) =>
                    onVisibility(
                        event,
                        object
                    )
                }
                title={
                    visible
                        ? "Hide object"
                        : "Show object"
                }
                style={{
                    width:
                        "25px",
                    height:
                        "25px",
                    padding:
                        "0",
                    border:
                        "none",
                    borderRadius:
                        "3px",
                    background:
                        "transparent",
                    color:
                        visible
                            ? "#aaa"
                            : "#444",
                    fontSize:
                        "11px",
                }}
            >
                {visible
                    ? "●"
                    : "○"}
            </button>

            <button
                type="button"
                onClick={(
                    event
                ) =>
                    onLock(
                        event,
                        object
                    )
                }
                title={
                    locked
                        ? "Unlock object"
                        : "Lock object"
                }
                style={{
                    width:
                        "25px",
                    height:
                        "25px",
                    padding:
                        "0",
                    border:
                        "none",
                    borderRadius:
                        "3px",
                    background:
                        "transparent",
                    color:
                        locked
                            ? "#ddd"
                            : "#555",
                    fontSize:
                        "11px",
                }}
            >
                {locked
                    ? "■"
                    : "□"}
            </button>

            {selected && (
                <div
                    style={{
                        gridColumn:
                            "1 / -1",
                        display:
                            "flex",
                        gap:
                            "4px",
                        padding:
                            "3px 0 4px 23px",
                    }}
                >
                    <button
                        type="button"
                        onClick={() =>
                            onBeginRename(
                                object
                            )
                        }
                        style={{
                            fontSize:
                                "9px",
                            padding:
                                "3px 6px",
                        }}
                    >
                        Rename
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            onDuplicate(
                                object
                            )
                        }
                        style={{
                            fontSize:
                                "9px",
                            padding:
                                "3px 6px",
                        }}
                    >
                        Duplicate
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            onDelete(
                                object
                            )
                        }
                        style={{
                            fontSize:
                                "9px",
                            padding:
                                "3px 6px",
                        }}
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

function groupObjects(
    objects
) {
    const groups = {
        scene: [],
        cameras: [],
        lights: [],
        meshes: [],
        bones: [],
        other: [],
    };

    objects.forEach(
        (object) => {
            const type =
                String(
                    object.type ||
                        ""
                ).toLowerCase();

            if (
                type.includes(
                    "camera"
                )
            ) {
                groups.cameras.push(
                    object
                );
                return;
            }

            if (
                type.includes(
                    "light"
                )
            ) {
                groups.lights.push(
                    object
                );
                return;
            }

            if (
                type.includes(
                    "bone"
                ) ||
                type.includes(
                    "skeleton"
                )
            ) {
                groups.bones.push(
                    object
                );
                return;
            }

            if (
                type.includes(
                    "mesh"
                ) ||
                type.includes(
                    "skinned"
                ) ||
                type.includes(
                    "model"
                )
            ) {
                groups.meshes.push(
                    object
                );
                return;
            }

            if (
                type.includes(
                    "scene"
                ) ||
                type.includes(
                    "group"
                )
            ) {
                groups.scene.push(
                    object
                );
                return;
            }

            groups.other.push(
                object
            );
        }
    );

    return groups;
}

function getIcon(
    type
) {
    const normalized =
        String(
            type || ""
        ).toLowerCase();

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
        ) ||
        normalized.includes(
            "skeleton"
        )
    ) {
        return "⌁";
    }

    if (
        normalized.includes(
            "mesh"
        ) ||
        normalized.includes(
            "model"
        ) ||
        normalized.includes(
            "skinned"
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
