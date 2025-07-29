/**
 * Base Square class - Common functionality for all square types
 */
class Square {
    constructor(row, col, crossword, navigationManager) {
        this.row = row;
        this.col = col;
        this.crossword = crossword;
        this.navigationManager = navigationManager;
        this.borders = { top: false, bottom: false, left: false, right: false };
        this.color = null;
        this.element = null;
        this.isFocused = false;
        this.isSelected = false;
    }

    getSquareType() {
        throw new Error('getSquareType must be implemented by subclasses');
    }

    /**
     * Creates the HTML element for this square
     */
    createElement() {
        const element = document.createElement('div');
        element.className = `square ${this.getSquareType()}`;
        //element.tabIndex = 0;
        element.dataset.row = this.row;
        element.dataset.col = this.col;
        this.element = element;
        return element;
    }

    /**
     * Sets up event listeners for the square
     * and updates the content and visual properties.
     * Should be called once after the element is created.
     */
    render() {
        if (!this.element) return;
        this.setupEventListeners();
        this.updateDisplay();
    }

    /**
     * Updates the display of the square
     * including content, visual properties, focus, and selection state.
     */
    updateDisplay() {
        if (!this.element) return;
        this.updateContentDisplay();
        this.updateVisualProperties();
        this.updateFocusState();
        this.updateSelectionState();
    }

    /**
     * Updates the square with its current value
     * Should be implemented by subclasses to show specific content.
     */
    updateContentDisplay() {
        throw new Error('updateContentDisplay must be implemented by subclasses');
    }

    /**
     * Updates the visual properties of the square
     * such as borders and background color.
     */
    updateVisualProperties() {
        if (!this.element) return;
        Object.keys(this.borders).forEach(side => {
            if (this.borders[side]) {
                this.element.classList.add(`border-${side}`);
            } else {
                this.element.classList.remove(`border-${side}`);
            }
        });
        if (this.color) {
            this.element.style.backgroundColor = this.color;
        } else {
            this.element.style.backgroundColor = '';
        }
    }

    updateFocusState() {
        if (!this.element) return;
        if (this.isFocused) {
            this.element.classList.add('focused');
        } else {
            this.element.classList.remove('focused');
        }
    }

    updateSelectionState() {
        if (!this.element) return;
        if (this.isSelected) {
            this.element.classList.add('selected');
        } else {
            this.element.classList.remove('selected');
        }
    }

    setupEventListeners() {
        if (!this.element) return;
        // Add event listeners for click, keydown, contextmenu, focus, and blur
        this.element.addEventListener('click', this.handleClick.bind(this));
        this.element.addEventListener('keydown', this.handleKeydown.bind(this));
        this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        this.element.addEventListener('focus', this.handleFocus.bind(this));
        this.element.addEventListener('blur', this.handleBlur.bind(this));
    }

    handleClick(e) {
        e.stopPropagation();
        this.navigationManager.updateFocusedSquare(this.row, this.col);
        this.navigationManager.onInputFocus(this.row, this.col);
        this.navigationManager.focusSquare(this.row, this.col);
    }

    handleKeydown(e) {}

    handleContextMenu(e) {
        e.preventDefault();
        // Dispatch a context menu event with the square instance
        const event = new CustomEvent('crossword:contextmenu', {
            bubbles: true,
            detail: { event: e, row: this.row, col: this.col, square: this }
        });
        this.element.dispatchEvent(event);
    }

    handleFocus() {
        this.isFocused = true;
        this.updateFocusState();
        // Hide any open context menu when focus moves (e.g., via arrow keys)
        const contextMenus = document.querySelectorAll('.context-menu');
        contextMenus.forEach(menu => menu.remove());
    }

    handleBlur() {
        this.isFocused = false;
        this.updateFocusState();
    }

    setBorder(side, enabled) {
        if (this.borders.hasOwnProperty(side)) {
            this.borders[side] = enabled;
            this.updateVisualProperties();
        }
    }

    setColor(color) {
        this.color = color;
        this.updateVisualProperties();
    }

    select() {
        this.isSelected = true;
        this.updateSelectionState();
    }

    deselect() {
        this.isSelected = false;
        this.updateSelectionState();
    }

    focus() {
        if (this.element) {
            this.element.focus();
        }
    }

    getValue() {
        return null;
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}



class LetterSquare extends Square {
    constructor(row, col, crossword, navigationManager) {
        super(row, col, crossword, navigationManager);
        this.value = '';
        this.arrow = null;
    }

    getSquareType() { return 'letter'; }

    createElement() {
        const element = super.createElement();
        const content = document.createElement('div');
        content.className = 'letter-content';
        this.contentElement = content;
        this.element.appendChild(content);
        const arrow = document.createElement('div');
        arrow.className = 'arrow';
        this.arrowElement = arrow;
        element.appendChild(arrow);
        return element;
    }

    updateContentDisplay() {
        if (!this.contentElement) return;
        this.contentElement.textContent = this.value || '';
    }

    updateVisualProperties() {
        if (!this.element) return;
        super.updateVisualProperties();
        if (this.arrow) {
            this.arrowElement.style.display = 'block';
            this.arrowElement.className = `arrow ${this.arrow}`;
        } else {
            this.arrowElement.style.display = 'none';
            this.arrowElement.className = 'arrow';
        }
    }

    handleClick(e) {
        if (e.target !== this.element) e.stopPropagation();
        super.handleClick(e);
        this.focus();
        // Use event-driven word click
        const event = new CustomEvent('crossword:wordclick', {
            bubbles: true,
            detail: { row: this.row, col: this.col, square: this }
        });
        this.element.dispatchEvent(event);
    }

    handleKeydown(e) {
        if (e.key.length === 1 && /^[A-Za-zÅÄÖÆØåäöæø]$/i.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            const value = e.key.toUpperCase();
            this.setValue(value);
            this.navigationManager.onLetterInput(this.row, this.col, value);
        } else if ((e.key === 'Backspace' || e.key === 'Delete') && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            this.setValue('');
            this.navigationManager.onLetterInput(this.row, this.col, null);
        }
    }

    setValue(value) {
        this.value = value;
        this.updateDisplay();
    }

    setArrow(arrow) {
        this.arrow = arrow;
        this.updateDisplay();
    }

    getInputElement() { return null; }
    getValue() { return this.value; }
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
        this.isEditing = false;
    }

    createElement() {
        const element = super.createElement();
        element.classList.add('clue');
        const content = document.createElement('div');
        content.className = 'clue-content';
        this.contentElement = content;
        this.element.appendChild(content);
        return element;
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
            // Close the clue editor on Ctrl+Enter
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (typeof clueEditOverlay !== 'undefined' && clueEditOverlay && clueEditOverlay.isVisible) {
                    clueEditOverlay.hide();
                }
            }
            return;
        }
        // Only enter editing mode on Enter key
        if (e.key === 'Enter') {
            e.preventDefault();
            this.enterEditingMode();
        }
    }

    setValue(value) {
        this.value = value;
        this.updateContentDisplay();
    }

    updateContentDisplay() {
        if (!this.contentElement) return;
        this.contentElement.innerHTML = this.value ? this.value : '';
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

    getInputElement() {
        return this.element.querySelector('textarea');
    }

    getTextareaElements() {
        return this.element.querySelectorAll('textarea');
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

    updateContentDisplay() {
        // No content to display for black squares
    }
}
