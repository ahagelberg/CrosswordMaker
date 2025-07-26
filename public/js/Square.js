/**
 * Square - Individual square object with all functionality encapsulated
 */
class Square {
    constructor(row, col, crosswordGrid, navigationManager) {
        this.row = row;
        this.col = col;
        this.crosswordGrid = crosswordGrid;
        this.navigationManager = navigationManager;
        
        // Square properties
        this.type = 'letter';
        this.value = '';
        this.value1 = ''; // For split clues
        this.value2 = ''; // For split clues
        this.split = false;
        this.arrow = null;
        this.borders = { top: false, bottom: false, left: false, right: false };
        this.color = null;
        this.imageClue = null;
        
        // DOM element reference
        this.element = null;
        
        // State tracking
        this.isFocused = false;
        this.isEditing = false;
        this.isSelected = false;
    }

    /**
     * Creates and returns the DOM element for this square
     * @returns {HTMLElement} The square element
     */
    createElement() {
        const element = document.createElement('div');
        element.className = `square ${this.type}`;
        element.tabIndex = 0;
        element.dataset.row = this.row;
        element.dataset.col = this.col;
        
        // Add event listeners
        this.setupEventListeners(element);
        
        this.element = element;
        this.updateDisplay();
        
        return element;
    }

    /**
     * Sets up event listeners for this square
     * @param {HTMLElement} element - The square element
     */
    setupEventListeners(element) {
        // Click handler
        element.addEventListener('click', (e) => this.handleClick(e));
        
        // Keyboard handler
        element.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Context menu handler
        element.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Focus handlers
        element.addEventListener('focus', () => this.handleFocus());
        element.addEventListener('blur', () => this.handleBlur());
    }

    /**
     * Handles click events on this square
     * @param {Event} e - Click event
     */
    handleClick(e) {
        e.stopPropagation();
        
        // Update navigation manager's focus using the correct method
        this.navigationManager.updateFocusedSquare(this.row, this.col);
        this.navigationManager.focusSquare(this.row, this.col);
        
        // Handle different types of squares
        if (this.type === 'clue') {
            this.enterEditingMode();
        } else if (this.type === 'letter') {
            this.focus();
            // Dispatch word click event for highlighting
            document.dispatchEvent(new CustomEvent('crossword:wordclick', {
                detail: { row: this.row, col: this.col }
            }));
        }
    }

    /**
     * Handles keyboard input for this square
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeydown(e) {
        if (this.type === 'letter') {
            this.handleLetterInput(e);
        } else if (this.type === 'clue') {
            this.handleClueInput(e);
        }
    }

    /**
     * Handles letter input for letter squares
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleLetterInput(e) {
        // For letter squares with input elements, let the input handle naturally
        // but still notify navigation manager
        if (e.key.length === 1 && /^[A-Za-zÅÄÖåäö]$/i.test(e.key)) {
            // Let the input element handle the display, we'll update on input event
            this.navigationManager.onLetterInput(this.row, this.col, e.key.toUpperCase());
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            // Let the input element handle the display, we'll update on input event
            this.navigationManager.onLetterInput(this.row, this.col, '');
        }
        
        // Don't prevent default - let the input element work naturally
    }

    /**
     * Handles input for clue squares
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleClueInput(e) {
        // Let the textarea handle the input naturally
        if (this.isEditing) {
            // Allow normal text editing
            return;
        }
        
        // Enter editing mode on any key press
        if (e.key !== 'Tab' && e.key !== 'Escape') {
            this.enterEditingMode();
        }
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
     * Sets the type of this square
     * @param {string} type - New square type ('letter', 'clue', 'black')
     */
    setType(type) {
        const oldType = this.type;
        this.type = type;
        
        // Reset type-specific properties
        if (type === 'letter') {
            this.value = '';
            this.split = false;
            this.value1 = '';
            this.value2 = '';
        } else if (type === 'clue') {
            this.value = this.value || '';
        } else if (type === 'black') {
            this.value = '';
            this.split = false;
            this.value1 = '';
            this.value2 = '';
            this.arrow = null;
        }
        
        // Update the grid data
        this.updateGridData();
        
        // Recreate the display if type changed significantly
        if (oldType !== type) {
            this.updateDisplay();
        }
    }

    /**
     * Sets the value of this square
     * @param {string} value - New value
     */
    setValue(value) {
        this.value = value;
        this.updateGridData();
        this.updateDisplay();
    }

    /**
     * Sets split clue values
     * @param {string} value1 - First clue value
     * @param {string} value2 - Second clue value
     */
    setSplitValues(value1, value2) {
        this.value1 = value1;
        this.value2 = value2;
        this.updateGridData();
        this.updateDisplay();
    }

    /**
     * Splits this clue square horizontally
     */
    splitHorizontally() {
        if (this.type === 'clue') {
            this.split = true;
            this.value1 = this.value || '';
            this.value2 = '';
            this.updateGridData();
            this.updateDisplay();
        }
    }

