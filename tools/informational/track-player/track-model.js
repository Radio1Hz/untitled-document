/**
 * Represents a time unit (τ) - an indivisible temporal interval
 */
class TimeUnit {
    /**
     * @param {number} duration - Duration in seconds
     */
    constructor(duration = 0.5) {
        if (duration <= 0) throw new Error("Time unit must be positive");
        this.duration = duration;
    }
}

/**
 * Represents a contiguous interval within a track: T = (desc, nT)
 */
class TimeBox {
    /**
     * @param {Object|string} desc - Description of timebox content in multiple languages
     * @param {number} [nT] - Number of time units for this timebox (optional)
     * @param {string|null} [imageUrl] - URL of the timebox image (optional)
     */
    constructor(desc = "", nT = undefined, imageUrl = null) {
        this.nT = nT;  // Number of time units for this timebox
        this.imageUrl = imageUrl;  // Add imageUrl property
        // Ensure desc is an object with language keys
        this.desc = (typeof desc === 'object' && desc !== null) ? desc : {
            en: desc || "",
            zh: desc || "",
            ru: desc || "",
            ar: desc || ""
        };
    }

    /**
     * Calculate duration of timebox in seconds
     * @param {number} tau - Time unit duration
     * @param {Track} track - Track context for default n value
     * @returns {number} Duration in seconds
     */
    duration(tau, track) {
        return tau * this.getEffectiveN(track);
    }

    /**
     * Get effective number of time units for this timebox
     * @param {Track} track - Parent track for default n value
     * @returns {number} Number of time units
     */
    getEffectiveN(track) {
        return this.nT !== undefined ? this.nT : track.n;
    }
}

/**
 * Represents a track state: Ψ = (i, j, k)
 */
class TrackState {
    /**
     * @param {number} i - Section index
     * @param {number} j - Timebox index within section
     * @param {number} k - Time unit index within timebox
     */
    constructor(i = 0, j = 0, k = 0) {
        this.i = i;  // section index
        this.j = j;  // timebox index
        this.k = k;  // time unit index
    }

    /**
     * Advance state according to track structure
     * @param {Track} track - Track context
     * @returns {TrackState|undefined} New state or undefined if at end
     */
    advance(track) {
        // Validate current state first
        if (this.i >= track.sections.length) {
            //console.log('Invalid section index:', this.i);
            return undefined;
        }

        const section = track.sections[this.i];
        if (!section) {
            //console.log('Section not found:', this.i);
            return undefined;
        }

        const timebox = section.timeboxes[this.j];
        if (!timebox) {
            //console.log('Timebox not found:', this.j);
            return undefined;
        }

        // Get number of time units for current timebox
        const effectiveN = timebox.getEffectiveN(track);

        // Try to advance within current timebox
        if (this.k + 1 < effectiveN) {
            return new TrackState(this.i, this.j, this.k + 1);
        }

        // Try to move to next timebox
        if (this.j + 1 < section.timeboxes.length) {
            return new TrackState(this.i, this.j + 1, 0);
        }

        // Try to move to next section
        if (this.i + 1 < track.sections.length) {
            // Verify next section exists and has timeboxes
            const nextSection = track.sections[this.i + 1];
            if (nextSection && nextSection.timeboxes.length > 0) {
                return new TrackState(this.i + 1, 0, 0);
            } else {
                //console.log('Next section invalid:', this.i + 1);
                return undefined;
            }
        }

        // We've reached the end of the track
        //console.log('End of track reached');
        return undefined;
    }

    /**
     * Rewind state according to track structure
     * @param {Track} track - Track context
     * @returns {TrackState|undefined} New state or undefined if at start
     */
    rewind(track) {
        if (this.k > 0) {
            return new TrackState(this.i, this.j, this.k - 1);
        }

        if (this.j > 0) {
            const prevBox = track.sections[this.i].timeboxes[this.j - 1];
            // Use previous timebox's effective nT
            const prevN = prevBox.getEffectiveN(track);
            return new TrackState(this.i, this.j - 1, prevN - 1);
        }

        if (this.i > 0) {
            const prevSection = track.sections[this.i - 1];
            const lastBox = prevSection.timeboxes[prevSection.timeboxes.length - 1];
            // Use last timebox's effective nT
            const lastN = lastBox.getEffectiveN(track);
            return new TrackState(
                this.i - 1, 
                prevSection.timeboxes.length - 1, 
                lastN - 1
            );
        }

        return undefined;
    }

    /**
     * Calculate absolute time for this state
     * @param {Track} track - Track context
     * @returns {number} Time in seconds
     */
    absoluteTime(track) {
        let time = track.delta;

        // Add duration of previous sections
        for (let x = 0; x < this.i; x++) {
            const section = track.sections[x];
            for (const box of section.timeboxes) {
                time += box.duration(track.tau, track);
            }
        }

        // Add duration of previous timeboxes in current section
        const section = track.sections[this.i];
        for (let y = 0; y < this.j; y++) {
            const box = section.timeboxes[y];
            time += box.duration(track.tau, track);
        }

        // Add current timebox partial duration
        time += this.k * track.tau;

        return time;
    }

