// Define color names once for all color menu logic
const COLOR_NAMES = ['white', 'pink', 'blue', 'green', 'yellow', 'purple', 'orange'];
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
        this.addMenuItem(menu, 'Add/Change Arrow', null, false, () => this.showSubmenu('arrow', menu));
        // Remove Arrow
        this.addMenuItem(menu, 'Remove Arrow', () => this.actionRemoveArrow());
        // Border submenu
        this.addMenuItem(menu, 'Add/Edit Borders', null, false, () => this.showSubmenu('border', menu));
        this.addMenuItem(menu, 'Remove All Borders', () => this.actionRemoveAllBorders());
        // Color submenu
        this.addMenuItem(menu, 'Change Color', null, false, () => this.showSubmenu('color', menu));
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
        this.addMenuItem(menu, '↳', () => this.actionArrowTopToRight());
        this.addMenuItem(menu, '↴', () => this.actionArrowLeftToDown());
    }

    populateBorderSubmenu(menu) {
        this.addMenuItem(menu, 'Bottom border', () => this.actionBorderBottom());
        this.addMenuItem(menu, 'Right border', () => this.actionBorderRight());
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
                color // pass color name for swatch
            );
        });
    }

    createMenuDiv(className) {
        const menu = document.createElement('div');
        menu.className = className;
        menu.style.position = 'absolute';
        return menu;
    }

    addMenuItem(menu, text, onClick, closeMenus = true, onHover = null, colorSwatch = null) {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        if (colorSwatch) {
            const swatch = document.createElement('span');
            swatch.className = 'square-color square-color-' + colorSwatch + ' color-menu-swatch';
            item.appendChild(swatch);
        }
        const labelSpan = document.createElement('span');
        labelSpan.textContent = text;
        item.appendChild(labelSpan);
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
        menu.appendChild(item);
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
        // Fix: re-attach correct onclick for submenu items (in case DOM is reused)
        Array.from(submenu.children).forEach((item, idx) => {
            let handler = null;
            if (type === 'arrow') {
                handler = idx === 0 ? this.actionArrowTopToRight.bind(this) : this.actionArrowLeftToDown.bind(this);
            } else if (type === 'border') {
                handler = idx === 0 ? this.actionBorderBottom.bind(this) : this.actionBorderRight.bind(this);
            } else if (type === 'color') {
                const color = COLOR_NAMES[idx];
                handler = () => this.actionSetColor(color);
            }
            if (handler) {
                item.onclick = (e) => {
                    e.stopPropagation();
                    handler();
                    this.hideAllMenus();
                };
            }
        });
    }

    // --- Action methods with debug output ---
    actionChangeToClue() {
        console.debug('ContextMenu: Change current square to Clue Square');
    }
    actionChangeToBlack() {
        console.debug('ContextMenu: Change current square to Black Square');
    }
    actionRemoveArrow() {
        console.debug('ContextMenu: Remove arrow from current square');
    }
    actionRemoveAllBorders() {
        console.debug('ContextMenu: Remove all borders from current square');
    }
    actionRemoveColor() {
        console.debug('ContextMenu: Remove background color from current square');
    }
    actionChangeToLetter() {
        console.debug('ContextMenu: Change current square to Letter Square');
    }
    actionArrowTopToRight() {
        console.debug('ContextMenu: Set arrow direction to Top-to-Right for current square');
    }
    actionArrowLeftToDown() {
        console.debug('ContextMenu: Set arrow direction to Left-to-Down for current square');
    }
    actionBorderBottom() {
        console.debug('ContextMenu: Toggle bottom border for current square');
    }
    actionBorderRight() {
        console.debug('ContextMenu: Toggle right border for current square');
    }
    actionSetColor(color) {
        console.debug('ContextMenu: Set background color to', color === null ? 'Default (White)' : color, 'for current square');
    }
}

