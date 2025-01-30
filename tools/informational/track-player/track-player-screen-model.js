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
     * @param {number} tau_width_px - Fixed width for each time unit
     */
    constructor(width, height, tau_width_px = 40) {
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
                
                // Add marker label with appropriate time format
                const label = document.createElement('div');
                label.className = 'marker-label';
                
                // Get section description with fallbacks
                const description = section.description?.[this.props.language] || 
                                  section.description?.en || 
                                  section.desc?.[this.props.language] ||
                                  section.desc?.en ||
                                  `Section ${index + 1}`;
                
                // Use the calculated section start time for the marker
                label.textContent = `[${this.formatTime(sectionStartTime)}] ${description}`;
                marker.appendChild(label);
                
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
            // Get the next state
            const nextState = newState.currentState.advance(this.props.track);
            
            if (nextState) {
                // Use next state's time for progress bar
                const absoluteTime = nextState.absoluteTime(this.props.track);
                const totalDuration = this.props.track.totalDuration();
                newState.progress = (absoluteTime / totalDuration) * 100;
            } else {
                // If there is no next state (end of track), use current state
                const absoluteTime = newState.currentState.absoluteTime(this.props.track);
                const totalDuration = this.props.track.totalDuration();
                newState.progress = (absoluteTime / totalDuration) * 100;
            }
        } else {
            newState.progress = 0;
            console.log('Timeline progress set to 0% due to missing state or track');
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
        this.screen = null;
        this.hasScrolledInSection = false;
        this.currentSectionIndex = null;
        this.lastBoxIndex = null;
        this.lastState = null;  // Add tracking for last state
    }

    /**
     * Set parent screen reference
     * @param {Screen} screen - Parent screen instance
     */
    setScreen(screen) {
        this.screen = screen;
    }

    render() {
        const div = document.createElement('div');
        div.className = 'section-view';
        
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'sections-container';
        
        let cumulativeTime = 0;
        const currentState = this.screen.player.state;

        this.state.currentTrack.sections.forEach((section, sectionIndex) => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'section';
            sectionElement.dataset.index = sectionIndex;
            
            // Add current-section class to current section
            if (currentState && currentState.i === sectionIndex) {
                sectionElement.classList.add('current-section');
            }
            
            // Add section header with description
            const header = document.createElement('div');
            header.className = 'section-header';
            
            // Check if this section is currently active
            if (currentState && currentState.i === sectionIndex) {
                header.classList.add('active');
            }
            
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
            
            // Calculate total duration of section
            const sectionDuration = section.timeboxes.reduce((sum, box) => {
                return sum + box.duration(this.state.currentTrack.tau, this.state.currentTrack.n);
            }, 0);

            // Create timeboxes container
            const timeboxesContainer = document.createElement('div');
            timeboxesContainer.className = 'timeboxes-container';
            timeboxesContainer.style.display = 'flex';
            timeboxesContainer.style.gap = '2px';
            timeboxesContainer.style.overflowX = 'auto';

            section.timeboxes.forEach((timebox, timeboxIndex) => {
                const timeboxElement = document.createElement('div');
                timeboxElement.className = 'timebox';
                
                // Calculate width based on number of time units (nT) and tau_width_px
                const nT = timebox.nT !== undefined ? timebox.nT : this.state.currentTrack.n;
                const width_px = Math.round(nT * this.screen.tau_width_px);
                
                Object.assign(timeboxElement.style, {
                    width: `${width_px}px`,
                    flexGrow: '0',
                    flexShrink: '0',
                    margin: '2px'
                });

                // Add timebox content with current language
                const timeboxContent = document.createElement('div');
                timeboxContent.className = 'timebox-content';
                const description = timebox.desc?.[this.state.currentLanguage] || 
                                   timebox.desc?.en || 
                                   Object.values(timebox.desc || {})[0] ||
                                   `Box ${timeboxIndex + 1}`;
                timeboxContent.textContent = description;
                
                // Check if this is the current timebox and add appropriate class
                if (currentState && 
                    currentState.i === sectionIndex && 
                    currentState.j === timeboxIndex) {
                    timeboxContent.classList.add('current');
                }
                
                timeboxElement.appendChild(timeboxContent);
                
                // Add position indicators
                const positionsContainer = document.createElement('div');
                positionsContainer.className = 'positions-container';
                
                for (let i = 0; i < timebox.nT; i++) {
                    const positionDot = document.createElement('div');
                    positionDot.className = 'position-dot';
                    positionDot.style.width = `${100/timebox.nT}%`;
                    
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
            sectionsContainer.appendChild(sectionElement);
            
            // Update cumulative time for next section
            cumulativeTime += section.timeboxes.reduce((sum, timebox) => {
                return sum + timebox.duration(this.state.currentTrack.tau, this.state.currentTrack.n);
            }, 0);
        });
        
        div.appendChild(sectionsContainer);
        return div;
    }

    updatePositionHighlighting() {
        const state = this.screen.player.state;
        if (!state) return;

        // Remove all current highlights
        document.querySelectorAll('.position-dot.current').forEach(dot => {
            dot.classList.remove('current');
        });
        document.querySelectorAll('.timebox-content.current').forEach(content => {
            content.classList.remove('current');
        });
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('current-section');
        });

        // Find and mark current section
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
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {TrackPlayer} player - Track player instance
     * @param {Object} dispatcher - Event dispatcher
     */
    constructor(width, height, player, dispatcher) {
        super(width, height, 40);
        
        this.width = '100%';
        this.height = '100%';
        this.player = player;
        this.dispatcher = dispatcher;
        this.language = 'en';  // Add default language

        // Initialize core components
        this.timeline = new Timeline('timeline');
        this.controls = new ControlPanel('controls');
        this.sectionView = new SectionView('section-view');
        this.sectionView.setScreen(this);

        // Initialize timeline with track and language
        this.timeline.props = {
            track: player.currentTrack,
            language: this.language,
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
        this.dispatcher.subscribe(event => {
            this.handlePlayerUpdate(event);
        });
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
        // Update section view
        if (this.sectionView) {
            this.sectionView.updatePositionHighlighting();
        }
        
        // Update timeline progress
        if (this.timeline && this.player.currentTrack) {
            const progress = (this.player.time / this.player.currentTrack.totalDuration()) * 100;
            this.timeline.setState({
                progress: progress,
                currentState: this.player.state
            });
            
            // Force re-render of timeline
            const timelineContainer = document.querySelector('.timeline');
            if (timelineContainer) {
                const timelineElement = this.timeline.render();
                timelineContainer.innerHTML = '';
                timelineContainer.appendChild(timelineElement);
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
} 