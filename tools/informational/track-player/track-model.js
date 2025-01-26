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
 * Represents a contiguous interval within a track: T = (t_start, desc)
 */
class TimeBox {
    /**
     * @param {number} tStart - Start time relative to track's origin
     * @param {Object|string} desc - Description of timebox content in multiple languages
     * @param {number} [nT] - Number of time units for this timebox (optional)
     */
    constructor(tStart, desc = "", nT = undefined) {
        this.tStart = tStart;
        this.nT = nT;  // This is correctly storing the nT value
        // Ensure desc is an object with language keys
        this.desc = (typeof desc === 'string') ? {
            en: desc,
            zh: desc,
            ru: desc,
            ar: desc
        } : desc;
    }

    /**
     * Get effective number of time units for this timebox
     * @param {Track} track - Parent track for default n value
     * @returns {number} Number of time units
     */
    getEffectiveN(track) {
        return this.nT !== undefined ? this.nT : track.n;
    }

    /**
     * Calculate duration of timebox in seconds
     * @param {number} tau - Time unit duration
     * @param {number} n - Number of time units
     * @returns {number} Duration in seconds
     */
    duration(tau, n) {
        return tau * n;  // Changed from this.n to use track's n parameter
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
        const section = track.sections[this.i];
        if (!section) return undefined;

        const timebox = section.timeboxes[this.j];
        if (!timebox) return undefined;

        if (this.k + 1 < track.n) {
            return new TrackState(this.i, this.j, this.k + 1);
        }

        if (this.j + 1 < section.timeboxes.length) {
            return new TrackState(this.i, this.j + 1, 0);
        }

        if (this.i + 1 < track.sections.length) {
            return new TrackState(this.i + 1, 0, 0);
        }

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
            return new TrackState(this.i, this.j - 1, track.n - 1);
        }

        if (this.i > 0) {
            const prevSection = track.sections[this.i - 1];
            return new TrackState(
                this.i - 1, 
                prevSection.timeboxes.length - 1, 
                track.n - 1
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
            time += track.sections[x].duration(track.tau, track.n);
        }

        // Add duration of previous timeboxes in current section
        const section = track.sections[this.i];
        for (let y = 0; y < this.j; y++) {
            time += section.timeboxes[y].duration(track.tau, track.n);
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
        this.timeboxes.push(new TimeBox(tStart, desc));
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
        const timebox = new TimeBox(tStart, description, nT);
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
                const expectedStart = currentBox.tStart + 
                    currentBox.getEffectiveN(this) * this.tau;
                
                if (Math.abs(nextBox.tStart - expectedStart) > 1e-6) {
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