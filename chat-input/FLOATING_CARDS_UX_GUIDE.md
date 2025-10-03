# Floating Cards UX Guide

## Overview
Floating cards provide a dynamic, centered display system for viewing AI responses and web content. The new UX focuses on simplicity and natural workflow.

## Key Improvements

### 1. **Single Card on Startup**
- One primary card spawns centered on init (850x500px default)
- No clutter—additional cards created only when needed
- Primary card auto-centers when messages are sent

### 2. **Streamlined Controls**
The card header now has 4 essential buttons:
- **Create New (+)**: Spawn additional cards (Ctrl+N)
- **Show/Hide Content (👁)**: Toggle iframe visibility to save performance
- **Expand/Collapse (⤢)**: Toggle between default (850x500) and expanded (1200x700) sizes
- **Close (×)**: Remove card with smooth fade-out (Esc key)

### 3. **Smooth Interactions**

#### Dragging
- Entire header is draggable (like a window title bar)
- Cursor changes to `grab` on hover, `grabbing` while dragging
- Cards constrain to viewport boundaries

#### Resizing
- 8-directional Windows-style resize handles (corners + edges)
- Handles show on hover with subtle blue tint
- Minimum size: 300x300px
- Smooth viewport constraint during resize

#### Expanding
- Click expand button or double-click header to toggle size
- Smooth transition with cubic-bezier easing
- Auto-centers after expand/collapse
- Icon changes to indicate current state

### 4. **Message Routing**

Send messages to specific cards using @mentions:
```
@1 show dashboard        → Routes to card #1
@new create report       → Creates new card and routes there
@+ analyze data          → Same as @new
Regular message          → Routes to primary card (auto-centered)
```

### 5. **Visual Polish**

- **Color-coded badges**: Each card gets a numbered badge with unique accent color
  - Card 1: Blue (#60a5fa)
  - Card 2: Violet (#a78bfa)
  - Card 3: Emerald (#34d399)
  - Card 4+: Indigo (#818cf8)

- **Liquid glass effects**: Subtle animated gradients and blur
- **Focus stacking**: Clicked cards come to front (z-index++)
- **Smooth animations**: Fade-in for new cards, fade-out for close

### 6. **Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Create new card |
| `Esc` | Close focused card |
| Double-click header | Expand/collapse |

### 7. **Responsive Design**

- Desktop (>1280px): Full size (850x500 default, 1200x700 expanded)
- Tablet (≤1280px): 90vw width, 70vh height
- Mobile (≤640px): 96vw width, 60vh height

## Usage Examples

### Basic Workflow
1. App starts with one centered card showing frontend content
2. Send a message → card auto-centers and displays content
3. Click the **eye icon** to hide/show the iframe (useful for performance)
4. Need a second view? Click **+** button or press `Ctrl+N`
5. Drag cards to arrange your workspace
6. Resize by dragging edges/corners
7. Expand for more screen real estate

### Multi-Card Workflows
- Compare two AI responses side-by-side
- Monitor dashboard in card #1, chat in card #2
- Route specific queries to dedicated cards with @mentions

## Technical Details

### Files Changed
- `chat-input.html`: Simplified markup, removed legacy 4-card setup
- `floating-cards.js`: Complete rewrite for single-card-first UX
- `floating-cards.css`: Polished controls, improved resize handles
- `messaging.js`: Auto-center primary card on message send

### Architecture
- Cards spawn from `<template id="floatingCardTemplate">`
- Registry maintains card number → element mapping
- Primary card reference for default routing
- Smooth centering via CSS transitions (0.4s cubic-bezier)

## Future Enhancements
- [ ] Card layouts (tile, cascade, grid)
- [ ] Save/restore card positions
- [ ] Card tabs/grouping
- [ ] Mini-map for navigation
- [ ] Touch gesture support (pinch to resize)

---

**Design Philosophy**: Start simple (one card), grow as needed (create more), stay elegant (smooth animations, clear controls).
