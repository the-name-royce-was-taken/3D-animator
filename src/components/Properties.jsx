import {
    useEffect,
    useState,
} from "react";

export default function Properties({
    selectedObject = null,
    onTransformChange = () => {},
    onPropertyChange = () => {},
    onStatusChange = () => {},
}) {
    if (!selectedObject) {
        return (
            <aside
                className="properties"
                style={{
                    width:
                        "100%",
                    height:
                        "100%",
                    boxSizing:
                        "border-box",
                    background:
                        "#1b1b1b",
                    color:
                        "#ccc",
                    overflowY:
                        "auto",
                }}
            >
                <PanelHeader title="Properties" />

                <div
                    style={{
                        padding:
                            "30px 15px",
                        textAlign:
                            "center",
                        color:
                            "#666",
                        fontSize:
                            "12px",
                        lineHeight:
                            "1.5",
                    }}
                >
                    Select an object to
                    view and edit its
                    properties.
                </div>
            </aside>
        );
    }

    return (
        <aside
            className="properties"
            style={{
                width:
                    "100%",
                height:
                    "100%",
                boxSizing:
                    "border-box",
                background:
                    "#1b1b1b",
                color:
                    "#ccc",
                overflowY:
                    "auto",
                overflowX:
                    "hidden",
            }}
        >
            <PanelHeader
                title="Properties"
            />

            <ObjectSection
                selectedObject={
                    selectedObject
                }
                onPropertyChange={
                    onPropertyChange
                }
                onStatusChange={
                    onStatusChange
                }
            />

            <TransformSection
                selectedObject={
                    selectedObject
                }
                onTransformChange={
                    onTransformChange
                }
                onStatusChange={
                    onStatusChange
                }
            />

            <DisplaySection
                selectedObject={
                    selectedObject
                }
                onPropertyChange={
                    onPropertyChange
                }
            />

            <AnimationSection
                selectedObject={
                    selectedObject
                }
                onStatusChange={
                    onStatusChange
                }
            />
        </aside>
    );
}

function PanelHeader({
    title,
}) {
    return (
        <div
            style={{
                height:
                    "38px",
                display:
                    "flex",
                alignItems:
                    "center",
                padding:
                    "0 10px",
                boxSizing:
                    "border-box",
                background:
                    "#242424",
                borderBottom:
                    "1px solid #333",
                color:
                    "#ddd",
                fontSize:
                    "11px",
                fontWeight:
                    "700",
                textTransform:
                    "uppercase",
                letterSpacing:
                    "0.05em",
            }}
        >
            {title}
        </div>
    );
}

function ObjectSection({
    selectedObject,
    onPropertyChange,
    onStatusChange,
}) {
    const [name, setName] =
        useState(
            selectedObject.name ||
                ""
        );

    useEffect(() => {
        setName(
            selectedObject.name ||
                ""
        );
    }, [
        selectedObject.id,
        selectedObject.name,
    ]);

    const commitName =
        () => {
            const newName =
                name.trim();

            if (!newName) {
                setName(
                    selectedObject.name ||
                        ""
                );
                return;
            }

            onPropertyChange(
                selectedObject,
                "name",
                newName
            );

            onStatusChange(
                `Object renamed to ${newName}`
            );
        };

    return (
        <Section title="Object">
            <Field
                label="Name"
                vertical
            >
                <input
                    value={name}
                    onChange={(
                        event
                    ) =>
                        setName(
                            event.target
                                .value
                        )
                    }
                    onBlur={
                        commitName
                    }
                    onKeyDown={(
                        event
                    ) => {
                        if (
                            event.key ===
                            "Enter"
                        ) {
                            commitName();
                        }

                        if (
                            event.key ===
                            "Escape"
                        ) {
                            setName(
                                selectedObject.name ||
                                    ""
                            );
                        }
                    }}
                />
            </Field>

            <ReadOnlyField
                label="Type"
                value={
                    selectedObject.type ||
                    "Object"
                }
            />

            <ReadOnlyField
                label="ID"
                value={
                    selectedObject.id ||
                    "—"
                }
                mono
            />
        </Section>
    );
}

