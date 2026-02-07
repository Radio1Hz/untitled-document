import { Component } from './component.js';
import { PlayerScreenCanvas } from './player-screen-canvas.js';
import { PlaybackMode, TrackPlayer } from './track-player-model.js';
import { TrackState } from './track-model.js';

/**
 * Represents a screen: Σ = (R, C, I, H, D)
 */
class Screen {
    /**
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {number} tau_width_px - Fixed width for each time unit
     */
    constructor(width, height, tau_width_px = 20) {
        this.resolution = { width, height };
        this.components = new Map();  // C: Set of components
        this.handlers = new Map();    // I: Set of input handlers
        this.hierarchy = new Map();   // H: Component hierarchy
        this.tau_width_px = tau_width_px; // Fixed width for each time unit
    }

    /**
     * Add component to screen
     * @param {Component} component - Component to add
     * @param {Component|null} parent - Parent component
     */
    addComponent(component, parent = null) {
        this.components.set(component.id, component);
        if (parent) {
            this.hierarchy.set(component.id, parent.id);
        }
    }

    /**
     * Add input handler
     * @param {string} event - Event type
     * @param {function} handler - Event handler
     */
    addHandler(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event).add(handler);
    }

    /**
     * Mount screen to DOM element with responsive sizing
     * @param {HTMLElement} container - Container element
     */
    mount(container) {
        if (!container) return;
        
        container.style.width = '100%';
        container.style.position = 'relative';
        
        // Find or create timeline container
        let timelineContainer = container.querySelector('.timeline');
        if (!timelineContainer) {
            timelineContainer = document.createElement('div');
            timelineContainer.className = 'timeline';
            container.querySelector('.track-section').appendChild(timelineContainer);
        }
        
        // Render timeline
        const timelineElement = this.timeline.render();
        timelineContainer.innerHTML = '';
        timelineContainer.appendChild(timelineElement);
        
        // Get the sections content container
        const sectionsContent = container.querySelector('#sections-content');
        if (sectionsContent) {
            sectionsContent.innerHTML = '';
            sectionsContent.appendChild(this.sectionView.render());
        }
    }
}

/**
 * Timeline component for track player: τ-line = (pos, scale, M)
 */
class Timeline extends Component {
    constructor(id) {
        super(id, 'timeline', {}, {
            position: 0,
            scale: 1,
            markers: [],
            width: 0,
            isDragging: false,
            currentState: null,
            progress: 0
        });
    }

    formatTime(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    render() {
        const timeline = document.createElement('div');
        timeline.className = 'timeline';
        
        // Create background progress bar (full width, darker)
        const backgroundBar = document.createElement('div');
        backgroundBar.className = 'timeline-background';
        backgroundBar.style.width = '100%';
        backgroundBar.style.backgroundColor = '#333';
        
        // Create active progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'timeline-progress';
        progressBar.style.width = `${this.state.progress}%`;
        
        // Create markers container and clear any existing markers
        const markersContainer = document.createElement('div');
        markersContainer.className = 'timeline-markers';
        markersContainer.innerHTML = ''; // Clear existing markers
        
        // Add section markers
        if (this.props.track) {
            let totalDuration = this.props.track.totalDuration();
            
            // Create all markers at once
            const markerElements = this.props.track.sections.map((section, index) => {
                const marker = document.createElement('div');
                marker.className = 'timeline-marker';
                
                // Calculate section start time
                let sectionStartTime = 0;
                for (let i = 0; i < index; i++) {
                    const prevSection = this.props.track.sections[i];
                    for (const box of prevSection.timeboxes) {
                        const nT = box.nT !== undefined ? box.nT : this.props.track.n;
                        sectionStartTime += nT * this.props.track.tau;
                    }
                }
                
                // Calculate position on timeline
                const position = (sectionStartTime / totalDuration) * 100;
                marker.style.left = `${position}%`;
                
                // Add marker label
                const label = document.createElement('div');
                label.className = 'marker-label';
                
                // Show only section index (0-based)
                label.textContent = String(index).padStart(2, '0');
                
                marker.appendChild(label);
                
                // Add click handler to jump to section start
                marker.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent timeline click handler from firing
                    
                    // Create state for the start of this section
                    const targetState = new TrackState(index, 0, 0);
                    
                    // Store current mode
                    const wasPlaying = this.props.player.mode === PlaybackMode.PLAYING;
                    
                    // Pause playback
                    if (wasPlaying) {
                        this.props.player.pause();
                    }
                    
                    // Calculate absolute time for this state
                    const targetTime = targetState.absoluteTime(this.props.track);
                    
                    // Use seek to properly synchronize state and time
                    this.props.player.seek(targetTime);
                    
                    // Resume if it was playing
                    if (wasPlaying) {
                        // Wait for audio to be ready at new position before resuming
                        const audioElement = document.getElementById('track-audio');
                        if (audioElement) {
                            audioElement.addEventListener('seeked', () => {
                                this.props.player.play();
                            }, { once: true });
                        } else {
                            this.props.player.play();
                        }
                    }
                });
                
                // Highlight current section
                if (this.state.currentState && this.state.currentState.i === index) {
                    marker.classList.add('current-marker');
                }
                
                return marker;
            });
            
            // Append all markers at once
            markerElements.forEach(marker => markersContainer.appendChild(marker));
        }
        
