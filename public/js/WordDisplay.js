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
        const infoTitle = document.createElement('div');
        infoTitle.textContent = 'Details:';
        infoTitle.className = 'word-info-title';

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

        // Dictionary definitions section (only show for supported languages)
        const currentLang = this.getLanguage();
        const supportedDefinitionLanguages = ['en-us', 'de', 'fr', 'es', 'it', 'pt'];
        const showDefinitions = supportedDefinitionLanguages.includes(currentLang);
        
        let definitionsContainer = null;
        if (showDefinitions) {
            definitionsContainer = document.createElement('div');
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
        }

        // Dictionary links functionality - show links directly
        const searchContainer = document.createElement('div');
        searchContainer.className = 'word-search';

        const searchTitle = document.createElement('div');
        searchTitle.textContent = 'External Dictionary Links:';
        searchTitle.className = 'word-search-title';

        searchContainer.appendChild(searchTitle);

        if (word.text && !word.text.includes('?')) {
            // Get dictionary sources for current language
            const currentLang = this.getLanguage();
            const sources = this.getLanguageSpecificSources(word.text, currentLang);
            
            // Create container for dictionary links
            const linksContainer = document.createElement('div');
            linksContainer.className = 'dictionary-links-container';
            
            // Add each dictionary source as a direct link
            sources.forEach(source => {
                const linkButton = document.createElement('button');
                linkButton.className = 'dictionary-link-button';
                linkButton.textContent = source.name;
                linkButton.onclick = () => {
                    window.open(source.url, '_blank');
                };
                linksContainer.appendChild(linkButton);
            });
            
            searchContainer.appendChild(linksContainer);
        } else {
            const noSearchText = document.createElement('div');
            noSearchText.textContent = 'Complete the word to see dictionary links';
            noSearchText.className = 'word-search-disabled';
            searchContainer.appendChild(noSearchText);
        }

        // Append all elements
        //this.content.appendChild(lettersContainer);
        this.content.appendChild(wordText);
        this.content.appendChild(infoTitle);
        this.content.appendChild(info);
        if (definitionsContainer) {
            this.content.appendChild(definitionsContainer);
        }
        this.content.appendChild(searchContainer);
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
    async fetchDefinitions(word, container) {
        const cleanWord = word.toLowerCase().trim();
        const currentLang = this.getLanguage();
        
        // Show loading state
        container.innerHTML = `
            <div class="word-display-loading">
                <div class="word-display-loading-title">🔍 Looking up definitions...</div>
                <div class="word-display-loading-subtitle">Searching multiple sources</div>
            </div>
        `;

        try {
            // Try Free Dictionary API first for supported languages
            const definitions = await this.fetchFromFreeDictionary(cleanWord);
            if (definitions && definitions.length > 0) {
                this.displayDefinitions(definitions, container, definitions[0].source);
                return;
            }
        } catch (error) {
            console.log('Free Dictionary API failed:', error.message);
        }

        // For unsupported languages, try alternative approaches
        try {
            const wiktionaryDef = await this.fetchFromWiktionary(cleanWord, currentLang);
            if (wiktionaryDef && wiktionaryDef.length > 0) {
                this.displayDefinitions(wiktionaryDef, container, `Wiktionary (${currentLang})`);
                return;
            }
        } catch (error) {
            console.log('Wiktionary API failed:', error.message);
        }

        // If all APIs fail, show helpful message with language-specific guidance
        this.showNoDefinitionsMessage(container, currentLang, cleanWord);
    }

    /**
     * Shows appropriate no definitions message based on language
     * @param {HTMLElement} container - Container to show message in
     * @param {string} language - Current language
     * @param {string} word - Word that was searched
     */
    showNoDefinitionsMessage(container, language, word) {
        const languageNames = DictionarySources.getLanguageNames();
        const langDisplay = languageNames[language] || language;
        
        const supportedByFreeAPI = ['en-us', 'de', 'fr', 'es', 'it', 'pt'].includes(language);
        
        let message, subtitle;
        
        if (supportedByFreeAPI) {
            message = `📚 No definitions found for "${word}"`;
            subtitle = `Word not found in ${langDisplay} dictionaries. Check spelling or try the external dictionary links below.`;
        } else {
            message = `📚 No API definitions available for ${langDisplay}`;
            subtitle = `Our automatic definition lookup doesn't support ${langDisplay} yet. Use the comprehensive dictionary links below for authoritative definitions.`;
        }
        
        container.innerHTML = `
            <div class="word-display-no-definitions">
                <div class="word-display-no-definitions-title">${message}</div>
                <div class="word-display-no-definitions-subtitle">${subtitle}</div>
            </div>
        `;
    }

    /**
     * Attempts to fetch definitions from Wiktionary API (experimental)
     * @param {string} word - The word to look up
     * @param {string} language - Language code
     * @returns {Promise<Array>} Array of definition objects
     */
    async fetchFromWiktionary(word, language) {
        // Wiktionary API is complex and parsing would require significant work
        // For now, this is a placeholder that could be implemented if needed
        
        // Map language codes to Wiktionary language codes
        const wiktLangMap = {
            'sv': 'sv',
            'da': 'da', 
            'no': 'no',
            'fi': 'fi',
            'nl': 'nl',
            'en-us': 'en'
        };
        
        const wiktLang = wiktLangMap[language];
        if (!wiktLang) {
            throw new Error(`Wiktionary not configured for ${language}`);
        }

        // This is a simplified example - real Wiktionary API parsing is much more complex
        try {
            const response = await fetch(`https://${wiktLang}.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`);
            if (!response.ok) {
                throw new Error('Wiktionary API request failed');
            }
            
            // Wiktionary API responses are complex and would need custom parsing
            // For now, we'll just throw an error to fall back to external links
            throw new Error('Wiktionary parsing not implemented yet');
            
        } catch (error) {
            throw new Error(`Wiktionary lookup failed: ${error.message}`);
        }
    }

    /**
     * Fetches definitions from Free Dictionary API
     * @param {string} word - The word to look up
     * @returns {Promise<Array>} Array of definition objects
     */
    fetchFromFreeDictionary(word) {
        const currentLang = this.getLanguage();
        
        // Map language codes to API supported languages - only use exact matches
        const langMap = {
            'en-us': { code: 'en', name: 'English' },
            'de': { code: 'de', name: 'German' },
            'fr': { code: 'fr', name: 'French' },
            'es': { code: 'es', name: 'Spanish' },
            'it': { code: 'it', name: 'Italian' },
            'pt': { code: 'pt', name: 'Portuguese' }
        };
        
        const apiLangInfo = langMap[currentLang];
        
        // If language is not supported by the API, reject immediately
        if (!apiLangInfo) {
            return Promise.reject(new Error(`Free Dictionary API does not support ${currentLang}. Only English, German, French, Spanish, Italian, and Portuguese are supported.`));
        }
        
        return fetch(`https://api.dictionaryapi.dev/api/v2/entries/${apiLangInfo.code}/${word}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Word "${word}" not found in ${apiLangInfo.name}`);
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
                                            source: `Free Dictionary API (${apiLangInfo.name})`
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
     * Opens a dictionary search for the word - displays options in the side panel
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
        const languageNames = DictionarySources.getLanguageNames();
        const langDisplay = languageNames[currentLang] || currentLang;

        // Clear current content and show dictionary sources in the panel
        this.content.innerHTML = '';

        // Create header for dictionary search
        const searchHeader = document.createElement('div');
        searchHeader.className = 'dictionary-search-header';
        
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = `Search "${wordText}" in ${langDisplay} dictionaries`;
        headerTitle.className = 'dictionary-search-title';
        
        const backButton = document.createElement('button');
        backButton.className = 'dictionary-back-button-header';
        backButton.textContent = '← Back to Word Details';
        backButton.onclick = () => {
            if (this.currentWord) {
                this.show(this.currentWord);
            }
        };

        searchHeader.appendChild(headerTitle);
        searchHeader.appendChild(backButton);

        // Create dictionary sources list
        const sourcesContainer = document.createElement('div');
        sourcesContainer.className = 'dictionary-sources-container';

        sources.forEach(source => {
            const sourceButton = document.createElement('button');
            sourceButton.className = 'dictionary-source-button';
            sourceButton.textContent = source.name;
            sourceButton.onclick = () => {
                window.open(source.url, '_blank');
            };
            sourcesContainer.appendChild(sourceButton);
        });

        // Add back button at the bottom as well
        const bottomBackButton = document.createElement('button');
        bottomBackButton.className = 'dictionary-back-button-bottom';
        bottomBackButton.textContent = 'Back to Word Details';
        bottomBackButton.onclick = () => {
            if (this.currentWord) {
                this.show(this.currentWord);
            }
        };

        // Append all elements to content
        this.content.appendChild(searchHeader);
        this.content.appendChild(sourcesContainer);
        this.content.appendChild(bottomBackButton);

        // Make sure panel is visible
        this.panel.style.display = 'block';
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
