const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const MEASURES = 8;

const MODES = {
    ionian: [0, 2, 4, 5, 7, 9, 11],      // Major scale
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    aeolian: [0, 2, 3, 5, 7, 8, 10]      // Natural minor scale
};

const CF_RULES = {
    MAX_LEAP: 5,           // Maximum leap in scale degrees
    MAX_CONSECUTIVE_LEAPS: 2,
    MIN_LENGTH: 8,
    MAX_LENGTH: 12,
    PREFERRED_RANGE: 10    // Preferred range in scale degrees
};

function createGrid() {
    const cpLine = document.getElementById('counterpoint-line');
    const cfLine = document.getElementById('cantus-firmus');
    
    for (let i = 0; i < MEASURES; i++) {
        cpLine.innerHTML += `
            <div class="note-cell">
                <input type="text" class="note-input" placeholder="C4" data-measure="${i}" data-voice="cp">
            </div>`;
        cfLine.innerHTML += `
            <div class="note-cell">
                <input type="text" class="note-input" placeholder="C4" data-measure="${i}" data-voice="cf">
            </div>`;
    }
}

function getNoteValue(noteName) {
    if (!noteName) return null;
    const note = noteName.substring(0, 1).toUpperCase();
    const octave = parseInt(noteName.substring(1));
    return NOTES.indexOf(note) + (octave * 7);
}

function getInterval(note1, note2) {
    const value1 = getNoteValue(note1);
    const value2 = getNoteValue(note2);
    if (value1 === null || value2 === null) return null;
    return Math.abs(value1 - value2);
}

function validateCounterpoint() {
    const messages = [];
    const cpNotes = Array.from(document.querySelectorAll('[data-voice="cp"]')).map(input => input.value);
    const cfNotes = Array.from(document.querySelectorAll('[data-voice="cf"]')).map(input => input.value);

    // Check if all notes are filled
    if (cpNotes.some(note => !note) || cfNotes.some(note => !note)) {
        messages.push("Please fill in all notes");
        showValidationMessages(messages);
        return;
    }

    // Check first and last intervals
    const firstInterval = getInterval(cpNotes[0], cfNotes[0]);
    const lastInterval = getInterval(cpNotes[cpNotes.length - 1], cfNotes[cfNotes.length - 1]);
    
    if (firstInterval !== 0 && firstInterval !== 7) {
        messages.push("First interval must be unison or octave");
    }
    if (lastInterval !== 0 && lastInterval !== 7) {
        messages.push("Last interval must be unison or octave");
    }

    // Check for parallel fifths and octaves
    for (let i = 0; i < cpNotes.length - 1; i++) {
        const interval1 = getInterval(cpNotes[i], cfNotes[i]);
        const interval2 = getInterval(cpNotes[i + 1], cfNotes[i + 1]);
        
        if ((interval1 === 4 && interval2 === 4) || (interval1 === 7 && interval2 === 7)) {
            messages.push(`Parallel fifths/octaves found between measures ${i + 1} and ${i + 2}`);
        }
    }

    // Check for consonant intervals
    for (let i = 0; i < cpNotes.length; i++) {
        const interval = getInterval(cpNotes[i], cfNotes[i]);
        if (![0, 2, 4, 5, 7].includes(interval)) {
            messages.push(`Dissonant interval found in measure ${i + 1}`);
        }
    }

    showValidationMessages(messages);
}

function showValidationMessages(messages) {
    const messageDiv = document.getElementById('validation-messages');
    if (messages.length === 0) {
        messageDiv.innerHTML = '<span style="color: green;">✓ Valid counterpoint!</span>';
    } else {
        messageDiv.innerHTML = messages.map(msg => `• ${msg}`).join('<br>');
    }
}

function clearAll() {
    document.querySelectorAll('.note-input').forEach(input => input.value = '');
    document.getElementById('validation-messages').innerHTML = '';
}

function playComposition() {
    // This is a very basic implementation using the Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const cpNotes = Array.from(document.querySelectorAll('[data-voice="cp"]')).map(input => input.value);
    const cfNotes = Array.from(document.querySelectorAll('[data-voice="cf"]')).map(input => input.value);

    function playNote(note, time) {
        if (!note) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const noteValue = getNoteValue(note);
        const frequency = 440 * Math.pow(2, (noteValue - 33) / 12); // A4 = 440Hz
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        oscillator.start(time);
        oscillator.stop(time + 0.5);
    }

    let time = audioContext.currentTime;
    for (let i = 0; i < MEASURES; i++) {
        playNote(cpNotes[i], time);
        playNote(cfNotes[i], time);
        time += 0.5;
    }
}

