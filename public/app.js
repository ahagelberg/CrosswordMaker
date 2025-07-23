const container = document.getElementById('crossword-container');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const languageSelect = document.getElementById('language');
const titleInput = document.getElementById('crosswordTitle');
const resizeBtn = document.getElementById('resizeGrid');
const saveBtn = document.getElementById('savePuzzle');
const loadBtn = document.getElementById('loadPuzzle');
const downloadBtn = document.getElementById('downloadPuzzle');
const uploadBtn = document.getElementById('uploadPuzzle');
const printBtn = document.getElementById('printPuzzle');

let grid = [];
let rows = parseInt(rowsInput.value);
let cols = parseInt(colsInput.value);
let currentLanguage = 'sv';
let crosswordTitle = '';
let currentPuzzleName = null; // Track which puzzle is currently being worked on
let entryDirection = 'horizontal'; // 'horizontal' or 'vertical'
let lastEnteredPosition = null;
let lastChangedPosition = null; // Track where letters were actually entered
let autoSaveInterval = null; // Store the interval ID for auto-save
let focusedSquare = { row: 0, col: 0 }; // Track the currently focused square
let focusedSubSquare = null; // Track which sub-square is focused in split clues ('first' or 'second')

/**
 * Creates an empty grid with specified dimensions
 * @param {number} r - Number of rows
 * @param {number} c - Number of columns
 * @returns {Array<Array<Object>>} 2D array of cell objects with type 'letter' and empty value
 */
function createEmptyGrid(r, c) {
    return Array.from({ length: r }, () =>
        Array.from({ length: c }, () => ({ 
            type: 'letter', 
            value: '', 
            arrow: null, // Can be 'top-to-right' or 'left-to-down'
            borders: { top: false, bottom: false, left: false, right: false } // Thick borders for word boundaries
        }))
    );
}

/**
 * Automatically saves the current puzzle to localStorage
 * Uses the crossword title as the puzzle name, or 'Untitled Puzzle' if no title is set
 * Also tracks the current puzzle being worked on
 */
function autoSavePuzzle() {
    // Use title as puzzle name, or generate one if empty
    let puzzleName = crosswordTitle.trim();
    if (!puzzleName) {
        puzzleName = 'Untitled Puzzle';
    }
    
    const puzzle = { 
        rows, 
        cols, 
        grid, 
        language: currentLanguage, 
        title: crosswordTitle, 
        lastSaved: Date.now() 
    };
    
    // Save the puzzle with the name as key
    localStorage.setItem(`crossword_${puzzleName}`, JSON.stringify(puzzle));
    
    // Track current puzzle and save it
    currentPuzzleName = puzzleName;
    localStorage.setItem('currentPuzzle', puzzleName);
    
    console.log('Auto-saved crossword "' + puzzleName + '" at', new Date().toLocaleTimeString());
}

/**
 * Retrieves all saved puzzles from localStorage
 * @returns {Array<Object>} Array of puzzle metadata objects containing name, title, lastSaved, rows, cols, language
 */
function getAllPuzzles() {
    const puzzles = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('crossword_')) {
            const puzzleName = key.substring(10); // Remove 'crossword_' prefix
            try {
                const puzzle = JSON.parse(localStorage.getItem(key));
                puzzles.push({
                    name: puzzleName,
                    title: puzzle.title || puzzleName,
                    lastSaved: puzzle.lastSaved,
                    rows: puzzle.rows,
                    cols: puzzle.cols,
                    language: puzzle.language
                });
            } catch (e) {
                console.error('Error parsing puzzle:', puzzleName, e);
            }
        }
    }
    return puzzles.sort((a, b) => (b.lastSaved || 0) - (a.lastSaved || 0));
}

/**
 * Deletes a puzzle from localStorage
 * @param {string} puzzleName - The name of the puzzle to delete
 */
function deletePuzzle(puzzleName) {
    localStorage.removeItem(`crossword_${puzzleName}`);
    // If we're deleting the current puzzle, clear the current puzzle reference
    if (currentPuzzleName === puzzleName) {
        localStorage.removeItem('currentPuzzle');
        currentPuzzleName = null;
    }
}

/**
 * Loads a puzzle from localStorage and updates the current state
 * @param {string} puzzleName - The name of the puzzle to load
 * @returns {boolean} True if the puzzle was loaded successfully, false otherwise
 */
