/**
 * Base Square class - Common functionality for all square types
 */
class Square {
    constructor(row, col, crossword, navigationManager) {
        this.row = row;
        this.col = col;
        this.crossword = crossword; // Changed from crosswordGrid to crossword
        this.navigationManager = navigationManager;
        
        // Common properties
        this.borders = { top: false, bottom: false, left: false, right: false };
        this.color = null;
        
        // DOM element reference
        this.element = null;
        
        // State tracking
        this.isFocused = false;
        this.isSelected = false;
        
        // Load data first, then create element
        // DON'T set up event listeners yet - wait for explicit call after DOM insertion
        this.loadFromGridData();
        // createElement() will be called by the Crossword class
    }

    /**
     * Abstract method - must be implemented by subclasses
     * @returns {string} The type of square
     */
    getSquareType() {
        throw new Error('getSquareType must be implemented by subclasses');
    }

    /**
     * Abstract method - must be implemented by subclasses
     */
    renderContent() {
        throw new Error('renderContent must be implemented by subclasses');
    }

    /**
     * Creates and returns the DOM element for this square - CALLED ONLY ONCE
     * @returns {HTMLElement} The square element
     */
    createElement() {
        const element = document.createElement('div');
        element.className = `square ${this.getSquareType()}`;
        element.tabIndex = 0; // Make sure element can receive focus and keyboard events
        element.dataset.row = this.row;
        element.dataset.col = this.col;
        
        this.element = element;
        
        // Render initial content and apply visual properties
        this.renderContent();
        this.applyVisualProperties();
        this.updateFocusState();
        this.updateSelectionState();
        
        return element;
    }

    /**
     * Sets up event listeners for this square
     */
    setupEventListeners() {
        if (!this.element) return;
        // Click handler - bind to preserve 'this' context
        this.element.addEventListener('click', this.handleClick.bind(this));
                
        // Keyboard handler - bind to preserve 'this' context
        this.element.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Context menu handler - bind to preserve 'this' context
        this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        // Focus handlers - bind to preserve 'this' context
        this.element.addEventListener('focus', this.handleFocus.bind(this));
        this.element.addEventListener('blur', this.handleBlur.bind(this));
    }

    /**
     * Handles click events on this square - can be overridden by subclasses
     * @param {Event} e - Click event
     */
    handleClick(e) {
        e.stopPropagation();
        
        // Update navigation manager's focus and detect direction
        this.navigationManager.updateFocusedSquare(this.row, this.col);
        this.navigationManager.onInputFocus(this.row, this.col);
        this.navigationManager.focusSquare(this.row, this.col);
    }

    /**
     * Handles keyboard input - can be overridden by subclasses
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeydown(e) {
        // Default implementation - subclasses can override
    }

    /**
     * Handles context menu events
     * @param {Event} e - Context menu event
     */
    handleContextMenu(e) {
        e.preventDefault();
        
        // Dispatch context menu event
        document.dispatchEvent(new CustomEvent('crossword:contextmenu', {
            detail: { event: e, row: this.row, col: this.col, square: this }
        }));
    }

    /**
     * Handles focus events
     */
    handleFocus() {
        this.isFocused = true;
        this.updateFocusState();
    }

    /**
     * Handles blur events
     */
    handleBlur() {
        this.isFocused = false;
        this.updateFocusState();
    }

    /**
     * Sets a border for this square
     * @param {string} side - Border side ('top', 'bottom', 'left', 'right')
     * @param {boolean} enabled - Whether border is enabled
     */
    setBorder(side, enabled) {
        if (this.borders.hasOwnProperty(side)) {
            this.borders[side] = enabled;
            this.updateGridData();
            this.updateDisplay();
        }
    }

    /**
     * Sets the background color
     * @param {string|null} color - Color value or null
     */
    setColor(color) {
        this.color = color;
        this.updateGridData();
        this.updateDisplay();
    }

    /**
     * Selects this square
     */
    select() {
        this.isSelected = true;
        this.updateSelectionState();
    }

