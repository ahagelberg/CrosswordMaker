/**
 * NavigationManager - Handles keyboard navigation and focus management
 */
class NavigationManager {
    constructor() {
        this.crossword = null; // Will be set by setCrossword()
        this.focusedSquare = { row: 0, col: 0 };
        this.entryDirection = 'horizontal';
        this.lastEnteredPosition = null;
        this.lastChangedPosition = null;
        // Listen for individual square events
        document.addEventListener('square:set-type', (e) => {
            const { row, col, type } = e.detail;
            if (this.crossword) this.crossword.setSquareType(row, col, type);
        });
        document.addEventListener('square:set-arrow', (e) => {
            const { row, col, arrow } = e.detail;
            if (this.crossword) this.crossword.setCellArrow(row, col, arrow);
        });
        document.addEventListener('square:set-color', (e) => {
            const { row, col, color } = e.detail;
            if (this.crossword) this.crossword.setCellColor(row, col, color);
        });
        // Listen for square:clicked event to handle focus/defocus
        document.addEventListener('square:clicked', (e) => {
            const { row, col } = e.detail;
            this.updateFocusedSquare(row, col);
            this.focusSquare(row, col);
        });
        // Add more square:??? event listeners as needed
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
     * Sets up a global keydown event handler to forward events to the currently focused square
     */
    setupGlobalKeydownHandler() {
        if (this._globalKeydownHandler) return; // Prevent multiple bindings
        this._globalKeydownHandler = (e) => {
            // Handle global shortcuts first
            if (this.handleGlobalShortcuts(e)) {
                return;
            }
            // Handle arrow key navigation
            if (this.handleGridNavigation(e)) {
                return;
            }
            // Forward to focused square if appropriate
            if (this.crossword && this.focusedSquare) {
                const { row, col } = this.focusedSquare;
                const square = this.crossword.getSquare(row, col);
                if (square && typeof square.handleKeydown === 'function') {
                    square.handleKeydown(e);
                }
            }
        };
        document.addEventListener('keydown', this._globalKeydownHandler, true);
    }

    /**
     * Removes the global keydown event handler
     */
    removeGlobalKeydownHandler() {
        if (this._globalKeydownHandler) {
            document.removeEventListener('keydown', this._globalKeydownHandler, true);
            this._globalKeydownHandler = null;
        }
    }

    /**
     * Sets up keyboard event listeners
     */
    setupEventListeners() {
        // Set up the global keydown handler for forwarding to focused square
        this.setupGlobalKeydownHandler();
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

        // Dispatch event to hide any open context menu when moving focus with arrow keys
        document.dispatchEvent(new CustomEvent('contextmenu:hide'));

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
        
        // Update the focused square tracking first
        this.updateFocusedSquare(row, col);
        
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
        if (!this.crossword) {
            console.warn('NavigationManager: crossword not set');
            return;
        }

        // Deselect the previously focused square
        if (this.focusedSquare) {
            const prev = this.crossword.getSquare(this.focusedSquare.row, this.focusedSquare.col);
            if (prev && typeof prev.deselect === 'function') {
                prev.deselect();
            }
        }

        // Select the current square using its select method
        const square = this.crossword.getSquare(row, col);
        if (square && typeof square.select === 'function') {
            square.select();
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

        if (this.entryDirection === 'vertical') {
            nextRow++;
            if (nextRow < this.crossword.rows) {
                const sq = this.crossword.getSquare(nextRow, nextCol);
                if (sq && sq.getSquareType && sq.getSquareType() === 'letter') {
                    return { row: nextRow, col: nextCol };
                }
            }
            // If not valid, try right
            nextRow = fromRow;
            nextCol++;
            if (nextCol < this.crossword.cols) {
                const sq = this.crossword.getSquare(nextRow, nextCol);
                if (sq && sq.getSquareType && sq.getSquareType() === 'letter') {
                    return { row: nextRow, col: nextCol };
                }
            }
        } else { // horizontal (default)
            nextCol++;
            if (nextCol < this.crossword.cols) {
                const sq = this.crossword.getSquare(nextRow, nextCol);
                if (sq && sq.getSquareType && sq.getSquareType() === 'letter') {
                    return { row: nextRow, col: nextCol };
                }
            }
            // If not valid, try below
            nextCol = fromCol;
            nextRow++;
            if (nextRow < this.crossword.rows) {
                const sq = this.crossword.getSquare(nextRow, nextCol);
                if (sq && sq.getSquareType && sq.getSquareType() === 'letter') {
                    return { row: nextRow, col: nextCol };
                }
            }
        }
        // No valid next square
        return null;
    }

    /**
     * Handles letter input and automatic navigation
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} value - Input value
     * @returns {boolean} True if input was valid
     */
    onLetterInput(row, col, value) {
        // Detect direction based on current position relative to last position
        this.detectDirection(row, col);
        // Update last changed position when letter is actually entered
        this.lastChangedPosition = { row, col };

        // Move to next square
        const next = this.moveToNextSquare(row, col);
        if (next) {
            // Only move if the next square is a letter square
            const nextSquare = this.crossword.getSquare(next.row, next.col);
            if (nextSquare && nextSquare.getSquareType && nextSquare.getSquareType() === 'letter') {
                this.focusSquare(next.row, next.col);
            }
        }
        this.lastEnteredPosition = { row, col };
        return true;
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