        // Clear any existing content and append new elements
        timeline.innerHTML = '';
        timeline.appendChild(backgroundBar);
        timeline.appendChild(progressBar);
        timeline.appendChild(markersContainer);
        
        // Add click/drag handlers
        timeline.addEventListener('mousedown', (e) => {
            this.state.isDragging = true;
            this.handleTimelineInteraction(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.state.isDragging) {
                this.handleTimelineInteraction(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.state.isDragging = false;
        });
        
        return timeline;
    }
    
    handleTimelineInteraction(e) {
        const timeline = e.target.closest('.timeline');
        if (!timeline) return;
        
        const rect = timeline.getBoundingClientRect();
        const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        if (this.props.onSeek) {
            const time = position * this.props.track.totalDuration();
            this.props.onSeek(time);
        }
        
        this.setState({ position });
    }

    setState(newState) {
        // Calculate new active width if state changed
        if (newState.currentState && this.props.track) {
            const track = this.props.track;
            let totalTimeUnits = 0;
            let currentTimeUnits = 0;
            
            // Calculate total time units and current progress
            track.sections.forEach((section, i) => {
                section.timeboxes.forEach((timebox, j) => {
                    const nT = timebox.nT !== undefined ? timebox.nT : track.n;
                    totalTimeUnits += nT;
                    
                    // Count units up to current state
                    if (i < newState.currentState.i || (i === newState.currentState.i && j < newState.currentState.j)) {
                        currentTimeUnits += nT;
                    } else if (i === newState.currentState.i && j === newState.currentState.j) {
                        currentTimeUnits += newState.currentState.k;
                    }
                });
            });
            
            newState.progress = (currentTimeUnits / totalTimeUnits) * 100;
        } else {
            newState.progress = 0;
        }
        
        super.setState(newState);
    }
}

/**
 * Control panel component for track player
 */
class ControlPanel extends Component {
    constructor(id) {
        super(id, 'controls', {}, {
            mode: PlaybackMode.STOPPED,
            speed: 1.0
        });
    }

    render() {
        const div = document.createElement('div');
        div.className = 'control-panel';
        // ... implement control panel
        return div;
    }
}

/**
 * Section view component for track player
 */
class SectionView extends Component {
    constructor(id, props = {}) {
        super(id, 'div', props);
        this.state = {
            currentTrack: props.currentTrack || null,
            currentLanguage: props.currentLanguage || 'en'
        };
        this.screen = props.screen || null;  // Get screen from props
        this.hasScrolledInSection = false;
        this.currentSectionIndex = null;
        this.lastBoxIndex = null;
        this.lastState = null;
    }

    /**
     * Set parent screen reference
     * @param {Screen} screen - Parent screen instance
     */
    setScreen(screen) {
        this.screen = screen;
    }

