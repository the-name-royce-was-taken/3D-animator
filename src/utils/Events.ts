export type EventCallback<T = unknown> =
    (data: T) => void;

export default class Events {
    private events:
        Map<string, EventCallback[]>;

    constructor() {
        this.events =
            new Map();
    }

    on<T = unknown>(
        name: string,
        callback: EventCallback<T>
    ): void {
        const listeners =
            this.events.get(
                name
            ) ?? [];

        listeners.push(
            callback as EventCallback
        );

        this.events.set(
            name,
            listeners
        );
    }

    off<T = unknown>(
        name: string,
        callback: EventCallback<T>
    ): void {
        const listeners =
            this.events.get(
                name
            );

        if (!listeners) {
            return;
        }

        this.events.set(
            name,
            listeners.filter(
                (item) =>
                    item !== callback
            )
        );
    }

    emit<T = unknown>(
        name: string,
        data: T
    ): void {
        const listeners =
            this.events.get(
                name
            );

        if (!listeners) {
            return;
        }

        listeners.forEach(
            (callback) => {
                callback(
                    data
                );
            }
        );
    }

    once<T = unknown>(
        name: string,
        callback: EventCallback<T>
    ): void {
        const wrapper =
            (data: T) => {
                callback(
                    data
                );

                this.off(
                    name,
                    wrapper
                );
            };

        this.on(
            name,
            wrapper
        );
    }

    clear(
        name?: string
    ): void {
        if (name) {
            this.events.delete(
                name
            );

            return;
        }

        this.events.clear();
    }

    has(
        name: string
    ): boolean {
        return this.events.has(
            name
        );
    }
}
