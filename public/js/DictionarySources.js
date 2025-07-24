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
                    name: 'Oxford Dictionary',
                    url: `https://www.oxfordlearnersdictionaries.com/definition/english/${encodedWord}`
                },
                {
                    name: 'Collins Dictionary',
                    url: `https://www.collinsdictionary.com/dictionary/english/${encodedWord}`
                },
                {
                    name: 'Wiktionary (English)',
                    url: `https://en.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Thesaurus.com',
                    url: `https://www.thesaurus.com/browse/${encodedWord}`
                },
                {
                    name: 'Etymology Online',
                    url: `https://www.etymonline.com/search?q=${encodedWord}`
                }
            ],
            'da': [
                {
                    name: 'Den Danske Ordbog',
                    url: `https://ordnet.dk/ddo/ordbog?query=${encodedWord}`
                },
                {
                    name: 'Retskrivningsordbogen',
                    url: `https://dsn.dk/retskrivning/om-retskrivningsordbogen/soeg-i-retskrivningsordbogen?SearchTerm=${encodedWord}`
                },
                {
                    name: 'Synonymordbogen',
                    url: `https://www.synonymordbogen.dk/?query=${encodedWord}`
                },
                {
                    name: 'Wiktionary (Dansk)',
                    url: `https://da.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Ordnet.dk',
                    url: `https://ordnet.dk/ods/opslag?query=${encodedWord}`
                },
                {
                    name: 'Gyldendal',
                    url: `https://ordboeger.gyldendal.dk/search?query=${encodedWord}`
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
                    name: 'Wiktionary (Norsk)',
                    url: `https://no.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Synonymer.no',
                    url: `https://www.synonymer.no/?q=${encodedWord}`
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
                    name: 'Suomisanakirja',
                    url: `https://www.suomisanakirja.fi/${encodedWord}`
                },
                {
                    name: 'Wiktionary (Suomi)',
                    url: `https://fi.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Synonymit.fi',
                    url: `https://www.synonymit.fi/synonyymit/${encodedWord}`
                },
                {
                    name: 'Kääntäjä.fi',
                    url: `https://www.kaantaja.fi/sanakirja/suomi-englanti/${encodedWord}`
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
                    name: 'Wiktionary (Deutsch)',
                    url: `https://de.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'OpenThesaurus',
                    url: `https://www.openthesaurus.de/synonyme/${encodedWord}`
                },
                {
                    name: 'Canoo.net',
                    url: `https://www.canoo.net/services/OnlineGrammar/Wort/Bedeutung/?Lookup=CaseSensitive&Query=${encodedWord}`
                },
                {
                    name: 'Linguee',
                    url: `https://www.linguee.com/german-english/search?source=german&query=${encodedWord}`
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
                    name: 'Académie française',
                    url: `https://www.dictionnaire-academie.fr/article/${encodedWord}`
                },
                {
                    name: 'CNRTL (Centre National)',
                    url: `https://www.cnrtl.fr/definition/${encodedWord}`
                },
                {
                    name: 'Wiktionary (Français)',
                    url: `https://fr.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Synonymes.com',
                    url: `https://www.synonymes.com/synonyme.php?mot=${encodedWord}`
                },
                {
                    name: 'Reverso',
                    url: `https://dictionnaire.reverso.net/francais-definition/${encodedWord}`
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
                    name: 'Fundéu',
                    url: `https://www.fundeu.es/?s=${encodedWord}`
                },
                {
                    name: 'Wiktionary (Español)',
                    url: `https://es.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Sinónimos.es',
                    url: `https://www.sinonimos.es/${encodedWord}`
                },
                {
                    name: 'SpanishDict',
                    url: `https://www.spanishdict.com/translate/${encodedWord}`
                },
                {
                    name: 'Conjugador',
                    url: `https://www.conjugador.es/conjugacion/verbo/${encodedWord}.html`
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
                    name: 'Garzanti',
                    url: `https://www.garzantilinguistica.it/ricerca/?q=${encodedWord}`
                },
                {
                    name: 'Wiktionary (Italiano)',
                    url: `https://it.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Sinonimi e Contrari',
                    url: `https://www.sinonimi-contrari.it/sinonimi/${encodedWord}`
                },
                {
                    name: 'Sapere.it',
                    url: `https://www.sapere.it/sapere/dizionari/dizionari/Italiano/cerca.do?q=${encodedWord}`
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
                    name: 'Aurélio',
                    url: `https://www.dicio.com.br/${encodedWord}`
                },
                {
                    name: 'Wiktionary (Português)',
                    url: `https://pt.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Sinônimos',
                    url: `https://www.sinonimos.com.br/${encodedWord}`
                },
                {
                    name: 'Infopédia',
                    url: `https://www.infopedia.pt/dicionarios/lingua-portuguesa/${encodedWord}`
                },
                {
                    name: 'Conjugação',
                    url: `https://www.conjugacao.com.br/verbo-${encodedWord}`
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
                },
                {
                    name: 'Woorden.org',
                    url: `https://www.woorden.org/woord/${encodedWord}`
                },
                {
                    name: 'OpenTaal',
                    url: `https://www.opentaal.org/zoeken/woord/${encodedWord}`
                },
                {
                    name: 'WoordenBoek.nl',
                    url: `https://www.woordenboek.nl/vertaling/nederlands/engels/${encodedWord}`
                }
            ],
            'ru': [
                {
                    name: 'Академик',
                    url: `https://dic.academic.ru/searchall.php?SWord=${encodedWord}`
                },
                {
                    name: 'Викисловарь',
                    url: `https://ru.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Грамота.ру',
                    url: `http://gramota.ru/slovari/dic/?word=${encodedWord}`
                },
                {
                    name: 'Ефремова',
                    url: `https://www.efremova.info/${encodedWord}`
                },
                {
                    name: 'Синонимы',
                    url: `https://synonyms.su/${encodedWord}`
                }
            ],
            'pl': [
                {
                    name: 'PWN (Słownik języka polskiego)',
                    url: `https://sjp.pwn.pl/szukaj/${encodedWord}.html`
                },
                {
                    name: 'Wikisłownik',
                    url: `https://pl.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Słownik Języka Polskiego',
                    url: `https://www.slownik-online.pl/kopalinski/${encodedWord}.html`
                },
                {
                    name: 'Synonim.net',
                    url: `https://synonim.net/synonim/${encodedWord}`
                },
                {
                    name: 'WSJP (Wielki Słownik)',
                    url: `https://www.wsjp.pl/index.php?szukaj=${encodedWord}`
                }
            ],
            'cs': [
                {
                    name: 'Slovník češtiny',
                    url: `https://www.nechybujte.cz/slovnik-ceske-terminologie/${encodedWord}`
                },
                {
                    name: 'Wikislovník',
                    url: `https://cs.wiktionary.org/wiki/${encodedWord}`
                },
                {
                    name: 'Slovník.cz',
                    url: `https://www.slovnik.cz/preklad/cesky_cesky/${encodedWord}`
                },
                {
                    name: 'Synonyma.cz',
                    url: `https://www.synonyma.cz/synonymum/?q=${encodedWord}`
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
            'nl': 'Nederlands',
            'ru': 'Русский',
            'pl': 'Polski',
            'cs': 'Čeština'
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