    /**
     * Removes split from this clue square
     */
    removeSplit() {
        if (this.type === 'clue' && this.split) {
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

    /**
     * Sets the arrow for this square
     * @param {string|null} arrow - Arrow type or null
     */
    setArrow(arrow) {
        this.arrow = arrow;
        this.updateGridData();
        this.updateDisplay();
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
     * Sets an image clue
     * @param {Object|null} imageClue - Image clue data or null
     */
    setImageClue(imageClue) {
        this.imageClue = imageClue;
        this.updateGridData();
        this.updateDisplay();
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
     * Enters editing mode for clue squares
     */
    enterEditingMode() {
        if (this.type !== 'clue') return;
        
        this.isEditing = true;
        this.element.classList.add('editing');
        
        // Hide the display text content
        const textContent = this.element.querySelector('.clue-text-content');
        if (textContent) {
            textContent.style.display = 'none';
        }
        
        // Focus the appropriate input element
        const textarea = this.element.querySelector('textarea');
        if (textarea) {
            setTimeout(() => {
                textarea.style.display = 'block';
                textarea.focus();
                const length = textarea.value.length;
                textarea.setSelectionRange(length, length);
            }, 10);
        }
        
        // Update navigation manager
        this.navigationManager.isEditingClue = true;
    }

    /**
     * Exits editing mode
     */
    exitEditingMode() {
        this.isEditing = false;
        if (this.element) {
            this.element.classList.remove('editing');
            
            // Show the display text content again
            const textContent = this.element.querySelector('.clue-text-content');
            if (textContent) {
                textContent.style.display = 'flex';
            }
            
            // Hide input elements
            const textareas = this.element.querySelectorAll('textarea');
            textareas.forEach(textarea => {
                textarea.style.display = 'none';
            });
        }
        
        // Update navigation manager
        this.navigationManager.isEditingClue = false;
    }

    /**
     * Updates the display of this square
     */
    updateDisplay() {
        if (!this.element) return;
        
        // Update classes
        this.element.className = `square ${this.type}`;
        
        if (this.split) {
            this.element.classList.add('split');
        }
        
        // Clear existing content
        this.element.innerHTML = '';
        
        // Render based on type
        if (this.type === 'black') {
            this.renderBlackSquare();
        } else if (this.type === 'letter') {
            this.renderLetterSquare();
        } else if (this.type === 'clue') {
            if (this.split) {
                this.renderSplitClueSquare();
            } else {
                this.renderSingleClueSquare();
            }
        }
        
        // Apply visual properties
        this.applyVisualProperties();
        
        // Update states
        this.updateFocusState();
        this.updateSelectionState();
    }

    /**
     * Renders a black square
     */
    renderBlackSquare() {
        this.element.classList.add('black');
    }

    /**
     * Renders a letter square
     */
    renderLetterSquare() {
        // Apply background color if set
        if (this.color) {
            this.element.style.backgroundColor = this.color;
        }
        
        // Create input element for letter squares (this is crucial for CSS styling)
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.value = this.value || '';
        
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

    /**
     * Renders a single clue square
     */
    renderSingleClueSquare() {
        // Create text content display
        const textContent = document.createElement('div');
        textContent.className = 'clue-text-content';
        textContent.textContent = this.value || '';
        
        // Apply styles to match CSS - let CSS variables handle the sizing
        textContent.style.fontFamily = 'Arial, sans-serif';
        textContent.style.textTransform = 'uppercase';
        textContent.style.textAlign = 'center';
        textContent.style.width = '90%';
        textContent.style.height = '90%';
        textContent.style.wordWrap = 'break-word';
        textContent.style.overflowWrap = 'break-word';
        textContent.style.hyphens = 'auto';
        textContent.style.display = 'flex';
        textContent.style.alignItems = 'center';
        textContent.style.justifyContent = 'center';
        textContent.style.lineHeight = '1.1';
        textContent.style.fontSize = 'var(--font-xs)'; // Use CSS variable instead of fixed size
        
        this.element.appendChild(textContent);

        // Create hidden textarea
        const textarea = document.createElement('textarea');
        textarea.value = this.value || '';
        textarea.rows = 2;
        textarea.maxLength = 100;
        textarea.style.display = 'none';
        textarea.style.position = 'absolute';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.border = 'none';
        textarea.style.background = 'transparent';
        textarea.style.resize = 'none';
        textarea.style.outline = 'none';
        textarea.style.textAlign = 'center';
        
        // Use consistent font styling with CSS variables
        textarea.style.fontSize = 'var(--font-xs)';
        textarea.style.fontFamily = 'Arial, sans-serif';
        textarea.style.textTransform = 'uppercase';
        textarea.style.lineHeight = '1.1';
        textarea.style.wordWrap = 'break-word';
        textarea.style.overflowWrap = 'break-word';
        textarea.style.hyphens = 'auto';
        
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

    /**
     * Renders a split clue square
     */
    renderSplitClueSquare() {
        // Create text content display
        const textContent = document.createElement('div');
        textContent.className = 'clue-text-content';
        textContent.style.display = 'flex';
        textContent.style.flexDirection = 'column';
        textContent.style.height = '100%';
        textContent.style.width = '90%';
        
        const textPart1 = document.createElement('div');
        textPart1.className = 'clue-text-part';
        textPart1.textContent = this.value1 || '';
        // Use CSS variable for consistent sizing that works with scaling
        textPart1.style.fontSize = 'var(--font-xs)'; // Consistent small size
        textPart1.style.fontFamily = 'Arial, sans-serif';
        textPart1.style.textTransform = 'uppercase';
        textPart1.style.textAlign = 'center';
        textPart1.style.height = '45%';
        textPart1.style.display = 'flex';
        textPart1.style.alignItems = 'center';
        textPart1.style.justifyContent = 'center';
        textPart1.style.wordWrap = 'break-word';
        textPart1.style.overflowWrap = 'break-word';
        textPart1.style.hyphens = 'auto';
        textPart1.style.lineHeight = '1.1';
        
        const textPart2 = document.createElement('div');
        textPart2.className = 'clue-text-part';
        textPart2.textContent = this.value2 || '';
        // Use CSS variable for consistent sizing that works with scaling
        textPart2.style.fontSize = 'var(--font-xs)'; // Consistent small size
        textPart2.style.fontFamily = 'Arial, sans-serif';
        textPart2.style.textTransform = 'uppercase';
        textPart2.style.textAlign = 'center';
        textPart2.style.height = '45%';
        textPart2.style.display = 'flex';
        textPart2.style.alignItems = 'center';
        textPart2.style.justifyContent = 'center';
        textPart2.style.wordWrap = 'break-word';
        textPart2.style.overflowWrap = 'break-word';
        textPart2.style.hyphens = 'auto';
        textPart2.style.lineHeight = '1.1';
        
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

    /**
     * Creates a textarea element with standard properties
     * @param {string} value - Initial value
     * @param {number} rows - Number of rows
     * @param {number} maxLength - Maximum length
     * @returns {HTMLElement} Textarea element
     */
    createTextarea(value, rows, maxLength) {
        const textarea = document.createElement('textarea');
        textarea.value = value || '';
        textarea.rows = rows;
        textarea.maxLength = maxLength;
        textarea.style.display = 'none';
        textarea.style.position = 'absolute';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '100%';
        textarea.style.height = rows > 1 ? '100%' : '45%';
        textarea.style.border = 'none';
        textarea.style.background = 'transparent';
        textarea.style.resize = 'none';
        textarea.style.outline = 'none';
        textarea.style.textAlign = 'center';
        
        // Set font styles to match CSS - use CSS variables for proper scaling
        textarea.style.fontSize = 'var(--font-xs)'; // Consistent small size
        textarea.style.fontFamily = 'Arial, sans-serif';
        textarea.style.textTransform = 'uppercase';
        textarea.style.lineHeight = rows > 1 ? '1.1' : '1';
        textarea.style.wordWrap = 'break-word';
        textarea.style.overflowWrap = 'break-word';
        textarea.style.hyphens = 'auto';
        
        return textarea;
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
     * Gets the input element for this square (for NavigationManager compatibility)
     * @returns {HTMLElement|null} Input or textarea element
     */
    getInputElement() {
        if (this.type === 'letter') {
            return this.element.querySelector('input');
        } else if (this.type === 'clue') {
            return this.element.querySelector('textarea');
        }
        return null;
    }

    /**
     * Gets all textarea elements (for split clues)
     * @returns {NodeList} All textarea elements in this square
     */
    getTextareaElements() {
        return this.element.querySelectorAll('textarea');
    }

    /**
     * Focuses the appropriate input element
     */
    focus() {
        const inputElement = this.getInputElement();
        if (inputElement) {
            inputElement.focus();
        } else {
            this.element.focus();
        }
    }

    /**
     * Updates the underlying grid data
     */
    updateGridData() {
        const cell = this.crosswordGrid.getCell(this.row, this.col);
        if (cell) {
            cell.type = this.type;
            cell.value = this.value;
            cell.value1 = this.value1;
            cell.value2 = this.value2;
            cell.split = this.split;
            cell.arrow = this.arrow;
            cell.borders = { ...this.borders };
            cell.color = this.color;
            cell.imageClue = this.imageClue;
        }
    }

    /**
     * Loads data from grid cell into this square
     */
    loadFromGridData() {
        const cell = this.crosswordGrid.getCell(this.row, this.col);
        if (cell) {
            this.type = cell.type || 'letter';
            this.value = cell.value || '';
            this.value1 = cell.value1 || '';
            this.value2 = cell.value2 || '';
            this.split = cell.split || false;
            this.arrow = cell.arrow || null;
            this.borders = { ...cell.borders } || { top: false, bottom: false, left: false, right: false };
            this.color = cell.color || null;
            this.imageClue = cell.imageClue || null;
        }
    }

    /**
     * Gets the current value of this square
     * @returns {string} The square's value
     */
    getValue() {
        return this.value;
    }

    /**
     * Gets the type of this square
     * @returns {string} The square's type
     */
    getType() {
        return this.type;
    }

    /**
     * Checks if this square is currently being edited
     * @returns {boolean} True if editing
     */
    isBeingEdited() {
        return this.isEditing;
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