    render() {
        if (!this.state.currentTrack) {
            const div = document.createElement('div');
            div.id = this.id;
            return div;
        }

        const container = document.createElement('div');
        container.id = this.id;
        container.className = 'sections-container';
        
        // Get current state safely
        const currentState = this.screen?.player?.state || null;
        const currentSectionIndex = currentState ? currentState.i : 0;
        const isLastSection = currentSectionIndex === this.state.currentTrack.sections.length - 1;
        
        // Determine which sections to show
        let sectionsToShow = [];
        if (isLastSection) {
            // Show next-to-last and last section
            sectionsToShow = [currentSectionIndex - 1, currentSectionIndex];
        } else {
            // Show current and next section
            sectionsToShow = [currentSectionIndex, currentSectionIndex + 1];
        }

        this.state.currentTrack.sections.forEach((section, sectionIndex) => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'section';
            sectionElement.dataset.index = sectionIndex;
            
            // Add section index display
            const sectionIndexDisplay = document.createElement('div');
            sectionIndexDisplay.className = 'section-index state-value clickable';
            sectionIndexDisplay.textContent = sectionIndex.toString().padStart(2, '0');
            
            // Add click handler to jump to section start
            sectionIndexDisplay.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                
                const track = this.state.currentTrack;
                
                if (!track || !this.screen?.player) {
                    console.warn('Track or player not available');
                    return;
                }
                
                // Create state for the start of this section
                const targetState = new TrackState(sectionIndex, 0, 0);
                
                // Store current mode
                const wasPlaying = this.screen.player.mode === PlaybackMode.PLAYING;
                
                // Pause playback
                if (wasPlaying) {
                    this.screen.player.pause();
                }
                
                // Use seek to properly synchronize state and time
                const targetTime = targetState.absoluteTime(track);
                this.screen.player.seek(targetTime);
                
                // Update audio element's time to match
                const audioElement = document.getElementById('track-audio');
                if (audioElement) {
                    audioElement.currentTime = targetTime;
                }
                
                // Resume if it was playing
                if (wasPlaying) {
                    // Wait for audio to be ready at new position before resuming
                    if (audioElement) {
                        audioElement.addEventListener('seeked', () => {
                            this.screen.player.play();
                        }, { once: true });
                    } else {
                        this.screen.player.play();
                    }
                }
            });
            
            // Only show sections in sectionsToShow array
            if (sectionsToShow.includes(sectionIndex)) {
                sectionElement.classList.add('visible');
            }
            
            // Add current-section class if this is the current section
            if (currentState && currentState.i === sectionIndex) {
                sectionElement.classList.add('current-section');
            }

            // Create timeboxes container
            const timeboxesContainer = document.createElement('div');
            timeboxesContainer.className = 'timeboxes-container';
            timeboxesContainer.appendChild(sectionIndexDisplay);
            section.timeboxes.forEach((timebox, timeboxIndex) => {

                const timeboxElement = document.createElement('div');
                timeboxElement.className = 'timebox';
                
                // Calculate width based on number of time units (nT) and tau_width_px
                const nT = timebox.nT !== undefined ? timebox.nT : this.state.currentTrack.n;
                const width_px = Math.round(nT * this.screen.tau_width_px);
                timeboxElement.style.width = `${width_px}px`;
                timeboxElement.style.flexShrink = '0'; // Prevent shrinking

                // Add click handler to jump to timebox start
                timeboxElement.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    
                    const track = this.state.currentTrack;
                    
                    if (!track || !this.screen?.player) {
                        console.warn('Track or player not available');
                        return;
                    }
                    
                    // Create state for the clicked timebox
                    const targetState = new TrackState(sectionIndex, timeboxIndex, 0);
                    
                    
                    // Store current mode
                    const wasPlaying = this.screen.player.mode === PlaybackMode.PLAYING;
                    
                    // Pause playback
                    if (wasPlaying) {
                        this.screen.player.pause();
                    }
                    
                    // Use seek to properly synchronize state and time
                    const targetTime = targetState.absoluteTime(track);
                    this.screen.player.seek(targetTime);
                    
                    // Update audio element's time to match
                    const audioElement = document.getElementById('track-audio');
                    if (audioElement) {
                        audioElement.currentTime = targetTime;
                    }
                    
                    // Resume if it was playing
                    if (wasPlaying) {
                        // Wait for audio to be ready at new position before resuming
                        const audioElement = document.getElementById('track-audio');
                        if (audioElement) {
                            audioElement.addEventListener('seeked', () => {
                                this.screen.player.play();
                            }, { once: true });
                        } else {
                            this.screen.player.play();
                        }
                    }
                });
                
