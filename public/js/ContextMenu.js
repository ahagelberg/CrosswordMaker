/**
 * ContextMenu - Manages all context menu functionality
 */
class ContextMenu {
    constructor() {
        console.log('Creating ContextMenu');
        this.crossword = null; // Will be set by setCrossword()
        this.navigationManager = null; // Will be set by setCrossword()
        this.onGridChange = null; // Callback for when grid changes
    }

    /**
     * Set the crossword instance this manager works with
     * @param {Crossword} crossword - The crossword instance
     */
    setCrossword(crossword) {
        console.log('ContextMenu setCrossword');
        this.crossword = crossword;
        this.navigationManager = crossword.navigationManager;
    }

    /**
     * Sets callback for grid changes
     * @param {Function} callback - Callback function
     */
    setOnGridChange(callback) {
        this.onGridChange = callback;
    }

    /**
     * Shows a context menu when right-clicking on a square
     * @param {MouseEvent} e - The right-click event
     * @param {number} r - Row index of the clicked square
     * @param {number} c - Column index of the clicked square
     */
    show(e, r, c) {
        e.preventDefault();
        
        // Remove any existing context menu
        this.removeExistingMenus();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'absolute';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        
        const cell = this.crossword.getCell(r, c);
        
        if (cell.type === 'letter') {
            this.addLetterSquareOptions(menu, r, c, cell);
        } else if (cell.type === 'clue') {
            this.addClueSquareOptions(menu, r, c, cell);
        } else if (cell.type === 'black') {
            this.addBlackSquareOptions(menu, r, c, cell);
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
     * Removes any existing context menus
     * @param {string} [selector] - Optional selector to remove specific menus
     */
    removeExistingMenus(selector = null) {
        const defaultSelector = '.context-menu, .arrow-submenu, .border-submenu, .color-submenu';
        const targetSelector = selector || defaultSelector;
        const existingMenus = document.querySelectorAll(targetSelector);
        existingMenus.forEach(menu => menu.remove());
    }

    /**
     * Adds context menu options for letter squares
     * @param {HTMLElement} menu - Menu element
     * @param {number} r - Row index
     * @param {number} c - Column index
     * @param {Object} cell - Cell data
     */
    addLetterSquareOptions(menu, r, c, cell) {
        // Change to Clue Square
        this.addMenuItem(menu, 'Change to Clue Square', () => {
            this.crossword.setCellType(r, c, 'clue');
            this.triggerGridChange();
            this.restoreFocus(r, c, null);
        });

        // Change to Black Square
        this.addMenuItem(menu, 'Change to Black Square', () => {
            this.crossword.setCellType(r, c, 'black');
            this.triggerGridChange();
            this.restoreFocus(r, c, null);
        });

        // Arrow options
        const arrowText = cell.arrow ? 'Change Arrow' : 'Add Arrow';
        this.addMenuItem(menu, arrowText, (e) => {
            // Don't close menus for submenu triggers
        }, false);
        
        // Add click handler for submenu
        const arrowMenuItem = menu.lastChild;
        arrowMenuItem.onclick = (e) => {
            e.stopPropagation();
            this.showArrowSubmenu(e, r, c);
        };

        // Remove arrow option if arrow exists
        if (cell.arrow) {
            this.addMenuItem(menu, 'Remove Arrow', () => {
                this.crossword.setCellArrow(r, c, null);
                this.restoreFocus(r, c, null);
            });
        }

        // Border options
        const hasBorders = cell.borders && (cell.borders.bottom || cell.borders.right);
        const borderText = hasBorders ? 'Edit Borders' : 'Add Borders';
        this.addMenuItem(menu, borderText, (e) => {
            // Don't close menus for submenu triggers
        }, false);
        
        // Add click handler for submenu
        const borderMenuItem = menu.lastChild;
        borderMenuItem.onclick = (e) => {
            e.stopPropagation();
            this.showBorderSubmenu(e, r, c);
        };

        // Remove all borders option if borders exist
        if (hasBorders) {
            this.addMenuItem(menu, 'Remove All Borders', () => {
                this.crossword.setCell(r, c, { 
                    borders: { top: false, bottom: false, left: false, right: false } 
                });
                this.triggerGridChange();
                this.restoreFocus(r, c, null);
            });
        }

        // Color options
        this.addMenuItem(menu, 'Change Color', (e) => {
            // Don't close menus for submenu triggers
        }, false);
        
        // Add click handler for submenu
        const colorMenuItem = menu.lastChild;
        colorMenuItem.onclick = (e) => {
            e.stopPropagation();
            this.showColorSubmenu(e, r, c);
        };

        // Remove color option if color is set
        if (cell.color) {
            this.addMenuItem(menu, 'Remove Color', () => {
                this.crossword.setCellColor(r, c, null);
                this.restoreFocus(r, c, null);
            });
        }

        // Image clue options
        if (cell.imageClue) {
            this.addMenuItem(menu, 'Remove Image', () => {
                this.crossword.removeImageClue(r, c);
                this.triggerGridChange();
                this.restoreFocus(r, c, null);
            });
        } else {
            this.addMenuItem(menu, 'Add Image Clue', () => {
                this.showImageClueDialog(r, c);
            });
        }
    }

    /**
     * Adds context menu options for clue squares
     * @param {HTMLElement} menu - Menu element
     * @param {number} r - Row index
     * @param {number} c - Column index
     * @param {Object} cell - Cell data
     */
    addClueSquareOptions(menu, r, c, cell) {
        // Change to Letter Square
        this.addMenuItem(menu, 'Change to Letter Square', () => {
            this.crossword.setCellType(r, c, 'letter');
            this.triggerGridChange();
            this.restoreFocus(r, c, null);
        });

        // Change to Black Square
        this.addMenuItem(menu, 'Change to Black Square', () => {
            this.crossword.setCellType(r, c, 'black');
            this.triggerGridChange();
            this.restoreFocus(r, c, null);
        });

        // Split/Unsplit options
        if (!cell.split) {
            this.addMenuItem(menu, 'Split Horizontally', () => {
                this.crossword.splitClueCell(r, c);
                this.triggerGridChange();
                this.restoreFocus(r, c, 'first');
            });
        } else {
            this.addMenuItem(menu, 'Remove Split', () => {
                this.crossword.unsplitClueCell(r, c);
                this.triggerGridChange();
                this.restoreFocus(r, c, null);
            });
        }
    }

    /**
     * Adds context menu options for black squares
     * @param {HTMLElement} menu - Menu element
     * @param {number} r - Row index
     * @param {number} c - Column index
     * @param {Object} cell - Cell data
     */
    addBlackSquareOptions(menu, r, c, cell) {
        // Convert to Letter Square
        this.addMenuItem(menu, 'Convert to Letter Square', () => {
            this.crossword.setCellType(r, c, 'letter');
            this.triggerGridChange();
            this.restoreFocus(r, c, null);
        });

        // Convert to Clue Square
        this.addMenuItem(menu, 'Convert to Clue Square', () => {
            this.crossword.setCellType(r, c, 'clue');
            this.triggerGridChange();
            this.restoreFocus(r, c, null);
        });
    }

    /**
     * Adds a menu item to the context menu
     * @param {HTMLElement} menu - Menu element
     * @param {string} text - Menu item text
     * @param {Function} onClick - Click handler
     * @param {boolean} [closeMenus=true] - Whether to close menus after click
     */
    addMenuItem(menu, text, onClick, closeMenus = true) {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.textContent = text;
        item.onclick = () => {
            onClick();
            if (closeMenus) {
                this.removeExistingMenus();
            }
        };
        menu.appendChild(item);
    }

    /**
     * Shows arrow submenu
     * @param {MouseEvent} e - Click event
     * @param {number} r - Row index
     * @param {number} c - Column index
     */
    showArrowSubmenu(e, r, c) {
        this.removeExistingMenus('.arrow-submenu');
        
        const submenu = document.createElement('div');
        submenu.className = 'context-menu arrow-submenu';
        submenu.style.position = 'absolute';
        submenu.style.left = (e.pageX + 150) + 'px';
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
                this.crossword.setCellArrow(r, c, option.value);
                this.restoreFocus(r, c, null);
                this.removeExistingMenus(); // Close all menus after action
            };
            submenu.appendChild(item);
        });
        
