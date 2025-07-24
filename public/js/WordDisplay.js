/**
 * WordDisplay - Manages the word display panel next to the crossword
 */
class WordDisplay {
    constructor(getLanguageCallback = null) {
        this.currentWord = null;
        this.panel = null;
        this.getLanguage = getLanguageCallback || (() => document.documentElement.lang || 'en-us');
        this.createPanel();
    }

    /**
     * Creates the word display panel
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'word-display-panel';

        // Create header
        const header = document.createElement('div');
        header.className = 'word-display-header';

        const title = document.createElement('h3');
        title.textContent = 'Selected Word';
        title.className = 'word-display-title';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'word-display-close-btn';
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
        
        // Panel is always visible, just make sure content is showing
        this.panel.style.display = 'block';
    }

    /**
     * Hides the word display panel
     */
    hide() {
        // Hide the panel content but keep the panel structure
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

        const direction = document.createElement('div');
        direction.className = 'word-info-direction';
        direction.textContent = `${word.direction.charAt(0).toUpperCase() + word.direction.slice(1)} Word`;

        const position = document.createElement('div');
        position.className = 'word-info-details';
        position.textContent = `Position: Row ${word.startRow + 1}, Col ${word.startCol + 1}`;

        const length = document.createElement('div');
        length.className = 'word-info-details';
        length.textContent = `Length: ${word.length} letters`;

        info.appendChild(direction);
        info.appendChild(position);
        info.appendChild(length);

        // Word letters display
        const lettersContainer = document.createElement('div');
        lettersContainer.className = 'word-letters';

        const lettersTitle = document.createElement('div');
        lettersTitle.textContent = 'Letters:';
        lettersTitle.className = 'word-letters-title';

        const lettersGrid = document.createElement('div');
        lettersGrid.className = 'word-letters-grid';

        word.letters.forEach((letter, index) => {
            const letterBox = document.createElement('div');
            letterBox.className = letter ? 'word-letter-box filled' : 'word-letter-box empty';
            letterBox.textContent = letter || '?';
            lettersGrid.appendChild(letterBox);
        });

        lettersContainer.appendChild(lettersTitle);
        lettersContainer.appendChild(lettersGrid);

        // Word text
        const wordText = document.createElement('div');
        wordText.className = 'word-text';

        const textTitle = document.createElement('div');
        textTitle.textContent = 'Word:';
        textTitle.className = 'word-text-title';

        const textDisplay = document.createElement('div');
        textDisplay.className = 'word-text-display';
        textDisplay.textContent = word.text || '(incomplete)';

        wordText.appendChild(textTitle);
        wordText.appendChild(textDisplay);

        // Dictionary definitions section
        const definitionsContainer = document.createElement('div');
        definitionsContainer.className = 'word-definitions';

        const definitionsTitle = document.createElement('div');
        definitionsTitle.textContent = 'Definitions:';
        definitionsTitle.className = 'word-definitions-title';

        const definitionsContent = document.createElement('div');
        definitionsContent.className = 'definitions-content';

        // Show loading or fetch definitions
        if (word.text && !word.text.includes('?') && word.text.length > 1) {
            definitionsContent.innerHTML = `
                <div class="word-display-loading">
                    <div class="word-display-loading-title">🔍 Looking up definitions...</div>
                    <div class="word-display-loading-subtitle">Searching multiple dictionaries</div>
                </div>
            `;
            this.fetchDefinitions(word.text, definitionsContent);
        } else {
            definitionsContent.innerHTML = `
                <div class="word-display-no-word">
                    Complete the word to see definitions
                </div>
            `;
        }

        definitionsContainer.appendChild(definitionsTitle);
        definitionsContainer.appendChild(definitionsContent);

        // Search functionality
        const searchContainer = document.createElement('div');
        searchContainer.className = 'word-search';

        const searchTitle = document.createElement('div');
        searchTitle.textContent = 'External Dictionary Links:';
        searchTitle.className = 'word-search-title';

        const searchBtn = document.createElement('button');
        searchBtn.textContent = 'Search Online';
        searchBtn.className = 'word-search-button';
        searchBtn.onclick = () => this.searchWord(word.text);

        searchContainer.appendChild(searchTitle);
        if (word.text && !word.text.includes('?')) {
            searchContainer.appendChild(searchBtn);
        } else {
            const noSearchText = document.createElement('div');
            noSearchText.textContent = 'Complete the word to search';
            noSearchText.className = 'word-search-disabled';
            searchContainer.appendChild(noSearchText);
        }

        // Word statistics
        const stats = document.createElement('div');
        stats.className = 'word-stats';

        const completeness = word.letters.filter(l => l).length;
        stats.innerHTML = `
            <div>Completed: ${completeness}/${word.length} letters</div>
            <div>Progress: ${Math.round((completeness / word.length) * 100)}%</div>
        `;

        // Append all elements
        this.content.appendChild(info);
        this.content.appendChild(lettersContainer);
        this.content.appendChild(wordText);
        this.content.appendChild(definitionsContainer);
        this.content.appendChild(searchContainer);
        this.content.appendChild(stats);
    }

