import { PlaybackMode } from './track-player-model.js';

/**
 * Represents a visual component: c = (id, type, props, state, φ)
 */
class Component {
    /**
     * @param {string} id - Component identifier
     * @param {string} type - Component type
     * @param {Object} props - Static properties
     * @param {Object} state - Dynamic properties
     */
    constructor(id, type, props = {}, state = {}) {
        this.id = id;
        this.type = type;
        this.props = props;
        this.state = state;
        this.element = null;  // DOM element reference
    }

    /**
     * Render function φ: state → visual
     * @returns {HTMLElement} Rendered DOM element
     */
    render() {
        throw new Error('Render method must be implemented by subclass');
    }

    /**
     * Update component state
     * @param {Object} newState - New state properties
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        if (this.element) this.update();
    }

    /**
     * Update existing DOM element
     */
    update() {
        const newElement = this.render();
        this.element.replaceWith(newElement);
        this.element = newElement;
    }
}

/**
 * Represents a screen: Σ = (R, C, I, H, D)
 */
class Screen {
    /**
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {number} screen_to_dot_ratio - Ratio for screen width to dot width
     */
    constructor(width, height, screen_to_dot_ratio = 25) {
        this.resolution = { width, height };
        this.components = new Map();  // C: Set of components
        this.handlers = new Map();    // I: Set of input handlers
        this.hierarchy = new Map();   // H: Component hierarchy
        this.dimension = { width: 3000, height: 3000 }; // D: Default dimension
        this.screen_to_dot_ratio = screen_to_dot_ratio;
        this.tau_width_px = this.dimension.width / this.screen_to_dot_ratio; // Default time unit width in pixels
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
        // Get client screen dimensions
        const clientWidth = document.documentElement.clientWidth;
        const clientHeight = document.documentElement.clientHeight;
        
        // Update dimensions to match client screen exactly
        this.dimension = {
            width: clientWidth,
            height: clientHeight
        };
        
        // Update tau_width_px based on actual screen width
        this.tau_width_px = clientWidth / this.screen_to_dot_ratio;
        console.log(`Screen dimension: ${clientWidth}x${clientHeight}px, tau_width_px: ${this.tau_width_px}px`);
        
        // Set container size to match screen exactly
        container.style.width = `${clientWidth}px`;
        container.style.height = `${clientHeight}px`;
        
        // Remove centering styles, let it fill screen
        container.style.margin = '0';
        container.style.position = 'relative';
        
        // Render components in hierarchy order
        this.renderHierarchy(container);
        
        // Attach event handlers
        this.attachHandlers(container);
    }

    /**
     * Render component hierarchy
     * @param {HTMLElement} container - Container element
     */
    renderHierarchy(container) {
        // Find root components (no parent)
        const roots = new Set(this.components.keys());
        this.hierarchy.forEach((_, childId) => roots.delete(childId));

        // Render each tree
        roots.forEach(rootId => {
            this.renderComponent(rootId, container);
        });
    }

    /**
     * Recursively render component and its children
     * @param {string} componentId - Component ID
     * @param {HTMLElement} container - Container element
     */
    renderComponent(componentId, container) {
        const component = this.components.get(componentId);
        if (!component) return;

        const element = component.render();
        component.element = element;
        container.appendChild(element);

        // Render children
        Array.from(this.components.keys())
            .filter(id => this.hierarchy.get(id) === componentId)
            .forEach(childId => this.renderComponent(childId, element));
    }

