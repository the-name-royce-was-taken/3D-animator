import {
    useEffect,
    useState,
} from "react";

export default function RigWizard({
    open = false,
    model = null,
    onClose = () => {},
    onComplete = () => {},
    onStatusChange = () => {},
}) {
    const [step, setStep] =
        useState(0);

    const [rigType, setRigType] =
        useState("humanoid");

    const [bones, setBones] =
        useState(
            createInitialBones()
        );

    const [autoDetect, setAutoDetect] =
        useState(true);

    const [autoWeight, setAutoWeight] =
        useState(true);

    const steps = [
        {
            id: "type",
            title: "Rig Type",
        },
        {
            id: "bones",
            title: "Bones",
        },
        {
            id: "options",
            title: "Options",
        },
        {
            id: "finish",
            title: "Finish",
        },
    ];

    useEffect(() => {
        if (!open) {
            return;
        }

        setStep(0);
        setRigType(
            "humanoid"
        );
        setBones(
            createInitialBones()
        );
        setAutoDetect(true);
        setAutoWeight(true);
    }, [open]);

    if (!open) {
        return null;
    }

    const updateBone =
        (
            boneId,
            property,
            value
        ) => {
            setBones(
                (current) =>
                    current.map(
                        (bone) =>
                            bone.id ===
                            boneId
                                ? {
                                      ...bone,
                                      [property]:
                                          value,
                                  }
                                : bone
                    )
            );
        };

    const handleAutoDetect =
        () => {
            setBones(
                createInitialBones()
            );

            onStatusChange(
                "Automatic bone detection completed"
            );
        };

    const handleNext =
        () => {
            if (step === 0) {
                setStep(1);
                return;
            }

            if (step === 1) {
                const required =
                    bones.filter(
                        (bone) =>
                            bone.required
                    );

                const assigned =
                    required.filter(
                        (bone) =>
                            bone.position
                    );

                if (
                    assigned.length <
                    required.length
                ) {
                    onStatusChange(
                        "Some required bones are not assigned yet"
                    );
                }

                setStep(2);
                return;
            }

            if (step === 2) {
                setStep(3);
                return;
            }
        };

    const handleBack =
        () => {
            if (step > 0) {
                setStep(
                    (current) =>
                        current - 1
                );
            }
        };

    const handleFinish =
        () => {
            const rigData = {
                type: rigType,
                bones,
                autoDetect,
                autoWeight,
                modelId:
                    model?.id ||
                    null,
                createdAt:
                    new Date().toISOString(),
            };

            onComplete(
                rigData
            );

            onStatusChange(
                "Rig created successfully"
            );

            onClose();
        };

    return (
        <div
            className="rig-wizard-overlay"
            style={{
                position:
                    "fixed",
                inset: 0,
                zIndex:
                    1000,
                display:
                    "flex",
                alignItems:
                    "center",
                justifyContent:
                    "center",
                background:
                    "rgba(0, 0, 0, 0.7)",
            }}
        >
            <div
                className="rig-wizard"
                role="dialog"
                aria-modal="true"
                aria-labelledby="rig-wizard-title"
                style={{
                    width:
                        "min(760px, calc(100vw - 30px))",
                    maxHeight:
                        "min(720px, calc(100vh - 30px))",
                    display:
                        "flex",
                    flexDirection:
                        "column",
                    background:
                        "#202020",
                    border:
                        "1px solid #444",
                    borderRadius:
                        "7px",
                    boxShadow:
                        "0 20px 70px rgba(0,0,0,.65)",
                    color:
                        "#ddd",
                    overflow:
                        "hidden",
                }}
            >
                <WizardHeader
                    model={model}
                    onClose={
                        onClose
                    }
                />

                <StepIndicator
                    steps={
                        steps
                    }
                    currentStep={
                        step
                    }
                />

                <div
                    style={{
                        flex:
                            "1",
                        minHeight:
                            "0",
                        overflowY:
                            "auto",
                        padding:
                            "20px",
                    }}
                >
                    {step ===
                        0 && (
                        <RigTypeStep
                            rigType={
                                rigType
                            }
                            setRigType={
                                setRigType
                            }
                        />
                    )}

                    {step ===
                        1 && (
                        <BoneStep
                            bones={
                                bones
                            }
                            onBoneChange={
                                updateBone
                            }
                            onAutoDetect={
                                handleAutoDetect
                            }
                        />
                    )}

                    {step ===
                        2 && (
                        <OptionsStep
                            autoDetect={
                                autoDetect
                            }
                            setAutoDetect={
                                setAutoDetect
                            }
                            autoWeight={
                                autoWeight
                            }
                            setAutoWeight={
                                setAutoWeight
                            }
                        />
                    )}

                    {step ===
                        3 && (
                        <FinishStep
                            rigType={
                                rigType
                            }
                            bones={
                                bones
                            }
                            autoWeight={
                                autoWeight
                            }
                        />
                    )}
                </div>

                <div
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "space-between",
                        padding:
                            "10px 14px",
                        borderTop:
                            "1px solid #363636",
                        background:
                            "#242424",
                    }}
                >
                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                    >
                        Cancel
                    </button>

                    <div
                        style={{
                            display:
                                "flex",
                            gap:
                                "6px",
                        }}
                    >
                        {step > 0 && (
                            <button
                                type="button"
                                onClick={
                                    handleBack
                                }
                            >
                                Back
                            </button>
                        )}

                        {step <
                        3 ? (
                            <button
                                type="button"
                                onClick={
                                    handleNext
                                }
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={
                                    handleFinish
                                }
                                style={{
                                    background:
                                        "#40586f",
                                    borderColor:
                                        "#6686a5",
                                }}
                            >
                                Create Rig
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function WizardHeader({
    model,
    onClose,
}) {
    return (
        <div
            style={{
                minHeight:
                    "52px",
                display:
                    "flex",
                alignItems:
                    "center",
                padding:
                    "0 14px",
                background:
                    "#292929",
                borderBottom:
                    "1px solid #3a3a3a",
            }}
        >
            <div
                style={{
                    flex:
                        "1",
                    minWidth:
                        "0",
                }}
            >
                <div
                    id="rig-wizard-title"
                    style={{
                        fontSize:
                            "15px",
                        fontWeight:
                            "700",
                    }}
                >
                    Rig Wizard
                </div>

                <div
                    style={{
                        marginTop:
                            "2px",
                        color:
                            "#777",
                        fontSize:
                            "10px",
                        overflow:
                            "hidden",
                        textOverflow:
                            "ellipsis",
                        whiteSpace:
                            "nowrap",
                    }}
                >
                    {model
                        ? `Rigging ${
                              model.name ||
                              "selected model"
                          }`
                        : "Create a skeleton for your character"}
                </div>
            </div>

            <button
                type="button"
                onClick={
                    onClose
                }
                aria-label="Close rig wizard"
                style={{
                    width:
                        "30px",
                    height:
                        "30px",
                    padding: 0,
                    fontSize:
                        "16px",
                }}
            >
                ×
            </button>
        </div>
    );
}

function StepIndicator({
    steps,
    currentStep,
}) {
    return (
        <div
            style={{
                display:
                    "flex",
                padding:
                    "10px 15px",
                gap:
                    "5px",
                background:
                    "#222",
                borderBottom:
                    "1px solid #343434",
            }}
        >
            {steps.map(
                (
                    item,
                    index
                ) => {
                    const active =
                        index ===
                        currentStep;

                    const complete =
                        index <
                        currentStep;

                    return (
                        <div
                            key={
                                item.id
                            }
                            style={{
                                flex:
                                    "1",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap:
                                    "6px",
                                color:
                                    active
                                        ? "#ddd"
                                        : complete
                                        ? "#999"
                                        : "#555",
                                fontSize:
                                    "10px",
                            }}
                        >
                            <span
                                style={{
                                    display:
                                        "inline-flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    width:
                                        "20px",
                                    height:
                                        "20px",
                                    borderRadius:
                                        "50%",
                                    background:
                                        active
                                            ? "#4a6075"
                                            : complete
                                            ? "#39453f"
                                            : "#303030",
                                    color:
                                        "#eee",
                                    fontSize:
                                        "9px",
                                    fontWeight:
                                        "700",
                                }}
                            >
                                {complete
                                    ? "✓"
                                    : index +
                                      1}
                            </span>

                            <span>
                                {
                                    item.title
                                }
                            </span>
                        </div>
                    );
                }
            )}
        </div>
    );
}

function RigTypeStep({
    rigType,
    setRigType,
}) {
    const types = [
        {
            id: "humanoid",
            title: "Humanoid",
            description:
                "Standard two-legged character with a head, torso, arms and legs.",
        },
        {
            id: "creature",
            title: "Creature",
            description:
                "Flexible creature rig for non-human characters.",
        },
        {
            id: "custom",
            title: "Custom",
            description:
                "Create a skeleton using your own bone structure.",
        },
    ];

    return (
        <div>
            <StepTitle
                title="Choose Rig Type"
                description="Select the skeleton structure that best matches your model."
            />

            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "repeat(3, 1fr)",
                    gap:
                        "10px",
                    marginTop:
                        "20px",
                }}
            >
                {types.map(
                    (type) => {
                        const selected =
                            rigType ===
                            type.id;

                        return (
                            <button
                                key={
                                    type.id
                                }
                                type="button"
                                onClick={() =>
                                    setRigType(
                                        type.id
                                    )
                                }
                                style={{
                                    minHeight:
                                        "150px",
                                    padding:
                                        "15px",
                                    textAlign:
                                        "left",
                                    background:
                                        selected
                                            ? "#34475a"
                                            : "#282828",
                                    borderColor:
                                        selected
                                            ? "#64809c"
                                            : "#3a3a3a",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize:
                                            "13px",
                                        fontWeight:
                                            "700",
                                        marginBottom:
                                            "8px",
                                    }}
                                >
                                    {
                                        type.title
                                    }
                                </div>

                                <div
                                    style={{
                                        color:
                                            selected
                                                ? "#c8d3de"
                                                : "#888",
                                        fontSize:
                                            "11px",
                                        lineHeight:
                                            "1.5",
                                    }}
                                >
                                    {
                                        type.description
                                    }
                                </div>
                            </button>
                        );
                    }
                )}
            </div>
        </div>
    );
}

