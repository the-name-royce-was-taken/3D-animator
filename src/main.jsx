import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import "./styles/app.css";
import "./styles/viewport.css";
import "./styles/timeline.css";
import "./styles/ui.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
    document.body.innerHTML = `
        <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#151515;
            color:#ff7777;
            font-family:Arial,Helvetica,sans-serif;
            padding:24px;
            text-align:center;
        ">
            <div>
                <h1>3D Animator</h1>
                <p>Application startup failed.</p>
                <p style="font-family:monospace;">
                    Root element #root was not found.
                </p>
            </div>
        </div>
    `;

    throw new Error("Root element (#root) was not found.");
}

createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
