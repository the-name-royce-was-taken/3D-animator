import * as THREE from "three";

export default class Keyframes {
    constructor(options = {}) {
        this.timeline =
            options.timeline || null;

        this.defaultInterpolation =
            options.interpolation ||
            "linear";

        this.defaultEasing =
            options.easing ||
            "none";

        this.listeners = {
            added: [],
            removed: [],
            changed: [],
            moved: [],
            selected: [],
        };
    }

    setTimeline(
        timeline
    ) {
        this.timeline =
            timeline || null;

        return this;
    }

    getTrack(
        trackId
    ) {
        if (
            !this.timeline
        ) {
            return null;
        }

        return this.timeline.getTrack(
            trackId
        );
    }

    add(
        trackId,
        frame,
        value,
        options = {}
    ) {
        if (
            !this.timeline
        ) {
            return null;
        }

        const key =
            this.timeline.addKey(
                trackId,
                {
                    frame,
                    value:
                        this.cloneValue(
                            value
                        ),
                    interpolation:
                        options.interpolation ||
                        this.defaultInterpolation,
                    easing:
                        options.easing ||
                        this.defaultEasing,
                }
            );

        if (
            key
        ) {
            this.emit(
                "added",
                {
                    trackId,
                    key,
                }
            );
        }

        return key;
    }

    remove(
        trackId,
        keyId
    ) {
        if (
            !this.timeline
        ) {
            return false;
        }

        const key =
            this.timeline.getKey(
                trackId,
                keyId
            );

        if (
            !key
        ) {
            return false;
        }

        const result =
            this.timeline.removeKey(
                trackId,
                keyId
            );

        if (
            result
        ) {
            this.emit(
                "removed",
                {
                    trackId,
                    key,
                }
            );
        }

        return result;
    }

    move(
        trackId,
        keyId,
        frame
    ) {
        if (
            !this.timeline
        ) {
            return false;
        }

        const key =
            this.timeline.getKey(
                trackId,
                keyId
            );

        if (
            !key
        ) {
            return false;
        }

        const oldFrame =
            key.frame;

        const result =
            this.timeline.moveKey(
                trackId,
                keyId,
                frame
            );

        if (
            result
        ) {
            this.emit(
                "moved",
                {
                    trackId,
                    key,
                    oldFrame,
                    newFrame:
                        key.frame,
                }
            );
        }

        return result;
    }

    setValue(
        trackId,
        keyId,
        value
    ) {
        if (
            !this.timeline
        ) {
            return false;
        }

        const result =
            this.timeline.setKeyValue(
                trackId,
                keyId,
                this.cloneValue(
                    value
                )
            );

        if (
            result
        ) {
            const key =
                this.timeline.getKey(
                    trackId,
                    keyId
                );

            this.emit(
                "changed",
                {
                    trackId,
                    key,
                    property:
                        "value",
                }
            );
        }

        return result;
    }

    setInterpolation(
        trackId,
        keyId,
        interpolation
    ) {
        if (
            !this.timeline
        ) {
            return false;
        }

        const result =
            this.timeline.setKeyInterpolation(
                trackId,
                keyId,
                interpolation
            );

        if (
            result
        ) {
            const key =
                this.timeline.getKey(
                    trackId,
                    keyId
                );

            this.emit(
                "changed",
                {
                    trackId,
                    key,
                    property:
                        "interpolation",
                }
            );
        }

        return result;
    }

    get(
        trackId,
        keyId
    ) {
        if (
            !this.timeline
        ) {
            return null;
        }

        return this.timeline.getKey(
            trackId,
            keyId
        );
    }

    getAll(
        trackId
    ) {
        if (
            !this.timeline
        ) {
            return [];
        }

        return this.timeline.getKeys(
            trackId
        );
    }

    getAtFrame(
        trackId,
        frame,
        tolerance = 0.001
    ) {
        if (
            !this.timeline
        ) {
            return null;
        }

        return this.timeline.getKeyAtFrame(
            trackId,
            frame,
            tolerance
        );
    }

    hasAtFrame(
        trackId,
        frame,
        tolerance = 0.001
    ) {
        return Boolean(
            this.getAtFrame(
                trackId,
                frame,
                tolerance
            )
        );
    }

    getPrevious(
        trackId,
        frame
    ) {
        if (
            !this.timeline
        ) {
            return null;
        }

        return this.timeline.getPreviousKey(
            trackId,
            frame
        );
    }

