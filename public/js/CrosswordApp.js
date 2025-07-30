/**
 * CrosswordApp - Main application controller
 */
class CrosswordApp {
    constructor() {
        this.initializeProperties();
        this.initializeManagers();
        this.setupEventListeners();
        this.setupWindowListeners();
        this.initialize();
    }

    /**
     * Initialize application properties
     */
    initializeProperties() {
        this.currentLanguage = 'sv';
        this.crosswordTitle = '';

        // Get DOM elements
        this.elements = {
            rowsInput: document.getElementById('rows'),
            colsInput: document.getElementById('cols'),
            languageSelect: document.getElementById('language'),
            titleInput: document.getElementById('crosswordTitle'),
            resizeBtn: document.getElementById('resizeGrid'),
            saveBtn: document.getElementById('savePuzzle'),
            loadBtn: document.getElementById('loadPuzzle'),
            downloadBtn: document.getElementById('downloadPuzzle'),
            uploadBtn: document.getElementById('uploadPuzzle'),
            printBtn: document.getElementById('printPuzzle'),
            printKeyBtn: document.getElementById('printKey')
        };

        // Initialize toolbar
        // eslint-disable-next-line no-undef
        this.toolbar = new Toolbar(this.elements);
    }

    /**
     * Initialize managers
     */
    initializeManagers() {
        // Initialize crossword with container
        const container = document.getElementById('crossword-container');
        this.crossword = new Crossword(
            container,
            parseInt(this.elements.rowsInput.value),
            parseInt(this.elements.colsInput.value)
        );

        // Initialize managers
        this.navigationManager = new NavigationManager();
        this.contextMenu = new ContextMenu();
        this.puzzleManager = new PuzzleManager();
        this.printManager = new PrintManager();

        this.toastManager = new ToastManager();
        this.wordManager = new WordManager();
        this.wordDisplay = new WordDisplay(() => this.currentLanguage);

        // Set up crossword with all managers
        this.crossword.setupManagers(
            this.wordManager,
            this.navigationManager,
            this.puzzleManager,
            this.contextMenu
        );

        // Set up navigation manager event listeners now
        this.navigationManager.setupEventListeners();

        // Set up callbacks
        this.contextMenu.setOnGridChange(() => {
            this.crossword.render();
            this.wordManager.updateWords();
            this.puzzleManager.autoSave(this.getPuzzleData());
        });

        this.puzzleManager.setOnPuzzleLoad((puzzle) => {
            this.loadPuzzleData(puzzle);
        });
    }

    /**
     * Setup event listeners for UI elements
     */
    setupEventListeners() {
        // Command event listeners (from Toolbar)
        document.addEventListener('command:languageChange', (e) => {
            this.currentLanguage = e.detail.language;
            document.documentElement.lang = this.currentLanguage;
            this.crossword.setLanguage(this.currentLanguage);
            this.crossword.render();
        });

        document.addEventListener('command:titleChange', (e) => {
            this.crosswordTitle = e.detail.title;
        });

        document.addEventListener('command:resizeGrid', () => {
            this.resizeGrid();
        });

        document.addEventListener('command:savePuzzle', () => {
            this.savePuzzle();
        });

        document.addEventListener('command:loadPuzzle', () => {
            this.loadPuzzle();
        });

        document.addEventListener('command:downloadPuzzle', () => {
            this.downloadPuzzle();
        });

        document.addEventListener('command:uploadPuzzle', () => {
            this.uploadPuzzle();
        });

        document.addEventListener('command:printBlank', () => {
            this.printManager.printBlank(this.crosswordTitle);
        });

        document.addEventListener('command:printKey', () => {
            this.printManager.printKey(this.crosswordTitle);
        });

        document.addEventListener('crossword:save', () => {
            this.savePuzzle();
        });
    }

