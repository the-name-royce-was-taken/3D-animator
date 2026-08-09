export default class TimelineData {
    constructor(options = {}) {
        this.fps =
            Number.isFinite(options.fps)
                ? Math.max(1, options.fps)
                : 30;

        this.startFrame =
            Number.isFinite(
                options.startFrame
            )
                ? options.startFrame
                : 0;

        this.endFrame =
            Number.isFinite(
                options.endFrame
            )
                ? options.endFrame
                : 120;

        this.currentFrame =
            Number.isFinite(
                options.currentFrame
            )
                ? options.currentFrame
                : this.startFrame;

        this.loopStart =
            Number.isFinite(
                options.loopStart
            )
                ? options.loopStart
                : this.startFrame;

        this.loopEnd =
            Number.isFinite(
                options.loopEnd
            )
                ? options.loopEnd
                : this.endFrame;

        this.playing =
            false;

        this.loop =
            options.loop !== false;

        this.tracks =
            new Map();

        this.markers =
            new Map();

        this.selectedKeys =
            new Set();

        this.listeners = {
            changed: [],
            frameChanged: [],
            trackAdded: [],
            trackRemoved: [],
            keyAdded: [],
            keyRemoved: [],
            markerAdded: [],
            markerRemoved: [],
        };

        if (
            Array.isArray(
                options.tracks
            )
        ) {
            options.tracks.forEach(
                (track) =>
                    this.addTrack(
                        track
                    )
            );
        }

        if (
            Array.isArray(
                options.markers
            )
        ) {
            options.markers.forEach(
                (marker) =>
                    this.addMarker(
                        marker
                    )
            );
        }

        this.currentFrame =
            this.clampFrame(
                this.currentFrame
            );
    }

    clampFrame(
        frame
    ) {
        const value =
            Number(frame);

        if (
            !Number.isFinite(
                value
            )
        ) {
            return this.startFrame;
        }

        return Math.max(
            this.startFrame,
            Math.min(
                this.endFrame,
                value
            )
        );
    }

    setFPS(
        fps
    ) {
        if (
            !Number.isFinite(
                fps
            )
        ) {
            return false;
        }

        this.fps =
            Math.max(
                1,
                fps
            );

        this.emit(
            "changed",
            {
                type: "fps",
                fps: this.fps,
            }
        );

        return true;
    }

    getFPS() {
        return this.fps;
    }

    setFrameRange(
        startFrame,
        endFrame
    ) {
        if (
            !Number.isFinite(
                startFrame
            ) ||
            !Number.isFinite(
                endFrame
            )
        ) {
            return false;
        }

        if (
            endFrame <
            startFrame
        ) {
            return false;
        }

        this.startFrame =
            startFrame;

        this.endFrame =
            endFrame;

        this.currentFrame =
            this.clampFrame(
                this.currentFrame
            );

        this.loopStart =
            Math.max(
                this.startFrame,
                Math.min(
                    this.loopStart,
                    this.endFrame
                )
            );

        this.loopEnd =
            Math.max(
                this.loopStart,
                Math.min(
                    this.loopEnd,
                    this.endFrame
                )
            );

        this.emit(
            "changed",
            {
                type:
                    "frameRange",
                startFrame:
                    this.startFrame,
                endFrame:
                    this.endFrame,
            }
        );

        return true;
    }

    setCurrentFrame(
        frame,
        options = {}
    ) {
        const next =
            options.allowOutside
                ? Number(frame)
                : this.clampFrame(
                      frame
                  );

        if (
            !Number.isFinite(
                next
            )
        ) {
            return false;
        }

        const changed =
            next !==
            this.currentFrame;

        this.currentFrame =
            next;

        if (
            changed ||
            options.force
        ) {
            this.emit(
                "frameChanged",
                {
                    frame:
                        this.currentFrame,
                }
            );
        }

        return true;
    }

    getCurrentFrame() {
        return this.currentFrame;
    }

    frameToSeconds(
        frame
    ) {
        return (
            Number(frame) /
            this.fps
        );
    }

    secondsToFrame(
        seconds
    ) {
        return (
            Number(seconds) *
            this.fps
        );
    }

    getDurationFrames() {
        return (
            this.endFrame -
            this.startFrame
        );
    }

    getDurationSeconds() {
        return this.frameToSeconds(
            this.getDurationFrames()
        );
    }

    setLoop(
        enabled
    ) {
        this.loop =
            Boolean(enabled);

        this.emit(
            "changed",
            {
                type: "loop",
                loop:
                    this.loop,
            }
        );

        return this;
    }

    isLooping() {
        return this.loop;
    }

    setLoopRange(
        startFrame,
        endFrame
    ) {
        if (
            !Number.isFinite(
                startFrame
            ) ||
            !Number.isFinite(
                endFrame
            )
        ) {
            return false;
        }

        const start =
            Math.max(
                this.startFrame,
                Math.min(
                    startFrame,
                    this.endFrame
                )
            );

        const end =
            Math.max(
                start,
                Math.min(
                    endFrame,
                    this.endFrame
                )
            );

        this.loopStart =
            start;

        this.loopEnd =
            end;

        this.emit(
            "changed",
            {
                type:
                    "loopRange",
                loopStart:
                    start,
                loopEnd:
                    end,
            }
        );

        return true;
    }

    getLoopRange() {
        return {
            start:
                this.loopStart,

            end:
                this.loopEnd,
        };
    }

    play() {
        this.playing =
            true;

        this.emit(
            "changed",
            {
                type: "playing",
                playing:
                    true,
            }
        );
    }

    pause() {
        this.playing =
            false;

        this.emit(
            "changed",
            {
                type: "playing",
                playing:
                    false,
            }
        );
    }

    togglePlay() {
        if (
            this.playing
        ) {
            this.pause();
        } else {
            this.play();
        }

        return this.playing;
    }

    isPlaying() {
        return this.playing;
    }

    stop() {
        this.playing =
            false;

        this.setCurrentFrame(
            this.startFrame
        );

        this.emit(
            "changed",
            {
                type: "stop",
            }
        );
    }

    step(
        amount = 1
    ) {
        const next =
            this.currentFrame +
            amount;

        if (
            this.loop
        ) {
            if (
                next >
                this.loopEnd
            ) {
                this.setCurrentFrame(
                    this.loopStart
                );

                return this.currentFrame;
            }

            if (
                next <
                this.loopStart
            ) {
                this.setCurrentFrame(
                    this.loopEnd
                );

                return this.currentFrame;
            }
        }

        this.setCurrentFrame(
            next
        );

        return this.currentFrame;
    }

    update(
        deltaSeconds
    ) {
        if (
            !this.playing
        ) {
            return this.currentFrame;
        }

        if (
            !Number.isFinite(
                deltaSeconds
            )
        ) {
            return this.currentFrame;
        }

        const frameDelta =
            deltaSeconds *
            this.fps;

        let next =
            this.currentFrame +
            frameDelta;

        if (
            this.loop
        ) {
            if (
                next >
                this.loopEnd
            ) {
                const length =
                    this.loopEnd -
                    this.loopStart;

                if (
                    length <=
                    0
                ) {
                    next =
                        this.loopStart;
                } else {
                    next =
                        this.loopStart +
                        (
                            next -
                            this.loopStart
                        ) %
                            length;
                }
            }
        } else if (
            next >=
            this.endFrame
        ) {
            next =
                this.endFrame;

            this.playing =
                false;
        }

        this.setCurrentFrame(
            next
        );

        return this.currentFrame;
    }

    normalizeTrackId(
        id
    ) {
        if (
            id ===
            undefined ||
            id ===
            null
        ) {
            return "";
        }

        return String(id);
    }

    addTrack(
        track
    ) {
        if (
            !track
        ) {
            return null;
        }

        const id =
            this.normalizeTrackId(
                track.id ||
                    track.name
            );

        if (
            !id
        ) {
            return null;
        }

        const existing =
            this.tracks.get(
                id
            );

        const normalized =
            {
                id,

                name:
                    track.name ||
                    id,

                property:
                    track.property ||
                    "",

                target:
                    track.target ||
                    null,

                interpolation:
                    track.interpolation ||
                    "linear",

                muted:
                    Boolean(
                        track.muted
                    ),

                locked:
                    Boolean(
                        track.locked
                    ),

                visible:
                    track.visible !==
                    false,

                keys:
                    [],
            };

        if (
            Array.isArray(
                track.keys
            )
        ) {
            normalized.keys =
                track.keys
                    .map(
                        (key) =>
                            this.normalizeKey(
                                key
                            )
                    )
                    .filter(
                        Boolean
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a.frame -
                            b.frame
                    );
        }

        this.tracks.set(
            id,
            normalized
        );

        this.emit(
            "trackAdded",
            {
                track:
                    normalized,
                replaced:
                    Boolean(
                        existing
                    ),
            }
        );

        return normalized;
    }

    removeTrack(
        trackId
    ) {
        const id =
            this.normalizeTrackId(
                trackId
            );

        const track =
            this.tracks.get(
                id
            );

        if (
            !track
        ) {
            return false;
        }

        track.keys.forEach(
            (key) => {
                this.selectedKeys.delete(
                    this.getKeyId(
                        id,
                        key
                    )
                );
            }
        );

        this.tracks.delete(
            id
        );

        this.emit(
            "trackRemoved",
            {
                track,
            }
        );

        return true;
    }

    getTrack(
        trackId
    ) {
        return this.tracks.get(
            this.normalizeTrackId(
                trackId
            )
        );
    }

    getTracks() {
        return [
            ...this.tracks.values(),
        ];
    }

    hasTrack(
        trackId
    ) {
        return this.tracks.has(
            this.normalizeTrackId(
                trackId
            )
        );
    }

    setTrackProperty(
        trackId,
        property,
        value
    ) {
        const track =
            this.getTrack(
                trackId
            );

        if (
            !track
        ) {
            return false;
        }

        track[property] =
            value;

        this.emit(
            "changed",
            {
                type:
                    "trackProperty",
                track,
                property,
                value,
            }
        );

        return true;
    }

    normalizeKey(
        key
    ) {
        if (
            !key
        ) {
            return null;
        }

        const frame =
            Number(key.frame);

        if (
            !Number.isFinite(
                frame
            )
        ) {
            return null;
        }

        return {
            id:
                key.id ||
                `key_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2)}`,

            frame,

            value:
                this.cloneValue(
                    key.value
                ),

            interpolation:
                key.interpolation ||
                "linear",

            easing:
                key.easing ||
                "none",

            selected:
                Boolean(
                    key.selected
                ),
        };
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
            typeof value !==
            "object"
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

    getKeyId(
        trackId,
        key
    ) {
        return `${this.normalizeTrackId(
            trackId
        )}:${key.id}`;
    }

    addKey(
        trackId,
        key
    ) {
        const track =
            this.getTrack(
                trackId
            );

        if (
            !track
        ) {
            return null;
        }

        const normalized =
            this.normalizeKey(
                key
            );

        if (
            !normalized
        ) {
            return null;
        }

        const existingIndex =
            track.keys.findIndex(
                (item) =>
                    item.id ===
                    normalized.id
            );

        if (
            existingIndex >=
            0
        ) {
            track.keys[
                existingIndex
            ] =
                normalized;
        } else {
            track.keys.push(
                normalized
            );
        }

        track.keys.sort(
            (
                a,
                b
            ) =>
                a.frame -
                b.frame
        );

        this.emit(
            "keyAdded",
            {
                track,
                key:
                    normalized,
            }
        );

        return normalized;
    }

    removeKey(
        trackId,
        keyId
    ) {
        const track =
            this.getTrack(
                trackId
            );

        if (
            !track
        ) {
            return false;
        }

        const index =
            track.keys.findIndex(
                (key) =>
                    key.id ===
                    keyId
            );

        if (
            index ===
            -1
        ) {
            return false;
        }

        const key =
            track.keys[
                index
            ];

        track.keys.splice(
            index,
            1
        );

        this.selectedKeys.delete(
            this.getKeyId(
                trackId,
                key
            )
        );

        this.emit(
            "keyRemoved",
            {
                track,
                key,
            }
        );

        return true;
    }

    getKey(
        trackId,
        keyId
    ) {
        const track =
            this.getTrack(
                trackId
            );

        if (
            !track
        ) {
            return null;
        }

        return (
            track.keys.find(
                (key) =>
                    key.id ===
                    keyId
            ) || null
        );
    }

    getKeys(
        trackId
    ) {
        const track =
            this.getTrack(
                trackId
            );

        return track
            ? track.keys
            : [];
    }

    getKeysAtFrame(
        frame,
        tolerance = 0.001
    ) {
        const result =
            [];

        this.tracks.forEach(
            (track) => {
                track.keys.forEach(
                    (key) => {
                        if (
                            Math.abs(
                                key.frame -
                                    frame
                            ) <=
                            tolerance
                        ) {
                            result.push(
                                {
                                    track,
                                    key,
                                }
                            );
                        }
                    }
                );
            }
        );

        return result;
    }

    getPreviousKey(
        trackId,
        frame
    ) {
        const keys =
            this.getKeys(
                trackId
            );

        let result =
            null;

        keys.forEach(
            (key) => {
                if (
                    key.frame <=
                    frame
                ) {
                    if (
                        !result ||
                        key.frame >
                            result.frame
                    ) {
                        result =
                            key;
                    }
                }
            }
        );

        return result;
    }

    getNextKey(
        trackId,
        frame
    ) {
        const keys =
            this.getKeys(
                trackId
            );

        let result =
            null;

        keys.forEach(
            (key) => {
                if (
                    key.frame >=
                    frame
                ) {
                    if (
                        !result ||
                        key.frame <
                            result.frame
                    ) {
                        result =
                            key;
                    }
                }
            }
        );

        return result;
    }

    getSurroundingKeys(
        trackId,
        frame
    ) {
        return {
            previous:
                this.getPreviousKey(
                    trackId,
                    frame
                ),

            next:
                this.getNextKey(
                    trackId,
                    frame
                ),
        };
    }

    moveKey(
        trackId,
        keyId,
        newFrame
    ) {
        const key =
            this.getKey(
                trackId,
                keyId
            );

        if (
            !key ||
            !Number.isFinite(
                Number(
                    newFrame
                )
            )
        ) {
            return false;
        }

        key.frame =
            Number(
                newFrame
            );

        const track =
            this.getTrack(
                trackId
            );

        track.keys.sort(
            (
                a,
                b
            ) =>
                a.frame -
                b.frame
        );

        this.emit(
            "changed",
            {
                type:
                    "keyMoved",
                track,
                key,
            }
        );

        return true;
    }

    setKeyValue(
        trackId,
        keyId,
        value
    ) {
        const key =
            this.getKey(
                trackId,
                keyId
            );

        if (
            !key
        ) {
            return false;
        }

        key.value =
            this.cloneValue(
                value
            );

        this.emit(
            "changed",
            {
                type:
                    "keyValue",
                trackId,
                key,
            }
        );

        return true;
    }

    setKeyInterpolation(
        trackId,
        keyId,
        interpolation
    ) {
        const key =
            this.getKey(
                trackId,
                keyId
            );

        if (
            !key
        ) {
            return false;
        }

        key.interpolation =
            interpolation;

        this.emit(
            "changed",
            {
                type:
                    "keyInterpolation",
                trackId,
                key,
            }
        );

        return true;
    }

    selectKey(
        trackId,
        keyId,
        selected = true,
        additive = false
    ) {
        const key =
            this.getKey(
                trackId,
                keyId
            );

        if (
            !key
        ) {
            return false;
        }

        if (
            !additive
        ) {
            this.clearSelection();
        }

        const id =
            this.getKeyId(
                trackId,
                key
            );

        if (
            selected
        ) {
            this.selectedKeys.add(
                id
            );

            key.selected =
                true;
        } else {
            this.selectedKeys.delete(
                id
            );

            key.selected =
                false;
        }

        this.emit(
            "changed",
            {
                type:
                    "selection",
                selectedKeys:
                    this.getSelectedKeys(),
            }
        );

        return true;
    }

    selectKeysInRange(
        startFrame,
        endFrame,
        options = {}
    ) {
        const min =
            Math.min(
                startFrame,
                endFrame
            );

        const max =
            Math.max(
                startFrame,
                endFrame
            );

        if (
            !options.additive
        ) {
            this.clearSelection();
        }

        const selected =
            [];

        this.tracks.forEach(
            (track) => {
                track.keys.forEach(
                    (key) => {
                        if (
                            key.frame >=
                                min &&
                            key.frame <=
                                max
                        ) {
                            const id =
                                this.getKeyId(
                                    track.id,
                                    key
                                );

                            this.selectedKeys.add(
                                id
                            );

                            key.selected =
                                true;

                            selected.push(
                                {
                                    track,
                                    key,
                                }
                            );
                        }
                    }
                );
            }
        );

        this.emit(
            "changed",
            {
                type:
                    "rangeSelection",
                selected,
            }
        );

        return selected;
    }

    clearSelection() {
        this.selectedKeys.clear();

        this.tracks.forEach(
            (track) => {
                track.keys.forEach(
                    (key) => {
                        key.selected =
                            false;
                    }
                );
            }
        );
    }

    getSelectedKeys() {
        const result =
            [];

        this.tracks.forEach(
            (track) => {
                track.keys.forEach(
                    (key) => {
                        if (
                            this.selectedKeys.has(
                                this.getKeyId(
                                    track.id,
                                    key
                                )
                            )
                        ) {
                            result.push(
                                {
                                    track,
                                    key,
                                }
                            );
                        }
                    }
                );
            }
        );

        return result;
    }

    deleteSelectedKeys() {
        const selected =
            this.getSelectedKeys();

        selected.forEach(
            ({
                track,
                key,
            }) => {
                this.removeKey(
                    track.id,
                    key.id
                );
            }
        );

        this.clearSelection();

        return selected.length;
    }

    addMarker(
        marker
    ) {
        if (
            !marker
        ) {
            return null;
        }

        const frame =
            Number(marker.frame);

        if (
            !Number.isFinite(
                frame
            )
        ) {
            return null;
        }

        const id =
            marker.id ||
            `marker_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}`;

        const normalized =
            {
                id,

                frame,

                name:
                    marker.name ||
                    "Marker",

                color:
                    marker.color ||
                    null,

                description:
                    marker.description ||
                    "",
            };

        this.markers.set(
            id,
            normalized
        );

        this.emit(
            "markerAdded",
            {
                marker:
                    normalized,
            }
        );

        return normalized;
    }

    removeMarker(
        markerId
    ) {
        const marker =
            this.markers.get(
                markerId
            );

        if (
            !marker
        ) {
            return false;
        }

        this.markers.delete(
            markerId
        );

        this.emit(
            "markerRemoved",
            {
                marker,
            }
        );

        return true;
    }

    getMarker(
        markerId
    ) {
        return this.markers.get(
            markerId
        );
    }

    getMarkers() {
        return [
            ...this.markers.values(),
        ].sort(
            (
                a,
                b
            ) =>
                a.frame -
                b.frame
        );
    }

    getMarkersAtFrame(
        frame,
        tolerance = 0.001
    ) {
        return this.getMarkers().filter(
            (marker) =>
                Math.abs(
                    marker.frame -
                        frame
                ) <=
                tolerance
        );
    }

    addKeyFromValue(
        trackId,
        frame,
        value,
        options = {}
    ) {
        return this.addKey(
            trackId,
            {
                frame,
                value,
                interpolation:
                    options.interpolation ||
                    "linear",
                easing:
                    options.easing ||
                    "none",
            }
        );
    }

    hasKeyAtFrame(
        trackId,
        frame,
        tolerance = 0.001
    ) {
        return this.getKeys(
            trackId
        ).some(
            (key) =>
                Math.abs(
                    key.frame -
                        frame
                ) <=
                tolerance
        );
    }

    getKeyAtFrame(
        trackId,
        frame,
        tolerance = 0.001
    ) {
        return (
            this.getKeys(
                trackId
            ).find(
                (key) =>
                    Math.abs(
                        key.frame -
                            frame
                    ) <=
                    tolerance
            ) || null
        );
    }

    duplicateKey(
        trackId,
        keyId,
        newFrame
    ) {
        const key =
            this.getKey(
                trackId,
                keyId
            );

        if (
            !key
        ) {
            return null;
        }

        return this.addKey(
            trackId,
            {
                ...key,
                id:
                    undefined,
                frame:
                    newFrame,
                value:
                    this.cloneValue(
                        key.value
                    ),
                selected:
                    false,
            }
        );
    }

    duplicateSelectedKeys(
        frameOffset = 1
    ) {
        const selected =
            this.getSelectedKeys();

        const duplicated =
            [];

        this.clearSelection();

        selected.forEach(
            ({
                track,
                key,
            }) => {
                const copy =
                    this.duplicateKey(
                        track.id,
                        key.id,
                        key.frame +
                            frameOffset
                    );

                if (
                    copy
                ) {
                    duplicated.push(
                        {
                            track,
                            key:
                                copy,
                        }
                    );
                }
            }
        );

        duplicated.forEach(
            ({
                track,
                key,
            }) => {
                this.selectKey(
                    track.id,
                    key.id,
                    true,
                    true
                );
            }
        );

        return duplicated;
    }

    shiftKeys(
        offset,
        options = {}
    ) {
        const selectedOnly =
            options.selectedOnly !==
            false;

        let moved =
            0;

        this.tracks.forEach(
            (track) => {
                track.keys.forEach(
                    (key) => {
                        if (
                            selectedOnly &&
                            !this.selectedKeys.has(
                                this.getKeyId(
                                    track.id,
                                    key
                                )
                            )
                        ) {
                            return;
                        }

                        key.frame +=
                            offset;

                        moved +=
                            1;
                    }
                );

                track.keys.sort(
                    (
                        a,
                        b
                    ) =>
                        a.frame -
                        b.frame
                );
            }
        );

        this.emit(
            "changed",
            {
                type:
                    "keysShifted",
                offset,
                moved,
            }
        );

        return moved;
    }

    scaleKeys(
        centerFrame,
        factor,
        options = {}
    ) {
        if (
            !Number.isFinite(
                factor
            )
        ) {
            return 0;
        }

        const selectedOnly =
            options.selectedOnly !==
            false;

        let changed =
            0;

        this.tracks.forEach(
            (track) => {
                track.keys.forEach(
                    (key) => {
                        const selected =
                            this.selectedKeys.has(
                                this.getKeyId(
                                    track.id,
                                    key
                                )
                            );

                        if (
                            selectedOnly &&
                            !selected
                        ) {
                            return;
                        }

                        key.frame =
                            centerFrame +
                            (
                                key.frame -
                                centerFrame
                            ) *
                                factor;

                        changed +=
                            1;
                    }
                );

                track.keys.sort(
                    (
                        a,
                        b
                    ) =>
                        a.frame -
                        b.frame
                );
            }
        );

        this.emit(
            "changed",
            {
                type:
                    "keysScaled",
                centerFrame,
                factor,
                changed,
            }
        );

        return changed;
    }

    serializeValue(
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
            typeof value.toArray ===
            "function"
        ) {
            return {
                __type:
                    value.constructor
                        ?.name ||
                    "ArrayType",

                value:
                    value.toArray(),
            };
        }

        if (
            Array.isArray(
                value
            )
        ) {
            return value.map(
                (item) =>
                    this.serializeValue(
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
                        this.serializeValue(
                            item
                        );
                }
            );

            return result;
        }

        return value;
    }

    toJSON() {
        return {
            fps:
                this.fps,

            startFrame:
                this.startFrame,

            endFrame:
                this.endFrame,

            currentFrame:
                this.currentFrame,

            loopStart:
                this.loopStart,

            loopEnd:
                this.loopEnd,

            loop:
                this.loop,

            playing:
                this.playing,

            tracks:
                this.getTracks().map(
                    (track) => ({
                        ...track,

                        keys:
                            track.keys.map(
                                (key) => ({
                                    ...key,

                                    value:
                                        this.serializeValue(
                                            key.value
                                        ),
                                })
                            ),
                    })
                ),

            markers:
                this.getMarkers().map(
                    (marker) => ({
                        ...marker,
                    })
                ),
        };
    }

    fromJSON(
        data
    ) {
        if (
            !data
        ) {
            return false;
        }

        if (
            Number.isFinite(
                data.fps
            )
        ) {
            this.fps =
                Math.max(
                    1,
                    data.fps
                );
        }

        if (
            Number.isFinite(
                data.startFrame
            )
        ) {
            this.startFrame =
                data.startFrame;
        }

        if (
            Number.isFinite(
                data.endFrame
            )
        ) {
            this.endFrame =
                data.endFrame;
        }

        if (
            Number.isFinite(
                data.currentFrame
            )
        ) {
            this.currentFrame =
                this.clampFrame(
                    data.currentFrame
                );
        }

        if (
            Number.isFinite(
                data.loopStart
            )
        ) {
            this.loopStart =
                data.loopStart;
        }

        if (
            Number.isFinite(
                data.loopEnd
            )
        ) {
            this.loopEnd =
                data.loopEnd;
        }

        if (
            typeof data.loop ===
            "boolean"
        ) {
            this.loop =
                data.loop;
        }

        this.tracks.clear();
        this.markers.clear();
        this.clearSelection();

        if (
            Array.isArray(
                data.tracks
            )
        ) {
            data.tracks.forEach(
                (track) =>
                    this.addTrack(
                        track
                    )
            );
        }

        if (
            Array.isArray(
                data.markers
            )
        ) {
            data.markers.forEach(
                (marker) =>
                    this.addMarker(
                        marker
                    )
            );
        }

        this.emit(
            "changed",
            {
                type:
                    "loaded",
            }
        );

        return true;
    }

    clear() {
        this.tracks.clear();
        this.markers.clear();
        this.selectedKeys.clear();

        this.currentFrame =
            this.startFrame;

        this.playing =
            false;

        this.emit(
            "changed",
            {
                type:
                    "clear",
            }
        );
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
                            `TimelineData event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.pause();
        this.clear();

        this.listeners = {
            changed: [],
            frameChanged: [],
            trackAdded: [],
            trackRemoved: [],
            keyAdded: [],
            keyRemoved: [],
            markerAdded: [],
            markerRemoved: [],
        };
    }
}
