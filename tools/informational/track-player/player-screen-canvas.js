import { Component } from './component.js';

/**
 * Represents a canvas display component for the track player.
 * Uses HTML canvas to render state transitions.
 * It updates its state text once per state transition (each tau interval) as defined by the player.
 */
export class PlayerScreenCanvas extends Component {
    /**
     * @param {string} id - Canvas component identifier.
     * @param {Object} props - Static properties.
     */
    constructor(id, props = {}) {
        // Set type to 'canvas' instead of 'img'
        super(id, 'canvas', props);
        this.state = {
            currentState: null,
            mode: null
        };
        this.lastTransitionKey = null;
        this.imageCache = new Map(); // Add image cache
        
        // Add a resize handler to adjust dimensions dynamically
        window.addEventListener('resize', () => this.handleResize());
    }
    
    /**
     * Computes the ideal element size based on the container dimensions.
     * Returns the size that makes a perfect square within the container.
     */
    getElementSize() {
        const container = this.element?.parentElement;
        if (!container) return 300; // fallback size
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Use the smaller dimension to create a square
        return Math.min(containerWidth, containerHeight);
    }
    
    /**
     * Handles window resize events by updating the canvas dimensions and redrawing.
     */
    handleResize() {
        if (this.element) {
            const size = this.getElementSize();
            // Set both style dimensions and canvas buffer dimensions
            this.element.style.width = size + 'px';
            this.element.style.height = size + 'px';
            this.element.width = size;
            this.element.height = size;
            this.drawState(); // Redraw the current state
        }
    }
    
    // Add method to collect all unique image URLs from the track
    getAllImageUrls(track) {
        const urls = new Set();
        
        if (track && track.sections) {
            track.sections.forEach(section => {
                if (section.imageUrl) {
                    urls.add(section.imageUrl);
                }
                if (section.timeboxes) {
                    section.timeboxes.forEach(timebox => {
                        if (timebox.imageUrl) {
                            urls.add(timebox.imageUrl);
                        }
                    });
                }
            });
        }
        
        return Array.from(urls);
    }

    // Preload all images and store in cache
    async preloadImages(track) {
        const urls = this.getAllImageUrls(track);
        const loadPromises = urls.map(url => this.loadImage(url));
        
        try {
            await Promise.all(loadPromises);
            console.log('All images preloaded successfully');
        } catch (error) {
            console.error('Error preloading images:', error);
        }
    }

    /**
     * Loads the initial state from the track.
     * @param {Track} track - The current track.
     */
    async loadInitialState(track) {
        // Store track in props
        this.props.track = track;
        
        // Preload all images first
        await this.preloadImages(track);
        
        // Create initial state with first section and timebox
        const initialState = track && track.sections.length > 0 ? { i: 0, j: 0, k: 0 } : null;
        
        // Handle the state transition which will draw the image
        this.handleStateTransition(initialState, track, 'STOPPED');
    }
    
    /**
     * Handles state transitions.
     * For each new state transition (i.e. each tau interval), updates the canvas with new state text.
     *
     * @param {Object} newState - New track state (with properties i, j, k).
     * @param {Track} track - The current track.
     * @param {string} mode - Playback mode (e.g. 'PLAYING', 'STOPPED').
     */
    handleStateTransition(newState, track, mode) {
        // Create a unique key based on newState; if newState is null (stopped), use 'stopped'
        const stateKey = newState ? `${newState.i}-${newState.j}-${newState.k}` : 'stopped';
        if (this.lastTransitionKey === stateKey) return;
        this.lastTransitionKey = stateKey;
        
        // Store track in props for access to descriptions
        this.props.track = track;
        this.setState({ currentState: newState, mode });

        // Update track title with section description
        const trackTitleElement = document.getElementById('track-title');
        if (trackTitleElement && track) {
            // Get base track ID
            let title = track.id || '';
            
            // Add section description if we have a valid state and section
            if (newState && track.sections[newState.i]) {
                const section = track.sections[newState.i];
                const lang = document.documentElement.getAttribute('data-lang') || 'en';
                const sectionDesc = section.desc?.[lang] || section.desc?.['en'] || '';
                
                if (sectionDesc) {
                    // Format: trackId\sectionIndex. sectionDescription
                    title = `${title}\\${newState.i}. ${sectionDesc}`;
                }
            }
            
            // Update the title element's text content
            trackTitleElement.textContent = title;
            // Also update the title element's title attribute for tooltip
            trackTitleElement.setAttribute('title', title);
        }

        this.drawState();
    }
    
    /**
     * Draws the current state text on the canvas
     */
    async drawState() {
        // Now we can use cached images directly without loading
        if (!this.element) return;
        
        const ctx = this.element.getContext('2d');
        const canvas = this.element;
        
        // Clear canvas with black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set up text style
        ctx.fillStyle = 'white';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        
        // Calculate font size
        const stateFontSize = Math.min(canvas.width, canvas.height) * 0.025;
        
        // Gather information
        let stateText;
        let currentImageUrl = '';
        
        if (this.state.currentState && this.props.track) {
            const { i, j, k } = this.state.currentState;
            stateText = `${String(i).padStart(2, '0')} ${String(j).padStart(2, '0')} ${String(k).padStart(2, '0')}`;
            
            const section = this.props.track.sections[i];
            if (section) {
                // Set section image only if no current image is set
                if (!currentImageUrl && section.imageUrl) {
                    currentImageUrl = section.imageUrl;
                }
                
                // Check timebox image - only update if timebox has an image
                const timebox = section.timeboxes[j];
                if (timebox && timebox.imageUrl) {
                    currentImageUrl = timebox.imageUrl;
                }
            }
        } else {
            stateText = '00 00 00';
        }

        const drawTextContent = () => {
            ctx.font = `${stateFontSize}px clockicons`;
            const padding = Math.min(canvas.width, canvas.height) * 0.02;
            ctx.fillText(stateText, canvas.width - padding, canvas.height - padding);
        };

        if (currentImageUrl) {
            // Use cached image directly
            const img = this.imageCache.get(currentImageUrl);
            if (img) {
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const x = (canvas.width - scaledWidth) / 2;
                const y = (canvas.height - scaledHeight) / 2;
                
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            } else {
                // Fallback if image not in cache
                ctx.fillStyle = '#660000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
            }
        }
        
        drawTextContent();
    }
    
    /**
     * Renders the canvas element.
     * @returns {HTMLCanvasElement} The rendered canvas element.
     */
    render() {
        const canvas = document.createElement('canvas');
        const size = this.getElementSize();
        
        // Add styles to make canvas fill container as a square
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.backgroundColor = 'black';
        canvas.style.aspectRatio = '1 / 1'; // Force square aspect ratio
        
        // Set canvas dimensions
        canvas.width = size;
        canvas.height = size;
        
        // Draw initial state
        this.element = canvas;
        this.drawState();
        
        return canvas;
    }
    
    /**
     * Updates the canvas element.
     */
    update() {
        if (!this.element) {
            this.element = this.render();
        }
        const size = this.getElementSize();
        this.element.style.width = size + 'px';
        this.element.style.height = size + 'px';
        this.element.width = size;
        this.element.height = size;
        this.drawState();
    }

    // Add method to preload and cache image
    loadImage(url) {
        return new Promise((resolve, reject) => {
            if (this.imageCache.has(url)) {
                resolve(this.imageCache.get(url));
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.imageCache.set(url, img);
                resolve(img);
            };
            
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${url}`));
            };
            
            img.src = url;
        });
    }

    // Move wrapText to be a method of the class and pass ctx as parameter
    wrapText(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const char = words[i];
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        return lines;
    }
} 