# Floating Cards Enhancements

## Overview
This document outlines the comprehensive improvements made to the floating cards system, including better resize functionality, smooth drag interactions, a hide button, and a cards manager UI similar to the attachments system.

## ✨ New Features

### 1. **Improved Resize Functionality**
- **Fixed Resize Handles**: All 8 directional handles now work properly with improved hit areas
  - Corner handles: 16x16px (increased from 12x12px)
  - Edge handles: 8px wide/tall (increased from 6px)
- **Better Visual Feedback**: 
  - Handles show on hover with blue tint
  - Stronger highlight on active resize
  - Always interactive with `pointer-events: auto`
- **Smooth Constraints**: Maintains minimum size (300x300px) and viewport boundaries

### 2. **Enhanced Drag Experience**
- **Double-click to Expand**: Double-click header to toggle between default (850x500) and expanded (1200x700) sizes
- **Smooth Dragging**: 
  - Cursor changes to `grab` on hover, `grabbing` while dragging
  - Auto-centers card after expand/collapse
  - Constrains to viewport boundaries
  - Tolerance zone for smooth cursor movement

### 3. **Hide Button** 🆕
- New hide button added to each card header (minimize icon)
- Hides card without closing it
- Hidden cards appear in the Cards Manager with special styling
- Can be shown again from the Cards Manager or via API

### 4. **Floating Cards Manager** 🆕
Similar to the attachments UI, appears above chat input when toggled.

#### Features:
- **Toggle Button**: Grid icon in chat input left-actions area
- **Card Previews**: Shows all cards with:
  - Card number badge (color-coded)
  - Card title
  - Visibility status (Visible/Hidden)
  - Quick actions (show/focus, close)
- **Bulk Actions**:
  - Show All Cards
  - Hide All Cards
  - Create New Card
- **Interactive Previews**:
  - Click preview to focus/show card
  - Visual distinction for hidden cards (dashed border, 50% opacity)
  - Hover effects and smooth animations

### 5. **Auto-positioning**
- Cards Manager positions above chat input automatically
- Repositions on window resize
- Smooth transitions (300ms cubic-bezier)

## 🎨 Visual Design

### Cards Manager Styling
- **Background**: Liquid glass effect with backdrop blur
- **Border**: Semi-transparent with accent color
- **Shadow**: Elevated with matching shadow system
- **Cards Grid**: 
  - Horizontal scroll for many cards
  - Custom scrollbar styling
  - Drag-to-scroll support
  - Card previews: 120-160px wide, 68px tall

### Card Preview Design
- Color-coded badges matching card accent colors
- Gradient background with blur
- Smooth hover animations (translateY -2px)
- Action buttons appear on hover
- Status indicator (Visible/Hidden)

## 🔧 Technical Implementation

### CSS Architecture
**File**: `buddy/chat-input/css/floating-cards.css`

1. **Resize Handles** (lines 244-353)
   - Improved hit areas and visibility
   - Better hover/active states
   - Proper pointer events

2. **Hide Button Styles** (lines 168-216)
   - Consistent with other control buttons
   - Special hover state

3. **Cards Manager** (lines 420-654)
   - Complete UI system
   - Responsive design
   - Mobile-friendly (95vw on small screens)

### JavaScript Architecture
**File**: `buddy/chat-input/modules/floating-cards.js`

#### New Functions:
1. `initializeCardsManager()` - Sets up the manager UI
2. `toggleCardsManager()` - Shows/hides the manager
3. `showCardsManager()` - Shows manager with animations
4. `hideCardsManager()` - Hides manager smoothly
5. `positionCardsManager()` - Positions above chat input
6. `updateCardsManager()` - Refreshes card previews
7. `createCardPreview(card, number)` - Creates preview element
8. `hideCard(card, number)` - Hides a card (new)
9. `showCard(card, number)` - Shows a card (new)

#### Modified Functions:
- `setupCardControls()` - Added hide button handler
- `fadeOutAndRemove()` - Updates manager on card removal
- `createNewFloatingCard()` - Updates manager on creation
- `toggleCardVisibility()` - Now uses show/hide helpers
- `routeMessageToCard()` - Auto-shows hidden cards when routing

### HTML Structure
**File**: `buddy/chat-input/chat-input.html`