    getNext(
        trackId,
        frame
    ) {
        if (
            !this.timeline
        ) {
            return null;
        }

        return this.timeline.getNextKey(
            trackId,
            frame
        );
    }

    getSurrounding(
        trackId,
        frame
    ) {
        if (
            !this.timeline
        ) {
            return {
                previous: null,
                next: null,
            };
        }

        return this.timeline.getSurroundingKeys(
            trackId,
            frame
        );
    }

    duplicate(
        trackId,
        keyId,
        frame
    ) {
        if (
            !this.timeline
        ) {
            return null;
        }

        const key =
            this.timeline.duplicateKey(
                trackId,
                keyId,
                frame
            );

        if (
            key
        ) {
            this.emit(
                "added",
                {
                    trackId,
                    key,
                    duplicated:
                        true,
                }
            );
        }

        return key;
    }

    duplicateSelected(
        frameOffset = 1
    ) {
        if (
            !this.timeline
        ) {
            return [];
        }

        const result =
            this.timeline.duplicateSelectedKeys(
                frameOffset
            );

        result.forEach(
            ({
                track,
                key,
            }) => {
                this.emit(
                    "added",
                    {
                        trackId:
                            track.id,
                        key,
                        duplicated:
                            true,
                    }
                );
            }
        );

        return result;
    }

    select(
        trackId,
        keyId,
        options = {}
    ) {
        if (
            !this.timeline
        ) {
            return false;
        }

        const result =
            this.timeline.selectKey(
                trackId,
                keyId,
                options.selected !==
                    false,
                options.additive ===
                    true
            );

        if (
            result
        ) {
            this.emit(
                "selected",
                {
                    trackId,
                    keyId,
                }
            );
        }

        return result;
    }

    selectRange(
        startFrame,
        endFrame,
        options = {}
    ) {
        if (
            !this.timeline
        ) {
            return [];
        }

        const result =
            this.timeline.selectKeysInRange(
                startFrame,
                endFrame,
                options
            );

        this.emit(
            "selected",
            {
                range: [
                    startFrame,
                    endFrame,
                ],
                keys:
                    result,
            }
        );

        return result;
    }

    clearSelection() {
        if (
            !this.timeline
        ) {
            return;
        }

        this.timeline.clearSelection();

        this.emit(
            "selected",
            {
                keys: [],
            }
        );
    }

    getSelected() {
        if (
            !this.timeline
        ) {
            return [];
        }

        return this.timeline.getSelectedKeys();
    }

    deleteSelected() {
        if (
            !this.timeline
        ) {
            return 0;
        }

        const count =
            this.timeline.deleteSelectedKeys();

        this.emit(
            "removed",
            {
                count,
                selected:
                    true,
            }
        );

        return count;
    }

    shiftSelected(
        offset
    ) {
        if (
            !this.timeline
        ) {
            return 0;
        }

        const count =
            this.timeline.shiftKeys(
                offset,
                {
                    selectedOnly:
                        true,
                }
            );

        this.emit(
            "moved",
            {
                count,
                offset,
            }
        );

        return count;
    }

    scaleSelected(
        centerFrame,
        factor
    ) {
        if (
            !this.timeline
        ) {
            return 0;
        }

        const count =
            this.timeline.scaleKeys(
                centerFrame,
                factor,
                {
                    selectedOnly:
                        true,
                }
            );

        this.emit(
            "moved",
            {
                count,
                centerFrame,
                factor,
            }
        );

        return count;
    }

    insert(
        trackId,
        frame,
        value,
        options = {}
    ) {
        const existing =
            this.getAtFrame(
                trackId,
                frame
            );

        if (
            existing
        ) {
            this.setValue(
                trackId,
                existing.id,
                value
            );

            return existing;
        }

        return this.add(
            trackId,
            frame,
            value,
            options
        );
    }

    capture(
        trackId,
        frame,
        object,
        property,
        options = {}
    ) {
        if (
            !object
        ) {
            return null;
        }

        const value =
            this.readProperty(
                object,
                property
            );

        if (
            value ===
            undefined
        ) {
            return null;
        }

        return this.insert(
            trackId,
            frame,
            value,
            options
        );
    }