function loadPuzzle(puzzleName) {
    const puzzleData = localStorage.getItem(`crossword_${puzzleName}`);
    if (!puzzleData) {
        showToast('Puzzle not found!', 'error');
        return false;
    }
    
    try {
        const puzzle = JSON.parse(puzzleData);
        
        // Load the puzzle data
        rows = puzzle.rows;
        cols = puzzle.cols;
        grid = puzzle.grid;
        currentLanguage = puzzle.language || 'sv';
        crosswordTitle = puzzle.title || '';
        currentPuzzleName = puzzleName;
        
        // Ensure all cells have arrow and borders properties for backward compatibility
        grid.forEach(row => {
            row.forEach(cell => {
                if (cell.arrow === undefined) {
                    cell.arrow = null;
                }
                if (cell.borders === undefined) {
                    cell.borders = { top: false, bottom: false, left: false, right: false };
                }
            });
        });
        
        // Update UI controls
        rowsInput.value = rows;
        colsInput.value = cols;
        languageSelect.value = currentLanguage;
        titleInput.value = crosswordTitle;
        document.documentElement.lang = currentLanguage;
        
        // Re-render the grid with loaded data
        renderGrid();
        
        // Reset focus to top-left
        focusedSquare = { row: 0, col: 0 };
        focusedSubSquare = null;
        updateFocusedSquare(0, 0, null);
        
        // Save current puzzle reference
        localStorage.setItem('currentPuzzle', puzzleName);
        
        showToast(`Loaded puzzle: ${puzzle.title || puzzleName}`, 'success');
        return true;
        
    } catch (error) {
        console.error('Error loading puzzle:', error);
        showToast('Error loading puzzle!', 'error');
        return false;
    }
}

/**
 * Shows a modal dialog with a list of saved puzzles for the user to select and load
 * Includes options to delete puzzles and displays puzzle metadata
 */
function showPuzzleSelector() {
    const puzzles = getAllPuzzles();
    
    if (puzzles.length === 0) {
        showToast('No saved puzzles found!', 'info');
        return;
    }
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'puzzle-modal';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'puzzle-modal-content';
    
    // Title
    const title = document.createElement('h2');
    title.textContent = 'Load Puzzle';
    modalContent.appendChild(title);
    
    // Puzzle list
    const puzzleList = document.createElement('div');
    puzzleList.className = 'puzzle-list';
    
    let selectedPuzzle = null;
    
    puzzles.forEach(puzzle => {
        const puzzleItem = document.createElement('div');
        puzzleItem.className = 'puzzle-item';
        
        const puzzleInfo = document.createElement('div');
        puzzleInfo.className = 'puzzle-info';
        
        const puzzleTitle = document.createElement('div');
        puzzleTitle.className = 'puzzle-title';
        puzzleTitle.textContent = puzzle.title || puzzle.name;
        
        const puzzleDetails = document.createElement('div');
        puzzleDetails.className = 'puzzle-details';
        const lastSaved = puzzle.lastSaved ? new Date(puzzle.lastSaved).toLocaleString() : 'Unknown';
        puzzleDetails.textContent = `${puzzle.rows}×${puzzle.cols} • ${puzzle.language} • Last saved: ${lastSaved}`;
        
        puzzleInfo.appendChild(puzzleTitle);
        puzzleInfo.appendChild(puzzleDetails);
        
        const puzzleActions = document.createElement('div');
        puzzleActions.className = 'puzzle-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'puzzle-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${puzzle.title || puzzle.name}"?`)) {
                deletePuzzle(puzzle.name);
                modal.remove();
                showPuzzleSelector(); // Refresh the list
            }
        };
        
        puzzleActions.appendChild(deleteBtn);
        
        puzzleItem.appendChild(puzzleInfo);
        puzzleItem.appendChild(puzzleActions);
        
        puzzleItem.onclick = () => {
            // Remove previous selection
            document.querySelectorAll('.puzzle-item').forEach(item => {
                item.classList.remove('selected');
            });
            // Select this item
            puzzleItem.classList.add('selected');
            selectedPuzzle = puzzle.name;
        };
        
        puzzleList.appendChild(puzzleItem);
    });
    
    modalContent.appendChild(puzzleList);
    
    // Buttons
    const modalButtons = document.createElement('div');
    modalButtons.className = 'modal-buttons';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-button secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => modal.remove();
    
    const loadBtn = document.createElement('button');
    loadBtn.className = 'modal-button primary';
    loadBtn.textContent = 'Load';
    loadBtn.onclick = () => {
        if (selectedPuzzle) {
            if (loadPuzzle(selectedPuzzle)) {
                modal.remove();
            }
        } else {
            showToast('Please select a puzzle to load!', 'error');
        }
    };
    
    modalButtons.appendChild(cancelBtn);
    modalButtons.appendChild(loadBtn);
    modalContent.appendChild(modalButtons);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

/**
 * Displays a toast notification message to the user
 * @param {string} message - The message to display
 * @param {string} [type='info'] - The type of toast (info, success, error)
 * @param {number} [duration=3000] - How long to show the toast in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    // Remove any existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show with animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide and remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Starts the auto-save interval that saves the puzzle every 30 seconds
 */
function startAutoSave() {
    // Auto-save every 30 seconds
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    autoSaveInterval = setInterval(autoSavePuzzle, 30000);
}

/**
 * Stops the auto-save interval
 */
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

/**
 * Finds the next empty letter square to move to when entering letters
 * @param {number} fromRow - Current row position
 * @param {number} fromCol - Current column position
 * @returns {Object|null} Object with row and col properties, or null if no valid next square
 */
