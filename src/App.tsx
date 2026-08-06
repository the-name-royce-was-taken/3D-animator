import React from "react";

import "./styles/app.css";

export default function App() {
    return (
        <div className="app">
            <div className="app-header">
                <div className="app-title">
                    3D Animator
                </div>
            </div>

            <div className="app-main">
                <div
                    className="app-center"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                    }}
                >
                    3D Animator Loaded
                </div>
            </div>
        </div>
    );
}