function TransformSection({
    selectedObject,
    onTransformChange,
    onStatusChange,
}) {
    const position =
        getVector(
            selectedObject.position,
            0
        );

    const rotation =
        getVector(
            selectedObject.rotation,
            0
        );

    const scale =
        getVector(
            selectedObject.scale,
            1
        );

    const handleVectorChange =
        (
            property,
            axis,
            value
        ) => {
            const numericValue =
                Number(value);

            if (
                !Number.isFinite(
                    numericValue
                )
            ) {
                return;
            }

            const current =
                getVector(
                    selectedObject[
                        property
                    ],
                    property ===
                        "scale"
                        ? 1
                        : 0
                );

            const next = {
                ...current,
                [axis]:
                    numericValue,
            };

            onTransformChange(
                selectedObject,
                property,
                next
            );
        };

    const resetVector =
        (
            property,
            value
        ) => {
            onTransformChange(
                selectedObject,
                property,
                {
                    x: value,
                    y: value,
                    z: value,
                }
            );

            onStatusChange(
                `${capitalize(
                    property
                )} reset`
            );
        };

    return (
        <Section title="Transform">
            <VectorEditor
                label="Position"
                value={
                    position
                }
                step="0.01"
                onChange={(
                    axis,
                    value
                ) =>
                    handleVectorChange(
                        "position",
                        axis,
                        value
                    )
                }
                onReset={() =>
                    resetVector(
                        "position",
                        0
                    )
                }
            />

            <VectorEditor
                label="Rotation"
                value={
                    rotation
                }
                step="1"
                suffix="°"
                onChange={(
                    axis,
                    value
                ) =>
                    handleVectorChange(
                        "rotation",
                        axis,
                        value
                    )
                }
                onReset={() =>
                    resetVector(
                        "rotation",
                        0
                    )
                }
            />

            <VectorEditor
                label="Scale"
                value={
                    scale
                }
                step="0.01"
                onChange={(
                    axis,
                    value
                ) =>
                    handleVectorChange(
                        "scale",
                        axis,
                        value
                    )
                }
                onReset={() =>
                    resetVector(
                        "scale",
                        1
                    )
                }
            />
        </Section>
    );
}

function DisplaySection({
    selectedObject,
    onPropertyChange,
}) {
    const visible =
        selectedObject.visible !==
        false;

    const castShadow =
        selectedObject.castShadow !==
        false;

    const receiveShadow =
        selectedObject.receiveShadow !==
        false;

    return (
        <Section title="Display">
            <ToggleRow
                label="Visible"
                value={
                    visible
                }
                onChange={(
                    value
                ) =>
                    onPropertyChange(
                        selectedObject,
                        "visible",
                        value
                    )
                }
            />

            <ToggleRow
                label="Cast Shadow"
                value={
                    castShadow
                }
                onChange={(
                    value
                ) =>
                    onPropertyChange(
                        selectedObject,
                        "castShadow",
                        value
                    )
                }
            />

            <ToggleRow
                label="Receive Shadow"
                value={
                    receiveShadow
                }
                onChange={(
                    value
                ) =>
                    onPropertyChange(
                        selectedObject,
                        "receiveShadow",
                        value
                    )
                }
            />

            <ReadOnlyField
                label="Children"
                value={
                    Array.isArray(
                        selectedObject.children
                    )
                        ? selectedObject
                              .children
                              .length
                        : 0
                }
            />
        </Section>
    );
}

function AnimationSection({
    selectedObject,
    onStatusChange,
}) {
    const animationCount =
        Array.isArray(
            selectedObject.animations
        )
            ? selectedObject
                  .animations
                  .length
            : 0;

    return (
        <Section title="Animation">
            <ReadOnlyField
                label="Animations"
                value={
                    animationCount
                }
            />

            <button
                type="button"
                onClick={() =>
                    onStatusChange(
                        "Keyframe insertion requested"
                    )
                }
                style={{
                    width:
                        "100%",
                    marginTop:
                        "7px",
                }}
            >
                Insert Keyframe
            </button>

            <button
                type="button"
                onClick={() =>
                    onStatusChange(
                        "Animation editor requested"
                    )
                }
                style={{
                    width:
                        "100%",
                    marginTop:
                        "5px",
                }}
            >
                Edit Animation
            </button>
        </Section>
    );
}

function Section({
    title,
    children,
}) {
    const [open, setOpen] =
        useState(true);

    return (
        <section
            style={{
                borderBottom:
                    "1px solid #303030",
            }}
        >
            <button
                type="button"
                onClick={() =>
                    setOpen(
                        (current) =>
                            !current
                    )
                }
                style={{
                    width:
                        "100%",
                    height:
                        "31px",
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "7px",
                    padding:
                        "0 9px",
                    border:
                        "none",
                    borderRadius:
                        "0",
                    background:
                        "#222",
                    color:
                        "#aaa",
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
                }}
            >
                <span>
                    {open
                        ? "▼"
                        : "▶"}
                </span>

                <span>
                    {title}
                </span>
            </button>

            {open && (
                <div
                    style={{
                        padding:
                            "8px",
                    }}
                >
                    {children}
                </div>
            )}
        </section>
    );
}

