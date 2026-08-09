import {
    useEffect,
    useState,
} from "react";

export default function StatusBar({
    message = "Ready",
    selectedObject = null,
    objectCount = 0,
    currentFrame = 0,
    totalFrames = 120,
    fps = 30,
    mode = "Object Mode",
    isPlaying = false,
    onFrameChange = () => {},
    onModeChange = () => {},
}) {
    const [localMessage, setLocalMessage] =
        useState(message);

    useEffect(() => {
        setLocalMessage(message);
    }, [message]);

    useEffect(() => {
        if (!message) {
            return;
        }

        const timer =
            window.setTimeout(() => {
                setLocalMessage(
                    "Ready"
                );
            }, 5000);

        return () =>
            window.clearTimeout(
                timer
            );
    }, [message]);

    const safeFrame =
        Number.isFinite(
            Number(currentFrame)
        )
            ? Number(currentFrame)
            : 0;

    const safeTotal =
        Number.isFinite(
            Number(totalFrames)
        )
            ? Math.max(
                  1,
                  Number(totalFrames)
              )
            : 120;

    const safeFps =
        Number.isFinite(
            Number(fps)
        )
            ? Number(fps)
            : 30;

    const handleFrameInput =
        (event) => {
            const value =
                Number(
                    event.target
                        .value
                );

            if (
                !Number.isFinite(
                    value
                )
            ) {
                return;
            }

            const frame =
                Math.max(
                    0,
                    Math.min(
                        safeTotal,
                        Math.round(
                            value
                        )
                    )
                );

            onFrameChange(
                frame
            );
        };

    const handleModeChange =
        (event) => {
            onModeChange(
                event.target
                    .value
            );
        };

    return (
        <footer
            className="status-bar"
            style={{
                width:
                    "100%",
                minHeight:
                    "26px",
                display:
                    "flex",
                alignItems:
                    "center",
                gap:
                    "10px",
                padding:
                    "3px 8px",
                boxSizing:
                    "border-box",
                background:
                    "#202020",
                borderTop:
                    "1px solid #333",
                color:
                    "#999",
                fontSize:
                    "10px",
                fontFamily:
                    "Arial, sans-serif",
                userSelect:
                    "none",
                overflow:
                    "hidden",
            }}
        >
            <div
                style={{
                    minWidth:
                        "130px",
                    maxWidth:
                        "260px",
                    overflow:
                        "hidden",
                    textOverflow:
                        "ellipsis",
                    whiteSpace:
                        "nowrap",
                    color:
                        localMessage ===
                        "Ready"
                            ? "#777"
                            : "#bbb",
                }}
                title={
                    localMessage
                }
            >
                {localMessage}
            </div>

            <div
                style={{
                    width:
                        "1px",
                    height:
                        "16px",
                    background:
                        "#383838",
                    flexShrink:
                        "0",
                }}
            />

            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "5px",
                    whiteSpace:
                        "nowrap",
                }}
            >
                <span
                    style={{
                        color:
                            "#666",
                    }}
                >
                    Mode
                </span>

                <select
                    value={
                        mode
                    }
                    onChange={
                        handleModeChange
                    }
                    style={{
                        height:
                            "20px",
                        padding:
                            "1px 4px",
                        fontSize:
                            "10px",
                    }}
                >
                    <option>
                        Object Mode
                    </option>

                    <option>
                        Pose Mode
                    </option>

                    <option>
                        Edit Mode
                    </option>

                    <option>
                        Weight Paint
                    </option>
                </select>
            </div>

            <div
                style={{
                    width:
                        "1px",
                    height:
                        "16px",
                    background:
                        "#383838",
                    flexShrink:
                        "0",
                }}
            />

            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "5px",
                    whiteSpace:
                        "nowrap",
                }}
            >
                <span
                    style={{
                        color:
                            "#666",
                    }}
                >
                    Frame
                </span>

                <input
                    type="number"
                    min="0"
                    max={
                        safeTotal
                    }
                    step="1"
                    value={
                        safeFrame
                    }
                    onChange={
                        handleFrameInput
                    }
                    style={{
                        width:
                            "55px",
                        height:
                            "20px",
                        boxSizing:
                            "border-box",
                        padding:
                            "2px 4px",
                        fontSize:
                            "10px",
                    }}
                />

                <span
                    style={{
                        color:
                            "#555",
                    }}
                >
                    /
                </span>

                <span
                    style={{
                        color:
                            "#888",
                    }}
                >
                    {safeTotal}
                </span>
            </div>

            <div
                style={{
                    width:
                        "1px",
                    height:
                        "16px",
                    background:
                        "#383838",
                    flexShrink:
                        "0",
                }}
            />

            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "5px",
                    whiteSpace:
                        "nowrap",
                }}
            >
                <span
                    style={{
                        color:
                            "#666",
                    }}
                >
                    FPS
                </span>

                <span
                    style={{
                        color:
                            "#aaa",
                        fontFamily:
                            "monospace",
                    }}
                >
                    {safeFps.toFixed(
                        0
                    )}
                </span>
            </div>

            <div
                style={{
                    width:
                        "1px",
                    height:
                        "16px",
                    background:
                        "#383838",
                    flexShrink:
                        "0",
                }}
            />

            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "5px",
                    whiteSpace:
                        "nowrap",
                }}
            >
                <span
                    style={{
                        color:
                            "#666",
                    }}
                >
                    Objects
                </span>

                <span
                    style={{
                        color:
                            "#aaa",
                    }}
                >
                    {objectCount}
                </span>
            </div>

            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "5px",
                    minWidth:
                        "0",
                    marginLeft:
                        "auto",
                    whiteSpace:
                        "nowrap",
                }}
            >
                {selectedObject ? (
                    <>
                        <span
                            style={{
                                color:
                                    "#666",
                            }}
                        >
                            Selected
                        </span>

                        <span
                            style={{
                                maxWidth:
                                    "150px",
                                overflow:
                                    "hidden",
                                textOverflow:
                                    "ellipsis",
                                color:
                                    "#aaa",
                            }}
                            title={
                                selectedObject.name ||
                                "Object"
                            }
                        >
                            {selectedObject.name ||
                                "Object"}
                        </span>
                    </>
                ) : (
                    <span
                        style={{
                            color:
                                "#555",
                        }}
                    >
                        Nothing selected
                    </span>
                )}
            </div>

            <div
                style={{
                    width:
                        "1px",
                    height:
                        "16px",
                    background:
                        "#383838",
                    flexShrink:
                        "0",
                }}
            />

            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "5px",
                    whiteSpace:
                        "nowrap",
                }}
            >
                <span
                    style={{
                        display:
                            "inline-block",
                        width:
                            "7px",
                        height:
                            "7px",
                        borderRadius:
                            "50%",
                        background:
                            isPlaying
                                ? "#7aa66a"
                                : "#555",
                    }}
                />

                <span
                    style={{
                        color:
                            isPlaying
                                ? "#aaa"
                                : "#666",
                    }}
                >
                    {isPlaying
                        ? "Playing"
                        : "Paused"}
                </span>
            </div>
        </footer>
    );
}
