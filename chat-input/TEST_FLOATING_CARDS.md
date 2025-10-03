# Floating Cards Testing Guide

## Quick Testing Checklist

### ✅ Resize Functionality
- [ ] Hover over card edges - resize handles should appear
- [ ] Grab corner handles (NW, NE, SW, SE) - should resize diagonally
- [ ] Grab edge handles (N, E, S, W) - should resize in that direction
- [ ] Resize below minimum (300x300) - should maintain minimum size
- [ ] Resize beyond viewport - should constrain to screen

### ✅ Drag Functionality
- [ ] Click and drag header - card should move
- [ ] Cursor should show "grab" on hover
- [ ] Cursor should show "grabbing" while dragging
- [ ] Drag near edge - should constrain to viewport
- [ ] Double-click header - should toggle expand/collapse

### ✅ Hide Button
- [ ] Click hide button - card should disappear
- [ ] Hidden card should appear in Cards Manager with "Hidden" status
- [ ] Hidden card preview should have dashed border
- [ ] Click preview of hidden card - should show and center it

### ✅ Cards Manager
- [ ] Click grid icon in chat input - manager should appear above input
- [ ] Click outside manager - should close automatically
- [ ] Click "Show All" - all hidden cards should appear
- [ ] Click "Hide All" - all cards should hide
- [ ] Click "New" - should create new card
- [ ] Click card preview - should focus that card
- [ ] Click eye icon on preview - should toggle visibility
- [ ] Click X icon on preview - should remove card

### ✅ Visual Feedback
- [ ] Cards have color-coded number badges
- [ ] Manager has liquid glass background
- [ ] Resize handles have blue tint on hover
- [ ] Card previews animate on hover
- [ ] Smooth transitions throughout

### ✅ Keyboard Shortcuts
- [ ] Ctrl+N - creates new card
- [ ] Escape - closes focused card
- [ ] Double-click header - expands/collapses

### ✅ Multiple Cards
- [ ] Create 3+ cards - each should have unique color
- [ ] Each card should have unique number badge
- [ ] Cards Manager should show all cards
- [ ] Z-index stacking works correctly on click

### ✅ Responsive Design
- [ ] Resize window - manager repositions correctly
- [ ] Cards constrain to new viewport size
- [ ] Mobile view (< 768px) - manager uses 95vw

## Console Commands for Testing

Open DevTools console and try:

```javascript
// Get the floating cards module
const fc = window.floatingCards || {};

// Create multiple cards
for (let i = 0; i < 5; i++) {
  fc.createNewFloatingCard({ title: `Test Card ${i+1}` });
}

// Hide all cards
document.getElementById('hideAllCardsBtn').click();

// Show all cards
document.getElementById('showAllCardsBtn').click();

// Toggle manager
document.getElementById('cardsManagerButton').click();
```

## Known Issues to Verify Fixed

1. **Resize Handles Not Working** ✅ FIXED
   - Handles now have proper pointer-events
   - Larger hit areas (16x16 corners, 8px edges)

2. **Drag Stopping Unexpectedly** ✅ FIXED
   - Added tolerance zones
   - Better cursor tracking

3. **No Hide Functionality** ✅ ADDED
   - Hide button in each card
   - Hidden state management
   - Cards Manager integration

4. **No Central Management** ✅ ADDED
   - Full Cards Manager UI
   - Similar to attachments system
   - Positioned above chat input

## Success Criteria

All tests should pass with:
- ✨ Smooth animations (300ms transitions)
- 🎯 Precise interactions (no click misses)
- 🎨 Beautiful UI (liquid glass, color-coded)
- ⚡ Fast performance (no lag)
- 📱 Responsive design (works on all sizes)

## Regression Testing

Ensure these still work:
- [ ] Create new card button (+ in header)
- [ ] Toggle iframe visibility (eye icon)
- [ ] Expand/collapse button
- [ ] Close button (X)
- [ ] Message routing (@1, @2, etc.)
- [ ] IPC events (if using Electron)

---

**Testing Date**: _________________  
**Tester**: _________________  
**Result**: ⭐ PASS / ❌ FAIL  
**Notes**: _________________

