import { Track, TrackState } from './track-model.js';
import { TrackPlayer, PlaybackMode } from './track-player-model.js';
import { TrackPlayerScreen } from './track-player-screen-model.js';
import { Playlist, PlaylistMode } from './playlist-model.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Load track data
    const track9Data = await import('https://untitled-document.net/knowledge/agents/viktor-r/projects/vikktør/tracks/9. untitled-track/code/9. untitled-track.js');
    const track1Data = await import('https://untitled-document.net/knowledge/agents/viktor-r/projects/vikktør/tracks/1. there is no wisdom without kindness/code/1. there is no wisdom without kindness.js');

    // Log raw track data
    console.log('Raw track9 data:', track9Data.track9);
    console.log('Raw track1 data:', track1Data.track1);

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
            // Use nT directly from the timebox data
            track9Obj.addTimeboxToSection(section, boxData.tStart, boxData.description, boxData.nT);
        });
    });

    // Log initialized track object
    console.log('Initialized track9:', track9Obj);

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

    // Create playlist and add tracks
    const playlist = new Playlist();
    playlist.addTrack(track1Obj);
    playlist.addTrack(track9Obj);

    // Create a map of track IDs to track objects for persistence
    const trackMap = new Map();
    [track1Obj, track9Obj].forEach(track => trackMap.set(track.id, track));

    // Try to load saved playlist state
    playlist.load(trackMap);

    // Create player with custom screen_to_dot_ratio
    const player = new TrackPlayer(null, 1.0, 0, true, 50);

    // Initialize UI elements first
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const speedBtn = document.getElementById('speedBtn');
    const trackTitle = document.getElementById('track-title');
    const loopBtn = document.getElementById('loopBtn');
    if (loopBtn) {
        loopBtn.remove(); // Remove the loop button from DOM if it exists
    }
    const timeDisplay = document.getElementById('currentTime');
    const speedDisplay = document.getElementById('track-speed');
    const sectionsContent = document.getElementById('sections-content');

    // Initialize state info with leading zeros
    const currentSection = document.getElementById('current-section');
    const currentBox = document.getElementById('current-box');
    const currentPosition = document.getElementById('current-position');

    if (currentSection && currentBox && currentPosition) {
        currentSection.textContent = '00';
        currentBox.textContent = '00';
        currentPosition.textContent = '00';
    }

    // Create audio element
    const audioElement = new Audio();
    audioElement.preload = 'auto';

    // Add audio event listeners for debugging
    audioElement.addEventListener('loadstart', () => console.log('Audio loading started'));
    audioElement.addEventListener('loadeddata', () => console.log('Audio data loaded'));
    audioElement.addEventListener('canplay', () => console.log('Audio can play'));
    audioElement.addEventListener('error', (e) => console.error('Audio error:', e));
    audioElement.addEventListener('playing', () => console.log('Audio playing'));
    audioElement.addEventListener('pause', () => console.log('Audio paused'));

    // Audio URL encoding helper
    const getEncodedAudioUrl = (url) => {
        const [domain, ...path] = url.split('/knowledge/');
        const encodedPath = path.join('/knowledge/').split('/').map(segment => 
            encodeURIComponent(segment).replace(/%2F/g, '/')
        ).join('/');
        return `${domain}/knowledge/${encodedPath}`;
    };

    // Preload audio function
    const preloadAudio = async (url) => {
        const encodedUrl = getEncodedAudioUrl(url);
        audioElement.src = encodedUrl;
        
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
            audioElement.load();
        });
    };

    // Update audio source function
    const updateAudioSource = async () => {
        try {
            playPauseBtn.textContent = '⌛';
            await preloadAudio(player.currentTrack.audioUrl);
            playPauseBtn.textContent = '▶';
            console.log('New audio source loaded successfully');
        } catch (error) {
            console.error('Error loading audio:', error);
            playPauseBtn.textContent = '▶';
        }
    };

    // Load and play track function
    async function loadAndPlayTrack(track) {
        player.stop();
        player.currentTrack = track;
        player.state = new TrackState();
        
        try {
            await updateAudioSource();
            updatePlaylistView();
            renderTrackContent();
            
            if (player.mode === PlaybackMode.PLAYING) {
                audioElement.play();
            }
        } catch (error) {
            console.error('Error loading track:', error);
        }
    }

    // Add playlist controls to UI
    const controlsContainer = document.querySelector('.track-controls');
    const playlistControls = document.createElement('div');
    playlistControls.className = 'playlist-controls';
    playlistControls.innerHTML = `
        <button id="prevTrackBtn" class="untitled-button" aria-label="Previous track">⏮</button>
        <button id="nextTrackBtn" class="untitled-button" aria-label="Next track">⏭</button>
        <button id="playlistModeBtn" class="untitled-button" aria-label="Playlist mode">🔁</button>
    `;
    controlsContainer.appendChild(playlistControls);

    // Add playlist view (simplified)
    const container = document.querySelector('.container');
    const playlistView = document.createElement('div');
    playlistView.className = 'playlist-view';
    playlistView.innerHTML = '<div class="playlist-items"></div>';
    container.appendChild(playlistView);

    // Function to update playlist view (simplified)
    function updatePlaylistView() {
        const playlistItems = document.querySelector('.playlist-items');
        playlistItems.innerHTML = '';
        
        playlist.tracks.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (index === playlist.currentIndex) {
                item.classList.add('current');
            }
            
            // Extract track number from audioUrl
            const trackNumber = track.audioUrl.match(/\/(\d+)\./)?.[1] || '?';
            
            // Simplified structure - single div with hover info
            item.innerHTML = `${trackNumber}`;
            item.title = `${track.description?.en || track.id} [${formatDuration(track.totalDuration())}]`;
            
            item.addEventListener('click', () => {
                playlist.jumpTo(index);
                updatePlaylistView();
                loadAndPlayTrack(playlist.getCurrentTrack());
            });
            
            playlistItems.appendChild(item);
        });

        // Update mode button text
        const modeBtn = document.getElementById('playlistModeBtn');
        const modeIcons = {
            [PlaylistMode.SEQUENTIAL]: '➡',
            [PlaylistMode.REPEAT_ONE]: '🔂',
            [PlaylistMode.REPEAT_ALL]: '🔁',
            [PlaylistMode.SHUFFLE]: '🔀'
        };
        modeBtn.textContent = modeIcons[playlist.mode];
    }

    // Format duration helper
    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Add event listeners for playlist controls
    document.getElementById('prevTrackBtn').addEventListener('click', () => {
        const prevTrack = playlist.previous();
        if (prevTrack) {
            loadAndPlayTrack(prevTrack);
        }
    });

    document.getElementById('nextTrackBtn').addEventListener('click', () => {
        const nextTrack = playlist.next();
        if (nextTrack) {
            loadAndPlayTrack(nextTrack);
        }
    });

    document.getElementById('playlistModeBtn').addEventListener('click', () => {
        const modes = Object.values(PlaylistMode);
        const currentIndex = modes.indexOf(playlist.mode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        playlist.setMode(nextMode);
        updatePlaylistView();
    });

    // Add ended event listener for playlist progression
    audioElement.addEventListener('ended', () => {
        const nextTrack = playlist.next();
        if (nextTrack) {
            loadAndPlayTrack(nextTrack);
        } else {
            player.stop();
            playPauseBtn.textContent = '▶';
        }
    });

    // Save playlist state before unloading
    window.addEventListener('beforeunload', () => {
        playlist.save();
    });

    // Initial UI update
    updatePlaylistView();
    
    // Initialize with first track
    const initialTrack = playlist.getCurrentTrack();
    if (initialTrack) {
        loadAndPlayTrack(initialTrack);
    }

    // Create single dispatcher instance
    const dispatcher = player.createEventDispatcher();
    console.log('Dispatcher created');

    // Create screen with the same dispatcher
    const screen = new TrackPlayerScreen(3000, 3000, player, dispatcher);  // Pass dispatcher to screen
    
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
        
        // Update both the screen's language and re-render content
        screen.sectionView.setState({
            currentLanguage: current_lang_code
        });
        renderTrackContent();
    });

    // Set track title
    trackTitle.textContent = player.currentTrack.id;

    // Format duration as hh:mm:ss
    const totalSeconds = Math.floor(player.currentTrack.totalDuration());
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // Render initial track content
    renderTrackContent();

    // Modify the player controls to handle audio
    playPauseBtn.addEventListener('click', async () => {
        if (player.mode === PlaybackMode.PLAYING) {
            console.log('Pausing playback');
            player.pause();
            audioElement.pause();
            playPauseBtn.textContent = '▶';
            dispatcher.dispatch();  // Final dispatch when pausing
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
                if (audioElement.readyState >= 3) {
                    await audioElement.play();
                    player.play();
                    playPauseBtn.textContent = '⏸';
                    dispatcher.dispatch();  // Initial dispatch
                } else {
                    // If audio isn't loaded, show loading state and wait
                    playPauseBtn.textContent = '⌛';
                    await preloadAudio(player.currentTrack.audioUrl);
                    await audioElement.play();
                    player.play();
                    playPauseBtn.textContent = '⏸';
                    // Initial dispatch when starting playback after loading
                    dispatcher.dispatch();
                }
            } catch (error) {
                console.error('Playback failed:', error);
                player.pause();
                playPauseBtn.textContent = '▶';
            }
        }
    });

    stopBtn.addEventListener('click', () => {
        // Stop playback
        player.stop();
        audioElement.pause();
        audioElement.currentTime = 0;
        playPauseBtn.textContent = '▶';
        
        // Reset player state to initial
        player.state = new TrackState(0, 0, 0);
        player.time = 0;
        accumulatedTime = 0;
        playStartTime = null;
        
        // Dispatch event to update UI
        dispatcher.dispatch();
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
    
    // Separate visual updates from state checks
    function updateVisuals(currentTime) {
        if (!player.state) return;

        const timeMain = document.querySelector('.time-main');
        const timeCents = document.querySelector('.time-cents');
        
        if (player.currentTrack.tau_omega) {
            // Calculate current world time based on tau_omega
            const startTime = new Date(player.currentTrack.tau_omega);
            const currentDateTime = new Date(startTime.getTime() + (currentTime * 1000));
            
            // Format the date-time string
            const year = currentDateTime.getFullYear();
            const month = String(currentDateTime.getMonth() + 1).padStart(2, '0');
            const day = String(currentDateTime.getDate()).padStart(2, '0');
            const hours = String(currentDateTime.getHours()).padStart(2, '0');
            const minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
            const seconds = String(currentDateTime.getSeconds()).padStart(2, '0');
            
            timeMain.textContent = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else {
            // Use original mm:ss format
            const minutes = Math.floor(currentTime / 60);
            const seconds = Math.floor(currentTime % 60);
            timeMain.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.`;
        }
        
        // Always show centiseconds
        const cents = Math.floor((currentTime % 1) * 100);
        timeCents.textContent = cents.toString().padStart(2, '0');

        // Continue with visual updates
        requestAnimationFrame(() => updateVisuals(audioElement.currentTime));
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const cents = Math.floor((seconds % 1) * 100);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cents.toString().padStart(2, '0')}`;
    }

    function checkStateTransitions() {
        if (player.mode === PlaybackMode.PLAYING) {
            const audioTime = audioElement.currentTime;
            
            if (playStartTime === null) {
                playStartTime = performance.now();
            }
            
            const timeSincePlay = performance.now() - playStartTime;
            if (timeSincePlay < player.predelay_ms) {
                const previousState = player.state;
                player.state = new TrackState();
                if (!previousState || previousState.i !== 0 || previousState.j !== 0 || previousState.k !== 0) {
                    console.log('State transition:', {
                        time: formatTime(0), // Initial state always at time 0
                        from: previousState ? `(${previousState.i},${previousState.j},${previousState.k})` : 'null',
                        to: '(0,0,0)'
                    });
                    dispatcher.dispatch();
                }
            } else {
                const adjustedAudioTime = audioTime - (player.predelay_ms / 1000);
                
                const currentTransition = player.transitionTimes
                    .filter(t => t.time <= adjustedAudioTime)
                    .pop();

                if (currentTransition) {
                    const previousState = player.state;
                    player.state = new TrackState(
                        currentTransition.state.i,
                        currentTransition.state.j,
                        currentTransition.state.k
                    );
                    
                    if (!previousState || 
                        previousState.i !== player.state.i || 
                        previousState.j !== player.state.j || 
                        previousState.k !== player.state.k) {
                        console.log('State transition:', {
                            time: formatTime(currentTransition.time), // Use transition time from array
                            from: previousState ? `(${previousState.i},${previousState.j},${previousState.k})` : 'null',
                            to: `(${player.state.i},${player.state.j},${player.state.k})`
                        });
                        dispatcher.dispatch();
                    }
                }
                player.time = audioTime;
            }
        }
    }

    // Start visual updates
    requestAnimationFrame(() => updateVisuals(audioElement.currentTime));

    // Check state transitions every 100ms
    setInterval(checkStateTransitions, 100);

    // Clean up when page unloads
    window.addEventListener('unload', () => {
        audioElement.pause();
        audioElement.src = '';
    });

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
        // Render track title
        trackTitle.textContent = player.currentTrack.id;
        
        // Update section view state instead of re-rendering
        screen.sectionView.setState({
            currentTrack: player.currentTrack,
            currentLanguage: current_lang_code
        });
    }
});
