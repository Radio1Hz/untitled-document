import { TrackState } from './track-model.js';

/**
 * Represents playback modes for the track player
 */
const PlaybackMode = {
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    STOPPED: 'STOPPED',
    LOADING: 'LOADING'  // Added new state
};

/**
 * Represents a track player: Π = (Θ, Ψ, ρ, ν)
 */
class TrackPlayer {
    /**
     * @param {Track} initialTrack - Initial track to play
     * @param {number} speed - Playback speed multiplier
     * @param {number} predelay_ms - Milliseconds to delay time counting after play (default 500ms)
     * @param {boolean} looping - Whether track should loop by default (default true)
     * @param {number} screen_to_dot_ratio - Ratio for screen width to dot width (default 25)
     */
    constructor(initialTrack, speed = 1.0, predelay_ms = 500, looping = true, screen_to_dot_ratio = 25) {
        this.playlist = [];  // Initialize empty playlist
        this.currentTrackIndex = -1;
        this.currentTrack = null;
        this.state = null;
        this.mode = PlaybackMode.STOPPED;
        this.speed = speed;
        this.time = 0;
        this.accumulatedTime = 0;
        this.predelay_ms = predelay_ms;
        this.looping = looping;  // Add looping property
        this.screen_to_dot_ratio = screen_to_dot_ratio;
        this.transitionTimes = [];  // Array to store transition times
        
        if (initialTrack) {
            this.addTrack(initialTrack);
            this.calculateTransitionTimes();  // Calculate times when track is added
        }
        
        // Initialize world time tracking if tau_omega is present
        if (initialTrack && initialTrack.tau_omega) {
            this.worldTimeStart = new Date(initialTrack.tau_omega);
        }
    }

    /**
     * Add track to playlist
     * @param {Track} track - Track to add
     */
    addTrack(track) {
        this.playlist.push(track);
        if (this.currentTrackIndex === -1) {
            this.selectTrack(0);
        }
    }

