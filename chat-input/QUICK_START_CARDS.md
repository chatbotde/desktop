# Floating Cards Quick Start Guide

## 🚀 Getting Started in 60 Seconds

### What Are Floating Cards?
Floating cards are resizable, draggable windows that display content (like web pages, AI responses, etc.) in your chat interface. Think of them as mini-browsers that you can arrange however you like!

---

## 📖 Basic Usage

### 1. **Opening the Cards Manager**
Look for the **grid icon (⊞)** in the chat input area (next to the AI model button).

```
Click this → [⊞] ← Grid Icon
```

The Cards Manager will slide up above your chat input, showing all your display cards.

### 2. **Creating a New Card**
**Three ways to do it:**

**Method 1:** Click the `[+ New]` button in the Cards Manager  
**Method 2:** Click the `[+]` button in any existing card's header  
**Method 3:** Press `Ctrl+N` on your keyboard

### 3. **Resizing a Card**
1. Hover over any **edge or corner** of a card
2. You'll see the resize handles light up (blue tint)
3. Click and drag to resize

**Tip:** Corner handles resize diagonally, edge handles resize in one direction

### 4. **Moving a Card**
1. Click and hold the **card header** (the top bar with the title)
2. Drag to move the card anywhere on screen
3. Release to drop

**Tip:** The cursor changes to a "grab hand" when you can drag

### 5. **Expanding/Collapsing**
**Two ways:**
- Click the expand button `[⤢]` in the card header
- Double-click anywhere on the card header

Cards toggle between:
- **Default:** 850px × 500px
- **Expanded:** 1200px × 700px

### 6. **Hiding a Card** 🆕
Don't want to see a card but don't want to close it?

Click the **hide button `[📥]`** in the card header.

The card disappears but remains in the Cards Manager, marked as "Hidden" with a dashed border.

### 7. **Showing a Hidden Card**
Open the Cards Manager and click on the hidden card's preview.

It will reappear, centered on your screen!

### 8. **Closing a Card**
Click the **close button `[✕]`** in the card header.

**Warning:** This permanently removes the card. Use hide instead if you want to bring it back later!

---

## 🎨 Understanding the Cards Manager

When you open it, you'll see:

```
┌───────────────────────────────────────────────┐
│ DISPLAY CARDS    [Show All] [Hide All] [New] │
├───────────────────────────────────────────────┤
│  [1]      [2]      [3]      [4]               │
│  Card 1   Card 2   Card 3   Card 4            │
│  Visible  Hidden   Visible   Visible          │
│  👁 ✕     👁 ✕     👁 ✕      👁 ✕             │
└───────────────────────────────────────────────┘
```

### Card Preview Actions:
- **Click preview** → Focus/show that card
- **Click eye icon (👁)** → Show/hide toggle
- **Click X (✕)** → Close card permanently

### Bulk Actions:
- **Show All** → Makes all hidden cards visible
- **Hide All** → Hides all cards
- **New** → Creates a new card

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Create new card |
| `Escape` | Close focused card |
| `Double-click header` | Expand/collapse |

---

## 🎯 Common Workflows

### Workflow 1: Multi-tasking with Multiple Views
```
1. Create 3 cards (Ctrl+N × 3)
2. Resize and position them side-by-side
3. Load different content in each
4. Switch between them by clicking headers
```

### Workflow 2: Temporary View
```
1. Create a card
2. View your content
3. Hide it when done (📥 button)
4. Later: Open Cards Manager → Click preview to restore
```

### Workflow 3: Clean Workspace
```
1. Open Cards Manager
2. Click "Hide All"
3. Your workspace is clear!
4. Click "Show All" when you need them back
```

---

## 🎨 Visual Indicators

### Card Numbers & Colors
Each card gets a unique number and color:
- Card 1: 🔵 Blue
- Card 2: 🟣 Violet  
- Card 3: 🟢 Emerald
- Card 4: 🟠 Amber
- Card 5+: Cycles through 10 colors

This helps you identify cards at a glance!

### Card States

**Visible Card:**
- ✅ Solid border
- ✅ Full opacity
- ✅ Shows "Visible" in manager

**Hidden Card:**
- 📦 Dashed border (in manager)
- 📦 50% opacity (in manager)
- 📦 Shows "Hidden" in manager

**Expanded Card:**
- ⤢ Larger size (1200×700)
- ⤢ Collapse icon in header
- ⤢ Auto-centered

---

## 💡 Pro Tips

### Tip 1: Use Hide Instead of Close
Hidden cards are easy to restore. Closed cards are gone forever!

### Tip 2: Organize by Color
Position cards of the same color together for visual grouping.

### Tip 3: Use Manager for Overview
Open the manager to see all your cards at once and quickly navigate between them.

### Tip 4: Double-click for Quick Expand
Faster than finding the button!

### Tip 5: Resize from Corners
Corner handles are easier to grab and resize in both directions at once.

### Tip 6: Check Status in Manager
Quickly see which cards are visible/hidden without hunting for them.

---

## 🐛 Troubleshooting

### Problem: Can't resize the card
**Solution:** Hover near the edges - handles appear on hover. Corners are 16×16px, edges are 8px thick.

### Problem: Card won't drag
**Solution:** Click and hold the header (top bar), not the content area.

### Problem: Lost a card off-screen
**Solution:** Open Cards Manager and click the card's preview - it will re-center!

### Problem: Too many cards cluttering the screen
**Solution:** Use "Hide All" in the manager, then show only the ones you need.

### Problem: Manager won't close
**Solution:** Click anywhere outside the manager panel or press the grid icon again.

---

## 🎓 Advanced Features

### Multiple Cards
Create up to 10 cards with unique colors (technically unlimited, but 10 colors cycle).

### Responsive Design
Cards automatically adjust size on smaller screens while maintaining aspect ratio.

### Auto-positioning
New cards offset slightly from the previous one to avoid overlap.

### Z-index Stacking
Click any card to bring it to the front.

### Viewport Constraints
Cards can't be dragged or resized outside the visible window area.

---

## 📱 Mobile Usage

On mobile devices:
- Cards fill most of the screen (96vw)
- Manager is touch-friendly (95vw)
- Resize handles are larger for touch
- Swipe to scroll card previews

---

## ❓ FAQ

**Q: How many cards can I have?**  
A: Unlimited! But realistically, 4-6 cards work best for performance and usability.

**Q: Do hidden cards still load content?**  
A: Yes, they're just visually hidden. They still exist in memory.

**Q: Can I rename cards?**  
A: Not yet - this is a planned feature!

**Q: Do cards remember their positions?**  
A: Not yet - this is a planned feature!

**Q: Can I resize below 300×300px?**  
A: No, that's the minimum size to keep cards usable.

---

## 🎉 You're Ready!

That's everything you need to master floating cards!

**Start simple:**
1. Create your first card (`Ctrl+N`)
2. Resize it (drag corners)
3. Move it around (drag header)
4. Open the manager (grid icon)
5. Experiment!

**Have fun!** 🚀

---

## 📚 More Resources

- **Full Documentation:** See `FLOATING_CARDS_ENHANCEMENTS.md`
- **Visual Guide:** See `VISUAL_GUIDE.md`
- **Testing:** See `TEST_FLOATING_CARDS.md`
- **Technical Details:** See `CHANGES_SUMMARY.md`

---

**Last Updated:** October 2, 2025  
**Version:** 2.0.0  
**Enjoy your enhanced floating cards experience!** ✨

