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
 * Represents a contiguous interval within a track: T = t_start
 */
class TimeBox {
    /**
     * @param {number} tStart - Start time relative to track's origin
     */
    constructor(tStart) {
        this.tStart = tStart;  // Start time relative to track's origin
    }

    /**
     * Calculate duration of timebox in seconds
     * @param {number} tau - Time unit duration
     * @param {number} n - Number of time units
     * @returns {number} Duration in seconds
     */
    duration(tau, n) {
        return n * tau;
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

        if (this.k + 1 < timebox.n) {
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
            const prevBox = track.sections[this.i].timeboxes[this.j - 1];
            return new TrackState(this.i, this.j - 1, prevBox.n - 1);
        }

        if (this.i > 0) {
            const prevSection = track.sections[this.i - 1];
            const lastBox = prevSection.timeboxes[prevSection.timeboxes.length - 1];
            return new TrackState(this.i - 1, prevSection.timeboxes.length - 1, lastBox.n - 1);
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
     * @param {number} index - Section index in track
     * @param {string} description - Section description
     * @param {string|null} imageUrl - URL of section image
     */
    constructor(index = 0, description = "", imageUrl = null) {
        this.timeboxes = [];
        this.index = index;
        this.description = description;
        this.imageUrl = imageUrl;
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

    /**
     * Add a new timebox to the section
     * @param {number} tStart - Start time
     * @returns {TimeBox} The newly created timebox
     */
    addTimebox(tStart) {
        const box = new TimeBox(tStart);
        this.timeboxes.push(box);
        return box;
    }
}

/**
 * Represents a complete track: Θ = (id, desc, τ, δ, n, <S₁, S₂, ..., Sₘ>)
 */
class Track {
    /**
     * @param {Object} params - Track parameters
     * @param {string} params.id - Track identifier
     * @param {string} params.description - Track description
     * @param {number} params.tau - Time unit duration
     * @param {number} params.delta - Padding duration
     * @param {number} params.n - Number of time units per box
     */
    constructor({
        id = "\\author\\tracks\\untitled-track",
        description = "undescribed",
        tau = 0.5,
        delta = 5,
        n = 8
    } = {}) {
        this.id = id;
        this.description = description;
        this.tau = tau;
        this.delta = delta;
        this.n = n;
        this.sections = [];
        this.state = new TrackState();
    }

    /**
     * Add a new section to the track
     * @param {string} description - Section description
     * @param {string|null} imageUrl - URL of section image
     * @returns {Section} The newly created section
     */
    addSection(description = "", imageUrl = null) {
        const section = new Section(this.sections.length, description, imageUrl);
        this.sections.push(section);
        return section;
    }

    /**
     * Calculate total duration including padding
     * @returns {number} Duration in seconds
     */
    totalDuration() {
        return this.delta + this.sections.reduce(
            (sum, section) => sum + section.duration(this.tau, this.n),
            0
        );
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
                const expectedStart = currentBox.tStart + currentBox.n * this.tau;
                
                if (Math.abs(nextBox.tStart - expectedStart) > 1e-6) {
                    return false;
                }
            }
        }
        return true;
    }
}

export { TimeUnit, TimeBox, TrackState, Section, Track }; 