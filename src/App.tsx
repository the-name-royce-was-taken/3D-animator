import { useState } from "react";
import EditorLayout from "./components/EditorLayout";

export type EditorTool =
    | "select"
    | "move"
    | "rotate"
    | "scale"
    | "rig";

export interface EditorState {
    projectName: string;
    currentFrame: number;
    totalFrames: number;
    fps: number;
    activeTool: EditorTool;
    isPlaying: boolean;
}

export default function App() {
    const [editor, setEditor] = useState<EditorState>({
        projectName: "Untitled Project",
        currentFrame: 0,
        totalFrames: 300,
        fps: 60,
        activeTool: "select",
        isPlaying: false,
    });

    function updateEditor(
        changes: Partial<EditorState>
    ) {
        setEditor((previous) => ({
            ...previous,
            ...changes,
        }));
    }

    return (
        <EditorLayout
            editor={editor}
            updateEditor={updateEditor}
        />
    );
}
