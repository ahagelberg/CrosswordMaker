/**
 * Base Square class - Common functionality for all square types
 */
console.debug('🔧 Loading Square.js file');

class Square {
    constructor(row, col, crosswordGrid, navigationManager) {
        console.debug('🏗️ Creating Square at', row, col);
        this.row = row;
        this.col = col;
        this.crosswordGrid = crosswordGrid;
        this.navigationManager = navigationManager;
        
        // Common properties
        this.borders = { top: false, bottom: false, left: false, right: false };
        this.color = null;
        
        // DOM element reference
        this.element = null;
        
        // State tracking
        this.isFocused = false;
        this.isSelected = false;
        
        this.createElement();
        this.setupEventListeners();
        this.loadFromGridData();
        console.debug('✅ Square created at', row, col, 'type:', this.getSquareType());
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
     * Creates and returns the DOM element for this square
     * @returns {HTMLElement} The square element
     */
    createElement() {
        const element = document.createElement('div');
        element.className = `square ${this.getSquareType()}`;
        element.tabIndex = 0;
        element.dataset.row = this.row;
        element.dataset.col = this.col;
        
        this.element = element;
        this.updateDisplay();
        
        console.debug('🏗️ Element created for square at', this.row, this.col, 'type:', this.getSquareType(), 'element:', element, 'className:', element.className);
        
        return element;
    }

    /**
     * Sets up event listeners for this square
     */
    setupEventListeners() {
        if (!this.element) return;
        
        console.debug('🔧 Setting up event listeners for square at', this.row, this.col, 'type:', this.getSquareType());
        
        // Click handler - use capturing to catch before child elements
        this.element.addEventListener('click', (e) => {
            console.debug('🖱️ Square element clicked at', this.row, this.col, 'target:', e.target.tagName, 'currentTarget:', e.currentTarget.tagName);
            this.handleClick(e);
        }, true); // Use capturing phase
        
        // Also add click handler in bubbling phase as backup
        this.element.addEventListener('click', (e) => {
            console.debug('🖱️ Square element clicked (bubbling) at', this.row, this.col, 'target:', e.target.tagName);
            if (e.target !== this.element) {
                console.debug('🔄 Click was on child element, calling handleClick');
                this.handleClick(e);
            }
        }, false);
        
        // Add a simple test click listener to verify events work
        this.element.addEventListener('click', (e) => {
            console.debug('🚨 TEST: Click detected on square', this.row, this.col, 'type:', this.getSquareType());
        });
        
        // Keyboard handler
        this.element.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Context menu handler
        this.element.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Focus handlers
        this.element.addEventListener('focus', () => this.handleFocus());
        this.element.addEventListener('blur', () => this.handleBlur());
        
        console.debug('✅ Event listeners set up for square at', this.row, this.col, 'element:', this.element);
    }

    /**
     * Handles click events on this square - can be overridden by subclasses
     * @param {Event} e - Click event
     */
    handleClick(e) {
        console.debug('🟦 Base Square handleClick called for row:', this.row, 'col:', this.col, 'type:', this.getSquareType());
        e.stopPropagation();
        
        // Update navigation manager's focus
        this.navigationManager.updateFocusedSquare(this.row, this.col);
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
            const input = this.getInputElement();
            if (input) {
                input.focus();
            } else {
                this.element.focus();
            }
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
        
        // Update classes
        this.element.className = `square ${this.getSquareType()}`;
        
        // Clear existing content
        this.element.innerHTML = '';
        
        // Render content specific to square type
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
        const cell = this.crosswordGrid.getCell(this.row, this.col);
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
        const cell = this.crosswordGrid.getCell(this.row, this.col);
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
 * LetterSquare - Square for letter input
 */
class LetterSquare extends Square {
    constructor(row, col, crosswordGrid, navigationManager) {
        console.debug('🔤 Creating LetterSquare at', row, col);
        super(row, col, crosswordGrid, navigationManager);
        this.value = '';
        this.arrow = null;
        console.debug('✅ LetterSquare created at', row, col);
    }

    getSquareType() {
        return 'letter';
    }

    handleClick(e) {
        console.debug('🔤 LetterSquare handleClick called for row:', this.row, 'col:', this.col);
        super.handleClick(e);
        this.focus();
        // Dispatch word click event for highlighting
        console.debug('🚀 Dispatching crossword:wordclick event with detail:', {row: this.row, col: this.col});
        document.dispatchEvent(new CustomEvent('crossword:wordclick', {
            detail: { row: this.row, col: this.col }
        }));
        console.debug('✅ crossword:wordclick event dispatched successfully');
    }

    handleKeydown(e) {
        // For letter squares, let the input handle naturally but notify navigation manager
        if (e.key.length === 1 && /^[A-Za-zÅÄÖåäö]$/i.test(e.key)) {
            this.navigationManager.onLetterInput(this.row, this.col, e.key.toUpperCase());
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
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
        // Apply background color if set
        if (this.color) {
            this.element.style.backgroundColor = this.color;
        }
        
        // Create input element for letter squares
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.value = this.value || '';
        
        console.debug('🔤 Creating input element for LetterSquare at', this.row, this.col);
        
        // Add click handler to input to delegate to square
        input.addEventListener('click', (e) => {
            console.debug('🖱️ Input clicked at', this.row, this.col, '- delegating to square');
            e.stopPropagation(); // Prevent double handling
            this.handleClick(e);
        });
        
        // Add context menu handler to input to delegate to square
        input.addEventListener('contextmenu', (e) => {
            console.debug('🖱️ Input right-clicked at', this.row, this.col, '- delegating to square');
            e.stopPropagation(); // Prevent double handling
            this.handleContextMenu(e);
        });
        
        // Add input event listener
        input.addEventListener('input', (e) => {
            this.value = e.target.value.toUpperCase();
            input.value = this.value;
            this.updateGridData();
        });
        
        // Add focus/blur handlers
        input.addEventListener('focus', () => this.handleFocus());
        input.addEventListener('blur', () => this.handleBlur());
        
        this.element.appendChild(input);
        
        // Add arrow indicator if present
        if (this.arrow) {
            const arrow = document.createElement('div');
            arrow.className = `arrow ${this.arrow}`;
            this.element.appendChild(arrow);
        }
    }

    getInputElement() {
        return this.element.querySelector('input');
    }

    updateGridData() {
        super.updateGridData();
        const cell = this.crosswordGrid.getCell(this.row, this.col);
        if (cell) {
            cell.value = this.value;
            cell.arrow = this.arrow;
        }
    }

    loadFromGridData() {
        super.loadFromGridData();
        const cell = this.crosswordGrid.getCell(this.row, this.col);
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
 * ClueSquare - Square for clue text
 */
class ClueSquare extends Square {
    constructor(row, col, crosswordGrid, navigationManager) {
        super(row, col, crosswordGrid, navigationManager);
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
        console.debug('🎯 ClueSquare handleClick called for row:', this.row, 'col:', this.col);
        super.handleClick(e);
        console.debug('🎯 ClueSquare about to enter editing mode');
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
        console.debug('🎯 ClueSquare enterEditingMode called, isEditing:', this.isEditing);
        
        // Always set editing state and ensure proper display
        this.isEditing = true;
        this.element.classList.add('editing');
        
        // Always ensure the display text content is hidden
        const textContent = this.element.querySelector('.clue-text-content');
        console.debug('🎯 Found textContent:', !!textContent);
        if (textContent) {
            textContent.classList.add('hidden');
            textContent.classList.remove('flex-visible');
        }
        
        // Focus the appropriate input element(s)
        const textareas = this.element.querySelectorAll('textarea');
        console.debug('🎯 Found textareas:', textareas.length);
        if (textareas.length > 0) {
            // Always ensure all textareas are visible (important for split squares)
            textareas.forEach(textarea => {
                textarea.classList.remove('hidden');
                textarea.classList.add('visible');
            });
            
            // For split squares, focus the appropriate textarea based on which part was clicked
            let textareaToFocus = textareas[0]; // Default to first
            if (this.split && this.clickedPart === 2 && textareas.length > 1) {
                textareaToFocus = textareas[1]; // Focus second textarea if part 2 was clicked
            }
            
            setTimeout(() => {
                textareaToFocus.focus();
                const length = textareaToFocus.value.length;
                textareaToFocus.setSelectionRange(length, length);
                console.debug('🎯 Textarea focused and selection set, clicked part:', this.clickedPart);
                // Reset clicked part for next time
                this.clickedPart = null;
            }, 10);
        } else {
            console.debug('❌ No textarea found in ClueSquare element');
        }
        
        // Update navigation manager
        this.navigationManager.isEditingClue = true;
        console.debug('🎯 Navigation manager updated, isEditingClue set to true');
    }

    exitEditingMode() {
        this.isEditing = false;
        if (this.element) {
            this.element.classList.remove('editing');
            
            // Show the display text content again
            const textContent = this.element.querySelector('.clue-text-content');
            if (textContent) {
                textContent.classList.remove('hidden');
                textContent.classList.add('flex-visible');
            }
            
            // Hide input elements
            const textareas = this.element.querySelectorAll('textarea');
            textareas.forEach(textarea => {
                textarea.classList.remove('visible');
                textarea.classList.add('hidden');
            });
        }
        
        // Update navigation manager
        this.navigationManager.isEditingClue = false;
    }

    updateDisplay() {
        // Remember if we were in editing mode before updating
        const wasEditing = this.isEditing;
        
        super.updateDisplay();
        
        if (this.split) {
            this.element.classList.add('split');
        }
        
        // If we were editing before, restore the editing state
        if (wasEditing) {
            this.element.classList.add('editing');
            
            // Hide the text content and show textareas
            const textContent = this.element.querySelector('.clue-text-content');
            if (textContent) {
                textContent.classList.add('hidden');
                textContent.classList.remove('flex-visible');
            }
            
            const textareas = this.element.querySelectorAll('textarea');
            textareas.forEach(textarea => {
                textarea.classList.remove('hidden');
                textarea.classList.add('visible');
            });
        }
    }

    renderContent() {
        if (this.split) {
            this.renderSplitClueSquare();
        } else {
            this.renderSingleClueSquare();
        }
    }

    renderSingleClueSquare() {
        // Create text content display
        const textContent = document.createElement('div');
        textContent.className = 'clue-text-content';
        textContent.textContent = this.value || '';
        
        // Add click handler to text content to delegate to square
        textContent.addEventListener('click', (e) => {
            console.debug('🖱️ Clue text content clicked at', this.row, this.col, '- delegating to square');
            e.stopPropagation(); // Prevent double handling
            this.handleClick(e);
        });
        
        // Add context menu handler to text content
        textContent.addEventListener('contextmenu', (e) => {
            console.debug('🖱️ Clue text content right-clicked at', this.row, this.col, '- delegating to square');
            e.stopPropagation();
            this.handleContextMenu(e);
        });
        
        this.element.appendChild(textContent);

        // Create hidden textarea
        const textarea = this.createTextarea(this.value || '', 2, 100);
        
        // Add input event listener
        textarea.addEventListener('input', (e) => {
            this.value = e.target.value;
            textContent.textContent = this.value;
            this.updateGridData();
        });
        
        textarea.addEventListener('blur', () => {
            this.exitEditingMode();
        });
        
        this.element.appendChild(textarea);
    }

    renderSplitClueSquare() {
        // Create text content display
        const textContent = document.createElement('div');
        textContent.className = 'clue-text-content split';
        
        const textPart1 = document.createElement('div');
        textPart1.className = 'clue-text-part';
        textPart1.textContent = this.value1 || '';
        
        // Add click handler to text part 1
        textPart1.addEventListener('click', (e) => {
            console.debug('🖱️ Clue text part 1 clicked at', this.row, this.col, '- delegating to square');
            e.stopPropagation();
            this.clickedPart = 1; // Track which part was clicked
            this.handleClick(e);
        });
        
        // Add context menu handler to text part 1
        textPart1.addEventListener('contextmenu', (e) => {
            console.debug('🖱️ Clue text part 1 right-clicked at', this.row, this.col, '- delegating to square');
            e.stopPropagation();
            this.handleContextMenu(e);
        });
        
        const textPart2 = document.createElement('div');
        textPart2.className = 'clue-text-part';
        textPart2.textContent = this.value2 || '';
        
        // Add click handler to text part 2
        textPart2.addEventListener('click', (e) => {
            console.debug('🖱️ Clue text part 2 clicked at', this.row, this.col, '- delegating to square');
            e.stopPropagation();
            this.clickedPart = 2; // Track which part was clicked
            this.handleClick(e);
        });
        
        // Add context menu handler to text part 2
        textPart2.addEventListener('contextmenu', (e) => {
            console.debug('🖱️ Clue text part 2 right-clicked at', this.row, this.col, '- delegating to square');
            e.stopPropagation();
            this.handleContextMenu(e);
        });
        
        textContent.appendChild(textPart1);
        textContent.appendChild(textPart2);
        this.element.appendChild(textContent);

        // Create hidden textareas
        const textarea1 = this.createTextarea(this.value1 || '', 1, 50);
        textarea1.addEventListener('input', (e) => {
            this.value1 = e.target.value;
            textPart1.textContent = this.value1;
            this.updateGridData();
        });
        
        const textarea2 = this.createTextarea(this.value2 || '', 1, 50);
        // Add the lower class for positioning in the lower half
        textarea2.classList.add('lower');
        textarea2.addEventListener('input', (e) => {
            this.value2 = e.target.value;
            textPart2.textContent = this.value2;
            this.updateGridData();
        });
        
        textarea1.addEventListener('blur', () => this.exitEditingMode());
        textarea2.addEventListener('blur', () => this.exitEditingMode());
        
        this.element.appendChild(textarea1);
        this.element.appendChild(textarea2);
    }

    createTextarea(value, rows, maxLength) {
        const textarea = document.createElement('textarea');
        textarea.value = value || '';
        textarea.rows = rows;
        textarea.maxLength = maxLength;
        
        // Add appropriate CSS classes based on usage
        if (rows > 1) {
            textarea.className = 'single';
        } else {
            textarea.className = 'split';
        }
        
        return textarea;
    }

    getInputElement() {
        return this.element.querySelector('textarea');
    }

    getTextareaElements() {
        return this.element.querySelectorAll('textarea');
    }

    updateGridData() {
        super.updateGridData();
        const cell = this.crosswordGrid.getCell(this.row, this.col);
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
        const cell = this.crosswordGrid.getCell(this.row, this.col);
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
    constructor(row, col, crosswordGrid, navigationManager) {
        super(row, col, crosswordGrid, navigationManager);
    }

    getSquareType() {
        return 'black';
    }

    renderContent() {
        this.element.classList.add('black');
    }

    getInputElement() {
        return null;
    }

    getValue() {
        return '';
    }
}

console.debug('✅ Square.js loaded - all classes defined:', {
    Square: typeof Square,
    LetterSquare: typeof LetterSquare, 
    ClueSquare: typeof ClueSquare,
    BlackSquare: typeof BlackSquare
});
