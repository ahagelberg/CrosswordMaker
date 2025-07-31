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
        if (type === 'letter') menu = this.menus.letter;
        else if (type === 'clue') menu = this.menus.clue;
        else if (type === 'black') menu = this.menus.black;
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
            menu.style.display = 'none';
        });
    }

    // --- Menu creation ---
    populateLetterMenu(menu) {
        this.addMenuItem(menu, 'Change to Clue Square', () => this.actionChangeToClue());
        this.addMenuItem(menu, 'Change to Black Square', () => this.actionChangeToBlack());
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
    }

    populateBlackMenu(menu) {
        this.addMenuItem(menu, 'Convert to Letter Square', () => this.actionChangeToLetter());
        this.addMenuItem(menu, 'Convert to Clue Square', () => this.actionChangeToClue());
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
        console.debug('ContextMenu: Change current square to Letter Square');
    }
    actionChangeToClue() {
        console.debug('ContextMenu: Change current square to Clue Square');
    }
    actionChangeToBlack() {
        console.debug('ContextMenu: Change current square to Black Square');
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
}

