import {
    AnimationMixer,
    AnimationClip,
    Object3D,
} from "three";

export default class AnimationPlayer {
    private mixer: AnimationMixer | null;

    private clips: AnimationClip[];

    private current:
        | AnimationClip
        | null;

    private playing: boolean;

    constructor(
        object?: Object3D
    ) {
        this.mixer = object
            ? new AnimationMixer(object)
            : null;

        this.clips = [];

        this.current = null;

        this.playing = false;
    }

    setObject(
        object: Object3D
    ): void {
        this.mixer =
            new AnimationMixer(
                object
            );
    }

    addClip(
        clip: AnimationClip
    ): void {
        this.clips.push(
            clip
        );
    }

    removeClip(
        name: string
    ): void {
        this.clips =
            this.clips.filter(
                (clip) =>
                    clip.name !==
                    name
            );
    }

    play(
        clipName?: string
    ): void {
        if (!this.mixer) {
            return;
        }

        let clip =
            this.current;

        if (clipName) {
            clip =
                this.clips.find(
                    (item) =>
                        item.name ===
                        clipName
                ) ?? null;
        }

        if (!clip) {
            clip =
                this.clips[0] ?? null;
        }

        if (!clip) {
            return;
        }

        const action =
            this.mixer.clipAction(
                clip
            );

        action.reset();

        action.play();

        this.current =
            clip;

        this.playing =
            true;
    }

    pause(): void {
        if (!this.mixer) {
            return;
        }

        if (!this.current) {
            return;
        }

        const action =
            this.mixer.clipAction(
                this.current
            );

        action.paused = true;

        this.playing =
            false;
    }

    stop(): void {
        if (!this.mixer) {
            return;
        }

        this.mixer.stopAllAction();

        this.current =
            null;

        this.playing =
            false;
    }

    update(
        deltaTime: number
    ): void {
        if (!this.mixer) {
            return;
        }

        if (!this.playing) {
            return;
        }

        this.mixer.update(
            deltaTime
        );
    }

    isPlaying(): boolean {
        return this.playing;
    }

    getClips(): AnimationClip[] {
        return this.clips;
    }

    getCurrent():
        | AnimationClip
        | null {
        return this.current;
    }
}
