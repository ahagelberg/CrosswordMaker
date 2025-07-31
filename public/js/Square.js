/**
 * Base Square class - Common functionality for all square types
 */
class Square {
    constructor(row, col, navigationManager) {
        this.row = row;
        this.col = col;
        this.borders = { top: false, bottom: false, left: false, right: false };
        this.color = null;
        this.element = null;
        this.navigationManager = navigationManager;
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
        // Remove any existing color classes
        this.element.classList.forEach(className => {
            if (className.startsWith('square-color-')) {
                this.element.classList.remove(className);
            }
        });
        // Add color class
        if (this.color) {
            this.element.classList.add('square-color-' + this.color);
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
        this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    }

    handleClick(e) {
        e.stopPropagation();
        // Dispatch a 'square:clicked' event with reference to this square
        if (this.element) {
            console.debug('Square clicked:', this);
            const event = new CustomEvent('square:clicked', {
                bubbles: true,
                detail: { square: this }
            });
            this.element.dispatchEvent(event);
        }
    }

    handleKeydown(e) {}

    handleContextMenu(e) {
        e.preventDefault();
        // Dispatch a context menu event with the square instance
        const event = new CustomEvent('contextmenu:show', {
            bubbles: true,
            detail: { event: e, square: this }
        });
        //this.handleClick(e); // Ensure click event is also triggered
        this.element.dispatchEvent(event);
    }

    handleFocus() {
        this.isFocused = true;
        this.updateFocusState();
    }

    handleBlur() {
        this.isFocused = false;
        this.updateFocusState();
    }

    setBorder(side, enabled = true) {
        if (this.borders.hasOwnProperty(side)) {
            this.borders[side] = enabled;
            this.updateVisualProperties();
        }
    }

    toggleBorder(side) {
        if (this.borders.hasOwnProperty(side)) {
            this.borders[side] = !this.borders[side];
            this.updateVisualProperties();
        }
    }

    removeBorder() {
        Object.keys(this.borders).forEach(side => {
            this.borders[side] = false;
        });
        this.updateVisualProperties();
    }

    setColor(color) {
        this.color = color;
        this.updateVisualProperties();
    }

    select() {
        this.isSelected = true;
        this.updateSelectionState();
        // Dispatch a 'square:selected' event with reference to this square
        if (this.element) {
            console.debug('Square selected:', this);
            const event = new CustomEvent('square:selected', {
                bubbles: true,
                detail: { square: this }
            });
            this.element.dispatchEvent(event);
        }
        this.focus();
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

    isEmpty() {
        return this.getValue() === null || this.getValue() === '';
    }

    getPosition() {
        return { row: this.row, col: this.col };
    }
}



/**
 * LetterSquare - Square for letter input with optional arrows
 * and stop borders
 */
class LetterSquare extends Square {
    constructor(row, col, navigationManager) {
        super(row, col, navigationManager);
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

    getArrow() {
        return this.arrow;
    }

    getInputElement() { return null; }
    getValue() { return this.value; }

    highlight() {
        if (this.element) {
            this.element.classList.add('word-highlighted');
        }
    }

    removeHighlight() {
        if (this.element) {
            this.element.classList.remove('word-highlighted');
        }
    }
}

/**
 * Global overlay manager for clue editing (without zoom)
 */
class ClueEditOverlay {
    constructor() {
        this.overlay = null;
        this.input = null;
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

        // Create input element
        this.input = document.createElement('textarea');
        this.input.className = 'clue-edit-input';

        // Create Done button
        this.doneButton = document.createElement('button');
        this.doneButton.textContent = 'Done';
        this.doneButton.className = 'clue-edit-done-button';

        // Append elements
        inputContainer.appendChild(this.input);
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

        // Auto-save on input
        const handleInput = () => {
            if (this.currentSquare) {
                this.saveToSquare();
            }
        };

        this.input.addEventListener('input', handleInput);

        // Done button click handler
        this.doneButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
        });
    }

    show(square, focusOn = null) {
        this.currentSquare = square;
        this.isVisible = true;

        this.input.value = square.value || '';
            
        setTimeout(() => {
            this.input.focus();
            this.input.setSelectionRange(this.input.value.length, this.input.value.length);
        }, 10);

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
        this.currentSquare.setValue(this.input.value);
    }
}

// Global instance
let clueEditOverlay = null;

/**
 * ClueSquare - Square for text/clue input with overlay editing
 */
class ClueSquare extends Square {
    constructor(row, col, navigationManager) {
        super(row, col, navigationManager);
        this.value = '';
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
    getSquareType() {
        return 'black';
    }

    updateContentDisplay() {
        // No content to display for black squares
    }
}
