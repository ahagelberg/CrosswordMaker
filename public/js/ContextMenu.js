// Define color names once for all color menu logic
const COLOR_NAMES = ['white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange'];
/**
 * ContextMenu - Manages all context menu functionality
 */

class ContextMenu {
    constructor() {
        console.log('Creating ContextMenu');
        this.crossword = null;
        this.navigationManager = null;
        this.onGridChange = null;
        this.currentSquare = null;
        this.menus = {};
        this.createStaticMenus();
        document.addEventListener('contextmenu:show', (e) => {
            const { event, square } = e.detail || {};
            this.show(event || e, square);
        });
        document.addEventListener('contextmenu:hide', () => {
            this.hideAllMenus();
        });
    }

    createStaticMenus() {
        // Create empty menu elements and add to DOM first
        this.menus.letter = this.createMenuDiv('context-menu');
        this.menus.clue = this.createMenuDiv('context-menu');
        this.menus.black = this.createMenuDiv('context-menu');
        this.menus.split = this.createMenuDiv('context-menu'); // Add split cell menu
        this.menus.arrow = this.createMenuDiv('context-menu arrow-submenu');
        this.menus.border = this.createMenuDiv('context-menu border-submenu');
        this.menus.color = this.createMenuDiv('context-menu color-submenu');
        Object.values(this.menus).forEach(menu => {
            menu.style.display = 'none';
            document.body.appendChild(menu);
        });
        // Now add menu items (event listeners will work)
        this.populateLetterMenu(this.menus.letter);
        this.populateClueMenu(this.menus.clue);
        this.populateBlackMenu(this.menus.black);
        this.populateSplitMenu(this.menus.split); // Add split cell menu population
        this.populateArrowSubmenu(this.menus.arrow);
        this.populateBorderSubmenu(this.menus.border);
        this.populateColorSubmenu(this.menus.color);
    }

    show(e, square) {
        e.preventDefault();
        this.hideAllMenus();
        if (!square) return;
        this.currentSquare = square;
        
        // Determine menu type
        const type = square.getSquareType ? square.getSquareType() : (square.type || 'letter');
        
        let menu = null;
        let isSubcell = square.isSubcell || false;
        
        if (isSubcell) {
            // For subcells, use the menu for their type but add unsplit option
            if (type === 'letter') {
                menu = this.menus.letter;
                this.addUnsplitOption(menu);
            } else if (type === 'clue') {
                menu = this.menus.clue; 
                this.addUnsplitOption(menu);
            } else if (type === 'black') {
                menu = this.menus.black;
                this.addUnsplitOption(menu);
            }
        } else {
            // Regular cells
            if (type === 'letter') menu = this.menus.letter;
            else if (type === 'clue') menu = this.menus.clue;
            else if (type === 'black') menu = this.menus.black;
            else if (type === 'split') menu = this.menus.split;
        }
        
        if (!menu) return;
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.style.display = 'block';
        // Hide submenus
        this.menus.arrow.style.display = 'none';
        this.menus.border.style.display = 'none';
        this.menus.color.style.display = 'none';
        // Remove previous outside click handler
        if (this._removeMenuHandler) {
            document.removeEventListener('mousedown', this._removeMenuHandler);
            this._removeMenuHandler = null;
        }
        this._removeMenuHandler = (ev) => {
            if (!menu.contains(ev.target) &&
                !this.menus.arrow.contains(ev.target) &&
                !this.menus.border.contains(ev.target) &&
                !this.menus.color.contains(ev.target)) {
                this.hideAllMenus();
                document.removeEventListener('mousedown', this._removeMenuHandler);
                this._removeMenuHandler = null;
            }
        };
        setTimeout(() => document.addEventListener('mousedown', this._removeMenuHandler), 0);
    }

    hideAllMenus() {
        Object.values(this.menus).forEach(menu => {
            if (menu && menu.style) {
                menu.style.display = 'none';
                // Remove unsplit options when hiding menus
                this.removeUnsplitOption(menu);
            }
        });
    }

    addUnsplitOption(menu) {
        // Remove any existing unsplit option first
        this.removeUnsplitOption(menu);
        
        // Add separator
        const separator = document.createElement('div');
        separator.className = 'context-menu-separator';
        separator.dataset.unsplitItem = 'true';
        menu.appendChild(separator);
        
        // Add unsplit option
        const unsplitItem = document.createElement('div');
        unsplitItem.className = 'context-menu-item';
        unsplitItem.textContent = 'Unsplit Cell';
        unsplitItem.dataset.unsplitItem = 'true';
        unsplitItem.addEventListener('click', () => this.actionUnsplit());
        menu.appendChild(unsplitItem);
    }

    removeUnsplitOption(menu) {
        // Remove any existing unsplit items
        const unsplitItems = menu.querySelectorAll('[data-unsplit-item="true"]');
        unsplitItems.forEach(item => item.remove());
    }

