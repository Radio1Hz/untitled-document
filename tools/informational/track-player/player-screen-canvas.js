import { Component } from './component.js';

/**
 * Represents an image display component for the track player.
 * Instead of using a canvas, it uses an <img> to show slideshow images.
 * It updates its image once per state transition (each tau interval) as defined by the player.
 */
export class PlayerScreenCanvas extends Component {
    /**
     * @param {string} id - Image component identifier.
     * @param {Object} props - Static properties.
     */
    constructor(id, props = {}) {
        // Set type to 'img' for clarity.
        super(id, 'img', props);
        this.state = {
            currentImageUrl: null,    // The currently loaded image URL.
            isLoading: false,
            error: null,
            currentState: null,
            mode: null
        };
        this.lastTransitionKey = null;
        
        // Add a resize handler to adjust dimensions dynamically.
        window.addEventListener('resize', () => this.handleResize());
    }
    
    /**
     * Computes the ideal element size based on the window's dimensions.
     * Returns the smaller value between the window's width and height.
     */
    getElementSize() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        return Math.min(screenWidth, screenHeight);
    }
    
    /**
     * Handles window resize events by updating the <img> dimensions.
     */
    handleResize() {
        if (this.element) {
            const size = this.getElementSize();
            this.element.style.width = size + 'px';
            this.element.style.height = size + 'px';
        }
    }
    
    /**
     * Loads the initial image from the track. For instance, if a track defines a first section image,
     * it preloads and displays that image.
     *
     * @param {Track} track - The current track.
     */
    loadInitialState(track) {
        if (!track || !track.sections || track.sections.length === 0) return;
        const firstSection = track.sections[0];
        if (firstSection.imageUrl && firstSection.imageUrl !== this.state.currentImageUrl) {
            this.loadImage(firstSection.imageUrl)
                .catch(error => {
                    console.error('Failed to load initial image:', error);
                });
        }
    }
    
    /**
     * Handles state transitions.
     * For each new state transition (i.e. each tau interval), determines whether a new image URL should be loaded.
     * The selection is based first on the timebox image, then on the section image; for STOPPED mode,
     * it uses the first section's image if available.
     *
     * @param {Object} newState - New track state (with properties i, j, k).
     * @param {Track} track - The current track.
     * @param {string} mode - Playback mode (e.g. 'PLAYING', 'STOPPED').
     */
    handleStateTransition(newState, track, mode) {
        // Create a unique key based on newState; if newState is null (stopped), use 'stopped'.
        const stateKey = newState ? `${newState.i}-${newState.j}-${newState.k}` : 'stopped';
        if (this.lastTransitionKey === stateKey) return;
        this.lastTransitionKey = stateKey;
        
        // Determine the new image URL.
        let newImageUrl = null;
        if (newState && track && track.sections && track.sections[newState.i]) {
            const section = track.sections[newState.i];
            // Prefer the timebox image if available.
            if (section.timeboxes && section.timeboxes[newState.j] && section.timeboxes[newState.j].imageUrl) {
                newImageUrl = section.timeboxes[newState.j].imageUrl;
            } else if (section.imageUrl) {
                newImageUrl = section.imageUrl;
            }
        } else if (mode === 'STOPPED' && track && track.sections && track.sections.length > 0) {
            // For STOPPED mode, use the first section's image.
            const firstSection = track.sections[0];
            newImageUrl = firstSection.imageUrl || null;
        }
        
        //console.log('Computed newImageUrl:', newImageUrl, ' vs current:', this.state.currentImageUrl);

        // If the new image URL differs, load it; otherwise, update the state and force a redraw.
        if (newImageUrl && decodeURI(newImageUrl) !== decodeURI(this.state.currentImageUrl || "")) {
            this.loadImage(newImageUrl)
                .then(() => {
                    this.setState({ currentState: newState, mode });
                })
                .catch(error => {
                    console.error('Failed to load image:', error);
                    this.setState({ currentState: newState, mode });
                });
        } else {
            this.setState({ currentState: newState, mode });
            // Force a DOM update.
            requestAnimationFrame(() => {
                if (this.element) {
                    this.element.src = this.state.currentImageUrl || "";
                }
            });
        }
    }
    
    /**
     * Preloads an image from the provided URL.
     * Once loaded, updates the state with the new URL and sets the <img> element's src.
     *
     * @param {string} url - The image URL.
     * @returns {Promise<void>}
     */
    async loadImage(url) {
        if (!url) return;
        // Append a cache-busting parameter so that the URL is unique on every load.
        const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
        const encodedUrl = encodeURI(cacheBustedUrl);
        this.setState({ isLoading: true, error: null });
        try {
            const image = new Image();
            image.crossOrigin = "anonymous";
            await new Promise((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = (e) => {
                    if (image.crossOrigin) {
                        image.crossOrigin = null;
                        image.src = encodedUrl;
                    } else {
                        reject(new Error(`Failed to load image: ${encodedUrl}`));
                    }
                };
                image.src = encodedUrl;
            });
            this.setState({
                currentImageUrl: encodedUrl,
                isLoading: false,
                error: null
            });
            // Update the displayed image.
            requestAnimationFrame(() => {
                if (this.element) {
                    console.log('Updating image src to:', encodedUrl);
                    this.element.src = encodedUrl;
                }
            });
        } catch (error) {
            this.setState({ isLoading: false, error: error.message });
            throw error;
        }
    }
    
    /**
     * Renders the <img> element.
     * The element's dimensions are set according to the window size.
     *
     * @returns {HTMLElement} The rendered <img> element.
     */
    render() {
        const img = document.createElement('img');
        const size = this.getElementSize();
        img.style.width = size + 'px';
        img.style.height = size + 'px';
        img.style.objectFit = 'cover';
        // Optionally, add a fade-in transition.
        img.style.transition = 'opacity 0.5s ease-in-out';
        img.style.opacity = '1';
        if (this.state.currentImageUrl) {
            img.src = this.state.currentImageUrl;
        }
        return img;
    }
    
    /**
     * Updates the displayed <img> element.
     * Instead of replacing the element, it updates its attributes directly.
     */
    update() {
        if (this.element) {
            const size = this.getElementSize();
            this.element.style.width = size + 'px';
            this.element.style.height = size + 'px';
            if (this.state.currentImageUrl) {
                this.element.src = this.state.currentImageUrl;
            }
        } else {
            const newElement = this.render();
            this.element = newElement;
        }
    }
} 