    readProperty(
        object,
        property
    ) {
        if (
            !object ||
            !property
        ) {
            return undefined;
        }

        const parts =
            Array.isArray(
                property
            )
                ? property
                : String(
                      property
                  ).split(".");

        let current =
            object;

        for (
            const part of parts
        ) {
            if (
                current ===
                    null ||
                current ===
                    undefined
            ) {
                return undefined;
            }

            current =
                current[
                    part
                ];
        }

        if (
            current &&
            typeof current.clone ===
                "function"
        ) {
            return current.clone();
        }

        if (
            current &&
            typeof current.toArray ===
                "function"
        ) {
            return current.toArray();
        }

        return this.cloneValue(
            current
        );
    }

    writeProperty(
        object,
        property,
        value
    ) {
        if (
            !object ||
            !property
        ) {
            return false;
        }

        const parts =
            Array.isArray(
                property
            )
                ? property
                : String(
                      property
                  ).split(".");

        if (
            parts.length ===
            0
        ) {
            return false;
        }

        let current =
            object;

        for (
            let i = 0;
            i <
            parts.length -
                1;
            i++
        ) {
            const part =
                parts[i];

            if (
                current[
                    part
                ] ===
                undefined
            ) {
                return false;
            }

            current =
                current[
                    part
                ];
        }

        const last =
            parts[
                parts.length -
                    1
            ];

        const destination =
            current[
                last
            ];

        if (
            destination &&
            typeof destination.copy ===
                "function"
        ) {
            if (
                value &&
                typeof value ===
                    "object" &&
                Array.isArray(
                    value
                )
            ) {
                destination.fromArray(
                    value
                );
            } else if (
                value &&
                typeof value.clone ===
                    "function"
            ) {
                destination.copy(
                    value
                );
            } else {
                current[
                    last
                ] =
                    this.cloneValue(
                        value
                    );
            }
        } else {
            current[
                last
            ] =
                this.cloneValue(
                    value
                );
        }

        return true;
    }

    interpolate(
        trackId,
        frame
    ) {
        const track =
            this.getTrack(
                trackId
            );

        if (
            !track ||
            track.keys.length ===
                0
        ) {
            return undefined;
        }

        const keys =
            track.keys;

        if (
            frame <=
            keys[0].frame
        ) {
            return this.cloneValue(
                keys[0].value
            );
        }

        const last =
            keys[
                keys.length - 1
            ];

        if (
            frame >=
            last.frame
        ) {
            return this.cloneValue(
                last.value
            );
        }

        let previous =
            keys[0];

        let next =
            last;

        for (
            let i = 1;
            i <
            keys.length;
            i++
        ) {
            if (
                keys[i].frame >=
                frame
            ) {
                next =
                    keys[i];

                previous =
                    keys[i - 1];

                break;
            }
        }

        const range =
            next.frame -
            previous.frame;

        if (
            range <=
            0
        ) {
            return this.cloneValue(
                previous.value
            );
        }

        let t =
            (frame -
                previous.frame) /
            range;

        t =
            this.applyEasing(
                t,
                previous.easing
            );

        return this.interpolateValues(
            previous.value,
            next.value,
            t
        );
    }

    interpolateValues(
        a,
        b,
        t
    ) {
        if (
            a ===
                null ||
            a ===
                undefined
        ) {
            return this.cloneValue(
                b
            );
        }

        if (
            b ===
                null ||
            b ===
                undefined
        ) {
            return this.cloneValue(
                a
            );
        }

        if (
            a.isQuaternion &&
            b.isQuaternion
        ) {
            return new THREE.Quaternion()
                .copy(a)
                .slerp(
                    b,
                    t
                );
        }

        if (
            a.isVector3 &&
            b.isVector3
        ) {
            return new THREE.Vector3()
                .copy(a)
                .lerp(
                    b,
                    t
                );
        }

        if (
            a.isEuler &&
            b.isEuler
        ) {
            const result =
                new THREE.Euler();

            result.x =
                THREE.MathUtils.lerp(
                    a.x,
                    b.x,
                    t
                );

            result.y =
                THREE.MathUtils.lerp(
                    a.y,
                    b.y,
                    t
                );

            result.z =
                THREE.MathUtils.lerp(
                    a.z,
                    b.z,
                    t
                );

            result.order =
                a.order;

            return result;
        }

        if (
            Array.isArray(a) &&
            Array.isArray(b)
        ) {
            const length =
                Math.max(
                    a.length,
                    b.length
                );

            return Array.from(
                {
                    length,
                },
                (
                    _,
                    index
                ) =>
                    THREE.MathUtils.lerp(
                        Number(
                            a[index] ??
                                0
                        ),
                        Number(
                            b[index] ??
                                0
                        ),
                        t
                    )
            );
        }

        if (
            typeof a ===
                "number" &&
            typeof b ===
                "number"
        ) {
            return THREE.MathUtils.lerp(
                a,
                b,
                t
            );
        }

        if (
            typeof a ===
                "boolean" ||
            typeof b ===
                "boolean"
        ) {
            return t < 0.5
                ? a
                : b;
        }

        if (
            typeof a ===
                "object" &&
            typeof b ===
                "object"
        ) {
            const result =
                {};

            const keys =
                new Set([
                    ...Object.keys(
                        a
                    ),
                    ...Object.keys(
                        b
                    ),
                ]);

            keys.forEach(
                (key) => {
                    result[key] =
                        this.interpolateValues(
                            a[key],
                            b[key],
                            t
                        );
                }
            );

            return result;
        }

        return t < 0.5
            ? this.cloneValue(
                  a
              )
            : this.cloneValue(
                  b
              );
    }

