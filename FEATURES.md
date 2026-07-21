# PowerDesk — Complete Feature Guide

> The operating system you wish Windows came with.

Not just a file explorer. A workspace. An automation hub. A desktop replacement.

---

## Table of Contents

1. [Window & Frame](#window--frame)
2. [Core File Explorer](#core-file-explorer)
3. [Title Bar](#title-bar)
4. [Tab Bar](#tab-bar)
5. [Top Bar / Navigation](#top-bar--navigation)
6. [Sidebar](#sidebar)
7. [File Area & Views](#file-area--views)
8. [Status Bar](#status-bar)
9. [File Operations](#file-operations)
10. [Context Menus](#context-menus)
11. [Search & Command Palette](#search--command-palette)
12. [Search Parser (Smart Filters)](#search-parser-smart-filters)
13. [Keyboard Navigation](#keyboard-navigation)
14. [Drag & Drop](#drag--drop)
15. [Rubber Band Selection](#rubber-band-selection)
16. [Tags & Color Labels](#tags--color-labels)
17. [File Preview (Preview++)](#file-preview-preview)
18. [Properties Panel / File Inspector](#properties-panel--file-inspector)
19. [Transfer Center](#transfer-center)
20. [Universal Undo / Redo](#universal-undo--redo)
21. [Folder Analysis](#folder-analysis)
22. [Clipboard Manager](#clipboard-manager)
23. [Command History](#command-history)
24. [Favorite Commands](#favorite-commands)
25. [Favorite Bar](#favorite-bar)
26. [Workspace Profiles](#workspace-profiles)
27. [Multi Window Sync](#multi-window-sync)
28. [Batch Rename](#batch-rename)
29. [Conflict Dialog](#conflict-dialog)
30. [Built-in Tools](#built-in-tools)
31. [Settings & UI Customization](#settings--ui-customization)
32. [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference)
33. [Tech Stack](#tech-stack)

---

## Window & Frame

- **Frameless window** — no native OS title bar; fully custom dark frame matching the app aesthetic
- **Transparent background** — Electron `transparent: true` enables real window opacity and blur effects
- **Window opacity** — adjustable 30%–100% via Settings slider (Electron `setOpacity()` IPC)
- **Screen edge snapping** — drag the title bar to screen edges:
  - **Top edge** → maximizes the window
  - **Left edge** → snaps to left half of the screen
  - **Right edge** → snaps to right half of the screen
  - **Drag down from maximized** → restores to previous size
- **Snap only fires on mouse release** — free drag while holding, snap when you let go
- **300ms snap cooldown** — prevents snap loops after maximize/restore transitions
- **Minimum size** — 800×500 pixels enforced

---

## Title Bar

- 32px custom title bar at the very top of the window
- **"PowerDesk" label** — uppercase, small font, muted color, left-aligned
- **Draggable region** — entire bar is a native drag handle (WebkitAppRegion) for moving the window
- **Window control buttons** (right side, not draggable):
  - **Minimize** — minimizes the window to the taskbar
  - **Maximize / Restore** — toggles between maximized and restored state; icon updates to reflect current state
  - **Close** — closes the window; hover turns red (#e81123) with white icon
- **Hover states** — each button highlights with `var(--bg-hover)` on mouse enter, reverts on leave

---

## Core File Explorer

- Navigate your entire file system from a single window
- **Back / Forward / Up** navigation with full independent history per tab
- **Path bar** — click to type any path and jump there; Enter to navigate, Escape to cancel
- **Refresh** — press F5 or click the refresh button
- **Status bar** showing item count, folder/file breakdown, active filters, and dual pane status
- **Create new folders and files** from background right-click context menu
- **Paste files from clipboard** into any directory
- **Folder size calculation** — shown asynchronously in list view
- **Open any file** with its default system application (double-click, Enter, or right-click → Open)
- **Hidden files** — toggle visibility in Settings
- **Confirm before delete** — optional confirmation dialog before deletion
- **Startup path** — configurable folder to open on launch (defaults to home directory)
- **Recent files limit** — configurable 3/5/10/15/20/30/50 items shown in sidebar

---

## Tab Bar

- **Unlimited browser-style tabs** — each tab maintains its own path, history, and view state
- **Drag to reorder** — drag a tab over another tab; visual indicator (2px accent left border) shows drop position; release to reorder via `moveTab()`
- **Pin tabs** — right-click → Pin Tab; pinned tabs show a pin icon and are sorted to the left
- **Duplicate tabs** — right-click → Duplicate Tab; creates a copy with the same path
- **Split Tab / Dual Pane** — right-click → Split Tab; opens a dual-pane view with the current tab paired
- **Close tabs** — X button appears on hover; right-click → Close Tab
- **New tab** — + button at the right end of the tab bar
- **Tab context menu** (right-click on any tab):
  - Pin Tab / Unpin Tab
  - Duplicate Tab
  - Split Tab / Dual Pane
  - --- separator ---
  - Close Tab (danger color)
- **Active tab** — bottom accent border, primary background color
- **Inactive tabs** — hover highlights with background change
- **Min width** — 100px per tab; titles truncated with ellipsis at 200px max

---

## Top Bar / Navigation

The main toolbar between the tab bar and the file area. Controls from left to right:

1. **Toggle Sidebar** — PanelLeft icon; highlights when sidebar is open
2. **Back** — ArrowLeft; disabled when at history start
3. **Forward** — ArrowRight; disabled when at history end
4. **Refresh** — RotateCw icon; reloads current directory
5. **Path bar** — shows current path as text; click to edit (becomes text input with accent border); Enter to navigate, Escape/blur to cancel
6. **Search bar** — inline search input with Search icon; type to filter/search; X button to clear
7. **View mode toggle** — 3 buttons: Grid (LayoutGrid), List (List), Gallery (Image); active state highlighted
8. **Icon size slider** — range 16–128px with Minus/Plus icons flanking; adjusts grid thumbnail size in real-time
9. **Dual Pane toggle** — PanelRight icon; when >2 tabs exist, shows a dropdown picker to choose which tab to pair with; dropdown items show accent dot
10. **Settings** — gear icon; opens Settings Panel

---

## Sidebar

Left-side navigation panel (min 160px, resizable via drag handle on right edge).

### Favorites Section
- **6 system folders** — Desktop, Downloads, Documents, Pictures, Videos, Music (each with appropriate icon)
- **User favorites** — from localStorage; separated from system folders by a divider
- Click any item to navigate to that folder

### Drives Section
- Lists all system drives via `getDrivesWindows()` IPC
- Each drive shows a Folder icon (accent-colored) + drive letter

### Recent Section
- Recently accessed files via `getRecentFiles()` IPC
- Limited to configurable `recentLimit` setting (default 5, options: 3/5/10/15/20/30/50)
- Each item shows FileText icon + file name
- Click to open/navigate to the file

### Tags Section
- Lists all tags from the store's `allTags` set
- **Click a tag** to filter files by that tag — highlights active tag with accent background
- **Clear filter** button (X icon) appears when a tag filter is active
- Empty state: "No tags yet"

### Sidebar Controls
- **Collapse/close button** — ChevronLeft icon at top-right
- **Section collapse/expand** — animated chevron rotation (150ms transition)
- **Resizable** — drag handle on right edge (4px wide, cursor: col-resize, highlights on hover)
- Section headers: uppercase, 11.5px, 600 weight

---

## File Area & Views

The main file listing area supporting 3 view modes with full interaction.

### Grid View
- Responsive grid: `auto-fill, minmax(cellW, 1fr)` where cellW = max(iconSize+40, 90)
- Each cell: icon/thumbnail + filename + tag badges (max 3 visible)
- **Thumbnail mode** — toggle bar with Eye/EyeOff icon; when enabled, image thumbnails loaded via batch IPC (`readImageThumbnailsBatch`)
- Folders shown first, then files alphabetically

### List View
- Table layout with sticky header row
- **Columns:** Icon, Name, Size, Date Modified, Tags
- Tag display: max 2 visible tags + overflow count badge
- Folder sizes calculated and displayed asynchronously
- Sort by any column (click header)

### Gallery View
- Filtered to image files only
- 2-column grid (min 200px)
- 150px-tall thumbnail area + filename below
- Empty state: "No images in this folder"

### Additional File Area Features
- **Thumbnail toggle bar** — Eye/EyeOff icon to enable/disable image thumbnails
- **Batch Rename button** — appears when files are selected; opens BatchRenameDialog
- **Right-click on empty space** — opens BackgroundContextMenu
- **Right-click on file/folder** — opens ContextMenu
- **Empty state** — folder icon + message, or "Select a folder" prompt
- **Loading state** — "Loading..." text with spinner

---

## Status Bar

Bottom bar (22px min-height) showing app state and quick-access toggles.

### Left Side — Info
- **File count** — "N items" + "X folders, Y files"
- **Search filter active** — "Filtering: query" (accent-colored)
- **Active tag filter** — "Tag: tagname" (accent-colored)
- **Dual Pane indicator** — accent-colored label when dual pane is active
- **Loading indicator** — shown while directory loads

### Right Side — Toggle Buttons (7 buttons with optional count badges)

| Button | Icon | Tooltip | Shortcut |
|--------|------|---------|----------|
| Command History | History | "Command History" | Ctrl+Shift+H |
| Favorite Commands | Bookmark | "Favorite Commands" | Ctrl+Shift+F |
| Clipboard Manager | Clipboard | "Clipboard Manager" | Ctrl+Shift+V |
| Workspace Profiles | Layers | "Workspace Profiles" | Ctrl+Shift+W |
| Undo History | Clock | "Undo History" | Ctrl+Z / Ctrl+Y |
| Multi-Window Sync | Link | "Enable multi-window sync" | Ctrl+Shift+S |
| Transfers | ArrowDownToLine | Active transfer count badge | — |

Each button shows a count badge when relevant and highlights with accent-bg when its panel is open.

---

## File Operations

| Operation | How |
|-----------|-----|
| Open | Double-click, Enter, or right-click → Open |
| Copy | Ctrl+C or right-click → Copy |
| Cut | Ctrl+X or right-click → Cut |
| Paste | Ctrl+V or right-click → Paste |
| Rename | F2 or right-click → Rename (inline) |
| Delete | Delete key or right-click → Delete |
| Compress | Right-click → Compress to ZIP |
| Share | Right-click → Share (copies path to clipboard) |
| Properties | Right-click → Properties |
| New Folder | Background right-click → New Folder (inline name input) |
| New File | Background right-click → New File (inline name input) |

### Copy / Cut / Paste Details
- **Clipboard tracks files** across the app — stores paths and operation type (copy/cut)
- **Visual indicators** — cut files shown with reduced opacity
- **Paste conflict resolution** — when pasting files that already exist, the Conflict Dialog opens
- **Custom Transfer Center** — file copy/move uses the Transfer Center with progress tracking instead of the OS copy dialog

### Compress
- Creates a ZIP archive in the same directory using the `archiver` library
- Archive named `archive.zip` (or `archive (N).zip` if name exists)
- Shows in Transfer Center during compression

---

## Context Menus

### File/Folder Context Menu (right-click on item)

1. **Open** — navigates folders, previews files
2. --- separator ---
3. **Copy** — copies selected items (shows count if multi-select)
4. **Cut** — cuts selected items (shows count if multi-select)
5. **Paste here** — only shown if clipboard has items; pastes into folder or parent directory
6. **Rename** — inline rename input (Enter to confirm, Escape to cancel, blur to cancel)
7. **Delete** — danger-colored, deletes file
8. --- separator ---
9. **Color Label** (folders only) — submenu with 7 options: None, Red, Orange, Yellow, Green, Blue, Purple — each with colored circle
10. **Add to Favorites / Remove Favorite** (folders only) — toggles favorite status
11. --- separator ---
12. **Manage Tags** (files only) — submenu showing existing tags as removable badges, text input to add new tags, "Add" button — works with multi-select
13. --- separator ---
14. **Compress to ZIP** — creates archive in parent directory
15. **Bookmark This File** — adds to favorites bar
16. **Share (Copy Path)** — copies path(s) to system clipboard
17. **Analyze Folder** (folders only) — opens Folder Analysis dialog
18. --- separator ---
19. **Run AI Action** — muted/placeholder (coming soon)
20. **Automation** — muted/placeholder (coming soon)
21. --- separator ---
22. **Properties** — opens Properties Panel

### Background Context Menu (right-click on empty space)

1. **New Folder** — inline input for folder name (default: "New Folder"), Create button
2. **New File** — inline input for file name (default: "newfile.txt"), Create button
3. --- separator ---
4. **Paste here** — only shown if clipboard has items
5. --- separator ---
6. **Refresh** — refreshes current directory
7. --- separator ---
8. **Add to Favorites / Remove from Favorites** — toggles for current directory
9. **Analyze Folder** — opens Folder Analysis for current directory

Both menus clamp their position to stay within viewport bounds.

---

## Search & Command Palette

A spotlight-style overlay (560px wide, 10vh from top) with two modes.

### File Search (Ctrl+P)

- Full-text file search via Go-based indexer (`api.searchQuery()`)
- Debounced input (150ms)
- Results show: file/folder icon, highlighted match text, file path, file size
- Click any result or press Enter to open/navigate
- **Index status** — displays "Index not built" or "Building index... (N files indexed)"

### Command Palette (Ctrl+Shift+P)

16 commands available:

| Command | Action |
|---------|--------|
| Toggle Sidebar | Ctrl+B |
| Toggle Dual Pane | Ctrl+Shift+\ |
| Grid View | Switch to grid |
| List View | Switch to list |
| Gallery View | Switch to gallery |
| Go Back | Alt+Left |
| Go Forward | Alt+Right |
| Refresh | F5 |
| New Tab | Ctrl+T |
| Close Current Tab | Ctrl+W |
| Previous Tab | Ctrl+Shift+Tab |
| Next Tab | Ctrl+Tab |
| QR Generator | Opens QR tool |
| Terminal | Opens terminal |
| Color Tool | Opens color picker |
| Settings | Opens settings |

### Advanced Filters Panel

Toggle via the filter icon in the search overlay header.

#### Quick Filter Input
- Supports smart filter syntax (see [Search Parser](#search-parser-smart-filters))
- Examples: `type:pdf size>5MB tag:important`, `photos from last summer`
- **Parsed filter chips** — detected filters shown as accent-colored badges below the input

#### Manual Filter Controls (2-column grid)
- **Type** — dropdown: All / Files only / Folders only
- **Extension** — text input (.txt, .pdf, .py, etc.)
- **Min Size** — number input + unit selector (B / KB / MB / GB / TB)
- **Max Size** — number input + unit selector
- **Modified After** — date picker
- **Modified Before** — date picker
- **Author** — text input
- **Tags** — text input
- **Color** — dropdown: Any / Red / Orange / Yellow / Green / Blue / Purple / Pink
- **Reset filters** button — clears all filters and quick filter input

**Manual filters take priority** over quick filter parsed filters.

### Saved Searches

- **Save button** (Save icon in header) — saves current query + all active filters
- **Saved Searches panel** (Bookmark icon toggle):
  - Name input + Save button to create new saved search
  - List of saved searches with: name, query preview text, click to load, delete button (X)
  - Click a saved search → loads its query into Quick Filter and opens the Filters panel
- Saved searches persisted to localStorage (`pdx_saved_searches`)

---

## Search Parser (Smart Filters)

A dual-mode parser supporting structured filter syntax and natural language queries.

### Smart Filter Syntax

| Syntax | Filter | Examples |
|--------|--------|---------|
| `type:X` or `t:X` | File type or extension | `type:pdf`, `type:files`, `type:folder`, `type:image` |
| `ext:X` or `extension:X` | Extension | `ext:py`, `extension:txt` |
| `tag:X` or `tags:X` | Tag filter | `tag:important` |
| `color:X` or `colour:X` | Color label | `color:red` |
| `author:X` | Author metadata | `author:john` |
| `modified:X` / `date:X` / `after:X` | Minimum date | `modified:yesterday`, `date:last week` |
| `before:X` | Maximum date | `before:last month` |
| `size>X` or `s>X` | Minimum size | `size>5MB`, `s>100KB` |
| `size<X` or `s<X` | Maximum size | `size<1GB` |
| `size=X` or `s=X` | Exact size | `size=1MB` |

### Natural Language Parsing

Recognizes patterns in freeform text:
- **Size:** "larger than 5mb", "smaller than 100kb", "under 2gb", "over 10mb", "size 500kb"
- **Date:** "modified yesterday", "updated today", "changed last week", "edited 3 days ago", "from last month", "before june 2024"
- **Tag:** "tagged with important", "tag work"
- **Color:** "red files", "blue", "green"
- **Type shortcuts:** "images", "photos", "videos", "movies", "audio", "music", "documents", "pdfs", "code", "python", "javascript", etc.
- **Filter modifiers:** "files only", "folders only"

### Relative Date Support
- today, yesterday
- this week, last week
- this month, last month
- this year, last year
- Seasons: spring, summer, autumn/fall, winter
- Relative: "N days/weeks/months/years ago"
- Future: "N days/weeks/months/years from now"
- Named months: "june 2024", "jan 2023"

### Size Unit Support
- B, KB, MB, GB, TB (case-insensitive)

### Extension Aliases (30+ mappings)
- `image`/`photo`/`picture` → jpg
- `video`/`movie` → mp4
- `audio`/`music`/`song` → mp3
- `document`/`doc` → pdf
- `text` → txt
- `code`/`source` → js
- `zip`/`archive` → zip
- `python` → py, `javascript` → js, `typescript` → ts
- `unity` → unity, `blender` → blend, `psd` → psd, and more

### Noise Word Removal
Strips common words from text queries: "the", "a", "an", "all", "every", "find", "show", "search", "for", "with", "that", "which", "in", "on", "at"

---

## Keyboard Navigation

### File Area Navigation

| Key | Action |
|-----|--------|
| Arrow Down / Arrow Right | Move focus to next file |
| Arrow Up / Arrow Left | Move focus to previous file |
| Home | Jump to first item |
| End | Jump to last item |
| Enter | Open folder or preview file |
| Backspace | Go up to parent directory |
| Delete | Delete focused file |
| F2 | Open context menu (rename) |
| Space | Preview selected file (when exactly 1 selected) |

- Auto-scrolls to keep focused item visible
- Single-select mode while using keyboard navigation

### Preview Navigation

| Key | Action |
|-----|--------|
| Arrow Left | Previous file in directory |
| Arrow Right | Next file in directory |
| + / = | Zoom in (+25%) |
| - | Zoom out (-25%) |
| 0 | Reset zoom to 100% and pan to origin |
| Escape | Close preview |

---

## Drag & Drop

- **Drag files between folders** — drag a file onto a folder to move it
- **Ctrl+Drag** — hold Ctrl while dragging to copy instead of move
- **Visual indicator** — green outline on the drop target folder
- **Works in grid and list views**
- **Files are draggable** — sets `application/json` data with paths array and operation "copy"
- **Tab reordering** — drag tabs to rearrange them; visual indicator (2px accent left border) at drop position

---

## Rubber Band Selection

- Click on empty space in the file area and drag to create a **selection rectangle**
- All items intersecting the rectangle become selected
- Visual rectangle overlay shown during drag
- Works in grid, list, and gallery views
- Ctrl+click adds to existing selection

---

## Tags & Color Labels

### Tags
- Right-click → Tag → Add custom tags (e.g., "Vacation", "Work", "Important")
- Tags are stored in `.powerdesk_meta.json` alongside files
- Tags shown as colored badges in grid view (max 3) and list view (max 2 + overflow count)
- Remove tags via right-click → Tag → click X on tag badge
- **Filter files by tag** via sidebar Tags section — click a tag to filter, click again to clear
- Tags persist across sessions
- **Multi-select tag editing** — select multiple files, right-click → Manage Tags to add/remove tags on all selected files

### Color Labels
- Right-click → Color → Pick from 7 colors: None, Red, Orange, Yellow, Green, Blue, Purple
- Color dots shown on file icons
- Filter by color in advanced search (Color dropdown)
- Folders only for color labels

---

## File Preview (Preview++)

A full-screen overlay preview system supporting 40+ file types.

### Supported File Types

| Category | Extensions | Renderer |
|----------|-----------|----------|
| Images | .png, .jpg, .jpeg, .gif, .webp, .bmp, .svg, .avif, .heic, .tiff, .ico | `<img>` with zoom/pan |
| Video | .mp4, .webm, .mov, .avi, .mkv | `<video>` with native controls |
| Audio | .mp3, .wav, .ogg, .flac, .m4a, .wma | `<audio>` with native controls |
| PDF | .pdf | `<iframe>` |
| Markdown | .md, .markdown, .mdx | Rich HTML rendering |
| Code | 35+ extensions (.js, .ts, .py, .go, .java, .c, .cpp, .rs, .rb, .php, .html, .css, .sql, .sh, .bat, .ps1, .yaml, .toml, .xml, .env, .gitignore, etc.) | Syntax highlighting |
| JSON | .json, .jsonl | Pretty-printed with `JSON.stringify` |
| CSV/TSV | .csv, .tsv | HTML table with sticky headers |
| Plain text | 38+ extensions (.txt, .log, .ini, .cfg, .conf, etc.) | Monospace pre-wrap |

### Image Preview Features
- Full-screen dark overlay (black 85% opacity, blur backdrop)
- **Zoom** — scroll wheel (0.1x to 10x range, 0.15 increments per scroll)
- **Pan** — mouse drag when zoomed in
- **Floating zoom controls** — Zoom Out button, percentage display, Zoom In button, Reset button
- **Floating navigation arrows** — left/right arrows at screen edges
- **File name label** — top-left with blurred background
- **Close button** — top-right X

### Non-Image Preview Features
- Header bar with: file type icon, file name, full path, navigation buttons (prev/next), close button
- Footer bar with: file size, modified date, created date, keyboard hint ("Navigate / Close")

### Markdown Rendering
- Headings (h1–h6)
- Bold, italic
- Code blocks with background
- Inline code
- Blockquotes
- Links and images
- Ordered and unordered lists
- Horizontal rules

### Code Syntax Highlighting
- **JavaScript/TypeScript** — keywords (const, let, var, function, async, await, return, import, export, class, if, else, for, while, switch, case, break, continue, try, catch, throw, new, this, typeof, instanceof, void, delete, in, of), strings, comments (// and /* */), numbers
- **Python** — keywords (def, class, if, elif, else, for, while, return, import, from, as, try, except, finally, raise, with, yield, lambda, pass, break, continue, and, or, not, in, is, True, False, None, print, self), strings, comments (#), numbers
- **Go** — keywords (func, package, import, var, const, type, struct, interface, map, chan, go, defer, select, case, default, switch, if, else, for, range, return, break, continue, fallthrough, nil, true, false, make, new, len, cap, append), strings, comments (// and /* */), numbers

### Recently Viewed Tracking
- Files opened in preview are tracked via `api.trackRecent()` for the sidebar Recent section

---

## Properties Panel / File Inspector

A right-side slide-in panel (360px wide) showing file/folder properties.

### General Tab

**Header:**
- Type-aware icon (Folder, Image, Video, Music, FileText, or File) — 48×48 display
- Human-readable type name (e.g., "PNG Image", "Python", "JSON", "ZIP Archive") — 30+ type mappings

**Property rows:**
- Location (parent directory path)
- Size (for folders: calculated asynchronously; for files: immediate)
- Extension
- Modified date
- Created date
- Accessed date
- Type (File / Folder)

**Image section** (for image files, uses Sharp for metadata):
- Format (e.g., "PNG")
- Dimensions (e.g., "1920 × 1080 px")
- DPI (density)
- Color Space
- Channels
- Bit Depth
- Has Alpha
- Dominant Color (hex swatch)

**Tags section** — colored tag badges with remove option

**Color Label section** — color swatch + hex value

### EXIF / Metadata Tab

**Camera Info section:**
- Make, Model, ISO, Focal Length, Aperture, Exposure Time, Date Taken, Software, Artist, Copyright

**Full Image Metadata section:**
- All key/value pairs from image EXIF data (excluding the EXIF sub-object)

**Supported image extensions for EXIF:** .jpg, .jpeg, .png, .gif, .webp, .tiff, .tif, .bmp, .svg, .avif, .heic, .heif

---

## Transfer Center

A floating panel (fixed bottom-right, 420px wide, max 480px tall) that replaces the Windows copy dialog.

### Per-Transfer Display
- **Status icon** — download arrow (running), clock (paused), checkmark (completed), X-circle (cancelled)
- **File name** — truncated with ellipsis
- **Operation type** — "Copying" or "Moving"
- **File progress** — completed files / total files (e.g., "3/10 files")
- **Byte progress** — formatted (e.g., "45.2 MB / 128.0 MB")
- **Progress bar** — color-coded: accent (running), warning (paused), success (complete no errors), warning (complete with errors)
- **Speed** — bytes/sec formatted (e.g., "12.4 MB/s")
- **ETA** — estimated time remaining (seconds/minutes/hours format) while running
- **Error display** — error count and first error message with warning triangle icon

### Per-Transfer Controls
- **Pause** button (when running)
- **Resume** button (when paused)
- **Cancel** button (when running or paused) — danger/red colored
- **Retry** button (when completed with errors, or when cancelled)
- **Check circle** icon (when completed with no errors — no action needed)

### Panel Controls
- Active transfer count badge in header
- Close button (X)
- Floating panel with 60% black backdrop and 4px blur

### Technical Details
- Uses custom file copy with 64KB chunk progress tracking
- IPC-based pause/resume/cancel/retry
- Transfers persisted to localStorage for recovery

---

## Universal Undo / Redo

Everything is reversible. Every file operation is logged.

### Supported Operation Types

| Type | Icon | Color |
|------|------|-------|
| delete | Trash | Red |
| rename | FileText | Accent |
| move | FolderInput | Blue (#3498db) |
| copy | FileText | Green (#2ecc71) |
| replace | FileText | Red (#e74c3c) |
| tag | Tag | Orange (#f39c12) |
| color | Palette | Purple (#9b59b6) |
| compress | Archive | Orange (#e67e22) |
| create-folder | FolderPlus | Green (#2ecc71) |
| create-file | FileText | Blue (#3498db) |

### Undo History Panel
- Accessible via StatusBar clock icon or Ctrl+Z
- Shows all operations with: colored icon in tinted background, description text, relative timestamp ("Just now", "5m ago", "2h ago", "3d ago")
- **Undo button** — disabled when undo stack is empty
- **Redo button** — disabled when redo stack is empty
- Count badge showing undo stack length
- Close by clicking outside (backdrop)

### Persistence
- Undo/redo stacks persisted to localStorage (max 100 entries each)
- Survives app restarts

---

## Folder Analysis

A full-screen modal dialog (inset 40px from each edge) for deep folder analysis.

### Triggers
- Right-click folder → Analyze Folder
- Background context menu → Analyze Folder
- Favorite Commands → Analyze Folder
- Command Palette → not yet

### Controls
- **Analyze** button (disabled if no path)
- **Re-analyze** button (when data exists)
- Close button (X)

### Overview Tab

**4 stat cards:**
- Total Size
- Files count
- Folders count
- Average File Size

**Pie chart** (SVG donut) — file size distribution across 5 buckets:
- < 1 MB
- 1–10 MB
- 10–100 MB
- 100 MB – 1 GB
- > 1 GB
- Center shows total file count

**File Types card** — horizontal bar chart of top 12 extensions with:
- Colored bars (30+ extension-to-color mappings)
- Extension name
- File count
- Total size per extension

**3 additional stat cards:**
- Empty Folders count
- Old Files (90+ days) count
- Duplicate Groups count

### Files Tab
- **Largest Files** list — file name with extension-colored icon, file path (tooltip), size
- **Recently Modified** list — file name, modification date

### Duplicates Tab
- **Duplicate Files** grouped by content hash
- Shows: group count, per-copy size, total wasted space
- Lists all file paths in each duplicate group

### Folders Tab
- **Largest Folders** list — folder name, path (tooltip), size
- **Empty Folders** list — all empty folder paths

### Color Coding
30+ extension types mapped to distinct colors:
- JS/TS = yellow, Python = blue, HTML = orange, CSS = cyan
- Images = pink/purple, Video = purple, Audio = cyan
- Archives = brown, Documents = green, Config = gray, etc.

---

## Clipboard Manager

A right-side panel (340px wide) showing clipboard history.

### Features
- **Search bar** — filters clipboard entries by content text or file names/paths
- **Two tabs:** "All (N)" and "Pinned (N)"
- **Auto-focuses** search input when opened

### Entry Types

**Text entries:**
- First line as title
- Up to 120 chars preview in body
- Plain text icon

**Code entries** (auto-detected):
- Detected via regex patterns: import/export statements, arrow functions, braces/semicolons, `console.log`, HTML tags
- Orange FileText icon to distinguish from plain text
- Treated the same as text for copying

**File clipboard entries:**
- File icon (accent-colored)
- File name(s) or count ("3 files")
- Shows paths

### Per-Entry Controls
- **Click** to copy back to system clipboard
- **Pin/Unpin** button (Star icon) — pins persist across clears
- **Remove** button (Trash icon)
- **Timestamp** — "Just now", "5m ago", "2h ago", "3d ago", or date
- **"Copied!" flash** indicator after clicking

### Panel Controls
- Total items count in header
- **Clear non-favorites** button (Trash icon) — clears all unpinned entries
- Close button
- Footer hint: "Click to copy / Star to pin / Esc close"

### Persistence
- Clipboard history persisted to localStorage (max 200 entries)
- Survives app restarts
- Favorites survive clears

### System Clipboard Monitoring
- 2-second polling interval reads system clipboard text
- New text entries automatically added to history
- Deduplication — same content not added twice consecutively

---

## Command History

A centered modal (440px wide, max 80vh tall) showing a log of all file operations.

### Features
- **Two filter tabs:** "All" and "Favorites" (pill-style toggle)
- **Search input** — filters commands by description text

### Per-Entry Display
- Colored icon in tinted background (11 types: delete, rename, move, copy, cut, replace, tag, color, compress, create-folder, create-file)
- Description text
- Relative timestamp ("Just now", "5m ago", "2h ago", date)
- **Favorite/Unfavorite** button (Star icon, gold/yellow when favorited)

### Panel Controls
- **Undo** button in header — calls undo when stack has entries
- **Clear history** button (Trash icon) — clears non-favorite entries only
- Count badge in header
- Close button

### Persistence
- Command history persisted to localStorage
- Favorites survive clears

---

## Favorite Commands

A centered modal (380px wide) for managing quick-access command shortcuts.

### Supported Command Types

| Type | Icon | Description |
|------|------|-------------|
| Compress | Archive | Opens Explorer to select files for compression |
| Share | Share2 | Shares selected file path |
| Analyze Folder | FolderSearch | Opens Folder Analysis dialog |
| Open Terminal | Terminal | Opens embedded terminal |
| Batch Rename | Pencil | Opens Batch Rename dialog |

### Features
- **Add flow** — input for command name, 5 type selector buttons, Cancel/Add buttons
- **Drag and drop reordering** — GripVertical handle on left; visual drag-over indicator (accent left border + bg highlight)
- **Per command:** type icon, label, delete button (appears on hover)
- **Execute** — clicking a command runs it and closes the panel
- **Add button** in header

### Persistence
- Favorite commands persisted to localStorage

---

## Favorite Bar

A horizontal bar (below the tab bar, 28px min-height) showing bookmarked files and folders.

### Features
- Star icon at the left edge
- Each favorite shows: Folder or File icon (accent-colored), name (max 120px, truncated)
- **Drag and drop** — items are draggable; can reorder favorites by dragging
- **Click to navigate:**
  - Folders → navigates directly to the path
  - Files → navigates to parent directory, then opens preview
- **Remove button** (X icon) — appears on hover only
- **Hover state** — background highlight
- **Title tooltip** — shows full path

### Empty State
- "Right-click a file or folder to add to favorites"

### Toggle
- Ctrl+Shift+B to toggle visibility
- StatusBar bookmark button also toggles

---

## Workspace Profiles

A centered modal (420px wide) for saving and loading workspace layouts.

### What Gets Saved
- All open tabs with their paths
- UI theme (colors, accent, opacity, font, corner radius, etc.)
- Current settings

### Features
- **Save Current** button — opens an inline text input for profile name
- **Create flow** — text input with Enter to confirm, Escape to cancel, Check button to confirm, X to cancel
- **Profile list** showing each profile with:
  - Colored gradient icon box (uses the profile's accent color)
  - Profile name
  - Tab count (e.g., "3 tabs")
  - Creation date
- **Inline rename** — click pencil icon, type new name, Enter to confirm, Escape/blur to save
- **Delete** button per profile (Trash icon)
- **Click a profile** to load it (closes the panel)

### Keyboard Shortcuts
- Enter — confirm create/rename
- Escape — cancel create/rename

### Persistence
- Profiles persisted to localStorage
- Survives app restarts

---

## Multi Window Sync

Synchronize navigation, selection, and scrolling across multiple PowerDesk windows.

### Features
- **Toggle** — Ctrl+Shift+S or StatusBar Link icon
- **New Window** — Ctrl+N opens a new BrowserWindow
- **Syncs:**
  - Navigation (when you change directories, all synced windows follow)
  - Selection (when you select files, all synced windows select the same files)
- **IPC-based** — uses Electron IPC relay between windows via `syncBroadcast` / `onSyncMessage`
- Useful when comparing folders side-by-side in separate windows

---

## Batch Rename

A modal dialog for renaming multiple files at once.

### Pattern
`{name} ({number}).{ext}`

### Controls
- **Name pattern** — text input (e.g., "Photo", "Screenshot")
- **Start number** — number input (min: 0)
- **Zero padding** — number input (min: 0, max: 10); e.g., padding 3 = 001, 002, 003
- **Live preview** — shows `oldname` (strikethrough) → `newname` for all selected files, scrollable list
- **Cancel** button
- **Rename** button — disabled when pattern is empty or rename is running; shows "Renaming..." spinner text during execution

### Example
Files: `IMG_001.jpg`, `IMG_002.jpg`, `IMG_003.jpg`
Pattern: `Vacation`, Start: 1, Padding: 2
Result: `Vacation (01).jpg`, `Vacation (02).jpg`, `Vacation (03).jpg`

---

## Conflict Dialog

A modal dialog for resolving file paste/copy conflicts when files with the same name already exist at the destination.

### Per-File Conflict Row
- File name (truncated, tooltip for full path)
- **3 action buttons:**
  - **Replace** (danger color) — overwrite existing file
  - **Skip** (secondary) — leave existing file, don't copy
  - **Rename** (accent color) — copy with incremented name
- Active state shows filled background color for selected action

### Apply to All (when >1 conflict)
- **Replace All** — replace every conflicting file
- **Skip All** — skip every conflicting file
- **Rename All** — rename every conflicting file

### Footer
- **Cancel** button — closes without resolving any conflicts
- **Confirm** button (accent, with Check icon) — applies chosen actions

### Backdrop
- 60% black with 4px blur

---

## Built-in Tools

### QR Generator
- Open via Ctrl+Shift+P → "QR Generator"
- **Text input** — textarea for text or URL
- **Live QR code preview** — rendered on canvas (256×256px, margin 2, dark: #e0e0e0, light: #1a1a2e)
- **Download PNG** button — downloads canvas as `qrcode.png` via blob URL
- Empty state: "Type something to generate"

### Terminal
- Open via Ctrl+Shift+P → "Terminal"
- **Embedded PowerShell terminal** (640×420px modal, dark theme #0d1117)
- **Command input** at bottom with "PS>" prompt
- **Command history** — scrollable list showing:
  - "PS> command" in blue (#58a6ff)
  - stdout output in light gray (#c9d1d9)
  - stderr/error output in red (#f85149)
- **Loading state** — "Running..." indicator
- **Auto-scroll** to bottom on new output
- CWD set to active tab's path
- GitHub-dark themed (matches VS Code terminal aesthetic)

### Color Tool
A comprehensive color picker (440px wide modal).

#### HSV Picker
- **Saturation/Value canvas** — 240×240px, crosshair cursor, click+drag to pick
- **Hue bar** — 240×20px horizontal rainbow gradient, click+drag to pick hue

#### Preview
- 52×52px color swatch with border
- Native `<input type="color">` picker
- **HEX input** — text input, validates `#RRGGBB` format
- **Alpha slider** — range 0–100%, with percentage display

#### Color Values (6 formats, click to copy)
- **HEX** — e.g., "#2196F3"
- **RGB** — e.g., "33, 150, 243"
- **HSL** — e.g., "207, 90%, 54%"
- **HSV** — e.g., "207, 86%, 95%"
- **CSS** — e.g., `rgb(33,150,243)` or `rgba(...)` with alpha
- **Int** — numeric integer value

#### Contrast Checker (collapsible)
- Background color picker
- Preview box showing foreground on background with "Aa" text
- **WCAG contrast ratio** display (e.g., "4.5:1")
- **WCAG grade:** AAA (>=7), AA (>=4.5), AA Large (>=3), Fail (<3)

#### Color Harmonies (collapsible)
5 harmony types, each showing the base color + derived colors:
- **Complementary** (1 color, +180 degrees)
- **Analogous** (2 colors, +30/-30)
- **Triadic** (2 colors, +120/+240)
- **Split Complementary** (2 colors, +150/+210)
- **Tetradic** (3 colors, +90/+180/+270)

Click any harmony swatch to adopt that color.

#### Favorites (max 16)
- Star toggle button in header
- Color swatches in a flex-wrap grid
- Right-click to remove from favorites
- Persisted to localStorage (`pdx_color_favs`)

#### History (max 24)
- Color swatches in flex-wrap grid
- Clear button
- Persisted to localStorage (`pdx_color_history`)

#### Presets
- 24 preset colors in an 8-column grid (Material Design palette + grayscale + white)

---

## Settings & UI Customization

Access via the gear icon in the top bar or Ctrl+Shift+P → "Settings".

### General Tab

#### Appearance Section
- **Default View Mode** — dropdown: Grid / List / Gallery
- **Show Hidden Files** — toggle

#### Behavior Section
- **Confirm Before Delete** — toggle
- **Sidebar Open by Default** — toggle
- **Recent Files Limit** — dropdown: 3 / 5 / 10 / 15 / 20 / 30 / 50

#### Startup Section
- **Open Folder on Launch** — text input (leave empty for home directory)

#### About Section
- Version: PowerDesk v0.1.0
- Tagline: "The operating system you wish Windows came with."
- Tech stack: Electron + React + TypeScript + Vite

#### Keyboard Shortcuts Section
15 shortcuts listed in a table (see [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference))

### Customize UI Tab

#### Quick Themes (8 presets)
| Theme | Accent Color |
|-------|-------------|
| Midnight Purple | #7c5cfc |
| Ocean Blue | #3b82f6 |
| Forest Green | #22c55e |
| Sunset Orange | #f97316 |
| Rose Pink | #f43f5e |
| Neon Cyan | #06b6d4 |
| Warm Light | #8b5cf6 (light bg) |
| Pure White | #6366f1 (white bg) |

#### Transparency Section
- **Window Opacity** — range slider (30–100%); applies real Electron window transparency via `setOpacity()`
- **Blur Background** — toggle; adds `backdrop-filter: blur(12px)` to root

#### Corners Section
- 3 options with live preview:
  - **Sharp** — 0px border radius
  - **Round** — 6px border radius
  - **Pill** — 16px border radius (20px/24px for larger elements)

#### Colors Section (7 color pickers with hex display)
- Accent color
- Background (main window background)
- Surface (secondary panels)
- Elevated (hover states, raised elements)
- Text color
- Muted text
- Sidebar background
- **Borders** — Visible / Hidden dropdown

#### Typography Section
- **Font Size** — range slider (10–18px); applied via `--font-size-base` CSS variable
- **Custom Font** — text input for font family name

#### Effects Section
- **Animated Transitions** — toggle all UI animations on/off (150ms ease vs 0ms)

#### Reset
- **"Reset All UI"** button (red/danger) — clears all UI customization from localStorage and reloads the app

---

## Keyboard Shortcuts Reference

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+T | New Tab |
| Ctrl+W | Close Tab |
| Ctrl+Tab | Next Tab |
| Ctrl+Shift+Tab | Previous Tab |
| Ctrl+P | Search Files |
| Ctrl+Shift+P | Command Palette |
| Ctrl+B | Toggle Sidebar |
| Ctrl+Shift+\\ | Toggle Dual Pane |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+Shift+V | Clipboard Manager |
| Ctrl+Shift+H | Command History |
| Ctrl+Shift+F | Favorite Commands |
| Ctrl+Shift+W | Workspace Profiles |
| Ctrl+Shift+S | Toggle Multi-Window Sync |
| Ctrl+Shift+B | Toggle Favorite Bar |
| Ctrl+N | New Window |
| F5 | Refresh |
| F2 | Rename |
| Delete | Delete |
| Backspace | Go Up to Parent |
| Enter | Open / Navigate |
| Space | Preview File |
| Alt+Left | Go Back |
| Alt+Right | Go Forward |
| Escape | Close Overlay / Dialog / Deselect |

### File Area Navigation

| Key | Action |
|-----|--------|
| Arrow Down / Arrow Right | Next file |
| Arrow Up / Arrow Left | Previous file |
| Home | First item |
| End | Last item |

### Image Preview

| Key | Action |
|-----|--------|
| Arrow Left | Previous file |
| Arrow Right | Next file |
| + / = | Zoom in |
| - | Zoom out |
| 0 | Reset zoom |
| Escape | Close preview |

---

## Tech Stack

- **Electron 33** — desktop shell, frameless window, IPC, transparency
- **React 18** — UI framework
- **Zustand 5** — state management (single store)
- **TypeScript 5** — type safety
- **Vite 6** — build tool and dev server
- **Lucide React** — icon library
- **Sharp** — image thumbnail generation and EXIF metadata extraction
- **Archiver** — ZIP compression
- **qrcode** — QR code generation
- **Go** — fast file indexer binary (`pdx-index.exe`)

---

*PowerDesk v0.1.0*