    /**
     * Fetches definitions from multiple dictionary APIs
     * @param {string} word - The word to look up
     * @param {HTMLElement} container - The container to display results in
     */
    async fetchDefinitions(word, container) {
        const cleanWord = word.toLowerCase().trim();
        const sources = [
            {
                name: 'Free Dictionary API',
                fetch: () => this.fetchFromFreeDictionary(cleanWord),
                priority: 1
            },
            {
                name: 'Dictionary API',
                fetch: () => this.fetchFromDictionaryAPI(cleanWord),
                priority: 2
            },
            {
                name: 'Words API',
                fetch: () => this.fetchFromWordsAPI(cleanWord),
                priority: 3
            }
        ];

        let foundDefinitions = false;

        // Try each source in order
        for (const source of sources) {
            try {
                const definitions = await source.fetch();
                if (definitions && definitions.length > 0) {
                    this.displayDefinitions(definitions, container, source.name);
                    foundDefinitions = true;
                    break;
                }
            } catch (error) {
                console.log(`${source.name} failed:`, error.message);
                // Continue to next source
            }
        }

        if (!foundDefinitions) {
            container.innerHTML = `
                <div class="word-display-no-definitions">
                    <div class="word-display-no-definitions-title">📚 No definitions found</div>
                    <div class="word-display-no-definitions-subtitle">Try the external dictionary links below</div>
                </div>
            `;
        }
    }



    /**
     * Displays definitions in the container
     * @param {Array} definitions - Array of definition objects
     * @param {HTMLElement} container - Container element
     * @param {string} source - Source name
     */
    displayDefinitions(definitions, container, source) {
        let html = `<div class="definition-source">Source: ${source}</div>`;
        
        definitions.forEach((def, index) => {
            html += `
                <div class="definition-item">
                    ${def.partOfSpeech ? `<div class="definition-part-of-speech">${def.partOfSpeech}</div>` : ''}
                    <div class="definition-text">${def.definition}</div>
                    ${def.example ? `<div class="definition-example">Example: "${def.example}"</div>` : ''}
                </div>
            `;
        });

        if (definitions.length === 0) {
            html = `
                <div class="word-display-no-definitions">
                    <div>No definitions found</div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Fetches definitions from multiple dictionary APIs
     * @param {string} word - The word to look up
     * @param {HTMLElement} container - The container to display results in
     */
    fetchDefinitions(word, container) {
        const cleanWord = word.toLowerCase().trim();
        
        // Try Free Dictionary API first
        this.fetchFromFreeDictionary(cleanWord)
            .then(definitions => {
                if (definitions && definitions.length > 0) {
                    this.displayDefinitions(definitions, container, 'Free Dictionary API');
                } else {
                    throw new Error('No definitions found');
                }
            })
            .catch(error => {
                console.log('Free Dictionary API failed:', error.message);
                // Fallback to showing no definitions message
                container.innerHTML = `
                    <div class="word-display-no-definitions">
                        <div class="word-display-no-definitions-title">📚 No definitions found</div>
                        <div class="word-display-no-definitions-subtitle">Try the external dictionary links below</div>
                    </div>
                `;
            });
    }

    /**
     * Fetches definitions from Free Dictionary API
     * @param {string} word - The word to look up
     * @returns {Promise<Array>} Array of definition objects
     */
    fetchFromFreeDictionary(word) {
        const currentLang = this.getLanguage();
        let apiLang = 'en';
        
        // Map language codes to API supported languages
        const langMap = {
            'en-us': 'en',
            'sv': 'en', // Swedish not supported by this API, fallback to English
            'da': 'en', // Danish not supported, fallback to English
            'no': 'en', // Norwegian not supported, fallback to English
            'fi': 'en', // Finnish not supported, fallback to English
            'de': 'de',
            'fr': 'fr',
            'es': 'es',
            'it': 'it',
            'pt': 'pt',
            'nl': 'en'  // Dutch not supported, fallback to English
        };
        
        apiLang = langMap[currentLang] || 'en';
        
        return fetch(`https://api.dictionaryapi.dev/api/v2/entries/${apiLang}/${word}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Word not found');
                }
                return response.json();
            })
            .then(data => {
                const definitions = [];
                
                if (data && data.length > 0) {
                    data.forEach(entry => {
                        if (entry.meanings) {
                            entry.meanings.forEach(meaning => {
                                if (meaning.definitions) {
                                    meaning.definitions.forEach(def => {
                                        definitions.push({
                                            partOfSpeech: meaning.partOfSpeech,
                                            definition: def.definition,
                                            example: def.example,
                                            source: 'Free Dictionary API'
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
                
                return definitions.slice(0, 3); // Limit to 3 definitions
            });
    }

    /**
     * Gets language-specific dictionary sources
     * @param {string} word - The word to search for
     * @param {string} language - Language code
     * @returns {Array} Array of dictionary source objects
     */
    getLanguageSpecificSources(word, language) {
        return DictionarySources.getLanguageSpecificSources(word, language);
    }

    /**
     * Opens a dictionary search for the word
     * @param {string} wordText - Word to search for
     */
    searchWord(wordText) {
        if (!wordText || wordText.includes('?')) {
            document.dispatchEvent(new CustomEvent('crossword:toast', {
                detail: { message: 'Complete the word before searching', type: 'warning' }
            }));
            return;
        }

        const currentLang = this.getLanguage();
        const sources = this.getLanguageSpecificSources(wordText, currentLang);
        
        // Create a selection dialog
        const modal = document.createElement('div');
        modal.className = 'dictionary-modal';

        const dialog = document.createElement('div');
        dialog.className = 'dictionary-modal-dialog';

        let buttonsHtml = '';
        sources.forEach(source => {
            buttonsHtml += `
                <button onclick="window.open('${source.url}', '_blank')" class="dictionary-button">
                    ${source.name}
                </button>
            `;
        });

        const languageNames = DictionarySources.getLanguageNames();

        const langDisplay = languageNames[currentLang] || currentLang;

        dialog.innerHTML = `
            <h3>Search "${wordText}" in ${langDisplay} dictionaries:</h3>
            <div class="search-button-container">
                ${buttonsHtml}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="cancel-button">Cancel</button>
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
        if (this.panel.style.display !== 'none') {
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