    /**
     * Validate state against track structure
     * @param {Track} track - Track context
     * @returns {boolean} True if state is valid
     */
    isValid(track) {
        if (this.i >= track.sections.length) return false;
        
        const section = track.sections[this.i];
        if (this.j >= section.timeboxes.length) return false;
        
        const timebox = section.timeboxes[this.j];
        if (this.k >= timebox.n) return false;
        
        return true;
    }
}

/**
 * Represents an ordered sequence of timeboxes: S = <T₁, T₂, ..., Tₖ>
 */
class Section {
    /**
     * @param {Object} desc - Multilingual description object with language codes as keys
     * @param {string} imageUrl - URL of the section image
     */
    constructor(desc, imageUrl = '') {
        this.desc = desc;  // Changed from string to object to support multiple languages
        this.imageUrl = imageUrl;
        this.timeboxes = [];
    }

    /**
     * Add a timebox to this section
     * @param {number} tStart - Start time
     * @param {Object} desc - Multilingual description object
     * @returns {Section} This section instance
     */
    addTimebox(tStart, desc) {
        const timebox = new TimeBox(desc);
        this.timeboxes.push(timebox);
        return this;
    }

    /**
     * Calculate total duration of section
     * @param {number} tau - Time unit duration
     * @param {number} n - Number of time units per box
     * @returns {number} Duration in seconds
     */
    duration(tau, n) {
        return this.timeboxes.reduce((sum, box) => sum + box.duration(tau, n), 0);
    }

    // Helper to get timebox at specific time
    getTimeboxAtTime(time, tau) {
        let accumulatedTime = 0;
        for (let i = 0; i < this.timeboxes.length; i++) {
            const timebox = this.timeboxes[i];
            const start = accumulatedTime;
            const end = start + (timebox.nT * tau);
            
            if (time >= start && time < end) {
                return {
                    timebox,
                    index: i,
                    startTime: start,
                    endTime: end
                };
            }
            accumulatedTime = end;
        }
        return null;
    }
}

/**
 * Represents a complete track: Θ = (id, desc, τ, δ, n, <S₁, S₂, ..., Sₘ>)
 */
class Track {
    /**
     * @param {Object} params - Track parameters
     * @param {string} params.id - Track ID
     * @param {Object} params.description - Multilingual track description
     * @param {number} params.tau - Time unit (τ)
     * @param {number} params.delta - Time quantum (δ)
     * @param {number} params.n - Positions per timebox
     * @param {string} [params.tau_omega] - World time anchor point (τω)
     * @param {string} [params.dedication] - Optional dedication text
     * @param {string} [params.audioUrl] - URL to the track's audio file
     */
    constructor({ id, description, tau, delta, n, tau_omega, dedication, audioUrl }) {
        this.id = id;
        this.description = description;
        this.tau = tau;
        this.delta = delta;
        this.n = n;
        this.tau_omega = tau_omega;
        this.dedication = dedication;
        this.audioUrl = audioUrl;
        this.sections = [];
        this.state = new TrackState();
    }

    /**
     * Add a section to this track
     * @param {Object} desc - Multilingual section description
     * @param {string} imageUrl - URL of the section image
     * @returns {Section} The newly created section
     */
    addSection(desc, imageUrl = '') {
        const section = new Section(desc, imageUrl);
        this.sections.push(section);
        return section;
    }

    /**
     * Add a timebox to a section
     * @param {Section} section - Section to add timebox to
     * @param {number} tStart - Start time
     * @param {Object|string} description - Description
     * @param {number} [nT] - Optional number of time units (defaults to track's n)
     */
    addTimeboxToSection(section, tStart, description, nT = undefined) {
        const timebox = new TimeBox(description, nT);
        section.timeboxes.push(timebox);
        return timebox;
    }

    /**
     * Calculate total duration of track
     * @returns {number} Total duration in seconds
     */
    totalDuration() {
        let duration = this.delta;
        for (const section of this.sections) {
            for (const timebox of section.timeboxes) {
                duration += timebox.getEffectiveN(this) * this.tau;
            }
        }
        return duration;
    }

    /**
     * Validate track structure
     * @returns {boolean} True if track structure is valid
     */
    validate() {
        for (const section of this.sections) {
            for (let i = 0; i < section.timeboxes.length - 1; i++) {
                const currentBox = section.timeboxes[i];
                const nextBox = section.timeboxes[i + 1];
                const expectedStart = currentBox.duration(this.tau, this);
                
                if (Math.abs(nextBox.duration(this.tau, this) - expectedStart) > 1e-6) {
                    return false;
                }
            }
        }

        // Validate tau_omega format if present
        if (this.tau_omega) {
            const tau_omega_regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{2}$/;
            if (!tau_omega_regex.test(this.tau_omega)) {
                return false;
            }
        }

        return true;
    }
}

export { TimeUnit, TimeBox, TrackState, Section, Track }; 