/**
 * Crossword - Main crossword management class
 * Handles grid creation, square management, rendering, and coordination of all managers
 */
class Crossword {
    constructor(container, rows = 15, cols = 15) {
        console.log(`Creating Crossword with ${rows}x${cols} grid`);
        
        this.container = container;
        this.rows = rows;
        this.cols = cols;
        
        // Grid data storage
        this.grid = [];
        this.squareObjects = [];
        
        // Managers
        this.wordManager = null;
        this.navigationManager = null;
        this.puzzleManager = null;
        this.contextMenu = null;
        
        // State
        this.currentLanguage = 'sv';
        this.highlightedWord = null;
        
        // Initialize grid data
        this.initializeGrid();
        
        console.log('Crossword created, grid initialized');
    }
    
    /**
     * Initialize the grid data structure
     */
    initializeGrid() {
        console.log('Initializing grid data structure');
        this.grid = Array.from({ length: this.rows }, (_, row) =>
            Array.from({ length: this.cols }, (_, col) => ({
                type: 'letter',
                value: '',
                borders: { top: false, bottom: false, left: false, right: false },
                color: null,
                // Letter square properties
                arrow: null,
                // Clue square properties
                value1: '',
                value2: '',
                split: false,
                imageClue: null
            }))
        );
        
        // Initialize square objects array
        this.squareObjects = Array.from({ length: this.rows }, () =>
            Array.from({ length: this.cols }, () => null)
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
    }
    
    /**
     * Get cell data at specified position
     */
    getCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.grid[row][col];
        }
        return null;
    }
    
    /**
     * Set cell data at specified position
     */
    setCell(row, col, data) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            Object.assign(this.grid[row][col], data);
            // Update square display if it exists
            this.updateSquareDisplay(row, col);
        }
    }
    
    /**
     * Set cell type at specified position (with square recreation)
     */
    setCellType(row, col, type) {
        console.log(`Setting cell type at (${row}, ${col}) to ${type}`);
        const cell = this.getCell(row, col);
        if (cell && cell.type !== type) {
            this.setSquareType(row, col, type);
        }
    }
    
    /**
     * Set cell arrow at specified position
     */
    setCellArrow(row, col, arrow) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.arrow = arrow;
            this.updateSquareDisplay(row, col);
        }
    }
    
    /**
     * Set cell color at specified position
     */
    setCellColor(row, col, color) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.color = color;
            this.updateSquareDisplay(row, col);
        }
    }
    
    /**
     * Split a clue cell horizontally
     */
    splitClueCell(row, col) {
        const cell = this.getCell(row, col);
        if (cell && cell.type === 'clue') {
            cell.split = true;
            cell.value1 = cell.value || '';
            cell.value2 = '';
            this.updateSquareDisplay(row, col);
        }
    }
    
    /**
     * Unsplit a clue cell
     */
    unsplitClueCell(row, col) {
        const cell = this.getCell(row, col);
        if (cell && cell.type === 'clue' && cell.split) {
            const combinedValue = [cell.value1 || '', cell.value2 || '']
                .filter(v => v.trim())
                .join(' ');
            cell.split = false;
            cell.value = combinedValue;
            cell.value1 = '';
            cell.value2 = '';
            this.updateSquareDisplay(row, col);
        }
    }
    
    /**
     * Remove image clue from cell
     */
    removeImageClue(row, col) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.imageClue = null;
            this.updateSquareDisplay(row, col);
        }
    }
    
    /**
     * Set border for a cell
     */
    setCellBorder(row, col, side, enabled) {
        const cell = this.getCell(row, col);
        if (cell) {
            if (!cell.borders) {
                cell.borders = { top: false, bottom: false, left: false, right: false };
            }
            cell.borders[side] = enabled;
            this.updateSquareDisplay(row, col);
        }
    }
    
    /**
     * Check if there's an image conflict in the specified range
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
     * Get square object at specified position
     */
    getSquareAt(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.squareObjects[row][col];
        }
        return null;
    }
    
    /**
     * Create appropriate square object based on type
     */
    createSquareByType(row, col, type) {
        console.log(`Creating ${type} square at (${row}, ${col})`);
        let square;
        switch (type) {
            case 'letter':
                square = new LetterSquare(row, col, this, this.navigationManager);
                break;
            case 'clue':
                square = new ClueSquare(row, col, this, this.navigationManager);
                break;
            case 'black':
                square = new BlackSquare(row, col, this, this.navigationManager);
                break;
            default:
                square = new LetterSquare(row, col, this, this.navigationManager);
        }
        return square;
    }
    
    /**
     * Render the entire crossword grid
     */
    render() {
        console.log('Rendering crossword grid');
        
        // Clear container
        this.container.innerHTML = '';
        
        // Clean up existing square objects
        this.squareObjects.forEach(row => {
            row.forEach(squareObj => {
                if (squareObj) {
                    squareObj.destroy();
                }
            });
        });
        
        // Reset square objects array
        this.squareObjects = Array.from({ length: this.rows }, () =>
            Array.from({ length: this.cols }, () => null)
        );
        
        // Create grid container
        const gridEl = document.createElement('div');
        gridEl.className = 'crossword-grid';
        gridEl.style.gridTemplateRows = `repeat(${this.rows}, 50px)`;
        gridEl.style.gridTemplateColumns = `repeat(${this.cols}, 50px)`;
        
        // Create all square objects and their DOM elements first
        console.log('Creating square objects and DOM elements...');
        this.grid.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                // Create square object
                const squareObj = this.createSquareByType(rIdx, cIdx, cell.type || 'letter');
                
                // Create DOM element (but don't set up event listeners yet)
                const element = squareObj.createElement();
                
                // Add edge classes for border management
                if (cIdx === this.cols - 1) {
                    element.classList.add('last-column');
                }
                if (rIdx === this.rows - 1) {
                    element.classList.add('last-row');
                }
                
                // Store square object reference
                this.squareObjects[rIdx][cIdx] = squareObj;
                
                // Append to grid
                gridEl.appendChild(element);
            });
        });
        
        // Add grid to container
        this.container.appendChild(gridEl);
        
        // NOW set up event listeners after all elements are in the DOM
        console.log('Setting up event listeners after DOM insertion...');
        this.squareObjects.forEach((row, rIdx) => {
            row.forEach((squareObj, cIdx) => {
                if (squareObj) {
                    squareObj.setupEventListeners();
                }
            });
        });
        
        console.log('Crossword render complete');
    }
    
    /**
     * Update display of a specific square
     */
    updateSquareDisplay(row, col) {
        const squareObj = this.getSquareAt(row, col);
        if (squareObj) {
            squareObj.loadFromGridData();
            squareObj.updateDisplay();
        }
    }
    
    /**
     * Change the type of a square (destroys and recreates)
     */
    setSquareType(row, col, type) {
        console.log(`Changing square type at (${row}, ${col}) to ${type}`);
        
        const oldSquareObj = this.squareObjects[row][col];
        if (!oldSquareObj) return;
        
        // Update grid data
        const cell = this.getCell(row, col);
        if (cell) {
            cell.type = type;
        }
        
        // Get reference to old element for replacement
        const oldElement = oldSquareObj.element;
        const parentNode = oldElement.parentNode;
        
        // Destroy old square
        oldSquareObj.destroy();
        
        // Create new square object
        const newSquareObj = this.createSquareByType(row, col, type);
        
        // Create new DOM element
        const newElement = newSquareObj.createElement();
        
        // Add edge classes
        if (col === this.cols - 1) {
            newElement.classList.add('last-column');
        }
        if (row === this.rows - 1) {
            newElement.classList.add('last-row');
        }
        
        // Replace in DOM
        if (parentNode) {
            parentNode.replaceChild(newElement, oldElement);
        }
        
        // Store new square object
        this.squareObjects[row][col] = newSquareObj;
        
        // Set up event listeners now that element is in DOM
        newSquareObj.setupEventListeners();
        
        console.log(`Square type changed successfully at (${row}, ${col})`);
    }
    
    /**
     * Highlight a word in the grid
     */
    highlightWord(word) {
        console.log('Highlighting word:', word);
        
        // Clear previous highlighting
        this.clearWordHighlight();
        
        if (word) {
            this.highlightedWord = word;
            word.squares.forEach((square, index) => {
                const squareObj = this.getSquareAt(square.row, square.col);
                if (squareObj && squareObj.element) {
                    squareObj.element.classList.add('word-highlighted');
                }
            });
        }
    }
    
    /**
     * Clear word highlighting
     */
    clearWordHighlight() {
        this.squareObjects.forEach(row => {
            row.forEach(squareObj => {
                if (squareObj && squareObj.element) {
                    squareObj.element.classList.remove('word-highlighted');
                }
            });
        });
        this.highlightedWord = null;
    }
    
    /**
     * Update all square displays
     */
    updateAllSquares() {
        console.log('Updating all squares');
        this.squareObjects.forEach((row, rIdx) => {
            row.forEach((squareObj, cIdx) => {
                if (squareObj) {
                    squareObj.loadFromGridData();
                    squareObj.updateDisplay();
                }
            });
        });
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
            // Update dimensions if needed
            this.rows = data.grid.length;
            this.cols = data.grid[0] ? data.grid[0].length : this.cols;
            
            // Load grid data
            this.grid = data.grid.map(row => row.map(cell => ({
                type: cell.type || 'letter',
                value: cell.value || '',
                borders: cell.borders || { top: false, bottom: false, left: false, right: false },
                color: cell.color || null,
                arrow: cell.arrow || null,
                value1: cell.value1 || '',
                value2: cell.value2 || '',
                split: cell.split || false,
                imageClue: cell.imageClue || null
            })));
            
            // Re-render with new data
            this.render();
            
            // After rendering, make sure all squares display their loaded data
            this.squareObjects.forEach((row, rIdx) => {
                row.forEach((squareObj, cIdx) => {
                    if (squareObj) {
                        squareObj.updateDisplay();
                    }
                });
            });
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
            grid: this.grid.map(row => row.map(cell => ({ ...cell })))
        };
    }
    
    /**
     * Destroy the crossword and clean up
     */
    destroy() {
        console.log('Destroying crossword');
        
        // Clean up square objects
        this.squareObjects.forEach(row => {
            row.forEach(squareObj => {
                if (squareObj) {
                    squareObj.destroy();
                }
            });
        });
        
        // Clear container
        this.container.innerHTML = '';
        
        // Clear references
        this.squareObjects = [];
        this.grid = [];
    }
}
