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

        // Dictionary definitions section
        const definitionsContainer = document.createElement('div');
        definitionsContainer.className = 'word-definitions';
        definitionsContainer.style.cssText = `
            margin-bottom: 15px;
        `;

        const definitionsTitle = document.createElement('div');
        definitionsTitle.textContent = 'Definitions:';
        definitionsTitle.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
        `;

        const definitionsContent = document.createElement('div');
        definitionsContent.className = 'definitions-content';
        definitionsContent.style.cssText = `
            min-height: 60px;
            padding: 8px;
            background: #f9f9f9;
            border-radius: 4px;
            border: 1px solid #ddd;
        `;

        // Show loading or fetch definitions
        if (word.text && !word.text.includes('?') && word.text.length > 1) {
            definitionsContent.innerHTML = `
                <div style="text-align: center; color: #666; padding: 20px;">
                    <div style="margin-bottom: 8px;">🔍 Looking up definitions...</div>
                    <div style="font-size: 12px;">Searching multiple dictionaries</div>
                </div>
            `;
            this.fetchDefinitions(word.text, definitionsContent);
        } else {
            definitionsContent.innerHTML = `
                <div style="text-align: center; color: #999; font-style: italic; padding: 20px;">
                    Complete the word to see definitions
                </div>
            `;
        }

        definitionsContainer.appendChild(definitionsTitle);
        definitionsContainer.appendChild(definitionsContent);

        // Search functionality
        const searchContainer = document.createElement('div');
        searchContainer.className = 'word-search';
        searchContainer.style.cssText = `
            margin-bottom: 15px;
        `;

        const searchTitle = document.createElement('div');
        searchTitle.textContent = 'External Dictionary Links:';
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
        if (word.text && !word.text.includes('?')) {
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
                <div style="text-align: center; color: #888; padding: 20px;">
                    <div style="margin-bottom: 8px;">📚 No definitions found</div>
                    <div style="font-size: 12px;">Try the external dictionary links below</div>
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
        let html = `<div style="margin-bottom: 10px; font-size: 11px; color: #666; text-align: right;">Source: ${source}</div>`;
        
        definitions.forEach((def, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            html += `
                <div style="margin-bottom: 12px; padding: 8px; background: ${bgColor}; border-left: 3px solid #007acc; border-radius: 0 4px 4px 0;">
                    ${def.partOfSpeech ? `<div style="font-size: 11px; color: #007acc; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">${def.partOfSpeech}</div>` : ''}
                    <div style="font-size: 13px; line-height: 1.4; color: #333; margin-bottom: 4px;">${def.definition}</div>
                    ${def.example ? `<div style="font-size: 12px; color: #666; font-style: italic;">Example: "${def.example}"</div>` : ''}
                </div>
            `;
        });

        if (definitions.length === 0) {
            html = `
                <div style="text-align: center; color: #888; padding: 20px;">
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
                    <div style="text-align: center; color: #888; padding: 20px;">
                        <div style="margin-bottom: 8px;">📚 No definitions found</div>
                        <div style="font-size: 12px;">Try the external dictionary links below</div>
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
        const encodedWord = encodeURIComponent(word.toLowerCase());
        
        const sources = {
            'sv': [
                {
                    name: 'Svenska Akademiens Ordlista',
                    url: `https://svenska.se/tre/?sok=${encodedWord}&amp;pz=1`
                },
                {
                    name: 'Synonymer.se',
                    url: `https://www.synonymer.se/sv-syn/${encodedWord}`
                },
                {
                    name: 'Wiktionary (Svenska)',
                    url: `https://sv.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'en-us': [
                {
                    name: 'Merriam-Webster',
                    url: `https://www.merriam-webster.com/dictionary/${encodedWord}`
                },
                {
                    name: 'Cambridge Dictionary',
                    url: `https://dictionary.cambridge.org/dictionary/english/${encodedWord}`
                },
                {
                    name: 'Wiktionary (English)',
                    url: `https://en.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'da': [
                {
                    name: 'Den Danske Ordbog',
                    url: `https://ordnet.dk/ddo/ordbog?query=${encodedWord}`
                },
                {
                    name: 'Synonymordbogen',
                    url: `https://www.synonymordbogen.dk/?query=${encodedWord}`
                },
                {
                    name: 'Wiktionary (Dansk)',
                    url: `https://da.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'no': [
                {
                    name: 'Norsk Ordbok',
                    url: `https://ordbok.uib.no/perl/ordbok.cgi?OPP=${encodedWord}`
                },
                {
                    name: 'NAOB',
                    url: `https://naob.no/ordbok/${encodedWord}`
                },
                {
                    name: 'Wiktionary (Norsk)',
                    url: `https://no.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'fi': [
                {
                    name: 'Kielitoimiston sanakirja',
                    url: `https://www.kielitoimistonsanakirja.fi/#/${encodedWord}`
                },
                {
                    name: 'MOT Sanakirjat',
                    url: `https://mot.kielikone.fi/mot/aineistot/haku?haku=${encodedWord}`
                },
                {
                    name: 'Wiktionary (Suomi)',
                    url: `https://fi.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'de': [
                {
                    name: 'Duden',
                    url: `https://www.duden.de/suchen/dudenonline/${encodedWord}`
                },
                {
                    name: 'DWDS',
                    url: `https://www.dwds.de/?q=${encodedWord}`
                },
                {
                    name: 'Wiktionary (Deutsch)',
                    url: `https://de.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'fr': [
                {
                    name: 'Larousse',
                    url: `https://www.larousse.fr/dictionnaires/francais/${encodedWord}`
                },
                {
                    name: 'Le Robert',
                    url: `https://dictionnaire.lerobert.com/definition/${encodedWord}`
                },
                {
                    name: 'Wiktionary (Français)',
                    url: `https://fr.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'es': [
                {
                    name: 'RAE',
                    url: `https://dle.rae.es/${encodedWord}`
                },
                {
                    name: 'WordReference',
                    url: `https://www.wordreference.com/definicion/${encodedWord}`
                },
                {
                    name: 'Wiktionary (Español)',
                    url: `https://es.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'it': [
                {
                    name: 'Treccani',
                    url: `https://www.treccani.it/vocabolario/${encodedWord}`
                },
                {
                    name: 'Corriere della Sera',
                    url: `https://dizionari.corriere.it/dizionario_italiano/${encodedWord}.shtml`
                },
                {
                    name: 'Wiktionary (Italiano)',
                    url: `https://it.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'pt': [
                {
                    name: 'Priberam',
                    url: `https://dicionario.priberam.org/${encodedWord}`
                },
                {
                    name: 'Michaelis',
                    url: `https://michaelis.uol.com.br/busca?r=0&f=0&t=0&palavra=${encodedWord}`
                },
                {
                    name: 'Wiktionary (Português)',
                    url: `https://pt.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'nl': [
                {
                    name: 'Van Dale',
                    url: `https://www.vandale.nl/gratis-woordenboek/nederlands/betekenis/${encodedWord}`
                },
                {
                    name: 'Wiktionary (Nederlands)',
                    url: `https://nl.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Synoniemen.net',
                    url: `https://synoniemen.net/${encodedWord}`
                }
            ]
        };

        // Get language-specific sources or fallback to English
        const languageSources = sources[language] || sources['en-us'];
        
        // Add Google search as a universal option for all languages
        const googleSearch = {
            name: 'Google Search',
            url: `https://www.google.com/search?q=${encodedWord}+definition`
        };
        
        // Return sources with Google search added
        return [...languageSources, googleSearch];
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
            max-height: 80vh;
            overflow-y: auto;
        `;

        let buttonsHtml = '';
        sources.forEach(source => {
            buttonsHtml += `
                <button onclick="window.open('${source.url}', '_blank')" style="display: block; width: 100%; margin: 5px 0; padding: 10px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; text-align: left;">
                    ${source.name}
                </button>
            `;
        });

        const languageNames = {
            'sv': 'Svenska',
            'en-us': 'English',
            'da': 'Dansk',
            'no': 'Norsk',
            'fi': 'Suomi',
            'de': 'Deutsch',
            'fr': 'Français',
            'es': 'Español',
            'it': 'Italiano',
            'pt': 'Português',
            'nl': 'Nederlands'
        };

        const langDisplay = languageNames[currentLang] || currentLang;

        dialog.innerHTML = `
            <h3>Search "${wordText}" in ${langDisplay} dictionaries:</h3>
            <div style="margin: 15px 0;">
                ${buttonsHtml}
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
