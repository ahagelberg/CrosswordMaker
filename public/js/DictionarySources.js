/**
 * DictionarySources - Dictionary and reference sources for different languages
 * 
 * This file contains comprehensive dictionary and reference sources for multiple languages.
 * Each language has multiple sources including:
 * - National/authoritative dictionaries
 * - Wiktionary in the respective language
 * - Synonym dictionaries
 * - Translation services
 * - Academic resources
 * 
 * To add a new language or source:
 * 1. Add the language code as a key
 * 2. Provide an array of source objects with 'name' and 'url' properties
 * 3. Use ${encodedWord} placeholder for the search term
 */

class DictionarySources {
    /**
     * Gets language-specific dictionary sources
     * @param {string} word - The word to search for
     * @param {string} language - Language code
     * @returns {Array} Array of dictionary source objects
     */
    static getLanguageSpecificSources(word, language) {
        const encodedWord = encodeURIComponent(word.toLowerCase());
        
        const sources = {
            'sv': [
                {
                    name: 'Svenska Akademiens Ordlista',
                    url: `https://svenska.se/tre/?sok=${encodedWord}&pz=1`
                },
                {
                    name: 'Synonymer.se',
                    url: `https://www.synonymer.se/sv-syn/${encodedWord}`
                },
                {
                    name: 'Wiktionary',
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
                    name: 'Oxford Dictionary',
                    url: `https://www.oxfordlearnersdictionaries.com/definition/english/${encodedWord}`
                },
                {
                    name: 'Collins Dictionary',
                    url: `https://www.collinsdictionary.com/dictionary/english/${encodedWord}`
                },
                {
                    name: 'Thesaurus.com',
                    url: `https://www.thesaurus.com/browse/${encodedWord}`
                },
                {
                    name: 'Etymology Online',
                    url: `https://www.etymonline.com/search?q=${encodedWord}`
                },
                {
                    name: 'Wiktionary',
                    url: `https://en.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'da': [
                {
                    name: 'Den Danske Ordbog',
                    url: `https://ordnet.dk/ddo/ordbog?query=${encodedWord}`
                },
                {
                    name: 'Wiktionary',
                    url: `https://da.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'no': [
                {
                    name: 'Norsk Ordbok',
                    url: `https://ordbok.uib.no/perl/ordbok.cgi?OPP=${encodedWord}`
                },
                {
                    name: 'NAOB (Norsk Akademis ordbok)',
                    url: `https://naob.no/ordbok/${encodedWord}`
                },
                {
                    name: 'Bokmålsordboka',
                    url: `https://ordbok.uib.no/perl/ordbok.cgi?OPP=${encodedWord}&ant_bokmaal=5`
                },
                {
                    name: 'Nynorskordboka',
                    url: `https://ordbok.uib.no/perl/ordbok.cgi?OPP=${encodedWord}&ant_nynorsk=5`
                },
                {
                    name: 'Wiktionary',
                    url: `https://no.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'fi': [
                {
                    name: 'Kielitoimiston sanakirja',
                    url: `https://www.kielitoimistonsanakirja.fi/#/${encodedWord}`
                },
                {
                    name: 'Suomisanakirja',
                    url: `https://www.suomisanakirja.fi/${encodedWord}`
                },
                {
                    name: 'Kääntäjä.fi',
                    url: `https://www.kaantaja.fi/sanakirja/suomi-englanti/${encodedWord}`
                },
                {
                    name: 'Wiktionary',
                    url: `https://fi.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'de': [
                {
                    name: 'Duden',
                    url: `https://www.duden.de/suchen/dudenonline/${encodedWord}`
                },
                {
                    name: 'DWDS (Digitales Wörterbuch)',
                    url: `https://www.dwds.de/?q=${encodedWord}`
                },
                {
                    name: 'Leo.org',
                    url: `https://dict.leo.org/german-english/${encodedWord}`
                },
                {
                    name: 'OpenThesaurus',
                    url: `https://www.openthesaurus.de/synonyme/${encodedWord}`
                },
                {
                    name: 'Linguee',
                    url: `https://www.linguee.com/german-english/search?source=german&query=${encodedWord}`
                },
                {
                    name: 'Wiktionary',
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
                    name: 'CNRTL (Centre National)',
                    url: `https://www.cnrtl.fr/definition/${encodedWord}`
                },
                {
                    name: 'Synonymes.com',
                    url: `https://www.synonymes.com/synonyme.php?mot=${encodedWord}`
                },
                {
                    name: 'Reverso',
                    url: `https://dictionnaire.reverso.net/francais-definition/${encodedWord}`
                },
                {
                    name: 'Wiktionary',
                    url: `https://fr.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'es': [
                {
                    name: 'RAE (Real Academia Española)',
                    url: `https://dle.rae.es/${encodedWord}`
                },
                {
                    name: 'WordReference',
                    url: `https://www.wordreference.com/definicion/${encodedWord}`
                },
                {
                    name: 'SpanishDict',
                    url: `https://www.spanishdict.com/translate/${encodedWord}`
                },
                {
                    name: 'Wiktionary',
                    url: `https://es.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'it': [
                {
                    name: 'Treccani',
                    url: `https://www.treccani.it/vocabolario/${encodedWord}`
                },
                {
                    name: 'Garzanti',
                    url: `https://www.garzantilinguistica.it/ricerca/?q=${encodedWord}`
                },
                {
                    name: 'Sinonimi e Contrari',
                    url: `https://www.sinonimi-contrari.it/sinonimi/${encodedWord}`
                },
                {
                    name: 'Wiktionary',
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
                    name: 'Infopédia',
                    url: `https://www.infopedia.pt/dicionarios/lingua-portuguesa/${encodedWord}`
                },
                {
                    name: 'Wiktionary',
                    url: `https://pt.wiktionary.org/wiki/${encodedWord}`
                }
            ],
            'nl': [
                {
                    name: 'Van Dale',
                    url: `https://www.vandale.nl/gratis-woordenboek/nederlands/betekenis/${encodedWord}`
                },
                {
                    name: 'Woorden.org',
                    url: `https://www.woorden.org/woord/${encodedWord}`
                },
                {
                    name: 'Wiktionary',
                    url: `https://nl.wiktionary.org/wiki/${encodedWord}`
                }
            ]
        };

        // Get language-specific sources or fallback to English
        const languageSources = sources[language] || sources['en-us'];
        
        // Add Google search as a universal option with language prioritization
        const languageNames = this.getLanguageNames();
        const languageName = languageNames[language] || 'English';
        
        // Map language codes to Google's language restriction codes
        const googleLangCodes = {
            'sv': 'lang_sv',        // Swedish
            'en-us': 'lang_en',     // English
            'da': 'lang_da',        // Danish
            'no': 'lang_no',        // Norwegian
            'fi': 'lang_fi',        // Finnish
            'de': 'lang_de',        // German
            'fr': 'lang_fr',        // French
            'es': 'lang_es',        // Spanish
            'it': 'lang_it',        // Italian
            'pt': 'lang_pt',        // Portuguese
            'nl': 'lang_nl',        // Dutch
       };
        
        const googleLangCode = googleLangCodes[language] || 'lang_en';
        
        const googleSearch = {
            name: 'Google Search',
            url: `https://www.google.com/search?q=${encodedWord}+definition+${encodeURIComponent(languageName)}&lr=${googleLangCode}&hl=${language.split('-')[0]}`
        };
        
        // Return sources with Google search added
        return [...languageSources, googleSearch];
    }

    /**
     * Gets display names for languages
     * @returns {Object} Object mapping language codes to display names
     */
    static getLanguageNames() {
        return {
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
    }

    /**
     * Gets all supported language codes
     * @returns {Array} Array of supported language codes
     */
    static getSupportedLanguages() {
        return Object.keys(this.getLanguageNames());
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DictionarySources;
}
