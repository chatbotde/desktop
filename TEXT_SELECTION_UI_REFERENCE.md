# Text Selection UI - Developer Reference Card

## Quick Reference

### Import the Module
```javascript
import { 
  initTextSelectionUI,
  showTextSelectionUI, 
  hideTextSelectionUI 
} from './text-selection-ui.js';
```

### Initialize (Automatic in boot())
```javascript
initTextSelectionUI();
```

### Show Panel Programmatically
```javascript
showTextSelectionUI('Your selected text here');
```

### Hide Panel Programmatically
```javascript
hideTextSelectionUI();
```

### Listen to Events
```javascript
document.addEventListener('text-selection:detected', (e) => {
  const { text, payload } = e.detail;
  console.log('Text selected:', text);
});
```

---

## Files at a Glance

### Main Module
**Location:** `buddy/chat-input/modules/text-selection-ui.js`

```javascript
class TextSelectionUIManager {
  createPanel()        // Create HTML structure
  bindEvents()         // Attach listeners
  show(text, payload)  // Display panel
  hide()               // Hide panel
  position()           // Reposition panel
  handleAsk()          // Ask button action
  handleAdd()          // Add button action
}

const textSelectionUIManager = new TextSelectionUIManager();

// Exported functions
export function initTextSelectionUI()
export function showTextSelectionUI(text, payload)
export function hideTextSelectionUI()
```

### Styling
**Location:** `buddy/chat-input/css/text-selection-ui.css`

```css
#textSelectionPanel { }              /* Main panel */
.text-selection-content { }          /* Content wrapper */
.text-selection-preview { }          /* Preview section */
.preview-icon { }                    /* Icon (📝) */
.preview-text { }                    /* Selected text */
.text-selection-actions { }          /* Buttons container */
.text-selection-btn { }              /* Button base */
.ask-btn { }                         /* Ask button (blue) */
.add-btn { }                         /* Add button (green) */
.close-btn { }                       /* Close button */
```

---

## Component Structure

```html
<div id=\"textSelectionPanel\" class=\"text-selection-panel\">
  <div class=\"text-selection-content\">
    <div class=\"text-selection-preview\">
      <div class=\"preview-icon\">📝</div>
      <div class=\"preview-text\">Selected text...</div>
    </div>
    <div class=\"text-selection-actions\">
      <button class=\"text-selection-btn ask-btn\">Ask</button>
      <button class=\"text-selection-btn add-btn\">Add</button>
      <button class=\"text-selection-btn close-btn\">✕</button>
    </div>
  </div>
</div>
```

---

## Class Methods

### TextSelectionUIManager

#### `constructor()`
```javascript
this.panel = null;              // DOM element
this.elements = {};             // Cached elements
this.currentText = '';          // Current selected text
this.currentPayload = null;     // Current payload object
this.isVisible = false;         // Visibility state
this.resizeHandler = null;      // Resize listener
this.debounceTimer = null;      // Debounce timer (unused)
this.hideTimer = null;          // Auto-hide timer
```

#### `createPanel()`
Creates and caches the HTML panel element.

**Returns:** `HTMLElement` (the panel)

**Does:**
- Creates DOM structure
- Caches button elements
- Appends to document.body
- Calls `bindEvents()`

#### `bindEvents()`
Attaches all event listeners to panel.

**Events:**
- `click` on ask button → `handleAsk()`
- `click` on add button → `handleAdd()`
- `click` on close button → `hide()`
- `click` outside → `hide()`
- `mouseenter` → clear auto-hide timer
- `mouseleave` → start auto-hide timer
- `resize` → reposition panel

#### `position()`
Calculates and applies panel position.

**Logic:**
- Gets input element bounds
- Positions above input
- Adjusts for viewport boundaries
- Sets CSS properties

#### `show(text, payload)`
Displays panel with animation.

**Parameters:**
- `text` (string) - Selected text to show
- `payload` (object, optional) - Payload object

