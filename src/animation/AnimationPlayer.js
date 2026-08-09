import * as THREE from "three";

export default class AnimationPlayer {
    constructor(options = {}) {
        this.timeline =
            options.timeline || null;

        this.scene =
            options.scene || null;

        this.mixer =
            options.mixer || null;

        this.target =
            options.target || null;

        this.playing =
            false;

        this.speed =
            Number.isFinite(
                options.speed
            )
                ? options.speed
                : 1;

        this.time =
            0;

        this.lastTime =
            0;

        this.animation =
            null;

        this.clip =
            null;

        this.action =
            null;

        this.clock =
            new THREE.Clock();

        this.listeners = {
            play: [],
            pause: [],
            stop: [],
            update: [],
            frameChanged: [],
            animationChanged: [],
            finished: [],
        };

        this._boundUpdate =
            this.update.bind(
                this
            );

        this._raf =
            null;
    }

    setTimeline(
        timeline
    ) {
        this.timeline =
            timeline || null;

        return this;
    }

    setTarget(
        target
    ) {
        this.target =
            target || null;

        return this;
    }

    setMixer(
        mixer
    ) {
        this.mixer =
            mixer || null;

        return this;
    }

    setSpeed(
        speed
    ) {
        if (
            !Number.isFinite(
                speed
            )
        ) {
            return false;
        }

        this.speed =
            speed;

        return true;
    }

    getSpeed() {
        return this.speed;
    }

    loadClip(
        clip
    ) {
        if (
            !clip
        ) {
            return false;
        }

        this.stop();

        this.clip =
            clip;

        if (
            this.mixer
        ) {
            this.action =
                this.mixer.clipAction(
                    clip
                );

            this.action.enabled =
                true;

            this.action.clampWhenFinished =
                true;

            this.action.setLoop(
                THREE.LoopRepeat,
                Infinity
            );
        }

        this.emit(
            "animationChanged",
            {
                clip,
            }
        );

        return true;
    }

    loadAnimation(
        animation
    ) {
        if (
            !animation
        ) {
            return false;
        }

        this.animation =
            animation;

        if (
            animation.clip
        ) {
            this.loadClip(
                animation.clip
            );
        }

        return true;
    }

    clearAnimation() {
        this.stop();

        this.animation =
            null;

        this.clip =
            null;

        this.action =
            null;

        this.emit(
            "animationChanged",
            {
                clip:
                    null,
            }
        );
    }

    play() {
        if (
            this.playing
        ) {
            return;
        }

        this.playing =
            true;

        this.clock.start();

        if (
            this.action
        ) {
            this.action
                .reset()
                .play();

            this.action.time =
                this.time;
        }

        if (
            this.timeline
        ) {
            this.timeline.play();
        }

        this.emit(
            "play",
            {
                time:
                    this.time,
            }
        );

        this.startLoop();
    }

    pause() {
        if (
            !this.playing
        ) {
            return;
        }

        this.playing =
            false;

        if (
            this.action
        ) {
            this.action.paused =
                true;
        }

        if (
            this.timeline
        ) {
            this.timeline.pause();
        }

        this.clock.stop();

        this.stopLoop();

        this.emit(
            "pause",
            {
                time:
                    this.time,
            }
        );
    }