function moveToNextSquare(fromRow, fromCol) {
    let nextRow = fromRow;
    let nextCol = fromCol;
    
    if (entryDirection === 'horizontal') {
        nextCol++;
        if (nextCol >= cols || grid[nextRow][nextCol].type !== 'letter' || grid[nextRow][nextCol].value !== '') {
            // Can't move horizontally, try vertical
            nextCol = fromCol;
            nextRow++;
            if (nextRow >= rows || grid[nextRow][nextCol].type !== 'letter') {
                return null; // No valid next square
            }
        }
    } else { // vertical
        nextRow++;
        if (nextRow >= rows || grid[nextRow][nextCol].type !== 'letter' || grid[nextRow][nextCol].value !== '') {
            // Can't move vertically, try horizontal
            nextRow = fromRow;
            nextCol++;
            if (nextCol >= cols || grid[nextRow][nextCol].type !== 'letter') {
                return null; // No valid next square
            }
        }
    }
    
    return { row: nextRow, col: nextCol };
}

/**
 * Focuses a specific square in the grid and handles different square types
 * @param {number} row - Row index of the square to focus
 * @param {number} col - Column index of the square to focus
 * @param {string|null} [subSquare=null] - For split clue squares, which sub-square to focus ('first' or 'second')
 */
function focusSquare(row, col, subSquare = null) {
    const squares = document.querySelectorAll('.square');
    const index = row * cols + col;
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
function updateFocusedSquare(row, col, subSquare = null) {
    // Remove focused class from all squares
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('focused');
    });
    
    // Add focused class to the current square
    const squares = document.querySelectorAll('.square');
    const index = row * cols + col;
    if (squares[index]) {
        squares[index].classList.add('focused');
        focusedSquare = { row, col };
        focusedSubSquare = subSquare;
    }
}

/**
 * Handles arrow key navigation within the grid
 * @param {string} direction - Direction to move ('up', 'down', 'left', 'right')
 */
function moveArrowKeys(direction) {
    let newRow = focusedSquare.row;
    let newCol = focusedSquare.col;
    let newSubSquare = focusedSubSquare;
    
    // Check if we're in a split clue square
    const currentCell = grid[focusedSquare.row][focusedSquare.col];
    const isInSplitClue = currentCell.type === 'clue' && currentCell.split;
    
    if (isInSplitClue && (direction === 'up' || direction === 'down')) {
        // Handle navigation within split clue
        if (direction === 'up' && focusedSubSquare === 'second') {
            // Move from second to first textarea
            newSubSquare = 'first';
            updateFocusedSquare(newRow, newCol, newSubSquare);
            setTimeout(() => focusSquare(newRow, newCol, newSubSquare), 10);
            return;
        } else if (direction === 'down' && (focusedSubSquare === 'first' || focusedSubSquare === null)) {
            // Move from first to second textarea
            newSubSquare = 'second';
            updateFocusedSquare(newRow, newCol, newSubSquare);
            setTimeout(() => focusSquare(newRow, newCol, newSubSquare), 10);
            return;
        }
    }
    
    // Normal navigation to other squares
    switch (direction) {
        case 'up':
            newRow = Math.max(0, newRow - 1);
            break;
        case 'down':
            newRow = Math.min(rows - 1, newRow + 1);
            break;
        case 'left':
            newCol = Math.max(0, newCol - 1);
            break;
        case 'right':
            newCol = Math.min(cols - 1, newCol + 1);
            break;
    }
    
    // Reset sub-square when moving to a different square
    newSubSquare = null;
    
    updateFocusedSquare(newRow, newCol, newSubSquare);
    // Use the enhanced focusSquare function for proper editing behavior
    setTimeout(() => focusSquare(newRow, newCol, newSubSquare), 10);
}

/**
 * Handles keyboard events for arrow key navigation within the crossword grid
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleKeyDown(e) {
    // Handle Ctrl+S for saving
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveBtn.click(); // Trigger the save button functionality
        return;
    }
    
    if (e.target.closest('.crossword-grid')) {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                moveArrowKeys('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                moveArrowKeys('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                moveArrowKeys('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveArrowKeys('right');
                break;
        }
    }
}

/**
 * Detects the entry direction (horizontal or vertical) based on the last changed position
 * @param {number} currentRow - Current row position
 * @param {number} currentCol - Current column position
 */
function detectDirection(currentRow, currentCol) {
    if (lastChangedPosition) {
        const rowDiff = currentRow - lastChangedPosition.row;
        const colDiff = currentCol - lastChangedPosition.col;
        
        // Check if clicked square is directly below the last changed square
        if (rowDiff === 1 && colDiff === 0) {
            entryDirection = 'vertical';
        } else {
            // For any other click position, reset to horizontal
            entryDirection = 'horizontal';
        }
    } else {
        // No previous position, default to horizontal
        entryDirection = 'horizontal';
    }
}

