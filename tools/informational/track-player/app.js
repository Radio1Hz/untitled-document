// These import statements might cause issues in Edge
import { Track, TrackState } from './track-model.js';
import { TrackPlayer, PlaybackMode } from './track-player-model.js';
import { TrackPlayerScreen } from './track-player-screen-model.js';
import { Playlist, PlaylistMode } from './playlist-model.js';
import { Action, ActionManager } from './action-model.js';

let current_lang_code = 'en';  // Default language
let screen; // Declare screen variable at module scope

window.addEventListener('error', (event) => {
    console.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get track number from URL hash (e.g., #9)
        const hash = window.location.hash;
        const requestedTrackNumber = hash ? parseInt(hash.substring(1)) : null;
        //console.log('Requested track number from URL:', requestedTrackNumber);

        // Load track data
        const track9Data = await import('https://untitled-document.net/knowledge/agents/viktor-r/projects/vikktør/tracks/9. untitled-track/code/9. untitled-track.js');
        const track1Data = await import('https://untitled-document.net/knowledge/agents/viktor-r/projects/vikktør/tracks/1. there is no wisdom without kindness v1.1/code/1. there is no wisdom without kindness v1.1.js');
        const track11Data = await import('https://untitled-document.net/knowledge/agents/viktor-r/projects/vikktør/tracks/11. balkan folk song - karanfil se na put sprema/code/11. balkan folk song - karanfil se na put sprema.js');
        const track6Data = await import('https://untitled-document.net/knowledge/agents/viktor-r/projects/vikktør/tracks/6. salve mane terra mater/code/6. salve mane terra mater.js');

        // Create a map of track numbers to their data
        const trackNumberMap = {
            9: track9Data,
            1: track1Data,
            11: track11Data,
            6: track6Data
        };

        // Log if requested track exists
        if (requestedTrackNumber) {
            //console.log('Track data for requested number:', trackNumberMap[requestedTrackNumber] ? 'Found' : 'Not found');
        }

        // Log raw track data
        //console.log('Raw track9 data:', track9Data.track9);
        //console.log('Raw track1 data:', track1Data.track1);
        //console.log('Raw track11 data:', track11Data.track11);

        // Create track objects from JSON data for track9, track1, track11, and track6...
        const track9Obj = new Track({
            id: track9Data.track9.id,
            description: track9Data.track9.description,
            tau: track9Data.track9.tau,
            delta: track9Data.track9.delta,
            n: track9Data.track9.n,
            tau_omega: track9Data.track9.tau_omega,
            dedication: track9Data.track9.dedication,
            audioUrl: track9Data.track9.audioUrl,
            actions: track9Data.track9.actions  // Pass actions from JSON
        });

        // Add sections and timeboxes from JSON
        track9Data.track9.sections.forEach((sectionData, index) => {
            const section = track9Obj.addSection(sectionData.description, sectionData.imageUrl);
            sectionData.timeboxes.forEach(boxData => {
                track9Obj.addTimeboxToSection(section, boxData.tStart, boxData.description, boxData.nT);
            });
        });

        // Log initialized track object
        //console.log('Initialized track9:', track9Obj);

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
                // Pass the imageUrl from the timebox data
                track1Obj.addTimeboxToSection(
                    section, 
                    boxData.tStart, 
                    boxData.description, 
                    boxData.nT,
                    boxData.imageUrl  // Add this parameter
                );
            });
        });

        // Create track11 object
        const track11Obj = new Track({
            id: track11Data.track11.id,
            description: track11Data.track11.description,
            tau: track11Data.track11.tau,
            delta: track11Data.track11.delta,
            n: track11Data.track11.n,
            tau_omega: track11Data.track11.tau_omega,
            dedication: track11Data.track11.dedication,
            audioUrl: track11Data.track11.audioUrl
        });

        // Add sections and timeboxes from JSON
        track11Data.track11.sections.forEach(sectionData => {
            const section = track11Obj.addSection(sectionData.description, sectionData.imageUrl);
            sectionData.timeboxes.forEach(boxData => {
                // Add tStart as 0 or calculate it based on previous timeboxes
                track11Obj.addTimeboxToSection(section, 0, boxData.description, boxData.nT);
            });
        });

        // Create track6 object
        const track6Obj = new Track({
            id: track6Data.track6.id,
            description: track6Data.track6.description,
            tau: track6Data.track6.tau,
            delta: track6Data.track6.delta,
            n: track6Data.track6.n,
            tau_omega: track6Data.track6.tau_omega,
            dedication: track6Data.track6.dedication,
            audioUrl: track6Data.track6.audioUrl
        });

        track6Data.track6.sections.forEach(sectionData => {
            const section = track6Obj.addSection(sectionData.description, sectionData.imageUrl);
            sectionData.timeboxes.forEach(boxData => {
                // Assuming tStart is not defined in the JSON so we pass 0.
                track6Obj.addTimeboxToSection(section, 0, boxData.description, boxData.nT);
            });
        });

        // First create playlist
        const playlist = new Playlist();

        // Add tracks to playlist and log each addition
        //console.log('Adding tracks to playlist...');
        playlist.addTrack(track1Obj);
        //console.log('Added track1:', track1Obj.id);
        playlist.addTrack(track9Obj);
        //console.log('Added track9:', track9Obj.id);
        playlist.addTrack(track11Obj);
        //console.log('Added track11:', track11Obj.id);
        playlist.addTrack(track6Obj);
        //console.log('Added track6:', track6Obj.id);

        // Log the playlist state after adding tracks
        //console.log('Playlist tracks after adding:', playlist.tracks.map(t => t.id));

        // Create track map for persistence
        const trackMap = new Map();
        [track1Obj, track9Obj, track11Obj, track6Obj].forEach(track => {
            trackMap.set(track.id, track);
            console.log('Added to trackMap:', track.id);
        });

        // Try to load saved state AFTER adding tracks
        playlist.load(trackMap);

        // Now check for initial track and ensure we have a valid current index
        let initialTrack = playlist.getCurrentTrack();
        if (!initialTrack) {
            //console.log('No saved track state, attempting to set first track');
            // Make sure we have tracks before setting index
            if (playlist.tracks.length > 0) {
                playlist.currentIndex = 0;
                initialTrack = playlist.tracks[0];
                //console.log('Successfully set first track:', initialTrack.id);
            } else {
                //console.error('No tracks available in playlist. Track count:', playlist.tracks.length);
                //console.log('Playlist state:', playlist);
                return;
            }
        }

        // After creating playlist and adding all tracks
        if (requestedTrackNumber) {
            // Find the index of the requested track in the playlist
            const requestedIndex = playlist.tracks.findIndex(track => 
                track.id.includes(`${requestedTrackNumber}.`)
            );
            
            if (requestedIndex !== -1) {
                //console.log(`Setting initial track to requested track ${requestedTrackNumber}`);
                playlist.currentIndex = requestedIndex;
                initialTrack = playlist.tracks[requestedIndex];
            } else {
                //console.log(`Requested track ${requestedTrackNumber} not found in playlist`);
            }
        }

        // Create player with the confirmed track
        const player = new TrackPlayer(initialTrack, 1.0, 500, true);
        player.playlist = playlist;

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

        // Update cache control configuration to be resource-type specific
        const CacheControl = {
            enabled: false, // Default to no caching
            getHeaders(resourceType) {
                // Allow caching for audio, disable for everything else
                if (resourceType === 'audio') {
                    return {};
                }
                return {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                };
            }
        };

        // Audio URL no longer needs cache busting
        const getEncodedAudioUrl = (url) => {
            const [domain, ...path] = url.split('/knowledge/');
            // Edge might handle URL encoding differently
            const encodedPath = path.join('/knowledge/').split('/').map(segment => 
                encodeURIComponent(segment)).join('/');
            return `${domain}/knowledge/${encodedPath}`;
        };

        // Update preloadAudio to use direct URLs instead of blobs when possible
        const preloadAudio = async (url) => {
            const encodedUrl = getEncodedAudioUrl(url);
            
            try {
                // Set audio source directly if it's an audio file
                audioElement.src = encodedUrl;
                
                return new Promise((resolve, reject) => {
                    const handleLoad = () => {
                        resolve();
                    };
                    
                    const handleError = (error) => {
                        reject(error);
                    };
                    
                    audioElement.addEventListener('canplaythrough', handleLoad, { once: true });
                    audioElement.addEventListener('error', handleError, { once: true });
                    audioElement.load();
                });
            } catch (error) {
                console.error('Error loading audio:', error);
                throw error;
            }
        };

        // Update image loading to use direct URLs when possible
        const loadSectionImage = async (imageUrl) => {
            try {
                // Return direct URL for images
                return imageUrl;
            } catch (error) {
                console.error('Error loading image:', error);
                return null;
            }
        };

        // Update audio source function
        const updateAudioSource = async () => {
            try {
                playPauseBtn.textContent = '⌛';
                await preloadAudio(player.currentTrack.audioUrl);
                playPauseBtn.textContent = '▶';
                //console.log('New audio source loaded successfully');
            } catch (error) {
                console.error('Error loading audio:', error);
                playPauseBtn.textContent = '▶';
            }
        };

        // Load and play track function
        async function loadAndPlayTrack(track) {
            if (!track) return;
            
            // Make sure to set tau_omega from the track
            player.tau_omega = track.tau_omega ? new Date(track.tau_omega) : null;
            
            player.stop();
            player.currentTrack = track;
            player.state = new TrackState();
            
            try {
                await updateAudioSource();
                
                // Update UI elements
                updatePlaylistView();
                renderTrackContent();
                
                // Update screen components with new track data
                if (screen) {
                    // Update section view
                    if (screen.sectionView) {
                        screen.sectionView.setState({
                            currentTrack: player.currentTrack,
                            currentLanguage: current_lang_code
                        });
                    }
                    
                    // Update timeline
                    if (screen.timelineView) {
                        screen.timelineView.setState({
                            track: player.currentTrack
                        });
                    }
                    
                    // Re-render the screen
                    screen.mount(container);
                }
                
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
            <button id="playlistModeBtn" class="untitled-button" aria-label="Playlist mode">��</button>
        `;
        controlsContainer.appendChild(playlistControls);

        // Create playlist view (simplified)
        const container = document.querySelector('.container');
        const playlistView = document.createElement('div');
        playlistView.className = 'playlist-view';
        playlistView.innerHTML = '<div class="playlist-items"></div>';
        controlsContainer.appendChild(playlistView);

        // Function to update playlist view (simplified)
        function updatePlaylistView() {
            const playlistItems = document.querySelector('.playlist-items');
            if (!playlistItems) return;  // Add safety check
            
            playlistItems.innerHTML = '';
            
            //console.log("PlaylistItems element:", playlistItems);
            //console.log("Creating items for tracks:", playlist.tracks.map(t => t.id));
            
            playlist.tracks.forEach((track, index) => {
                const item = document.createElement('button');
                item.className = 'playlist-item untitled-button';
                if (index === playlist.currentIndex) {
                    item.classList.add('current');
                }
                
                // Extract track number from audioUrl
                const trackNumber = track.audioUrl.match(/\/(\d+)\./)?.[1] || '?';
                
                item.innerHTML = `${trackNumber}`;
                item.title = `${track.description?.en || track.id} [${formatDuration(track.totalDuration())}]`;
                
                item.addEventListener('click', () => {
                    playlist.jumpTo(index);
                    updatePlaylistView();
                    loadAndPlayTrack(playlist.getCurrentTrack());
                });
                
                playlistItems.appendChild(item);
            });
        }

        // Make sure to call updatePlaylistView after adding all tracks
        updatePlaylistView();

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
        if (initialTrack) {
            loadAndPlayTrack(initialTrack);
        }

        // Create single dispatcher instance
        const dispatcher = player.createEventDispatcher();
        //console.log('Dispatcher created');

        // Create screen with the same dispatcher
        screen = new TrackPlayerScreen(player);
        
        // Initial mount
        screen.mount(container);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            screen.mount(container);
        });

        // Set up language selector
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.value = current_lang_code;
            langSelect.addEventListener('change', (e) => {
                current_lang_code = e.target.value;
                if (screen) {
                    screen.setLanguage(current_lang_code);
                }
                renderTrackContent();
            });
        }

        // Safely update track title
        if (trackTitle) {
            if (player.currentTrack && player.currentTrack.id) {
                trackTitle.textContent = player.currentTrack.id;
            } else {
                trackTitle.textContent = 'No track selected';
            }
        }

        // Render initial track content
        renderTrackContent();

        // Modify the player controls to handle audio
        playPauseBtn.addEventListener('click', () => {
            //console.log('Play/Pause clicked, current mode:', player.mode);
            
            if (player.mode === PlaybackMode.PLAYING) {
                player.pause();
                playPauseBtn.textContent = '▶';
                audioElement.pause();
            } else {
                //console.log('Starting playback...');
                player.play();  // Make sure this is called
                playPauseBtn.textContent = '⏸';
                audioElement.play();
                
                //console.log('After play:', {
                //    playerMode: player.mode,
                //    audioPlaying: !audioElement.paused,
                //    currentState: player.state ? 
                //        `(${player.state.i},${player.state.j},${player.state.k})` : 
                //        'null'
                //});
            }
        });

        stopBtn.addEventListener('click', () => {
            //console.log('Stop clicked');
            player.stop();
            playPauseBtn.textContent = '▶';
            audioElement.pause();
            audioElement.currentTime = 0;
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
            
            const nextIndex = (currentBgIndex + 1) % 2;
            const currentBg = backgroundImages[currentBgIndex];
            const nextBg = backgroundImages[nextIndex];
            
            // Create a temporary image to handle loading
            const tempImage = new Image();
            tempImage.onload = () => {
                nextBg.style.backgroundImage = `url(${imageUrl})`;
                currentBg.classList.remove('active');
                nextBg.classList.add('active');
                currentBgIndex = nextIndex;
            };
            
            tempImage.onerror = () => {
                console.error('Error loading background image');
            };
            
            // Set crossOrigin if needed
            if (imageUrl.startsWith('http')) {
                tempImage.crossOrigin = 'anonymous';
            }
            
            tempImage.src = imageUrl;
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
                    // Store new state
                    const newState = new TrackState();
                    // Log transition before updating player state
                    if (!player.state || 
                        player.state.i !== newState.i || 
                        player.state.j !== newState.j || 
                        player.state.k !== newState.k) {
                        //console.log('State transition:', {
                        //    time: formatTime(0), // Initial state always at time 0
                        //    from: player.state ? `(${player.state.i},${player.state.j},${player.state.k})` : 'null',
                        //    to: '(0,0,0)'
                        //});
                        // Update player state after logging
                        player.state = newState;
                        dispatcher.dispatch();
                    }
                } else {
                    const adjustedAudioTime = audioTime - (player.predelay_ms / 1000);
                    
                    const currentTransition = player.transitionTimes
                        .filter(t => t.time <= adjustedAudioTime)
                        .pop();

                    if (currentTransition) {
                        // Create new state from transition
                        const newState = new TrackState(
                            currentTransition.state.i,
                            currentTransition.state.j,
                            currentTransition.state.k
                        );
                        
                        // Log transition before updating player state
                        if (!player.state || 
                            player.state.i !== newState.i || 
                            player.state.j !== newState.j || 
                            player.state.k !== newState.k) {
                            //console.log('State transition:', {
                            //    time: formatTime(currentTransition.time),
                            //    from: player.state ? `(${player.state.i},${player.state.j},${player.state.k})` : 'null',
                            //    to: `(${newState.i},${newState.j},${newState.k})`
                            //});
                            // Update player state after logging
                            player.state = newState;
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
            if (!trackTitle) {
                console.error('Track title element not found');
                return;
            }

            if (!player) {
                trackTitle.textContent = 'Player not initialized';
                return;
            }

            if (!player.currentTrack) {
                console.warn('No track selected in player');
                trackTitle.textContent = 'No track selected';
                return;
            }

            trackTitle.textContent = player.currentTrack.id;
            
            if (screen && screen.sectionView) {
                screen.sectionView.setState({
                    currentTrack: player.currentTrack,
                    currentLanguage: current_lang_code
                });
            }
        }

        // After adding tracks to playlist
        //console.log("Playlist tracks:", playlist.tracks.map(t => t.id));

        // Before creating playlist view
        //console.log("Container element:", container);

        // Add update loop for player
        let lastTime = performance.now();

        function updateLoop() {
            const currentTime = performance.now();
            const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
            lastTime = currentTime;

            // Update player if it exists
            if (player) {
                player.update(deltaTime);
            }

            // Request next frame
            requestAnimationFrame(updateLoop);
        }

        // Start update loop
        requestAnimationFrame(updateLoop);
    } catch (error) {
        console.error('Initialization error:', error);
    }
});
