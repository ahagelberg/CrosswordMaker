/**
 * Crossword - Main crossword management class
 * Handles grid creation, square management, rendering, and coordination of all managers
 */
class Crossword {

    /**
     * Constructor for the Crossword class
     * @param {HTMLElement} container - The container element to render the crossword into
     * @param {number} rows - The number of rows in the crossword grid
     * @param {number} cols - The number of columns in the crossword grid
     */
    constructor(container, rows = 15, cols = 15) {
        console.log(`Creating Crossword with ${rows}x${cols} grid`);
        
        this.container = container;
        this.rows = rows;
        this.cols = cols;
        
        // Grid of square objects
        this.grid = [];
        
        // Managers
        this.wordManager = null;
        this.navigationManager = null;
        this.puzzleManager = null;
        this.contextMenu = null;
        
        // State
        this.currentLanguage = 'sv';
        this.highlightedWord = null;
        
        // Initialize grid of square objects
        this.initializeGrid();
        
        console.log('Crossword created, grid initialized');

        // Listen for square:change-type events
        document.addEventListener('square:change-type', (e) => {
            const { square, type, orientation, data } = e.detail || {};
            if (square instanceof Square && typeof type === 'string') {
                this.changeSquareType(square, type, orientation, data);
            }
        });
    }
    
    /**
     * Initialize the grid of square objects
     */
    initializeGrid() {
        console.log('Initializing grid of square objects');
        this.grid = Array.from({ length: this.rows }, (_, row) =>
            Array.from({ length: this.cols }, (_, col) =>
                new LetterSquare(row, col, this, this.navigationManager)
            )
        );
    }
    
    /**
     * Set up all managers that work with the crossword
     */
    setupManagers(wordManager, navigationManager, puzzleManager, contextMenu) {
        console.log('Setting up managers');
        this.wordManager = wordManager;
        this.navigationManager = navigationManager;
        this.puzzleManager = puzzleManager;
        this.contextMenu = contextMenu;

        // Give managers access to this crossword instance
        if (this.navigationManager && typeof this.navigationManager.setCrossword === 'function') {
            this.navigationManager.setCrossword(this);
        }
        if (this.wordManager && typeof this.wordManager.setCrossword === 'function') {
            this.wordManager.setCrossword(this);
        }
        if (this.contextMenu && typeof this.contextMenu.setCrossword === 'function') {
            this.contextMenu.setCrossword(this);
        }

        // Update all squares in the grid to have the correct navigationManager
        this.grid.forEach(row => {
            row.forEach(square => {
                square.navigationManager = this.navigationManager;
            });
        });
    }
    