    /**
     * Deselects this square
     */
    deselect() {
        this.isSelected = false;
        this.updateSelectionState();
    }

    /**
     * Focuses this square
     */
    focus() {
        if (this.element) {
            this.element.focus();
        }
    }

    /**
     * Gets the input element for this square - can be overridden by subclasses
     * @returns {HTMLElement|null} Input element or null
     */
    getInputElement() {
        return null;
    }

    /**
     * Gets the current value of this square - can be overridden by subclasses
     * @returns {string} The square's value
     */
    getValue() {
        return '';
    }

    /**
     * Updates the display of this square
     */
    updateDisplay() {
        if (!this.element) return;
        
        // First reload data from grid to ensure we have current values
        this.loadFromGridData();
        
        // Update base classes (never remove the square type class)
        this.element.className = `square ${this.getSquareType()}`;
        
        // Re-render content without destroying the element
        this.renderContent();
        
        // Apply visual properties
        this.applyVisualProperties();
        
        // Update states
        this.updateFocusState();
        this.updateSelectionState();
    }

    /**
     * Applies visual properties like borders and colors
     */
    applyVisualProperties() {
        if (!this.element) return;
        
        // Apply borders
        Object.keys(this.borders).forEach(side => {
            if (this.borders[side]) {
                this.element.classList.add(`border-${side}`);
            } else {
                this.element.classList.remove(`border-${side}`);
            }
        });
        
        // Apply background color
        if (this.color) {
            this.element.style.backgroundColor = this.color;
        } else {
            this.element.style.backgroundColor = '';
        }
    }

    /**
     * Updates the focus state visual
     */
    updateFocusState() {
        if (!this.element) return;
        
        if (this.isFocused) {
            this.element.classList.add('focused');
        } else {
            this.element.classList.remove('focused');
        }
    }

    /**
     * Updates the selection state visual
     */
    updateSelectionState() {
        if (!this.element) return;
        
        if (this.isSelected) {
            this.element.classList.add('selected');
        } else {
            this.element.classList.remove('selected');
        }
    }

    /**
     * Updates grid data with current square state - can be extended by subclasses
     */
    updateGridData() {
        const cell = this.crossword.getCell(this.row, this.col);
        if (cell) {
            cell.type = this.getSquareType();
            cell.borders = { ...this.borders };
            cell.color = this.color;
        }
    }

    /**
     * Loads data from grid cell into this square - can be extended by subclasses
     */
    loadFromGridData() {
        const cell = this.crossword.getCell(this.row, this.col);
        if (cell) {
            this.borders = { ...cell.borders } || { top: false, bottom: false, left: false, right: false };
            this.color = cell.color || null;
        }
    }

    /**
     * Destroys this square and cleans up event listeners
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

/**
 * LetterSquare - Square for letter input (using div element with keyboard handling)
 */
class LetterSquare extends Square {
    constructor(row, col, crossword, navigationManager) {
        super(row, col, crossword, navigationManager);
        this.value = '';
        this.arrow = null;
    }

    getSquareType() {
        return 'letter';
    }

    handleClick(e) {
        // If click came from a child element, treat it as a click on this square
        if (e.target !== this.element) {
            e.stopPropagation();
        }
        
        super.handleClick(e);
        // Ensure the element is focused so it can receive keyboard events
        this.focus();
        // Dispatch word click event for highlighting
        document.dispatchEvent(new CustomEvent('crossword:wordclick', {
            detail: { row: this.row, col: this.col }
        }));
    }

    handleKeydown(e) {
        // Handle letter input for Nordic and English letters, but only if no modifier keys are pressed (except Shift)
        if (e.key.length === 1 && /^[A-Za-zÅÄÖÆØåäöæø]$/i.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            const upperValue = e.key.toUpperCase();
            this.setValue(upperValue);
            // Let NavigationManager handle navigation logic
            this.navigationManager.onLetterInput(this.row, this.col, upperValue);
        } else if ((e.key === 'Backspace' || e.key === 'Delete') && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            this.setValue('');
            // Let NavigationManager know about the deletion
            this.navigationManager.onLetterInput(this.row, this.col, '');
        }
    }

