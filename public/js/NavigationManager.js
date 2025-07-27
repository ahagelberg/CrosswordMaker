/**
 * NavigationManager - Handles keyboard navigation and focus management
 */
class NavigationManager {
    constructor() {
        console.log('Creating NavigationManager');
        this.crossword = null; // Will be set by setCrossword()
        this.focusedSquare = { row: 0, col: 0 };
        this.entryDirection = 'horizontal';
        this.lastEnteredPosition = null;
        this.lastChangedPosition = null;
        
        //this.setupEventListeners();
    }

    /**
     * Set the crossword instance this manager works with
     * @param {Crossword} crossword - The crossword instance
     */
    setCrossword(crossword) {
        console.log('NavigationManager setCrossword');
        this.crossword = crossword;
    }

    /**
     * Sets up keyboard event listeners
     */
    setupEventListeners() {
        // Single global keydown handler for all keyboard events
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e), false);
    }

    /**
     * Main keydown event handler - routes events to appropriate sub-handlers
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleGlobalKeydown(e) {
        // Handle global shortcuts first
        if (this.handleGlobalShortcuts(e)) {
            return; // Event was handled, stop processing
        }

        // Handle navigation events within the crossword grid
        if (e.target.closest('.crossword-grid') && !e.target.closest('.clue-edit-overlay')) {
            this.handleGridNavigation(e);
        }
    }

    /**
     * Handles global keyboard shortcuts
     * @param {KeyboardEvent} e - The keyboard event
     * @returns {boolean} True if event was handled
     */
    handleGlobalShortcuts(e) {
        // Handle Ctrl+S for saving
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('crossword:save'));
            return true;
        }
        
        return false; // Event not handled
    }

    /**
     * Handles navigation within the crossword grid
     * @param {KeyboardEvent} e - The keyboard event
     * @returns {boolean} True if event was handled
     */
    handleGridNavigation(e) {
        // Only handle arrow keys and only if not already prevented
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !e.defaultPrevented) {
            e.preventDefault();
            
            switch (e.key) {
                case 'ArrowUp':
                    this.moveArrowKeys('up');
                    break;
                case 'ArrowDown':
                    this.moveArrowKeys('down');
                    break;
                case 'ArrowLeft':
                    this.moveArrowKeys('left');
                    break;
                case 'ArrowRight':
                    this.moveArrowKeys('right');
                    break;
            }
            return true; // Event was handled
        }
        
        return false; // Event not handled, let squares handle it
    }

    /**
     * Handles arrow key navigation within the grid
     * @param {string} direction - Direction to move ('up', 'down', 'left', 'right')
     */
    moveArrowKeys(direction) {
        let newRow = this.focusedSquare.row;
        let newCol = this.focusedSquare.col;
        
        // Navigate to other squares
        switch (direction) {
            case 'up':
                newRow = Math.max(0, newRow - 1);
                break;
            case 'down':
                newRow = Math.min(this.crossword.rows - 1, newRow + 1);
                break;
            case 'left':
                newCol = Math.max(0, newCol - 1);
                break;
            case 'right':
                newCol = Math.min(this.crossword.cols - 1, newCol + 1);
                break;
        }
        
        this.updateFocusedSquare(newRow, newCol);
        setTimeout(() => this.focusSquare(newRow, newCol), 10);
    }

    /**
     * Focuses a specific square in the grid
     * @param {number} row - Row index of the square to focus
     * @param {number} col - Column index of the square to focus
     */
    focusSquare(row, col) {
        console.log(`NavigationManager focusSquare(${row}, ${col})`);
        if (!this.crossword) {
            console.warn('NavigationManager: crossword not set');
            return;
        }
        
        const squares = document.querySelectorAll('.square');
        const index = row * this.crossword.cols + col;
        const square = squares[index];
        
        if (square) {
            // Let the square handle its own focus logic
            square.focus();
        }
    }

    /**
     * Updates the visual focus state of squares and tracks the currently focused square
     * @param {number} row - Row index of the square to focus
     * @param {number} col - Column index of the square to focus
     */
    updateFocusedSquare(row, col) {
        console.log(`NavigationManager updateFocusedSquare(${row}, ${col})`);
        if (!this.crossword) {
            console.warn('NavigationManager: crossword not set');
            return;
        }
        
        // Remove focused class from all squares
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('focused');
        });
        
        // Add focused class to the current square
        const squares = document.querySelectorAll('.square');
        const index = row * this.crossword.cols + col;
        if (squares[index]) {
            squares[index].classList.add('focused');
            this.focusedSquare = { row, col };
        }
    }

    /**
     * Detects the entry direction (horizontal or vertical) based on the last changed position
     * @param {number} currentRow - Current row position
     * @param {number} currentCol - Current column position
     */
    detectDirection(currentRow, currentCol) {
        if (this.lastChangedPosition) {
            const rowDiff = currentRow - this.lastChangedPosition.row;
            const colDiff = currentCol - this.lastChangedPosition.col;
            
            // Check if clicked square is directly below the last changed square
            if (rowDiff === 1 && colDiff === 0) {
                this.entryDirection = 'vertical';
            } else {
                // For any other click position, reset to horizontal
                this.entryDirection = 'horizontal';
            }
        } else {
            // No previous position, default to horizontal
            this.entryDirection = 'horizontal';
        }
    }

    /**
     * Finds the next empty letter square to move to when entering letters
     * @param {number} fromRow - Current row position
     * @param {number} fromCol - Current column position
     * @returns {Object|null} Object with row and col properties, or null if no valid next square
     */
    moveToNextSquare(fromRow, fromCol) {
        if (!this.crossword) {
            console.warn('NavigationManager: crossword not set');
            return null;
        }
        
        let nextRow = fromRow;
        let nextCol = fromCol;
        
        if (this.entryDirection === 'horizontal') {
            nextCol++;
            if (nextCol >= this.crossword.cols || 
                this.crossword.getCell(nextRow, nextCol)?.type !== 'letter' || 
                this.crossword.getCell(nextRow, nextCol)?.value !== '') {
                // Can't move horizontally, try vertical
                nextCol = fromCol;
                nextRow++;
                if (nextRow >= this.crossword.rows || 
                    this.crossword.getCell(nextRow, nextCol)?.type !== 'letter') {
                    return null; // No valid next square
                }
            }
        } else { // vertical
            nextRow++;
            if (nextRow >= this.crossword.rows || 
                this.crossword.getCell(nextRow, nextCol)?.type !== 'letter' || 
                this.crossword.getCell(nextRow, nextCol)?.value !== '') {
                // Can't move vertically, try horizontal
                nextRow = fromRow;
                nextCol++;
                if (nextCol >= this.crossword.cols || 
                    this.crossword.getCell(nextRow, nextCol)?.type !== 'letter') {
                    return null; // No valid next square
                }
            }
        }
        
        return { row: nextRow, col: nextCol };
    }

    /**
     * Handles input focus for a square
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    onInputFocus(row, col) {
        this.detectDirection(row, col);
        this.lastEnteredPosition = { row, col };
        this.updateFocusedSquare(row, col);
    }

    /**
     * Handles letter input and automatic navigation
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} value - Input value
     * @returns {boolean} True if input was valid
     */
    onLetterInput(row, col, value) {
        const upperValue = value.toUpperCase();
        if (/^[A-Za-zÅÄÖÆØåäöæø]$/i.test(upperValue)) {
            // The square has already updated its value and grid data
            // Just handle navigation logic here
            
            // Update last changed position when letter is actually entered
            this.lastChangedPosition = { row, col };
            
            // Move to next square
            const next = this.moveToNextSquare(row, col);
            if (next) {
                setTimeout(() => this.focusSquare(next.row, next.col), 10);
            }
            this.lastEnteredPosition = { row, col };
            return true;
        } else {
            // Invalid input - the square should have already cleared itself
            return false;
        }
    }

    /**
     * Resets focus to top-left square
     */
    resetFocus() {
        this.focusedSquare = { row: 0, col: 0 };
        this.updateFocusedSquare(0, 0);
    }

    /**
     * Gets current focus information
     * @returns {Object} Focus information
     */
    getFocusInfo() {
        return {
            row: this.focusedSquare.row,
            col: this.focusedSquare.col
        };
    }
}