                // Add current-box class if this is the current timebox
                if (currentState && 
                    currentState.i === sectionIndex && 
                    currentState.j === timeboxIndex) {
                    timeboxElement.classList.add('current-box');
                }

                // Add timebox content
                const content = document.createElement('div');
                content.className = 'timebox-content';
                content.textContent = timebox.desc?.[this.state.currentLanguage] || 
                                    timebox.desc?.en || 
                                    Object.values(timebox.desc || {})[0] ||
                                    `Box ${timeboxIndex + 1}`;
                timeboxElement.appendChild(content);

                // Add position dots (reuse nT from above)
                const positionsContainer = document.createElement('div');
                positionsContainer.className = 'positions-container';

                for (let i = 0; i < nT; i++) {
                    const positionDot = document.createElement('div');
                    positionDot.className = 'position-dot';
                    
                    if (currentState && 
                        currentState.i === sectionIndex && 
                        currentState.j === timeboxIndex && 
                        currentState.k === i) {
                        positionDot.classList.add('current');
                    }
                    
                    positionsContainer.appendChild(positionDot);
                }

                timeboxElement.appendChild(positionsContainer);
                timeboxesContainer.appendChild(timeboxElement);
            });

            sectionElement.appendChild(timeboxesContainer);
            container.appendChild(sectionElement);
        });

        return container;
    }

    updatePositionHighlighting() {
        const state = this.screen.player.state;
        if (!state) return;

        // Remove all current highlights
        document.querySelectorAll('.position-dot.current, .timebox-content.current, .section.current-section')
            .forEach(el => el.classList.remove('current', 'current-section'));

        // Remove visible class from all sections
        document.querySelectorAll('.section.visible')
            .forEach(el => el.classList.remove('visible'));

        // Determine which sections should be visible
        const isLastSection = state.i === this.state.currentTrack.sections.length - 1;
        const sectionsToShow = isLastSection 
            ? [state.i - 1, state.i]
            : [state.i, state.i + 1];

        // Add visible class to appropriate sections
        sectionsToShow.forEach(index => {
            const section = document.querySelector(`[data-index="${index}"]`);
            if (section) {
                section.classList.add('visible');
            }
        });

        // Add current-section class to current section
        const currentSection = document.querySelector(`[data-index="${state.i}"]`);
        if (currentSection) {
            currentSection.classList.add('current-section');
        }

        // Find the current section
        const currentSectionElement = document.querySelector(`[data-index="${state.i}"]`);
        if (!currentSectionElement) return;

        const timeboxesContainer = currentSectionElement.querySelector('.timeboxes-container');
        if (!timeboxesContainer) return;

        const timeboxes = currentSectionElement.querySelectorAll('.timebox');
        const currentBox = timeboxes[state.j];
        if (!currentBox) return;

        // Highlight current timebox content
        const currentBoxContent = currentBox.querySelector('.timebox-content');
        if (currentBoxContent) {
            currentBoxContent.classList.add('current');
        }

        // Check if we've actually changed section or box
        const hasChangedSection = !this.lastState || state.i !== this.lastState.i;
        const hasChangedBox = !this.lastState || state.j !== this.lastState.j;

        // Reset scroll state when changing sections
        if (hasChangedSection) {
            this.hasScrolledInSection = false;
        }

        // Only check visibility if we've changed boxes
        if (hasChangedBox) {
            const containerRect = timeboxesContainer.getBoundingClientRect();
            const boxRect = currentBox.getBoundingClientRect();
            
            const isBoxFullyVisible = (
                boxRect.left >= containerRect.left &&
                boxRect.right <= containerRect.right
            );

            // Only scroll if box is not fully visible and we haven't scrolled in this section
            if (!isBoxFullyVisible && !this.hasScrolledInSection) {
                const scrollLeft = currentBox.offsetLeft - 20;
                timeboxesContainer.scrollTo({
                    left: Math.max(0, scrollLeft),
                    behavior: 'smooth'
                });
                this.hasScrolledInSection = true;
            }
        }

        // Update last state
        this.lastState = { ...state };

        // Find and highlight the current position dot
        const currentDot = currentBox.querySelectorAll('.position-dot')[state.k];
        if (currentDot) {
            currentDot.classList.add('current');
        }
    }

    setState(newState) {
        super.setState(newState);
        // Reset all tracking when track changes
        this.hasScrolledInSection = false;
        this.lastState = null;
    }
}