    // --- Menu creation ---
    populateLetterMenu(menu) {
        this.addMenuItem(menu, 'Change to Clue Square', () => this.actionChangeToClue());
        this.addMenuItem(menu, 'Change to Black Square', () => this.actionChangeToBlack());
        this.addMenuItem(menu, 'Split Cell Horizontally', () => this.actionSplitCell('horizontal'));
        this.addMenuItem(menu, 'Split Cell Vertically', () => this.actionSplitCell('vertical'));
        // Arrow submenu
        this.addMenuItem(menu, 'Arrows', null, false, () => this.showSubmenu('arrow', menu));
        // Border submenu
        this.addMenuItem(menu, 'Borders', null, false, () => this.showSubmenu('border', menu));
        // Color submenu
        this.addMenuItem(menu, 'Color', null, false, () => this.showSubmenu('color', menu));
    }

    populateClueMenu(menu) {
        this.addMenuItem(menu, 'Change to Letter Square', () => this.actionChangeToLetter());
        this.addMenuItem(menu, 'Change to Black Square', () => this.actionChangeToBlack());
        this.addMenuItem(menu, 'Split Cell Horizontally', () => this.actionSplitCell('horizontal'));
        this.addMenuItem(menu, 'Split Cell Vertically', () => this.actionSplitCell('vertical'));
    }

    populateBlackMenu(menu) {
        this.addMenuItem(menu, 'Convert to Letter Square', () => this.actionChangeToLetter());
        this.addMenuItem(menu, 'Convert to Clue Square', () => this.actionChangeToClue());
        this.addMenuItem(menu, 'Split Cell Horizontally', () => this.actionSplitCell('horizontal'));
        this.addMenuItem(menu, 'Split Cell Vertically', () => this.actionSplitCell('vertical'));
    }

    populateSplitMenu(menu) {
        this.addMenuItem(menu, 'Change to Letter Square', () => this.actionChangeToLetter());
        this.addMenuItem(menu, 'Change to Clue Square', () => this.actionChangeToClue());
        this.addMenuItem(menu, 'Change to Black Square', () => this.actionChangeToBlack());
        this.addMenuItem(menu, 'Toggle Orientation', () => this.actionToggleSplitOrientation());
    }

    populateArrowSubmenu(menu) {
        this.addMenuItem(menu, 'None', () => this.actionSetArrow('none'), true, null, null);
        this.addMenuItem(menu, '↳', () => this.actionSetArrow('top-to-right'), true, null, null);
        this.addMenuItem(menu, '↴', () => this.actionSetArrow('left-to-down'), true, null, null);
    }

    populateBorderSubmenu(menu) {
        this.addMenuItem(menu, 'None', () => this.actionSetBorder('none'), true, null, 'border-menu-none');
        this.addMenuItem(menu, 'Bottom border', () => this.actionSetBorder('bottom'), true, null, 'border-menu-bottom');
        this.addMenuItem(menu, 'Right border', () => this.actionSetBorder('right'), true, null, 'border-menu-right');
    }

    populateColorSubmenu(menu) {
        COLOR_NAMES.forEach(color => {
            const label = color.charAt(0).toUpperCase() + color.slice(1);
            this.addMenuItem(
                menu,
                label,
                () => this.actionSetColor(color),
                true,
                null,
                'square-color-' + color // pass color name for swatch
            );
        });
    }

    createMenuDiv(className) {
        const menu = document.createElement('div');
        menu.className = className;
        menu.style.position = 'absolute';
        return menu;
    }

    addMenuItem(menu, text, onClick, closeMenus = true, onHover = null, iconClass = null) {
        // Create menu item element
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        // Add icon
        if (iconClass) {
            const icon = document.createElement('span');
            icon.className = 'context-menu-icon';
            icon.classList.add(iconClass);
            item.appendChild(icon);
        }
        // Add text label
        const labelSpan = document.createElement('span');
        labelSpan.textContent = text;
        item.appendChild(labelSpan);
        // Append item to menu
        menu.appendChild(item);
        // Set click and hover handlers
        item.onclick = (e) => {
            e.stopPropagation();
            if (onClick) onClick();
            if (closeMenus) this.hideAllMenus();
        };
        if (onHover) {
            item.classList.add('has-submenu');
            item.onmouseenter = (e) => {
                onHover(e);
            };
        }
    }

    showSubmenu(type, parentMenu) {
        // Hide all submenus
        this.menus.arrow.style.display = 'none';
        this.menus.border.style.display = 'none';
        this.menus.color.style.display = 'none';
        // Show the requested submenu next to the parent menu
        const submenu = this.menus[type];
        if (!submenu) return;
        // Find the hovered menu item
        const items = Array.from(parentMenu.querySelectorAll('.context-menu-item.has-submenu'));
        let hovered = items.find(i => i.matches(':hover'));
        if (!hovered) hovered = items[0];
        if (hovered) {
            const rect = hovered.getBoundingClientRect();
            submenu.style.left = (rect.right - 10 + window.scrollX) + 'px';
            submenu.style.top = (rect.top + window.scrollY) + 'px';
        }
        submenu.style.display = 'block';
    }

