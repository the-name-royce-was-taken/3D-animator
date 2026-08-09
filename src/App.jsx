import { useEffect, useState } from "react";

const initialObjects = [
    {
        id: "camera",
        name: "Camera",
        type: "Camera",
    },
    {
        id: "light",
        name: "Key Light",
        type: "Light",
    },
];

const initialTimeline = {
    currentFrame: 0,
    totalFrames: 300,
    fps: 60,
    playing: false,
};

export default function App() {
    const [objects, setObjects] = useState(initialObjects);
    const [selectedId, setSelectedId] = useState("camera");
    const [timeline, setTimeline] =
        useState(initialTimeline);
    const [tool, setTool] = useState("select");
    const [status, setStatus] =
        useState("Ready");
    const [showRigWizard, setShowRigWizard] =
        useState(false);

    useEffect(() => {
        if (!timeline.playing) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            setTimeline((current) => {
                const next =
                    current.currentFrame + 1;

                if (next >= current.totalFrames) {
                    return {
                        ...current,
                        currentFrame: 0,
                    };
                }

                return {
                    ...current,
                    currentFrame: next,
                };
            });
        }, 1000 / timeline.fps);

        return () => {
            window.clearInterval(interval);
        };
    }, [
        timeline.playing,
        timeline.fps,
        timeline.totalFrames,
    ]);

    const selectedObject =
        objects.find(
            (object) =>
                object.id === selectedId
        ) || null;

    const addObject = () => {
        const id =
            `object-${Date.now()}`;

        const newObject = {
            id,
            name: `Object ${objects.length + 1}`,
            type: "Mesh",
        };

        setObjects((current) => [
            ...current,
            newObject,
        ]);

        setSelectedId(id);
        setStatus(
            `${newObject.name} added`
        );
    };

    const removeSelectedObject = () => {
        if (
            !selectedObject ||
            selectedObject.id === "camera" ||
            selectedObject.id === "light"
        ) {
            setStatus(
                "Select a mesh object to remove"
            );
            return;
        }

        setObjects((current) =>
            current.filter(
                (object) =>
                    object.id !== selectedId
            )
        );

        setSelectedId("camera");
        setStatus("Object removed");
    };

    const togglePlayback = () => {
        setTimeline((current) => ({
            ...current,
            playing: !current.playing,
        }));

        setStatus(
            timeline.playing
                ? "Playback stopped"
                : "Playback started"
        );
    };

    const resetTimeline = () => {
        setTimeline((current) => ({
            ...current,
            currentFrame: 0,
            playing: false,
        }));

        setStatus("Timeline reset");
    };

    const handleToolChange = (nextTool) => {
        setTool(nextTool);
        setStatus(
            `${nextTool} tool selected`
        );
    };

    const handleImport = () => {
        setStatus(
            "Import system is ready for model files"
        );
    };

    const handleSave = () => {
        const project = {
            name: "Untitled Project",
            objects,
            timeline,
            selectedId,
            tool,
        };

        try {
            window.localStorage.setItem(
                "3d-animator-project",
                JSON.stringify(project)
            );

            setStatus(
                "Project saved in browser storage"
            );
        } catch {
            setStatus(
                "Could not save project"
            );
        }
    };

    const handleRigWizard = () => {
        setShowRigWizard(true);
        setStatus("Rig wizard opened");
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="app-title">
                    3D Animator
                </div>

                <div
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        gap: "6px",
                    }}
                >
                    <button
                        type="button"
                        onClick={handleImport}
                    >
                        Import
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                    >
                        Save
                    </button>

                    <button
                        type="button"
                        onClick={handleRigWizard}
                    >
                        Rig
                    </button>
                </div>
            </header>

            <div className="app-main">
                <aside className="app-left">
                    <div className="panel">
                        <div className="panel-title">
                            Scene
                        </div>

                        {objects.map((object) => (
                            <button
                                key={object.id}
                                type="button"
                                onClick={() =>
                                    setSelectedId(
                                        object.id
                                    )
                                }
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    marginBottom:
                                        "4px",
                                    background:
                                        selectedId ===
                                        object.id
                                            ? "#444"
                                            : "#252525",
                                }}
                            >
                                {object.name}
                            </button>
                        ))}

                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                marginTop: "8px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={addObject}
                            >
                                Add
                            </button>

                            <button
                                type="button"
                                onClick={
                                    removeSelectedObject
                                }
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-title">
                            Tools
                        </div>

                        {[
                            "select",
                            "move",
                            "rotate",
                            "scale",
                        ].map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() =>
                                    handleToolChange(
                                        name
                                    )
                                }
                                style={{
                                    width: "100%",
                                    marginBottom:
                                        "4px",
                                    background:
                                        tool === name
                                            ? "#444"
                                            : "#252525",
                                }}
                            >
                                {name
                                    .charAt(0)
                                    .toUpperCase() +
                                    name.slice(1)}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="app-center">
                    <div className="viewport">
                        <div
                            style={{
                                position:
                                    "absolute",
                                inset: 0,
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                flexDirection:
                                    "column",
                                background:
                                    "radial-gradient(circle at center, #292929 0%, #111 70%)",
                            }}
                        >
                            <div
                                style={{
                                    fontSize:
                                        "28px",
                                    fontWeight:
                                        "bold",
                                    marginBottom:
                                        "8px",
                                }}
                            >
                                3D Viewport
                            </div>

                            <div
                                style={{
                                    color:
                                        "#999",
                                    fontSize:
                                        "13px",
                                }}
                            >
                                Scene ready
                            </div>

                            <div
                                style={{
                                    marginTop:
                                        "16px",
                                    padding:
                                        "8px 12px",
                                    background:
                                        "#222",
                                    border:
                                        "1px solid #444",
                                    borderRadius:
                                        "4px",
                                    fontFamily:
                                        "monospace",
                                    fontSize:
                                        "12px",
                                }}
                            >
                                Selected:{" "}
                                {selectedObject
                                    ? selectedObject.name
                                    : "None"}
                            </div>
                        </div>

                        <div className="viewport-overlay">
                            {tool.toUpperCase()} MODE
                        </div>

                        <div className="viewport-status">
                            {status}
                        </div>
                    </div>
                </main>

                <aside className="app-right">
                    <div className="panel">
                        <div className="panel-title">
                            Properties
                        </div>

                        {selectedObject ? (
                            <div
                                style={{
                                    display:
                                        "flex",
                                    flexDirection:
                                        "column",
                                    gap: "8px",
                                }}
                            >
                                <div>
                                    <span
                                        style={{
                                            color:
                                                "#888",
                                        }}
                                    >
                                        Name
                                    </span>
                                    <div>
                                        {
                                            selectedObject.name
                                        }
                                    </div>
                                </div>

                                <div>
                                    <span
                                        style={{
                                            color:
                                                "#888",
                                        }}
                                    >
                                        Type
                                    </span>
                                    <div>
                                        {
                                            selectedObject.type
                                        }
                                    </div>
                                </div>

                                <div>
                                    <span
                                        style={{
                                            color:
                                                "#888",
                                        }}
                                    >
                                        ID
                                    </span>
                                    <div
                                        style={{
                                            fontFamily:
                                                "monospace",
                                            fontSize:
                                                "11px",
                                        }}
                                    >
                                        {
                                            selectedObject.id
                                        }
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    color:
                                        "#888",
                                }}
                            >
                                Nothing selected
                            </div>
                        )}
                    </div>

                    <div className="panel">
                        <div className="panel-title">
                            Animation
                        </div>

                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "1fr 1fr",
                                gap: "6px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={
                                    togglePlayback
                                }
                            >
                                {timeline.playing
                                    ? "Pause"
                                    : "Play"}
                            </button>

                            <button
                                type="button"
                                onClick={
                                    resetTimeline
                                }
                            >
                                Reset
                            </button>
                        </div>

                        <div
                            style={{
                                marginTop:
                                    "10px",
                                fontFamily:
                                    "monospace",
                                fontSize:
                                    "12px",
                                color:
                                    "#aaa",
                            }}
                        >
                            Frame{" "}
                            {
                                timeline.currentFrame
                            }{" "}
                            /{" "}
                            {
                                timeline.totalFrames
                            }
                        </div>
                    </div>
                </aside>
            </div>

            <div className="app-bottom">
                <div className="timeline">
                    <div className="timeline-header">
                        <div className="timeline-controls">
                            <button
                                type="button"
                                onClick={
                                    togglePlayback
                                }
                            >
                                {timeline.playing
                                    ? "Pause"
                                    : "Play"}
                            </button>

                            <button
                                type="button"
                                onClick={
                                    resetTimeline
                                }
                            >
                                Stop
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setTimeline(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            currentFrame:
                                                Math.max(
                                                    0,
                                                    current.currentFrame -
                                                        1
                                                ),
                                        })
                                    )
                                }
                            >
                                Prev
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setTimeline(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            currentFrame:
                                                Math.min(
                                                    current.totalFrames -
                                                        1,
                                                    current.currentFrame +
                                                        1
                                                ),
                                        })
                                    )
                                }
                            >
                                Next
                            </button>
                        </div>

                        <div
                            style={{
                                marginLeft:
                                    "12px",
                                fontFamily:
                                    "monospace",
                                fontSize:
                                    "12px",
                                color:
                                    "#aaa",
                            }}
                        >
                            {timeline.currentFrame}
                            {" / "}
                            {timeline.totalFrames}
                            {" • "}
                            {timeline.fps}
                            {" FPS"}
                        </div>
                    </div>

                    <div className="timeline-body">
                        <div className="timeline-tracks">
                            <div className="timeline-track">
                                Scene
                            </div>

                            <div className="timeline-track">
                                {selectedObject
                                    ? selectedObject.name
                                    : "No selection"}
                            </div>
                        </div>

                        <div className="timeline-editor">
                            <div className="timeline-grid" />

                            <div
                                className="timeline-playhead"
                                style={{
                                    left: `${
                                        timeline.currentFrame *
                                        20
                                    }px`,
                                }}
                            />

                            <div
                                style={{
                                    position:
                                        "absolute",
                                    top: "8px",
                                    left: "8px",
                                    color:
                                        "#777",
                                    fontSize:
                                        "11px",
                                }}
                            >
                                Frame 0
                            </div>

                            <div
                                style={{
                                    position:
                                        "absolute",
                                    top: "8px",
                                    left: "208px",
                                    color:
                                        "#777",
                                    fontSize:
                                        "11px",
                                }}
                            >
                                Frame 10
                            </div>

                            <div
                                style={{
                                    position:
                                        "absolute",
                                    top: "8px",
                                    left: "408px",
                                    color:
                                        "#777",
                                    fontSize:
                                        "11px",
                                }}
                            >
                                Frame 20
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="ui-status">
                <span>
                    {status}
                </span>

                <span
                    style={{
                        marginLeft:
                            "auto",
                    }}
                >
                    {objects.length} objects
                    {" • "}
                    Frame{" "}
                    {timeline.currentFrame}
                </span>
            </footer>

            {showRigWizard && (
                <div
                    style={{
                        position:
                            "fixed",
                        inset: 0,
                        background:
                            "rgba(0,0,0,0.7)",
                        display:
                            "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            width:
                                "min(500px, 90vw)",
                            background:
                                "#1d1d1d",
                            border:
                                "1px solid #444",
                            borderRadius:
                                "8px",
                            padding:
                                "20px",
                            boxShadow:
                                "0 20px 60px rgba(0,0,0,0.5)",
                        }}
                    >
                        <h2
                            style={{
                                marginTop:
                                    0,
                            }}
                        >
                            Rig Wizard
                        </h2>

                        <p
                            style={{
                                color:
                                    "#aaa",
                            }}
                        >
                            Select a character model
                            in the viewport to begin
                            rigging.
                        </p>

                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "flex-end",
                                gap: "8px",
                                marginTop:
                                    "20px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setShowRigWizard(
                                        false
                                    )
                                }
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowRigWizard(
                                        false
                                    );
                                    setStatus(
                                        "Rig setup ready"
                                    );
                                }}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
