/**
    constructor(crosswordGrid, navigationManager) {
        this.crosswordGrid = crosswordGrid;
        this.navigationManager = navigationManager;
        this.container = document.getElementById('crossword-container');
        this.currentLanguage = 'sv';
        this.highlightedWord = null;
        this.squareObjects = []; // Array of Square objects
        
        // Give NavigationManager access to our square objects (if method exists)
        if (this.navigationManager && typeof this.navigationManager.setRenderer === 'function') {
            this.navigationManager.setRenderer(this);
        }
    }wordRenderer - Handles rendering the grid to the DOM using Square objects
 */
class CrosswordRenderer {
    constructor(crosswordGrid, navigationManager) {
        this.crosswordGrid = crosswordGrid;
        this.navigationManager = navigationManager;
        this.container = document.getElementById('crossword-container');
        this.currentLanguage = 'sv';
        this.highlightedWord = null;
        this.squareObjects = []; // Store square object references
    }

    /**
     * Sets the current language for textareas
     * @param {string} language - Language code
     */
    setLanguage(language) {
        this.currentLanguage = language;
    }

    /**
     * Highlights a word in the grid
     * @param {Object|null} word - Word object to highlight, or null to clear
     */
    highlightWord(word) {
        console.debug('🎨 CrosswordRenderer.highlightWord called with:', word ? `${word.id} (${word.direction}, ${word.squares.length} squares)` : 'null');
        
        // Clear previous highlighting
        this.clearWordHighlight();
        
        if (word) {
            this.highlightedWord = word;
            console.debug('🔍 Processing squares for highlighting:', word.squares);
            word.squares.forEach((square, index) => {
                const squareObj = this.getSquareAt(square.row, square.col);
                console.debug(`🔍 Square ${index + 1}/${word.squares.length} at (${square.row}, ${square.col}):`, squareObj ? 'found' : 'NOT FOUND');
                if (squareObj && squareObj.element) {
                    console.debug(`✅ Adding word-highlighted class to square at (${square.row}, ${square.col})`);
                    squareObj.element.classList.add('word-highlighted');
                } else {
                    console.warn(`❌ No square object or element found at: (${square.row}, ${square.col})`);
                }
            });
            console.debug('🎨 Word highlighting complete!');
        } else {
            console.debug('🧹 Clearing word highlighting (word is null)');
        }
    }

    /**
     * Clears word highlighting
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
     * Renders the crossword grid using Square objects
     */
    /**
     * Creates appropriate square object based on type
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} type - Square type ('letter', 'clue', 'black')
     * @returns {Square} Square object
     */
    createSquareByType(row, col, type) {
        console.debug('🏭 CrosswordRenderer creating square at', row, col, 'type:', type);
        console.debug('🔍 Available classes:', {
            Square: typeof Square,
            LetterSquare: typeof LetterSquare,
            ClueSquare: typeof ClueSquare,
            BlackSquare: typeof BlackSquare
        });
        let square;
        switch (type) {
            case 'letter':
                square = new LetterSquare(row, col, this.crosswordGrid, this.navigationManager);
                break;
            case 'clue':
                square = new ClueSquare(row, col, this.crosswordGrid, this.navigationManager);
                break;
            case 'black':
                square = new BlackSquare(row, col, this.crosswordGrid, this.navigationManager);
                break;
            default:
                console.debug('🔄 Unknown type, defaulting to LetterSquare');
                square = new LetterSquare(row, col, this.crosswordGrid, this.navigationManager);
        }
        console.debug('✅ Square created:', square.getSquareType(), 'at', row, col);
        return square;
    }