/**
 * Track player screen: ΣΠ = (R, CΠ, IΠ, HΠ, Π)
 */
export class TrackPlayerScreen extends Screen {
    /**
     * @param {TrackPlayer} player - Track player instance
     */
    constructor(player) {
        if (!player || !(player instanceof TrackPlayer)) {
            throw new Error('Valid TrackPlayer instance is required');
        }

        super(window.innerWidth, window.innerHeight);
        this.player = player;
        this.language = 'en';

        // Initialize components
        this.initializeComponents();

        // Setup input handlers
        this.setupHandlers();

        // Add player update listener
        this.player.addEventListener('stateChange', (event) => {
            this.handlePlayerUpdate(event);
        });

        // Add resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    initializeComponents() {
        // Create components with proper initialization order
        this.createComponents();
        this.initializeComponentStates();
        this.addComponentsToScreen();
    }

    createComponents() {
        this.canvas = new PlayerScreenCanvas('player-screen');
        this.timeline = new Timeline('timeline');
        this.sectionView = new SectionView('sections', {
            screen: this  // Pass screen reference during creation
        });
        this.controls = new ControlPanel('controls');
    }

    initializeComponentStates() {
        // Initialize timeline
        if (this.timeline) {
            this.timeline.props = {
                language: this.language,
                track: this.player.currentTrack,
                player: this.player  // Pass player instance to Timeline
            };
        }

        // Initialize section view
        if (this.sectionView) {
            this.sectionView.setState({
                currentTrack: this.player.currentTrack,
                currentLanguage: this.language,
                screen: this  // Ensure screen reference is set
            });
        }

        // Initialize canvas
        if (this.canvas && this.player.currentTrack) {
            this.canvas.loadInitialState(this.player.currentTrack);
        }
    }

    addComponentsToScreen() {
        if (this.canvas) this.addComponent(this.canvas);
        if (this.timeline) this.addComponent(this.timeline);
        if (this.sectionView) this.addComponent(this.sectionView);
        if (this.controls) this.addComponent(this.controls);
    }

    /**
     * Setup input handlers for player interaction
     */
    setupHandlers() {
        // Playback control handler
        this.addHandler('click', (e, screen) => {
            if (e.target.closest('.control-panel')) {
                // ... handle control panel clicks
            }
        });

        // Timeline navigation handler
        this.addHandler('click', (e, screen) => {
            if (e.target.closest('.timeline')) {
                const pos = this.calculateTimelinePosition(e);
                const time = pos * this.player.currentTrack.totalDuration();
                this.player.seek(time);
            }
        });

        // Section selection handler
        this.addHandler('click', (e, screen) => {
            if (e.target.closest('.section-view')) {
                const sectionIndex = this.getSectionFromEvent(e);
                if (sectionIndex !== null) {
                    this.player.jumpToSection(sectionIndex);
                }
            }
        });
    }