    /**
     * Get cell data at specified position
     */
    getSquare(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.grid[row][col];
        }
        return null;
    }
    
    /**
     * Set cell type at specified position (with square recreation)
     */
    setCellType(row, col, type) {
        console.log(`Setting cell type at (${row}, ${col}) to ${type}`);
        const square = this.getSquare(row, col);
        if (square && square.getSquareType() !== type) {
            this.setSquareType(row, col, type);
        }
    }
    
    /**
     * Create appropriate square object based on type
     */
    createSquareByType(row, col, type, orientation = 'horizontal') {
        switch (type) {
            case 'letter':
            default:
                return new LetterSquare(row, col, this.navigationManager);
            case 'clue':
                return new ClueSquare(row, col, this.navigationManager);
            case 'black':
                return new BlackSquare(row, col, this.navigationManager);
            case 'split':
                return new SplitCell(row, col, this.navigationManager, orientation);
        }
    }

    changeSquareType(square, type, orientation = 'horizontal', data = null) {
        console.log(`Changing square type at (${square.row}, ${square.col}) to ${type}`);
        if (!square || !this.grid[square.row] || !this.grid[square.row][square.col]) {
            console.warn('Invalid square for type change:', square);
            return;
        }
        
        // Remove old square from grid and DOM
        const oldSquare = this.grid[square.row][square.col];
        const oldElement = oldSquare && oldSquare.element;
        const parentNode = oldElement ? oldElement.parentNode : null;

        // Create new square of specified type
        const newSquare = this.createSquareByType(square.row, square.col, type, orientation);
        this.grid[square.row][square.col] = newSquare;

        // Apply data from unsplit if provided
        if (data) {
            if (data.value !== undefined && newSquare.setValue) {
                newSquare.setValue(data.value);
            }
            if (data.text !== undefined && newSquare.setText) {
                newSquare.setText(data.text);
            }
            if (data.arrow !== undefined && newSquare.setArrow) {
                newSquare.setArrow(data.arrow);
            }
            if (data.borders && newSquare.borders) {
                newSquare.borders = { ...data.borders };
            }
            if (data.color !== undefined && newSquare.setColor) {
                newSquare.setColor(data.color);
            }
        }

        // Create new DOM element
        const newElement = newSquare.createElement();
        if (square.col === this.cols - 1) newElement.classList.add('last-column');
        if (square.row === this.rows - 1) newElement.classList.add('last-row');

        // Replace in DOM only if oldElement is still a child of parentNode
        if (parentNode && oldElement && parentNode.contains(oldElement)) {
            parentNode.replaceChild(newElement, oldElement);
        }

        // Destroy old square after DOM replacement
        oldSquare && oldSquare.destroy && oldSquare.destroy();

        // Set up event listeners
        newSquare.setupEventListeners && newSquare.setupEventListeners();

        // Render the new square
        newSquare.render && newSquare.render();
        console.log(`Square type changed successfully at (${square.row}, ${square.col})`);
    }

    /**
     * Render the entire crossword grid
     */
    render() {
        console.log('Rendering crossword grid');
        // Clear container
        this.container.innerHTML = '';
        // Clean up existing squares
        this.grid.forEach(row => row.forEach(square => square.destroy && square.destroy()));
        // Recreate grid of square objects if needed
        if (this.grid.length !== this.rows || this.grid[0].length !== this.cols) {
            this.initializeGrid();
        }
        // Create grid container
        const gridEl = document.createElement('div');
        gridEl.className = 'crossword-grid';
        gridEl.style.gridTemplateRows = `repeat(${this.rows}, 50px)`;
        gridEl.style.gridTemplateColumns = `repeat(${this.cols}, 50px)`;
        // Add grid to container
        this.container.appendChild(gridEl);
        // Create all square DOM elements
        this.grid.forEach((row, rIdx) => {
            row.forEach((square, cIdx) => {
                const element = square.createElement();
                if (cIdx === this.cols - 1) element.classList.add('last-column');
                if (rIdx === this.rows - 1) element.classList.add('last-row');
                gridEl.appendChild(element);
                square.render();
            });
        });
        console.log('Crossword render complete');

    }

    /**
     * Set language for the crossword
     */
    setLanguage(language) {
        console.log('Setting language to:', language);
        this.currentLanguage = language;
    }
    
    /**
     * Load crossword data from JSON
     */
    loadFromData(data) {
        console.log('Loading crossword from data');
        if (data.grid && Array.isArray(data.grid)) {
            this.rows = data.grid.length;
            this.cols = data.grid[0] ? data.grid[0].length : this.cols;
            this.grid = data.grid.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                    const square = this.createSquareByType(rIdx, cIdx, cell.type || 'letter', cell.orientation);
                    
                    // For split cells, use their import method
                    if (cell.type === 'split' && typeof square.importData === 'function') {
                        square.importData(cell);
                    } else {
                        // For regular squares, restore properties if present
                        if (cell.value !== undefined && square.setValue) square.setValue(cell.value);
                        if (cell.arrow !== undefined && square.setArrow) square.setArrow(cell.arrow);
                        if (cell.borders && square.borders) square.borders = { ...cell.borders };
                        if (cell.color !== undefined && square.setColor) square.setColor(cell.color);
                        if (cell.imageClue !== undefined && square.setImageClue) square.setImageClue(cell.imageClue);
                    }
                    // Add more as needed for other square types
                    return square;
                })
            );
            this.render();
        }
    }
    
    /**
     * Export crossword data to JSON
     */
    exportData() {
        console.log('Exporting crossword data');
        return {
            rows: this.rows,
            cols: this.cols,
            grid: this.grid.map(row => row.map(square => {
                // Extract properties from square objects
                const data = { type: square.getSquareType() };
                
                // For split cells, use their export method
                if (square.getSquareType() === 'split' && typeof square.exportData === 'function') {
                    return square.exportData();
                }
                
                // For regular squares
                if (square.getValue) data.value = square.getValue();
                if (square.arrow !== undefined) data.arrow = square.arrow;
                if (square.borders) data.borders = { ...square.borders };
                if (square.color !== undefined) data.color = square.color;
                if (square.imageClue !== undefined) data.imageClue = square.imageClue;
                // Add more as needed for other square types
                return data;
            }))
        };
    }
    
    /**
     * Creates a split cell at the specified position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} orientation - 'horizontal' or 'vertical'
     */
    createSplitCell(row, col, orientation = 'horizontal') {
        console.log(`Creating split cell at (${row}, ${col}) with orientation ${orientation}`);
        const square = this.getSquare(row, col);
        if (square) {
            this.changeSquareType(square, 'split', orientation);
        }
    }

    /**
     * Changes the type of a subcell in a split cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} subcellIndex - Index of the subcell (0 or 1)
     * @param {string} type - New type for the subcell
     */
    setSubcellType(row, col, subcellIndex, type) {
        const square = this.getSquare(row, col);
        if (square && square.getSquareType() === 'split') {
            square.setSubcellType(subcellIndex, type);
        }
    }

    /**
     * Gets a subcell from a split cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} subcellIndex - Index of the subcell (0 or 1)
     * @returns {Object|null} The subcell object or null
     */
    getSubcell(row, col, subcellIndex) {
        const square = this.getSquare(row, col);
        if (square && square.getSquareType() === 'split') {
            return square.getSubcell(subcellIndex);
        }
        return null;
    }

    /**
     * Gets the letter subcell from a split cell (for word selection)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {Object|null} The letter subcell or null
     */
    getLetterSubcellFromSplit(row, col) {
        const square = this.getSquare(row, col);
        if (square && square.getSquareType() === 'split') {
            return square.getLetterSubcell();
        }
        return null;
    }
    
    /**
     * Destroy the crossword and clean up
     */
    destroy() {
        console.log('Destroying crossword');
        // Clean up square objects
        if (this.grid) {
            this.grid.forEach(row => {
                row.forEach(squareObj => {
                    if (squareObj) {
                        squareObj.destroy();
                    }
                });
            });
        }
        // Clear container
        this.container.innerHTML = '';
        // Clear references
        this.grid = [];
    }
}