        document.body.appendChild(submenu);
        this.setupSubmenuRemoval(submenu);
    }

    /**
     * Shows border submenu
     * @param {MouseEvent} e - Click event
     * @param {number} r - Row index
     * @param {number} c - Column index
     */
    showBorderSubmenu(e, r, c) {
        this.removeExistingMenus('.border-submenu');
        
        const submenu = document.createElement('div');
        submenu.className = 'context-menu border-submenu';
        submenu.style.position = 'absolute';
        submenu.style.left = (e.pageX + 150) + 'px';
        submenu.style.top = e.pageY + 'px';
        
        const borderOptions = [
            { value: 'bottom', description: 'Bottom border' },
            { value: 'right', description: 'Right border' }
        ];
        
        const cell = this.crossword.getCell(r, c);
        
        borderOptions.forEach(option => {
            const item = document.createElement('div');
            item.className = 'context-menu-item border-option';
            
            // Create visual representation
            const visual = this.createBorderVisual(option.value);
            const label = document.createElement('span');
            label.textContent = option.description;
            
            item.appendChild(visual);
            item.appendChild(label);
            
            // Check if this border is already active
            if (cell.borders && cell.borders[option.value]) {
                item.classList.add('active');
            }
            
            item.onclick = () => {
                const currentState = cell.borders?.[option.value] || false;
                this.crossword.setCellBorder(r, c, option.value, !currentState);
                this.triggerGridChange();
                this.restoreFocus(r, c, null);
                this.removeExistingMenus(); // Close all menus after action
            };
            
            submenu.appendChild(item);
        });
        
        document.body.appendChild(submenu);
        this.setupSubmenuRemoval(submenu);
    }

    /**
     * Gets color options from CSS custom properties
     * @returns {Array} Array of color option objects
     */
    getColorOptions() {
        const rootStyles = getComputedStyle(document.documentElement);
        
        return [
            {
                value: null,
                name: 'Default (White)',
                color: rootStyles.getPropertyValue('--square-color-default').trim()
            },
            {
                value: rootStyles.getPropertyValue('--square-color-pink').trim(),
                name: 'Pink',
                color: rootStyles.getPropertyValue('--square-color-pink').trim()
            },
            {
                value: rootStyles.getPropertyValue('--square-color-blue').trim(),
                name: 'Blue',
                color: rootStyles.getPropertyValue('--square-color-blue').trim()
            },
            {
                value: rootStyles.getPropertyValue('--square-color-green').trim(),
                name: 'Green',
                color: rootStyles.getPropertyValue('--square-color-green').trim()
            },
            {
                value: rootStyles.getPropertyValue('--square-color-yellow').trim(),
                name: 'Yellow',
                color: rootStyles.getPropertyValue('--square-color-yellow').trim()
            },
            {
                value: rootStyles.getPropertyValue('--square-color-purple').trim(),
                name: 'Purple',
                color: rootStyles.getPropertyValue('--square-color-purple').trim()
            },
            {
                value: rootStyles.getPropertyValue('--square-color-orange').trim(),
                name: 'Orange',
                color: rootStyles.getPropertyValue('--square-color-orange').trim()
            }
        ];
    }

    /**
     * Shows color submenu
     * @param {MouseEvent} e - Click event
     * @param {number} r - Row index
     * @param {number} c - Column index
     */
    showColorSubmenu(e, r, c) {
        this.removeExistingMenus('.color-submenu');
        
        const submenu = document.createElement('div');
        submenu.className = 'context-menu color-submenu';
        submenu.style.position = 'absolute';
        submenu.style.left = (e.pageX + 150) + 'px';
        submenu.style.top = e.pageY + 'px';
        
        const colorOptions = this.getColorOptions();
        
        const cell = this.crossword.getCell(r, c);
        
        colorOptions.forEach(option => {
            const item = document.createElement('div');
            item.className = 'context-menu-item color-option';
            
            // Create color swatch
            const colorSwatch = this.createColorSwatch(option.color);
            const label = document.createElement('span');
            label.textContent = option.name;
            
            item.appendChild(colorSwatch);
            item.appendChild(label);
            
            // Check if this color is currently active
            if (cell.color === option.value) {
                item.classList.add('active');
            }
            
            item.onclick = () => {
                this.crossword.setCellColor(r, c, option.value);
                this.restoreFocus(r, c, null);
                this.removeExistingMenus(); // Close all menus after action
            };
            
            submenu.appendChild(item);
        });
        
        document.body.appendChild(submenu);
        this.setupSubmenuRemoval(submenu);
    }

    /**
     * Shows image clue dialog
     * @param {number} r - Row index  
     * @param {number} c - Column index
     */
    showImageClueDialog(r, c) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'image-clue-modal';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'image-clue-modal-content';

        const title = document.createElement('h3');
        title.textContent = 'Add Image Clue';
        modalContent.appendChild(title);

        // Selection area inputs
        const selectionDiv = document.createElement('div');
        selectionDiv.innerHTML = `
            <p>Select area (from row ${r+1}, col ${c+1}):</p>
            <label>To Row: <input type="number" id="endRow" min="${r+1}" max="${this.crossword.rows}" value="${r+1}"></label><br><br>
            <label>To Col: <input type="number" id="endCol" min="${c+1}" max="${this.crossword.cols}" value="${c+1}"></label><br><br>
        `;
        modalContent.appendChild(selectionDiv);

        // File input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        modalContent.appendChild(fileInput);

        // Preview area
        const preview = document.createElement('img');
        preview.className = 'image-clue-preview';
        modalContent.appendChild(preview);

        // Buttons
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'image-clue-buttons';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => modal.remove();

        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Image';
        addBtn.disabled = true;

        buttonDiv.appendChild(cancelBtn);
        buttonDiv.appendChild(addBtn);
        modalContent.appendChild(buttonDiv);

        let imageData = null;

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imageData = event.target.result;
                    preview.src = imageData;
                    preview.classList.add('visible');
                    addBtn.disabled = false;
                };
                reader.readAsDataURL(file);
            }
        };

        addBtn.onclick = () => {
            const endRow = parseInt(document.getElementById('endRow').value) - 1;
            const endCol = parseInt(document.getElementById('endCol').value) - 1;

            // Check for conflicts
            if (this.crossword.checkImageConflict(r, c, endRow, endCol)) {
                alert('The selected area conflicts with existing image clues. Please choose a different area.');
                return;
            }

            // Place the image clue
            this.crossword.placeImageClue(r, c, endRow, endCol, imageData);
            this.triggerGridChange();
            modal.remove();
        };

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
     * Creates a border visual element
     * @param {string} side - Border side
     * @returns {HTMLElement} Visual element
     */
    createBorderVisual(side) {
        const visual = document.createElement('div');
        visual.className = `border-visual border-${side}`;
        return visual;
    }

    /**
     * Creates a color swatch element
     * @param {string} color - Color value
     * @returns {HTMLElement} Color swatch element
     */
    createColorSwatch(color) {
        const colorSwatch = document.createElement('div');
        colorSwatch.className = 'color-swatch';
        colorSwatch.style.backgroundColor = color;
        return colorSwatch;
    }

    /**
     * Sets up submenu removal on outside click
     * @param {HTMLElement} submenu - Submenu element
     */
    setupSubmenuRemoval(submenu) {
        const removeSubmenu = () => {
            submenu.remove();
            document.removeEventListener('click', removeSubmenu);
        };
        setTimeout(() => document.addEventListener('click', removeSubmenu), 100);
    }

    /**
     * Triggers grid change callback
     */
    triggerGridChange() {
        if (this.onGridChange) {
            this.onGridChange();
        }
    }

    /**
     * Restores focus to a square after menu action
     * @param {number} r - Row index
     * @param {number} c - Column index
     * @param {string|null} subSquare - Sub-square identifier
     */
    restoreFocus(r, c, subSquare) {
        this.navigationManager.updateFocusedSquare(r, c, subSquare);
        setTimeout(() => this.navigationManager.focusSquare(r, c, subSquare), 10);
    }
}
