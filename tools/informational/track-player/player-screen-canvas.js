import { Component } from './component.js';

/**
 * Represents a canvas for displaying media: C = (w, h, ctx, content)
 */
export class PlayerScreenCanvas extends Component {
    /**
     * @param {string} id - Canvas identifier
     * @param {Object} props - Canvas properties
     */
    constructor(id, props = {}) {
        super(id, 'canvas', props);
        this.state = {
            currentImageUrl: null,  // Track current loaded image URL
            isLoading: false,
            error: null,
            currentState: null
        };
        this.currentImage = null;
        
        // Add resize handler
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        if (this.element) {
            // Recalculate canvas size
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const isLandscape = screenWidth > screenHeight;
            const canvasSize = isLandscape ? screenHeight : screenWidth;
            
            this.element.width = canvasSize;
            this.element.height = canvasSize;
            
            // Redraw current image if exists
            if (this.currentImage) {
                this.drawImage();
            }
        }
    }

    /**
     * Load initial state image
     * @param {Track} track - Current track
     */
    loadInitialState(track) {
        if (!track || !track.sections || track.sections.length === 0) return;
        
        const firstSection = track.sections[0];
        if (firstSection.imageUrl && firstSection.imageUrl !== this.state.currentImageUrl) {
            //console.log('Loading initial state image:', firstSection.imageUrl);
            this.loadImage(firstSection.imageUrl).then(() => {
                //console.log('Initial image loaded and drawn');
            }).catch(error => {
                //console.error('Failed to load initial image:', error);
            });
        }
    }

    /**
     * Handle state transitions
     */
    handleStateTransition(newState, track, playbackMode) {
        //console.log('State transition:', { newState, playbackMode, currentUrl: this.state.currentImageUrl });
        
        if (!track) {
            //console.warn('No track provided for state transition');
            return;
        }

        // Handle STOPPED mode
        if (playbackMode === 'STOPPED') {
            //console.log('Handling STOPPED mode');
            this.loadInitialState(track);
            this.state.currentState = null;
            return;
        }

        // Handle PLAYING mode
        if (playbackMode === 'PLAYING' && newState) {
            const section = track.sections[newState.i];
            const timebox = section?.timeboxes[newState.j];

            //console.log('Current section/timebox:', {
            //    sectionIndex: newState.i,
            //    timeboxIndex: newState.j,
            //    sectionImage: section?.imageUrl,
            //    timeboxImage: timebox?.imageUrl
            //});

            // Check timebox image first
            if (timebox?.imageUrl && timebox.imageUrl !== this.state.currentImageUrl) {
                //console.log('Loading new timebox image:', timebox.imageUrl);
                this.loadImage(timebox.imageUrl).catch(error => {
                    //console.error('Failed to load timebox image:', error);
                });
            }
            // Then check section image
            else if (section?.imageUrl && section.imageUrl !== this.state.currentImageUrl) {
                //console.log('Loading new section image:', section.imageUrl);
                this.loadImage(section.imageUrl).catch(error => {
                    //console.error('Failed to load section image:', error);
                });
            }
        }

        this.state.currentState = newState;
    }

    /**
     * Load and display image from URL
     */
    async loadImage(url) {
        if (!url) {
            //console.warn('No URL provided for image loading');
            return;
        }
        
        const encodedUrl = encodeURI(url);
        //console.log('Starting image load:', encodedUrl);
        
        this.setState({ isLoading: true, error: null });
        
        try {
            const image = new Image();
            image.crossOrigin = "anonymous";
            
            await new Promise((resolve, reject) => {
                image.onload = () => {
                    //console.log('Image loaded successfully:', encodedUrl);
                    this.currentImage = image;
                    this.setState({ 
                        currentImageUrl: encodedUrl,
                        isLoading: false,
                        error: null
                    });
                    
                    // Ensure canvas is ready before drawing
                    requestAnimationFrame(() => {
                        //console.log('Drawing image after load');
                        this.drawImage();
                    });
                    
                    resolve();
                };
                
                image.onerror = (e) => {
                    //console.error('Image load error:', e);
                    // Try without crossOrigin as fallback
                    if (image.crossOrigin) {
                        //console.log('Retrying without crossOrigin');
                        image.crossOrigin = null;
                        image.src = encodedUrl;
                    } else {
                        reject(new Error(`Failed to load image: ${encodedUrl}`));
                    }
                };
                
                image.src = encodedUrl;
            });
        } catch (error) {
            //console.error('Image load failed:', error);
            this.setState({ 
                isLoading: false,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Draw the current image to canvas
     */
    drawImage() {
        if (!this.element || !this.currentImage) {
            return;
        }

        const ctx = this.element.getContext('2d');
        if (!ctx) {
            return;
        }

        // Clear and draw
        ctx.clearRect(0, 0, this.element.width, this.element.height);
        ctx.drawImage(this.currentImage, 0, 0, this.element.width, this.element.height);
    }

    /**
     * Render canvas element
     */
    render() {
        const canvas = document.createElement('canvas');
        
        // Calculate canvas size based on screen orientation
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isLandscape = screenWidth > screenHeight;
        const canvasSize = isLandscape ? screenHeight : screenWidth;

        // Set canvas dimensions
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        this.element = canvas;

        // If we have a loaded image, draw it immediately
        if (this.currentImage) {
            this.drawImage();
        }
        
        return canvas;
    }

    update() {
        const newElement = this.render();
        if (this.element) {
            this.element.replaceWith(newElement);
            this.element = newElement;
            // Redraw image after update if we have one
            if (this.currentImage) {
                this.drawImage();
            }
        }
    }
} 