function BoneStep({
    bones,
    onBoneChange,
    onAutoDetect,
}) {
    const assigned =
        bones.filter(
            (bone) =>
                bone.position
        ).length;

    return (
        <div>
            <StepTitle
                title="Set Up Bones"
                description="Assign the important bones of your character. Automatic detection can be used when available."
            />

            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "8px",
                    marginTop:
                        "15px",
                    marginBottom:
                        "12px",
                }}
            >
                <button
                    type="button"
                    onClick={
                        onAutoDetect
                    }
                >
                    Auto Detect Bones
                </button>

                <span
                    style={{
                        color:
                            "#777",
                        fontSize:
                            "10px",
                    }}
                >
                    {assigned} /{" "}
                    {
                        bones.length
                    }{" "}
                    assigned
                </span>
            </div>

            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "repeat(2, 1fr)",
                    gap:
                        "6px",
                }}
            >
                {bones.map(
                    (bone) => (
                        <BoneAssignment
                            key={
                                bone.id
                            }
                            bone={
                                bone
                            }
                            onChange={
                                onBoneChange
                            }
                        />
                    )
                )}
            </div>
        </div>
    );
}

function BoneAssignment({
    bone,
    onChange,
}) {
    const position =
        bone.position || {
            x: 0,
            y: 0,
            z: 0,
        };

    return (
        <div
            style={{
                padding:
                    "9px",
                background:
                    "#272727",
                border:
                    "1px solid #363636",
                borderRadius:
                    "4px",
            }}
        >
            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "space-between",
                    marginBottom:
                        "6px",
                }}
            >
                <span
                    style={{
                        fontSize:
                            "11px",
                        color:
                            "#ccc",
                    }}
                >
                    {bone.label}
                </span>

                {bone.required && (
                    <span
                        style={{
                            color:
                                "#777",
                            fontSize:
                                "9px",
                        }}
                    >
                        Required
                    </span>
                )}
            </div>

            <input
                value={
                    bone.source ||
                    ""
                }
                onChange={(
                    event
                ) =>
                    onChange(
                        bone.id,
                        "source",
                        event.target
                            .value
                    )
                }
                placeholder="Bone name / auto detected"
                style={{
                    width:
                        "100%",
                    boxSizing:
                        "border-box",
                    marginBottom:
                        "5px",
                }}
            />

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
                        <input
                            key={
                                axis
                            }
                            type="number"
                            value={
                                position[
                                    axis
                                ]
                            }
                            step="0.01"
                            onChange={(
                                event
                            ) => {
                                const next =
                                    {
                                        ...position,
                                        [axis]:
                                            Number(
                                                event
                                                    .target
                                                    .value
                                            ),
                                    };

                                onChange(
                                    bone.id,
                                    "position",
                                    next
                                );
                            }}
                            aria-label={`${bone.label} ${axis}`}
                        />
                    )
                )}
            </div>
        </div>
    );
}