    /**
     * Setup window event listeners
     */
    setupWindowListeners() {
        // Save when user leaves or closes the page
        window.addEventListener('beforeunload', () => {
            this.puzzleManager.autoSave(this.getPuzzleData());
        });

        // Save when page becomes hidden (e.g., switching tabs)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.puzzleManager.autoSave(this.getPuzzleData());
            }
        });

        // Save when window loses focus
        window.addEventListener('blur', () => {
            this.puzzleManager.autoSave(this.getPuzzleData());
        });
    }

    /**
     * Initialize the application
     */
    initialize() {
        // Try to load the last opened puzzle
        const lastPuzzle = this.puzzleManager.loadLastPuzzle();

        if (!lastPuzzle) {
            // No saved puzzle, start with fresh grid
            this.crossword.render();
            this.navigationManager.resetFocus();
        }

        // Start auto-save
        this.puzzleManager.startAutoSave(() => this.getPuzzleData());
    }

    /**
     * Gets current puzzle data
     * @returns {Object} Puzzle data
     */
    getPuzzleData() {
        const gridData = this.crossword.exportData();
        return {
            rows: gridData.rows,
            cols: gridData.cols,
            grid: gridData.grid,
            language: this.currentLanguage,
            title: this.crosswordTitle
        };
    }

    /**
     * Loads puzzle data into the application
     * @param {Object} puzzle - Puzzle data
     */
    loadPuzzleData(puzzle) {
        // Update crossword
        this.crossword.loadFromData(puzzle);

        // Update application state
        this.currentLanguage = puzzle.language || 'sv';
        this.crosswordTitle = puzzle.title || '';

        // Update UI controls
        this.elements.rowsInput.value = this.crossword.rows;
        this.elements.colsInput.value = this.crossword.cols;
        this.elements.languageSelect.value = this.currentLanguage;
        this.elements.titleInput.value = this.crosswordTitle;
        document.documentElement.lang = this.currentLanguage;

        // Update crossword language and re-render
        this.crossword.setLanguage(this.currentLanguage);
        // crossword.render() is called by loadFromData

        // Reset focus
        this.navigationManager.resetFocus();

        document.dispatchEvent(new CustomEvent('crossword:toast', {
            detail: { message: `Loaded puzzle: ${puzzle.title || 'Untitled'}`, type: 'success' }
        }));
    }

    /**
     * Resizes the grid
     */
    resizeGrid() {
        const newRows = parseInt(this.elements.rowsInput.value);
        const newCols = parseInt(this.elements.colsInput.value);

        // Create new crossword with new dimensions
        const oldData = this.crossword.exportData();
        this.crossword.destroy();
        
        const container = document.getElementById('crossword-container');
        this.crossword = new Crossword(container, newRows, newCols);
        
        // Set up managers again
        this.crossword.setupManagers(
            this.wordManager,
            this.navigationManager,
            this.puzzleManager,
            this.contextMenu
        );
        
        // Try to preserve old data where possible
        if (oldData && oldData.grid) {
            const preservedData = {
                ...oldData,
                rows: newRows,
                cols: newCols,
                grid: Array.from({ length: newRows }, (_, r) =>
                    Array.from({ length: newCols }, (_, c) => {
                        if (r < oldData.rows && c < oldData.cols && oldData.grid[r] && oldData.grid[r][c]) {
                            return { ...oldData.grid[r][c] };
                        }
                        return {
                            type: 'letter',
                            value: '',
                            borders: { top: false, bottom: false, left: false, right: false },
                            color: null,
                            arrow: null,
                            value1: '',
                            value2: '',
                            split: false,
                            imageClue: null
                        };
                    })
                )
            };
            this.crossword.loadFromData(preservedData);
        } else {
            this.crossword.render();
        }

        // Auto-save the resized puzzle
        this.puzzleManager.autoSave(this.getPuzzleData());

        document.dispatchEvent(new CustomEvent('crossword:toast', {
            detail: { message: `Grid resized to ${newRows}×${newCols}!`, type: 'success' }
        }));

        // Reset focus after resize
        this.navigationManager.resetFocus();
    }

    /**
     * Saves the current puzzle
     */
    savePuzzle() {
        const puzzleData = this.getPuzzleData();
        const savedName = this.puzzleManager.save(puzzleData);

        if (savedName) {
            // Update title if it was changed during save
            if (savedName !== this.crosswordTitle) {
                this.crosswordTitle = savedName;
                this.elements.titleInput.value = savedName;
            }

            document.dispatchEvent(new CustomEvent('crossword:toast', {
                detail: { message: `Puzzle "${savedName}" saved!`, type: 'success' }
            }));
        } else {
            document.dispatchEvent(new CustomEvent('crossword:toast', {
                detail: { message: 'Save cancelled - please enter a puzzle name!', type: 'error' }
            }));
        }
    }

    /**
     * Loads a puzzle
     */
    async loadPuzzle() {
        const selectedPuzzle = await this.puzzleManager.showPuzzleSelector();

        if (selectedPuzzle) {
            const puzzle = this.puzzleManager.load(selectedPuzzle);
            if (!puzzle) {
                document.dispatchEvent(new CustomEvent('crossword:toast', {
                    detail: { message: 'Puzzle not found!', type: 'error' }
                }));
            }
        }
    }

    /**
     * Downloads the current puzzle as JSON
     */
    downloadPuzzle() {
        try {
            const puzzleData = this.getPuzzleData();
            const exportData = this.puzzleManager.exportForDownload(puzzleData);
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const filename = this.puzzleManager.createFilename(this.crosswordTitle);

            saveAs(blob, filename);

            // Show success toast
            document.dispatchEvent(new CustomEvent('crossword:toast', {
                detail: { message: `Downloading ${filename}...`, type: 'success' }
            }));

        } catch (error) {
            console.error('Download error:', error);
            document.dispatchEvent(new CustomEvent('crossword:toast', {
                detail: { message: 'Download failed. Please try again.', type: 'error' }
            }));
        }
    }

    /**
     * Uploads a puzzle from JSON file
     */
    uploadPuzzle() {
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

                    this.loadPuzzleData(puzzle);

                    // Auto-save the loaded puzzle
                    this.puzzleManager.autoSave(this.getPuzzleData());

                    document.dispatchEvent(new CustomEvent('crossword:toast', {
                        detail: { message: 'Puzzle loaded successfully!', type: 'success' }
                    }));

                } catch (error) {
                    console.error('Error loading puzzle:', error);
                    document.dispatchEvent(new CustomEvent('crossword:toast', {
                        detail: { message: 'Error loading puzzle file. Please check the file format.', type: 'error' }
                    }));
                }
            };

            reader.readAsText(file);
        };

        // Trigger file selection
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    /**
     * Cleanup when app is destroyed
     */
    destroy() {
        this.puzzleManager.stopAutoSave();
    }
}
