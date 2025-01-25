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
        n: trackData.n
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
        
        // Format time as mm:ss
        const minutes = Math.floor(sectionStartTime / 60);
        const seconds = Math.floor(sectionStartTime % 60);
        const timePrefix = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const title = document.createElement('h3');
        title.textContent = `[${timePrefix}] ${section.desc}`;
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
            textContainer.textContent = `${box.desc}`;
            
            // Create container for position indicators
            const positionsContainer = document.createElement('div');
            positionsContainer.className = 'positions-container';
            positionsContainer.style.display = 'flex';
            positionsContainer.style.justifyContent = 'space-between'; // Distribute dots evenly
            positionsContainer.style.width = '100%';  // Take full width
            positionsContainer.style.marginTop = '4px';
            
            // Add position indicators (0 to n-1)
            for (let pos = 0; pos < track.n; pos++) {
                const positionDot = document.createElement('div');
                positionDot.className = 'position-dot';
                positionDot.dataset.position = pos;
                positionDot.style.width = '4px';
                positionDot.style.height = '4px';
                positionDot.style.borderRadius = '50%';
                positionDot.style.backgroundColor = '#ddd';
                // Remove gap since we're using space-between
                positionsContainer.appendChild(positionDot);
            }
            
            timeboxElement.appendChild(textContainer);
            timeboxElement.appendChild(positionsContainer);
            timeboxes.appendChild(timeboxElement);
        });

        sectionElement.appendChild(header);
        sectionElement.appendChild(timeboxes);
        sectionsContent.appendChild(sectionElement);
    });

    // Setup timer-based updates instead
    const UPDATE_INTERVAL = 50; // Update every 50ms (20 times per second)
    
    let lastTime = performance.now();
    const timer = setInterval(() => {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Ensure deltaTime is reasonable
        const maxDeltaTime = 1/20; // max 1/20th of a second
        const clampedDeltaTime = Math.min(deltaTime, maxDeltaTime);

        player.tick(clampedDeltaTime);

        // Update time display
        const time = player.currentTime();
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const cents = Math.floor((time % 1) * 100);
        
        const timeMain = document.querySelector('.time-main');
        const timeCents = document.querySelector('.time-cents');
        
        timeMain.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.`;
        timeCents.textContent = cents.toString().padStart(2, '0');

        // Update state display
        const state = player.state;
        currentSection.textContent = `${state.i}`;
        currentBox.textContent = `${state.j}`;
        currentPosition.textContent = `${state.k}`;

        // Highlight current section and timebox
        document.querySelectorAll('.section').forEach((section, sectionIndex) => {
            const isCurrentSection = sectionIndex === state.i;
            section.classList.toggle('current-section', isCurrentSection);
            
            section.querySelectorAll('.timebox').forEach((timebox, boxIndex) => {
                const isCurrentBox = isCurrentSection && boxIndex === state.j;
                timebox.classList.toggle('current-box', isCurrentBox);
                
                // Update position dots
                timebox.querySelectorAll('.position-dot').forEach((dot, posIndex) => {
                    const isCurrentPosition = isCurrentBox && posIndex === state.k;
                    dot.style.backgroundColor = isCurrentPosition ? '#ffffff' : '#888888';
                });
            });
        });
    }, UPDATE_INTERVAL);

    // Clean up timer when page unloads
    window.addEventListener('unload', () => {
        clearInterval(timer);
    });
});