    setValue(value) {
        this.value = value;
        this.updateGridData();
        this.updateDisplay();
    }

    setArrow(arrow) {
        this.arrow = arrow;
        this.updateGridData();
        this.updateDisplay();
    }

    renderContent() {
        // Clear existing content (but not the element itself)
        this.element.innerHTML = '';
        
        // Apply background color if set
        if (this.color) {
            this.element.style.backgroundColor = this.color;
        } else {
            this.element.style.backgroundColor = ''; // Clear background color
        }
        
        // Create content div for letter display
        const content = document.createElement('div');
        content.className = 'letter-content';
        content.textContent = this.value || '';
        
        this.element.appendChild(content);
        
        // Add arrow indicator if present
        if (this.arrow) {
            const arrow = document.createElement('div');
            arrow.className = `arrow ${this.arrow}`;
            this.element.appendChild(arrow);
        }
    }

    getInputElement() {
        // No longer has input element, return null
        return null;
    }

    focus() {
        if (this.element) {
            this.element.focus();
        }
    }

    updateGridData() {
        super.updateGridData();
        const cell = this.crossword.getCell(this.row, this.col);
        if (cell) {
            cell.value = this.value;
            cell.arrow = this.arrow;
        }
    }

    loadFromGridData() {
        super.loadFromGridData();
        const cell = this.crossword.getCell(this.row, this.col);
        if (cell) {
            this.value = cell.value || '';
            this.arrow = cell.arrow || null;
        }
    }

    getValue() {
        return this.value;
    }
}

/**
 * Global overlay manager for clue editing (without zoom)
 */
class ClueEditOverlay {
    constructor() {
        this.overlay = null;
        this.input = null;
        this.splitInput1 = null;
        this.splitInput2 = null;
        this.currentSquare = null;
        this.isVisible = false;
        this.createOverlay();
        this.setupEventListeners();
    }

    createOverlay() {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.className = 'clue-edit-overlay hidden';

        // Create input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'clue-input-container';

        // Create single input
        this.input = document.createElement('textarea');
        this.input.className = 'clue-edit-input';

        // Create split inputs
        this.splitInput1 = document.createElement('textarea');
        this.splitInput1.className = 'clue-edit-split-input';

        this.splitInput2 = document.createElement('textarea');
        this.splitInput2.className = 'clue-edit-split-input';

        // Create labels for split inputs
        const label1 = document.createElement('label');
        label1.textContent = 'Top text:';
        label1.className = 'clue-edit-label';

        const label2 = document.createElement('label');
        label2.textContent = 'Bottom text:';
        label2.className = 'clue-edit-label';

        // Create Done button
        this.doneButton = document.createElement('button');
        this.doneButton.textContent = 'Done';
        this.doneButton.className = 'clue-edit-done-button';

        // Append elements
        inputContainer.appendChild(this.input);
        inputContainer.appendChild(label1);
        inputContainer.appendChild(this.splitInput1);
        inputContainer.appendChild(label2);
        inputContainer.appendChild(this.splitInput2);
        inputContainer.appendChild(this.doneButton);
        
        this.overlay.appendChild(inputContainer);
        document.body.appendChild(this.overlay);
    }

    setupEventListeners() {
        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Global click handler to close overlay when clicking outside
        this.globalClickHandler = (e) => {
            if (this.isVisible && !this.overlay.contains(e.target)) {
                // Check if click is on a clue square that would open the overlay
                const square = e.target.closest('.square.clue');
                if (!square) {
                    this.hide();
                }
            }
        };

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.hide();
            }
        };

        this.input.addEventListener('keydown', handleEscape);
        this.splitInput1.addEventListener('keydown', handleEscape);
        this.splitInput2.addEventListener('keydown', handleEscape);

        // Auto-save on input
        const handleInput = () => {
            if (this.currentSquare) {
                this.saveToSquare();
            }
        };