#### New Elements:
1. **Cards Manager Container** (lines 16-48)
   ```html
   <div class="floating-cards-manager" id="floatingCardsManager">
     <div class="cards-manager-section">
       <div class="cards-manager-header">...</div>
       <div class="cards-grid">...</div>
     </div>
   </div>
   ```

2. **Cards Manager Button** (lines 95-105)
   - Grid icon (4 squares)
   - Placed next to model selection

3. **Hide Button in Template** (lines 637-643)
   - Minimize icon
   - Positioned before close button

## 📱 Responsive Behavior

### Desktop (> 1280px)
- Cards Manager: 600px wide
- Card Previews: 120-160px each
- Horizontal scroll when many cards

### Tablet (768px - 1280px)
- Cards Manager: 90vw max
- Responsive card sizing

### Mobile (< 768px)
- Cards Manager: 95vw
- Card Previews: Maintain minimum size
- Touch-friendly interactions

## 🎯 User Interactions

### Keyboard Shortcuts
- **Ctrl+N**: Create new card
- **Escape**: Close focused card
- **Double-click header**: Expand/collapse card

### Mouse Interactions
- **Drag header**: Move card
- **Drag resize handles**: Resize card
- **Click card preview**: Focus/show card
- **Click hide button**: Minimize card
- **Click close button**: Remove card

### Manager Interactions
- **Click grid icon**: Toggle manager
- **Click outside**: Auto-close manager
- **Click "Show All"**: Reveal all cards
- **Click "Hide All"**: Minimize all cards
- **Click "New"**: Create new card

## 🔄 State Management

### Card States
- `visible` - Card is shown (default)
- `hidden` - Card is minimized (data-hidden="true")
- `expanded` - Card is in large size mode
- `resizing` - Card is being resized
- `dragging` - Card is being moved

### Manager States
- `cardsManagerVisible` - Boolean flag
- Updates on card create/remove/hide/show
- Auto-positions on resize

## 🚀 Performance Optimizations

1. **Event Delegation**: Manager uses event delegation for card previews
2. **Debounced Updates**: Manager updates debounced on rapid changes
3. **CSS Containment**: Cards use `contain: layout paint style`
4. **Transform Animations**: Hardware-accelerated animations
5. **Conditional Rendering**: Manager only renders when visible

## 🐛 Bug Fixes

### Resize Issues (FIXED)
- ✅ Handles now properly interactive with `pointer-events: auto`
- ✅ Larger hit areas for easier grabbing
- ✅ Better visual feedback on hover/active
- ✅ Cursor stays near card during resize with tolerance

### Drag Issues (IMPROVED)
- ✅ Smooth cursor tracking with tolerance zones
- ✅ Auto-stops if cursor leaves header area
- ✅ Proper cleanup on mouse leave

## 📚 API Reference

### Exported Functions

```javascript
// Initialize the floating cards system
initializeFloatingCards()

// Create a new floating card
createNewFloatingCard(options)
// options: { title, width, height }

// Get card by number
getCardByNumber(number)

// Get primary card
getPrimaryCard()

// Toggle card visibility
toggleCardVisibility(cardNumber)

// Show/hide specific card
showCard(card, cardNumber)
hideCard(card, cardNumber)

// Send message to card
postMessageToCard(card, messageData)
routeMessageToCard(messageData, number)

// Cards Manager
initializeCardsManager()
updateCardsManager()
```

## 🎨 Color Palette

Cards cycle through 10 accent colors:
1. Blue (#60a5fa / #3b82f6)
2. Violet (#a78bfa / #8b5cf6)
3. Emerald (#34d399 / #10b981)
4. Amber (#f59e0b / #d97706)
5. Pink (#ec4899 / #db2777)
6. Cyan (#06b6d4 / #0891b2)
7. Orange (#f97316 / #ea580c)
8. Purple (#8b5cf6 / #7c3aed)
9. Teal (#14b8a6 / #0d9488)
10. Red (#ef4444 / #dc2626)

## 🔮 Future Enhancements

- [ ] Card layouts (tile, cascade, grid)
- [ ] Save/restore card positions
- [ ] Card tabs/grouping
- [ ] Mini-map for navigation
- [ ] Touch gesture support (pinch to resize)
- [ ] Keyboard navigation in manager
- [ ] Card search/filter
- [ ] Drag cards from manager to reorder

---

**Last Updated**: October 2, 2025  
**Version**: 2.0.0  
**Status**: ✅ Production Ready