function OptionsStep({
    autoDetect,
    setAutoDetect,
    autoWeight,
    setAutoWeight,
}) {
    return (
        <div>
            <StepTitle
                title="Rig Options"
                description="Choose how the rig should be generated."
            />

            <div
                style={{
                    display:
                        "flex",
                    flexDirection:
                        "column",
                    gap:
                        "8px",
                    marginTop:
                        "20px",
                }}
            >
                <Option
                    title="Automatic bone detection"
                    description="Try to match existing bones in the imported model to the selected rig."
                    value={
                        autoDetect
                    }
                    onChange={
                        setAutoDetect
                    }
                />

                <Option
                    title="Automatic weights"
                    description="Generate initial mesh weights for the new skeleton."
                    value={
                        autoWeight
                    }
                    onChange={
                        setAutoWeight
                    }
                />
            </div>
        </div>
    );
}

function Option({
    title,
    description,
    value,
    onChange,
}) {
    return (
        <button
            type="button"
            onClick={() =>
                onChange(
                    !value
                )
            }
            style={{
                display:
                    "flex",
                alignItems:
                    "center",
                gap:
                    "12px",
                width:
                    "100%",
                padding:
                    "13px",
                textAlign:
                    "left",
                background:
                    value
                        ? "#2e3e4d"
                        : "#282828",
                borderColor:
                    value
                        ? "#536d86"
                        : "#3a3a3a",
            }}
        >
            <span
                style={{
                    width:
                        "18px",
                    height:
                        "18px",
                    display:
                        "inline-flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "center",
                    flexShrink:
                        "0",
                    border:
                        "1px solid #555",
                    borderRadius:
                        "3px",
                    background:
                        value
                            ? "#58718a"
                            : "#202020",
                    color:
                        "#fff",
                    fontSize:
                        "11px",
                }}
            >
                {value
                    ? "✓"
                    : ""}
            </span>

            <span>
                <strong
                    style={{
                        display:
                            "block",
                        marginBottom:
                            "3px",
                        fontSize:
                            "11px",
                    }}
                >
                    {title}
                </strong>

                <span
                    style={{
                        display:
                            "block",
                        color:
                            "#888",
                        fontSize:
                            "10px",
                        lineHeight:
                            "1.4",
                    }}
                >
                    {
                        description
                    }
                </span>
            </span>
        </button>
    );
}

