class TimeBox {
    constructor(tStart, desc = "", nT = undefined) {
        this.tStart = tStart;
        this.nT = nT;
        this.desc = (typeof desc === 'string') ? {
            en: desc,
            zh: desc,
            ru: desc,
            ar: desc
        } : desc;
    }

    getEffectiveN(track) {
        return this.nT !== undefined ? this.nT : track.n;
    }

    duration(tau, n) {
        // Use this timebox's own nT value or fall back to track's n
        const effectiveN = this.getEffectiveN({ n }); // Pass an object with n to match Track interface
        return tau * effectiveN;
    }
} 