function VectorEditor({
    label,
    value,
    step,
    suffix = "",
    onChange,
    onReset,
}) {
    return (
        <div
            style={{
                marginBottom:
                    "10px",
            }}
        >
            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    marginBottom:
                        "5px",
                }}
            >
                <span
                    style={{
                        color:
                            "#888",
                        fontSize:
                            "10px",
                    }}
                >
                    {label}
                </span>

                <button
                    type="button"
                    onClick={
                        onReset
                    }
                    title={`Reset ${label}`}
                    style={{
                        marginLeft:
                            "auto",
                        padding:
                            "2px 5px",
                        fontSize:
                            "9px",
                    }}
                >
                    Reset
                </button>
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
                {[
                    "x",
                    "y",
                    "z",
                ].map(
                    (axis) => (
                        <div
                            key={
                                axis
                            }
                            style={{
                                position:
                                    "relative",
                            }}
                        >
                            <span
                                style={{
                                    position:
                                        "absolute",
                                    left:
                                        "5px",
                                    top:
                                        "50%",
                                    transform:
                                        "translateY(-50%)",
                                    color:
                                        "#666",
                                    fontSize:
                                        "9px",
                                    pointerEvents:
                                        "none",
                                }}
                            >
                                {axis.toUpperCase()}
                            </span>

                            <input
                                type="number"
                                value={
                                    Number.isFinite(
                                        Number(
                                            value[
                                                axis
                                            ]
                                        )
                                    )
                                        ? value[
                                              axis
                                          ]
                                        : 0
                                }
                                step={
                                    step
                                }
                                onChange={(
                                    event
                                ) =>
                                    onChange(
                                        axis,
                                        event
                                            .target
                                            .value
                                    )
                                }
                                style={{
                                    width:
                                        "100%",
                                    boxSizing:
                                        "border-box",
                                    paddingLeft:
                                        "18px",
                                    paddingRight:
                                        suffix
                                            ? "14px"
                                            : "4px",
                                }}
                            />

                            {suffix && (
                                <span
                                    style={{
                                        position:
                                            "absolute",
                                        right:
                                            "4px",
                                        top:
                                            "50%",
                                        transform:
                                            "translateY(-50%)",
                                        color:
                                            "#555",
                                        fontSize:
                                            "9px",
                                        pointerEvents:
                                            "none",
                                    }}
                                >
                                    {
                                        suffix
                                    }
                                </span>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

function Field({
    label,
    children,
    vertical = false,
}) {
    return (
        <div
            style={{
                display:
                    vertical
                        ? "flex"
                        : "grid",
                gridTemplateColumns:
                    vertical
                        ? undefined
                        : "70px 1fr",
                flexDirection:
                    vertical
                        ? "column"
                        : undefined,
                gap:
                    vertical
                        ? "4px"
                        : "7px",
                alignItems:
                    vertical
                        ? undefined
                        : "center",
                marginBottom:
                    "9px",
            }}
        >
            <label
                style={{
                    color:
                        "#888",
                    fontSize:
                        "10px",
                }}
            >
                {label}
            </label>

            {children}
        </div>
    );
}

function ReadOnlyField({
    label,
    value,
    mono = false,
}) {
    return (
        <Field
            label={
                label
            }
        >
            <div
                style={{
                    minWidth:
                        "0",
                    padding:
                        "5px 6px",
                    background:
                        "#151515",
                    border:
                        "1px solid #2d2d2d",
                    borderRadius:
                        "3px",
                    color:
                        "#aaa",
                    fontSize:
                        "10px",
                    fontFamily:
                        mono
                            ? "monospace"
                            : undefined,
                    overflow:
                        "hidden",
                    textOverflow:
                        "ellipsis",
                    whiteSpace:
                        "nowrap",
                }}
                title={
                    String(
                        value
                    )
                }
            >
                {value}
            </div>
        </Field>
    );
}

function ToggleRow({
    label,
    value,
    onChange,
}) {
    return (
        <div
            style={{
                display:
                    "flex",
                alignItems:
                    "center",
                justifyContent:
                    "space-between",
                minHeight:
                    "28px",
                marginBottom:
                    "3px",
            }}
        >
            <span
                style={{
                    color:
                        "#999",
                    fontSize:
                        "10px",
                }}
            >
                {label}
            </span>

            <button
                type="button"
                onClick={() =>
                    onChange(
                        !value
                    )
                }
                aria-pressed={
                    value
                }
                style={{
                    minWidth:
                        "42px",
                    padding:
                        "4px 7px",
                    fontSize:
                        "9px",
                    background:
                        value
                            ? "#3d5268"
                            : "#252525",
                    borderColor:
                        value
                            ? "#607c99"
                            : "#3b3b3b",
                }}
            >
                {value
                    ? "ON"
                    : "OFF"}
            </button>
        </div>
    );
}

function getVector(
    value,
    fallback
) {
    if (!value) {
        return {
            x: fallback,
            y: fallback,
            z: fallback,
        };
    }

    return {
        x:
            Number.isFinite(
                Number(
                    value.x
                )
            )
                ? Number(
                      value.x
                  )
                : fallback,

        y:
            Number.isFinite(
                Number(
                    value.y
                )
            )
                ? Number(
                      value.y
                  )
                : fallback,

        z:
            Number.isFinite(
                Number(
                    value.z
                )
            )
                ? Number(
                      value.z
                  )
                : fallback,
    };
}

function capitalize(
    value
) {
    return (
        String(value)
            .charAt(0)
            .toUpperCase() +
        String(value).slice(
            1
        )
    );
}
