// Word.js
// Represents a selected word in the crossword

class Word {
    /**
     * @param {string} text - The word text
     * @param {Object} startSquare - The starting square object
     * @param {Object} endSquare - The ending square object
     */
    constructor(squares) {
        this.squares = squares;
        this.startSquare = squares[0];
        this.endSquare = squares[squares.length - 1];
    }
    /**
     * Returns the direction: 'horizontal', 'vertical', or 'bent'
     */
    get direction() {
        if (!this.startSquare || !this.endSquare) return null;
    }

    getText() {
        return this.squares.map(square => square.getValue()).join('');
    }

    getLength() {
        return this.squares ? this.squares.length : 0;
    }

    getDirection() {
        if (!this.startSquare || !this.endSquare) return null;
        if (this.startSquare.col === this.endSquare.col) {
            return 'vertical';
        } else if (this.startSquare.row === this.endSquare.row) {
            return 'horizontal';
        } else {
            return 'bent';
        }
    }

    getSquares() {
        return this.squares;
    }

    getLetters() {
        return this.squares.map(square => square.getValue());
    }

    getStartRow() {
        return this.startSquare.row;
    }

    getStartCol() {
        return this.startSquare.col;
    }
}
