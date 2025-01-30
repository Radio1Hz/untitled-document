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
     */
    constructor(initialTrack, speed = 1.0, predelay_ms = 0, looping = true) {
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
     * @param {Track} track - Track to select
     */
    selectTrack(track) {
        this.mode = PlaybackMode.LOADING;
        this.currentTrack = track;
        this.state = new TrackState();
        this.time = 0;
        this.accumulatedTime = 0;
        
        // Reset tau_omega to the track's value
        if (track.tau_omega) {
            this.worldTimeStart = new Date(track.tau_omega);
        }
        
        this.calculateTransitionTimes();
        this.mode = PlaybackMode.STOPPED;
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
                //console.log(`Transitioning to state (${lastTransition.state.i},${lastTransition.state.j},${lastTransition.state.k}) at time ${lastTransition.time.toFixed(3)}s`);
                
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
                console.log('Event subscription added');
                listeners.add(callback);
                return () => listeners.delete(callback);
            },
            dispatch: () => {
                // Calculate current time based on state if available
                const currentTime = this.state ? 
                    this.state.absoluteTime(this.currentTrack) : 
                    this.time;
                    
                const event = {
                    currentTime,
                    remainingTime: this.remainingTime(),
                    totalDuration: this.currentTrack.totalDuration(),
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
        let totalAccumulatedTime = 0;  // Track total time across all sections
        
        // Iterate through sections
        this.currentTrack.sections.forEach((section, i) => {
            // Iterate through timeboxes
            section.timeboxes.forEach((timebox, j) => {
                // For each timebox, create states for each position
                const nT = timebox.getEffectiveN(this.currentTrack);
                for (let k = 0; k < nT; k++) {
                    this.transitionTimes.push({
                        time: totalAccumulatedTime + (k * this.currentTrack.tau),
                        state: new TrackState(i, j, k)
                    });
                }
                totalAccumulatedTime += nT * this.currentTrack.tau;
            });
        });

        // Sort transitions by time
        this.transitionTimes.sort((a, b) => a.time - b.time);
        
        // Debug log
        console.log('State transition times:', this.transitionTimes.map(t => ({
            time: t.time.toFixed(2),
            state: `(${t.state.i},${t.state.j},${t.state.k})`
        })));
    }

    getCurrentTimebox() {
        const section = this.getCurrentSection();
        if (!section) return null;
        
        return section.getTimeboxAtTime(this.time, this.currentTrack.tau);
    }

    checkStateTransitions() {
        if (!this.transitionTimes || !this.transitionTimes.length) return;
        
        // Find the appropriate transition for current time
        const currentTransition = this.transitionTimes.find(t => 
            t.time <= this.time && 
            t.time + this.currentTrack.tau > this.time
        );
        
        if (currentTransition && !this.state.equals(currentTransition.state)) {
            console.log(`Transitioning to state ${currentTransition.state.i},${currentTransition.state.j},${currentTransition.state.k} at time ${this.time.toFixed(2)}`);
            this.state = currentTransition.state;
        }
    }
}

export { PlaybackMode, TrackPlayer }; 