import { Track, TrackState } from './track-model.js';
import { TrackPlayer, PlaybackMode } from './track-player-model.js';
import { TrackPlayerScreen } from './track-player-screen-model.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Load track data
    const track9Data = await import('https://untitled-document.net/knowledge/agents/viktor-r/projects/vikktør/tracks/9. untitled-track/code/9. untitled-track.js');
    const track1Data = await import('https://untitled-document.net/knowledge/agents/viktor-r/projects/vikktør/tracks/1. there is no wisdom without kindness/code/1. there is no wisdom without kindness.js');

    // Create tracks from JSON data
    const track9Obj = new Track({
        id: track9Data.track9.id,
        description: track9Data.track9.description,
        tau: track9Data.track9.tau,
        delta: track9Data.track9.delta,
        n: track9Data.track9.n,
        tau_omega: track9Data.track9.tau_omega,
        dedication: track9Data.track9.dedication,
        audioUrl: track9Data.track9.audioUrl
    });

    // Add sections and timeboxes from JSON
    track9Data.track9.sections.forEach(sectionData => {
        const section = track9Obj.addSection(sectionData.description, sectionData.imageUrl);
        sectionData.timeboxes.forEach(boxData => {
            // Pass duration as nT if it differs from track's default n
            const nT = boxData.duration !== track9Obj.n ? boxData.duration : undefined;
            section.addTimebox(boxData.tStart, boxData.description, nT);
        });
    });

    const track1Obj = new Track({
        id: track1Data.track1.id,
        description: track1Data.track1.description,
        tau: track1Data.track1.tau,
        delta: track1Data.track1.delta,
        n: track1Data.track1.n,
        tau_omega: track1Data.track1.tau_omega,
        dedication: track1Data.track1.dedication,
        audioUrl: track1Data.track1.audioUrl
    });

    // Add sections and timeboxes from JSON
    track1Data.track1.sections.forEach(sectionData => {
        const section = track1Obj.addSection(sectionData.description, sectionData.imageUrl);
        sectionData.timeboxes.forEach(boxData => {
            // Use addTimeboxToSection instead of section.addTimebox
            track1Obj.addTimeboxToSection(section, boxData.tStart, boxData.description, boxData.nT);
        });
    });

    // Create player with custom screen_to_dot_ratio
    const player = new TrackPlayer(null, 1.0, 250, true, 25);  // Last parameter is screen_to_dot_ratio
    player.addTrack(track1Obj);
    player.addTrack(track9Obj);

    // Initialize player with track1 explicitly
    player.currentTrackIndex = 0;  // Set to first track (track1)
    player.currentTrack = player.playlist[0];  // Set current track to track1
    
    // Log current track object for debugging
    console.log('Current track after initialization:', {
        id: player.currentTrack.id,
        description: player.currentTrack.description,
        sections: player.currentTrack.sections,
        audioUrl: player.currentTrack.audioUrl,
        tau: player.currentTrack.tau,
        delta: player.currentTrack.delta,
        n: player.currentTrack.n
    });
    
    // Initialize player state after creating tracks
    player.state = new TrackState();
    
    // Create audio element with current track's audio URL
    const getEncodedAudioUrl = (url) => {
        // Split the URL at the domain to preserve the protocol and domain
        const [domain, ...path] = url.split('/knowledge/');
        // Encode only the path portion
        const encodedPath = path.join('/knowledge/').split('/').map(segment => 
            // Don't encode forward slashes, but encode other special characters
            encodeURIComponent(segment).replace(/%2F/g, '/')
        ).join('/');
        return `${domain}/knowledge/${encodedPath}`;
    };

    const audioElement = new Audio();
    audioElement.preload = 'auto';
    
    // Create a function to preload audio
    const preloadAudio = async (url) => {
        const encodedUrl = getEncodedAudioUrl(url);
        audioElement.src = encodedUrl;
        
        // Return a promise that resolves when audio is ready to play
        return new Promise((resolve, reject) => {
            const loadHandler = () => {
                audioElement.removeEventListener('canplaythrough', loadHandler);
                audioElement.removeEventListener('error', errorHandler);
                resolve();
            };
            
            const errorHandler = (error) => {
                audioElement.removeEventListener('canplaythrough', loadHandler);
                audioElement.removeEventListener('error', errorHandler);
                reject(error);
            };
            
            audioElement.addEventListener('canplaythrough', loadHandler);
            audioElement.addEventListener('error', errorHandler);
            
            // Start loading
            audioElement.load();
        });
    };

    // Preload initial track's audio immediately
    try {
        await preloadAudio(player.currentTrack.audioUrl);
        console.log('Initial audio preloaded successfully');
    } catch (error) {
        console.error('Error preloading initial audio:', error);
    }

    // Add audio event listeners for debugging
    audioElement.addEventListener('loadstart', () => console.log('Audio loading started'));
    audioElement.addEventListener('loadeddata', () => console.log('Audio data loaded'));
    audioElement.addEventListener('canplay', () => console.log('Audio can play'));
    audioElement.addEventListener('error', (e) => console.error('Audio error:', e));
    audioElement.addEventListener('playing', () => console.log('Audio playing'));
    audioElement.addEventListener('pause', () => console.log('Audio paused'));

    // Get the container element
    const container = document.querySelector('.container');
    
    // Create screen with default dimensions
    const screen = new TrackPlayerScreen(3000, 3000, player);
    
    // Initial mount
    screen.mount(container);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        screen.mount(container);
    });

    // Add global language state
    let current_lang_code = 'en';  // Changed: Set default to English
    
    // Add language selection handler
    const langSelect = document.getElementById('langSelect');
    langSelect.value = current_lang_code;  // Set initial selection to English
    
    langSelect.addEventListener('change', (e) => {
        current_lang_code = e.target.value;
        document.body.dataset.lang = current_lang_code;
        renderTrackContent();
    });

    // Initialize UI elements
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const speedBtn = document.getElementById('speedBtn');
    const trackTitle = document.getElementById('track-title');
    const loopBtn = document.getElementById('loopBtn');
    if (loopBtn) {
        loopBtn.remove(); // Remove the loop button from DOM if it exists
    }
    const timeDisplay = document.getElementById('currentTime');
    const durationDisplay = document.getElementById('track-duration');
    const speedDisplay = document.getElementById('track-speed');
    const sectionsContent = document.getElementById('sections-content');
    const currentSection = document.getElementById('current-section');
    const currentBox = document.getElementById('current-box');
    const currentPosition = document.getElementById('current-position');

    // Set track title
    trackTitle.textContent = player.currentTrack.id;

    // Format duration as hh:mm:ss
    const totalSeconds = Math.floor(player.currentTrack.totalDuration());
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    durationDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Initialize track state display
    currentSection.textContent = '0';
    currentBox.textContent = '0';
    currentPosition.textContent = '0';

    // Render initial track content
    renderTrackContent();

    // Modify the player controls to handle audio
    playPauseBtn.addEventListener('click', async () => {
        if (player.mode === PlaybackMode.PLAYING) {
            console.log('Pausing playback');
            player.pause();
            audioElement.pause();
            playPauseBtn.textContent = '▶';
        } else {
            console.log('Starting playback');
            try {
                // Reset time tracking
                accumulatedTime = 0;
                lastTickTime = null;
                
                // Initialize player state if needed
                if (!player.state) {
                    player.state = new TrackState();
                }
                
                // Start playback immediately if audio is loaded
                if (audioElement.readyState >= 3) { // HAVE_FUTURE_DATA or better
                    await audioElement.play();
                    player.play();
                    playPauseBtn.textContent = '⏸';
                } else {
                    // If audio isn't loaded, show loading state and wait
                    playPauseBtn.textContent = '⌛';
                    await preloadAudio(player.currentTrack.audioUrl);
                    await audioElement.play();
                    player.play();
                    playPauseBtn.textContent = '⏸';
                }
            } catch (error) {
                console.error('Playback failed:', error);
                player.pause();
                playPauseBtn.textContent = '▶';
            }
        }
    });

    stopBtn.addEventListener('click', () => {
        player.stop();
        audioElement.pause();
        audioElement.currentTime = 0;
        playPauseBtn.textContent = '▶';
    });

    // Update speed control to affect audio playback
    const speeds = [0.5, 1.0, 1.5, 2.0];
    let speedIndex = 1;
    speedBtn.addEventListener('click', () => {
        speedIndex = (speedIndex + 1) % speeds.length;
        const newSpeed = speeds[speedIndex];
        player.setSpeed(newSpeed);
        audioElement.playbackRate = newSpeed;  // Set audio playback rate
        speedBtn.textContent = `${newSpeed}x`;
        speedDisplay.textContent = `${newSpeed}x`;
    });

    // Update audio element to match player's looping state
    audioElement.loop = player.looping;

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
    
    // Modify the update function to handle predelay
    let playStartTime = null;
    
    function update(currentTime) {
        if (lastTickTime === null) {
            lastTickTime = currentTime;
            return requestAnimationFrame(update);
        }

        const deltaTime = (currentTime - lastTickTime) / 1000;
        lastTickTime = currentTime;

        if (player.mode === PlaybackMode.PLAYING) {
            const audioTime = audioElement.currentTime;
            
            if (playStartTime === null) {
                playStartTime = currentTime;
            }
            
            const timeSincePlay = currentTime - playStartTime;
            if (timeSincePlay < player.predelay_ms) {
                player.state = new TrackState();
            } else {
                const adjustedAudioTime = audioTime - (player.predelay_ms / 1000);
                
                // Find the last transition that should have occurred by now
                const currentTransition = player.transitionTimes
                    .filter(t => t.time <= adjustedAudioTime)
                    .pop();

                if (currentTransition) {
                    console.log(`At time ${adjustedAudioTime.toFixed(3)}, using transition:`, 
                        currentTransition.time.toFixed(3), 
                        `state: (${currentTransition.state.i},${currentTransition.state.j},${currentTransition.state.k})`
                    );
                    
                    player.state = new TrackState(
                        currentTransition.state.i,
                        currentTransition.state.j,
                        currentTransition.state.k
                    );
                }
            }
        }

        // Update visual elements
        updateVisuals(audioElement.currentTime);

        requestAnimationFrame(update);
    }

    function updateVisuals(time) {
        // Skip visual updates if player state is not initialized
        if (!player.state) return;

        // Calculate minutes, seconds, and cents
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
            section.classList.toggle('current-section', isCurrentSection);
            
            section.querySelectorAll('.timebox').forEach((timebox, boxIndex) => {
                const isCurrentBox = isCurrentSection && boxIndex === state.j;
                timebox.classList.toggle('current-box', isCurrentBox);
                
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
        audioElement.pause();
        audioElement.src = '';
    });

    // Update the updateAudioSource function
    const updateAudioSource = async () => {
        try {
            playPauseBtn.textContent = '⌛'; // Show loading state
            await preloadAudio(player.currentTrack.audioUrl);
            playPauseBtn.textContent = '▶';
            console.log('New audio source loaded successfully');
        } catch (error) {
            console.error('Error loading audio:', error);
            playPauseBtn.textContent = '▶';
        }
    };

    // Modify the selectTrack function to update audio source
    player.selectTrack = async function(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.mode = PlaybackMode.LOADING;
            this.currentTrackIndex = index;
            this.currentTrack = this.playlist[index];
            this.state = new TrackState();
            this.time = 0;
            this.accumulatedTime = 0;
            this.mode = PlaybackMode.STOPPED;
            
            // Update audio source when track changes
            updateAudioSource();
            
            // Update UI
            renderTrackContent();
        }
    };

    // Add helper function for Arabic numeral conversion
    function toArabicNumerals(str) {
        const numerals = {
            '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
            '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
        };
        return str.replace(/[0-9]/g, d => numerals[d]);
    }

    // Update section time formatting in renderTrackContent
    function renderTrackContent() {
        // Clear existing content
        sectionsContent.innerHTML = '';
        
        // Render track title
        trackTitle.textContent = player.currentTrack.id;
        
        // Let SectionView handle the rendering
        screen.sectionView.render();
    }

    // Add ended event listener to handle track completion
    audioElement.addEventListener('ended', () => {
        // Reset everything to initial state
        player.stop();  // This ensures proper mode reset
        player.state = new TrackState();
        player.time = 0;
        accumulatedTime = 0;
        playStartTime = null;
        
        // Start playing again if looping is enabled
        if (player.looping) {
            audioElement.currentTime = 0;
            // Set mode to PLAYING before starting audio
            player.mode = PlaybackMode.PLAYING;
            audioElement.play().then(() => {
                playStartTime = performance.now();
                // Ensure state is reset
                player.state = new TrackState();
                // Force immediate visual update
                updateVisuals(0);
            }).catch(error => {
                console.error('Error restarting playback:', error);
                player.stop();
            });
        }
    });
});