/**
 * Renders the crossword grid in the DOM with all squares and their appropriate input elements
 * Handles different square types: letter, black, clue (single and split)
 */
function renderGrid() {
    container.innerHTML = '';
    const gridEl = document.createElement('div');
    gridEl.className = 'crossword-grid';
    gridEl.style.gridTemplateRows = `repeat(${rows}, 50px)`;
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 50px)`;

    grid.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
            const square = document.createElement('div');
            square.className = `square ${cell.type}`;
            
            // Apply thick borders for word boundaries
            if (cell.borders) {
                if (cell.borders.top) square.classList.add('border-top');
                if (cell.borders.bottom) square.classList.add('border-bottom');
                if (cell.borders.left) square.classList.add('border-left');
                if (cell.borders.right) square.classList.add('border-right');
            }
            
            square.tabIndex = 0;
            square.oncontextmenu = (e) => showContextMenu(e, rIdx, cIdx);
            if (cell.type === 'letter') {
                const input = document.createElement('input');
                input.maxLength = 1;
                input.value = cell.value;
                input.pattern = '[A-Za-zÅÄÖåäö]';
                input.onfocus = () => {
                    detectDirection(rIdx, cIdx);
                    lastEnteredPosition = { row: rIdx, col: cIdx };
                    updateFocusedSquare(rIdx, cIdx, null);
                    // Use setTimeout to ensure the focus happens after the browser's default focus behavior
                    setTimeout(() => {
                        // For letter squares, select all text when clicked/focused
                        input.select();
                    }, 1);
                };
                input.oninput = e => {
                    let v = e.target.value.toUpperCase();
                    if (/^[A-ZÅÄÖ]$/i.test(v)) {
                        grid[rIdx][cIdx].value = v;
                        input.value = v;
                        
                        // Update last changed position when letter is actually entered
                        lastChangedPosition = { row: rIdx, col: cIdx };
                        
                        // Move to next square
                        const next = moveToNextSquare(rIdx, cIdx);
                        if (next) {
                            setTimeout(() => focusSquare(next.row, next.col), 10);
                        }
                        lastEnteredPosition = { row: rIdx, col: cIdx };
                    } else {
                        grid[rIdx][cIdx].value = '';
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
            } else if (cell.type === 'black') {
                square.classList.add('black');
                // Black squares have no input elements
            } else if (cell.type === 'clue') {
                if (cell.split) {
                    square.classList.add('split');
                    const textarea1 = document.createElement('textarea');
                    textarea1.value = cell.value1 || '';
                    textarea1.maxLength = 50;
                    textarea1.rows = 1;
                    textarea1.lang = currentLanguage;
                    textarea1.style.textTransform = 'uppercase';
                    textarea1.oninput = e => {
                        grid[rIdx][cIdx].value1 = e.target.value; // Store original case
                    };
                    textarea1.onfocus = () => {
                        updateFocusedSquare(rIdx, cIdx, 'first');
                        // Position cursor at end for clue squares when clicked/focused
                        setTimeout(() => {
                            const length = textarea1.value.length;
                            textarea1.setSelectionRange(length, length);
                        }, 1);
                    };
                    textarea1.onkeydown = e => {
                        if (e.key === 'Enter') {
                            e.stopPropagation();
                        }
                    };
                    const textarea2 = document.createElement('textarea');
                    textarea2.value = cell.value2 || '';
                    textarea2.maxLength = 50;
                    textarea2.rows = 1;
                    textarea2.lang = currentLanguage;
                    textarea2.style.textTransform = 'uppercase';
                    textarea2.oninput = e => {
                        grid[rIdx][cIdx].value2 = e.target.value; // Store original case
                    };
                    textarea2.onfocus = () => {
                        updateFocusedSquare(rIdx, cIdx, 'second');
                        // Position cursor at end for clue squares when clicked/focused
                        setTimeout(() => {
                            const length = textarea2.value.length;
                            textarea2.setSelectionRange(length, length);
                        }, 1);
                    };
                    textarea2.onkeydown = e => {
                        if (e.key === 'Enter') {
                            e.stopPropagation();
                        }
                    };
                    square.appendChild(textarea1);
                    square.appendChild(textarea2);
                } else {
                    const textarea = document.createElement('textarea');
                    textarea.value = cell.value || '';
                    textarea.maxLength = 100;
                    textarea.rows = 2;
                    textarea.lang = currentLanguage;
                    textarea.style.textTransform = 'uppercase';
                    textarea.oninput = e => {
                        grid[rIdx][cIdx].value = e.target.value; // Store original case
                    };
                    textarea.onfocus = () => {
                        updateFocusedSquare(rIdx, cIdx, null);
                        // Position cursor at end for clue squares when clicked/focused
                        setTimeout(() => {
                            const length = textarea.value.length;
                            textarea.setSelectionRange(length, length);
                        }, 1);
                    };
                    textarea.onkeydown = e => {
                        if (e.key === 'Enter') {
                            e.stopPropagation();
                        }
                    };
                    square.appendChild(textarea);
                }
            }
            gridEl.appendChild(square);
        });
    });
    container.appendChild(gridEl);
}

/**
 * Shows a context menu when right-clicking on a square
 * Provides options to convert between different square types
 * @param {MouseEvent} e - The right-click event
 * @param {number} r - Row index of the clicked square
 * @param {number} c - Column index of the clicked square
 */
function showContextMenu(e, r, c) {
    e.preventDefault();
    
    // Remove any existing context menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'absolute';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    
    const cell = grid[r][c];
    
    if (cell.type === 'letter') {
        const option = document.createElement('div');
        option.className = 'context-menu-item';
        option.textContent = 'Convert to Clue Square';
        option.onclick = () => {
            cell.type = 'clue';
            cell.value = '';
            cell.arrow = null; // Remove arrow when converting
            renderGrid();
            menu.remove();
            
            // Restore focus to the converted square and focus its textarea
            updateFocusedSquare(r, c, null);
            setTimeout(() => focusSquare(r, c, null), 10);
        };
        menu.appendChild(option);
        
        const blackOption = document.createElement('div');
        blackOption.className = 'context-menu-item';
        blackOption.textContent = 'Convert to Black Square';
        blackOption.onclick = () => {
            cell.type = 'black';
            cell.value = '';
            cell.arrow = null; // Remove arrow when converting
            cell.borders = { top: false, bottom: false, left: false, right: false }; // Remove borders when converting
            renderGrid();
            menu.remove();
            
            // Restore focus to the converted square
            updateFocusedSquare(r, c, null);
        };
        menu.appendChild(blackOption);
        
        // Arrow options submenu
        const arrowSubmenu = document.createElement('div');
        arrowSubmenu.className = 'context-menu-item';
        arrowSubmenu.textContent = cell.arrow ? 'Change Arrow' : 'Add Arrow';
        arrowSubmenu.onclick = (e) => {
            e.stopPropagation();
            showArrowSubmenu(e, r, c, menu);
        };
        menu.appendChild(arrowSubmenu);
        
        // Remove arrow option if arrow exists
        if (cell.arrow) {
            const removeArrowOption = document.createElement('div');
            removeArrowOption.className = 'context-menu-item';
            removeArrowOption.textContent = 'Remove Arrow';
            removeArrowOption.onclick = () => {
                cell.arrow = null;
                renderGrid();
                menu.remove();
                
                // Restore focus
                updateFocusedSquare(r, c, null);
                setTimeout(() => focusSquare(r, c, null), 10);
            };
            menu.appendChild(removeArrowOption);
        }
        
        // Border options submenu
        const borderSubmenu = document.createElement('div');
        borderSubmenu.className = 'context-menu-item';
        const hasBorders = cell.borders && (cell.borders.top || cell.borders.bottom || cell.borders.left || cell.borders.right);
        borderSubmenu.textContent = hasBorders ? 'Edit Borders' : 'Add Borders';
        borderSubmenu.onclick = (e) => {
            e.stopPropagation();
            showBorderSubmenu(e, r, c, menu);
        };
        menu.appendChild(borderSubmenu);
        
        // Remove all borders option if borders exist
        if (hasBorders) {
            const removeBordersOption = document.createElement('div');
            removeBordersOption.className = 'context-menu-item';
            removeBordersOption.textContent = 'Remove All Borders';
            removeBordersOption.onclick = () => {
                cell.borders = { top: false, bottom: false, left: false, right: false };
                renderGrid();
                menu.remove();
                
                // Restore focus
                updateFocusedSquare(r, c, null);
                setTimeout(() => focusSquare(r, c, null), 10);
            };
            menu.appendChild(removeBordersOption);
        }
    } else if (cell.type === 'clue') {
        const letterOption = document.createElement('div');
        letterOption.className = 'context-menu-item';
        letterOption.textContent = 'Convert to Letter Square';
        letterOption.onclick = () => {
            cell.type = 'letter';
            cell.value = '';
            cell.split = false;
            cell.value1 = '';
            cell.value2 = '';
            cell.arrow = null; // Initialize arrow as null for converted squares
            cell.borders = { top: false, bottom: false, left: false, right: false }; // Initialize borders
            renderGrid();
            menu.remove();
            
            // Restore focus to the converted square and focus its input
            updateFocusedSquare(r, c, null);
            setTimeout(() => focusSquare(r, c, null), 10);
        };
        menu.appendChild(letterOption);
        
        const blackOption = document.createElement('div');
        blackOption.className = 'context-menu-item';
        blackOption.textContent = 'Convert to Black Square';
        blackOption.onclick = () => {
            cell.type = 'black';
            cell.value = '';
            cell.split = false;
            cell.value1 = '';
            cell.value2 = '';
            renderGrid();
            menu.remove();
            
            // Restore focus to the converted square
            updateFocusedSquare(r, c, null);
        };
        menu.appendChild(blackOption);
        
        if (!cell.split) {
            const splitOption = document.createElement('div');
            splitOption.className = 'context-menu-item';
            splitOption.textContent = 'Split Horizontally';
            splitOption.onclick = () => {
                cell.split = true;
                cell.value1 = cell.value || '';
                cell.value2 = '';
                renderGrid();
                menu.remove();
                
                // Restore focus to the converted square and focus the first textarea
                updateFocusedSquare(r, c, 'first');
                setTimeout(() => focusSquare(r, c, 'first'), 10);
            };
            menu.appendChild(splitOption);
        }
    } else if (cell.type === 'black') {
        const letterOption = document.createElement('div');
        letterOption.className = 'context-menu-item';
        letterOption.textContent = 'Convert to Letter Square';
        letterOption.onclick = () => {
            cell.type = 'letter';
            cell.value = '';
            cell.arrow = null; // Initialize arrow as null for converted squares
            cell.borders = { top: false, bottom: false, left: false, right: false }; // Initialize borders
            renderGrid();
            menu.remove();
            
            // Restore focus to the converted square and focus its input
            updateFocusedSquare(r, c, null);
            setTimeout(() => focusSquare(r, c, null), 10);
        };
        menu.appendChild(letterOption);
        
        const clueOption = document.createElement('div');
        clueOption.className = 'context-menu-item';
        clueOption.textContent = 'Convert to Clue Square';
        clueOption.onclick = () => {
            cell.type = 'clue';
            cell.value = '';
            renderGrid();
            menu.remove();
            
            // Restore focus to the converted square and focus its textarea
            updateFocusedSquare(r, c, null);
            setTimeout(() => focusSquare(r, c, null), 10);
        };
        menu.appendChild(clueOption);
    }
    
    document.body.appendChild(menu);
    
    // Remove menu when clicking outside
    const removeMenu = () => {
        menu.remove();
        document.removeEventListener('click', removeMenu);
    };
    setTimeout(() => document.addEventListener('click', removeMenu), 100);
}

/**
 * Shows an arrow submenu for selecting arrow direction and position
 * @param {MouseEvent} e - The click event
 * @param {number} r - Row index of the square
 * @param {number} c - Column index of the square
 * @param {HTMLElement} parentMenu - The parent context menu element
 */
function showArrowSubmenu(e, r, c, parentMenu) {
    // Remove any existing arrow submenu
    const existingSubmenu = document.querySelector('.arrow-submenu');
    if (existingSubmenu) {
        existingSubmenu.remove();
    }
    
    const submenu = document.createElement('div');
    submenu.className = 'context-menu arrow-submenu';
    submenu.style.position = 'absolute';
    submenu.style.left = (e.pageX + 150) + 'px'; // Position to the right of main menu
    submenu.style.top = e.pageY + 'px';
    
    const arrowOptions = [
        { value: 'top-to-right', label: '↳' },
        { value: 'left-to-down', label: '↴' }
    ];
    
    arrowOptions.forEach(option => {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.textContent = option.label;
        item.onclick = () => {
            grid[r][c].arrow = option.value;
            renderGrid();
            parentMenu.remove();
            submenu.remove();
            
            // Restore focus
            updateFocusedSquare(r, c, null);
            setTimeout(() => focusSquare(r, c, null), 10);
        };
        submenu.appendChild(item);
    });
    
    document.body.appendChild(submenu);
    
    // Remove submenu when clicking outside
    const removeSubmenu = () => {
        submenu.remove();
        document.removeEventListener('click', removeSubmenu);
    };
    setTimeout(() => document.addEventListener('click', removeSubmenu), 100);
}

/**
 * Shows a border submenu for selecting thick border positions
 * @param {MouseEvent} e - The click event
 * @param {number} r - Row index of the square
 * @param {number} c - Column index of the square
 * @param {HTMLElement} parentMenu - The parent context menu element
 */
function showBorderSubmenu(e, r, c, parentMenu) {
    // Remove any existing border submenu
    const existingSubmenu = document.querySelector('.border-submenu');
    if (existingSubmenu) {
        existingSubmenu.remove();
    }
    
    const submenu = document.createElement('div');
    submenu.className = 'context-menu border-submenu';
    submenu.style.position = 'absolute';
    submenu.style.left = (e.pageX + 150) + 'px'; // Position to the right of main menu
    submenu.style.top = e.pageY + 'px';
    
    const borderOptions = [
        { value: 'top', label: '■', description: 'Top border' },
        { value: 'bottom', label: '■', description: 'Bottom border' },
        { value: 'left', label: '■', description: 'Left border' },
        { value: 'right', label: '■', description: 'Right border' }
    ];
    
    borderOptions.forEach(option => {
        const item = document.createElement('div');
        item.className = 'context-menu-item border-option';
        
        // Create visual representation
        const visual = document.createElement('div');
        visual.className = 'border-visual';
        visual.style.cssText = `
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 1px solid #ccc;
            margin-right: 8px;
            position: relative;
            vertical-align: middle;
        `;
        
        // Add thick border on the appropriate side
        switch(option.value) {
            case 'top':
                visual.style.borderTop = '3px solid #000';
                break;
            case 'bottom':
                visual.style.borderBottom = '3px solid #000';
                break;
            case 'left':
                visual.style.borderLeft = '3px solid #000';
                break;
            case 'right':
                visual.style.borderRight = '3px solid #000';
                break;
        }
        
        const label = document.createElement('span');
        label.textContent = option.description;
        
        item.appendChild(visual);
        item.appendChild(label);
        
        // Check if this border is already active
        const cell = grid[r][c];
        if (cell.borders && cell.borders[option.value]) {
            item.style.backgroundColor = '#e3f2fd';
        }
        
        item.onclick = () => {
            // Toggle the border
            if (!cell.borders) {
                cell.borders = { top: false, bottom: false, left: false, right: false };
            }
            cell.borders[option.value] = !cell.borders[option.value];
            
            renderGrid();
            parentMenu.remove();
            submenu.remove();
            
            // Restore focus
            updateFocusedSquare(r, c, null);
            setTimeout(() => focusSquare(r, c, null), 10);
        };
        submenu.appendChild(item);
    });
    
    document.body.appendChild(submenu);
    
    // Remove submenu when clicking outside
    const removeSubmenu = () => {
        submenu.remove();
        document.removeEventListener('click', removeSubmenu);
    };
    setTimeout(() => document.addEventListener('click', removeSubmenu), 100);
}

/**
 * Legacy function for square selection - currently unused
 * @param {number} r - Row index
 * @param {number} c - Column index
 * @deprecated This function is no longer used since context menus handle square type changes
 */
function selectSquare(r, c) {
    // This function is now unused since we use context menu for square type changes
    // You can remove this function or use it for other selection purposes
}

languageSelect.onchange = () => {
    currentLanguage = languageSelect.value;
    document.documentElement.lang = currentLanguage;
    renderGrid(); // Re-render to apply new language to textareas
    
    // Update Hyphenopoly if it's loaded
    if (window.Hyphenopoly && window.Hyphenopoly.hyphenators) {
        window.Hyphenopoly.hyphenators.HTML.hyphenate();
    }
};

titleInput.oninput = () => {
    const oldTitle = crosswordTitle;
    crosswordTitle = titleInput.value;
    
    // If we had a current puzzle and the title changed significantly, 
    // we might want to save it as a new puzzle or rename it
    // For now, we'll just update the title and let auto-save handle it
};

resizeBtn.onclick = () => {
    const newRows = parseInt(rowsInput.value);
    const newCols = parseInt(colsInput.value);
    const oldGrid = grid;
    
    // Create new grid with new dimensions
    grid = createEmptyGrid(newRows, newCols);
    
    // Copy existing content to the new grid (preserve what fits)
    for (let r = 0; r < Math.min(rows, newRows); r++) {
        for (let c = 0; c < Math.min(cols, newCols); c++) {
            grid[r][c] = { ...oldGrid[r][c] }; // Copy the cell data
        }
    }
    
    // Update dimensions
    rows = newRows;
    cols = newCols;
    
    renderGrid();
    
    // Auto-save the resized puzzle
    autoSavePuzzle();
    showToast(`Grid resized to ${rows}×${cols}!`, 'success');
    
    // Reset focus to top-left after resize
    focusedSquare = { row: 0, col: 0 };
    focusedSubSquare = null;
    updateFocusedSquare(0, 0, null);
};

saveBtn.onclick = () => {
    // Use title as puzzle name, or prompt for one if empty
    let puzzleName = crosswordTitle.trim();
    if (!puzzleName) {
        puzzleName = prompt('Enter a name for this puzzle:');
        if (!puzzleName) {
            showToast('Save cancelled - please enter a puzzle name!', 'error');
            return;
        }
        // Update the title input with the entered name
        crosswordTitle = puzzleName;
        titleInput.value = puzzleName;
    }
    
    const puzzle = { 
        rows, 
        cols, 
        grid, 
        language: currentLanguage, 
        title: crosswordTitle,
        lastSaved: Date.now()
    };
    
    // Save the puzzle with the name as key
    localStorage.setItem(`crossword_${puzzleName}`, JSON.stringify(puzzle));
    
    // Track current puzzle
    currentPuzzleName = puzzleName;
    localStorage.setItem('currentPuzzle', puzzleName);
    
    showToast(`Puzzle "${puzzleName}" saved!`, 'success');
};

loadBtn.onclick = () => {
    showPuzzleSelector();
};

downloadBtn.onclick = () => {
    const puzzle = { rows, cols, grid, language: currentLanguage, title: crosswordTitle };
    const blob = new Blob([JSON.stringify(puzzle, null, 2)], { type: 'application/json' });
    
    // Create filename from title or use default
    let filename = 'crossword.json';
    if (crosswordTitle.trim()) {
        // Sanitize title for filename (remove invalid characters)
        const sanitizedTitle = crosswordTitle.trim()
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .substring(0, 50); // Limit length
        filename = `${sanitizedTitle}.json`;
    }
    
    saveAs(blob, filename);
};

uploadBtn.onclick = () => {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const puzzle = JSON.parse(event.target.result);
                
                // Validate the puzzle structure
                if (!puzzle.rows || !puzzle.cols || !puzzle.grid) {
                    throw new Error('Invalid puzzle format');
                }
                
                // Load the puzzle data
                rows = puzzle.rows;
                cols = puzzle.cols;
                grid = puzzle.grid;
                currentLanguage = puzzle.language || 'sv';
                crosswordTitle = puzzle.title || '';
                
                // Ensure all cells have arrow and borders properties for backward compatibility
                grid.forEach(row => {
                    row.forEach(cell => {
                        if (cell.arrow === undefined) {
                            cell.arrow = null;
                        }
                        if (cell.borders === undefined) {
                            cell.borders = { top: false, bottom: false, left: false, right: false };
                        }
                    });
                });
                
                // Update UI controls
                rowsInput.value = rows;
                colsInput.value = cols;
                languageSelect.value = currentLanguage;
                titleInput.value = crosswordTitle;
                document.documentElement.lang = currentLanguage;
                
                // Re-render the grid with loaded data
                renderGrid();
                
                // Reset focus to top-left
                focusedSquare = { row: 0, col: 0 };
                focusedSubSquare = null;
                updateFocusedSquare(0, 0, null);
                
                // Auto-save the loaded puzzle
                autoSavePuzzle();
                
                showToast('Puzzle loaded successfully!', 'success');
                
            } catch (error) {
                console.error('Error loading puzzle:', error);
                showToast('Error loading puzzle file. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
};

printBtn.onclick = () => {
    // Show helpful tip about browser print settings
    showToast('Tip: For cleanest printing, disable headers/footers in your browser\'s print settings', 'info', 4000);
    
    // Try to use advanced print options if available
    if ('print' in window) {
        // For browsers that support it, we can try to influence print settings
        try {
            // Set a custom title for the print job
            const originalTitle = document.title;
            document.title = crosswordTitle || 'Crossword Puzzle';
            
            // Small delay to let the toast show before print dialog
            setTimeout(() => {
                // Use window.print() with potential options
                window.print();
                
                // Restore original title
                setTimeout(() => {
                    document.title = originalTitle;
                }, 100);
            }, 500);
        } catch (error) {
            console.log('Standard print fallback');
            window.print();
        }
    } else {
        window.print();
    }
};

// Save when user leaves or closes the page
window.addEventListener('beforeunload', (e) => {
    autoSavePuzzle();
});

// Save when page becomes hidden (e.g., switching tabs)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        autoSavePuzzle();
    }
});

// Save when window loses focus
window.addEventListener('blur', () => {
    autoSavePuzzle();
});

// Add keyboard navigation
document.addEventListener('keydown', handleKeyDown);

// Initialize
const currentPuzzle = localStorage.getItem('currentPuzzle');
if (currentPuzzle && localStorage.getItem(`crossword_${currentPuzzle}`)) {
    // Load the current puzzle
    loadPuzzle(currentPuzzle);
} else {
    // Check for old format puzzle and migrate it
    const oldPuzzle = localStorage.getItem('crosswordPuzzle');
    if (oldPuzzle) {
        try {
            const saved = JSON.parse(oldPuzzle);
            rows = saved.rows;
            cols = saved.cols;
            grid = saved.grid;
            currentLanguage = saved.language || 'sv';
            crosswordTitle = saved.title || 'Migrated Puzzle';
            
            // Ensure all cells have arrow and borders properties for migrated puzzles
            grid.forEach(row => {
                row.forEach(cell => {
                    if (cell.arrow === undefined) {
                        cell.arrow = null;
                    }
                    if (cell.borders === undefined) {
                        cell.borders = { top: false, bottom: false, left: false, right: false };
                    }
                });
            });
            
            rowsInput.value = rows;
            colsInput.value = cols;
            languageSelect.value = currentLanguage;
            titleInput.value = crosswordTitle;
            document.documentElement.lang = currentLanguage;
            
            // Save it in the new format
            autoSavePuzzle();
            
            // Remove old format
            localStorage.removeItem('crosswordPuzzle');
            
            showToast('Migrated old puzzle to new format!', 'info');
            
            if (saved.lastSaved) {
                console.log('Migrated puzzle last saved at', new Date(saved.lastSaved).toLocaleString());
            }
        } catch (e) {
            console.error('Error migrating old puzzle:', e);
            grid = createEmptyGrid(rows, cols);
        }
    } else {
        // No saved puzzle, create empty grid
        grid = createEmptyGrid(rows, cols);
    }
}

renderGrid();
updateFocusedSquare(0, 0, null); // Set initial focus to top-left square
startAutoSave(); // Start auto-saving
