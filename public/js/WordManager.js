/**
 * WordManager - Manages word detection and tracking in the crossword
 */
class WordManager {
    constructor() {
        console.log('Creating WordManager');
        this.crossword = null; // Will be set by setCrossword()
        this.words = new Map(); // Map of word IDs to word objects
        this.currentWordId = null;
        this.currentSearchDirection = 'horizontal'; // Default search direction
        this.searchBentWord = true;
        this.onWordChange = null; // Callback for when current word changes
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('square:selected', (e) => {
            console.debug('Square selected:', e.detail);
            const square = e.detail && e.detail.square;
            if (square) {
                this.selectWordAtSquare(square);
            }
        });
    }

    /**
     * Sets the crossword instance this manager works with
     * @param {Crossword} crossword - The crossword instance
     */
    setCrossword(crossword) {
        this.crossword = crossword;
    }

    getSquare(row, col) {
        if (!this.crossword) {
            return null;
        }
        return this.crossword.getSquare(row, col);
    }

    /**
     * Handles selection of a square to select words (event-driven)
     * @param {Object} square - The square object that was selected
     * @returns {Object|null} Selected word object
     */
    selectWordAtSquare(square) {
        // Only handle selection on letter squares that are not empty
        if (!square || square.getSquareType() !== 'letter' || square.isEmpty()) {
            this.setCurrentWord(null);
            return null;
        }

        // If the square is valid, select the word at the square
        const word = this.findWord(square, this.currentSearchDirection, this.searchBentWord);
        this.setCurrentWord(word);
        return word;
    }


    findWord(square, direction = 'horizontal', bentMode = true) {
        const col = square.col;
        const row = square.row;
        let wordStart = this.findWordStart(square, direction, bentMode);
        let wordEnd = this.findWordEnd(square, direction, bentMode);
        if (!wordStart || (wordStart.length === 1 && wordEnd.length === 1)) {
            console.warn('No valid word found for square:', square);
            return null; // No valid word found
        }
        wordEnd = wordEnd.slice(1); // Skip the first letter of the end word
        let squares = wordStart.concat(wordEnd);
        return new Word(squares);
    }

    findWordStart(square, direction = 'horizontal', bentMode = true) {
        if (!square || square.getSquareType() !== 'letter' || square.isEmpty()) {
            return null;
        }

        let prevSquare;
        const row = square.row;
        const col = square.col;
        if (bentMode && direction === 'horizontal' && square.arrow === 'top-to-right') {
            direction = 'vertical';
        }
        else if (bentMode && direction === 'vertical' && square.arrow === 'left-to-down') {
            direction = 'horizontal';
        }
        
        if (direction === 'horizontal') {
            prevSquare = this.getSquare(row, col - 1);
        }
        else if (direction === 'vertical') {
            prevSquare = this.getSquare(row - 1, col);
        }

        let squares = this.findWordStart(prevSquare, direction);
        if (squares && squares.length > 0) {
            squares.push(square);
            return squares;
        }
        else {
            return new Array(square); // Return an array with only the current square
        }
    }

    findWordEnd(square, direction = 'horizontal', bentMode = true) {
        if (!square || square.getSquareType() !== 'letter' || square.isEmpty()) {
            return null;
        }

        let nextSquare;
        const row = square.row;
        const col = square.col;
        if (bentMode && direction === 'horizontal' && square.arrow === 'left-to-down') {
            direction = 'vertical';
        }
        else if (bentMode && direction === 'vertical' && square.arrow === 'top-to-right') {
            direction = 'horizontal';
        }
        
        if (direction === 'horizontal') {
            nextSquare = this.getSquare(row, col + 1);
        }
        else if (direction === 'vertical') {
            nextSquare = this.getSquare(row + 1, col);
        }

        let squares = this.findWordEnd(nextSquare, direction);
        if (squares && squares.length > 0) {
            squares.unshift(square);
            return squares;
        }
        else {
            return new Array(square); // Return an array with only the current square
        }
    }

    /**
     * Sets the current selected word
     * @param {Object|null} word - Word object or null
     */
    setCurrentWord(word) {
        console.debug('Setting current word:', word);
        this.removeHighlight(this.currentWord);
        this.highlightWord(word);
        this.currentWord = word;
        // Fire event for word change, passing the Word instance
        const event = new CustomEvent('word:selected', { detail: { word } });
        document.dispatchEvent(event);
    }

    highlightWord(word) {
        if (!word || !this.crossword) return;

        const squares = word.getSquares();
        squares.forEach(square => {
            square.highlight();
        });
    }

    removeHighlight(word) {
        if (!word || !this.crossword) return;

        const squares = word.getSquares();
        squares.forEach(square => {
            square.removeHighlight();
        });
    }

    /**
     * Gets the current selected word
     * @returns {Object|null} Current word object
     */
    getCurrentWord() {
        if (!this.currentWordId) return null;
        
        // Parse the word ID to get the starting position and direction
        const parts = this.currentWordId.split('-');
        if (parts.length < 3) return null;
        
        const startRow = parseInt(parts[0]);
        const startCol = parseInt(parts[1]);
        const direction = parts[2];
        
        // Re-find the word from this position
        return this.findWordFromPosition(startRow, startCol, direction);
    }

    /**
     * Updates word tracking after grid changes
     */
    updateWords() {
        // If we have a current word, refresh it
        if (this.currentWordId) {
            const currentWord = this.getCurrentWord();
            if (this.onWordChange) {
                this.onWordChange(currentWord);
            }
        }
    }

    /**
     * Clears current word selection
     */
    clearSelection() {
        this.setCurrentWord(null);
    }

    /**
     * Gets word statistics
     * @returns {Object} Statistics about words
     */
    getWordStats() {
        const words = this.getAllWords();
        return {
            total: words.length,
            horizontal: words.filter(w => w.direction === 'horizontal').length,
            vertical: words.filter(w => w.direction === 'vertical').length,
            filled: words.filter(w => w.text && !w.text.includes('')).length,
            empty: words.filter(w => !w.text || w.text.includes('')).length
        };
    }
}
