import { useState } from "react";

interface Transform {
    x: number;
    y: number;
    z: number;
}

interface PropertiesProps {
    selectedObject?: string;
    position?: Transform;
    rotation?: Transform;
    scale?: Transform;
    onTransformChange?: (
        type: "position" | "rotation" | "scale",
        axis: "x" | "y" | "z",
        value: number
    ) => void;
}

type TransformType =
    | "position"
    | "rotation"
    | "scale";

export default function Properties({
    selectedObject = "None",
    position = {
        x: 0,
        y: 0,
        z: 0,
    },
    rotation = {
        x: 0,
        y: 0,
        z: 0,
    },
    scale = {
        x: 1,
        y: 1,
        z: 1,
    },
    onTransformChange,
}: PropertiesProps) {
    const [active, setActive] =
        useState<TransformType>("position");

    const values =
        active === "position"
            ? position
            : active === "rotation"
              ? rotation
              : scale;

    return (
        <div
            style={{
                width: "100%",
                color: "#fff",
            }}
        >
            <h3
                style={{
                    marginTop: 0,
                    marginBottom: 12,
                    fontSize: 16,
                }}
            >
                Properties
            </h3>

            <div
                style={{
                    padding: 10,
                    background: "#303030",
                    borderRadius: 5,
                    marginBottom: 12,
                }}
            >
                Selected: {selectedObject}
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 5,
                    marginBottom: 12,
                }}
            >
                {(
                    [
                        "position",
                        "rotation",
                        "scale",
                    ] as TransformType[]
                ).map((type) => (
                    <button
                        key={type}
                        onClick={() =>
                            setActive(type)
                        }
                        style={{
                            flex: 1,
                            padding: 8,
                            background:
                                active === type
                                    ? "#3b82f6"
                                    : "#333",
                            color: "#fff",
                            border:
                                "1px solid #555",
                            borderRadius: 4,
                            cursor: "pointer",
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {(["x", "y", "z"] as const).map(
                (axis) => (
                    <div
                        key={axis}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                        }}
                    >
                        <label
                            style={{
                                width: 20,
                                textTransform:
                                    "uppercase",
                            }}
                        >
                            {axis}
                        </label>

                        <input
                            type="number"
                            value={values[axis]}
                            onChange={(event) =>
                                onTransformChange?.(
                                    active,
                                    axis,
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                            style={{
                                flex: 1,
                                background:
                                    "#202020",
                                color: "#fff",
                                border:
                                    "1px solid #555",
                                borderRadius: 4,
                                padding: 6,
                            }}
                        />
                    </div>
                )
            )}
        </div>
    );
}
