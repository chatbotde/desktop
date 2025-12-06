# Clickthrough System for Interfaces Window

This clickthrough system makes the entire window transparent to mouse events (clickthrough) except for UI elements that need to be interactive.

## How It Works

The window starts in **clickthrough mode** - the entire window is transparent to mouse clicks, allowing you to interact with whatever is behind it. When you move your mouse over UI elements marked with `data-no-clickthrough`, the window automatically becomes interactive.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Main Process (interfaces-window.js)                     │
│ - Manages window.setIgnoreMouseEvents()                 │
│ - Handles IPC messages for enable/disable               │
└─────────────────────────────────────────────────────────┘
                        ↕ IPC
┌─────────────────────────────────────────────────────────┐
│ Preload Script (interfaces-preload.js)                  │
│ - Exposes clickthroughAPI to renderer                   │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│ Frontend (React/TypeScript)                              │
│ - Initializes clickthrough in main.tsx                  │
│ - Tracks mouse over data-no-clickthrough elements       │
│ - Sends enable/disable commands via IPC                 │
└─────────────────────────────────────────────────────────┘
```

## Usage in Frontend

### 1. Mark Interactive Elements

Add the `data-no-clickthrough` attribute to any element that should be interactive:

```tsx
// Single button
<button data-no-clickthrough onClick={handleClick}>
  Click Me
</button>

// Container (all children become interactive)
<div data-no-clickthrough className="card">
  <button onClick={handleClick}>Button 1</button>
  <input type="text" />
  <button onClick={handleClick}>Button 2</button>
</div>
```

### 2. Automatic Behavior

The system automatically:
- **Enables clickthrough** when mouse is NOT over `data-no-clickthrough` elements
- **Disables clickthrough** when mouse IS over `data-no-clickthrough` elements
- Works with nested elements (parent has attribute, children are interactive)

### 3. Manual Control

You can manually control clickthrough:

```typescript
import { 
  enableClickthrough, 
  disableClickthrough, 
  toggleClickthrough 
} from '@/lib/clickthrough'

// Enable clickthrough (window becomes transparent)
enableClickthrough()

// Disable clickthrough (window becomes interactive)
disableClickthrough()

// Toggle clickthrough
toggleClickthrough()
```

### 4. Keyboard Shortcut

- **Ctrl+T**: Toggle clickthrough mode on/off

## Main Process API

The main process exposes these methods via IPC:

```javascript
// Enable clickthrough
ipcMain.on('interfaces:clickthrough:enable', ...)

// Disable clickthrough
ipcMain.on('interfaces:clickthrough:disable', ...)

// Toggle clickthrough
ipcMain.on('interfaces:clickthrough:toggle', ...)

// Get current state
ipcMain.handle('interfaces:clickthrough:get-state', ...)
```

## Technical Details

### State Flow

1. **Mouse moves over page**
   - Frontend detects element under cursor
   - Checks for `data-no-clickthrough` attribute
   - Sends enable/disable command to main process

2. **Main process receives command**
   - Calls `window.setIgnoreMouseEvents(true/false)`
   - Updates internal state
   - Broadcasts state change to renderer

3. **Window behavior changes**
   - `true`: Window ignores mouse, clicks pass through
   - `false`: Window captures mouse events normally

### Performance

- Uses event delegation for efficient event handling
- Batches state changes to avoid redundant IPC calls
- Only sends IPC messages when state actually changes

## Example: Your Current App

Your `App.tsx` already has the correct setup:

```tsx
// The entire card is interactive
<div data-no-clickthrough className="w-80 rounded-xl ...">
  {/* All these are automatically interactive */}
  <button onClick={...}>Close</button>
  <button onClick={...}>Tab 1</button>
  <button onClick={...}>Tab 2</button>
  <input type="checkbox" />
</div>

// Background is clickthrough (no attribute)
<div className="h-screen w-full ...">
  {/* Clicks pass through here */}
</div>
```

## Files

### Main Process
- `interfaces-window/interfaces-window.js` - Window management + IPC handlers
- `interfaces-window/interfaces-preload.js` - API exposure to renderer

### Renderer (Optional - for complex scenarios)
- `interfaces-window/clickthrough/index.js` - Module entry point
- `interfaces-window/clickthrough/core/mouse-tracker.js` - Mouse position tracking
- `interfaces-window/clickthrough/core/ui-detector.js` - UI element detection
- `interfaces-window/clickthrough/core/state-manager.js` - State management
- `interfaces-window/clickthrough/handlers/renderer-handlers.js` - Event handlers

### Frontend
- `frontend/src/lib/clickthrough.ts` - TypeScript utilities
- `frontend/src/main.tsx` - Initialization

## Troubleshooting

### Window stays clickthrough even over UI
- Check that `data-no-clickthrough` attribute is present
- Check browser console for initialization errors
- Verify `initializeClickthrough()` is called in `main.tsx`

### Window never becomes clickthrough
- Check that main process IPC handlers are registered
- Verify `enableClickthrough()` is called after window creation
- Check `window.setIgnoreMouseEvents()` in DevTools

### Performance issues
- Ensure you're not adding `data-no-clickthrough` to too many elements
- Use container-level attributes instead of individual elements
- Check for event listener leaks

## Comparison with chat-input

The interfaces-window clickthrough is **simpler** than chat-input because:

1. **No iframe monitoring** - Frontend is direct React app, not in iframe
2. **Simpler UI detection** - Just checks `data-no-clickthrough` attribute
3. **Frontend-driven** - React handles detection, sends commands to main process
4. **Less overhead** - No need for complex iframe communication

The chat-input version is more complex because it needs to handle webviews and iframes with bidirectional communication.