**Does:**
- Calls `createPanel()`
- Sets current text/payload
- Updates preview text
- Shows with opacity/scale animation
- Starts auto-hide timer

#### `hide()`
Hides panel with animation.

**Does:**
- Removes visible class
- Waits for animation (300ms)
- Sets display: none
- Clears timers
- Removes event listeners

#### `handleAsk()`
Action for Ask button.

**Does:**
1. Calls `appendToInput(text)`
2. Focuses message input
3. Calls `sendMessage()` after 100ms
4. Hides panel

#### `handleAdd()`
Action for Add button.

**Does:**
1. Calls `appendToInput(text)`
2. Focuses message input
3. Hides panel

---

## Event Details

### text-selection:detected

```javascript
document.dispatchEvent(new CustomEvent('text-selection:detected', {
  detail: {
    text: 'Selected text',      // string
    payload: {                  // object
      text: 'Selected text',
      type: 'text/plain'
    }
  }
}));
```

**Triggered when:**
- Text selection is detected in external application
- Dispatched by `text-selection.js`

**Listener location:**
- `text-selection-ui.js` (initTextSelectionUI function)

---

## CSS Classes

### Panel States
```css
#textSelectionPanel {}           /* Default, hidden */
#textSelectionPanel.visible {}   /* Visible, animated in */
```

### Button States
```css
.text-selection-btn {}           /* Default state */
.text-selection-btn:hover {}     /* Hover state */
.text-selection-btn:active {}    /* Active/clicked state */
.text-selection-btn:focus-visible {} /* Keyboard focus */
```

### Button Types
```css
.ask-btn {}                      /* Blue button */
.ask-btn:hover {}                /* Blue hover */
.add-btn {}                      /* Green button */
.add-btn:hover {}                /* Green hover */
.close-btn {}                    /* Neutral button */
.close-btn:hover {}              /* Red hover */
```

---

## CSS Variables (Theme Support)

```css
--bg-popover              /* Panel background */
--border                  /* Panel border */
--text                    /* Primary text */
--text-dim                /* Secondary text */
```

### CSS Custom Properties Used
```css
/* Colors */
rgba(59, 130, 246, *)     /* Blue for Ask button */
rgba(34, 197, 94, *)      /* Green for Add button */
rgba(239, 68, 68, *)      /* Red for Close on hover */

/* Effects */
blur(12px)                /* Backdrop filter */
linear-gradient()         /* Button gradients */
cubic-bezier()            /* Animation easing */
```

---

## Integration Points

### Dependencies
```javascript
import { appendToInput } from './clipboard-injector.js';
import { sendMessage } from './messaging.js';
import { dom } from './dom.js';
```

### Used From Other Modules
```javascript
// From dom.js
dom.messageInput      // The chat input textarea

// From clipboard-injector.js
appendToInput(text)   // Adds text to input

// From messaging.js
sendMessage()         // Sends the message
```

### Exported To
```javascript
// Used in init.js
initTextSelectionUI()  // Called in boot()
```

---

## Configuration

### Auto-Hide Timeout (8 seconds)
**File:** `text-selection-ui.js` → line ~130-134

```javascript
this.hideTimer = setTimeout(() => {
  this.hide();
}, 8000);  // ← Change this value
```

### Panel Dimensions
**File:** `text-selection-ui.css` → line ~26

```css
min-width: 280px;    /* ← Adjust */
max-width: 350px;    /* ← Adjust */
```

### Preview Text Lines
**File:** `text-selection-ui.css` → line ~78

```css
-webkit-line-clamp: 3;  /* ← Change to 2 for compact */
```

---

## Common Tasks

### Add a Fourth Button
1. Add button HTML in `createPanel()`
2. Cache element in `this.elements`
3. Add event listener in `bindEvents()`
4. Add CSS styling
5. Create handler method

