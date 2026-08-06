export interface KeyframeValue {
    time: number;
    value: unknown;
}

export default class Keyframes {
    private frames: KeyframeValue[];

    constructor() {
        this.frames = [];
    }

    add(
        time: number,
        value: unknown
    ): void {
        this.frames.push({
            time,
            value,
        });

        this.sort();
    }

    remove(
        time: number
    ): void {
        this.frames =
            this.frames.filter(
                (frame) =>
                    frame.time !== time
            );
    }

    update(
        time: number,
        value: unknown
    ): void {
        const frame =
            this.frames.find(
                (item) =>
                    item.time === time
            );

        if (frame) {
            frame.value =
                value;
        } else {
            this.add(
                time,
                value
            );
        }
    }

    get(
        time: number
    ): KeyframeValue | undefined {
        return this.frames.find(
            (frame) =>
                frame.time === time
        );
    }

    getAll(): KeyframeValue[] {
        return this.frames;
    }

    getPrevious(
        time: number
    ): KeyframeValue | undefined {
        return this.frames
            .filter(
                (frame) =>
                    frame.time < time
            )
            .pop();
    }

    getNext(
        time: number
    ): KeyframeValue | undefined {
        return this.frames.find(
            (frame) =>
                frame.time > time
        );
    }

    clear(): void {
        this.frames = [];
    }

    count(): number {
        return this.frames.length;
    }

    private sort(): void {
        this.frames.sort(
            (a, b) =>
                a.time - b.time
        );
    }

    serialize(): string {
        return JSON.stringify(
            this.frames
        );
    }

    deserialize(
        data: string
    ): void {
        this.frames =
            JSON.parse(
                data
            ) as KeyframeValue[];

        this.sort();
    }
}
