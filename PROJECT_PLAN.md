# Swedish-Style Crossword Maker – Project Plan

## 1. Vision & Goals
Create a **100% CLIENT-SIDE** browser-based application using **ONLY HTML5, CSS3, and vanilla JavaScript** for designing Swedish-style crosswords ("Bildkorsord" style) where clue images/texts sit *inside* grid cells. Support multi-language word assistance, rich editing (subdivided clue/letter cells, bent arrows), persistence (local + JSON import/export), printing (blank + key), and extensibility (selection algorithms & dictionary providers).

**CRITICAL: This is a pure client-side web application with ZERO server-side components. No Node.js, no build tools, no server frameworks. The deliverable is static HTML/CSS/JS files that work when opened directly in a browser from the local filesystem.**

Primary goals:
- Fast, intuitive grid editing UI
- Faithful Swedish-style layout (embedded clues, bent arrows, pastel letter backgrounds)
- Robust resizing without data loss
- Pluggable selection & dictionary search architecture
- Multi-language (Nordic + major Latin alphabet languages) support
- Zero runtime dependencies except optional CDN libraries (prefer native browser APIs + lightweight custom utilities)
- 100% client-side (static) application: no server runtime required; deliverable is a set of static files that work with file:// protocol.

## 2. Scope Summary (MVP vs Later)
| Feature | MVP | Later Iterations |
|---------|-----|------------------|
| Core grid create/edit | ✓ | - |
| Subdivided cells (H/V split) | ✓ | Multi-split (nested) |
| Embedded clue text (and optional image placeholder) | ✓ | Image upload, rich formatting |
| Letter cells with pastel color palette | ✓ | Custom palette manager |
| Bent direction arrows (⤷ lower-left = down→right, ⤵ top-right = right→down) | ✓ | Curved styles, multi-turn paths |
| Word auto-selection (H then V) | ✓ | Additional heuristic plugins |
| Selection following arrow direction changes | ✓ | Multi-arrow, themed paths |
| Manual range selection (drag / shift-click) | ✓ | Keyboard-driven block ops |
| Right-side word panel + dictionary lookup | ✓ | AI-assisted clue drafting |
| Multi-language dictionaries (config-driven) | ✓ | Online crowd-sourced libs |
| LocalStorage autosave | ✓ | Cloud sync (e.g., WebDAV, Drive) |
| JSON import/export | ✓ | Versioned project history |
| Resizable grid preserving content | ✓ | Partial pattern templates |
| Printing: Blank & Key modes | ✓ | High-res PDF, theming |
| Undo/Redo | ✓ | Branching history |
| Accessibility basics | ✓ | Screen reader optimized editing |

## 3. Detailed Functional Requirements
1. Cells can be: Letter, Clue, Black, or Split (subgrid container).  
2. Letter cell attributes: char (optional until filled), backgroundColor (from pastel palette), optional arrow (none | rightToDown | downToRight).  
3. Clue cell: textual clue (short or multi-line); later optional image ref.  
4. Split cell: orientation (horizontal | vertical); holds 2 (or more in future) subcells each of type Letter or Clue.  
5. Editable puzzle title (inline, persistent).  
6. Grid size configurable (rows, cols) with maximum limit of 100x100 for performance. Resize operation retains existing cell data in overlapping region; newly added cells initialize as Empty (treated as Letter type placeholder) or Black depending on user default setting.  
7. Selection logic: single click triggers auto word detection; preference Horizontal; fallback Vertical OR toggles to vertical if horizontal already selected. Must follow arrows (path bends).  
8. Range selection: drag or shift-click to produce contiguous set; validation ensures all cells form a path per word rules (accept bending via arrows).  
9. Word panel: shows selected path: sequence index, coordinates, current letters, clue placeholders, length, dictionary search controls.  
10. Dictionary lookup: asynchronous queries to configured providers per language (modular providers).  
11. Multi-language: UI language setting + puzzle language metadata. Different dictionary provider sets chosen by puzzle language.  
12. Persistence: LocalStorage (autosave key), JSON export (download), JSON import (validation + migration).  
13. Printing: Print view route/modal: Mode=Blank (letters hidden → empty squares) or Key (letters visible). Clue cells always visible; arrows visible; palette optionally muted for printer-friendly version.  
14. Pastel color picker for letter cells (predefined palette, accessible contrast tested).  
15. Undo/Redo stack for structural & content edits (bounded length).  
16. Extensible selection algorithm registry (strategy pattern).  
17. Data model version tag for forward migration.  
18. Performance: target <16ms frame for core interactions on 30x30 grid; lazy re-render limited to affected cells.
19. Optional thick boundary markers: Any (letter) cell may specify a thicker line on its right and/or bottom edge to denote end-of-word boundaries for visual clarity (Swedish style convention). These borders must render above cell fill, export/import with puzzle, and appear in print (with consistent thickness scaling). Toggling a thick border should not alter selection logic (purely visual) but future algorithms may use them as segmentation hints.
20. Letter entry auto-advance: When a user types a letter in a letter cell, focus automatically moves to the next cell horizontally (to the right) by default. If the previous edited letter cell was directly above (i.e., vertical entry mode inferred) or the user manually toggled vertical mode, focus moves downward instead. Mode inference rules: (a) Explicit toggle by user (toolbar or keyboard shortcut) overrides; (b) If last two edited cells are vertically adjacent, switch to vertical mode until a horizontal adjacency occurs or mode toggled; (c) Arrow bends in the current selected word path adjust the next target accordingly. Skips over non-letter cells (clue, black, full-arrow) and wraps selection to next valid letter cell or terminates at path end.

