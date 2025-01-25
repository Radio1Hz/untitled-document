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
     */
    constructor(tStart, desc = "") {
        this.tStart = tStart;
        this.n = 8;
        // Ensure desc is an object with language keys
        this.desc = (typeof desc === 'string') ? {
            en: desc,
            zh: desc,
            ru: desc,
            ar: desc
        } : desc;
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
     * @param {number} index - Section index in track
     * @param {Object} desc - Section description in multiple languages
     * @param {string|null} imageUrl - URL of section image
     */
    constructor(index = 0, desc = {
        en: "",
        zh: "",
        ru: "",
        ar: ""
    }, imageUrl = null) {
        this.timeboxes = [];
        this.index = index;
        // Ensure desc is an object with language keys
        this.desc = (typeof desc === 'string') ? {
            en: desc,
            zh: desc,
            ru: desc,
            ar: desc
        } : desc;
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
     * @param {string} desc - Description of timebox content
     * @returns {TimeBox} The newly created timebox
     */
    addTimebox(tStart, desc = "") {
        // Ensure desc is an object with language keys
        const description = (typeof desc === 'string') ? {
            en: desc,
            zh: desc,
            ru: desc,
            ar: desc
        } : desc;

        const box = new TimeBox(tStart, description);
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
     * @param {string} params.desc - Track description
     * @param {number} params.tau - Time unit duration
     * @param {number} params.delta - Padding duration
     * @param {number} params.n - Number of time units per box
     */
    constructor({
        id = "\\author\\tracks\\untitled-track",
        desc = {
            en: "undescribed",
            zh: "未描述",
            ru: "не описано",
            ar: "غير موصوف"
        },
        tau = 0.5,
        delta = 5,
        n = 8
    } = {}) {
        this.id = id;
        // Ensure desc is an object with language keys
        this.desc = (typeof desc === 'string') ? {
            en: desc,
            zh: desc,
            ru: desc,
            ar: desc
        } : desc;
        this.tau = tau;
        this.delta = delta;
        this.n = n;
        this.sections = [];
        this.state = new TrackState();
    }

    /**
     * Add a new section to the track
     * @param {string} desc - Section description
     * @param {string|null} imageUrl - URL of section image
     * @returns {Section} The newly created section
     */
    addSection(desc, imageUrl) {
        // Ensure desc is an object with language keys
        const description = (typeof desc === 'string') ? {
            en: desc,
            zh: desc,
            ru: desc,
            ar: desc
        } : desc;

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