        this.input.addEventListener('input', handleInput);
        this.splitInput1.addEventListener('input', handleInput);
        this.splitInput2.addEventListener('input', handleInput);

        // Done button click handler
        this.doneButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
        });
    }

    show(square, focusOn = null) {
        this.currentSquare = square;
        this.isVisible = true;

        // Load values from square (no positioning/zoom - just show the overlay)
        if (square.split) {
            // Show split mode
            this.input.classList.remove('single-mode');
            this.splitInput1.classList.add('split-mode');
            this.splitInput2.classList.add('split-mode');
            this.splitInput1.previousElementSibling.classList.add('split-mode'); // label1
            this.splitInput2.previousElementSibling.classList.add('split-mode'); // label2
            
            this.splitInput1.value = square.value1 || '';
            this.splitInput2.value = square.value2 || '';
            
            // Focus appropriate input
            setTimeout(() => {
                if (focusOn === 'second') {
                    this.splitInput2.focus();
                    this.splitInput2.setSelectionRange(this.splitInput2.value.length, this.splitInput2.value.length);
                } else {
                    this.splitInput1.focus();
                    this.splitInput1.setSelectionRange(this.splitInput1.value.length, this.splitInput1.value.length);
                }
            }, 10);
        } else {
            // Show single mode
            this.input.classList.add('single-mode');
            this.splitInput1.classList.remove('split-mode');
            this.splitInput2.classList.remove('split-mode');
            this.splitInput1.previousElementSibling.classList.remove('split-mode'); // label1
            this.splitInput2.previousElementSibling.classList.remove('split-mode'); // label2
            
            this.input.value = square.value || '';
            
            setTimeout(() => {
                this.input.focus();
                this.input.setSelectionRange(this.input.value.length, this.input.value.length);
            }, 10);
        }

        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('visible');
        
        // Add global click listener when overlay is shown
        setTimeout(() => {
            document.addEventListener('click', this.globalClickHandler);
        }, 10);
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.overlay.classList.remove('visible');
        this.overlay.classList.add('hidden');
        
        // Remove global click listener when overlay is hidden
        document.removeEventListener('click', this.globalClickHandler);
        
        if (this.currentSquare) {
            this.saveToSquare();
            this.currentSquare.exitEditingMode();
            this.currentSquare = null;
        }
    }

    saveToSquare() {
        if (!this.currentSquare) return;

        if (this.currentSquare.split) {
            this.currentSquare.setSplitValues(this.splitInput1.value, this.splitInput2.value);
        } else {
            this.currentSquare.setValue(this.input.value);
        }
    }
}

// Global instance
let clueEditOverlay = null;

/**
 * ClueSquare - Square for text/clue input with overlay editing
 */
class ClueSquare extends Square {
    constructor(row, col, crossword, navigationManager) {
        super(row, col, crossword, navigationManager);
        this.value = '';
        this.value1 = ''; // For split clues
        this.value2 = ''; // For split clues
        this.split = false;
        this.imageClue = null;
        this.isEditing = false;
        this.clickedPart = null; // Track which part of split square was clicked
    }

    getSquareType() {
        return 'clue';
    }

    handleClick(e) {
        // Handle split clue part detection
        if (e.target !== this.element && this.split) {
            // Determine which part was clicked based on the target element
            if (e.target.classList.contains('clue-display-top')) {
                this.clickedPart = 1;
            } else if (e.target.classList.contains('clue-display-bottom')) {
                this.clickedPart = 2;
            } else {
                this.clickedPart = null;
            }
        }
        
        super.handleClick(e);
        this.enterEditingMode();
    }

    handleKeydown(e) {
        // Let the textarea handle the input naturally
        if (this.isEditing) {
            return;
        }
        
        // Enter editing mode on any key press
        if (e.key !== 'Tab' && e.key !== 'Escape') {
            this.enterEditingMode();
        }
    }

    setValue(value) {
        this.value = value;
        this.updateGridData();
        this.updateDisplay();
    }

    setSplitValues(value1, value2) {
        this.value1 = value1;
        this.value2 = value2;
        this.updateGridData();
        this.updateDisplay();
    }