    /**
     * Remove track from playlist
     * @param {number} index - Index of track to remove
     */
    removeTrack(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.playlist.splice(index, 1);
            if (index === this.currentTrackIndex) {
                this.currentTrackIndex = Math.min(index, this.playlist.length - 1);
                this.currentTrack = this.playlist[this.currentTrackIndex] || null;
                this.state = this.currentTrack ? new TrackState() : null;
            }
        }
    }

    /**
     * Select track from playlist
     * @param {number} index - Index of track to select
     */
    async selectTrack(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.mode = PlaybackMode.LOADING;
            this.currentTrackIndex = index;
            this.currentTrack = this.playlist[index];
            this.state = new TrackState();
            this.time = 0;
            this.accumulatedTime = 0;
            this.calculateTransitionTimes();  // Recalculate transitions for new track
            this.mode = PlaybackMode.STOPPED;
        }
    }

    /**
     * Start or resume playback
     * @returns {TrackPlayer} Updated player instance
     */
    play() {
        if (!this.state || !this.state.isValid(this.currentTrack)) {
            this.state = new TrackState();
        }
        if (this.transitionTimes.length === 0) {
            this.calculateTransitionTimes();
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
        this.state = null;
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
            const previousTime = this.time;
            this.time += deltaTime * this.speed;
            
            // Find all transitions that should occur between previousTime and current time
            const relevantTransitions = this.transitionTimes.filter(t => 
                t.time > previousTime && t.time <= this.time
            );
            
            // Apply the last relevant transition (most recent state)
            if (relevantTransitions.length > 0) {
                const lastTransition = relevantTransitions[relevantTransitions.length - 1];
                console.log(`Transitioning to state (${lastTransition.state.i},${lastTransition.state.j},${lastTransition.state.k}) at time ${lastTransition.time.toFixed(3)}s`);
                
                this.state = new TrackState(
                    lastTransition.state.i,
                    lastTransition.state.j,
                    lastTransition.state.k
                );
            }
            
            // Check if we've reached the end
            if (this.time >= this.transitionTimes[this.transitionTimes.length - 1].time) {
                if (this.looping) {
                    this.time = 0;
                    this.state = new TrackState();
                } else {
                    this.stop();
                }
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
        return this.currentTrack.totalDuration() - this.currentTime();
    }

    /**
     * Seek to specific time
     * @param {number} time - Target time in seconds
     * @returns {TrackPlayer} Updated player instance
     */
    seek(time) {
        if (time < 0 || time > this.currentTrack.totalDuration()) {
            return this;
        }

        let currentTime = 0;
        let state = new TrackState();

        while (currentTime < time) {
            const nextState = state.advance(this.currentTrack);
            if (!nextState) break;

            const nextTime = nextState.absoluteTime(this.currentTrack);
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
        if (sectionIndex >= 0 && sectionIndex < this.currentTrack.sections.length) {
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
            this.state &&
            this.state.isValid(this.currentTrack) &&
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

    calculateStateForTime(time) {
        const totalTau = Math.floor(time / this.currentTrack.tau);
        let remainingTau = totalTau;
        let i = 0, j = 0, k = 0;
        
        // Calculate state based on time
        for (i = 0; i < this.currentTrack.sections.length; i++) {
            const section = this.currentTrack.sections[i];
            for (j = 0; j < section.timeboxes.length; j++) {
                const boxDuration = this.currentTrack.n;
                if (remainingTau < boxDuration) {
                    k = remainingTau;
                    return new TrackState(i, j, k);
                }
                remainingTau -= boxDuration;
            }
        }
        
        // If we've gone past the end and looping is enabled, wrap around to start
        if (this.looping) {
            return new TrackState(0, 0, 0);
        }
        
        // If not looping, return the last valid state
        return new TrackState(
            this.currentTrack.sections.length - 1,
            this.currentTrack.sections[this.currentTrack.sections.length - 1].timeboxes.length - 1,
            this.currentTrack.n - 1
        );
    }

    seekTo(time) {
        const transition = this.transitionTimes.reduce((prev, curr) => {
            return Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev;
        });
        
        this.state = new TrackState(
            transition.state.i,
            transition.state.j,
            transition.state.k
        );
        this.time = time;
    }

    /**
     * Get current world time if track has tau_omega defined
     * @returns {Date|null} Current world time or null if not anchored
     */
    currentWorldTime() {
        if (!this.worldTimeStart) return null;
        
        const elapsed = this.time * 1000; // Convert to milliseconds
        return new Date(this.worldTimeStart.getTime() + elapsed);
    }

    /**
     * Get track metadata including dedication if present
     * @returns {Object} Track metadata
     */
    getMetadata() {
        return {
            id: this.currentTrack.id,
            description: this.currentTrack.description,
            worldTimeAnchor: this.currentTrack.tau_omega,
            dedication: this.currentTrack.dedication,
            duration: this.currentTrack.totalDuration()
        };
    }

    /**
     * Calculate all state transition times for the current track
     */
    calculateTransitionTimes() {
        if (!this.currentTrack) return;
        
        this.transitionTimes = [];
        
        // Iterate through sections
        this.currentTrack.sections.forEach((section, i) => {
            // Iterate through timeboxes
            section.timeboxes.forEach((timebox, j) => {
                // For each timebox, create states for each position
                const nT = timebox.getEffectiveN(this.currentTrack);
                for (let k = 0; k < nT; k++) {
                    this.transitionTimes.push({
                        time: timebox.tStart * this.currentTrack.tau + (k * this.currentTrack.tau),
                        state: new TrackState(i, j, k)
                    });
                }
            });
        });

        // Sort transitions by time
        this.transitionTimes.sort((a, b) => a.time - b.time);

        // Log the transition times array
        console.log('State transition times calculated:', 
            this.transitionTimes.map(t => ({
                time: t.time.toFixed(3),
                state: `(${t.state.i},${t.state.j},${t.state.k})`,
                realTime: `${Math.floor(t.time/60)}:${(t.time%60).toFixed(1)}`
            }))
        );
    }
}

export { PlaybackMode, TrackPlayer }; 