    /**
     * Handle player state updates
     * @param {Object} event - Player state event
     */
    handlePlayerUpdate(event) {
        
        const state = event.state || this.player.state;  // Get state from event or player
        if (!state) return;

        // Check if state has actually changed
        const hasStateChanged = !this.lastState || 
            this.lastState.i !== state.i || 
            this.lastState.j !== state.j;

        // Always update position highlighting for smooth dot transitions
        if (this.sectionView) {
            this.sectionView.updatePositionHighlighting();
        }
        
        // Update state info display with leading zeros
        const currentSection = document.getElementById('current-section');
        const currentBox = document.getElementById('current-box');
        const currentPosition = document.getElementById('current-position');
        
        if (currentSection && currentBox && currentPosition) {
            currentSection.textContent = state.i.toString().padStart(2, '0');
            currentBox.textContent = state.j.toString().padStart(2, '0');
            currentPosition.textContent = state.k.toString().padStart(2, '0');
        }

        // Only re-render sections if state has meaningfully changed
        if (hasStateChanged && this.sectionView) {
            
            this.sectionView.setState({
                currentTrack: this.player.currentTrack,
                currentLanguage: this.language
            });
            
            // Force re-render of sections
            const sectionsContent = document.querySelector('#sections-content');
            if (sectionsContent) {
                const sectionElement = this.sectionView.render();
                if (sectionElement) {
                    sectionsContent.innerHTML = '';
                    sectionsContent.appendChild(sectionElement);
                }
            }
            
            // Update last state after re-render
            this.lastState = { ...state };
        }
        
        // Update timeline
        if (this.timeline && this.player.currentTrack && state) {
            // Calculate progress based on time units instead of absolute time
            const track = this.player.currentTrack;
            let totalTimeUnits = 0;
            let currentTimeUnits = 0;
            
            // Calculate total time units
            track.sections.forEach((section, i) => {
                section.timeboxes.forEach((timebox, j) => {
                    const nT = timebox.nT !== undefined ? timebox.nT : track.n;
                    totalTimeUnits += nT;
                    
                    // Count units up to current state
                    if (i < state.i || (i === state.i && j < state.j)) {
                        currentTimeUnits += nT;
                    } else if (i === state.i && j === state.j) {
                        currentTimeUnits += state.k;
                    }
                });
            });
            
            const progress = (currentTimeUnits / totalTimeUnits) * 100;
            
            // Only do full re-render if state changed
            if (hasStateChanged) {
                this.timeline.setState({
                    progress: progress,
                    currentState: state
                });
                
                // Re-render timeline for state changes
                const timelineContainer = document.querySelector('.timeline');
                if (timelineContainer) {
                    const timelineElement = this.timeline.render();
                    timelineContainer.innerHTML = '';
                    timelineContainer.appendChild(timelineElement);
                }
            } else {
                // Only update progress if k (time unit) has changed
                const progressBar = document.querySelector('.timeline-progress');
                if (progressBar && (!this.lastState || state.k !== this.lastState.k)) {
                    progressBar.style.width = `${progress}%`;
                }
            }
        }

        // Handle image loading through the new mechanism
        if (this.canvas) {
            
            if (this.player.mode === 'STOPPED') {
                this.canvas.handleStateTransition(null, this.player.currentTrack, 'STOPPED');
            } else {
                this.canvas.handleStateTransition(state, this.player.currentTrack, this.player.mode);
            }
        }
    }

