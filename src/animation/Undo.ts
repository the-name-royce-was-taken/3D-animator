export interface UndoAction {
    id: string;
    name: string;
    undo: () => void;
    redo: () => void;
}

export default class Undo {
    private undoStack: UndoAction[];

    private redoStack: UndoAction[];

    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }

    execute(
        action: UndoAction
    ): void {
        action.redo();

        this.undoStack.push(
            action
        );

        this.redoStack = [];
    }

    undo(): void {
        const action =
            this.undoStack.pop();

        if (!action) {
            return;
        }

        action.undo();

        this.redoStack.push(
            action
        );
    }

    redo(): void {
        const action =
            this.redoStack.pop();

        if (!action) {
            return;
        }

        action.redo();

        this.undoStack.push(
            action
        );
    }

    add(
        action: UndoAction
    ): void {
        this.undoStack.push(
            action
        );

        this.redoStack = [];
    }

    canUndo(): boolean {
        return (
            this.undoStack.length > 0
        );
    }

    canRedo(): boolean {
        return (
            this.redoStack.length > 0
        );
    }

    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }

    getUndoCount(): number {
        return this.undoStack.length;
    }

    getRedoCount(): number {
        return this.redoStack.length;
    }
}
