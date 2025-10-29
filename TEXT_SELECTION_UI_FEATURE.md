# Text Selection UI Feature

## Overview
The Text Selection UI is a floating panel that appears when text is selected in any application outside of Buddy. It provides three quick-action buttons for interacting with the selected text:

- **Ask**: Automatically adds the selected text to the chat input and sends it to the AI
- **Add**: Adds the selected text to the chat input without sending
- **✕ (Close)**: Dismisses the panel

## Features

### Smart UI Display
- Panel appears near the text selection
- Shows a preview of the selected text (truncated to 150 characters)
- Auto-positions to stay within viewport bounds
- Disappears when clicked outside (8-second auto-hide timeout)

### Three Action Buttons

1. **Ask Button** (Blue)
   - Adds selected text to the chat input
   - Automatically sends the message to the AI
   - User can see the output directly in the chat

2. **Add Button** (Green)
   - Adds selected text to the chat input
   - Keeps focus in the input for manual adjustments
   - User can edit before sending

3. **Close Button** (X)
   - Dismisses the panel
   - Can also dismiss by clicking outside or waiting 8 seconds

### Visual Design
- Modern glass-morphism style with backdrop blur
- Smooth animations and transitions
- Responsive design for different screen sizes
- Theme-aware (supports dark and light modes)
- Accessibility features (keyboard navigation, focus indicators)

## Technical Implementation

### Files Modified/Created

1. **chat-input/modules/text-selection-ui.js** (NEW)
   - Main module handling the UI logic
   - `TextSelectionUIManager` class manages the panel
   - Exports: `initTextSelectionUI()`, `showTextSelectionUI()`, `hideTextSelectionUI()`

2. **chat-input/css/text-selection-ui.css** (NEW)
   - Complete styling for the panel
   - Button styles and states
   - Responsive design
   - Theme support

3. **chat-input/modules/text-selection.js** (MODIFIED)
   - Now dispatches both `text-selection:detected` and `clipboard:detected` events
   - Backward compatible with clipboard UI

4. **chat-input/modules/init.js** (MODIFIED)
   - Added `initTextSelectionUI()` call in boot function
   - Initializes the text selection UI on app startup

5. **chat-input/css/main.css** (MODIFIED)
   - Added import for text-selection-ui.css

### Event Flow

```
Text Selection in System
        ↓
selection-hook (OS-level API)
        ↓
TextSelectionMonitor (main.js)
        ↓
IPC: text-selection-changed
        ↓
text-selection.js (handleTextSelection)
        ↓
Dispatches: text-selection:detected
        ↓
text-selection-ui.js (initTextSelectionUI)
        ↓
Shows TextSelectionUIManager panel
```

## Usage

### For Users
1. Select any text in any application
2. A floating panel appears with three buttons
3. Click "Ask" to send to AI and see results
4. Or click "Add" to manually edit before sending
5. Click "✕" or click outside to dismiss

### For Developers

#### Initialize (automatic in boot())
```javascript
import { initTextSelectionUI } from './text-selection-ui.js';
initTextSelectionUI();
```

#### Show UI Programmatically
```javascript
import { showTextSelectionUI } from './text-selection-ui.js';
showTextSelectionUI('Selected text here');
```

#### Hide UI Programmatically
```javascript
import { hideTextSelectionUI } from './text-selection-ui.js';
hideTextSelectionUI();
```

#### Listen for Custom Events
```javascript
document.addEventListener('text-selection:detected', (e) => {
  const { text, payload } = e.detail;
  console.log('Text selected:', text);
});
```

## Configuration

### Auto-Hide Timeout
The panel auto-hides after 8 seconds of inactivity. To change:

In `text-selection-ui.js`, modify the `TextSelectionUIManager` class:
```javascript
this.hideTimer = setTimeout(() => {
  this.hide();
}, 8000); // Change this value (in milliseconds)
```

### Panel Size
Edit `text-selection-ui.css`:
```css
#textSelectionPanel {
  min-width: 280px;
  max-width: 350px;
}
```

### Button Labels and Icons
Edit `text-selection-ui.js` in the `createPanel()` method to customize button text and SVG icons.

## Browser Compatibility

- Chrome/Electron: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support

## Accessibility

- Full keyboard navigation support
- Focus indicators on all interactive elements
- ARIA labels on all buttons
- Respects `prefers-reduced-motion` for animations
- High contrast support in light/dark modes

## Troubleshooting

### Panel Not Appearing
1. Check if text selection monitoring is active: `setupTextSelectionMonitoring()` in main.js
2. Verify the `selection-hook` module is properly installed
3. Check browser console for any errors

### Panel Not Positioned Correctly
- May be due to viewport size changes
- Panel auto-repositions on window resize
- Check if chat input container is available

### Buttons Not Working
1. Ensure `appendToInput()` and `sendMessage()` functions are available
2. Check if DOM references are properly initialized
3. Verify IPC communication is working

## Future Enhancements

- [ ] Customizable button actions
- [ ] Quick formatting options (bold, code, quote)
- [ ] Copy button to copy selected text
- [ ] Share button to share with others
- [ ] Translation option
- [ ] Summarization option
- [ ] Settings panel for customization