    /**
     * Attach event handlers to container
     * @param {HTMLElement} container - Container element
     */
    attachHandlers(container) {
        this.handlers.forEach((handlers, event) => {
            container.addEventListener(event, (e) => {
                handlers.forEach(handler => handler(e, this));
            });
        });
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
            activeWidth: 0,
            progress: 0  // Add progress to state
        });
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
        
        // Set progress width directly from progress state
        progressBar.style.width = `${this.state.progress}%`;
        progressBar.style.backgroundColor = '#ff5000';
        
        // Create markers container and clear any existing markers
        const markersContainer = document.createElement('div');
        markersContainer.className = 'timeline-markers';
        markersContainer.innerHTML = ''; // Clear existing markers
        
        // Add section markers
        if (this.props.track) {
            let totalDuration = this.props.track.totalDuration();
            let currentTime = this.props.track.delta;
            
            // Create all markers at once
            const markerElements = this.props.track.sections.map((section, index) => {
                const marker = document.createElement('div');
                marker.className = 'timeline-marker';
                const position = (currentTime / totalDuration) * 100;
                marker.style.left = `${position}%`;
                
                // Add marker label
                const label = document.createElement('div');
                label.className = 'marker-label';
                label.textContent = `${index + 1}`;
                marker.appendChild(label);
                
                // Highlight current section
                if (this.state.currentState && this.state.currentState.i === index) {
                    marker.classList.add('current-marker');
                }
                
                // Update currentTime for next marker
                section.timeboxes.forEach(timebox => {
                    currentTime += timebox.duration(this.props.track.tau, this.props.track);
                });
                
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
        console.log('Timeline setState called with:', {
            hasState: !!newState.currentState,
            hasTrack: !!this.props.track,
            state: newState.currentState ? 
                `(${newState.currentState.i},${newState.currentState.j},${newState.currentState.k})` : 
                'null',
            track: this.props.track ? this.props.track.id : 'null'
        });

        // Calculate new active width if state changed
        if (newState.currentState && this.props.track) {
            const absoluteTime = newState.currentState.absoluteTime(this.props.track);
            const totalDuration = this.props.track.totalDuration();
            newState.activeWidth = (absoluteTime / totalDuration) * 100;
            
            console.log('Timeline width calculation:', {
                absoluteTime: absoluteTime.toFixed(3),
                totalDuration: totalDuration.toFixed(3),
                activeWidth: newState.activeWidth.toFixed(1) + '%',
                state: `(${newState.currentState.i},${newState.currentState.j},${newState.currentState.k})`
            });
        } else {
            newState.activeWidth = 0;
            console.log('Timeline width set to 0% due to missing state or track');
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
    constructor(id) {
        super(id, 'section-view', {}, {
            currentSection: null,
            currentTrack: null,
            currentLanguage: 'en'
        });
        this.screen = null;  // Reference to parent screen
    }

    /**
     * Set parent screen reference
     * @param {Screen} screen - Parent screen instance
     */
    setScreen(screen) {
        this.screen = screen;
    }

    render() {
        // Get the existing sections-content element
        const div = document.getElementById('sections-content');
        if (!div) {
            console.error('sections-content element not found');
            return document.createElement('div');
        }
        
        // Clear existing content before adding new sections
        div.innerHTML = '';
        
        if (!this.state.currentTrack) {
            return div;
        }

        // Create sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'sections-container';
        
        // Calculate cumulative section start times
        let cumulativeTime = 0;
        
        this.state.currentTrack.sections.forEach((section, sectionIndex) => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'section';
            sectionElement.dataset.index = sectionIndex;
            
            // Add section header with time
            const header = document.createElement('div');
            header.className = 'section-header';
            
            // Format time as MM:SS
            const minutes = Math.floor(cumulativeTime / 60);
            const seconds = Math.floor(cumulativeTime % 60);
            const timeStr = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
            const sectionText = section.desc?.[this.state.currentLanguage] || section.desc?.en || `Section ${sectionIndex + 1}`;
            
            // Order time and text based on language direction
            header.textContent = this.state.currentLanguage === 'ar' 
                ? `${sectionText} ${timeStr}`
                : `${timeStr} ${sectionText}`;
            
            sectionElement.appendChild(header);
            
            // Create timeboxes container
            const timeboxesContainer = document.createElement('div');
            timeboxesContainer.className = 'timeboxes-container';
            timeboxesContainer.style.display = 'flex';
            timeboxesContainer.style.gap = '2px';
            timeboxesContainer.style.overflowX = 'auto';  // Make container scrollable

            // Calculate total duration for the section
            const sectionDuration = section.timeboxes.reduce((sum, timebox) => {
                return sum + timebox.duration(this.state.currentTrack.tau, this.state.currentTrack.n);
            }, 0);

            // Use original order - RTL/LTR handled by CSS direction
            section.timeboxes.forEach((timebox, timeboxIndex) => {
                const timeboxElement = document.createElement('div');
                timeboxElement.className = 'timebox';
                
                console.log('Raw timebox object:', timebox); // Debug log
                
                // Use timebox's nT if defined, otherwise use track's n
                const nT = timebox.nT !== undefined ? timebox.nT : this.state.currentTrack.n;
                
                // Calculate width based on nT and tau_width_px
                const width_px = Math.round(nT * this.screen.tau_width_px);
                
                // Set all inline styles for timebox
                Object.assign(timeboxElement.style, {
                    width: `${width_px}px`,
                    flexGrow: '0',
                    flexShrink: '0',
                    padding: '10pt',
                    borderRadius: '4px',
                    margin: '2px'
                });
                
                console.log(`Timebox ${timeboxIndex} width: ${width_px}px (nT: ${nT}, tau_width_px: ${this.screen.tau_width_px})`);

                // Add timebox content with current language
                const timeboxContent = document.createElement('div');
                timeboxContent.className = 'timebox-content';
                timeboxContent.textContent = timebox.desc?.[this.state.currentLanguage] || timebox.desc?.en || `Box ${timeboxIndex + 1}`;
                timeboxElement.appendChild(timeboxContent);
                
                // Add position indicators
                const positionsContainer = document.createElement('div');
                positionsContainer.className = 'positions-container';
                
                for (let i = 0; i < nT; i++) {
                    const positionDot = document.createElement('div');
                    positionDot.className = 'position-dot';
                    positionDot.style.width = `${100/nT}%`;
                    
                    // Check if this is the current position
                    const state = this.screen.player.state;
                    if (state && 
                        state.i === sectionIndex && 
                        state.j === timeboxIndex && 
                        state.k === i) {
                        positionDot.classList.add('current');
                    }
                    
                    positionsContainer.appendChild(positionDot);
                }
                
                timeboxElement.appendChild(positionsContainer);
                timeboxesContainer.appendChild(timeboxElement);
            });
            
            sectionElement.appendChild(timeboxesContainer);
            sectionsContainer.appendChild(sectionElement);
            
            // Update cumulative time for next section
            cumulativeTime += sectionDuration;
        });
        
        div.appendChild(sectionsContainer);
        return div;
    }

    setState(newState) {
        // Handle language updates
        if (newState.currentLanguage) {
            this.state.currentLanguage = newState.currentLanguage;
            this.render(); // Force re-render when language changes
        }
        // Handle track updates
        if (newState.currentTrack) {
            this.state.currentTrack = newState.currentTrack;
        }
        super.setState(newState);
        
        // Update position dot highlighting if state changed
        if (newState.currentSection !== undefined) {
            this.updatePositionHighlighting();
        }
    }

    updatePositionHighlighting() {
        // Remove all current highlights
        document.querySelectorAll('.position-dot.current').forEach(dot => {
            dot.classList.remove('current');
        });
        
        // Get current state from player
        const state = this.screen.player.state;
        if (!state) return;

        // Find the current section
        const currentSection = document.querySelector(`[data-index="${state.i}"]`);
        if (!currentSection) return;

        // Find the current timebox
        const currentBox = currentSection.querySelectorAll('.timebox')[state.j];
        if (!currentBox) return;

        // Find and highlight the current position dot
        const currentDot = currentBox.querySelectorAll('.position-dot')[state.k];
        if (currentDot) {
            currentDot.classList.add('current');
            console.log('Highlighting position:', {
                section: state.i,
                box: state.j,
                position: state.k
            });
        }
    }
}

/**
 * Track player screen: ΣΠ = (R, CΠ, IΠ, HΠ, Π)
 */
class TrackPlayerScreen extends Screen {
    /**
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {TrackPlayer} player - Track player instance
     * @param {Object} dispatcher - Event dispatcher
     */
    constructor(width, height, player, dispatcher) {
        super(width, height, player.screen_to_dot_ratio);
        
        // Initialize dimension to client screen size
        const clientWidth = document.documentElement.clientWidth;
        const clientHeight = document.documentElement.clientHeight;
        this.dimension = { width: clientWidth, height: clientHeight };
        
        this.player = player;

        // Initialize core components
        this.timeline = new Timeline('timeline');
        this.controls = new ControlPanel('controls');
        this.sectionView = new SectionView('section-view');
        this.sectionView.setScreen(this);

        // Initialize timeline with track and seek handler
        this.timeline.props = {
            track: player.currentTrack,
            onSeek: (time) => {
                player.seekTo(time);
                if (player.mode === PlaybackMode.PLAYING) {
                    const audioElement = document.querySelector('audio');
                    if (audioElement) {
                        audioElement.currentTime = time;
                    }
                }
            }
        };

        // Add components to screen
        this.addComponent(this.timeline);
        this.addComponent(this.controls);
        this.addComponent(this.sectionView);

        // Initialize section view with current track and language
        this.sectionView.setState({
            currentTrack: player.currentTrack,
            currentLanguage: 'en'
        });

        // Setup input handlers
        this.setupHandlers();

        // Use provided dispatcher
        dispatcher.subscribe(event => this.handlePlayerUpdate(event));
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
        const { currentTime, totalDuration, mode, speed, state } = event;
        
        // Log section changes
        if (state) {
            const previousState = this.sectionView.state.currentSection;
            const newSection = this.player.currentTrack.sections[state.i];
            
            if (!previousState || previousState !== newSection) {
                console.log('Section changed:', {
                    timestamp: performance.now().toFixed(3),
                    audioTime: currentTime.toFixed(3),
                    from: previousState ? 
                        `Section ${this.player.currentTrack.sections.indexOf(previousState)}` : 
                        'null',
                    to: `Section ${state.i}`,
                    state: `(${state.i},${state.j},${state.k})`
                });
            }
        }
        
        // Calculate progress percentage
        const progress = (currentTime / totalDuration) * 100;
        
        // Update timeline with both progress and state
        this.timeline.setState({
            currentState: state,
            progress: progress
        });

        // Update controls
        this.controls.setState({ mode, speed });

        // Update section view
        if (state) {
            this.sectionView.setState({
                currentSection: this.player.currentTrack.sections[state.i],
                currentTrack: this.player.currentTrack
            });

            // Scroll to current section
            this.scrollToCurrentSection(state.i);
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

    // Add method to handle language changes
    setLanguage(langCode) {
        this.sectionView.setState({
            currentLanguage: langCode
        });
    }
}

export { Component, Screen, TrackPlayerScreen }; 