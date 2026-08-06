import { useState } from "react";

interface TimelineProps {
    currentFrame?: number;
    totalFrames?: number;
    fps?: number;
    playing?: boolean;
    onFrameChange?: (frame: number) => void;
    onPlayChange?: (playing: boolean) => void;
}

export default function Timeline({
    currentFrame = 0,
    totalFrames = 300,
    fps = 60,
    playing = false,
    onFrameChange,
    onPlayChange,
}: TimelineProps) {
    const [zoom, setZoom] = useState(1);

    function previousFrame() {
        const frame = Math.max(0, currentFrame - 1);
        onFrameChange?.(frame);
    }

    function nextFrame() {
        const frame = Math.min(totalFrames, currentFrame + 1);
        onFrameChange?.(frame);
    }

    function togglePlay() {
        onPlayChange?.(!playing);
    }

    return (
        <div
            style={{
                height: "100%",
                width: "100%",
                background: "#202020",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                borderTop: "1px solid #333",
                userSelect: "none",
            }}
        >
            <div
                style={{
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 12px",
                    background: "#262626",
                }}
            >
                <button
                    onClick={previousFrame}
                    style={buttonStyle}
                >
                    ◀
                </button>

                <button
                    onClick={togglePlay}
                    style={buttonStyle}
                >
                    {playing ? "Pause" : "Play"}
                </button>

                <button
                    onClick={nextFrame}
                    style={buttonStyle}
                >
                    ▶
                </button>

                <span>
                    Frame {currentFrame}/{totalFrames}
                </span>

                <span>
                    {fps} FPS
                </span>

                <label
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    Zoom

                    <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(event) =>
                            setZoom(
                                Number(event.target.value)
                            )
                        }
                    />
                </label>
            </div>

            <div
                style={{
                    flex: 1,
                    position: "relative",
                    overflow: "hidden",
                    background: "#181818",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformOrigin: "left top",
                        transform: `scaleX(${zoom})`,
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${totalFrames}px`,
                            position: "relative",
                            backgroundImage:
                                "linear-gradient(90deg, #333 1px, transparent 1px)",
                            backgroundSize: "10px 100%",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: `${currentFrame}px`,
                                height: "100%",
                                width: 2,
                                background: "#ff4444",
                            }}
                        />

                        <div
                            style={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                color: "#aaa",
                            }}
                        >
                            Timeline
                        </div>
                    </div>
                </div>

                <input
                    type="range"
                    min="0"
                    max={totalFrames}
                    value={currentFrame}
                    onChange={(event) =>
                        onFrameChange?.(
                            Number(event.target.value)
                        )
                    }
                    style={{
                        position: "absolute",
                        left: 10,
                        right: 10,
                        bottom: 10,
                        width: "calc(100% - 20px)",
                    }}
                />
            </div>
        </div>
    );
}

const buttonStyle: React.CSSProperties = {
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 4,
    padding: "5px 12px",
    cursor: "pointer",
};
