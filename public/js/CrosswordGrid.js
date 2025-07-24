/**
 * CrosswordGrid - Manages the grid data structure and cell operations
 */
class CrosswordGrid {
    constructor(rows = 15, cols = 15) {
        this.rows = rows;
        this.cols = cols;
        this.grid = this.createEmptyGrid(rows, cols);
    }

    /**
     * Creates an empty grid with specified dimensions
     * @param {number} r - Number of rows
     * @param {number} c - Number of columns
     * @returns {Array<Array<Object>>} 2D array of cell objects
     */
    createEmptyGrid(r, c) {
        return Array.from({ length: r }, () =>
            Array.from({ length: c }, () => ({ 
                type: 'letter', 
                value: '', 
                arrow: null,
                borders: { top: false, bottom: false, left: false, right: false },
                color: null,
                imageClue: null
            }))
        );
    }

    /**
     * Resizes the grid to new dimensions, preserving existing content
     * @param {number} newRows - New number of rows
     * @param {number} newCols - New number of columns
     */
    resize(newRows, newCols) {
        const oldGrid = this.grid;
        const oldRows = this.rows;
        const oldCols = this.cols;
        
        // Create new grid with new dimensions
        this.grid = this.createEmptyGrid(newRows, newCols);
        
        // Copy existing content to the new grid (preserve what fits)
        for (let r = 0; r < Math.min(oldRows, newRows); r++) {
            for (let c = 0; c < Math.min(oldCols, newCols); c++) {
                this.grid[r][c] = { ...oldGrid[r][c] };
            }
        }
        
        this.rows = newRows;
        this.cols = newCols;
    }

    /**
     * Gets a cell at the specified position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {Object|null} Cell object or null if out of bounds
     */
    getCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.grid[row][col];
        }
        return null;
    }

    /**
     * Sets a cell at the specified position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {Object} cellData - Cell data to set
     */
    setCell(row, col, cellData) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = { ...this.grid[row][col], ...cellData };
        }
    }

    /**
     * Updates cell value
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} value - New value
     */
    setCellValue(row, col, value) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.value = value;
        }
    }

    /**
     * Changes cell type (letter, clue, black)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} type - New cell type
     */
    setCellType(row, col, type) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.type = type;
            
            // Reset type-specific properties
            if (type === 'letter') {
                cell.value = '';
                cell.split = false;
                cell.value1 = '';
                cell.value2 = '';
                if (cell.arrow === undefined) cell.arrow = null;
                if (cell.borders === undefined) {
                    cell.borders = { top: false, bottom: false, left: false, right: false };
                }
                if (cell.color === undefined) cell.color = null;
            } else if (type === 'clue') {
                cell.value = '';
                cell.arrow = null;
            } else if (type === 'black') {
                cell.value = '';
                cell.arrow = null;
                cell.borders = { top: false, bottom: false, left: false, right: false };
            }
        }
    }

    /**
     * Sets arrow for a cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string|null} arrow - Arrow type or null
     */
    setCellArrow(row, col, arrow) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.arrow = arrow;
        }
    }

    /**
     * Sets border for a cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} side - Border side (top, bottom, left, right)
     * @param {boolean} enabled - Whether border is enabled
     */
    setCellBorder(row, col, side, enabled) {
        const cell = this.getCell(row, col);
        if (cell) {
            if (!cell.borders) {
                cell.borders = { top: false, bottom: false, left: false, right: false };
            }
            cell.borders[side] = enabled;
        }
    }

    /**
     * Sets color for a cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string|null} color - Color value or null
     */
    setCellColor(row, col, color) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.color = color;
        }
    }

    /**
     * Splits a clue cell horizontally
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    splitClueCell(row, col) {
        const cell = this.getCell(row, col);
        if (cell && cell.type === 'clue') {
            cell.split = true;
            cell.value1 = cell.value || '';
            cell.value2 = '';
        }
    }

    /**
     * Unsplits a clue cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    unsplitClueCell(row, col) {
        const cell = this.getCell(row, col);
        if (cell && cell.type === 'clue' && cell.split) {
            const combinedValue = [cell.value1 || '', cell.value2 || ''].filter(v => v.trim()).join(' ');
            cell.split = false;
            cell.value = combinedValue;
            cell.value1 = '';
            cell.value2 = '';
        }
    }

    /**
     * Places an image clue on multiple squares
     * @param {number} startRow - Starting row
     * @param {number} startCol - Starting column
     * @param {number} endRow - Ending row
     * @param {number} endCol - Ending column
     * @param {string} imageData - Base64 image data
     */
    placeImageClue(startRow, startCol, endRow, endCol, imageData) {
        const imageClue = {
            imageData: imageData,
            startRow: startRow,
            startCol: startCol,
            endRow: endRow,
            endCol: endCol
        };

        // Mark all squares in the area as having this image clue
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const cell = this.getCell(r, c);
                if (cell) {
                    cell.imageClue = imageClue;
                    cell.type = 'letter'; // Keep as letter type but with image overlay
                    cell.value = ''; // Clear any existing value
                }
            }
        }
    }

    /**
     * Removes an image clue from squares
     * @param {number} row - Row of any square in the image area
     * @param {number} col - Column of any square in the image area
     */
    removeImageClue(row, col) {
        const cell = this.getCell(row, col);
        if (cell && cell.imageClue) {
            const imageClue = cell.imageClue;
            
            // Remove image clue from all squares in the area
            for (let r = imageClue.startRow; r <= imageClue.endRow; r++) {
                for (let c = imageClue.startCol; c <= imageClue.endCol; c++) {
                    const targetCell = this.getCell(r, c);
                    if (targetCell) {
                        targetCell.imageClue = null;
                    }
                }
            }
        }
    }

    /**
     * Checks if an area conflicts with existing image clues
     * @param {number} startRow - Starting row
     * @param {number} startCol - Starting column
     * @param {number} endRow - Ending row
     * @param {number} endCol - Ending column
     * @returns {boolean} True if there's a conflict
     */
    checkImageConflict(startRow, startCol, endRow, endCol) {
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const cell = this.getCell(r, c);
                if (cell && cell.imageClue) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Ensures backward compatibility by adding missing properties to existing cells
     */
    ensureBackwardCompatibility() {
        this.grid.forEach(row => {
            row.forEach(cell => {
                if (cell.arrow === undefined) {
                    cell.arrow = null;
                }
                if (cell.borders === undefined) {
                    cell.borders = { top: false, bottom: false, left: false, right: false };
                }
                if (cell.color === undefined) {
                    cell.color = null;
                }
                if (cell.imageClue === undefined) {
                    cell.imageClue = null;
                }
            });
        });
    }

    /**
     * Exports grid data for saving
     * @returns {Object} Grid data object
     */
    export() {
        return {
            rows: this.rows,
            cols: this.cols,
            grid: this.grid
        };
    }

    /**
     * Imports grid data from saved puzzle
     * @param {Object} data - Grid data object
     */
    import(data) {
        this.rows = data.rows;
        this.cols = data.cols;
        this.grid = data.grid;
        this.ensureBackwardCompatibility();
    }
}
