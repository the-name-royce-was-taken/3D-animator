import { useState } from "react";

interface RigWizardProps {
    open: boolean;
    onClose?: () => void;
    onCreateRig?: (type: RigType) => void;
}

type RigType =
    | "humanoid"
    | "creature"
    | "custom";

const rigOptions: {
    id: RigType;
    name: string;
    description: string;
}[] = [
    {
        id: "humanoid",
        name: "Humanoid",
        description:
            "Standard character skeleton with arms, legs, spine, and head.",
    },
    {
        id: "creature",
        name: "Creature",
        description:
            "Flexible skeleton for animals and non-human characters.",
    },
    {
        id: "custom",
        name: "Custom",
        description:
            "Create a custom skeleton manually.",
    },
];

export default function RigWizard({
    open,
    onClose,
    onCreateRig,
}: RigWizardProps) {
    const [selected, setSelected] =
        useState<RigType>("humanoid");

    if (!open) {
        return null;
    }

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background:
                    "rgba(0,0,0,0.65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    width: 420,
                    background: "#242424",
                    color: "#fff",
                    border:
                        "1px solid #444",
                    borderRadius: 8,
                    padding: 20,
                    boxShadow:
                        "0 10px 30px rgba(0,0,0,0.5)",
                }}
            >
                <h2
                    style={{
                        marginTop: 0,
                    }}
                >
                    Create Skeleton
                </h2>

                <p
                    style={{
                        color: "#aaa",
                    }}
                >
                    No rig was detected. Choose
                    a skeleton type.
                </p>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        marginTop: 15,
                    }}
                >
                    {rigOptions.map((rig) => (
                        <button
                            key={rig.id}
                            onClick={() =>
                                setSelected(
                                    rig.id
                                )
                            }
                            style={{
                                textAlign:
                                    "left",
                                padding: 12,
                                background:
                                    selected ===
                                    rig.id
                                        ? "#3b82f6"
                                        : "#303030",
                                color: "#fff",
                                border:
                                    "1px solid #555",
                                borderRadius: 6,
                                cursor:
                                    "pointer",
                            }}
                        >
                            <strong>
                                {rig.name}
                            </strong>

                            <div
                                style={{
                                    fontSize: 13,
                                    marginTop: 4,
                                    color:
                                        selected ===
                                        rig.id
                                            ? "#fff"
                                            : "#aaa",
                                }}
                            >
                                {
                                    rig.description
                                }
                            </div>
                        </button>
                    ))}
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "flex-end",
                        gap: 10,
                        marginTop: 20,
                    }}
                >
                    <button
                        onClick={onClose}
                        style={buttonStyle}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => {
                            onCreateRig?.(
                                selected
                            );
                            onClose?.();
                        }}
                        style={{
                            ...buttonStyle,
                            background:
                                "#3b82f6",
                        }}
                    >
                        Create Rig
                    </button>
                </div>
            </div>
        </div>
    );
}

const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 5,
    cursor: "pointer",
};
