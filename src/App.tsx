import React from "react";

export default function App() {
    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                background: "#151515",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily:
                    "Arial, sans-serif",
            }}
        >
            <h1>
                3D Animator
            </h1>

            <p>
                React is working.
            </p>

            <p
                style={{
                    color: "#77ff99",
                    fontFamily:
                        "monospace",
                }}
            >
                APP_BOOT_OK
            </p>
        </div>
    );
}
