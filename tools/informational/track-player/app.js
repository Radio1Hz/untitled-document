let isPlaying = false;
let startTime = 0;
let animationFrameId = null;

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

function updateTimer() {
    if (!isPlaying) return;
    
    const currentTime = (Date.now() - startTime) / 1000;
    const timerElement = document.getElementById('timer');
    timerElement.textContent = formatTime(currentTime);
    
    // Update word highlighting
    const words = document.querySelectorAll('.word');
    words.forEach(word => {
        const wordTime = timeToSeconds(word.querySelector('.time').textContent);
        if (Math.abs(currentTime - wordTime) < 0.1) {
            word.classList.add('active');
        } else if (currentTime - wordTime > 0.5) {
            word.classList.remove('active');
        }
    });
    
    if (currentTime < track.getTotalDurationSeconds()) {
        animationFrameId = requestAnimationFrame(updateTimer);
    } else {
        stopPlayback();
    }
}

function startPlayback() {
    isPlaying = true;
    startTime = Date.now();
    document.getElementById('playPauseBtn').textContent = 'Pause';
    updateTimer();
}

function pausePlayback() {
    isPlaying = false;
    document.getElementById('playPauseBtn').textContent = 'Play';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

function stopPlayback() {
    isPlaying = false;
    document.getElementById('playPauseBtn').textContent = 'Play';
    document.getElementById('timer').textContent = '00:00.00';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    // Remove all active highlights
    document.querySelectorAll('.word').forEach(word => {
        word.classList.remove('active');
    });
}

function setupControls() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            pausePlayback();
        } else {
            startPlayback();
        }
    });
    
    stopBtn.addEventListener('click', stopPlayback);
}

// Initialize the track
function initializeTrack() {
    const timeSignature = new TimeSignature(4, 4);
    const track = new Track(
        "\\vikktør\\tracks\\2. noli laedere arborem meam",
        120,
        timeSignature,
        "C",
        2
    );

    // Define the sentences
    const sentencesData = [
        ["Am", "C", "G", "F", "Am", "Am"],
        ["Am", "C", "G", "F", "C", "E"],
        ["F", "G", "C", "E"],
        ["F", "G", "C"],
        ["Dm", "E", "Am", "C", "G", "Dm", "Am"],
        ["Dm", "Am", "E", "E"],
        ["F", "G", "C", "E"],
        ["F", "G", "C", "E"]
    ];

    // Create sentences with words
    sentencesData.forEach((sentenceData, sentenceIndex) => {
        const sentence = new MusicalSentence();
        sentenceData.forEach((key, wordIndex) => {
            const startTimeSeconds = 
                track.secondsPerWord * 
                (sentencesData.slice(0, sentenceIndex)
                    .reduce((acc, curr) => acc + curr.length, 0) + wordIndex);
            
            const minutes = Math.floor(startTimeSeconds / 60);
            const seconds = Math.floor(startTimeSeconds % 60);
            const startTime = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const word = new MusicalWord(key, null, startTime);
            sentence.addWord(word);
        });
        track.addSentence(sentence);
    });

    return track;
}

// Render track information and content
function renderTrack(track) {
    const trackInfoDiv = document.getElementById('track-info');
    const trackContentDiv = document.getElementById('track-content');

    // Render track info
    trackInfoDiv.innerHTML = `
        <div class="track-info">
            <h2>${track.name}</h2>
            <p>Tempo: ${track.tempo} bpm</p>
            <p>Time Signature: ${track.timeSignature.toString()}</p>
            <p>Key: ${track.key}</p>
            <p>Word Size: ${track.wordSizeInMeasures} measures</p>
            <p>Total Duration: ${track.getTotalDurationString()}</p>
        </div>
    `;

    // Render sentences
    track.sentences.forEach((sentence, index) => {
        const sentenceDiv = document.createElement('div');
        sentenceDiv.className = 'sentence';
        
        const sentenceHeader = document.createElement('div');
        sentenceHeader.textContent = `Sentence ${index + 1}`;
        sentenceDiv.appendChild(sentenceHeader);

        const wordsDiv = document.createElement('div');
        sentence.words.forEach(word => {
            wordsDiv.innerHTML += `
                <span class="word">
                    <span class="time">${word.start_time}</span>
                    <span class="divider">|</span>
                    ${word.key}
                </span>
            `;
        });
        
        sentenceDiv.appendChild(wordsDiv);
        trackContentDiv.appendChild(sentenceDiv);
    });
}

// Initialize and render the track when the page loads
window.onload = function() {
    const track = initializeTrack();
    renderTrack(track);
    setupControls();
}; 