/**
 * WordManager - Manages word detection and tracking in the crossword
 */
class WordManager {
    constructor() {
        console.log('Creating WordManager');
        this.crossword = null; // Will be set by setCrossword()
        this.words = new Map(); // Map of word IDs to word objects
        this.currentWordId = null;
        this.onWordChange = null; // Callback for when current word changes
        this.searchModes = [
            { direction: 'horizontal', bent: true },
            { direction: 'horizontal', bent: false },
            { direction: 'vertical', bent: true },
            { direction: 'vertical', bent: false }
        ]
        this.currentSearchModeIndex = 0; // Default search mode index
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
     * Gets the letter square or letter subcell at the specified position
     * This method handles split cells by returning the letter subcell if available
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {Object|null} Letter square/subcell or null
     */
    getLetterSquareAt(row, col) {
        const square = this.getSquare(row, col);
        if (!square) return null;
        
        // If it's a regular letter square, return it
        if (square.getSquareType() === 'letter') {
            return square;
        }
        
        // If it's a split cell, get the letter subcell
        if (square.getSquareType() === 'split') {
            return square.getLetterSubcell();
        }
        
        // For other types (clue, black), return null
        return null;
    }

    /**
     * Handles selection of a square to select words (event-driven)
     * Now supports split cells - will select the letter subcell if available
     * @param {Object} square - The square object (or subcell) that was selected
     * @returns {Object|null} Selected word object
     */
    selectWordAtSquare(square) {
        // Early exit for non-letter squares
        if (!square || !square.getSquareType) {
            this.setCurrentWord(null);
            return null;
        }
        
        const squareType = square.getSquareType();
        
        // For non-letter squares (clue, black), don't attempt word selection
        if (squareType === 'clue' || squareType === 'black') {
            this.setCurrentWord(null);
            return null;
        }
        
        // Handle split cells - find the letter subcell if needed
        let targetSquare = square;
        
        // If this is a split cell, get the letter subcell
        if (squareType === 'split') {
            targetSquare = square.getLetterSubcell();
            if (!targetSquare) {
                this.setCurrentWord(null);
                return null; // No letter subcell in this split cell
            }
        }
        
        // Only handle selection on letter squares (or letter subcells)
        if (!targetSquare || targetSquare.getSquareType() !== 'letter') {
            this.setCurrentWord(null);
            return null;
        }

        // Check if the already selected word was clicked again
        let sameWordClicked = false;
        if (this.currentWord) {
            const squares = this.currentWord.getSquares();
            sameWordClicked = squares && squares.some(sq => {
                // Compare both regular squares and subcells
                if (sq === targetSquare) return true;
                // For split cells, compare the subcell
                if (sq.parent && sq.parent === targetSquare.parent && sq.subIndex === targetSquare.subIndex) return true;
                return false;
            });
        }
        console.debug('Same word clicked:', sameWordClicked);
        
        // If the same word was clicked, toggle search modes
        let modeIndex;
        if (sameWordClicked) {
            modeIndex = (this.currentSearchModeIndex+ 1) % this.searchModes.length;
        }
        else {
            this.currentSearchModeIndex = 0; // Reset to default search mode
            modeIndex = 0;
        }

        let word = null;
        for (let i = 0; i < this.searchModes.length; i++) {
            const mode = this.searchModes[modeIndex];
            console.debug('Selecting word at square:', targetSquare.getPosition(), 'with direction:', mode.direction, 'and bent mode:', mode.bent);
            word = this.findWord(targetSquare, mode.direction, mode.bent);
            if (word) {
                this.setCurrentWord(word);
                this.currentSearchModeIndex = modeIndex; // Update current search mode index
                break; // Found a valid word, exit loop
            }
            modeIndex = (modeIndex + 1) % this.searchModes.length; // Cycle through modes
        }
        if (!word) {
            // If no word found in any mode, clear current word
            this.setCurrentWord(null);
            this.currentSearchModeIndex = 0; // Reset to default search mode
        }
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
            prevSquare = this.getLetterSquareAt(row, col - 1);
        }
        else if (direction === 'vertical') {
            prevSquare = this.getLetterSquareAt(row - 1, col);
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
            nextSquare = this.getLetterSquareAt(row, col + 1);
        }
        else if (direction === 'vertical') {
            nextSquare = this.getLetterSquareAt(row + 1, col);
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
