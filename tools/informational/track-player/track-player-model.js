import { TrackState } from './track-model.js';

/**
 * Represents playback modes for the track player
 */
const PlaybackMode = {
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    STOPPED: 'STOPPED'
};

/**
 * Represents a track player: Π = (Θ, Ψ, ρ, ν)
 */
class TrackPlayer {
    /**
     * @param {Track} track - Track to play
     * @param {number} speed - Playback speed multiplier
     */
    constructor(track, speed = 1.0) {
        this.track = track;           // Θ (track being played)
        this.state = track.state;     // Ψ (current track state)
        this.mode = PlaybackMode.STOPPED;  // ρ (playback mode)
        this.speed = speed;           // ν (speed multiplier)
        this.time = 0;
        this.accumulatedTime = 0;  // Add accumulator for time quantization
    }

    /**
     * Start or resume playback
     * @returns {TrackPlayer} Updated player instance
     */
    play() {
        if (!this.state.isValid(this.track)) {
            this.state = new TrackState();
        }
        this.mode = PlaybackMode.PLAYING;
        return this;
    }

    /**
     * Pause playback
     * @returns {TrackPlayer} Updated player instance
     */
    pause() {
        this.mode = PlaybackMode.PAUSED;
        return this;
    }

    /**
     * Stop playback and reset state
     * @returns {TrackPlayer} Updated player instance
     */
    stop() {
        this.mode = PlaybackMode.STOPPED;
        this.state = new TrackState();
        this.time = 0;
        this.accumulatedTime = 0;
        return this;
    }

    /**
     * Set playback speed
     * @param {number} newSpeed - New speed multiplier
     * @returns {TrackPlayer} Updated player instance
     */
    setSpeed(newSpeed) {
        if (newSpeed > 0) {
            this.speed = newSpeed;
        }
        return this;
    }

    /**
     * Update player state based on elapsed time
     * @param {number} deltaTime - Elapsed time since last update
     * @returns {TrackPlayer} Updated player instance
     */
    tick(deltaTime) {
        if (this.mode === PlaybackMode.PLAYING) {
            this.time += deltaTime * this.speed;
            this.accumulatedTime += deltaTime * this.speed;

            // Get current timebox duration
            const currentSection = this.track.sections[this.state.i];
            if (!currentSection) return this;

            const currentBox = currentSection.timeboxes[this.state.j];
            if (!currentBox) return this;

            // Use tau (time unit) instead of full box duration
            const timeUnit = this.track.tau;
            
            // Check if we've accumulated enough time to advance state
            while (this.accumulatedTime >= timeUnit) {  // Changed from boxDuration to timeUnit
                const nextState = this.state.advance(this.track);
                if (!nextState) {
                    console.log(`Track state: End of track reached. Stopping.`);
                    this.stop();
                    break;
                }
                
                // Log state transition
                console.log(`Track state changed: (${this.state.i},${this.state.j},${this.state.k}) -> (${nextState.i},${nextState.j},${nextState.k}) at time ${this.time.toFixed(2)}s`);
                
                this.state = nextState;
                this.accumulatedTime -= timeUnit;  // Subtract time unit instead of box duration
            }

            if (this.time >= this.track.totalDuration()) {
                this.time = this.track.totalDuration();
                this.stop();
            }
        }
        return this;
    }

    /**
     * Get current playback time
     * @returns {number} Current time in seconds
     */
    currentTime() {
        return this.time;
    }

    /**
     * Get remaining playback time
     * @returns {number} Remaining time in seconds
     */
    remainingTime() {
        return this.track.totalDuration() - this.currentTime();
    }

    /**
     * Seek to specific time
     * @param {number} time - Target time in seconds
     * @returns {TrackPlayer} Updated player instance
     */
    seek(time) {
        if (time < 0 || time > this.track.totalDuration()) {
            return this;
        }

        let currentTime = 0;
        let state = new TrackState();

        while (currentTime < time) {
            const nextState = state.advance(this.track);
            if (!nextState) break;

            const nextTime = nextState.absoluteTime(this.track);
            if (nextTime > time) break;

            state = nextState;
            currentTime = nextTime;
        }

        this.state = state;
        return this;
    }

    /**
     * Jump to specific section
     * @param {number} sectionIndex - Target section index
     * @returns {TrackPlayer} Updated player instance
     */
    jumpToSection(sectionIndex) {
        if (sectionIndex >= 0 && sectionIndex < this.track.sections.length) {
            this.state = new TrackState(sectionIndex, 0, 0);
        }
        return this;
    }

    /**
     * Check if player state is valid
     * @returns {boolean} True if player state is valid
     */
    isValid() {
        return (
            this.state.isValid(this.track) &&
            this.speed > 0 &&
            Object.values(PlaybackMode).includes(this.mode)
        );
    }

    /**
     * Create event dispatcher for player state changes
     * @returns {function} Dispatcher function
     */
    createEventDispatcher() {
        const listeners = new Set();
        
        return {
            subscribe: (callback) => {
                listeners.add(callback);
                return () => listeners.delete(callback);
            },
            dispatch: () => {
                const event = {
                    currentTime: this.currentTime(),
                    remainingTime: this.remainingTime(),
                    mode: this.mode,
                    speed: this.speed,
                    state: this.state
                };
                listeners.forEach(callback => callback(event));
            }
        };
    }
}

export { PlaybackMode, TrackPlayer }; 