import { useState } from "react";

interface SidebarProps {
    objectCount?: number;
    boneCount?: number;
    animationCount?: number;
    selectedObject?: string;
}

type Panel =
    | "outliner"
    | "properties"
    | "rig";

export default function Sidebar({
    objectCount = 0,
    boneCount = 0,
    animationCount = 0,
    selectedObject = "None",
}: SidebarProps) {
    const [activePanel, setActivePanel] =
        useState<Panel>("outliner");

    return (
        <aside
            style={{
                height: "100%",
                width: "100%",
                background: "#242424",
                color: "#fff",
                borderLeft: "1px solid #333",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "flex",
                    borderBottom: "1px solid #333",
                }}
            >
                <PanelButton
                    label="Outliner"
                    active={
                        activePanel === "outliner"
                    }
                    onClick={() =>
                        setActivePanel("outliner")
                    }
                />

                <PanelButton
                    label="Properties"
                    active={
                        activePanel === "properties"
                    }
                    onClick={() =>
                        setActivePanel("properties")
                    }
                />

                <PanelButton
                    label="Rig"
                    active={
                        activePanel === "rig"
                    }
                    onClick={() =>
                        setActivePanel("rig")
                    }
                />
            </div>

            <div
                style={{
                    flex: 1,
                    padding: 12,
                    overflowY: "auto",
                }}
            >
                {activePanel === "outliner" && (
                    <section>
                        <h3 style={headingStyle}>
                            Scene
                        </h3>

                        <div style={itemStyle}>
                            Objects: {objectCount}
                        </div>

                        <div style={itemStyle}>
                            Selected: {selectedObject}
                        </div>
                    </section>
                )}

                {activePanel === "properties" && (
                    <section>
                        <h3 style={headingStyle}>
                            Properties
                        </h3>

                        <div style={itemStyle}>
                            Transform
                        </div>

                        <div style={itemStyle}>
                            Position
                        </div>

                        <div style={itemStyle}>
                            Rotation
                        </div>

                        <div style={itemStyle}>
                            Scale
                        </div>
                    </section>
                )}

                {activePanel === "rig" && (
                    <section>
                        <h3 style={headingStyle}>
                            Rig
                        </h3>

                        <div style={itemStyle}>
                            Bones: {boneCount}
                        </div>

                        <div style={itemStyle}>
                            Animations: {animationCount}
                        </div>

                        <button
                            style={buttonStyle}
                        >
                            Create Skeleton
                        </button>
                    </section>
                )}
            </div>
        </aside>
    );
}

interface PanelButtonProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

function PanelButton({
    label,
    active,
    onClick,
}: PanelButtonProps) {
    return (
        <button
            onClick={onClick}
            style={{
                flex: 1,
                padding: "10px 6px",
                background: active
                    ? "#3b82f6"
                    : "#2b2b2b",
                color: "#fff",
                border: "none",
                borderRight:
                    "1px solid #333",
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}

const headingStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 16,
};

const itemStyle: React.CSSProperties = {
    background: "#303030",
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
};

const buttonStyle: React.CSSProperties = {
    width: "100%",
    marginTop: 10,
    padding: 10,
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 5,
    cursor: "pointer",
};
