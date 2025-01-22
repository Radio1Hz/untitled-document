class TimeSignature {
    constructor(numerator, denominator) {
        this.numerator = numerator;
        this.denominator = denominator;
    }

    toString() {
        return `${this.numerator}/${this.denominator}`;
    }
}

class MusicalWord {
    constructor(key, mode = null, startTime = "00:00") {
        this.key = key;
        this.mode = mode;
        this.start_time = startTime;
    }
}

class MusicalSentence {
    constructor(words = []) {
        this.words = words;
    }

    addWord(word) {
        this.words.push(word);
    }
}

class Track {
    constructor(name, tempo, timeSignature, key, wordSizeInMeasures) {
        this.name = name;
        this.tempo = tempo;
        this.timeSignature = timeSignature;
        this.key = key;
        this.wordSizeInMeasures = wordSizeInMeasures;
        this.sentences = [];
        
        // Calculate seconds per measure based on tempo and time signature
        this.secondsPerMeasure = (60 / tempo) * timeSignature.numerator;
        this.secondsPerWord = this.secondsPerMeasure * wordSizeInMeasures;
    }

    addSentence(sentence) {
        this.sentences.push(sentence);
    }

    getTotalDurationSeconds() {
        let totalWords = 0;
        this.sentences.forEach(sentence => {
            totalWords += sentence.words.length;
        });
        return totalWords * this.secondsPerWord;
    }

    getTotalDurationString() {
        const totalSeconds = this.getTotalDurationSeconds();
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
} 