function FinishStep({
    rigType,
    bones,
    autoWeight,
}) {
    const assigned =
        bones.filter(
            (bone) =>
                bone.position
        ).length;

    return (
        <div>
            <StepTitle
                title="Ready to Create"
                description="Review the rig before creating it."
            />

            <div
                style={{
                    marginTop:
                        "20px",
                    padding:
                        "15px",
                    background:
                        "#282828",
                    border:
                        "1px solid #383838",
                    borderRadius:
                        "5px",
                }}
            >
                <SummaryRow
                    label="Rig Type"
                    value={
                        capitalize(
                            rigType
                        )
                    }
                />

                <SummaryRow
                    label="Bones"
                    value={`${assigned} / ${bones.length} assigned`}
                />

                <SummaryRow
                    label="Automatic Weights"
                    value={
                        autoWeight
                            ? "Enabled"
                            : "Disabled"
                    }
                />
            </div>

            <div
                style={{
                    marginTop:
                        "15px",
                    padding:
                        "12px",
                    background:
                        "#252d32",
                    border:
                        "1px solid #3b4a54",
                    borderRadius:
                        "4px",
                    color:
                        "#9eabb5",
                    fontSize:
                        "10px",
                    lineHeight:
                        "1.5",
                }}
            >
                Creating the rig will add
                a skeleton to the current
                project. You can continue
                editing the bones and
                animation after creation.
            </div>
        </div>
    );
}

