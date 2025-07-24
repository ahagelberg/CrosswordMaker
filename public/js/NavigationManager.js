/**
 * NavigationManager - Handles keyboard navigation and focus management
 */
class NavigationManager {
    constructor(crosswordGrid) {
        this.crosswordGrid = crosswordGrid;
        this.focusedSquare = { row: 0, col: 0 };
        this.focusedSubSquare = null;
        this.entryDirection = 'horizontal';
        this.lastEnteredPosition = null;
        this.lastChangedPosition = null;
        
        this.setupEventListeners();
    }

    /**
     * Sets up keyboard event listeners
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    /**
     * Handles keyboard events for arrow key navigation and shortcuts
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleKeyDown(e) {
        // Handle Ctrl+S for saving
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            // Dispatch custom event for save
            document.dispatchEvent(new CustomEvent('crossword:save'));
            return;
        }
        
        if (e.target.closest('.crossword-grid')) {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.moveArrowKeys('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.moveArrowKeys('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.moveArrowKeys('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.moveArrowKeys('right');
                    break;
            }
        }
    }

    /**
     * Handles arrow key navigation within the grid
     * @param {string} direction - Direction to move ('up', 'down', 'left', 'right')
     */
    moveArrowKeys(direction) {
        let newRow = this.focusedSquare.row;
        let newCol = this.focusedSquare.col;
        let newSubSquare = this.focusedSubSquare;
        
        // Check if we're in a split clue square
        const currentCell = this.crosswordGrid.getCell(this.focusedSquare.row, this.focusedSquare.col);
        const isInSplitClue = currentCell && currentCell.type === 'clue' && currentCell.split;
        
        if (isInSplitClue && (direction === 'up' || direction === 'down')) {
            // Handle navigation within split clue
            if (direction === 'up' && this.focusedSubSquare === 'second') {
                // Move from second to first textarea
                newSubSquare = 'first';
                this.updateFocusedSquare(newRow, newCol, newSubSquare);
                setTimeout(() => this.focusSquare(newRow, newCol, newSubSquare), 10);
                return;
            } else if (direction === 'down' && (this.focusedSubSquare === 'first' || this.focusedSubSquare === null)) {
                // Move from first to second textarea
                newSubSquare = 'second';
                this.updateFocusedSquare(newRow, newCol, newSubSquare);
                setTimeout(() => this.focusSquare(newRow, newCol, newSubSquare), 10);
                return;
            }
        }
        
        // Normal navigation to other squares
        switch (direction) {
            case 'up':
                newRow = Math.max(0, newRow - 1);
                break;
            case 'down':
                newRow = Math.min(this.crosswordGrid.rows - 1, newRow + 1);
                break;
            case 'left':
                newCol = Math.max(0, newCol - 1);
                break;
            case 'right':
                newCol = Math.min(this.crosswordGrid.cols - 1, newCol + 1);
                break;
        }
        
        // Reset sub-square when moving to a different square
        newSubSquare = null;
        
        this.updateFocusedSquare(newRow, newCol, newSubSquare);
        setTimeout(() => this.focusSquare(newRow, newCol, newSubSquare), 10);
    }

    /**
     * Focuses a specific square in the grid and handles different square types
     * @param {number} row - Row index of the square to focus
     * @param {number} col - Column index of the square to focus
     * @param {string|null} [subSquare=null] - For split clue squares, which sub-square to focus ('first' or 'second')
     */
    focusSquare(row, col, subSquare = null) {
        const squares = document.querySelectorAll('.square');
        const index = row * this.crosswordGrid.cols + col;
        const square = squares[index];
        
        if (square) {
            const input = square.querySelector('input');
            const textareas = square.querySelectorAll('textarea');
            
            if (input) {
                // For letter squares, select all text so it can be overwritten
                input.focus();
                input.select();
            } else if (textareas.length > 1) {
                // For split clue squares, focus the specified sub-square
                const targetTextarea = subSquare === 'second' ? textareas[1] : textareas[0];
                targetTextarea.focus();
                // Move cursor to end of text
                const length = targetTextarea.value.length;
                targetTextarea.setSelectionRange(length, length);
            } else if (textareas.length === 1) {
                // For single clue squares, focus and position cursor at the end
                textareas[0].focus();
                // Move cursor to end of text
                const length = textareas[0].value.length;
                textareas[0].setSelectionRange(length, length);
            }
        }
    }

    /**
     * Updates the visual focus state of squares and tracks the currently focused square
     * @param {number} row - Row index of the square to focus
     * @param {number} col - Column index of the square to focus
     * @param {string|null} [subSquare=null] - For split clue squares, which sub-square is focused
     */
    updateFocusedSquare(row, col, subSquare = null) {
        // Remove focused class from all squares
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('focused');
        });
        
        // Add focused class to the current square
        const squares = document.querySelectorAll('.square');
        const index = row * this.crosswordGrid.cols + col;
        if (squares[index]) {
            squares[index].classList.add('focused');
            this.focusedSquare = { row, col };
            this.focusedSubSquare = subSquare;
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
        let nextRow = fromRow;
        let nextCol = fromCol;
        
        if (this.entryDirection === 'horizontal') {
            nextCol++;
            if (nextCol >= this.crosswordGrid.cols || 
                this.crosswordGrid.getCell(nextRow, nextCol)?.type !== 'letter' || 
                this.crosswordGrid.getCell(nextRow, nextCol)?.value !== '') {
                // Can't move horizontally, try vertical
                nextCol = fromCol;
                nextRow++;
                if (nextRow >= this.crosswordGrid.rows || 
                    this.crosswordGrid.getCell(nextRow, nextCol)?.type !== 'letter') {
                    return null; // No valid next square
                }
            }
        } else { // vertical
            nextRow++;
            if (nextRow >= this.crosswordGrid.rows || 
                this.crosswordGrid.getCell(nextRow, nextCol)?.type !== 'letter' || 
                this.crosswordGrid.getCell(nextRow, nextCol)?.value !== '') {
                // Can't move vertically, try horizontal
                nextRow = fromRow;
                nextCol++;
                if (nextCol >= this.crosswordGrid.cols || 
                    this.crosswordGrid.getCell(nextRow, nextCol)?.type !== 'letter') {
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
     * @param {string|null} subSquare - Sub-square identifier for split clues
     */
    onInputFocus(row, col, subSquare = null) {
        this.detectDirection(row, col);
        this.lastEnteredPosition = { row, col };
        this.updateFocusedSquare(row, col, subSquare);
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
        if (/^[A-ZÅÄÖ]$/i.test(upperValue)) {
            this.crosswordGrid.setCellValue(row, col, upperValue);
            
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
            this.crosswordGrid.setCellValue(row, col, '');
            return false;
        }
    }

    /**
     * Resets focus to top-left square
     */
    resetFocus() {
        this.focusedSquare = { row: 0, col: 0 };
        this.focusedSubSquare = null;
        this.updateFocusedSquare(0, 0, null);
    }

    /**
     * Gets current focus information
     * @returns {Object} Focus information
     */
    getFocusInfo() {
        return {
            row: this.focusedSquare.row,
            col: this.focusedSquare.col,
            subSquare: this.focusedSubSquare
        };
    }
}
