import {
    useEffect,
    useRef,
    useState,
} from "react";

export default function Timeline({
    currentFrame = 0,
    totalFrames = 300,
    fps = 60,
    playing = false,
    onFrameChange = () => {},
    onPlayingChange = () => {},
    onStatusChange = () => {},
}) {
    const [zoom, setZoom] = useState(1);
    const [scrollLeft, setScrollLeft] =
        useState(0);

    const timelineRef = useRef(null);
    const frameInputRef = useRef(null);

    useEffect(() => {
        if (!playing) {
            return undefined;
        }

        const interval =
            window.setInterval(() => {
                const nextFrame =
                    currentFrame + 1;

                if (
                    nextFrame >=
                    totalFrames
                ) {
                    onFrameChange(0);
                } else {
                    onFrameChange(
                        nextFrame
                    );
                }
            }, 1000 / Math.max(fps, 1));

        return () => {
            window.clearInterval(
                interval
            );
        };
    }, [
        playing,
        currentFrame,
        totalFrames,
        fps,
        onFrameChange,
    ]);

    const frameWidth =
        10 * zoom;

    const timelineWidth =
        Math.max(
            1000,
            totalFrames *
                frameWidth
        );

    const setFrame = (value) => {
        const numeric =
            Number(value);

        if (
            !Number.isFinite(
                numeric
            )
        ) {
            return;
        }

        const frame =
            Math.min(
                Math.max(
                    Math.round(
                        numeric
                    ),
                    0
                ),
                totalFrames - 1
            );

        onFrameChange(frame);
    };

    const previousFrame = () => {
        setFrame(
            currentFrame - 1
        );
    };

    const nextFrame = () => {
        setFrame(
            currentFrame + 1
        );
    };

    const firstFrame = () => {
        setFrame(0);
    };

    const lastFrame = () => {
        setFrame(
            totalFrames - 1
        );
    };

    const togglePlayback = () => {
        onPlayingChange(
            !playing
        );

        onStatusChange(
            playing
                ? "Playback stopped"
                : "Playback started"
        );
    };

    const handleTimelineClick =
        (event) => {
            const element =
                timelineRef.current;

            if (!element) {
                return;
            }

            const rect =
                element.getBoundingClientRect();

            const x =
                event.clientX -
                rect.left +
                element.scrollLeft;

            const frame =
                Math.round(
                    x / frameWidth
                );

            setFrame(frame);
        };

    const handleWheel =
        (event) => {
            if (
                event.ctrlKey ||
                event.metaKey
            ) {
                event.preventDefault();

                const amount =
                    event.deltaY > 0
                        ? -0.1
                        : 0.1;

                setZoom(
                    (value) =>
                        Math.min(
                            4,
                            Math.max(
                                0.25,
                                value +
                                    amount
                            )
                        )
                );

                return;
            }

            const element =
                timelineRef.current;

            if (!element) {
                return;
            }

            if (
                Math.abs(
                    event.deltaX
                ) <
                Math.abs(
                    event.deltaY
                )
            ) {
                element.scrollLeft +=
                    event.deltaY;
            }
        };

    const handleScroll =
        (event) => {
            setScrollLeft(
                event.currentTarget
                    .scrollLeft
            );
        };

    const jumpToFrame = () => {
        const value =
            frameInputRef.current
                ?.value;

        setFrame(value);
    };

    const markers = [];

    for (
        let frame = 0;
        frame < totalFrames;
        frame += getMarkerInterval(
            zoom
        )
    ) {
        markers.push(frame);
    }

    const keyframes = [
        0,
        30,
        60,
        90,
        120,
        150,
        180,
        210,
        240,
        270,
    ].filter(
        (frame) =>
            frame <
            totalFrames
    );

    return (
        <section
            className="timeline-panel"
            style={{
                width: "100%",
                height: "100%",
                minHeight:
                    "190px",
                display:
                    "flex",
                flexDirection:
                    "column",
                background:
                    "#181818",
                color:
                    "#ddd",
                overflow:
                    "hidden",
                borderTop:
                    "1px solid #333",
            }}
        >
            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap: "6px",
                    minHeight:
                        "44px",
                    padding:
                        "6px 8px",
                    borderBottom:
                        "1px solid #333",
                    background:
                        "#202020",
                }}
            >
                <button
                    type="button"
                    onClick={
                        firstFrame
                    }
                    title="First frame"
                >
                    |&lt;
                </button>

                <button
                    type="button"
                    onClick={
                        previousFrame
                    }
                    title="Previous frame"
                >
                    &lt;
                </button>

                <button
                    type="button"
                    onClick={
                        togglePlayback
                    }
                    style={{
                        minWidth:
                            "62px",
                    }}
                >
                    {playing
                        ? "Pause"
                        : "Play"}
                </button>

                <button
                    type="button"
                    onClick={
                        nextFrame
                    }
                    title="Next frame"
                >
                    &gt;
                </button>

                <button
                    type="button"
                    onClick={
                        lastFrame
                    }
                    title="Last frame"
                >
                    &gt;|
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setFrame(
                            0
                        )
                    }
                >
                    Stop
                </button>

                <div
                    style={{
                        width:
                            "1px",
                        height:
                            "24px",
                        background:
                            "#444",
                        margin:
                            "0 4px",
                    }}
                />

                <label
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap: "5px",
                        fontSize:
                            "12px",
                    }}
                >
                    Frame
                    <input
                        ref={
                            frameInputRef
                        }
                        type="number"
                        defaultValue={
                            currentFrame
                        }
                        min="0"
                        max={
                            totalFrames -
                            1
                        }
                        onKeyDown={(
                            event
                        ) => {
                            if (
                                event.key ===
                                "Enter"
                            ) {
                                jumpToFrame();
                            }
                        }}
                        style={{
                            width:
                                "70px",
                        }}
                    />
                </label>

                <span
                    style={{
                        color:
                            "#777",
                        fontSize:
                            "12px",
                    }}
                >
                    /
                </span>

                <span
                    style={{
                        fontFamily:
                            "monospace",
                        fontSize:
                            "12px",
                    }}
                >
                    {totalFrames -
                        1}
                </span>

                <label
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap: "5px",
                        marginLeft:
                            "10px",
                        fontSize:
                            "12px",
                    }}
                >
                    FPS
                    <input
                        type="number"
                        value={fps}
                        min="1"
                        max="240"
                        readOnly
                        style={{
                            width:
                                "55px",
                        }}
                    />
                </label>

                <div
                    style={{
                        marginLeft:
                            "auto",
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap: "5px",
                    }}
                >
                    <button
                        type="button"
                        onClick={() =>
                            setZoom(
                                (value) =>
                                    Math.max(
                                        0.25,
                                        value -
                                            0.25
                                    )
                            )
                        }
                    >
                        −
                    </button>

                    <span
                        style={{
                            minWidth:
                                "42px",
                            textAlign:
                                "center",
                            fontSize:
                                "11px",
                            fontFamily:
                                "monospace",
                        }}
                    >
                        {Math.round(
                            zoom * 100
                        )}
                        %
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setZoom(
                                (value) =>
                                    Math.min(
                                        4,
                                        value +
                                            0.25
                                    )
                            )
                        }
                    >
                        +
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setZoom(1)
                        }
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "180px minmax(0, 1fr)",
                    flex: 1,
                    minHeight:
                        "0",
                }}
            >
                <div
                    style={{
                        background:
                            "#1c1c1c",
                        borderRight:
                            "1px solid #333",
                        overflow:
                            "hidden",
                    }}
                >
                    <div
                        style={{
                            height:
                                "34px",
                            display:
                                "flex",
                            alignItems:
                                "center",
                            padding:
                                "0 10px",
                            borderBottom:
                                "1px solid #333",
                            background:
                                "#242424",
                            fontSize:
                                "11px",
                            fontWeight:
                                "bold",
                            textTransform:
                                "uppercase",
                            letterSpacing:
                                "0.06em",
                        }}
                    >
                        Tracks
                    </div>

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
                            borderBottom:
                                "1px solid #292929",
                            fontSize:
                                "12px",
                        }}
                    >
                        Scene
                    </div>

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
                            borderBottom:
                                "1px solid #292929",
                            fontSize:
                                "12px",
                        }}
                    >
                        Transform
                    </div>

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
                            fontSize:
                                "12px",
                        }}
                    >
                        Pose
                    </div>
                </div>

                <div
                    ref={
                        timelineRef
                    }
                    onClick={
                        handleTimelineClick
                    }
                    onWheel={
                        handleWheel
                    }
                    onScroll={
                        handleScroll
                    }
                    style={{
                        position:
                            "relative",
                        overflow:
                            "auto",
                        background:
                            "#151515",
                        cursor:
                            "crosshair",
                    }}
                >
                    <div
                        style={{
                            position:
                                "relative",
                            width:
                                `${timelineWidth}px`,
                            minWidth:
                                "100%",
                            height:
                                "100%",
                        }}
                    >
                        <div
                            style={{
                                position:
                                    "sticky",
                                top: 0,
                                zIndex: 4,
                                height:
                                    "34px",
                                background:
                                    "#202020",
                                borderBottom:
                                    "1px solid #333",
                            }}
                        >
                            {markers.map(
                                (
                                    frame
                                ) => (
                                    <div
                                        key={
                                            frame
                                        }
                                        style={{
                                            position:
                                                "absolute",
                                            left:
                                                `${
                                                    frame *
                                                    frameWidth
                                                }px`,
                                            top: 0,
                                            height:
                                                "100%",
                                            borderLeft:
                                                frame %
                                                    getMarkerInterval(
                                                        zoom
                                                    ) ===
                                                0
                                                    ? "1px solid #444"
                                                    : "1px solid #292929",
                                            pointerEvents:
                                                "none",
                                        }}
                                    >
                                        <span
                                            style={{
                                                position:
                                                    "absolute",
                                                top:
                                                    "9px",
                                                left:
                                                    "4px",
                                                color:
                                                    "#777",
                                                fontSize:
                                                    "10px",
                                                fontFamily:
                                                    "monospace",
                                            }}
                                        >
                                            {
                                                frame
                                            }
                                        </span>
                                    </div>
                                )
                            )}
                        </div>

                        {[0, 1, 2].map(
                            (
                                track
                            ) => (
                                <div
                                    key={
                                        track
                                    }
                                    style={{
                                        position:
                                            "relative",
                                        height:
                                            "38px",
                                        borderBottom:
                                            "1px solid #292929",
                                        background:
                                            track %
                                                2 ===
                                            0
                                                ? "#181818"
                                                : "#161616",
                                    }}
                                >
                                    {markers.map(
                                        (
                                            frame
                                        ) => (
                                            <div
                                                key={
                                                    frame
                                                }
                                                style={{
                                                    position:
                                                        "absolute",
                                                    top: 0,
                                                    bottom: 0,
                                                    left:
                                                        `${
                                                            frame *
                                                            frameWidth
                                                        }px`,
                                                    borderLeft:
                                                        "1px solid #242424",
                                                    pointerEvents:
                                                        "none",
                                                }}
                                            />
                                        )
                                    )}

                                    {track ===
                                        0 &&
                                        keyframes.map(
                                            (
                                                frame
                                            ) => (
                                                <button
                                                    key={
                                                        frame
                                                    }
                                                    type="button"
                                                    title={`Keyframe ${frame}`}
                                                    onClick={(
                                                        event
                                                    ) => {
                                                        event.stopPropagation();
                                                        setFrame(
                                                            frame
                                                        );
                                                    }}
                                                    style={{
                                                        position:
                                                            "absolute",
                                                        left:
                                                            `${
                                                                frame *
                                                                    frameWidth -
                                                                5
                                                            }px`,
                                                        top:
                                                            "13px",
                                                        width:
                                                            "10px",
                                                        height:
                                                            "10px",
                                                        padding:
                                                            0,
                                                        border:
                                                            "none",
                                                        background:
                                                            "#ddd",
                                                        transform:
                                                            "rotate(45deg)",
                                                        cursor:
                                                            "pointer",
                                                    }}
                                                />
                                            )
                                        )}

                                    {track ===
                                        1 &&
                                        keyframes
                                            .filter(
                                                (
                                                    frame
                                                ) =>
                                                    frame %
                                                        60 ===
                                                    0
                                            )
                                            .map(
                                                (
                                                    frame
                                                ) => (
                                                    <button
                                                        key={
                                                            frame
                                                        }
                                                        type="button"
                                                        title={`Transform keyframe ${frame}`}
                                                        onClick={(
                                                            event
                                                        ) => {
                                                            event.stopPropagation();
                                                            setFrame(
                                                                frame
                                                            );
                                                        }}
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            left:
                                                                `${
                                                                    frame *
                                                                        frameWidth -
                                                                    5
                                                                }px`,
                                                            top:
                                                                "13px",
                                                            width:
                                                                "10px",
                                                            height:
                                                                "10px",
                                                            padding:
                                                                0,
                                                            border:
                                                                "none",
                                                            background:
                                                                "#999",
                                                            transform:
                                                                "rotate(45deg)",
                                                            cursor:
                                                                "pointer",
                                                        }}
                                                    />
                                                )
                                            )}
                                </div>
                            )
                        )}

                        <div
                            style={{
                                position:
                                    "absolute",
                                top: 0,
                                bottom: 0,
                                left:
                                    `${
                                        currentFrame *
                                        frameWidth
                                    }px`,
                                width:
                                    "2px",
                                background:
                                    "#ffffff",
                                zIndex: 8,
                                pointerEvents:
                                    "none",
                                boxShadow:
                                    "0 0 6px rgba(255,255,255,.5)",
                            }}
                        >
                            <div
                                style={{
                                    position:
                                        "absolute",
                                    top:
                                        "-1px",
                                    left:
                                        "-5px",
                                    width:
                                        "12px",
                                    height:
                                        "12px",
                                    background:
                                        "#fff",
                                    clipPath:
                                        "polygon(50% 100%, 0 0, 100% 0)",
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={{
                    minHeight:
                        "26px",
                    display:
                        "flex",
                    alignItems:
                        "center",
                    padding:
                        "0 8px",
                    gap:
                        "14px",
                    background:
                        "#202020",
                    borderTop:
                        "1px solid #333",
                    color:
                        "#888",
                    fontSize:
                        "10px",
                    fontFamily:
                        "monospace",
                }}
            >
                <span>
                    FRAME {currentFrame}
                </span>

                <span>
                    FPS {fps}
                </span>

                <span>
                    ZOOM{" "}
                    {Math.round(
                        zoom * 100
                    )}
                    %
                </span>

                <span>
                    SCROLL{" "}
                    {Math.round(
                        scrollLeft
                    )}
                </span>

                <span
                    style={{
                        marginLeft:
                            "auto",
                    }}
                >
                    {playing
                        ? "PLAYING"
                        : "PAUSED"}
                </span>
            </div>
        </section>
    );
}

function getMarkerInterval(
    zoom
) {
    if (zoom >= 2.5) {
        return 5;
    }

    if (zoom >= 1.5) {
        return 10;
    }

    if (zoom >= 0.75) {
        return 20;
    }

    return 40;
}