    // --- Action methods with debug output ---
    actionChangeToLetter() {
        if (this.currentSquare && this.currentSquare.isSubcell) {
            // Handle subcell type change
            const parentCell = this.currentSquare.parent;
            const subcellIndex = this.currentSquare.subIndex;
            if (parentCell && typeof parentCell.setSubcellType === 'function') {
                const newSubcell = parentCell.setSubcellType(subcellIndex, 'letter');
                if (newSubcell) {
                    this.currentSquare = newSubcell; // Update reference to new subcell
                }
            }
        } else {
            // Handle regular square type change
            const event = new CustomEvent('square:change-type', {
                detail: {
                    square: this.currentSquare,
                    type: 'letter'
                }
            });
            document.dispatchEvent(event);
        }
    }

    actionChangeToClue() {
        if (this.currentSquare && this.currentSquare.isSubcell) {
            // Handle subcell type change
            const parentCell = this.currentSquare.parent;
            const subcellIndex = this.currentSquare.subIndex;
            if (parentCell && typeof parentCell.setSubcellType === 'function') {
                const newSubcell = parentCell.setSubcellType(subcellIndex, 'clue');
                if (newSubcell) {
                    this.currentSquare = newSubcell; // Update reference to new subcell
                }
            }
        } else {
            // Handle regular square type change
            const event = new CustomEvent('square:change-type', {
                detail: {
                    square: this.currentSquare,
                    type: 'clue'
                }
            });
            document.dispatchEvent(event);
        }
    }

    actionChangeToBlack() {
        if (this.currentSquare && this.currentSquare.isSubcell) {
            // Handle subcell type change
            const parentCell = this.currentSquare.parent;
            const subcellIndex = this.currentSquare.subIndex;
            if (parentCell && typeof parentCell.setSubcellType === 'function') {
                const newSubcell = parentCell.setSubcellType(subcellIndex, 'black');
                if (newSubcell) {
                    this.currentSquare = newSubcell; // Update reference to new subcell
                }
            }
        } else {
            // Handle regular square type change
            const event = new CustomEvent('square:change-type', {
                detail: {
                    square: this.currentSquare,
                    type: 'black'
                }
            });
            document.dispatchEvent(event);
        }
    }

    actionSetArrow(arrow = 'none') {
        if (typeof this.currentSquare.setArrow === 'function') {
            this.currentSquare.setArrow(arrow);
        }
    }
    
    actionSetBorder(border = 'none') {
        if (border === 'none' && typeof this.currentSquare.removeBorder === 'function') {
            this.currentSquare.removeBorder();
        }
        if (typeof this.currentSquare.toggleBorder === 'function') {
            this.currentSquare.toggleBorder(border);
        }
    }

    actionSetColor(color) {
        if (typeof this.currentSquare.setColor === 'function') {
            this.currentSquare.setColor(color);
        }
    }

    // --- Split Cell Actions ---
    actionSplitCell(orientation = 'horizontal') {
        const event = new CustomEvent('square:change-type', {
            detail: {
                square: this.currentSquare,
                type: 'split',
                orientation: orientation
            }
        });
        document.dispatchEvent(event);
    }

    actionToggleSplitOrientation() {
        let targetSplitCell = this.currentSquare;
        
        // If currentSquare is a subcell, get the parent split cell
        if (this.currentSquare && this.currentSquare.isSubcell) {
            targetSplitCell = this.currentSquare.parent;
        }
        
        if (targetSplitCell && typeof targetSplitCell.setOrientation === 'function') {
            const currentOrientation = targetSplitCell.orientation || 'horizontal';
            const newOrientation = currentOrientation === 'horizontal' ? 'vertical' : 'horizontal';
            targetSplitCell.setOrientation(newOrientation);
        }
    }

    actionUnsplit() {
        if (!this.currentSquare || !this.currentSquare.isSubcell) return;
        
        const parentCell = this.currentSquare.parent;
        const subcellType = this.currentSquare.getSquareType();
        const subcellData = {};
        
        // Extract data from the clicked subcell
        if (subcellType === 'letter') {
            subcellData.value = this.currentSquare.getValue ? this.currentSquare.getValue() : '';
            subcellData.arrow = this.currentSquare.getArrow ? this.currentSquare.getArrow() : null;
        } else if (subcellType === 'clue') {
            subcellData.text = this.currentSquare.getText ? this.currentSquare.getText() : '';
        }
        
        // Copy visual properties
        if (this.currentSquare.borders) {
            subcellData.borders = { ...this.currentSquare.borders };
        }
        if (this.currentSquare.color) {
            subcellData.color = this.currentSquare.color;
        }
        
        // Dispatch event to change the parent split cell to the subcell type
        const event = new CustomEvent('square:change-type', {
            detail: {
                square: parentCell,
                type: subcellType,
                data: subcellData
            }
        });
        document.dispatchEvent(event);
    }
}

