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
        
        // Calculate the size based on minimum screen dimension to maintain 1:1 ratio
        const minDimension = Math.min(clientWidth, clientHeight, this.dimension.width);
        
        // Update tau_width_px based on actual screen size using the ratio
        this.tau_width_px = minDimension / this.screen_to_dot_ratio;
        console.log(`Screen dimension: ${minDimension}px, tau_width_px: ${this.tau_width_px}px`);
        
        // Set container size maintaining 1:1 ratio
        container.style.width = `${minDimension}px`;
        container.style.height = `${minDimension}px`;
        
        // Center the container
        container.style.margin = '0 auto';
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
 * Timeline component for track player
 */
class Timeline extends Component {
    constructor(id) {
        super(id, 'timeline', {}, {
            position: 0,
            scale: 1,
            markers: []
        });
    }

    render() {
        const div = document.createElement('div');
        div.className = 'timeline';
        // ... implement timeline visualization
        return div;
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
        // Use the existing sections-content element
        const div = document.getElementById('sections-content');
        if (!div) {
            console.error('sections-content element not found');
            return document.createElement('div');
        }
        
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
        }
        // Handle track updates
        if (newState.currentTrack) {
            this.state.currentTrack = newState.currentTrack;
        }
        super.setState(newState);
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
     */
    constructor(width, height, player) {
        // Pass player's screen_to_dot_ratio to parent Screen class
        super(width, height, player.screen_to_dot_ratio);
        
        // Inherit dimension from parent Screen class
        this.dimension = this.dimension || { width: 3000, height: 3000 };
        
        this.player = player;

        // Initialize core components
        this.timeline = new Timeline('timeline');
        this.controls = new ControlPanel('controls');
        this.sectionView = new SectionView('section-view');
        this.sectionView.setScreen(this);  // Set screen reference

        // Add components to screen
        this.addComponent(this.timeline);
        this.addComponent(this.controls);
        this.addComponent(this.sectionView);

        // Initialize section view with current track and language
        this.sectionView.setState({
            currentTrack: player.currentTrack,
            currentLanguage: 'en'  // Default language
        });

        // Setup input handlers
        this.setupHandlers();

        // Setup player event subscription
        const dispatcher = player.createEventDispatcher();
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
        const { currentTime, remainingTime, mode, speed, state } = event;

        // Update timeline
        this.timeline.setState({
            position: currentTime / this.player.currentTrack.totalDuration()
        });

        // Update controls
        this.controls.setState({ mode, speed });

        // Update section view with current section and track
        this.sectionView.setState({
            currentSection: this.player.currentTrack.sections[state.i],
            currentTrack: this.player.currentTrack
        });

        // Scroll to current section
        this.scrollToCurrentSection(state.i);
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