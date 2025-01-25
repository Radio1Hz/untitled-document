import { Track } from './track-model.js';
import { TrackPlayer, PlaybackMode } from './track-player-model.js';
import { TrackPlayerScreen } from './track-player-screen-model.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Load track from JSON
    const trackData = untitled_track;
    
    // Create track from JSON data
    const track = new Track({
        id: trackData.id,
        desc: trackData.desc,
        tau: trackData.tau,
        delta: trackData.delta,
        n: trackData.n      // This controls positions per timebox
    });

    // Add sections and timeboxes from JSON
    trackData.sections.forEach(sectionData => {
        const section = track.addSection(sectionData.desc, sectionData.imageUrl);
        sectionData.timeboxes.forEach(boxData => {
            section.addTimebox(boxData.tStart, boxData.desc);
        });
    });

    // Create player and screen
    const player = new TrackPlayer(track);
    const screen = new TrackPlayerScreen(800, 600, player);

    // Initialize UI elements
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const speedBtn = document.getElementById('speedBtn');
    const trackTitle = document.getElementById('track-title');
    const loopBtn = document.getElementById('loopBtn');
    loopBtn.textContent = '🔁';
    loopBtn.classList.add('loop-inactive');  // Initial state
    const timeDisplay = document.getElementById('currentTime');
    const durationDisplay = document.getElementById('track-duration');
    const speedDisplay = document.getElementById('track-speed');
    const sectionsContent = document.getElementById('sections-content');
    const currentSection = document.getElementById('current-section');
    const currentBox = document.getElementById('current-box');
    const currentPosition = document.getElementById('current-position');

    // Set track title
    trackTitle.textContent = track.id;

    // Display track duration
    durationDisplay.textContent = `${track.totalDuration().toFixed(0)}s`;

    // Initialize track state display
    currentSection.textContent = '0';  // Changed from 1 to 0
    currentBox.textContent = '0';      // Changed from 1 to 0
    currentPosition.textContent = '0';  // Already 0

    // Setup playback controls
    playPauseBtn.addEventListener('click', () => {
        if (player.mode === PlaybackMode.PLAYING) {
            player.pause();
            playPauseBtn.textContent = '▶';
        } else {
            player.play();
            playPauseBtn.textContent = '⏸';
        }
    });

    stopBtn.addEventListener('click', () => {
        player.stop();
        playPauseBtn.textContent = '▶';
    });

    // Setup speed control
    const speeds = [0.5, 1.0, 1.5, 2.0];
    let speedIndex = 1;
    speedBtn.addEventListener('click', () => {
        speedIndex = (speedIndex + 1) % speeds.length;
        const newSpeed = speeds[speedIndex];
        player.setSpeed(newSpeed);
        speedBtn.textContent = `${newSpeed}x`;
        speedDisplay.textContent = `${newSpeed}x`;
    });

    // Setup loop control
    let isLooping = false;
    loopBtn.addEventListener('click', () => {
        isLooping = !isLooping;
        player.setLooping(isLooping);
        loopBtn.classList.toggle('loop-active', isLooping);
        loopBtn.classList.toggle('loop-inactive', !isLooping);
        loopBtn.title = isLooping ? 'Looping enabled' : 'Looping disabled';
    });

    // Add global language state
    let current_lang_code = 'en';
    
    // Add language selection handler
    const langSelect = document.getElementById('langSelect');
    langSelect.value = current_lang_code;
    
    langSelect.addEventListener('change', (e) => {
        current_lang_code = e.target.value;
        document.body.dataset.lang = current_lang_code;
        renderTrackContent();
    });

    // Separate rendering logic into a function for reuse
    function renderTrackContent() {
        // Clear existing content
        sectionsContent.innerHTML = '';
        
        // Render track title
        trackTitle.textContent = track.desc[current_lang_code];
        
        // Render sections
        track.sections.forEach((section, index) => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'section';
            sectionElement.dataset.index = index;

            const header = document.createElement('div');
            header.className = 'section-header';

            // Calculate section start time
            let sectionStartTime = 0;
            for (let i = 0; i < index; i++) {
                sectionStartTime += track.sections[i].duration(track.tau, track.n);
            }
            
            const minutes = Math.floor(sectionStartTime / 60);
            const seconds = Math.floor(sectionStartTime % 60);
            const timePrefix = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            const title = document.createElement('h3');
            title.textContent = `[${timePrefix}] ${section.desc[current_lang_code]}`;
            header.appendChild(title);

            const timeboxes = document.createElement('div');
            timeboxes.className = 'timeboxes-info';
            timeboxes.style.minWidth = '200px';
            timeboxes.style.display = 'flex';  // Add flex display
            timeboxes.style.flexWrap = 'wrap'; // Enable wrapping
            timeboxes.style.gap = '4px';       // Add some spacing between boxes

            section.timeboxes.forEach((box, boxIndex) => {
                const timeboxElement = document.createElement('div');
                timeboxElement.className = 'timebox';
                timeboxElement.style.flexGrow = '0';     
                timeboxElement.style.flexShrink = '0';   
                
                // Create container for text and positions
                const textContainer = document.createElement('div');
                textContainer.textContent = `${box.desc[current_lang_code]}`;
                
                // Create container for position indicators
                const positionsContainer = document.createElement('div');
                positionsContainer.className = 'positions-container';
                positionsContainer.style.display = 'flex';
                positionsContainer.style.justifyContent = 'space-between'; // Distribute lines evenly
                positionsContainer.style.width = '100%';  // Take full width
                positionsContainer.style.marginTop = '4px';
                
                // Add position indicators (0 to n-1)
                for (let pos = 0; pos < track.n; pos++) {
                    const positionLine = document.createElement('div');
                    positionLine.className = 'position-line';
                    positionLine.dataset.position = pos;
                    positionLine.style.width = '8px';         // Changed: now line length
                    positionLine.style.height = '2px';        // Changed: now line thickness
                    positionLine.style.backgroundColor = '#888888';
                    positionsContainer.appendChild(positionLine);
                }
                
                timeboxElement.appendChild(textContainer);
                timeboxElement.appendChild(positionsContainer);
                timeboxes.appendChild(timeboxElement);
            });

            sectionElement.appendChild(header);
            sectionElement.appendChild(timeboxes);
            sectionsContent.appendChild(sectionElement);
        });
    }

    // Initial render
    renderTrackContent();

    // After creating player and screen, initialize background manager
    const backgroundImages = document.querySelectorAll('.background-image');
    let currentBgIndex = 0;
    
    function updateBackground(imageUrl) {
        if (!imageUrl) return;
        
        // Get next background element
        const nextIndex = (currentBgIndex + 1) % 2;
        const currentBg = backgroundImages[currentBgIndex];
        const nextBg = backgroundImages[nextIndex];
        
        // Prepare next image
        nextBg.style.backgroundImage = `url(${imageUrl})`;
        
        // Fade out current, fade in next
        currentBg.classList.remove('active');
        nextBg.classList.add('active');
        
        // Update current index
        currentBgIndex = nextIndex;
    }

    // Instead of using setInterval, let's use requestAnimationFrame with time correction
    const targetInterval = 50; // 50ms for smooth visual updates
    let lastTickTime = null;
    let accumulatedTime = 0;
    
    function update(currentTime) {
        if (lastTickTime === null) {
            lastTickTime = currentTime;
        }

        // Calculate precise time since last frame
        const deltaTime = (currentTime - lastTickTime) / 1000;
        lastTickTime = currentTime;

        // Accumulate time and update state only when needed
        accumulatedTime += deltaTime;
        
        // Update visual elements every frame for smoothness
        updateVisuals(player.currentTime());

        // But update track state only at precise tau intervals
        while (accumulatedTime >= player.track.tau) {
            player.tick(player.track.tau); // Use exact tau value instead of accumulated deltaTime
            accumulatedTime -= player.track.tau;
        }

        requestAnimationFrame(update);
    }

    function updateVisuals(time) {
        // Move visual update code here (time display, highlighting, etc)
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const cents = Math.floor((time % 1) * 100);
        
        const timeMain = document.querySelector('.time-main');
        const timeCents = document.querySelector('.time-cents');
        
        timeMain.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.`;
        timeCents.textContent = cents.toString().padStart(2, '0');

        // Update state display
        const state = player.state;
        const prevSection = currentSection.textContent;
        const prevBox = currentBox.textContent;
        const prevPosition = currentPosition.textContent;
        
        // Update display elements with leading zeros
        currentSection.textContent = state.i.toString().padStart(2, '0');
        currentBox.textContent = state.j.toString().padStart(2, '0');
        currentPosition.textContent = state.k.toString().padStart(2, '0');

        // Log state transitions if any value changed
        if (prevSection !== state.i.toString().padStart(2, '0') || 
            prevBox !== state.j.toString().padStart(2, '0') || 
            prevPosition !== state.k.toString().padStart(2, '0')) {
            
            const timestamp = performance.now();
            console.log(
                `[${timestamp.toFixed(3)}ms] State transition:`,
                `section: ${prevSection}->${state.i.toString().padStart(2, '0')}`,
                `box: ${prevBox}->${state.j.toString().padStart(2, '0')}`,
                `pos: ${prevPosition}->${state.k.toString().padStart(2, '0')}`
            );
        }

        // Highlight current section and timebox
        document.querySelectorAll('.section').forEach((section, sectionIndex) => {
            const isCurrentSection = sectionIndex === state.i;
            
            // If this is a new section, update background
            if (isCurrentSection && !section.classList.contains('current-section')) {
                const sectionData = track.sections[sectionIndex];
                if (sectionData && sectionData.imageUrl) {
                    updateBackground(sectionData.imageUrl);
                }
            }
            
            section.classList.toggle('current-section', isCurrentSection);
            
            section.querySelectorAll('.timebox').forEach((timebox, boxIndex) => {
                const isCurrentBox = isCurrentSection && boxIndex === state.j;
                timebox.classList.toggle('current-box', isCurrentBox);
                
                // Update position lines
                timebox.querySelectorAll('.position-line').forEach((line, posIndex) => {
                    const isCurrentPosition = isCurrentBox && posIndex === state.k;
                    line.style.backgroundColor = isCurrentPosition ? '#ffffff' : '#888888';
                });
            });
        });
    }

    // Start the animation loop
    requestAnimationFrame(update);

    // Clean up when page unloads
    window.addEventListener('unload', () => {
        // No need to clear interval anymore
    });
});