    applyEasing(
        t,
        easing
    ) {
        const value =
            Math.max(
                0,
                Math.min(
                    1,
                    t
                )
            );

        switch (
            easing
        ) {
            case "easeIn":
                return (
                    value *
                    value
                );

            case "easeOut":
                return (
                    1 -
                    (1 - value) *
                        (1 - value)
                );

            case "easeInOut":
                return (
                    value <
                    0.5
                        ? 2 *
                          value *
                          value
                        : 1 -
                          Math.pow(
                              -2 *
                                  value +
                                  2,
                              2
                          ) /
                              2
                );

            case "step":
                return 0;

            case "smooth":
                return (
                    value *
                    value *
                    (3 -
                        2 *
                            value)
                );

            case "none":
            default:
                return value;
        }
    }

    applyToObject(
        trackId,
        frame,
        object
    ) {
        const track =
            this.getTrack(
                trackId
            );

        if (
            !track ||
            !object
        ) {
            return false;
        }

        const value =
            this.interpolate(
                trackId,
                frame
            );

        if (
            value ===
            undefined
        ) {
            return false;
        }

        if (
            track.property
        ) {
            return this.writeProperty(
                object,
                track.property,
                value
            );
        }

        if (
            track.target &&
            track.target.property
        ) {
            return this.writeProperty(
                object,
                track.target.property,
                value
            );
        }

        return false;
    }

    evaluate(
        frame
    ) {
        const result =
            new Map();

        if (
            !this.timeline
        ) {
            return result;
        }

        this.timeline
            .getTracks()
            .forEach(
                (track) => {
                    result.set(
                        track.id,
                        this.interpolate(
                            track.id,
                            frame
                        )
                    );
                }
            );

        return result;
    }

    cloneValue(
        value
    ) {
        if (
            value ===
                null ||
            value ===
                undefined
        ) {
            return value;
        }

        if (
            typeof value.clone ===
                "function"
        ) {
            return value.clone();
        }

        if (
            Array.isArray(
                value
            )
        ) {
            return value.map(
                (item) =>
                    this.cloneValue(
                        item
                    )
            );
        }

        if (
            typeof value ===
                "object"
        ) {
            const result =
                {};

            Object.entries(
                value
            ).forEach(
                ([
                    key,
                    item,
                ]) => {
                    result[key] =
                        this.cloneValue(
                            item
                        );
                }
            );

            return result;
        }

        return value;
    }

    on(
        event,
        callback
    ) {
        if (
            !this.listeners[
                event
            ] ||
            typeof callback !==
                "function"
        ) {
            return () => {};
        }

        this.listeners[
            event
        ].push(
            callback
        );

        return () =>
            this.off(
                event,
                callback
            );
    }

    off(
        event,
        callback
    ) {
        const listeners =
            this.listeners[
                event
            ];

        if (
            !listeners
        ) {
            return;
        }

        const index =
            listeners.indexOf(
                callback
            );

        if (
            index !==
            -1
        ) {
            listeners.splice(
                index,
                1
            );
        }
    }

    emit(
        event,
        data
    ) {
        const listeners =
            this.listeners[
                event
            ];

        if (
            !listeners
        ) {
            return;
        }

        listeners
            .slice()
            .forEach(
                (callback) => {
                    try {
                        callback(
                            data
                        );
                    } catch (
                        error
                    ) {
                        console.error(
                            `Keyframes event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.timeline =
            null;

        this.listeners = {
            added: [],
            removed: [],
            changed: [],
            moved: [],
            selected: [],
        };
    }
}
