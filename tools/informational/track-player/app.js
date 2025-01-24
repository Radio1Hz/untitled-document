let isPlaying = false;
let startTime = 0;
let animationFrameId = null;
let currentTrackIndex = 0;

function timeToSeconds(timeString) {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const centiseconds = Math.floor((seconds % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

function formatTimeMMSS(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Initialize and render the track when the page loads
window.onload = function() {
    
};

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const track_timer = {
    current_time: 0,
    duration: 0,
    interval: null,
    isPlaying: false,
    startTime: 0,

    updateWordHighlights: function() {
        const wordSquares = document.querySelectorAll('.word-square');
        wordSquares.forEach(square => {
            const start = parseFloat(square.dataset.start);
            const end = parseFloat(square.dataset.end);
            
            if (this.current_time >= start && this.current_time <= end) {
                square.classList.add('active');
            } else {
                square.classList.remove('active');
            }
        });
    },

    play: function() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            document.getElementById('playPauseBtn').textContent = '⏸';
            document.body.classList.add('player-playing');
            
            this.startTime = Date.now() - (this.current_time * 1000);
            
            this.interval = setInterval(() => {
                this.current_time = (Date.now() - this.startTime) / 1000;
                
                // Loop when reaching duration
                if (this.current_time >= this.duration) {
                    this.current_time = 0;
                    this.startTime = Date.now();
                }
                
                // Update display with centiseconds using the new format
                formatTimeWithCentiseconds(this.current_time);
                
                // Update word highlights
                this.updateWordHighlights();
            }, 10);
        } else {
            this.pause();
        }
    },

    pause: function() {
        this.isPlaying = false;
        document.getElementById('playPauseBtn').textContent = '▶';
        document.body.classList.remove('player-playing');
        clearInterval(this.interval);
    },

    stop: function() {
        this.pause();
        this.current_time = 0;
        document.querySelector('.time-main').textContent = '00:00.';
        document.querySelector('.time-cents').textContent = '00';
        
        // Reset all word highlights
        document.querySelectorAll('.word-square').forEach(square => {
            square.classList.remove('active');
        });
    },

    setDuration: function(duration) {
        this.duration = duration;
        this.stop();
    }
};

function formatTimeWithCentiseconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const centiseconds = Math.floor((seconds % 1) * 100);
    
    document.querySelector('.time-main').textContent = 
        `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.`;
    document.querySelector('.time-cents').textContent = 
        centiseconds.toString().padStart(2, '0');
}

function displayTrack(trackIndex) {
    currentTrackIndex = trackIndex;
    const track = playlist[trackIndex];
    
    // Update background video
    const backgroundVideo = document.getElementById('background-video');
    if (track['video-url']) {
        backgroundVideo.src = track['video-url'];
        backgroundVideo.load();  // Reload video with new source
        backgroundVideo.play();  // Start playing
    }
    
    // Set duration for timer
    track_timer.setDuration(track.duration);
    
    // Update active menu item
    document.querySelectorAll('.playlist-item').forEach((item, index) => {
        item.classList.toggle('active', index === trackIndex);
    });
    
    // Display track metadata
    document.getElementById('track-title').textContent = track.title;
    document.getElementById('track-key').textContent = track.key;
    document.getElementById('track-tempo').textContent = track.tempo;
    document.getElementById('track-time').textContent = `${track.numerator}/${track.denominator}`;
    document.getElementById('track-duration').textContent = formatDuration(track.duration);

    // Display sentences
    const sentencesContent = document.getElementById('sentences-content');
    sentencesContent.innerHTML = ''; // Clear existing content

    track.sentences.forEach(sentence => {
        const line = document.createElement('div');
        line.className = 'sentence-line';
        
        const wordsContainer = document.createElement('div');
        wordsContainer.className = 'words-container';
        
        // Add sentence ID as first square with start time
        const idDiv = document.createElement('div');
        idDiv.className = 'sentence-id';
        
        // Create a container for ID and time
        const idContent = document.createElement('div');
        idContent.className = 'sentence-id-content';
        
        const startTime = document.createElement('div');
        startTime.className = 'sentence-start-time';
        startTime.textContent = formatTimeMMSS(sentence.start);
        
        const idNumber = document.createElement('div');
        idNumber.textContent = sentence.id;
        
        idContent.appendChild(idNumber);   // ID second
        idDiv.appendChild(idContent);
        wordsContainer.appendChild(idDiv);
        
        sentence.words.forEach(word => {
            const wordSquare = document.createElement('div');
            wordSquare.className = 'word-square';
            wordSquare.dataset.start = word.start;
            wordSquare.dataset.end = word.end;
            
            // Add time in mm:ss format
            const timeDiv = document.createElement('div');
            timeDiv.className = 'word-time';
            timeDiv.textContent = formatTimeMMSS(word.start);
            wordSquare.appendChild(timeDiv);

            // Add key
            const keyDiv = document.createElement('div');
            keyDiv.className = 'word-key';
            keyDiv.textContent = `${word.key}`;
            wordSquare.appendChild(keyDiv);
            
            // Add mode
            const modeDiv = document.createElement('div');
            modeDiv.className = 'word-mode';
            modeDiv.textContent = `${word.mode}`;
            wordSquare.appendChild(modeDiv);
            
            // Add text if exists
            if (word.text) {
                const textDiv = document.createElement('div');
                textDiv.className = 'word-text';
                textDiv.textContent = word.text;
                wordSquare.appendChild(textDiv);
            }
            
            wordsContainer.appendChild(wordSquare);
        });
        
        line.appendChild(wordsContainer);
        sentencesContent.appendChild(line);
    });

    // Initialize word highlights after creating all squares
    track_timer.updateWordHighlights();
}

function initializePlaylistMenu() {
    const menuContainer = document.getElementById('playlist-menu');
    
    playlist.forEach((track, index) => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'playlist-item';
        link.textContent = track.id;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            displayTrack(index);
        });
        
        menuContainer.appendChild(link);
    });
}

// Initialize menu and display first track when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializePlaylistMenu();
    displayTrack(0);
    
    document.getElementById('playPauseBtn').addEventListener('click', () => {
        track_timer.play();
    });
    
    document.getElementById('stopBtn').addEventListener('click', () => {
        track_timer.stop();
    });
}); 