    stop() {
        const wasPlaying =
            this.playing;

        this.playing =
            false;

        this.time =
            0;

        this.lastTime =
            0;

        if (
            this.action
        ) {
            this.action.stop();
            this.action.reset();
        }

        if (
            this.timeline
        ) {
            this.timeline.pause();

            this.timeline.setCurrentFrame(
                this.timeline.startFrame
            );
        }

        this.clock.stop();

        this.stopLoop();

        this.emit(
            "stop",
            {
                wasPlaying,
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

    seek(
        time,
        options = {}
    ) {
        if (
            !Number.isFinite(
                time
            )
        ) {
            return false;
        }

        this.time =
            Math.max(
                0,
                time
            );

        if (
            this.clip
        ) {
            const duration =
                this.clip.duration;

            if (
                duration >
                0
            ) {
                if (
                    this.timeline?.loop
                ) {
                    this.time =
                        this.time %
                        duration;
                } else {
                    this.time =
                        Math.min(
                            this.time,
                            duration
                        );
                }
            }
        }

        if (
            this.action
        ) {
            this.action.time =
                this.time;
        }

        if (
            this.timeline
        ) {
            const frame =
                this.timeline.secondsToFrame(
                    this.time
                );

            this.timeline.setCurrentFrame(
                frame,
                {
                    force:
                        options.force ===
                        true,
                }
            );
        }

        this.emit(
            "frameChanged",
            {
                time:
                    this.time,
            }
        );

        return true;
    }

    seekFrame(
        frame
    ) {
        if (
            !this.timeline
        ) {
            return false;
        }

        return this.seek(
            this.timeline.frameToSeconds(
                frame
            )
        );
    }

    getTime() {
        return this.time;
    }

    getCurrentFrame() {
        if (
            !this.timeline
        ) {
            return 0;
        }

        return this.timeline.getCurrentFrame();
    }

    getDuration() {
        if (
            this.clip
        ) {
            return this.clip.duration;
        }

        if (
            this.timeline
        ) {
            return this.timeline.getDurationSeconds();
        }

        return 0;
    }

    update(
        deltaSeconds = null
    ) {
        let delta =
            deltaSeconds;

        if (
            delta === null
        ) {
            delta =
                this.clock.getDelta();
        }

        if (
            !Number.isFinite(
                delta
            )
        ) {
            delta =
                0;
        }

        delta *=
            this.speed;

        if (
            this.mixer
        ) {
            this.mixer.update(
                delta
            );
        }

        if (
            !this.playing
        ) {
            return;
        }

        this.time +=
            delta;

        const duration =
            this.getDuration();

        if (
            duration >
            0 &&
            this.time >=
                duration
        ) {
            if (
                this.timeline?.loop
            ) {
                this.time =
                    this.time %
                    duration;
            } else {
                this.time =
                    duration;

                this.playing =
                    false;

                if (
                    this.timeline
                ) {
                    this.timeline.pause();
                }

                this.emit(
                    "finished",
                    {
                        time:
                            this.time,
                    }
                );
            }
        }

        if (
            this.action
        ) {
            this.action.time =
                this.time;
        }

        if (
            this.timeline
        ) {
            const frame =
                this.timeline.secondsToFrame(
                    this.time
                );

            this.timeline.setCurrentFrame(
                frame
            );
        }

        this.emit(
            "update",
            {
                delta,
                time:
                    this.time,
                frame:
                    this.getCurrentFrame(),
            }
        );
    }

    startLoop() {
        if (
            this._raf !==
            null
        ) {
            return;
        }

        const loop =
            () => {
                if (
                    !this.playing
                ) {
                    this._raf =
                        null;

                    return;
                }

                this.update();

                this._raf =
                    requestAnimationFrame(
                        loop
                    );
            };

        this._raf =
            requestAnimationFrame(
                loop
            );
    }

    stopLoop() {
        if (
            this._raf !==
            null
        ) {
            cancelAnimationFrame(
                this._raf
            );

            this._raf =
                null;
        }
    }

    updateFromTimeline() {
        if (
            !this.timeline
        ) {
            return;
        }

        const frame =
            this.timeline.getCurrentFrame();

        const time =
            this.timeline.frameToSeconds(
                frame
            );

        this.seek(
            time
        );
    }

    addAnimationClip(
        clip
    ) {
        if (
            !clip
        ) {
            return false;
        }

        if (
            !this.animation
        ) {
            this.animation = {
                name:
                    "Animation",
                clips: [],
            };
        }

        if (
            !Array.isArray(
                this.animation.clips
            )
        ) {
            this.animation.clips =
                [];
        }

        this.animation.clips.push(
            clip
        );

        if (
            !this.clip
        ) {
            this.loadClip(
                clip
            );
        }

        return true;
    }

    removeAnimationClip(
        clip
    ) {
        if (
            !this.animation ||
            !Array.isArray(
                this.animation.clips
            )
        ) {
            return false;
        }

        const index =
            this.animation.clips.indexOf(
                clip
            );

        if (
            index ===
            -1
        ) {
            return false;
        }

        this.animation.clips.splice(
            index,
            1
        );

        if (
            this.clip ===
            clip
        ) {
            this.clearAnimation();
        }

        return true;
    }

    getAnimationClips() {
        if (
            !this.animation ||
            !Array.isArray(
                this.animation.clips
            )
        ) {
            return [];
        }

        return this.animation.clips;
    }

    setLoop(
        enabled
    ) {
        if (
            this.timeline
        ) {
            this.timeline.setLoop(
                enabled
            );
        }

        if (
            this.action
        ) {
            this.action.setLoop(
                enabled
                    ? THREE.LoopRepeat
                    : THREE.LoopOnce,
                enabled
                    ? Infinity
                    : 1
            );
        }

        return this;
    }

    setFrameRate(
        fps
    ) {
        if (
            this.timeline
        ) {
            this.timeline.setFPS(
                fps
            );
        }

        return this;
    }

    reset() {
        this.seek(
            0
        );

        if (
            this.action
        ) {
            this.action.reset();
        }
    }

    getState() {
        return {
            playing:
                this.playing,

            time:
                this.time,

            frame:
                this.getCurrentFrame(),

            duration:
                this.getDuration(),

            speed:
                this.speed,

            clip:
                this.clip
                    ? this.clip.name
                    : null,
        };
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
                            `AnimationPlayer event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.stopLoop();

        this.playing =
            false;

        if (
            this.action
        ) {
            this.action.stop();
        }

        this.action =
            null;

        this.clip =
            null;

        this.animation =
            null;

        this.mixer =
            null;

        this.timeline =
            null;

        this.target =
            null;

        this.listeners = {
            play: [],
            pause: [],
            stop: [],
            update: [],
            frameChanged: [],
            animationChanged: [],
            finished: [],
        };
    }
}