function generateCantusFirmus() {
    const mode = document.getElementById('mode-select').value;
    const length = parseInt(document.getElementById('length-select').value);
    const modePattern = MODES[mode];
    
    let attempts = 0;
    let melody;
    
    // Keep trying until we get a valid cantus firmus
    do {
        melody = generateMelody(length, modePattern);
        attempts++;
    } while (!isValidCantusFirmus(melody) && attempts < 100);

    if (attempts >= 100) {
        alert("Could not generate a valid cantus firmus. Please try again.");
        return;
    }

    // Fill in the cantus firmus inputs
    const cfInputs = document.querySelectorAll('[data-voice="cf"]');
    melody.forEach((note, index) => {
        if (cfInputs[index]) {
            cfInputs[index].value = note;
        }
    });
}

function generateMelody(length, modePattern) {
    const melody = [];
    const startingNote = 'C4'; // We'll start with C4 for simplicity
    melody.push(startingNote);

    for (let i = 1; i < length - 1; i++) {
        const previousNote = melody[i - 1];
        const validNextNotes = getValidNextNotes(previousNote, modePattern, melody);
        const nextNote = validNextNotes[Math.floor(Math.random() * validNextNotes.length)];
        melody.push(nextNote);
    }

    // End with the tonic
    melody.push(startingNote);
    return melody;
}

function getValidNextNotes(previousNote, modePattern, melody) {
    const prevValue = getNoteValue(previousNote);
    const validNotes = [];
    
    // Generate possible next notes within the mode
    for (let octave = 3; octave <= 5; octave++) {
        for (const scaleDegree of modePattern) {
            const noteValue = octave * 12 + scaleDegree;
            const interval = Math.abs(noteValue - prevValue);
            
            // Apply melodic rules
            if (interval <= CF_RULES.MAX_LEAP && 
                !createsBadMelodicPattern(melody, noteValue) &&
                isWithinRange(noteValue, melody[0])) {
                validNotes.push(noteValueToName(noteValue));
            }
        }
    }
    
    return validNotes;
}

function createsBadMelodicPattern(melody, newNoteValue) {
    if (melody.length < 2) return false;
    
    const intervals = melody.slice(-2).map(note => 
        Math.abs(getNoteValue(note) - getNoteValue(melody[melody.length - 2]))
    );
    
    // Check for too many consecutive leaps
    if (intervals[0] > 2 && intervals[1] > 2) {
        return true;
    }
    
    // Check for melodic direction change after large leap
    if (intervals[0] > 4) {
        const lastDirection = Math.sign(getNoteValue(melody[melody.length - 1]) - 
                                     getNoteValue(melody[melody.length - 2]));
        const newDirection = Math.sign(newNoteValue - 
                                     getNoteValue(melody[melody.length - 1]));
        if (lastDirection === newDirection) {
            return true;
        }
    }
    
    return false;
}

function isWithinRange(noteValue, firstNote) {
    const firstNoteValue = getNoteValue(firstNote);
    return Math.abs(noteValue - firstNoteValue) <= CF_RULES.PREFERRED_RANGE;
}

function noteValueToName(value) {
    const octave = Math.floor(value / 12);
    const noteName = NOTES[value % 12];
    return `${noteName}${octave}`;
}

function isValidCantusFirmus(melody) {
    // Check for valid length
    if (melody.length < CF_RULES.MIN_LENGTH || melody.length > CF_RULES.MAX_LENGTH) {
        return false;
    }

    // Check if it starts and ends with the same note
    if (melody[0] !== melody[melody.length - 1]) {
        return false;
    }

    // Check for stepwise motion predominance
    let leapCount = 0;
    for (let i = 1; i < melody.length; i++) {
        const interval = Math.abs(getNoteValue(melody[i]) - getNoteValue(melody[i - 1]));
        if (interval > 2) { // If interval is larger than a step
            leapCount++;
        }
    }
    if (leapCount > melody.length / 3) { // No more than 1/3 of intervals should be leaps
        return false;
    }

    return true;
}

// Initialize the composition grid when the document is loaded
document.addEventListener('DOMContentLoaded', createGrid); 