import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
    document.body.innerHTML = `
        <div style="
            background:#151515;
            color:#ff7777;
            padding:30px;
            font-family:monospace;
            font-size:18px;
        ">
            3D Animator Error:
            #root element was not found.
        </div>
    `;

    throw new Error(
        "Root element (#root) was not found."
    );
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
