import React, {
    useEffect,
    useState,
} from "react";

type LogEntry = {
    time: string;
    type: "INFO" | "OK" | "ERROR";
    message: string;
};

export default function App() {
    const [logs, setLogs] =
        useState<LogEntry[]>([]);

    const addLog = (
        type: LogEntry["type"],
        message: string
    ) => {
        const now =
            new Date()
                .toLocaleTimeString();

        setLogs((current) => [
            ...current,
            {
                time: now,
                type,
                message,
            },
        ]);
    };

    useEffect(() => {
        addLog(
            "OK",
            "React successfully mounted App.tsx"
        );

        addLog(
            "INFO",
            `Browser: ${navigator.userAgent}`
        );

        addLog(
            "INFO",
            `URL: ${window.location.href}`
        );

        addLog(
            "INFO",
            `Protocol: ${window.location.protocol}`
        );

        const root =
            document.getElementById(
                "root"
            );

        if (root) {
            addLog(
                "OK",
                "Root element #root exists"
            );
        } else {
            addLog(
                "ERROR",
                "Root element #root was NOT found"
            );
        }

        try {
            const canvas =
                document.createElement(
                    "canvas"
                );

            const gl =
                canvas.getContext(
                    "webgl"
                );

            if (gl) {
                addLog(
                    "OK",
                    "WebGL is available"
                );
            } else {
                addLog(
                    "ERROR",
                    "WebGL is NOT available"
                );
            }
        } catch (error) {
            addLog(
                "ERROR",
                `WebGL test failed: ${String(
                    error
                )}`
            );
        }

        try {
            const storage =
                window.localStorage;

            storage.setItem(
                "__3d_animator_test__",
                "ok"
            );

            storage.removeItem(
                "__3d_animator_test__"
            );

            addLog(
                "OK",
                "Local storage is available"
            );
        } catch (error) {
            addLog(
                "ERROR",
                `Local storage failed: ${String(
                    error
                )}`
            );
        }

        try {
            const blob =
                new Blob([
                    "3D Animator",
                ]);

            const url =
                URL.createObjectURL(
                    blob
                );

            URL.revokeObjectURL(
                url
            );

            addLog(
                "OK",
                "Browser file APIs are available"
            );
        } catch (error) {
            addLog(
                "ERROR",
                `File API test failed: ${String(
                    error
                )}`
            );
        }

        const favicon =
            document.querySelector(
                'link[rel="icon"]'
            );

        if (favicon) {
            const href =
                (
                    favicon as HTMLLinkElement
                ).href;

            addLog(
                "INFO",
                `Favicon configured: ${href}`
            );

            fetch(href)
                .then((response) => {
                    if (response.ok) {
                        addLog(
                            "OK",
                            "Favicon file loaded successfully"
                        );
                    } else {
                        addLog(
                            "ERROR",
                            `Favicon returned HTTP ${response.status}`
                        );
                    }
                })
                .catch((error) => {
                    addLog(
                        "ERROR",
                        `Favicon could not load: ${String(
                            error
                        )}`
                    );
                });
        } else {
            addLog(
                "ERROR",
                "No favicon <link> was found in index.html"
            );
        }

        addLog(
            "INFO",
            "Starting visual rendering test..."
        );

        const timer =
            window.setTimeout(() => {
                addLog(
                    "OK",
                    "App completed startup diagnostics"
                );
            }, 500);

        return () =>
            window.clearTimeout(
                timer
            );
    }, []);

    const errors =
        logs.filter(
            (log) =>
                log.type ===
                "ERROR"
        ).length;

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                background:
                    "#151515",
                color: "#fff",
                fontFamily:
                    "Arial, sans-serif",
                display: "flex",
                flexDirection:
                    "column",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    height: "52px",
                    minHeight: "52px",
                    background:
                        "#202020",
                    borderBottom:
                        "1px solid #444",
                    display: "flex",
                    alignItems:
                        "center",
                    padding:
                        "0 16px",
                    fontWeight:
                        "bold",
                    fontSize: "18px",
                }}
            >
                3D Animator
                <span
                    style={{
                        marginLeft:
                            "12px",
                        fontSize:
                            "12px",
                        fontWeight:
                            "normal",
                        color:
                            errors > 0
                                ? "#ff7777"
                                : "#77ff99",
                    }}
                >
                    {errors > 0
                        ? `${errors} error(s)`
                        : "Diagnostic mode"}
                </span>
            </div>

            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    padding: "12px",
                    overflow:
                        "auto",
                }}
            >
                <div
                    style={{
                        maxWidth:
                            "1200px",
                        margin:
                            "0 auto",
                    }}
                >
                    <div
                        style={{
                            background:
                                "#1d1d1d",
                            border:
                                "1px solid #444",
                            borderRadius:
                                "6px",
                            padding:
                                "12px",
                            marginBottom:
                                "12px",
                        }}
                    >
                        <div
                            style={{
                                fontSize:
                                    "14px",
                                fontWeight:
                                    "bold",
                                marginBottom:
                                    "8px",
                            }}
                        >
                            Startup Diagnostics
                        </div>

                        <div
                            style={{
                                color:
                                    "#aaa",
                                fontSize:
                                    "12px",
                            }}
                        >
                            These messages are generated
                            directly by the application.
                        </div>
                    </div>

                    <div
                        style={{
                            background:
                                "#090909",
                            border:
                                "1px solid #333",
                            borderRadius:
                                "6px",
                            padding:
                                "10px",
                            fontFamily:
                                "monospace",
                            fontSize:
                                "12px",
                        }}
                    >
                        {logs.length ===
                        0 ? (
                            <div
                                style={{
                                    color:
                                        "#aaa",
                                }}
                            >
                                Waiting for
                                application startup...
                            </div>
                        ) : (
                            logs.map(
                                (
                                    log,
                                    index
                                ) => (
                                    <div
                                        key={
                                            index
                                        }
                                        style={{
                                            padding:
                                                "4px 0",
                                            color:
                                                log.type ===
                                                "ERROR"
                                                    ? "#ff7777"
                                                    : log.type ===
                                                      "OK"
                                                    ? "#77ff99"
                                                    : "#cccccc",
                                        }}
                                    >
                                        [
                                        {
                                            log.time
                                        }] [
                                        {
                                            log.type
                                        }]{" "}
                                        {
                                            log.message
                                        }
                                    </div>
                                )
                            )
                        )}
                    </div>

                    <div
                        style={{
                            marginTop:
                                "12px",
                            background:
                                "#202020",
                            border:
                                "1px solid #444",
                            borderRadius:
                                "6px",
                            padding:
                                "20px",
                            textAlign:
                                "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize:
                                    "28px",
                                marginBottom:
                                    "8px",
                            }}
                        >
                            3D Animator
                        </div>

                        <div
                            style={{
                                color:
                                    "#999",
                            }}
                        >
                            Rendering test successful.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