    /**
     * Scroll the sections container to make current section visible
     * @param {number} sectionIndex - Index of current section
     */
    scrollToCurrentSection(sectionIndex) {
        const sectionsContent = document.getElementById('sections-content');
        if (!sectionsContent) return;

        const currentSection = sectionsContent.querySelector(`[data-index="${sectionIndex}"]`);
        if (!currentSection) return;

        // Scroll the section into view
        currentSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    /**
     * Calculate normalized position from timeline click
     * @param {Event} e - Click event
     * @returns {number} Normalized position [0,1]
     */
    calculateTimelinePosition(e) {
        const timeline = e.target.closest('.timeline');
        const rect = timeline.getBoundingClientRect();
        return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    }

    /**
     * Get section index from section view click
     * @param {Event} e - Click event
     * @returns {number|null} Section index or null
     */
    getSectionFromEvent(e) {
        const element = e.target.closest('.section');
        return element ? parseInt(element.dataset.index) : null;
    }

    // Update setLanguage method to update timeline
    setLanguage(langCode) {
        this.language = langCode;
        if (this.timeline) {
            this.timeline.props = {
                ...this.timeline.props,
                language: langCode
            };
        }
        if (this.sectionView) {
            this.sectionView.setState({
                currentLanguage: langCode
            });
        }
        this.mount(document.querySelector('.container'));
    }

    /**
     * Calculate max number of time units and tau_width_px
     */
    calculateTauWidth() {
        if (!this.player?.currentTrack) return;

        // Find the longest sequence in terms of time units
        let max_number_timeunits = 0;
        
        this.player.currentTrack.sections.forEach(section => {
            let section_timeunits = 0;
            section.timeboxes.forEach(timebox => {
                const nT = timebox.nT !== undefined ? timebox.nT : this.player.currentTrack.n;
                section_timeunits += nT;
            });
            max_number_timeunits = Math.max(max_number_timeunits, section_timeunits);
        });

        // Get the parent container width
        const container = document.querySelector('.sections-container');
        if (!container) return;

        // Calculate new tau_width_px based on container width
        const containerWidth = container.clientWidth;
        this.tau_width_px = Math.floor((containerWidth * 0.9) / max_number_timeunits);

        // Update section view with new tau_width_px
        if (this.sectionView) {
            this.sectionView.setState({
                currentTrack: this.player.currentTrack,
                currentLanguage: this.language
            });
            
            // Re-render section view
            const sectionsContent = document.querySelector('#sections-content');
            if (sectionsContent) {
                const sectionElement = this.sectionView.render();
                if (sectionElement) {
                    sectionsContent.innerHTML = '';
                    sectionsContent.appendChild(sectionElement);
                }
            }
        }
    }

    /**
     * Handle window resize event
     */
    handleResize() {
        // Update screen resolution
        this.resolution = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Recalculate tau_width_px and update section view
        this.calculateTauWidth();
    }

    mount(container) {
        if (!container) return;
        
        container.style.width = '100%';
        container.style.position = 'relative';
        
        // Calculate initial tau_width_px
        this.calculateTauWidth();
        
        // Create canvas container if it doesn't exist
        let canvasContainer = container.querySelector('.canvas-container');
        if (!canvasContainer) {
            canvasContainer = document.createElement('div');
            canvasContainer.className = 'canvas-container';
            const trackSection = container.querySelector('.track-section');
            if (trackSection) {
                trackSection.insertBefore(
                    canvasContainer,
                    container.querySelector('.timeline')
                );
            }
        }
        
        // Render components with null checks
        if (this.canvas) {
            const canvasElement = this.canvas.render();
            if (canvasContainer) {
                canvasContainer.innerHTML = '';
                canvasContainer.appendChild(canvasElement);
            }
        }
        
        // Find or create timeline container
        let timelineContainer = container.querySelector('.timeline');
        if (!timelineContainer) {
            timelineContainer = document.createElement('div');
            timelineContainer.className = 'timeline';
            const trackSection = container.querySelector('.track-section');
            if (trackSection) {
                trackSection.appendChild(timelineContainer);
            }
        }
        
        // Render timeline with null checks
        if (this.timeline) {
            const timelineElement = this.timeline.render();
            if (timelineContainer) {
                timelineContainer.innerHTML = '';
                timelineContainer.appendChild(timelineElement);
            }
        }
        
        // Get the sections content container
        const sectionsContent = container.querySelector('#sections-content');
        if (sectionsContent && this.sectionView) {
            sectionsContent.innerHTML = '';
            const sectionElement = this.sectionView.render();
            if (sectionElement) {
                sectionsContent.appendChild(sectionElement);
            }
        }

        // Initialize canvas with initial state if we have a track
        if (this.canvas && this.player.currentTrack) {
            this.canvas.loadInitialState(this.player.currentTrack);
        }
    }

    cleanup() {
        window.removeEventListener('resize', this.handleResize.bind(this));
    }
} 