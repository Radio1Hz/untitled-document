export const PlaylistMode = {
    SEQUENTIAL: 'SEQUENTIAL',
    SHUFFLE: 'SHUFFLE',
    REPEAT_ONE: 'REPEAT_ONE',
    REPEAT_ALL: 'REPEAT_ALL'
};

export class Playlist {
    constructor() {
        this.tracks = [];
        this.currentIndex = -1;
        this.mode = PlaylistMode.SEQUENTIAL;
        this.history = [];
        this.shuffleOrder = [];
    }

    addTrack(track) {
        this.tracks.push(track);
        if (this.currentIndex === -1) {
            this.currentIndex = 0;
        }
        this.updateShuffleOrder();
    }

    removeTrack(index) {
        if (index >= 0 && index < this.tracks.length) {
            this.tracks.splice(index, 1);
            this.updateShuffleOrder();
            
            // Update current index if needed
            if (this.tracks.length === 0) {
                this.currentIndex = -1;
            } else if (index <= this.currentIndex) {
                this.currentIndex = Math.min(this.currentIndex, this.tracks.length - 1);
            }
        }
    }

    getCurrentTrack() {
        return this.tracks[this.currentIndex] || null;
    }

    next() {
        if (this.tracks.length === 0) return null;

        this.pushHistory(this.currentIndex);

        switch (this.mode) {
            case PlaylistMode.REPEAT_ONE:
                // Stay on current track
                break;
            
            case PlaylistMode.SHUFFLE:
                const currentShuffleIndex = this.shuffleOrder.indexOf(this.currentIndex);
                const nextShuffleIndex = (currentShuffleIndex + 1) % this.tracks.length;
                this.currentIndex = this.shuffleOrder[nextShuffleIndex];
                break;
            
            case PlaylistMode.SEQUENTIAL:
                if (this.currentIndex < this.tracks.length - 1) {
                    this.currentIndex++;
                }
                break;
            
            case PlaylistMode.REPEAT_ALL:
                this.currentIndex = (this.currentIndex + 1) % this.tracks.length;
                break;
        }

        return this.getCurrentTrack();
    }

    previous() {
        if (this.tracks.length === 0) return null;

        if (this.history.length > 0) {
            this.currentIndex = this.history.pop();
        } else {
            switch (this.mode) {
                case PlaylistMode.REPEAT_ONE:
                    // Stay on current track
                    break;
                
                case PlaylistMode.SHUFFLE:
                    const currentShuffleIndex = this.shuffleOrder.indexOf(this.currentIndex);
                    const prevShuffleIndex = (currentShuffleIndex - 1 + this.tracks.length) % this.tracks.length;
                    this.currentIndex = this.shuffleOrder[prevShuffleIndex];
                    break;
                
                default:
                    this.currentIndex = Math.max(0, this.currentIndex - 1);
                    break;
            }
        }

        return this.getCurrentTrack();
    }

    jumpTo(index) {
        if (index >= 0 && index < this.tracks.length) {
            this.pushHistory(this.currentIndex);
            this.currentIndex = index;
            return this.getCurrentTrack();
        }
        return null;
    }

    setMode(mode) {
        if (Object.values(PlaylistMode).includes(mode)) {
            this.mode = mode;
            if (mode === PlaylistMode.SHUFFLE) {
                this.updateShuffleOrder();
            }
        }
    }

    pushHistory(index) {
        this.history.push(index);
        if (this.history.length > 50) { // Keep history size reasonable
            this.history.shift();
        }
    }

    updateShuffleOrder() {
        this.shuffleOrder = Array.from({ length: this.tracks.length }, (_, i) => i);
        for (let i = this.shuffleOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffleOrder[i], this.shuffleOrder[j]] = [this.shuffleOrder[j], this.shuffleOrder[i]];
        }
    }

    // Save playlist state to localStorage
    save() {
        const state = {
            trackIds: this.tracks.map(track => track.id),
            currentIndex: this.currentIndex,
            mode: this.mode,
            history: this.history,
            shuffleOrder: this.shuffleOrder
        };
        localStorage.setItem('playlistState', JSON.stringify(state));
    }

    // Load playlist state from localStorage
    load(trackMap) {
        const savedState = localStorage.getItem('playlistState');
        if (savedState) {
            const state = JSON.parse(savedState);
            // Don't clear existing tracks if we can't restore them all
            const restoredTracks = state.trackIds.map(id => trackMap.get(id)).filter(Boolean);
            if (restoredTracks.length === state.trackIds.length) {
                this.tracks = restoredTracks;
            }
            // Only restore these if we have valid tracks
            if (this.tracks.length > 0) {
                this.currentIndex = state.currentIndex;
                this.mode = state.mode;
                this.history = state.history;
                this.shuffleOrder = state.shuffleOrder;
            }
        }
        // If no saved state or restoration failed, keep the existing tracks
        if (this.tracks.length === 0) {
            //console.log('No valid saved state, keeping current tracks');
        }
    }
} 