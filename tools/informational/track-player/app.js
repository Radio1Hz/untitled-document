import { Track } from './track-model.js';
import { TrackPlayer, PlaybackMode } from './track-player-model.js';
import { TrackPlayerScreen } from './track-player-screen-model.js';

document.addEventListener('DOMContentLoaded', () => {
    // Create a demo track
    const track = new Track({
        id: "\\vikktør\\tracks\\9. untitled-track",
        description: "før sofia.",
        tau: 0.5,  // 0.5 second units
        delta: 0,  // no padding
        n: 8      // 8 time units per box
    });

    // Add some sections with timeboxes
    const section1 = track.addSection("1. a track Θ is a tuple: Θ = (id, desc, τ, δ, n, ⟨S1, S2, …, Sm⟩)", "images/image-section-1.jpg");
    section1.addTimebox(0);    // First box starts at 0
    section1.addTimebox(8);    // Second box starts at 8 units
    section1.addTimebox(16);    
    section1.addTimebox(24);    
    section1.addTimebox(32);   
    section1.addTimebox(40);  
    section1.addTimebox(48);   
    section1.addTimebox(56);  

    const section2 = track.addSection("2. a track state Ψ represents a specific temporal position within a track, defined as: ", "images/image-section-2.jpg");
    section2.addTimebox(64);   
    section2.addTimebox(72);  
    section2.addTimebox(80);   
    section2.addTimebox(88);   
    section2.addTimebox(96);   
    section2.addTimebox(104);  
    section2.addTimebox(112);   
    section2.addTimebox(120);   

    const section3 = track.addSection("3. A track player Π is a stateful system that manages playback of a track, defined as: Π = (Θ, Ψ, τ, δ, n, ⟨S1, S2, …, Sm⟩)", "images/image-section-3.jpg");
    section3.addTimebox(128);   
    section3.addTimebox(136);  
    section3.addTimebox(144);   
    section3.addTimebox(152);   
    section3.addTimebox(160);   
    section3.addTimebox(168);  
    section3.addTimebox(176);   
    section3.addTimebox(184);   

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
    durationDisplay.textContent = `${track.totalDuration().toFixed(1)}s`;

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

        const title = document.createElement('h3');
        title.textContent = section.description;
        header.appendChild(title);

        const timeboxes = document.createElement('div');
        timeboxes.className = 'timeboxes-info';

        section.timeboxes.forEach(box => {
            const timeboxElement = document.createElement('div');
            timeboxElement.className = 'timebox';
            timeboxElement.textContent = `Duration: ${box.duration(track.tau, track.n)}s`;
            timeboxes.appendChild(timeboxElement);
        });

        sectionElement.appendChild(header);
        sectionElement.appendChild(timeboxes);
        sectionsContent.appendChild(sectionElement);
    });

    // Setup update loop
    let lastTime = performance.now();
    function update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Ensure deltaTime is reasonable (prevent large jumps)
        const maxDeltaTime = 1/30;
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
        currentSection.textContent = `${state.sectionIndex + 1}`;
        currentBox.textContent = `${state.boxIndex + 1}`;
        currentPosition.textContent = `${state.position}`;

        // Highlight current section in the sections list
        document.querySelectorAll('.section').forEach((section, index) => {
            if (index === state.sectionIndex) {
                section.classList.add('current-section');
            } else {
                section.classList.remove('current-section');
            }
        });

        requestAnimationFrame(update);
    }

    // Start update loop
    requestAnimationFrame(update);
});
