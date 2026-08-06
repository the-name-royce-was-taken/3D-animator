import { useEffect, useState } from "react";

type Tool =
  | "select"
  | "move"
  | "rotate"
  | "scale"
  | "rig";

export default function App() {
  const [tool, setTool] = useState<Tool>("select");
  const [projectName, setProjectName] = useState("Untitled Project");
  const [fps] = useState(60);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    document.title = `${projectName} - 3D Animator`;
  }, [projectName]);

  return (
    <div style={styles.app}>
      {/* Top Bar */}

      <header style={styles.topBar}>
        <div style={styles.logo}>3D Animator</div>

        <input
          style={styles.projectName}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          spellCheck={false}
        />

        <div style={styles.menu}>
          <button style={styles.button}>Import</button>
          <button style={styles.button}>Export</button>
          <button style={styles.button}>Save</button>
          <button style={styles.button}>Load</button>
        </div>
      </header>

      {/* Main */}

      <div style={styles.main}>
        {/* Toolbar */}

        <aside style={styles.toolbar}>
          <ToolButton
            name="Select"
            active={tool === "select"}
            onClick={() => setTool("select")}
          />

          <ToolButton
            name="Move"
            active={tool === "move"}
            onClick={() => setTool("move")}
          />

          <ToolButton
            name="Rotate"
            active={tool === "rotate"}
            onClick={() => setTool("rotate")}
          />

          <ToolButton
            name="Scale"
            active={tool === "scale"}
            onClick={() => setTool("scale")}
          />

          <ToolButton
            name="Rig"
            active={tool === "rig"}
            onClick={() => setTool("rig")}
          />
        </aside>

        {/* Viewport */}

        <main style={styles.viewport}>
          <div style={styles.viewportOverlay}>
            <h2 style={{ margin: 0 }}>Viewport</h2>

            <p style={{ marginTop: 8 }}>
              Three.js viewport will be connected here.
            </p>

            <p>
              Current Tool: <strong>{tool}</strong>
            </p>
          </div>
        </main>

        {/* Sidebar */}

        <aside style={styles.sidebar}>
          <h3 style={styles.heading}>Properties</h3>

          <div style={styles.section}>
            <strong>Scene</strong>

            <div>Objects: 0</div>
            <div>Bones: 0</div>
            <div>Animations: 0</div>
          </div>

          <div style={styles.section}>
            <strong>Playback</strong>

            <div>FPS: {fps}</div>
            <div>Frame: {frame}</div>
          </div>

          <button
            style={styles.button}
            onClick={() => setFrame(0)}
          >
            Reset Timeline
          </button>
        </aside>
      </div>

      {/* Timeline */}

      <footer style={styles.timeline}>
        <div style={styles.timelineControls}>
          <button
            style={styles.button}
            onClick={() => setFrame((f) => Math.max(0, f - 1))}
          >
            ◀
          </button>

          <button
            style={styles.button}
            onClick={() => setFrame((f) => f + 1)}
          >
            ▶
          </button>

          <span>
            Frame {frame}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={300}
          value={frame}
          onChange={(e) => setFrame(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </footer>
    </div>
  );
}

type ToolButtonProps = {
  name: string;
  active: boolean;
  onClick: () => void;
};

function ToolButton({
  name,
  active,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.toolButton,
        background: active ? "#3b82f6" : "#2a2a2a",
      }}
    >
      {name}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: "grid",
    gridTemplateRows: "52px 1fr 170px",
    width: "100vw",
    height: "100vh",
    background: "#1b1b1b",
    color: "#ffffff",
    overflow: "hidden",
    fontFamily: "Inter, sans-serif",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
    background: "#262626",
    borderBottom: "1px solid #333",
  },

  logo: {
    fontWeight: 700,
    fontSize: 18,
    whiteSpace: "nowrap",
  },

  projectName: {
    width: 250,
    padding: "6px 10px",
    background: "#1f1f1f",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: 6,
  },

  menu: {
    marginLeft: "auto",
    display: "flex",
    gap: 8,
  },

  main: {
    display: "grid",
    gridTemplateColumns: "70px 1fr 280px",
    overflow: "hidden",
  },

  toolbar: {
    background: "#232323",
    borderRight: "1px solid #333",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  viewport: {
    position: "relative",
    background:
      "linear-gradient(#303030,#1f1f1f)",
  },

  viewportOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 16,
    background: "#00000088",
    borderRadius: 8,
  },

  sidebar: {
    background: "#232323",
    borderLeft: "1px solid #333",
    padding: 16,
    overflowY: "auto",
  },

  heading: {
    marginTop: 0,
  },

  section: {
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  timeline: {
    background: "#202020",
    borderTop: "1px solid #333",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  timelineControls: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  button: {
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 6,
    padding: "7px 12px",
    cursor: "pointer",
  },

  toolButton: {
    color: "#fff",
    border: "1px solid #444",
    borderRadius: 6,
    padding: "12px 6px",
    cursor: "pointer",
    fontWeight: 600,
  },
};
