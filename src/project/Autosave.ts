export default class Autosave {
    private interval:
        number | null;

    private saveFunction:
        (() => void) | null;

    constructor() {
        this.interval = null;
        this.saveFunction = null;
    }

    start(
        saveFunction: () => void,
        delay: number = 30000
    ): void {
        this.stop();

        this.saveFunction =
            saveFunction;

        this.interval =
            window.setInterval(
                () => {
                    this.saveFunction?.();
                },
                delay
            );
    }

    saveNow(): void {
        this.saveFunction?.();
    }

    stop(): void {
        if (
            this.interval !== null
        ) {
            window.clearInterval(
                this.interval
            );
        }

        this.interval = null;
    }

    isRunning(): boolean {
        return (
            this.interval !== null
        );
    }
}
