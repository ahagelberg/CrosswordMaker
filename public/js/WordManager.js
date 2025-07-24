/**
 * WordManager - Manages word detection and tracking in the crossword
 */
class WordManager {
    constructor(crosswordGrid) {
        this.crosswordGrid = crosswordGrid;
        this.words = new Map(); // Map of word IDs to word objects
        this.currentWordId = null;
        this.currentDirection = 'horizontal';
        this.onWordChange = null; // Callback for when current word changes
    }

    /**
     * Sets callback for word change events
     * @param {Function} callback - Callback function
     */
    setOnWordChange(callback) {
        this.onWordChange = callback;
    }

    /**
     * Finds a word starting at a position in a given direction
     * Words are strictly bounded by empty squares, black squares, or grid edges
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {string} direction - 'horizontal' or 'vertical'
     * @returns {Object|null} Word object or null if no valid word
     */
    findWord(row, col, direction) {
        // Only start from squares that have letters
        if (!this.isLetterSquare(row, col)) {
            return null;
        }
        
        let startRow = row, startCol = col;
        let endRow = row, endCol = col;
        
        if (direction === 'horizontal') {
            // Find start of word (move left while we have consecutive letters)
            while (startCol > 0 && this.isLetterSquare(startRow, startCol - 1)) {
                startCol--;
            }
            
            // Find end of word (move right while we have consecutive letters)
            while (endCol < this.crosswordGrid.cols - 1 && this.isLetterSquare(endRow, endCol + 1)) {
                endCol++;
            }
        } else { // vertical
            // Find start of word (move up while we have consecutive letters)
            while (startRow > 0 && this.isLetterSquare(startRow - 1, startCol)) {
                startRow--;
            }
            
            // Find end of word (move down while we have consecutive letters)
            while (endRow < this.crosswordGrid.rows - 1 && this.isLetterSquare(endRow + 1, endCol)) {
                endRow++;
            }
        }
        
        // Check if this is a valid word (more than one letter)
        const length = direction === 'horizontal' ? (endCol - startCol + 1) : (endRow - startRow + 1);
        if (length < 2) {
            return null;
        }
        
        // Create arrays for squares and letters - all squares in range have letters
        const squares = [];
        const letters = [];
        
        if (direction === 'horizontal') {
            for (let c = startCol; c <= endCol; c++) {
                squares.push({ row: startRow, col: c });
                const cell = this.crosswordGrid.getCell(startRow, c);
                letters.push(cell.value);
            }
        } else {
            for (let r = startRow; r <= endRow; r++) {
                squares.push({ row: r, col: startCol });
                const cell = this.crosswordGrid.getCell(r, startCol);
                letters.push(cell.value);
            }
        }
        
        // Create word object
        const wordId = `${startRow}-${startCol}-${direction}`;
        
        return {
            id: wordId,
            startRow,
            startCol,
            endRow,
            endCol,
            direction,
            length,
            squares,
            letters,
            text: letters.join('')
        };
    }

    /**
     * Checks if a square is a letter square with content (not black, clue, or empty)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if it's a letter square with content
     */
    isLetterSquare(row, col) {
        const cell = this.crosswordGrid.getCell(row, col);
        return cell && cell.type === 'letter' && !cell.imageClue && cell.value && cell.value.trim() !== '';
    }

    /**
     * Checks if a square can be part of a word (letter square, regardless of content)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if it's a potential letter square
     */
    isPotentialLetterSquare(row, col) {
        const cell = this.crosswordGrid.getCell(row, col);
        return cell && cell.type === 'letter' && !cell.imageClue;
    }

    /**
     * Gets all words in the crossword
     * @returns {Array} Array of word objects
     */
    getAllWords() {
        const words = [];
        const processedWords = new Set();
        
        // Scan for horizontal words
        for (let row = 0; row < this.crosswordGrid.rows; row++) {
            for (let col = 0; col < this.crosswordGrid.cols; col++) {
                if (this.isLetterSquare(row, col)) {
                    const word = this.findWord(row, col, 'horizontal');
                    if (word && !processedWords.has(word.id)) {
                        words.push(word);
                        processedWords.add(word.id);
                    }
                }
            }
        }
        
        // Scan for vertical words
        for (let row = 0; row < this.crosswordGrid.rows; row++) {
            for (let col = 0; col < this.crosswordGrid.cols; col++) {
                if (this.isLetterSquare(row, col)) {
                    const word = this.findWord(row, col, 'vertical');
                    if (word && !processedWords.has(word.id)) {
                        words.push(word);
                        processedWords.add(word.id);
                    }
                }
            }
        }
        
        return words;
    }

    /**
     * Handles click on a square to select words
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {Object|null} Selected word object
     */
    handleSquareClick(row, col) {
        // Only handle clicks on squares with letters
        if (!this.isLetterSquare(row, col)) {
            this.setCurrentWord(null);
            return null;
        }

        // Find both horizontal and vertical words at this position
        const horizontalWord = this.findWord(row, col, 'horizontal');
        const verticalWord = this.findWord(row, col, 'vertical');
        
        // Determine which word to select based on current state
        let selectedWord = null;
        
        if (this.currentWordId) {
            const currentWord = this.getCurrentWord();
            
            // If clicking on the same square and there's both horizontal and vertical words
            if (currentWord && this.isSquareInWord(row, col, currentWord)) {
                if (horizontalWord && verticalWord) {
                    // Toggle between horizontal and vertical
                    if (currentWord.direction === 'horizontal' && verticalWord) {
                        selectedWord = verticalWord;
                    } else if (currentWord.direction === 'vertical' && horizontalWord) {
                        selectedWord = horizontalWord;
                    } else {
                        selectedWord = null; // Clear selection on third click
                    }
                } else {
                    // Only one direction available, clear selection on second click
                    selectedWord = null;
                }
            } else {
                // Clicking on a different square
                // Prefer horizontal first, but if no horizontal word exists, go vertical immediately
                if (horizontalWord) {
                    selectedWord = horizontalWord;
                } else if (verticalWord) {
                    selectedWord = verticalWord;
                }
            }
        } else {
            // No current word
            // Prefer horizontal first, but if no horizontal word exists, go vertical immediately
            if (horizontalWord) {
                selectedWord = horizontalWord;
            } else if (verticalWord) {
                selectedWord = verticalWord;
            }
        }
        
        this.setCurrentWord(selectedWord);
        return selectedWord;
    }

    /**
     * Checks if a square is part of a word
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {Object} word - Word object
     * @returns {boolean} True if square is in the word
     */
    isSquareInWord(row, col, word) {
        if (!word) return false;
        return word.squares.some(square => square.row === row && square.col === col);
    }

    /**
     * Sets the current selected word
     * @param {Object|null} word - Word object or null
     */
    setCurrentWord(word) {
        this.currentWordId = word?.id || null;
        if (word) {
            this.currentDirection = word.direction;
        }
        
        if (this.onWordChange) {
            this.onWordChange(word);
        }
    }

    /**
     * Gets the current selected word
     * @returns {Object|null} Current word object
     */
    getCurrentWord() {
        if (!this.currentWordId) return null;
        
        // Since words can change dynamically, we need to find the current word again
        const [startRow, startCol, direction] = this.currentWordId.split('-');
        return this.findWord(parseInt(startRow), parseInt(startCol), direction);
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
