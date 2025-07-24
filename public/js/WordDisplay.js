/**
 * WordDisplay - Manages the word display panel next to the crossword
 */
class WordDisplay {
    constructor() {
        this.currentWord = null;
        this.panel = null;
        this.createPanel();
    }

    /**
     * Creates the word display panel
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'word-display-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            width: 250px;
            max-height: 400px;
            background: white;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            padding: 15px;
            z-index: 100;
            font-family: Arial, sans-serif;
            display: none;
            overflow-y: auto;
        `;

        // Create header
        const header = document.createElement('div');
        header.className = 'word-display-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Selected Word';
        title.style.cssText = `
            margin: 0;
            color: #333;
            font-size: 16px;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = () => this.hide();

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Create content area
        this.content = document.createElement('div');
        this.content.className = 'word-display-content';

        this.panel.appendChild(header);
        this.panel.appendChild(this.content);

        document.body.appendChild(this.panel);
    }

    /**
     * Shows a word in the display panel
     * @param {Object} word - Word object to display
     */
    show(word) {
        if (!word) {
            this.hide();
            return;
        }

        this.currentWord = word;
        this.renderWord(word);
        this.panel.style.display = 'block';
    }

    /**
     * Hides the word display panel
     */
    hide() {
        this.panel.style.display = 'none';
        this.currentWord = null;
        // Dispatch event to clear word selection
        document.dispatchEvent(new CustomEvent('crossword:clearWordSelection'));
    }

    /**
     * Renders word information in the panel
     * @param {Object} word - Word object to render
     */
    renderWord(word) {
        this.content.innerHTML = '';

        // Word direction and position
        const info = document.createElement('div');
        info.className = 'word-info';
        info.style.cssText = `
            margin-bottom: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        `;

        const direction = document.createElement('div');
        direction.style.cssText = `
            font-weight: bold;
            color: #007acc;
            margin-bottom: 5px;
        `;
        direction.textContent = `${word.direction.charAt(0).toUpperCase() + word.direction.slice(1)} Word`;

        const position = document.createElement('div');
        position.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        `;
        position.textContent = `Position: Row ${word.startRow + 1}, Col ${word.startCol + 1}`;

        const length = document.createElement('div');
        length.style.cssText = `
            font-size: 12px;
            color: #666;
        `;
        length.textContent = `Length: ${word.length} letters`;

        info.appendChild(direction);
        info.appendChild(position);
        info.appendChild(length);

        // Word letters display
        const lettersContainer = document.createElement('div');
        lettersContainer.className = 'word-letters';
        lettersContainer.style.cssText = `
            margin-bottom: 15px;
        `;

        const lettersTitle = document.createElement('div');
        lettersTitle.textContent = 'Letters:';
        lettersTitle.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
        `;

        const lettersGrid = document.createElement('div');
        lettersGrid.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
        `;

        word.letters.forEach((letter, index) => {
            const letterBox = document.createElement('div');
            letterBox.style.cssText = `
                width: 30px;
                height: 30px;
                border: 1px solid #ccc;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                background: ${letter ? '#fff' : '#f5f5f5'};
                color: ${letter ? '#333' : '#999'};
            `;
            letterBox.textContent = letter || '?';
            lettersGrid.appendChild(letterBox);
        });

        lettersContainer.appendChild(lettersTitle);
        lettersContainer.appendChild(lettersGrid);

        // Word text
        const wordText = document.createElement('div');
        wordText.className = 'word-text';
        wordText.style.cssText = `
            margin-bottom: 15px;
        `;

        const textTitle = document.createElement('div');
        textTitle.textContent = 'Word:';
        textTitle.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
        `;

        const textDisplay = document.createElement('div');
        textDisplay.style.cssText = `
            font-size: 18px;
            font-weight: bold;
            color: #007acc;
            letter-spacing: 2px;
            padding: 8px;
            background: #f0f8ff;
            border-radius: 4px;
            text-align: center;
            min-height: 20px;
        `;
        textDisplay.textContent = word.text || '(incomplete)';

        wordText.appendChild(textTitle);
        wordText.appendChild(textDisplay);

        // Search functionality
        const searchContainer = document.createElement('div');
        searchContainer.className = 'word-search';
        searchContainer.style.cssText = `
            margin-bottom: 15px;
        `;

        const searchTitle = document.createElement('div');
        searchTitle.textContent = 'Dictionary Search:';
        searchTitle.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
        `;

        const searchBtn = document.createElement('button');
        searchBtn.textContent = 'Search Online';
        searchBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        searchBtn.onclick = () => this.searchWord(word.text);

        searchContainer.appendChild(searchTitle);
        if (word.text && !word.text.includes('')) {
            searchContainer.appendChild(searchBtn);
        } else {
            const noSearchText = document.createElement('div');
            noSearchText.textContent = 'Complete the word to search';
            noSearchText.style.cssText = `
                color: #999;
                font-style: italic;
                text-align: center;
                padding: 8px;
            `;
            searchContainer.appendChild(noSearchText);
        }

        // Word statistics
        const stats = document.createElement('div');
        stats.className = 'word-stats';
        stats.style.cssText = `
            font-size: 12px;
            color: #666;
            padding-top: 10px;
            border-top: 1px solid #eee;
        `;

        const completeness = word.letters.filter(l => l).length;
        stats.innerHTML = `
            <div>Completed: ${completeness}/${word.length} letters</div>
            <div>Progress: ${Math.round((completeness / word.length) * 100)}%</div>
        `;

        // Append all elements
        this.content.appendChild(info);
        this.content.appendChild(lettersContainer);
        this.content.appendChild(wordText);
        this.content.appendChild(searchContainer);
        this.content.appendChild(stats);
    }

    /**
     * Opens a dictionary search for the word
     * @param {string} wordText - Word to search for
     */
    searchWord(wordText) {
        if (!wordText || wordText.includes('')) {
            document.dispatchEvent(new CustomEvent('crossword:toast', {
                detail: { message: 'Complete the word before searching', type: 'warning' }
            }));
            return;
        }

        // Open multiple dictionary sources
        const sources = [
            `https://www.merriam-webster.com/dictionary/${encodeURIComponent(wordText.toLowerCase())}`,
            `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(wordText.toLowerCase())}`,
            `https://en.wiktionary.org/wiki/${encodeURIComponent(wordText.toLowerCase())}`
        ];

        // Create a selection dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 400px;
            width: 90%;
        `;

        dialog.innerHTML = `
            <h3>Search "${wordText}" in:</h3>
            <div style="margin: 15px 0;">
                <button onclick="window.open('${sources[0]}', '_blank')" style="display: block; width: 100%; margin: 5px 0; padding: 10px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">Merriam-Webster</button>
                <button onclick="window.open('${sources[1]}', '_blank')" style="display: block; width: 100%; margin: 5px 0; padding: 10px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">Cambridge Dictionary</button>
                <button onclick="window.open('${sources[2]}', '_blank')" style="display: block; width: 100%; margin: 5px 0; padding: 10px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">Wiktionary</button>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }

    /**
     * Updates the display if a word is currently shown
     * @param {Object} word - Updated word object
     */
    update(word) {
        if (this.panel.style.display === 'block') {
            this.show(word);
        }
    }

    /**
     * Gets the current displayed word
     * @returns {Object|null} Current word object
     */
    getCurrentWord() {
        return this.currentWord;
    }
}