    render() {
        console.debug('🎨 CrosswordRenderer.render() called');
        this.container.innerHTML = '';
        
        // Clean up existing square objects
        this.squareObjects.forEach(row => {
            row.forEach(squareObj => {
                if (squareObj) {
                    squareObj.destroy();
                }
            });
        });
        
        // Initialize square objects array
        this.squareObjects = Array.from({ length: this.crosswordGrid.rows }, () =>
            Array.from({ length: this.crosswordGrid.cols }, () => null)
        );
        
        const gridEl = document.createElement('div');
        gridEl.className = 'crossword-grid';
        gridEl.style.gridTemplateRows = `repeat(${this.crosswordGrid.rows}, 50px)`;
        gridEl.style.gridTemplateColumns = `repeat(${this.crosswordGrid.cols}, 50px)`;

        // Create square objects for each cell
        this.crosswordGrid.grid.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                // Create appropriate square object based on cell type
                const squareObj = this.createSquareByType(rIdx, cIdx, cell.type || 'letter');
                
                // Load data from grid into square object
                squareObj.loadFromGridData();
                
                // Create the DOM element
                const element = squareObj.createElement();
                
                // Add edge classes for border management
                if (cIdx === this.crosswordGrid.cols - 1) {
                    element.classList.add('last-column');
                }
                if (rIdx === this.crosswordGrid.rows - 1) {
                    element.classList.add('last-row');
                }
                
                // Store square object reference
                this.squareObjects[rIdx][cIdx] = squareObj;
                
                gridEl.appendChild(element);
            });
        });
        
        this.container.appendChild(gridEl);
    }

    /**
     * Gets the square object at a specific position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {Square|null} Square object or null
     */
    getSquareAt(row, col) {
        if (row >= 0 && row < this.squareObjects.length && 
            col >= 0 && col < this.squareObjects[row].length) {
            return this.squareObjects[row][col];
        }
        return null;
    }

    /**
     * Updates the display of a specific square
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    updateSquareDisplay(row, col) {
        const squareObj = this.getSquareAt(row, col);
        if (squareObj) {
            squareObj.loadFromGridData();
            squareObj.updateDisplay();
        }
    }

    /**
     * Sets the type of a square at the specified position
     * @param {number} row - Row index
     * @param {number} col - Column index  
     * @param {string} type - New type ('letter', 'clue', 'black')
     */
    setSquareType(row, col, type) {
        const squareObj = this.squareObjects[row][col];
        if (squareObj) {
            // Destroy the old square object
            squareObj.destroy();
            
            // Create a new square object of the correct type
            const newSquareObj = this.createSquareByType(row, col, type);
            
            // Load existing data from grid
            newSquareObj.loadFromGridData();
            
            // Update the grid data with the new type
            const cell = this.crosswordGrid.getCell(row, col);
            if (cell) {
                cell.type = type;
            }
            
            // Create the new DOM element
            const element = newSquareObj.createElement();
            
            // Add edge classes for border management
            if (col === this.crosswordGrid.cols - 1) {
                element.classList.add('last-column');
            }
            if (row === this.crosswordGrid.rows - 1) {
                element.classList.add('last-row');
            }
            
            // Replace the old element with the new one
            const oldElement = squareObj.element || this.container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (oldElement && oldElement.parentNode) {
                oldElement.parentNode.replaceChild(element, oldElement);
            }
            
            // Store the new square object reference
            this.squareObjects[row][col] = newSquareObj;
        }
    }

    /**
     * Updates all square displays
     */
    updateAllSquares() {
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
     * Gets the container element
     * @returns {HTMLElement} Container element
     */
    getContainer() {
        return this.container;
    }

    /**
     * Destroys the renderer and cleans up
     */
    destroy() {
        // Clean up existing square objects
        this.squareObjects.forEach(row => {
            row.forEach(squareObj => {
                if (squareObj) {
                    squareObj.destroy();
                }
            });
        });
        this.container.innerHTML = '';
    }

    /**
     * Test method for word highlighting
     */
    testWordHighlighting() {
        // Find first few letter squares for testing
        const letterSquares = [];
        this.squareObjects.forEach((row, rIdx) => {
            row.forEach((squareObj, cIdx) => {
                if (squareObj && squareObj.getSquareType() === 'letter') {
                    letterSquares.push({ row: rIdx, col: cIdx });
                }
            });
        });
        
        if (letterSquares.length > 0) {
            // Create a fake word to test highlighting
            const testWord = {
                squares: letterSquares.slice(0, 3) // Test with first 3 letter squares
            };
            this.highlightWord(testWord);
            console.log('Word highlighting applied to', testWord.squares.length, 'squares');
        }
    }
}
