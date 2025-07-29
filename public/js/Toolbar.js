// Toolbar.js
// Handles toolbar UI and dispatches events for app communication

class Toolbar {
    constructor(elements) {
        this.elements = elements;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.elements.languageSelect.onchange = () => {
            document.dispatchEvent(new CustomEvent('command:languageChange', {
                detail: { language: this.elements.languageSelect.value }
            }));
        };

        this.elements.titleInput.oninput = () => {
            document.dispatchEvent(new CustomEvent('command:titleChange', {
                detail: { title: this.elements.titleInput.value }
            }));
        };

        this.elements.resizeBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('command:resizeGrid'));
        };

        this.elements.saveBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('command:savePuzzle'));
        };

        this.elements.loadBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('command:loadPuzzle'));
        };

        this.elements.downloadBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('command:downloadPuzzle'));
        };

        this.elements.uploadBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('command:uploadPuzzle'));
        };

        this.elements.printBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('command:printBlank'));
        };

        this.elements.printKeyBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('command:printKey'));
        };
    }

    setLanguage(language) {
        this.elements.languageSelect.value = language;
    }

    setTitle(title) {
        this.elements.titleInput.value = title;
    }

    setRows(rows) {
        this.elements.rowsInput.value = rows;
    }

    setCols(cols) {
        this.elements.colsInput.value = cols;
    }
}

