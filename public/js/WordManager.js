/**
 * WordManager - Manages word detection and tracking in the crossword
 */
class WordManager {
    constructor() {
        console.log('Creating WordManager');
        this.crossword = null; // Will be set by setCrossword()
        this.words = new Map(); // Map of word IDs to word objects
        this.currentWordId = null;
        this.currentDirection = 'horizontal';
        this.onWordChange = null; // Callback for when current word changes
    }

    /**
     * Set the crossword instance this manager works with
     * @param {Crossword} crossword - The crossword instance
     */
    setCrossword(crossword) {
        console.log('WordManager setCrossword');
        this.crossword = crossword;
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
        if (!this.isPotentialLetterSquare(row, col)) {
            return null;
        }
        
        let startRow = row, startCol = col;
        let endRow = row, endCol = col;
        
        if (direction === 'horizontal') {
            // Find start of word (move left while we have consecutive letters)
            while (startCol > 0 && this.isPotentialLetterSquare(startRow, startCol - 1)) {
                startCol--;
            }
            
            // Find end of word (move right while we have consecutive letters)
            while (endCol < this.crossword.cols - 1 && this.isPotentialLetterSquare(endRow, endCol + 1)) {
                endCol++;
            }
        } else { // vertical
            // Find start of word (move up while we have consecutive letters)
            while (startRow > 0 && this.isPotentialLetterSquare(startRow - 1, startCol)) {
                startRow--;
            }
            
            // Find end of word (move down while we have consecutive letters)
            while (endRow < this.crossword.rows - 1 && this.isPotentialLetterSquare(endRow + 1, endCol)) {
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
                const cell = this.crossword.getCell(startRow, c);
                letters.push(cell?.value || '');
            }
        } else {
            for (let r = startRow; r <= endRow; r++) {
                squares.push({ row: r, col: startCol });
                const cell = this.crossword.getCell(r, startCol);
                letters.push(cell?.value || '');
            }
        }
        
        // Create word object
        const wordId = `${startRow}-${startCol}-${direction}`;
        
        const wordResult = {
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
        
        return wordResult;
    }

    /**
     * Finds a potential word area starting at a position in a given direction
     * Words stop at: grid edges, non-letter squares, clue squares, or empty letter squares
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {string} direction - 'horizontal' or 'vertical'
     * @returns {Object|null} Word object or null if no valid word
     */
    findPotentialWord(row, col, direction) {
        // Only start from potential letter squares
        if (!this.isPotentialLetterSquare(row, col)) {
            return null;
        }
        
        // Starting square must have content to form a valid word
        const startCell = this.crossword.getCell(row, col);
        if (!startCell.value || startCell.value.trim() === '') {
            return null;
        }
        
        let startRow = row, startCol = col;
        let endRow = row, endCol = col;
        
        if (direction === 'horizontal') {
            // Find start of word - move left while we have letter squares with content
            while (startCol > 0) {
                const prevCol = startCol - 1;
                const prevCell = this.crossword.getCell(startRow, prevCol);
                
                // Stop at boundaries: non-letter squares, clue squares, or empty letter squares
                if (!prevCell || prevCell.type !== 'letter' || prevCell.imageClue) {
                    break;
                }
                
                // Stop at empty letter squares (natural word boundary)
                if (!prevCell.value || prevCell.value.trim() === '') {
                    break;
                }
                
                startCol--;
            }
            
            // Find end of word - move right while we have letter squares with content
            while (endCol < this.crossword.cols - 1) {
                const nextCol = endCol + 1;
                const nextCell = this.crossword.getCell(endRow, nextCol);
                
                // Stop at boundaries: non-letter squares, clue squares, or empty letter squares
                if (!nextCell || nextCell.type !== 'letter' || nextCell.imageClue) {
                    break;
                }
                
                // Stop at empty letter squares (natural word boundary)
                if (!nextCell.value || nextCell.value.trim() === '') {
                    break;
                }
                
                endCol++;
            }
        } else { // vertical
            // Find start of word - move up while we have letter squares with content
            while (startRow > 0) {
                const prevRow = startRow - 1;
                const prevCell = this.crossword.getCell(prevRow, startCol);
                
                // Stop at boundaries: non-letter squares, clue squares, or empty letter squares
                if (!prevCell || prevCell.type !== 'letter' || prevCell.imageClue) {
                    break;
                }
                
                // Stop at empty letter squares (natural word boundary)
                if (!prevCell.value || prevCell.value.trim() === '') {
                    break;
                }
                
                startRow--;
            }
            
            // Find end of word - move down while we have letter squares with content
            while (endRow < this.crossword.rows - 1) {
                const nextRow = endRow + 1;
                const nextCell = this.crossword.getCell(nextRow, endCol);
                
                // Stop at boundaries: non-letter squares, clue squares, or empty letter squares
                if (!nextCell || nextCell.type !== 'letter' || nextCell.imageClue) {
                    break;
                }
                
                // Stop at empty letter squares (natural word boundary)
                if (!nextCell.value || nextCell.value.trim() === '') {
                    break;
                }
                
                endRow++;
            }
        }
        
        // Check if this is a valid word (at least one square with content)
        const length = direction === 'horizontal' ? (endCol - startCol + 1) : (endRow - startRow + 1);
        
        if (length < 1) {
            return null;
        }
        
        // Create arrays for squares and letters
        const squares = [];
        const letters = [];
        
        if (direction === 'horizontal') {
            for (let c = startCol; c <= endCol; c++) {
                squares.push({ row: startRow, col: c });
                const cell = this.crossword.getCell(startRow, c);
                letters.push(cell?.value || '');
            }
        } else {
            for (let r = startRow; r <= endRow; r++) {
                squares.push({ row: r, col: startCol });
                const cell = this.crossword.getCell(r, startCol);
                letters.push(cell?.value || '');
            }
        }
        
        const wordResult = {
            id: `${startRow}-${startCol}-${direction}`,
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
        
        return wordResult;
    }

    /**
     * Gets the previous position based on direction (opposite of getNextPosition)
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @param {string} direction - Direction we're moving in
     * @returns {Array} [prevRow, prevCol]
     */
    getPrevPosition(row, col, direction) {
        if (direction === 'horizontal') {
            return [row, col - 1];
        } else { // vertical
            return [row - 1, col];
        }
    }

    /**
     * Gets the next position based on direction
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @param {string} direction - Direction to move
     * @returns {Array} [nextRow, nextCol]
     */
    getNextPosition(row, col, direction) {
        if (direction === 'horizontal') {
            return [row, col + 1];
        } else { // vertical
            return [row + 1, col];
        }
    }

    /**
     * Checks if a square is a letter square with content (not black, clue, or empty)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if it's a letter square with content
     */
    isLetterSquare(row, col) {
        if (!this.crossword) {
            console.warn('WordManager: crossword not set');
            return false;
        }
        const cell = this.crossword.getCell(row, col);
        return cell && cell.type === 'letter' && !cell.imageClue && cell.value && cell.value.trim() !== '';
    }

    /**
     * Checks if a square can be part of a word (letter square, regardless of content)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if it's a potential letter square
     */
    isPotentialLetterSquare(row, col) {
        if (!this.crossword) {
            console.warn('WordManager: crossword not set');
            return false;
        }
        const cell = this.crossword.getCell(row, col);
        return cell && cell.type === 'letter' && !cell.imageClue;
    }

    /**
     * Gets all words in the crossword
     * @returns {Array} Array of word objects
     */
    getAllWords() {
        const words = [];
        const processedWords = new Set();
        
        // Scan all filled squares
        for (let row = 0; row < this.crossword.rows; row++) {
            for (let col = 0; col < this.crossword.cols; col++) {
                if (this.isLetterSquare(row, col)) {
                    // Try horizontal word first
                    const horizontalWord = this.findWordFromPosition(row, col, 'horizontal');
                    if (horizontalWord && !processedWords.has(horizontalWord.id)) {
                        words.push(horizontalWord);
                        processedWords.add(horizontalWord.id);
                    }
                    
                    // Try vertical word
                    const verticalWord = this.findWordFromPosition(row, col, 'vertical');
                    if (verticalWord && !processedWords.has(verticalWord.id)) {
                        words.push(verticalWord);
                        processedWords.add(verticalWord.id);
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
        // Only handle clicks on potential letter squares (including empty ones)
        const isPotential = this.isPotentialLetterSquare(row, col);
        
        if (!isPotential) {
            this.setCurrentWord(null);
            return null;
        }

        // Check if the clicked square has content
        const cell = this.crossword.getCell(row, col);
        const hasContent = cell && cell.value && cell.value.trim() !== '';
        
        if (!hasContent) {
            this.setCurrentWord(null);
            return null;
        }
        
        // First try to find a horizontal word starting from this position
        const horizontalWord = this.findWordFromPosition(row, col, 'horizontal');
        
        // If no horizontal word found, try vertical
        const verticalWord = horizontalWord ? null : this.findWordFromPosition(row, col, 'vertical');
        
        // Select the word we found
        const selectedWord = horizontalWord || verticalWord;
        
        // Handle toggling if we already have a current word and clicked the same square
        if (this.currentWordId && selectedWord) {
            const currentWord = this.getCurrentWord();
            if (currentWord && this.isSquareInWord(row, col, currentWord)) {
                // If we found both horizontal and vertical words, toggle between them
                // Use default search direction (no arrow adjustment) for toggling
                const horizontalWordDefault = this.findWordFromPositionDefault(row, col, 'horizontal');
                const verticalWordDefault = this.findWordFromPositionDefault(row, col, 'vertical');
                
                if (horizontalWordDefault && verticalWordDefault) {
                    const otherWord = currentWord.direction === 'horizontal' 
                        ? verticalWordDefault
                        : horizontalWordDefault;
                    this.setCurrentWord(otherWord);
                    return otherWord;
                } else {
                    // Only one direction available, keep current selection
                    return currentWord;
                }
            }
        }
        
        this.setCurrentWord(selectedWord);
        return selectedWord;
    }

    /**
     * Finds a word starting from a position in the given direction, following arrows
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {string} direction - 'horizontal' or 'vertical'
     * @returns {Object|null} Word object or null if no valid word
     */
    findWordFromPosition(row, col, direction) {
        // Check if starting position is valid
        if (!this.isPotentialLetterSquare(row, col)) {
            return null;
        }
        
        const startCell = this.crossword.getCell(row, col);
        if (!startCell.value || startCell.value.trim() === '') {
            return null;
        }
        
        // If the clicked square has an arrow, we need to search for the word segment
        // that leads TO this arrow, not the one that goes FROM it
        let searchDirection = direction;
        if (startCell.arrow) {
            if (startCell.arrow === 'top-to-right' && direction === 'horizontal') {
                // Arrow goes from vertical to horizontal, so search vertical first
                searchDirection = 'vertical';
            } else if (startCell.arrow === 'left-to-down' && direction === 'vertical') {
                // Arrow goes from horizontal to vertical, so search horizontal first
                searchDirection = 'horizontal';
            }
        }
        
        // Find the start of the word by going backward
        const wordStart = this.findWordStart(row, col, searchDirection);
        
        // Find the end of the word by going forward from the start
        const wordSquares = this.traceWordFromStart(wordStart.row, wordStart.col, wordStart.direction);
        
        // Make sure we found a valid word and that it contains our clicked position
        if (!wordSquares || wordSquares.length < 2) {
            return null;
        }
        
        // Check if the clicked position is in the word
        const containsClick = wordSquares.some(sq => sq.row === row && sq.col === col);
        if (!containsClick) {
            return null;
        }
        
        // Build the word object
        const letters = wordSquares.map(sq => {
            const cell = this.crossword.getCell(sq.row, sq.col);
            return cell?.value || '';
        });
        
        return {
            id: `${wordStart.row}-${wordStart.col}-${direction}-${Date.now()}`,
            startRow: wordSquares[0].row,
            startCol: wordSquares[0].col,
            endRow: wordSquares[wordSquares.length - 1].row,
            endCol: wordSquares[wordSquares.length - 1].col,
            direction: direction,
            length: wordSquares.length,
            squares: wordSquares,
            letters: letters,
            text: letters.join('')
        };
    }

    /**
     * Finds a word starting from a position in the given direction without arrow adjustments
     * Used for toggling between word directions on second click
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {string} direction - 'horizontal' or 'vertical'
     * @returns {Object|null} Word object or null if no valid word
     */
    findWordFromPositionDefault(row, col, direction) {
        // Check if starting position is valid
        if (!this.isPotentialLetterSquare(row, col)) {
            return null;
        }
        
        const startCell = this.crossword.getCell(row, col);
        if (!startCell.value || startCell.value.trim() === '') {
            return null;
        }
        
        // Use the requested direction without arrow adjustments
        const searchDirection = direction;
        
        // Find the start of the word by going backward
        const wordStart = this.findWordStart(row, col, searchDirection);
        
        // Find the end of the word by going forward from the start
        const wordSquares = this.traceWordFromStart(wordStart.row, wordStart.col, wordStart.direction);
        
        // Make sure we found a valid word and that it contains our clicked position
        if (!wordSquares || wordSquares.length < 2) {
            return null;
        }
        
        // Check if the clicked position is in the word
        const containsClick = wordSquares.some(sq => sq.row === row && sq.col === col);
        if (!containsClick) {
            return null;
        }
        
        // Build the word object
        const letters = wordSquares.map(sq => {
            const cell = this.crossword.getCell(sq.row, sq.col);
            return cell?.value || '';
        });
        
        return {
            id: `${wordStart.row}-${wordStart.col}-${direction}-${Date.now()}`,
            startRow: wordSquares[0].row,
            startCol: wordSquares[0].col,
            endRow: wordSquares[wordSquares.length - 1].row,
            endCol: wordSquares[wordSquares.length - 1].col,
            direction: direction,
            length: wordSquares.length,
            squares: wordSquares,
            letters: letters,
            text: letters.join('')
        };
    }

    /**
     * Finds the start of a word by going backward from a position
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {string} direction - Direction to search
     * @returns {Object} {row, col, direction} of word start
     */
    findWordStart(row, col, direction) {
        let currentRow = row;
        let currentCol = col;
        let currentDirection = direction;
        const visited = new Set();
        
        while (true) {
            const key = `${currentRow}-${currentCol}`;
            if (visited.has(key)) break; // Avoid infinite loops
            visited.add(key);
            
            // Try to go backward in current direction
            const [prevRow, prevCol] = this.getPrevPosition(currentRow, currentCol, currentDirection);
            
            // Stop if we've hit the edge or invalid square
            if (!this.isPotentialLetterSquare(prevRow, prevCol)) {
                break;
            }
            
            // Stop if previous square is empty
            const prevCell = this.crossword.getCell(prevRow, prevCol);
            if (!prevCell.value || prevCell.value.trim() === '') {
                break;
            }
            
            // Move to the previous position
            currentRow = prevRow;
            currentCol = prevCol;
            
            // If this square has an arrow pointing to where we came from, adjust direction
            if (prevCell.arrow) {
                if (prevCell.arrow === 'left-to-down' && currentDirection === 'vertical') {
                    currentDirection = 'horizontal';
                } else if (prevCell.arrow === 'top-to-right' && currentDirection === 'horizontal') {
                    currentDirection = 'vertical';
                }
            }
        }
        
        return { row: currentRow, col: currentCol, direction: currentDirection };
    }

    /**
     * Traces a word forward from a starting position, following arrows
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {string} direction - Starting direction
     * @returns {Array} Array of square positions
     */
    traceWordFromStart(row, col, direction) {
        const squares = [];
        let currentRow = row;
        let currentCol = col;
        let currentDirection = direction;
        const visited = new Set();
        
        while (true) {
            const key = `${currentRow}-${currentCol}`;
            if (visited.has(key)) break; // Avoid infinite loops
            visited.add(key);
            
            // Check if current position is valid and has content
            if (!this.isPotentialLetterSquare(currentRow, currentCol)) {
                break;
            }
            
            const cell = this.crossword.getCell(currentRow, currentCol);
            if (!cell.value || cell.value.trim() === '') {
                break;
            }
            
            // Add this square to our word
            squares.push({ row: currentRow, col: currentCol });
            
            // Check if this square has an arrow that changes direction
            if (cell.arrow) {
                if (cell.arrow === 'left-to-down' && currentDirection === 'horizontal') {
                    currentDirection = 'vertical';
                } else if (cell.arrow === 'top-to-right' && currentDirection === 'vertical') {
                    currentDirection = 'horizontal';
                }
            }
            
            // Move to next position
            const [nextRow, nextCol] = this.getNextPosition(currentRow, currentCol, currentDirection);
            currentRow = nextRow;
            currentCol = nextCol;
        }
        
        return squares;
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
