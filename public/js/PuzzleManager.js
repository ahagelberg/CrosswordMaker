/**
 * PuzzleManager - Handles saving, loading, and puzzle management
 */
class PuzzleManager {
    constructor() {
        this.currentPuzzleName = null;
        this.autoSaveInterval = null;
        this.onPuzzleLoad = null; // Callback for when puzzle is loaded
    }

    /**
     * Sets callback for puzzle load events
     * @param {Function} callback - Callback function
     */
    setOnPuzzleLoad(callback) {
        this.onPuzzleLoad = callback;
    }

    /**
     * Automatically saves the current puzzle to localStorage
     * @param {Object} puzzleData - Puzzle data to save
     */
    autoSave(puzzleData) {
        // Use title as puzzle name, or generate one if empty
        let puzzleName = puzzleData.title?.trim();
        if (!puzzleName) {
            puzzleName = 'Untitled Puzzle';
        }
        
        const puzzle = { 
            ...puzzleData,
            lastSaved: Date.now() 
        };
        
        // Save the puzzle with the name as key
        localStorage.setItem(`crossword_${puzzleName}`, JSON.stringify(puzzle));
        
        // Track current puzzle and save it
        this.currentPuzzleName = puzzleName;
        localStorage.setItem('currentPuzzle', puzzleName);
        
        console.log('Auto-saved crossword "' + puzzleName + '" at', new Date().toLocaleTimeString());
    }

    /**
     * Saves a puzzle with a specific name
     * @param {Object} puzzleData - Puzzle data to save
     * @param {string} [forceName] - Force a specific name
     * @returns {string|null} Saved puzzle name or null if cancelled
     */
    save(puzzleData, forceName = null) {
        let puzzleName = forceName || puzzleData.title?.trim();
        
        if (!puzzleName) {
            puzzleName = prompt('Enter a name for this puzzle:');
            if (!puzzleName) {
                return null; // Save cancelled
            }
        }
        
        const puzzle = { 
            ...puzzleData,
            title: puzzleName,
            lastSaved: Date.now()
        };
        
        // Save the puzzle with the name as key
        localStorage.setItem(`crossword_${puzzleName}`, JSON.stringify(puzzle));
        
        // Track current puzzle
        this.currentPuzzleName = puzzleName;
        localStorage.setItem('currentPuzzle', puzzleName);
        
        return puzzleName;
    }

    /**
     * Loads a puzzle from localStorage
     * @param {string} puzzleName - The name of the puzzle to load
     * @returns {Object|null} Puzzle data or null if not found
     */
    load(puzzleName) {
        const puzzleData = localStorage.getItem(`crossword_${puzzleName}`);
        if (!puzzleData) {
            return null;
        }
        
        try {
            const puzzle = JSON.parse(puzzleData);
            this.currentPuzzleName = puzzleName;
            localStorage.setItem('currentPuzzle', puzzleName);
            
            if (this.onPuzzleLoad) {
                this.onPuzzleLoad(puzzle);
            }
            
            return puzzle;
        } catch (error) {
            console.error('Error loading puzzle:', error);
            return null;
        }
    }

    /**
     * Retrieves all saved puzzles from localStorage
     * @returns {Array<Object>} Array of puzzle metadata objects
     */
    getAllPuzzles() {
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
    delete(puzzleName) {
        localStorage.removeItem(`crossword_${puzzleName}`);
        // If we're deleting the current puzzle, clear the current puzzle reference
        if (this.currentPuzzleName === puzzleName) {
            localStorage.removeItem('currentPuzzle');
            this.currentPuzzleName = null;
        }
    }

    /**
     * Shows puzzle selector modal
     * @returns {Promise<string|null>} Selected puzzle name or null if cancelled
     */
    showPuzzleSelector() {
        return new Promise((resolve) => {
            const puzzles = this.getAllPuzzles();
            
            if (puzzles.length === 0) {
                document.dispatchEvent(new CustomEvent('crossword:toast', {
                    detail: { message: 'No saved puzzles found!', type: 'info' }
                }));
                resolve(null);
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
                const puzzleItem = this.createPuzzleListItem(puzzle, modal);
                
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
            cancelBtn.onclick = () => {
                modal.remove();
                resolve(null);
            };
            
            const loadBtn = document.createElement('button');
            loadBtn.className = 'modal-button primary';
            loadBtn.textContent = 'Load';
            loadBtn.onclick = () => {
                if (selectedPuzzle) {
                    modal.remove();
                    resolve(selectedPuzzle);
                } else {
                    document.dispatchEvent(new CustomEvent('crossword:toast', {
                        detail: { message: 'Please select a puzzle to load!', type: 'error' }
                    }));
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
                    resolve(null);
                }
            };
        });
    }

    /**
     * Creates a puzzle list item for the selector
     * @param {Object} puzzle - Puzzle metadata
     * @param {HTMLElement} modal - Modal element for deletion refresh
     * @returns {HTMLElement} Puzzle item element
     */
    createPuzzleListItem(puzzle, modal) {
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
                this.delete(puzzle.name);
                modal.remove();
                // Refresh the list by showing the selector again
                this.showPuzzleSelector().then(result => {
                    // Handle the result if needed
                });
            }
        };
        
        puzzleActions.appendChild(deleteBtn);
        
        puzzleItem.appendChild(puzzleInfo);
        puzzleItem.appendChild(puzzleActions);
        
        return puzzleItem;
    }

    /**
     * Exports puzzle data for download
     * @param {Object} puzzleData - Puzzle data to export
     * @returns {Object} Export data
     */
    exportForDownload(puzzleData) {
        return {
            rows: puzzleData.rows,
            cols: puzzleData.cols,
            grid: puzzleData.grid,
            language: puzzleData.language,
            title: puzzleData.title
        };
    }

    /**
     * Creates filename from title
     * @param {string} title - Puzzle title
     * @returns {string} Sanitized filename
     */
    createFilename(title) {
        if (!title?.trim()) {
            return 'crossword.json';
        }
        
        // Sanitize title for filename (remove invalid characters)
        const sanitizedTitle = title.trim()
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .substring(0, 50); // Limit length
        
        return `${sanitizedTitle}.json`;
    }

    /**
     * Starts auto-save interval
     * @param {Function} getDataCallback - Function to get current puzzle data
     */
    startAutoSave(getDataCallback) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.autoSaveInterval = setInterval(() => {
            const data = getDataCallback();
            this.autoSave(data);
        }, 30000); // Auto-save every 30 seconds
    }

    /**
     * Stops auto-save interval
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Gets current puzzle name
     * @returns {string|null} Current puzzle name
     */
    getCurrentPuzzleName() {
        return this.currentPuzzleName;
    }

    /**
     * Loads the last opened puzzle on startup
     * @returns {Object|null} Loaded puzzle data or null
     */
    loadLastPuzzle() {
        const currentPuzzle = localStorage.getItem('currentPuzzle');
        if (currentPuzzle && localStorage.getItem(`crossword_${currentPuzzle}`)) {
            return this.load(currentPuzzle);
        }
        return null;
    }
}
