import {
    Vector3,
    Quaternion,
    Euler,
} from "three";

export function clamp(
    value: number,
    min: number,
    max: number
): number {
    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}

export function lerp(
    start: number,
    end: number,
    amount: number
): number {
    return (
        start +
        (end - start) *
            amount
    );
}

export function lerpVector(
    a: Vector3,
    b: Vector3,
    amount: number
): Vector3 {
    return a.clone().lerp(
        b,
        amount
    );
}

export function distance(
    a: Vector3,
    b: Vector3
): number {
    return a.distanceTo(
        b
    );
}

export function normalize(
    value: Vector3
): Vector3 {
    return value.clone().normalize();
}

export function degreesToRadians(
    degrees: number
): number {
    return (
        degrees *
        (Math.PI / 180)
    );
}

export function radiansToDegrees(
    radians: number
): number {
    return (
        radians *
        (180 / Math.PI)
    );
}

export function eulerToQuaternion(
    rotation: Euler
): Quaternion {
    return new Quaternion()
        .setFromEuler(
            rotation
        );
}

export function quaternionToEuler(
    quaternion: Quaternion
): Euler {
    return new Euler()
        .setFromQuaternion(
            quaternion
        );
}

export function round(
    value: number,
    decimals: number = 2
): number {
    const multiplier =
        Math.pow(
            10,
            decimals
        );

    return (
        Math.round(
            value * multiplier
        ) /
        multiplier
    );
}

export function randomID(): string {
    return (
        Math.random()
            .toString(36)
            .substring(2) +
        Date.now()
            .toString(36)
    );
}
