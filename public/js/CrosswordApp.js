/**
 * CrosswordApp - Main application controller
 */
class CrosswordApp {
    constructor() {
        console.debug('🚀 CrosswordApp constructor starting...');
        this.initializeProperties();
        this.initializeManagers();
        this.setupEventListeners();
        this.setupWindowListeners();
        this.initialize();
        console.debug('✅ CrosswordApp fully initialized');
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
    }

    /**
     * Initialize managers
     */
    initializeManagers() {
        // Initialize managers
        this.grid = new CrosswordGrid(
            parseInt(this.elements.rowsInput.value),
            parseInt(this.elements.colsInput.value)
        );

        this.navigationManager = new NavigationManager(this.grid);
        this.renderer = new CrosswordRenderer(this.grid, this.navigationManager);
        this.contextMenu = new ContextMenu(this.grid, this.navigationManager);
        this.puzzleManager = new PuzzleManager();
        this.printManager = new PrintManager();

        // Expose for debugging
        window.crosswordApp = this;
        window.crosswordRenderer = this.renderer;
        this.toastManager = new ToastManager();
        this.wordManager = new WordManager(this.grid);
        this.wordDisplay = new WordDisplay(() => this.currentLanguage);

        // Set up callbacks
        this.contextMenu.setOnGridChange(() => {
            this.renderer.render();
            this.wordManager.updateWords();
            this.puzzleManager.autoSave(this.getPuzzleData());
        });

        this.puzzleManager.setOnPuzzleLoad((puzzle) => {
            this.loadPuzzleData(puzzle);
        });

        this.wordManager.setOnWordChange((word) => {
            this.renderer.highlightWord(word);
            this.wordDisplay.show(word);
        });
    }

    /**
     * Setup event listeners for UI elements
     */
    setupEventListeners() {
        // Language selection
        this.elements.languageSelect.onchange = () => {
            this.currentLanguage = this.elements.languageSelect.value;
            document.documentElement.lang = this.currentLanguage;
            this.renderer.setLanguage(this.currentLanguage);
            this.renderer.render();
        };

        // Title input
        this.elements.titleInput.oninput = () => {
            this.crosswordTitle = this.elements.titleInput.value;
        };

        // Resize button
        this.elements.resizeBtn.onclick = () => {
            this.resizeGrid();
        };

        // Save button
        this.elements.saveBtn.onclick = () => {
            this.savePuzzle();
        };

        // Load button
        this.elements.loadBtn.onclick = () => {
            this.loadPuzzle();
        };

        // Download button
        this.elements.downloadBtn.onclick = () => {
            this.downloadPuzzle();
        };

        // Upload button
        this.elements.uploadBtn.onclick = () => {
            this.uploadPuzzle();
        };

        // Print buttons
        this.elements.printBtn.onclick = () => {
            this.printManager.printBlank(this.crosswordTitle);
        };

        this.elements.printKeyBtn.onclick = () => {
            this.printManager.printKey(this.crosswordTitle);
        };

        // Custom events
        document.addEventListener('crossword:contextmenu', (e) => {
            const { event, row, col } = e.detail;
            this.contextMenu.show(event, row, col);
        });

        document.addEventListener('crossword:save', () => {
            this.savePuzzle();
        });

        document.addEventListener('crossword:wordclick', (e) => {
            console.debug('📡 CrosswordApp received crossword:wordclick event with detail:', e.detail);
            const { row, col } = e.detail;
            console.debug('🎯 Calling WordManager.handleSquareClick with row:', row, 'col:', col);
            const result = this.wordManager.handleSquareClick(row, col);
            console.debug('📊 WordManager returned result:', result);
            if (result) {
                console.debug('✨ Word selected:', result.id, 'direction:', result.direction, 'squares:', result.squares.length);
            } else {
                console.debug('❌ No word selected (result is null)');
            }
        });
        
        console.debug('📡 CrosswordApp event listener for crossword:wordclick is set up');

        document.addEventListener('crossword:clearWordSelection', () => {
            this.renderer.clearWordHighlight();
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
            this.renderer.render();
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
        const gridData = this.grid.export();
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
        // Update grid
        this.grid.import(puzzle);

        // Update application state
        this.currentLanguage = puzzle.language || 'sv';
        this.crosswordTitle = puzzle.title || '';

        // Update UI controls
        this.elements.rowsInput.value = this.grid.rows;
        this.elements.colsInput.value = this.grid.cols;
        this.elements.languageSelect.value = this.currentLanguage;
        this.elements.titleInput.value = this.crosswordTitle;
        document.documentElement.lang = this.currentLanguage;

        // Update renderer and re-render
        this.renderer.setLanguage(this.currentLanguage);
        this.renderer.render();

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

        this.grid.resize(newRows, newCols);
        this.renderer.render();

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
            console.log('Puzzle data to download:', puzzleData);

            const exportData = this.puzzleManager.exportForDownload(puzzleData);
            console.log('Export data:', exportData);

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            console.log('Blob created:', blob);

            const filename = this.puzzleManager.createFilename(this.crosswordTitle);
            console.log('Filename:', filename);

            saveAs(blob, filename);
            console.log('saveAs called');

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
