export const APP_NAME =
    "3D Animator";

export const APP_VERSION =
    "1.0.0";

export const SUPPORTED_IMPORTS =
    [
        "glb",
        "gltf",
        "fbx",
    ];

export const SUPPORTED_EXPORTS =
    [
        "glb",
        "fbx",
        "zip",
    ];

export const DEFAULT_CAMERA = {
    fov: 45,
    near: 0.1,
    far: 1000,
    position: {
        x: 5,
        y: 4,
        z: 5,
    },
};

export const DEFAULT_SCENE = {
    background:
        "#151515",
    gridSize:
        20,
    gridDivisions:
        20,
};

export const DEFAULT_PROJECT = {
    name:
        "Untitled Project",
    fps:
        60,
    frames:
        300,
};

export const STORAGE_PREFIX =
    "3d-animator-";

export const FILE_TYPES = {
    MODEL:
        ".glb,.gltf,.fbx",
    PROJECT:
        ".zip,.json",
};

export const EVENTS = {
    LOAD_MODEL:
        "load-model",
    SELECT_OBJECT:
        "select-object",
    UPDATE_TIMELINE:
        "update-timeline",
    SAVE_PROJECT:
        "save-project",
    LOAD_PROJECT:
        "load-project",
    RIG_CREATED:
        "rig-created",
};

export const TOOL_MODES = {
    SELECT:
        "select",
    MOVE:
        "move",
    ROTATE:
        "rotate",
    SCALE:
        "scale",
};

export const MAX_UNDO =
    100;

export const AUTOSAVE_TIME =
    30000;
