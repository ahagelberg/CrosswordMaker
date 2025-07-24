/**
 * PrintManager - Handles printing functionality
 */
class PrintManager {
    constructor() {
        this.setupPrintEventListeners();
    }

    /**
     * Sets up print event listeners
     */
    setupPrintEventListeners() {
        // Handle browser's print menu and Ctrl+P
        window.addEventListener('beforeprint', () => {
            // Only set up for blank puzzle printing if this is NOT a programmatic print call
            if (!window.isProgrammaticPrint) {
                document.body.classList.add('print-blank');
                document.body.classList.remove('print-with-letters');
            }
        });

        window.addEventListener('afterprint', () => {
            // Clean up print classes after printing, but only if it wasn't a programmatic print
            if (!window.isProgrammaticPrint) {
                document.body.classList.remove('print-blank', 'print-with-letters');
            }
        });
    }

    /**
     * Prints the crossword puzzle with or without letter values
     * @param {boolean} showLetters - Whether to show letter values (true for key, false for blank puzzle)
     * @param {string} crosswordTitle - Title of the crossword
     */
    print(showLetters, crosswordTitle = '') {
        // Set a flag to indicate this is a programmatic print call
        window.isProgrammaticPrint = true;
        
        // Add class to body to control print styles
        if (showLetters) {
            document.body.classList.add('print-with-letters');
            document.body.classList.remove('print-blank');
        } else {
            document.body.classList.add('print-blank');
            document.body.classList.remove('print-with-letters');
        }
        
        // Show helpful tip about browser print settings
        const tipMessage = showLetters ? 
            'Printing puzzle key with letters filled in...' : 
            'Printing blank puzzle for solving...';
        
        document.dispatchEvent(new CustomEvent('crossword:toast', {
            detail: { message: tipMessage, type: 'info', duration: 2000 }
        }));
        
        // Try to use advanced print options if available
        if ('print' in window) {
            // For browsers that support it, we can try to influence print settings
            try {
                // Set a custom title for the print job
                const originalTitle = document.title;
                const printTitle = showLetters ? 
                    `${crosswordTitle || 'Crossword Puzzle'} - Answer Key` : 
                    `${crosswordTitle || 'Crossword Puzzle'}`;
                document.title = printTitle;
                
                // Small delay to let the toast show before print dialog
                setTimeout(() => {
                    // Use window.print() with potential options
                    window.print();
                    
                    // Clean up after printing
                    setTimeout(() => {
                        document.title = originalTitle;
                        document.body.classList.remove('print-with-letters', 'print-blank');
                        window.isProgrammaticPrint = false;
                    }, 100);
                }, 500);
            } catch (error) {
                console.log('Standard print fallback');
                window.print();
                // Clean up after printing
                setTimeout(() => {
                    document.body.classList.remove('print-with-letters', 'print-blank');
                    window.isProgrammaticPrint = false;
                }, 100);
            }
        } else {
            window.print();
            // Clean up after printing
            setTimeout(() => {
                document.body.classList.remove('print-with-letters', 'print-blank');
                window.isProgrammaticPrint = false;
            }, 100);
        }
    }

    /**
     * Prints blank puzzle
     * @param {string} crosswordTitle - Title of the crossword
     */
    printBlank(crosswordTitle = '') {
        this.print(false, crosswordTitle);
    }

    /**
     * Prints answer key
     * @param {string} crosswordTitle - Title of the crossword
     */
    printKey(crosswordTitle = '') {
        this.print(true, crosswordTitle);
    }
}