    splitHorizontally() {
        this.split = true;
        this.value1 = this.value || '';
        this.value2 = '';
        this.updateGridData();
        this.updateDisplay();
    }

    removeSplit() {
        if (this.split) {
            const combinedValue = [this.value1 || '', this.value2 || '']
                .filter(v => v.trim())
                .join(' ');
            this.split = false;
            this.value = combinedValue;
            this.value1 = '';
            this.value2 = '';
            this.updateGridData();
            this.updateDisplay();
        }
    }

    setImageClue(imageClue) {
        this.imageClue = imageClue;
        this.updateGridData();
        this.updateDisplay();
    }

    enterEditingMode() {
        // Initialize overlay if not already created
        if (!clueEditOverlay) {
            clueEditOverlay = new ClueEditOverlay();
        }
        
        this.isEditing = true;
        this.element.classList.add('editing');
        
        // Show the overlay with this square (no zoom positioning)
        clueEditOverlay.show(this, this.clickedPart === 2 ? 'second' : 'first');
    }

    exitEditingMode() {
        this.isEditing = false;
        if (this.element) {
            this.element.classList.remove('editing');
        }
    }

    renderContent() {
        // Clear existing content (but not the element itself)
        this.element.innerHTML = '';
        
        if (this.split) {
            this.renderSplitClueSquare();
        } else {
            this.renderSingleClueSquare();
        }
        
        // Add image overlay if present
        if (this.imageClue) {
            const imageOverlay = document.createElement('div');
            imageOverlay.className = 'image-overlay';
            imageOverlay.style.backgroundImage = `url(${this.imageClue.imageData})`;
            this.element.style.position = 'relative';
            this.element.appendChild(imageOverlay);
        }
    }

    renderSingleClueSquare() {
        // Create display text
        const textDisplay = document.createElement('div');
        textDisplay.className = 'clue-display';
        textDisplay.textContent = this.value || '';
        
        this.element.appendChild(textDisplay);
    }

    renderSplitClueSquare() {
        this.element.classList.add('split');
        
        // Create top display
        const topDisplay = document.createElement('div');
        topDisplay.className = 'clue-display clue-display-top';
        topDisplay.textContent = this.value1 || '';
        
        // Create bottom display
        const bottomDisplay = document.createElement('div');
        bottomDisplay.className = 'clue-display clue-display-bottom';
        bottomDisplay.textContent = this.value2 || '';
        
        this.element.appendChild(topDisplay);
        this.element.appendChild(bottomDisplay);
    }

    getInputElement() {
        return this.element.querySelector('textarea');
    }

    getTextareaElements() {
        return this.element.querySelectorAll('textarea');
    }

    updateGridData() {
        super.updateGridData();
        const cell = this.crossword.getCell(this.row, this.col);
        if (cell) {
            cell.value = this.value;
            cell.value1 = this.value1;
            cell.value2 = this.value2;
            cell.split = this.split;
            cell.imageClue = this.imageClue;
        }
    }

    loadFromGridData() {
        super.loadFromGridData();
        const cell = this.crossword.getCell(this.row, this.col);
        if (cell) {
            this.value = cell.value || '';
            this.value1 = cell.value1 || '';
            this.value2 = cell.value2 || '';
            this.split = cell.split || false;
            this.imageClue = cell.imageClue || null;
        }
    }

    getValue() {
        return this.value;
    }

    isBeingEdited() {
        return this.isEditing;
    }
}

/**
 * BlackSquare - Square for black/blocked squares
 */
class BlackSquare extends Square {
    constructor(row, col, crossword, navigationManager) {
        super(row, col, crossword, navigationManager);
    }

    getSquareType() {
        return 'black';
    }

    renderContent() {
        this.element.classList.add('black');
        
        // Add click handler to the element itself to ensure clicks work
        // (Black squares don't have child content, but ensure the element is clickable)
        this.element.style.cursor = 'pointer';
    }

    getInputElement() {
        return null;
    }

    getValue() {
        return '';
    }
}