function SummaryRow({
    label,
    value,
}) {
    return (
        <div
            style={{
                display:
                    "flex",
                justifyContent:
                    "space-between",
                gap:
                    "15px",
                padding:
                    "8px 0",
                borderBottom:
                    "1px solid #343434",
                fontSize:
                    "11px",
            }}
        >
            <span
                style={{
                    color:
                        "#777",
                }}
            >
                {label}
            </span>

            <span
                style={{
                    color:
                        "#ccc",
                }}
            >
                {value}
            </span>
        </div>
    );
}

function StepTitle({
    title,
    description,
}) {
    return (
        <div>
            <h2
                style={{
                    margin:
                        "0 0 6px",
                    fontSize:
                        "18px",
                    fontWeight:
                        "600",
                    color:
                        "#eee",
                }}
            >
                {title}
            </h2>

            <p
                style={{
                    margin:
                        "0",
                    color:
                        "#777",
                    fontSize:
                        "11px",
                    lineHeight:
                        "1.5",
                }}
            >
                {
                    description
                }
            </p>
        </div>
    );
}

function createInitialBones() {
    return [
        {
            id: "hips",
            label: "Hips",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "spine",
            label: "Spine",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "chest",
            label: "Chest",
            source: "",
            required: false,
            position: null,
        },
        {
            id: "neck",
            label: "Neck",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "head",
            label: "Head",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "leftShoulder",
            label: "Left Shoulder",
            source: "",
            required: false,
            position: null,
        },
        {
            id: "leftArm",
            label: "Left Upper Arm",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "leftForearm",
            label: "Left Forearm",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "leftHand",
            label: "Left Hand",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "rightShoulder",
            label: "Right Shoulder",
            source: "",
            required: false,
            position: null,
        },
        {
            id: "rightArm",
            label: "Right Upper Arm",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "rightForearm",
            label: "Right Forearm",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "rightHand",
            label: "Right Hand",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "leftUpLeg",
            label: "Left Thigh",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "leftLeg",
            label: "Left Shin",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "leftFoot",
            label: "Left Foot",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "rightUpLeg",
            label: "Right Thigh",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "rightLeg",
            label: "Right Shin",
            source: "",
            required: true,
            position: null,
        },
        {
            id: "rightFoot",
            label: "Right Foot",
            source: "",
            required: true,
            position: null,
        },
    ];
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
