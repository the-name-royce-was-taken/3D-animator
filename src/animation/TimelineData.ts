export interface Keyframe {
    frame: number;
    value: unknown;
}

export interface TimelineTrack {
    id: string;
    name: string;
    keyframes: Keyframe[];
}

export default class TimelineData {
    private tracks: TimelineTrack[];

    constructor() {
        this.tracks = [];
    }

    addTrack(
        id: string,
        name: string
    ): TimelineTrack {
        const track: TimelineTrack = {
            id,
            name,
            keyframes: [],
        };

        this.tracks.push(
            track
        );

        return track;
    }

    removeTrack(
        id: string
    ): void {
        this.tracks =
            this.tracks.filter(
                (track) =>
                    track.id !== id
            );
    }

    addKeyframe(
        trackId: string,
        frame: number,
        value: unknown
    ): void {
        const track =
            this.getTrack(
                trackId
            );

        if (!track) {
            return;
        }

        track.keyframes.push({
            frame,
            value,
        });

        track.keyframes.sort(
            (a, b) =>
                a.frame - b.frame
        );
    }

    removeKeyframe(
        trackId: string,
        frame: number
    ): void {
        const track =
            this.getTrack(
                trackId
            );

        if (!track) {
            return;
        }

        track.keyframes =
            track.keyframes.filter(
                (keyframe) =>
                    keyframe.frame !==
                    frame
            );
    }

    getTrack(
        id: string
    ): TimelineTrack | undefined {
        return this.tracks.find(
            (track) =>
                track.id === id
        );
    }

    getTracks(): TimelineTrack[] {
        return this.tracks;
    }

    clear(): void {
        this.tracks = [];
    }

    serialize(): string {
        return JSON.stringify(
            this.tracks
        );
    }

    deserialize(
        data: string
    ): void {
        const parsed =
            JSON.parse(
                data
            ) as TimelineTrack[];

        this.tracks =
            parsed;
    }
}
