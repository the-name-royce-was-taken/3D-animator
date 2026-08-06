interface StatusBarProps {
    fps?: number;
    objects?: number;
    bones?: number;
    animations?: number;
    message?: string;
}

export default function StatusBar({
    fps = 60,
    objects = 0,
    bones = 0,
    animations = 0,
    message = "Ready",
}: StatusBarProps) {
    return (
        <footer
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "0 12px",
                background: "#1d1d1d",
                color: "#ccc",
                borderTop: "1px solid #333",
                fontSize: 13,
            }}
        >
            <span>
                {message}
            </span>

            <span>
                FPS: {fps}
            </span>

            <span>
                Objects: {objects}
            </span>

            <span>
                Bones: {bones}
            </span>

            <span>
                Animations: {animations}
            </span>
        </footer>
    );
}
