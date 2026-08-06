import type { EditorTool } from "../App";

interface ToolbarProps {
    activeTool?: EditorTool;
    onToolChange?: (tool: EditorTool) => void;
    onImport?: () => void;
    onSave?: () => void;
    onLoad?: () => void;
    onExport?: () => void;
}

const tools: {
    id: EditorTool;
    name: string;
    icon: string;
}[] = [
    {
        id: "select",
        name: "Select",
        icon: "↖",
    },
    {
        id: "move",
        name: "Move",
        icon: "✥",
    },
    {
        id: "rotate",
        name: "Rotate",
        icon: "⟳",
    },
    {
        id: "scale",
        name: "Scale",
        icon: "□",
    },
    {
        id: "rig",
        name: "Rig",
        icon: "🦴",
    },
];

export default function Toolbar({
    activeTool = "select",
    onToolChange,
    onImport,
    onSave,
    onLoad,
    onExport,
}: ToolbarProps) {
    return (
        <div
            style={{
                height: "100%",
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 12px",
                background: "#242424",
                borderBottom: "1px solid #333",
                color: "#fff",
            }}
        >
            <div
                style={{
                    fontWeight: 700,
                    fontSize: 18,
                    marginRight: 20,
                }}
            >
                3D Animator
            </div>

            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() =>
                        onToolChange?.(tool.id)
                    }
                    title={tool.name}
                    style={{
                        ...buttonStyle,
                        background:
                            activeTool === tool.id
                                ? "#3b82f6"
                                : "#333",
                    }}
                >
                    {tool.icon}
                    {" "}
                    {tool.name}
                </button>
            ))}

            <div
                style={{
                    flex: 1,
                }}
            />

            <button
                onClick={onImport}
                style={buttonStyle}
            >
                Import
            </button>

            <button
                onClick={onSave}
                style={buttonStyle}
            >
                Save
            </button>

            <button
                onClick={onLoad}
                style={buttonStyle}
            >
                Load
            </button>

            <button
                onClick={onExport}
                style={buttonStyle}
            >
                Export
            </button>
        </div>
    );
}

const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "7px 12px",
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 14,
};