## 4. Non-Functional Requirements
- **Technology: PURE CLIENT-SIDE ONLY** - Vanilla JavaScript, HTML5, and CSS3 ONLY. NO Node.js, NO server-side frameworks, NO backend components. This is a 100% browser-based static application that runs entirely in the client browser using only web standards.
- Implementation: Native DOM manipulation + lightweight custom reactive store (<150 LOC). OPTIONALLY a tiny view layer (Preact CDN) if complexity grows; default plan uses zero frameworks.  
- Print CSS for fidelity (A4 defaults).  
- Responsive layout (desktop primary; tablet usable).  
- Accessibility: keyboard navigation for cells, ARIA labels for clue/letter distinction.  
- Internationalization: Lightweight i18n using simple JSON files and native JavaScript (NO i18next unless loaded via CDN).  
- Testing: Pure JavaScript unit tests or simple HTML test pages (NO complex testing frameworks requiring Node.js).  
- Code Quality: Manual linting following standard JavaScript conventions (NO ESLint/Prettier tooling that requires Node.js).  
- Bundle: Single HTML file with inline CSS/JS OR simple file structure (index.html + styles.css + script.js). Target < 300KB total excluding dictionaries.
- **Deployment: Static files ONLY** - Self-contained bundle suitable for opening directly from local filesystem (file://) or any static host. NO build process requiring Node.js. NO server APIs; all data persisted locally (LocalStorage / file download).
- External Resources: Any third-party libraries loaded via CDN with integrity attributes; offline fallback not required for MVP.

## 5. Architecture Overview
Layered approach:
1. Core Domain (data structures, operations, migration)  
2. State Store (minimal custom pub/sub + immutable-ish updates)  
3. Services (dictionary providers, persistence, print preparation)  
4. UI Layer (modular view modules rendering DOM fragments; optional adapter for Preact if enabled)  
5. Strategy Interfaces (SelectionStrategy, PathTraversal, DictionaryProvider)  
6. Integration Utilities (selection orchestration, dictionary search controller)

### 5.1 Data Model (TypeScript-esque)
```ts
interface PuzzleDocumentV1 {
  version: 1;
  title: string;
  language: string; // e.g., 'sv', 'no', 'en', etc.
  rows: number;
  cols: number;
  cells: Cell[]; // length = rows * cols
  metadata?: Record<string, any>;
}

type Cell = LetterCell | ClueCell | BlackCell | SplitCell;

interface BaseCell { id: string; row: number; col: number; }

interface LetterCell extends BaseCell { type: 'letter'; char?: string; bgColor?: string; arrow?: 'rightToDown' | 'downToRight'; locked?: boolean; }

interface ClueCell extends BaseCell { type: 'clue'; text: string; // short clue or descriptor
  style?: { fontSize?: number; align?: 'center'|'top'|'bottom'; } }

interface BlackCell extends BaseCell { type: 'black'; }

interface SplitCell extends BaseCell { type: 'split'; orientation: 'horizontal' | 'vertical'; subcells: (LetterSubCell | ClueSubCell)[]; }

interface LetterSubCell { kind: 'letter'; char?: string; }
interface ClueSubCell { kind: 'clue'; text: string; }
// Border decoration (word-end markers) extension (V2 or augment V1 if added early):
interface CellBorderDecoration { right?: 'thick'; bottom?: 'thick'; }
// Implementation option A: Extend BaseCell with optional border object.
// interface BaseCell { id: string; row: number; col: number; borders?: CellBorderDecoration }
// Option B: Maintain separate sparse map (cellId -> decoration) to avoid prop drilling; choose based on performance profiling.
```

### 5.2 Word Path Representation
```ts
interface WordPath { id: string; cells: PathNode[]; directionSequence: ('H'|'V')[]; bends: number; language: string; }
interface PathNode { row: number; col: number; subIndex?: number; // for split subcell
  arrowOut?: 'rightToDown' | 'downToRight'; }
```

### 5.3 Selection Strategy Interface
```ts
interface SelectionStrategy {
  name: string;
  select(start: {row:number; col:number}, grid: GridSnapshot, context: SelectionContext): WordPath | null;
}
```
Default strategies: `HorizontalFirstThenVertical`, potential future: `LongestSpan`, `DensityHeuristic`, etc.

### 5.4 Dictionary Provider Interface
```ts
interface DictionaryProvider {
  id: string;
  languages: string[]; // supported
  lookup(term: string, lang: string): Promise<DefinitionResult[]>;
}
```
Config maps language -> provider chain. Fallback provider for generic encyclopedic or translation lookups.

## 6. Core Algorithms
### 6.1 Word Detection (HorizontalFirstThenVertical)
1. From clicked cell, attempt horizontal scan left until boundary (black, clue-only block, grid edge) respecting arrow bends.  
2. Build path moving right; if arrow rightToDown encountered, pivot downward continuing path until stop.  
3. If path length > 1 (or single-letter accepted per config) return.  
4. Else attempt vertical similarly (top to bottom pivoting on downToRight arrows).  
5. If previous selection already equals horizontal path and user clicks again same start: switch to vertical even if horizontal valid.  
6. Store path & emit selection event.

### 6.2 Resizing Grid (Preserve Content)
- Create new cell array size newRows*newCols.  
- For each cell position within overlap (minRows, minCols) copy existing cell deeply.  
- New extra cells default to Letter type (empty) or Black based on UI toggle.  
- Update dimension attributes; push undo snapshot.  
- Migration: maintain IDs for stable references.

### 6.3 Split Cells
- Conversion action on a cell: choose orientation; create `SplitCell` with two subcells: both letter by default.  
- Rendering: CSS Grid overlay inside parent cell; maintain click mapping (row, col, subIndex).  
- Selection path treats subcells as sequential units if contiguous in traversal direction.

### 6.4 Printing Preparation
Modes: `blank` and `key`.  
Transform: clone puzzle; if blank -> strip `char` fields (but optionally show enumerations).  
CSS: print media query hides UI chrome, adjusts palette lighten / grayscale toggle.  
Offer pre-flight preview + browser print.

### 6.5 Undo/Redo
- Maintain stack of serialized diffs (immer patches) or snapshots capped (e.g., 200).  
- Actions produce patch -> apply & log; redo clears on new mutation.

## 7. UI / Component Breakdown
- **`MainInterface`**: The primary interaction model consists of a top toolbar for global puzzle-wide actions (New, Resize, Print, Import/Export) and a right-click context menu on grid cells for cell-specific operations (Change Type, Add Arrow, Split, Set Border, Apply Color).
- `AppShell` – layout, theming, i18n toggle
- `TitleEditor` – inline title, debounced persistence
- `Toolbar` – **Global actions**: new, resize, language select, print, import/export, undo/redo.
- `CellContextMenu` – **Cell-specific actions**: Change type (Letter/Black/Clue), add/remove arrow, split cell, toggle thick borders.
- `GridSurface` – main grid container (virtualized if large)
- `GridCell` – determines cell type wrapper, handles right-click to show context menu.
- `LetterCellView` – letter input, arrow indicators (SVG overlay), background color
- `ClueCellView` – text area (auto-resize) or image icon stub
- `SplitCellView` – internal mini-grid (2 subcells)
- `SelectionOverlay` – highlight path
- `WordPanel` – selected word details, letter slots, dictionary search results
- `DictionaryPanel` – provider selection, results list
- `PalettePicker` – pastel swatches (can be in toolbar or context menu)
- `ResizeDialog`
- `PrintDialog` / `PrintPreview`
- `ImportExportDialog`
- `SettingsPanel` – language, defaults, plugin toggles

## 8. State Slices (Zustand / Redux Toolkit)
- `puzzle`: grid, title, language, version
- `selection`: current path, strategyName, history
- `ui`: dialogs open, palette, tool mode
- `dictionaries`: providers, results cache, loading states
- `undoRedo`: stacks
- `settings`: default new cell type, print preferences

## 9. Persistence Flows
- Autosave every N seconds (throttle) & on beforeunload. Key: `swedex.puzzle.current`.  
- Manual export: triggers JSON blob download (filename includes title + date).  
- Import: parse -> validate version -> migrate if needed -> load store.  
- Migration functions chain (versioned).  

## 10. Internationalization Plan
Languages prioritized: sv, no, da, fi (UI localized), en, de, fr, it, es, nl.  
Approach: i18next with JSON resource bundles.  
Puzzle-level language selection determines dictionary pipeline & orthographic hints (e.g., allow Å, Ä, Ö).  
Input constraints: filter allowed chars by language-specific regex.

## 11. Dictionary Integration
Initial providers (verified endpoints):  

### Swedish (sv)
- **Primary**: svenska.se API - verified working endpoint
- **Secondary**: Google Translate API (sv locale) - requires API key
- **Tertiary**: Swedish Wikipedia API (sv.wikipedia.org) - free, rate-limited

### Nordic Languages
- **Norwegian (no)**: Bokmålsordboka/Nynorskordboka APIs + Google Translate (no) + Norwegian Wikipedia (no.wikipedia.org)
- **Danish (da)**: Den Danske Ordbog API + Google Translate (da) + Danish Wikipedia (da.wikipedia.org)  
- **Finnish (fi)**: Kielitoimiston sanakirja + Google Translate (fi) + Finnish Wikipedia (fi.wikipedia.org)

### Major Languages
- **English (en)**: Google Dictionary API + English Wikipedia (en.wikipedia.org) + Merriam-Webster API (free tier)
- **German (de)**: Google Translate (de) + German Wikipedia (de.wikipedia.org) + Duden API (if available)
- **French (fr)**: Google Translate (fr) + French Wikipedia (fr.wikipedia.org) + Larousse API (if available)
- **Spanish (es)**: Google Translate (es) + Spanish Wikipedia (es.wikipedia.org) + RAE API (if available)
- **Italian (it)**: Google Translate (it) + Italian Wikipedia (it.wikipedia.org)
- **Dutch (nl)**: Google Translate (nl) + Dutch Wikipedia (nl.wikipedia.org)

### Provider Configuration
```javascript
const DICTIONARY_PROVIDERS = {
  'sv': [
    { id: 'svenska-se', name: 'Svenska.se', endpoint: 'https://svenska.se/api/...', free: true },
    { id: 'google-sv', name: 'Google Translate', endpoint: 'https://translate.googleapis.com/...', requiresKey: true },
    { id: 'wikipedia-sv', name: 'Swedish Wikipedia', endpoint: 'https://sv.wikipedia.org/api/...', free: true }
  ],
  // ... other languages
};
```

### Implementation Notes
- All providers must be verified to work and respect rate limits before inclusion
- Google APIs require user-provided API keys (stored in LocalStorage)
- Wikipedia APIs are free but have rate limiting (implement client-side throttling)
- Fallback chain: Primary → Secondary → Tertiary → Generic frequency matching
- User can disable/reorder providers per language in settings

Abstraction allows plugging: `providers.register(new MyApiProvider())`.

## 12. Theming & Pastel Palette
Default palette (WCAG contrast against black & arrow overlays tested):  
`#FFE9E3`, `#FFF6D1`, `#E3F6FF`, `#E9F9E6`, `#F0E8FF`, `#FFEFF8`.  
Store chosen palette per puzzle (metadata).  
Dark mode optional later; ensure print mode strips saturated backgrounds if user selects grayscale.

## 13. Arrow Rendering
**Implementation Approach**: Flexible arrow rendering system with developer choice of implementation method.

**Recommended Implementation**: Code-generated SVG elements for precision and scalability:
- SVG mini-layer inside each cell (absolute positioned overlay)
- Programmatically generate arrow paths using SVG `<path>` elements with cubic bezier curves
- Dynamic arrow sizing based on cell dimensions (scalable vector graphics)
- Arrow styles: `rightToDown` (⤷) and `downToRight` (⤵)

**Technical Specifications**:
- **Right→Down arrow**: Anchored top-right corner, path starts horizontal (right) then curves downward
- **Down→Right arrow**: Anchored bottom-left corner, path starts vertical (down) then curves rightward  
- **SVG viewBox**: Relative to cell dimensions (e.g., 0 0 100 100 for percentage-based scaling)
- **Path generation**: Use JavaScript to calculate bezier control points for smooth curves
- **Styling**: Configurable stroke width, color, and arrowhead style via CSS custom properties

**Alternative Implementations** (developer choice):
- Unicode arrow characters (⤷ ⤵) with CSS transforms and positioning
- CSS-only solutions using borders and pseudo-elements
- Canvas-based rendering for complex arrow styles

**Integration Requirements**:
- Path traversal logic inspects `arrow` attribute to pivot direction when encountered mid-path
- In split cells, arrows only allowed on letter subcells with coordinates relative to parent cell
- Print compatibility: arrows must render consistently in print media queries
- Accessibility: arrows should have appropriate ARIA labels for screen readers

**Code Example Structure**:
```javascript
function generateArrowSVG(type, cellSize) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  
  if (type === 'rightToDown') {
    // Generate curved path from top-right going right then down
    path.setAttribute('d', calculateRightToDownPath(cellSize));
  } else if (type === 'downToRight') {
    // Generate curved path from bottom-left going down then right  
    path.setAttribute('d', calculateDownToRightPath(cellSize));
  }
  
  return svg;
}
```

## 14. Validation & Edge Cases
Edge Cases:  
- Single-letter words (should still select for languages where allowed).  
- Split cell with both subcells empty: treat as placeholder, not barrier.  
- Grid size validation: reject resize attempts beyond 100x100 maximum with user warning.
- Resizing smaller truncates cells outside new bounds (confirm dialog).  
- Printing with split cells: ensure consistent scaling.  
- Undo after import/export sequence.  
- Arrows on edge cells pivot into out-of-bounds → disallow with validation message.
- Large grid performance: enable virtualization automatically for grids >50x50.

## 15. Security & Privacy
No external calls without explicit user action (dictionary search).  
CORS & rate-limit awareness.  
LocalStorage only; no PII stored.

## 16. Performance Considerations
- Use memoized cell components; key by cell id.  
- Grid size limited to maximum 100x100 (10,000 cells) for optimal performance.
- Virtualize large grids (>50x50) with windowing for smooth scrolling and rendering.
- Target <16ms frame time for core interactions on grids up to 100x100.
- Batch dictionary lookups with debounce.  
- Avoid deep cloning whole grid; apply structural patches.
- SVG arrow rendering optimized with reusable path definitions and CSS transforms.

## 17. Testing Strategy
- Unit: data model ops (resize, split, arrow path).  
- Integration: selection strategy returns expected paths.  
- E2E (Playwright): create puzzle, place letters, add arrow, select word, print preview.  
- Snapshot tests for print view markup.

## 18. Milestones & Timeline (Indicative)
| Sprint | Deliverables |
|--------|--------------|
| 0 (Pre-Sprint) | **Dictionary API verification**: Test svenska.se, Wikipedia APIs, Google Translate endpoints for all target languages; document working configurations |
| 1 (Week 1-2) | **Pure HTML/CSS/JS scaffolding**, data model in vanilla JavaScript, basic grid render using DOM/CSS Grid, title edit, palette picker |
| 2 (Week 3-4) | Selection algorithm (H/V) in vanilla JS, word panel stub, arrows rendering with SVG, split cells using CSS Grid |
| 3 (Week 5-6) | Resize preserving content, undo/redo using native JS, JSON import/export with File API, autosave to LocalStorage |
| 4 (Week 7-8) | Dictionary provider abstraction + verified providers (svenska.se, localized Google/Wikipedia), multi-language UI with simple JSON i18n |
| 5 (Week 9) | Printing (blank & key) with CSS media queries, styling polish, accessibility pass |
| 6 (Week 10) | Manual testing, performance tuning, documentation, static file delivery |

## 19. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Complex path bending rules escalate | Encapsulate traversal logic + comprehensive tests early |
| Dictionary API changes/unavailability | Multiple provider fallback chain + cached word lists + user-configurable endpoints |
| API rate limits exceeded | Client-side throttling + user API key configuration + offline word frequency matching |
| Split cell feature creep | Limit MVP to exactly two subcells (H or V) |
| Performance on large grids | Virtualization + O(affectedCells) updates |
| Printing inconsistencies across browsers | Use standardized CSS print + provide PDF via browser print dialog |
| Svenska.se API changes | Monitor API status + implement alternative Swedish providers + local fallback |

## 20. Open Questions
1. Are clue images required in MVP, or strictly text?  
2. Should letter entry be uppercase-only auto-normalized per language?  
3. Should we support numbering of words (traditional numbering) in addition to Swedish style?  
4. Should black cells be convertible to clue cells directly or require intermediate blank?  

## 20.1. Dictionary API Verification Tasks
**Pre-Implementation Requirements:**
- [ ] Verify svenska.se API endpoint and response format
- [ ] Test Wikipedia API rate limits and response structure for all target languages  
- [ ] Confirm Google Translate API pricing and free tier limits
- [ ] Research and verify Nordic language dictionary APIs (Bokmålsordboka, Den Danske Ordbog, etc.)
- [ ] Create fallback word frequency lists for offline functionality
- [ ] Implement graceful degradation when APIs are unavailable
- [ ] Document API key setup process for users  

## 21. Acceptance Criteria (MVP Snapshot)
- User can create 15x15 Swedish-style puzzle by opening `index.html` in any modern browser; add title; place clues & letters; color letter cells using only client-side functionality.  
- User can split a cell into two subcells and place letter + clue combination using DOM manipulation.  
- User can add a bent arrow using SVG and selection path follows bend using vanilla JavaScript algorithms.  
- User can toggle a thick right and/or bottom border on a letter cell and it appears in editor and print views using CSS borders.  
- Typing a letter advances focus to the next letter cell using native JavaScript event handling and DOM focus management.  
- Auto-selection toggles between horizontal and vertical when clicking same start using pure JavaScript logic.  
- Word panel shows letters and can invoke dictionary lookup using fetch() API returning definitions.  
- Grid can resize larger & smaller (with confirmation) preserving overlapping content using JavaScript object manipulation.  
- Puzzle can be exported as JSON file download and re-imported with full fidelity using File API and LocalStorage.  
- Printing blank hides letters; printing key reveals letters using CSS @media print rules and window.print().  
- Works for at least Swedish + English language settings using JSON language files loaded via fetch().  
- **Application runs entirely client-side** by opening static HTML file - no Node.js, no build process, no server required - just HTML, CSS, and JavaScript files that work in any modern browser via file:// protocol or static web hosting.  

## 22. Implementation Roadmap (Task-Level Breakdown)
**ALL TASKS USE ONLY CLIENT-SIDE WEB TECHNOLOGIES - HTML5, CSS3, VANILLA JAVASCRIPT**

1. **Static File Structure**: Create index.html + styles.css + script.js (NO build tools, NO Node.js, NO package managers).  
2. Data model & state store using vanilla JavaScript objects and simple pub/sub pattern (100-150 LOC max).  
3. Grid rendering with CSS Grid and DOM manipulation (document.createElement, appendChild, etc.).  
4. Pastel palette & letter bg editing using CSS custom properties and click handlers.  
5. Arrow overlay system using code-generated SVG elements with dynamic path calculation.  
6. Grid size validation and 100x100 maximum limit enforcement.
7. Selection strategy using pure JavaScript algorithms (no libraries).
8. Split cell data structure + CSS Grid rendering for subcells.
9. Word path traversal respecting arrows & splits (vanilla JS logic).
10. Thick border decoration using CSS borders (data stored in JS objects).  
11. Word panel UI using DOM manipulation & dictionary integration with verified providers:
    - svenska.se for Swedish (primary)
    - Google Translate API (user-provided key) for all languages  
    - Localized Wikipedia APIs (sv.wikipedia.org, en.wikipedia.org, etc.)
    - Graceful fallback chain with error handling  
12. Resize flow using JavaScript + DOM manipulation; preserve data in memory.  
13. Persistence: LocalStorage API + File API for export/import (JSON blob download).  
14. Print preview using CSS @media print and window.print().  
15. Language setting with simple JSON language files loaded via fetch().  
16. Additional dictionary providers using fetch() with configurable endpoints.  
17. Undo/Redo using JavaScript arrays and object cloning.  
18. Manual testing with HTML test pages (NO automated testing frameworks).  
19. Accessibility using ARIA attributes and keyboard event handlers.  

## 23. Extensibility Hooks
- `registerSelectionStrategy(strategy)`  
- `registerDictionaryProvider(provider)`  
- `onBeforeExport(callback)` / `onAfterImport(callback)` for plugins  
- Theming API exposing palette tokens.

## 24. Tooling & Scripts
**NO BUILD TOOLS OR NODE.JS DEVELOPMENT ENVIRONMENT**

Since this is a pure client-side application, there are no npm scripts or build processes:

- **Development**: Open `index.html` directly in browser or use simple local HTTP server (python -m http.server, PHP built-in server, or VS Code Live Server extension)
- **Production**: Copy static files (index.html, styles.css, script.js, any assets) to hosting location  
- **Testing**: Open test HTML files directly in browser for manual testing
- **Code Quality**: Manual review following JavaScript best practices
- **Deployment**: Upload static files to any web host or use locally via file:// protocol

**File Structure:**
```
/
├── index.html          (main application)
├── styles.css          (all styles)  
├── script.js           (all JavaScript)
├── assets/             (optional: icons, fonts)
├── languages/          (JSON language files)
├── dictionaries/       (optional local dictionary files)
└── tests/             (manual test HTML pages)
```  

## 26. Dependency Policy & Lean Architecture Notes
**ZERO BUILD DEPENDENCIES - PURE WEB STANDARDS ONLY**

Goal: Keep the application as simple static files that work in any modern browser without any build process, Node.js, or server-side components.

**Strict Guidelines:**
- **NO npm, yarn, or any package managers** - This is not a Node.js project
- **NO build tools** (Vite, Webpack, Rollup, etc.) - Static files only
- **NO transpilation** (TypeScript, Babel) - Use modern JavaScript (ES2020+) directly
- **NO bundling** - Use ES6 modules with `<script type="module">` if needed for organization
- **NO CSS preprocessors** (Sass, Less) - Use CSS3 custom properties and modern CSS features
- **NO testing frameworks** requiring Node.js - Use simple HTML test pages for manual testing
- **NO linting tools** requiring setup - Follow standard JavaScript conventions manually

**Allowed External Resources (via CDN only):**
- Web fonts from Google Fonts (with fallbacks)
- OPTIONAL: Tiny libraries via CDN (e.g., Preact from unpkg.com) only if absolutely necessary
- Dictionary APIs accessed via fetch() (user provides API keys)

**Implementation Approach:**
- Use native DOM APIs (querySelector, createElement, addEventListener)
- Implement simple state management with plain JavaScript objects and functions (~100-150 LOC)
- Use CSS Grid and Flexbox for layout
- Use CSS custom properties for theming
- Use LocalStorage API for persistence
- Use File API for import/export
- Use fetch() API for optional dictionary lookups
- Use native print CSS for printing functionality

**Success Metric:** 
- Complete application works by simply opening `index.html` in any modern browser
- Total file size < 300KB (HTML + CSS + JS combined)
- No external dependencies except optional CDN resources
- Works offline after initial load (except dictionary lookups)

## 27. Deployment & Distribution
**STATIC FILES ONLY - NO SERVER REQUIRED**

- **Output**: Static web application consisting of:
  - `index.html` - Main application file
  - `styles.css` - All styling  
  - `script.js` - All JavaScript functionality
  - `assets/` folder - Optional icons, images
  - `languages/` folder - JSON language files
  - `dictionaries/` folder - Optional local dictionary files

- **Browser Compatibility**: Modern browsers supporting ES2020+ (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)

- **Local Usage**: Works by double-clicking `index.html` (file:// protocol) - no web server required

- **Web Hosting**: Upload files to any static host:
  - GitHub Pages (drag & drop or git push)
  - Netlify (drag & drop `dist/` folder) 
  - Vercel static deployment
  - Any web server (Apache, Nginx, IIS)
  - CDN (Cloudflare Pages, etc.)

- **Distribution Methods**:
  - ZIP file download containing all static files
  - Git repository clone
  - Direct file download from web host

- **Fonts**: Load from Google Fonts CDN with fallback to system fonts:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  ```

- **Offline Capability**: 
  - Core application works offline after initial load
  - Dictionary lookups require internet connection (graceful degradation)
  - LocalStorage persistence works offline
  - JSON export/import works offline

- **No Build Process**: Development and production use identical files - what you write is what runs in the browser


## 25. Documentation Plan
- `README.md`: quick start + feature overview.  
- `docs/architecture.md`: domain, components, state diagrams.  
- `docs/strategies.md`: selection strategy patterns.  
- `docs/dictionaries.md`: provider integration guide.  

## 26. Future Enhancement: Regional Image Overlays & Large Clue Blocks
Purpose: Support a hallmark Swedish crossword style where a larger image spans multiple grid cells and an associated multi-word "big clue" (theme clue) is placed adjacent or partially overlaying, with distinct background color blocks and large directional arrows occupying entire squares to segment the answer into word groups.

### Functional Additions
1. Image Region Overlay
  - Define an `ImageRegion` with bounding box (rowStart, colStart, rowSpan, colSpan), z-index beneath clue/letter layers but above base background.
  - Supports PNG/JPEG/SVG uploads (client-side object URL; future: persistence via data URL or external reference).
  - Cells fully covered by image are no longer rendered or printed.
2. Full-Square Arrows
  - Arrow cells that consume an entire square to visually separate words within the themed answer.
  - Arrow styles: horizontal continuation, vertical continuation, bend (like existing) but scaled to full cell with thicker stroke.
  - Arrow cells are non-letter, non-clue, and excluded from word length counts (or counted as separators) – configurable.
3. Distinct Color Coding
  - Palette extension for image clue words
  - Print mode option to grayscale image while keeping arrow separators visible.
4. Answer Segmentation Logic
  - Word extraction for big clue yields multiple word segments split by arrow-separator cells.
  - Dictionary lookup panel can show each segment individually and as combined phrase.

### Data Model Extensions (Proposed V2)
```ts
interface PuzzleDocumentV2 extends PuzzleDocumentV1 { version: 2; imageRegions?: ImageRegion[]; }

interface ImageRegion { id: string; row: number; col: number; rowSpan: number; colSpan: number; src: string; opacity?: number; alt?: string; }

type Cell = LetterCell | ClueCell | BlackCell | SplitCell | MegaClueCell | ArrowCell; // extended

interface MegaClueCell extends BaseCell { type: 'megaClue'; extent: { rowSpan: number; colSpan: number }; text: string; bgColor?: string; }
interface ArrowCell extends BaseCell { type: 'arrowFull'; direction: 'horizontal' | 'vertical' | 'rightToDown' | 'downToRight'; role: 'separator' | 'path'; }
```

### Rendering Approach
- Layering: (1) base grid lines, (2) image regions (clipped via CSS mask), (3) cells (letters/clues/megaClue/arrow), (4) selection overlay.
- Mega clue text uses absolute-positioned container spanning its extent; internal mapping from pixel click -> originating anchor cell for focus management.

### Editing Tools
- Image tool: click-drag to define region → upload/select image → adjust opacity & scale (contain/cover).
- Mega clue tool: drag region → enter text.
- Arrow separator tool: click cells sequentially to convert to full-arrow style (toggle).

### Interaction & Selection Adjustments
- Selection traversal treats `arrowFull` with role 'separator' as path pass-through but boundary for word segmentation; role 'path' changes direction akin to bent arrows.
- Mega clue cells are excluded from standard letter word detection unless specifically targeted.

### Printing Considerations
- Option: include or omit full image; if omitted, show light placeholder outline.
- Ensure arrow separators remain high-contrast in monochrome.

### Migration Path
1. Detect V1 document -> wrap as V2 with empty `imageRegions`.
2. On save after introducing mega clue or arrowFull cells, set `version:2`.

### Risks
| Risk | Mitigation |
|------|------------|
| Large images inflate export size | Offer external URL reference; optional compression | 
| Complex hit-testing over multi-cell text/image regions | Centralized spatial index for region lookups |
| Accessibility of image-spanning cells | Alt text mandatory; ARIA description linking |

### Deferred (Not in initial enhancement)
- Image cropping/editor inside app.
- Arbitrary polygonal image shapes.
- Multiple stacked images overlapping same cells.

### Acceptance (Enhancement)
- User can add an image spanning at least 3x3 cells.
- User can create a mega clue block with multi-line text distinctively colored.
- User can insert full-square arrows that segment the themed answer and bend direction.
- Export/import preserves image regions (with data URL or reference) and mega clue semantics.
- Print blank mode hides letters but shows image outline (configurable) and arrow separators.

---
Prepared: 2025-08-22
