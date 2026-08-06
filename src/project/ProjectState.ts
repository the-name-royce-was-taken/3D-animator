export interface ProjectSettings {
    name: string;
    fps: number;
    totalFrames: number;
}

export interface ProjectObject {
    id: string;
    name: string;
    type: string;
    data: unknown;
}

export interface ProjectAnimation {
    id: string;
    name: string;
    duration: number;
    data: unknown;
}

export interface ProjectStateData {
    settings: ProjectSettings;
    objects: ProjectObject[];
    animations: ProjectAnimation[];
    selectedObject: string | null;
    currentFrame: number;
}

export default class ProjectState {
    private state: ProjectStateData;

    constructor() {
        this.state = {
            settings: {
                name: "Untitled Project",
                fps: 60,
                totalFrames: 300,
            },
            objects: [],
            animations: [],
            selectedObject: null,
            currentFrame: 0,
        };
    }

    get(): ProjectStateData {
        return this.state;
    }

    set(
        state: Partial<ProjectStateData>
    ): void {
        this.state = {
            ...this.state,
            ...state,
        };
    }

    setProjectName(
        name: string
    ): void {
        this.state.settings.name =
            name;
    }

    setFPS(
        fps: number
    ): void {
        this.state.settings.fps =
            fps;
    }

    setFrame(
        frame: number
    ): void {
        this.state.currentFrame =
            Math.max(
                0,
                Math.min(
                    frame,
                    this.state.settings.totalFrames
                )
            );
    }

    addObject(
        object: ProjectObject
    ): void {
        this.state.objects.push(
            object
        );
    }

    removeObject(
        id: string
    ): void {
        this.state.objects =
            this.state.objects.filter(
                (object) =>
                    object.id !== id
            );
    }

    selectObject(
        id: string | null
    ): void {
        this.state.selectedObject =
            id;
    }

    addAnimation(
        animation: ProjectAnimation
    ): void {
        this.state.animations.push(
            animation
        );
    }

    clear(): void {
        this.state = {
            settings: {
                name: "Untitled Project",
                fps: 60,
                totalFrames: 300,
            },
            objects: [],
            animations: [],
            selectedObject: null,
            currentFrame: 0,
        };
    }

    serialize(): string {
        return JSON.stringify(
            this.state
        );
    }

    deserialize(
        data: string
    ): void {
        this.state =
            JSON.parse(
                data
            ) as ProjectStateData;
    }
}
