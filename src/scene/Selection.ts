import {
    Object3D,
    Box3,
    Vector3,
} from "three";

export default class Selection {
    private selected: Object3D | null = null;

    private previous: Object3D | null = null;

    select(
        object: Object3D | null
    ): void {
        this.previous = this.selected;
        this.selected = object;
    }

    clear(): void {
        this.previous = this.selected;
        this.selected = null;
    }

    getSelected(): Object3D | null {
        return this.selected;
    }

    getPrevious(): Object3D | null {
        return this.previous;
    }

    hasSelection(): boolean {
        return this.selected !== null;
    }

    getPosition(): Vector3 | null {
        if (!this.selected) {
            return null;
        }

        return this.selected.position.clone();
    }

    getBounds(): Box3 | null {
        if (!this.selected) {
            return null;
        }

        return new Box3().setFromObject(
            this.selected
        );
    }

    move(
        position: Vector3
    ): void {
        if (!this.selected) {
            return;
        }

        this.selected.position.copy(
            position
        );
    }

    delete(): void {
        if (!this.selected) {
            return;
        }

        this.selected.parent?.remove(
            this.selected
        );

        this.clear();
    }
}
