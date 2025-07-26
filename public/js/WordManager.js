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
        console.debug(`🔍 findWord(${row}, ${col}, ${direction}) starting (OLD method)...`);
        
        // Only start from squares that have letters
        if (!this.isPotentialLetterSquare(row, col)) {
            console.debug('❌ Starting square is not potential letter square (OLD method)');
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
            while (endCol < this.crosswordGrid.cols - 1 && this.isPotentialLetterSquare(endRow, endCol + 1)) {
                endCol++;
            }
        } else { // vertical
            // Find start of word (move up while we have consecutive letters)
            while (startRow > 0 && this.isPotentialLetterSquare(startRow - 1, startCol)) {
                startRow--;
            }
            
            // Find end of word (move down while we have consecutive letters)
            while (endRow < this.crosswordGrid.rows - 1 && this.isPotentialLetterSquare(endRow + 1, endCol)) {
                endRow++;
            }
        }
        
        // Check if this is a valid word (more than one letter)
        const length = direction === 'horizontal' ? (endCol - startCol + 1) : (endRow - startRow + 1);
        console.debug(`📏 findWord length calculated: ${length} (from ${startRow},${startCol} to ${endRow},${endCol})`);
        
        if (length < 2) {
            console.debug('❌ findWord too short (length < 2), returning null');
            return null;
        }
        
        // Create arrays for squares and letters - all squares in range have letters
        const squares = [];
        const letters = [];
        
        if (direction === 'horizontal') {
            for (let c = startCol; c <= endCol; c++) {
                squares.push({ row: startRow, col: c });
                const cell = this.crosswordGrid.getCell(startRow, c);
                letters.push(cell?.value || '');
            }
        } else {
            for (let r = startRow; r <= endRow; r++) {
                squares.push({ row: r, col: startCol });
                const cell = this.crosswordGrid.getCell(r, startCol);
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
        
        console.debug(`✅ findWord result:`, {
            id: wordResult.id,
            direction: wordResult.direction,
            squares: wordResult.squares.length,
            text: wordResult.text
        });
        
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
        console.debug(`🔍 findPotentialWord(${row}, ${col}, ${direction}) starting...`);
        
        // Only start from potential letter squares
        if (!this.isPotentialLetterSquare(row, col)) {
            console.debug('❌ Starting square is not potential letter square');
            return null;
        }
        
        // Starting square must have content to form a valid word
        const startCell = this.crosswordGrid.getCell(row, col);
        if (!startCell.value || startCell.value.trim() === '') {
            console.debug('❌ Starting square is empty, no word possible');
            return null;
        }
        
        let startRow = row, startCol = col;
        let endRow = row, endCol = col;
        
        if (direction === 'horizontal') {
            // Find start of word - move left while we have letter squares with content
            console.debug(`🔍 Moving left from ${startRow},${startCol}...`);
            while (startCol > 0) {
                const prevCol = startCol - 1;
                const prevCell = this.crosswordGrid.getCell(startRow, prevCol);
                
                // Stop at boundaries: non-letter squares, clue squares, or empty letter squares
                if (!prevCell || prevCell.type !== 'letter' || prevCell.imageClue) {
                    console.debug(`🔍 Stop left at ${startRow},${prevCol}: hard boundary (type: ${prevCell?.type})`);
                    break;
                }
                
                // Stop at empty letter squares (natural word boundary)
                if (!prevCell.value || prevCell.value.trim() === '') {
                    console.debug(`🔍 Stop left at ${startRow},${prevCol}: empty letter square boundary`);
                    break;
                }
                
                console.debug(`🔍 Continue left at ${startRow},${prevCol}: has content "${prevCell.value}"`);
                startCol--;
            }
            
            // Find end of word - move right while we have letter squares with content
            console.debug(`🔍 Moving right from ${endRow},${endCol}...`);
            while (endCol < this.crosswordGrid.cols - 1) {
                const nextCol = endCol + 1;
                const nextCell = this.crosswordGrid.getCell(endRow, nextCol);
                
                // Stop at boundaries: non-letter squares, clue squares, or empty letter squares
                if (!nextCell || nextCell.type !== 'letter' || nextCell.imageClue) {
                    console.debug(`🔍 Stop right at ${endRow},${nextCol}: hard boundary (type: ${nextCell?.type})`);
                    break;
                }
                
                // Stop at empty letter squares (natural word boundary)
                if (!nextCell.value || nextCell.value.trim() === '') {
                    console.debug(`🔍 Stop right at ${endRow},${nextCol}: empty letter square boundary`);
                    break;
                }
                
                console.debug(`🔍 Continue right at ${endRow},${nextCol}: has content "${nextCell.value}"`);
                endCol++;
            }
        } else { // vertical
            // Find start of word - move up while we have letter squares with content
            console.debug(`🔍 Moving up from ${startRow},${startCol}...`);
            while (startRow > 0) {
                const prevRow = startRow - 1;
                const prevCell = this.crosswordGrid.getCell(prevRow, startCol);
                
                // Stop at boundaries: non-letter squares, clue squares, or empty letter squares
                if (!prevCell || prevCell.type !== 'letter' || prevCell.imageClue) {
                    console.debug(`🔍 Stop up at ${prevRow},${startCol}: hard boundary (type: ${prevCell?.type})`);
                    break;
                }
                
                // Stop at empty letter squares (natural word boundary)
                if (!prevCell.value || prevCell.value.trim() === '') {
                    console.debug(`🔍 Stop up at ${prevRow},${startCol}: empty letter square boundary`);
                    break;
                }
                
                console.debug(`🔍 Continue up at ${prevRow},${startCol}: has content "${prevCell.value}"`);
                startRow--;
            }
            
            // Find end of word - move down while we have letter squares with content
            console.debug(`🔍 Moving down from ${endRow},${endCol}...`);
            while (endRow < this.crosswordGrid.rows - 1) {
                const nextRow = endRow + 1;
                const nextCell = this.crosswordGrid.getCell(nextRow, endCol);
                
                // Stop at boundaries: non-letter squares, clue squares, or empty letter squares
                if (!nextCell || nextCell.type !== 'letter' || nextCell.imageClue) {
                    console.debug(`🔍 Stop down at ${nextRow},${endCol}: hard boundary (type: ${nextCell?.type})`);
                    break;
                }
                
                // Stop at empty letter squares (natural word boundary)
                if (!nextCell.value || nextCell.value.trim() === '') {
                    console.debug(`🔍 Stop down at ${nextRow},${endCol}: empty letter square boundary`);
                    break;
                }
                
                console.debug(`🔍 Continue down at ${nextRow},${endCol}: has content "${nextCell.value}"`);
                endRow++;
            }
        }
        
        // Check if this is a valid word (at least one square with content)
        const length = direction === 'horizontal' ? (endCol - startCol + 1) : (endRow - startRow + 1);
        console.debug(`📏 Word length calculated: ${length} (from ${startRow},${startCol} to ${endRow},${endCol})`);
        
        if (length < 1) {
            console.debug('❌ Word too short (length < 1), returning null');
            return null;
        }
        
        // Create arrays for squares and letters
        const squares = [];
        const letters = [];
        
        if (direction === 'horizontal') {
            for (let c = startCol; c <= endCol; c++) {
                squares.push({ row: startRow, col: c });
                const cell = this.crosswordGrid.getCell(startRow, c);
                letters.push(cell?.value || '');
            }
        } else {
            for (let r = startRow; r <= endRow; r++) {
                squares.push({ row: r, col: startCol });
                const cell = this.crosswordGrid.getCell(r, startCol);
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
        
        console.debug(`✅ findPotentialWord result:`, {
            id: wordResult.id,
            direction: wordResult.direction,
            squares: wordResult.squares.length,
            text: wordResult.text
        });
        
        return wordResult;
    }

    /**
     * Finds a word that follows bent arrows, changing direction as needed
     * @param {number} startRow - Starting row
     * @param {number} startCol - Starting column
     * @param {string} initialDirection - Initial direction ('horizontal' or 'vertical')
     * @returns {Object|null} Word object with squares and text, including direction changes
     */
    findBentWord(startRow, startCol, initialDirection) {
        // Try to trace forward from this position
        const forwardWord = this.traceBentWordFromStart(startRow, startCol, initialDirection);
        
        // Try to find the actual start by going backward and then forward
        const backwardStart = this.findWordStartWithArrows(startRow, startCol, initialDirection);
        const backwardWord = backwardStart ? this.traceBentWordFromStart(backwardStart.row, backwardStart.col, backwardStart.direction) : null;
        
        // Return the bent word that has direction changes and contains our position
        if (backwardWord && backwardWord.directionChanges.length > 0 && 
            backwardWord.squares.some(sq => sq.row === startRow && sq.col === startCol)) {
            return backwardWord;
        }
        
        if (forwardWord && forwardWord.directionChanges.length > 0) {
            return forwardWord;
        }
        
        return null; // No bent word found
    }

    /**
     * Finds the actual start of a word by going backwards, considering arrows
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {string} direction - Initial direction
     * @returns {Object|null} {row, col, direction} of word start or null
     */
    findWordStartWithArrows(row, col, direction) {
        let currentRow = row;
        let currentCol = col;
        let currentDirection = direction;
        
        // Keep track of visited positions to avoid infinite loops
        const visited = new Set();
        let attempts = 0;
        const maxAttempts = 50; // Safety limit
        
        while (attempts < maxAttempts) {
            attempts++;
            const key = `${currentRow}-${currentCol}-${currentDirection}`;
            if (visited.has(key)) {
                break;
            }
            visited.add(key);
            
            // Try to go backward in current direction
            const [prevRow, prevCol] = this.getPrevPosition(currentRow, currentCol, currentDirection);
            
            // Check if previous position exists and is a potential letter square
            if (!this.isPotentialLetterSquare(prevRow, prevCol)) {
                return { row: currentRow, col: currentCol, direction: currentDirection };
            }
            
            // Check if previous position is empty (natural word boundary)
            const prevCell = this.crosswordGrid.getCell(prevRow, prevCol);
            if (!prevCell.value || prevCell.value.trim() === '') {
                return { row: currentRow, col: currentCol, direction: currentDirection };
            }
            
            // Move to previous position
            currentRow = prevRow;
            currentCol = prevCol;
            
            // Check if this previous position has an arrow that would have led us here
            if (prevCell && prevCell.arrow) {
                // Adjust direction based on arrow
                if (prevCell.arrow === 'top-to-right' && currentDirection === 'horizontal') {
                    currentDirection = 'vertical';
                } else if (prevCell.arrow === 'left-to-down' && currentDirection === 'vertical') {
                    currentDirection = 'horizontal';
                }
            }
        }
        
        return { row: currentRow, col: currentCol, direction: currentDirection };
    }

    /**
     * Traces a bent word from a starting position
     * @param {number} startRow - Starting row
     * @param {number} startCol - Starting column
     * @param {string} initialDirection - Initial direction
     * @returns {Object|null} Bent word object or null
     */
    traceBentWordFromStart(startRow, startCol, initialDirection) {
        const squares = [];
        const letters = [];
        let currentRow = startRow;
        let currentCol = startCol;
        let currentDirection = initialDirection;
        const directionChanges = [];
        const visited = new Set();
        
        while (true) {
            const cell = this.crosswordGrid.getCell(currentRow, currentCol);
            
            // Stop if we've reached an invalid position, visited this cell, or it's not a potential letter square
            if (!cell || visited.has(`${currentRow}-${currentCol}`) || 
                !this.isPotentialLetterSquare(currentRow, currentCol)) {
                break;
            }
            
            // Stop at empty letter squares (natural word boundary) - but allow first square to be empty
            if (squares.length > 0 && (!cell.value || cell.value.trim() === '')) {
                console.debug(`🔍 Bent word stops at empty square at ${currentRow},${currentCol}`);
                break;
            }
            
            visited.add(`${currentRow}-${currentCol}`);
            squares.push({ row: currentRow, col: currentCol });
            letters.push(cell.value || '');
            
            // Check for direction change arrows
            let nextDirection = currentDirection;
            if (cell.arrow === 'top-to-right' && currentDirection === 'vertical') {
                nextDirection = 'horizontal';
                directionChanges.push({
                    position: squares.length - 1,
                    from: 'vertical',
                    to: 'horizontal',
                    row: currentRow,
                    col: currentCol
                });
            } else if (cell.arrow === 'left-to-down' && currentDirection === 'horizontal') {
                nextDirection = 'vertical';
                directionChanges.push({
                    position: squares.length - 1,
                    from: 'horizontal',
                    to: 'vertical',
                    row: currentRow,
                    col: currentCol
                });
            }
            
            // Move to next position based on current direction
            const [nextRow, nextCol] = this.getNextPosition(currentRow, currentCol, nextDirection);
            
            // Check if next position would be valid before continuing
            const nextCell = this.crosswordGrid.getCell(nextRow, nextCol);
            if (!nextCell || nextCell.type !== 'letter' || nextCell.imageClue) {
                console.debug(`🔍 Bent word stops at boundary at ${nextRow},${nextCol}`);
                break;
            }
            
            // Update direction if it changed
            currentDirection = nextDirection;
            currentRow = nextRow;
            currentCol = nextCol;
        }
        
        if (squares.length < 2) {
            return null;
        }

        // Create a unique ID that includes direction changes
        const wordId = `${squares[0].row}-${squares[0].col}-bent-${initialDirection}-${directionChanges.length}`;
        
        return {
            id: wordId,
            startRow: squares[0].row,
            startCol: squares[0].col,
            endRow: squares[squares.length - 1].row,
            endCol: squares[squares.length - 1].col,
            direction: initialDirection,
            length: squares.length,
            squares: squares,
            letters: letters,
            text: letters.join(''),
            isBent: true,
            directionChanges: directionChanges
        };
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
        const result = cell && cell.type === 'letter' && !cell.imageClue;
        console.debug(`🔍 isPotentialLetterSquare(${row}, ${col}):`, {
            cell: cell ? 'exists' : 'null',
            type: cell?.type,
            imageClue: cell?.imageClue,
            result: result
        });
        return result;
    }

    /**
     * Gets all words in the crossword
     * @returns {Array} Array of word objects
     */
    getAllWords() {
        const words = [];
        const processedWords = new Set();
        
        // Scan for horizontal words (both straight and bent)
        for (let row = 0; row < this.crosswordGrid.rows; row++) {
            for (let col = 0; col < this.crosswordGrid.cols; col++) {
                if (this.isLetterSquare(row, col)) {
                    // Try bent word first, then straight word
                    const bentWord = this.findBentWord(row, col, 'horizontal');
                    const straightWord = this.findWord(row, col, 'horizontal');
                    
                    // Prefer bent word if it exists and is different from straight word
                    const word = (bentWord && bentWord.isBent) ? bentWord : straightWord;
                    
                    if (word && !processedWords.has(word.id)) {
                        words.push(word);
                        processedWords.add(word.id);
                    }
                }
            }
        }
        
        // Scan for vertical words (both straight and bent) 
        for (let row = 0; row < this.crosswordGrid.rows; row++) {
            for (let col = 0; col < this.crosswordGrid.cols; col++) {
                if (this.isLetterSquare(row, col)) {
                    // Try bent word first, then straight word
                    const bentWord = this.findBentWord(row, col, 'vertical');
                    const straightWord = this.findWord(row, col, 'vertical');
                    
                    // Prefer bent word if it exists and is different from straight word
                    const word = (bentWord && bentWord.isBent) ? bentWord : straightWord;
                    
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
        console.debug('🔍 WordManager.handleSquareClick called with row:', row, 'col:', col);
        
        // Only handle clicks on potential letter squares (including empty ones)
        const isPotential = this.isPotentialLetterSquare(row, col);
        console.debug('🔎 isPotentialLetterSquare check result:', isPotential);
        
        if (!isPotential) {
            console.debug('❌ Not a potential letter square, clearing selection');
            this.setCurrentWord(null);
            return null;
        }

        // Check if the clicked square has content
        const cell = this.crosswordGrid.getCell(row, col);
        const hasContent = cell && cell.value && cell.value.trim() !== '';
        console.debug('🔎 Square has content:', hasContent, 'value:', cell?.value);
        
        if (!hasContent) {
            console.debug('❌ Empty square clicked, clearing selection');
            this.setCurrentWord(null);
            return null;
        }

        console.debug('✅ Square has content, finding words...');
        
        // Find both horizontal and vertical words at this position
        // Try bent words first, then fall back to straight words
        console.debug('🔍 Looking for bent words...');
        const bentHorizontalWord = this.findBentWord(row, col, 'horizontal');
        const bentVerticalWord = this.findBentWord(row, col, 'vertical');
        console.debug('🔍 Bent horizontal word:', bentHorizontalWord ? `${bentHorizontalWord.id}` : 'null');
        console.debug('🔍 Bent vertical word:', bentVerticalWord ? `${bentVerticalWord.id}` : 'null');
        
        console.debug('🔍 Looking for potential words...');
        const potentialHorizontalWord = this.findPotentialWord(row, col, 'horizontal');
        const potentialVerticalWord = this.findPotentialWord(row, col, 'vertical');
        console.debug('🔍 Potential horizontal word:', potentialHorizontalWord ? `${potentialHorizontalWord.id}` : 'null');
        console.debug('🔍 Potential vertical word:', potentialVerticalWord ? `${potentialVerticalWord.id}` : 'null');
        
        const horizontalWord = bentHorizontalWord || potentialHorizontalWord;
        const verticalWord = bentVerticalWord || potentialVerticalWord;
        
        // Filter out single-letter words unless there's no alternative
        const horizontalWordLength = horizontalWord ? horizontalWord.length : 0;
        const verticalWordLength = verticalWord ? verticalWord.length : 0;
        
        const validHorizontalWord = horizontalWord && horizontalWordLength > 1;
        const validVerticalWord = verticalWord && verticalWordLength > 1;
        
        console.debug('🔤 Found horizontal word:', horizontalWord ? `${horizontalWord.id} (${horizontalWord.squares.length} squares)` : 'null');
        console.debug('🔤 Found vertical word:', verticalWord ? `${verticalWord.id} (${verticalWord.squares.length} squares)` : 'null');
        console.debug('🔤 Valid horizontal word (length > 1):', validHorizontalWord ? 'yes' : 'no');
        console.debug('🔤 Valid vertical word (length > 1):', validVerticalWord ? 'yes' : 'no');
        
        // Determine which word to select based on current state
        let selectedWord = null;
        
        console.debug('🎯 Current word ID:', this.currentWordId);
        
        if (this.currentWordId) {
            const currentWord = this.getCurrentWord();
            console.debug('🎯 Current word object:', currentWord ? `${currentWord.id} (${currentWord.direction})` : 'null');
            
            // If clicking on the same square and there's both horizontal and vertical words
            if (currentWord && this.isSquareInWord(row, col, currentWord)) {
                console.debug('🔄 Clicking on same square in current word - checking for toggle');
                if (validHorizontalWord && validVerticalWord) {
                    console.debug('🔄 Both valid directions available, toggling...');
                    // Toggle between horizontal and vertical
                    if (currentWord.direction === 'horizontal' && validVerticalWord) {
                        selectedWord = verticalWord;
                        console.debug('↕️ Switching from horizontal to vertical');
                    } else if (currentWord.direction === 'vertical' && validHorizontalWord) {
                        selectedWord = horizontalWord;
                        console.debug('↔️ Switching from vertical to horizontal');
                    } else {
                        selectedWord = null; // Clear selection on third click
                        console.debug('🚫 Third click - clearing selection');
                    }
                } else {
                    // Only one direction available, clear selection on second click
                    selectedWord = null;
                    console.debug('🚫 Only one direction - clearing selection on second click');
                }
            } else {
                console.debug('🆕 Clicking on different square');
                // Clicking on a different square - prefer multi-letter words over single-letter words
                if (validHorizontalWord && validVerticalWord) {
                    selectedWord = horizontalWord;
                    console.debug('↔️ Both valid directions available, selecting horizontal word (different square)');
                } else if (validHorizontalWord) {
                    selectedWord = horizontalWord;
                    console.debug('↔️ Only horizontal word valid, selecting it (different square)');
                } else if (validVerticalWord) {
                    selectedWord = verticalWord;
                    console.debug('↕️ Only vertical word valid, selecting it (different square)');
                } else if (horizontalWord) {
                    selectedWord = horizontalWord;
                    console.debug('↔️ Only single-letter horizontal word available (different square)');
                } else if (verticalWord) {
                    selectedWord = verticalWord;
                    console.debug('↕️ Only single-letter vertical word available (different square)');
                } else {
                    console.debug('❌ No words found in either direction (different square)');
                }
            }
        } else {
            console.debug('🆕 No current word, selecting new word');
            // No current word - prefer multi-letter words over single-letter words
            if (validHorizontalWord && validVerticalWord) {
                selectedWord = horizontalWord;
                console.debug('↔️ Both valid directions available, selecting horizontal word (no current)');
            } else if (validHorizontalWord) {
                selectedWord = horizontalWord;
                console.debug('↔️ Only horizontal word valid, selecting it (no current)');
            } else if (validVerticalWord) {
                selectedWord = verticalWord;
                console.debug('↕️ Only vertical word valid, selecting it (no current)');
            } else if (horizontalWord) {
                selectedWord = horizontalWord;
                console.debug('↔️ Only single-letter horizontal word available (no current)');
            } else if (verticalWord) {
                selectedWord = verticalWord;
                console.debug('↕️ Only single-letter vertical word available (no current)');
            } else {
                console.debug('❌ No words found in either direction');
            }
        }
        
        console.debug('🎉 Final selected word:', selectedWord ? `${selectedWord.id} (${selectedWord.direction}, ${selectedWord.squares.length} squares)` : 'null');
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
        console.debug('💾 WordManager.setCurrentWord called with:', word ? `${word.id} (${word.direction})` : 'null');
        this.currentWordId = word?.id || null;
        if (word) {
            this.currentDirection = word.direction;
        }
        
        if (this.onWordChange) {
            console.debug('📞 Calling onWordChange callback with word:', word ? `${word.id} (${word.squares.length} squares)` : 'null');
            this.onWordChange(word);
        } else {
            console.debug('❌ No onWordChange callback set!');
        }
    }

    /**
     * Gets the current selected word
     * @returns {Object|null} Current word object
     */
    getCurrentWord() {
        if (!this.currentWordId) return null;
        
        // Since words can change dynamically, we need to find the current word again
        if (this.currentWordId.includes('-bent-')) {
            // Handle bent word IDs: "row-col-bent-direction-changes"
            const parts = this.currentWordId.split('-');
            const startRow = parseInt(parts[0]);
            const startCol = parseInt(parts[1]);
            const direction = parts[3];
            return this.findBentWord(startRow, startCol, direction) || this.findWord(startRow, startCol, direction);
        } else {
            // Handle straight word IDs: "row-col-direction"
            const parts = this.currentWordId.split('-');
            const startRow = parseInt(parts[0]);
            const startCol = parseInt(parts[1]);
            const direction = parts[2];
            return this.findBentWord(startRow, startCol, direction) || this.findWord(startRow, startCol, direction);
        }
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
