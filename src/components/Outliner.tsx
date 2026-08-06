interface OutlinerProps {
    objects?: string[];
    selectedObject?: string;
    onSelect?: (objectName: string) => void;
}

export default function Outliner({
    objects = [],
    selectedObject = "",
    onSelect,
}: OutlinerProps) {
    return (
        <div
            style={{
                width: "100%",
                color: "#fff",
            }}
        >
            <h3
                style={{
                    margin: "0 0 12px 0",
                    fontSize: 16,
                }}
            >
                Outliner
            </h3>

            {objects.length === 0 && (
                <div
                    style={{
                        padding: 10,
                        background: "#303030",
                        borderRadius: 5,
                        color: "#aaa",
                    }}
                >
                    No objects in scene
                </div>
            )}

            {objects.map((object) => (
                <button
                    key={object}
                    onClick={() =>
                        onSelect?.(object)
                    }
                    style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        marginBottom: 5,
                        background:
                            selectedObject === object
                                ? "#3b82f6"
                                : "#303030",
                        color: "#fff",
                        border: "1px solid #444",
                        borderRadius: 5,
                        cursor: "pointer",
                    }}
                >
                    {object}
                </button>
            ))}
        </div>
    );
}