### Change Button Colors
1. Edit `text-selection-ui.css`
2. Modify `.ask-btn`, `.add-btn`, or `.close-btn` background/color
3. Update `:hover` states

### Change Panel Position
1. Edit `position()` method in `text-selection-ui.js`
2. Modify top/left/width calculations
3. Adjust gap variable if needed

### Add Animation Effects
1. Edit CSS animations in `text-selection-ui.css`
2. Modify `transition` property on `#textSelectionPanel`
3. Update keyframes if needed

### Add Keyboard Shortcuts
1. Add listener in `bindEvents()` method
2. Check for specific keys
3. Call appropriate handler

---

## Testing

### Unit Test Template
```javascript
describe('TextSelectionUIManager', () => {
  let manager;

  beforeEach(() => {
    manager = new TextSelectionUIManager();
  });

  test('createPanel should create panel element', () => {
    const panel = manager.createPanel();
    expect(panel).toBeDefined();
    expect(panel.id).toBe('textSelectionPanel');
  });

  test('show should display panel', () => {
    manager.show('test text');
    expect(manager.isVisible).toBe(true);
  });

  test('hide should hide panel', () => {
    manager.show('test text');
    manager.hide();
    expect(manager.isVisible).toBe(false);
  });
});
```

---

## Debugging

### Enable Logging
Add to `text-selection-ui.js`:
```javascript
const DEBUG = true;

if (DEBUG) console.log('Text Selection UI:', message);
```

### Check Panel State
In DevTools console:
```javascript
// Check if panel exists
document.getElementById('textSelectionPanel')

// Check if visible
document.getElementById('textSelectionPanel').classList.contains('visible')

// Check current text
document.querySelector('.preview-text').textContent
```

### Monitor Events
```javascript
// Listen in console
document.addEventListener('text-selection:detected', (e) => {
  console.log('Event fired:', e.detail);
});
```

---

## Performance Tips

1. **Debouncing:** Position is already optimized
2. **Event Delegation:** Uses direct listeners (fine for 3 buttons)
3. **DOM Caching:** Elements cached in `this.elements`
4. **CSS Optimization:** Uses transforms (GPU accelerated)
5. **Memory:** Properly cleans up timers and listeners

---

## Browser Compatibility

| Feature | Support |
|---------|----------|
| CSS Backdrop Filter | ✅ All modern |
| CSS Gradients | ✅ All modern |
| CSS Transforms | ✅ All modern |
| Custom Events | ✅ All modern |
| Template Literals | ✅ ES6+ |
| Arrow Functions | ✅ ES6+ |

---

## Security Considerations

- Text is captured from system selection (user data)
- No external API calls from this module
- XSS prevention: Uses `textContent`, not `innerHTML`
- Data isolation: No sensitive data stored

---

## Related Files

```
buddy/
├── chat-input/
│   ├── modules/
│   │   ├── text-selection-ui.js      ← MAIN MODULE
│   │   ├── text-selection.js         ← Dispatcher
│   │   ├── clipboard-injector.js     ← appendToInput()
│   │   ├── messaging.js              ← sendMessage()
│   │   ├── dom.js                    ← DOM references
│   │   └── init.js                   ← Initialization
│   └── css/
│       ├── text-selection-ui.css     ← MAIN STYLES
│       └── main.css                  ← CSS imports
├── main.js                           ← Text selection monitor
└── TEXT_SELECTION_UI_*.md            ← Documentation
```

---

## Quick Lookup

**Show UI:** `showTextSelectionUI(text)`
**Hide UI:** `hideTextSelectionUI()`
**Listen:** `addEventListener('text-selection:detected', handler)`
**Timeout:** Change `8000` in line ~130
**Size:** Change `280px`/`350px` in CSS line ~26
**Colors:** Edit `.ask-btn`, `.add-btn` in CSS

---

**Last Updated:** October 2025
**Version:** 1.0 (Complete)
**Status:** Production Ready ✅
