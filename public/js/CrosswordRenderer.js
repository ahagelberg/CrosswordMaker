/**
 * CrosswordRenderer - Handles rendering the grid to the DOM
 */
class CrosswordRenderer {
    constructor(crosswordGrid, navigationManager) {
        this.crosswordGrid = crosswordGrid;
        this.navigationManager = navigationManager;
        this.container = document.getElementById('crossword-container');
        this.currentLanguage = 'sv';
        this.highlightedWord = null;
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
        // Clear previous highlighting
        this.clearWordHighlight();
        
        if (word) {
            this.highlightedWord = word;
            word.squares.forEach(square => {
                const squares = document.querySelectorAll('.square');
                const index = square.row * this.crosswordGrid.cols + square.col;
                if (squares[index]) {
                    squares[index].classList.add('word-highlighted');
                }
            });
        }
    }

    /**
     * Clears word highlighting
     */
    clearWordHighlight() {
        const highlightedSquares = document.querySelectorAll('.word-highlighted');
        highlightedSquares.forEach(square => {
            square.classList.remove('word-highlighted');
        });
        this.highlightedWord = null;
    }

    /**
     * Renders the crossword grid in the DOM with all squares and their appropriate input elements
     */
    render() {
        this.container.innerHTML = '';
        const gridEl = document.createElement('div');
        gridEl.className = 'crossword-grid';
        gridEl.style.gridTemplateRows = `repeat(${this.crosswordGrid.rows}, 50px)`;
        gridEl.style.gridTemplateColumns = `repeat(${this.crosswordGrid.cols}, 50px)`;

        this.crosswordGrid.grid.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                const square = this.createSquareElement(cell, rIdx, cIdx);
                gridEl.appendChild(square);
            });
        });
        
        this.container.appendChild(gridEl);
    }

    /**
     * Creates a square element based on cell data
     * @param {Object} cell - Cell data
     * @param {number} rIdx - Row index
     * @param {number} cIdx - Column index
     * @returns {HTMLElement} Square element
     */
    createSquareElement(cell, rIdx, cIdx) {
        const square = document.createElement('div');
        square.className = `square ${cell.type}`;
        square.tabIndex = 0;
        
        // Apply thick borders for word boundaries
        if (cell.borders) {
            if (cell.borders.bottom) square.classList.add('border-bottom');
            if (cell.borders.right) square.classList.add('border-right');
        }
        
        // Handle context menu
        square.oncontextmenu = (e) => {
            document.dispatchEvent(new CustomEvent('crossword:contextmenu', {
                detail: { event: e, row: rIdx, col: cIdx }
            }));
        };

        // Handle word selection on click
        square.onclick = (e) => {
            // Only handle word selection for letter squares
            if (cell.type === 'letter' && !cell.imageClue) {
                document.dispatchEvent(new CustomEvent('crossword:wordclick', {
                    detail: { row: rIdx, col: cIdx }
                }));
            }
        };

        // Handle image clues
        if (cell.imageClue) {
            this.renderImageClue(square, cell, rIdx, cIdx);
        } else if (cell.type === 'letter') {
            this.renderLetterSquare(square, cell, rIdx, cIdx);
        } else if (cell.type === 'black') {
            this.renderBlackSquare(square);
        } else if (cell.type === 'clue') {
            this.renderClueSquare(square, cell, rIdx, cIdx);
        }

        return square;
    }

    /**
     * Renders a letter square
     * @param {HTMLElement} square - Square element
     * @param {Object} cell - Cell data
     * @param {number} rIdx - Row index
     * @param {number} cIdx - Column index
     */
    renderLetterSquare(square, cell, rIdx, cIdx) {
        const input = document.createElement('input');
        input.maxLength = 1;
        input.value = cell.value;
        input.pattern = '[A-Za-zÅÄÖåäö]';
        
        // Apply background color if set
        if (cell.color) {
            square.style.backgroundColor = cell.color;
        }
        
        input.onfocus = () => {
            this.navigationManager.onInputFocus(rIdx, cIdx, null);
            // Use setTimeout to ensure the focus happens after the browser's default focus behavior
            setTimeout(() => {
                // For letter squares, select all text when clicked/focused
                input.select();
            }, 1);
        };
        
        input.oninput = (e) => {
            const valid = this.navigationManager.onLetterInput(rIdx, cIdx, e.target.value);
            if (valid) {
                input.value = this.crosswordGrid.getCell(rIdx, cIdx).value;
            } else {
                input.value = '';
            }
        };
        
        square.appendChild(input);
        
        // Add arrow indicator if present
        if (cell.arrow) {
            const arrow = document.createElement('div');
            arrow.className = `arrow ${cell.arrow}`;
            square.appendChild(arrow);
        }
    }

    /**
     * Renders a black square
     * @param {HTMLElement} square - Square element
     */
    renderBlackSquare(square) {
        square.classList.add('black');
        // Black squares have no input elements
    }

    /**
     * Renders a clue square
     * @param {HTMLElement} square - Square element
     * @param {Object} cell - Cell data
     * @param {number} rIdx - Row index
     * @param {number} cIdx - Column index
     */
    renderClueSquare(square, cell, rIdx, cIdx) {
        if (cell.split) {
            this.renderSplitClueSquare(square, cell, rIdx, cIdx);
        } else {
            this.renderSingleClueSquare(square, cell, rIdx, cIdx);
        }
    }

    /**
     * Renders a split clue square
     * @param {HTMLElement} square - Square element
     * @param {Object} cell - Cell data
     * @param {number} rIdx - Row index
     * @param {number} cIdx - Column index
     */
    renderSplitClueSquare(square, cell, rIdx, cIdx) {
        square.classList.add('split');
        
        const textarea1 = this.createTextarea(cell.value1 || '', 1, 50);
        textarea1.oninput = (e) => {
            this.crosswordGrid.setCell(rIdx, cIdx, { value1: e.target.value });
        };
        textarea1.onfocus = () => {
            this.navigationManager.onInputFocus(rIdx, cIdx, 'first');
            setTimeout(() => {
                const length = textarea1.value.length;
                textarea1.setSelectionRange(length, length);
            }, 1);
        };
        textarea1.onblur = () => {
            // Exit clue editing mode when textarea loses focus
            this.navigationManager.exitClueEditingMode();
        };
        
        const textarea2 = this.createTextarea(cell.value2 || '', 1, 50);
        textarea2.oninput = (e) => {
            this.crosswordGrid.setCell(rIdx, cIdx, { value2: e.target.value });
        };
        textarea2.onfocus = () => {
            this.navigationManager.onInputFocus(rIdx, cIdx, 'second');
            setTimeout(() => {
                const length = textarea2.value.length;
                textarea2.setSelectionRange(length, length);
            }, 1);
        };
        textarea2.onblur = () => {
            // Exit clue editing mode when textarea loses focus
            this.navigationManager.exitClueEditingMode();
        };
        
        square.appendChild(textarea1);
        square.appendChild(textarea2);
    }

    /**
     * Renders a single clue square
     * @param {HTMLElement} square - Square element
     * @param {Object} cell - Cell data
     * @param {number} rIdx - Row index
     * @param {number} cIdx - Column index
     */
    renderSingleClueSquare(square, cell, rIdx, cIdx) {
        const textarea = this.createTextarea(cell.value || '', 2, 100);
        textarea.oninput = (e) => {
            this.crosswordGrid.setCell(rIdx, cIdx, { value: e.target.value });
        };
        textarea.onfocus = () => {
            this.navigationManager.onInputFocus(rIdx, cIdx, null);
            setTimeout(() => {
                const length = textarea.value.length;
                textarea.setSelectionRange(length, length);
            }, 1);
        };
        textarea.onblur = () => {
            // Exit clue editing mode when textarea loses focus
            this.navigationManager.exitClueEditingMode();
        };
        
        square.appendChild(textarea);
    }

    /**
     * Renders an image clue square
     * @param {HTMLElement} square - Square element
     * @param {Object} cell - Cell data
     * @param {number} rIdx - Row index
     * @param {number} cIdx - Column index
     */
    renderImageClue(square, cell, rIdx, cIdx) {
        const imageClue = cell.imageClue;
        
        // Only render the image on the top-left square of the image area
        if (rIdx === imageClue.startRow && cIdx === imageClue.startCol) {
            const img = document.createElement('img');
            img.src = imageClue.imageData;
            img.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: ${(imageClue.endCol - imageClue.startCol + 1) * 50}px;
                height: ${(imageClue.endRow - imageClue.startRow + 1) * 50}px;
                object-fit: cover;
                z-index: 1;
                pointer-events: none;
            `;
            square.appendChild(img);
        }
        
        // Make the square non-editable but still focusable for context menu
        square.classList.add('image-clue');
        square.style.position = 'relative';
        square.style.overflow = 'hidden';
        
        // Add a transparent overlay for context menu access
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
            cursor: context-menu;
        `;
        square.appendChild(overlay);
    }

    /**
     * Creates a textarea element with common properties
     * @param {string} value - Initial value
     * @param {number} rows - Number of rows
     * @param {number} maxLength - Maximum length
     * @returns {HTMLElement} Textarea element
     */
    createTextarea(value, rows, maxLength) {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.maxLength = maxLength;
        textarea.rows = rows;
        textarea.lang = this.currentLanguage;
        textarea.style.textTransform = 'uppercase';
        
        textarea.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.stopPropagation();
            }
        };
        
        return textarea;
    }

    /**
     * Gets the container element
     * @returns {HTMLElement} Container element
     */
    getContainer() {
        return this.container;
    }
}
