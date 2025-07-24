# Crossword Maker - Refactored OOP Architecture

This crossword maker application has been refactored using an object-oriented approach with separate classes for better maintainability and organization.

## Architecture Overview

### Core Classes

#### 1. CrosswordGrid (`js/CrosswordGrid.js`)
- **Purpose**: Manages the grid data structure and cell operations
- **Key Methods**:
  - `createEmptyGrid()` - Creates a new empty grid
  - `resize()` - Resizes grid while preserving content
  - `getCell()`, `setCell()` - Cell access methods
  - `setCellType()`, `setCellValue()`, `setCellArrow()`, etc. - Cell modification methods
  - `placeImageClue()`, `removeImageClue()` - Image clue management
  - `export()`, `import()` - Data serialization

#### 2. NavigationManager (`js/NavigationManager.js`)
- **Purpose**: Handles keyboard navigation and focus management
- **Key Methods**:
  - `handleKeyDown()` - Processes keyboard events
  - `moveArrowKeys()` - Arrow key navigation
  - `focusSquare()` - Sets focus to specific square
  - `moveToNextSquare()` - Auto-navigation after letter input
  - `onLetterInput()` - Handles letter input validation

#### 3. CrosswordRenderer (`js/CrosswordRenderer.js`)
- **Purpose**: Handles rendering the grid to the DOM
- **Key Methods**:
  - `render()` - Main rendering method
  - `createSquareElement()` - Creates individual square elements
  - `renderLetterSquare()`, `renderClueSquare()`, `renderImageClue()` - Type-specific rendering
  - `setLanguage()` - Updates language for textareas

#### 4. ContextMenu (`js/ContextMenu.js`)
- **Purpose**: Manages all context menu functionality
- **Key Methods**:
  - `show()` - Displays context menu
  - `addLetterSquareOptions()`, `addClueSquareOptions()` - Type-specific menu options
  - `showArrowSubmenu()`, `showBorderSubmenu()`, `showColorSubmenu()` - Submenus
  - `showImageClueDialog()` - Image clue upload dialog

#### 5. PuzzleManager (`js/PuzzleManager.js`)
- **Purpose**: Handles saving, loading, and puzzle management
- **Key Methods**:
  - `save()`, `load()` - Manual save/load operations
  - `autoSave()` - Automatic saving
  - `getAllPuzzles()`, `delete()` - Puzzle collection management
  - `showPuzzleSelector()` - Puzzle selection UI
  - `exportForDownload()` - Data export for downloads

#### 6. PrintManager (`js/PrintManager.js`)
- **Purpose**: Handles printing functionality
- **Key Methods**:
  - `print()` - Main print method
  - `printBlank()`, `printKey()` - Specific print modes
  - Print event listeners for browser integration

#### 7. ToastManager (`js/ToastManager.js`)
- **Purpose**: Handles toast notifications
- **Key Methods**:
  - `show()` - Displays toast messages
  - Event listener for custom toast events

#### 8. CrosswordApp (`js/CrosswordApp.js`)
- **Purpose**: Main application controller that coordinates all managers
- **Key Methods**:
  - `initialize()` - Application initialization
  - `getPuzzleData()`, `loadPuzzleData()` - Data management
  - UI event handlers for all buttons and inputs
  - Coordination between all managers

## Event System

The refactored application uses a custom event system for communication between components:

- `crossword:save` - Triggered when Ctrl+S is pressed
- `crossword:contextmenu` - Triggered when right-clicking on squares
- `crossword:toast` - Triggered to display toast notifications

## Benefits of the Refactor

### 1. **Separation of Concerns**
Each class has a single responsibility, making the code easier to understand and maintain.

### 2. **Modularity**
Components can be modified independently without affecting others.

### 3. **Testability**
Individual classes can be unit tested in isolation.

### 4. **Reusability**
Components can be reused in other projects or contexts.

### 5. **Maintainability**
Bug fixes and new features can be implemented in specific modules without touching unrelated code.

### 6. **Scalability**
New features can be added by creating new classes or extending existing ones.

## File Structure

```
public/
├── index.html          # Main HTML file
├── style.css          # Styles (unchanged)
├── app_old.js         # Original monolithic code (backup)
└── js/                # New class files
    ├── CrosswordGrid.js
    ├── NavigationManager.js
    ├── CrosswordRenderer.js
    ├── ContextMenu.js
    ├── PuzzleManager.js
    ├── PrintManager.js
    ├── ToastManager.js
    └── CrosswordApp.js
```

## Initialization

The application is initialized when the DOM is loaded:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    window.crosswordApp = new CrosswordApp();
});
```

## Backwards Compatibility

The refactored application maintains full backwards compatibility with existing saved puzzles and all original features:

- Arrow indicators
- Thick borders for word boundaries
- Improved fonts
- Print optimization (blank puzzle and answer key)
- Split clue squares
- Pastel color selection
- Swedish-style image clues
- Auto-save functionality
- Keyboard navigation

All functionality has been preserved while improving the code structure significantly.
