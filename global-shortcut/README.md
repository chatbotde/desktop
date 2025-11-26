# Global Shortcut Module

This module manages global keyboard shortcuts for the Buddy app.

## Global Shortcuts

### Ctrl+H - Toggle Window Visibility
Show or hide the entire chat input window.

### Ctrl+M - Minimal Mode
Hide all UI elements except the persistent toggle (right side transparent strip). This creates a distraction-free overlay experience.

- **Enable**: Press `Ctrl+M` to hide all UI
- **Restore**: Click the persistent toggle OR press `Ctrl+M` again

### Ctrl+Shift+L - Show Collapsed Chat Input
Show the chat input in its collapsed (compact) state. This is useful for quick access to the chat input without the expanded view.

- Shows the chat input window if hidden
- Ensures the input is in collapsed state
- Disables minimal mode if active
- Focuses the input field for immediate typing

## Features

### Minimal Mode (Ctrl+M)

The minimal mode feature allows users to hide all UI elements except for a persistent toggle on the right side of the screen. This creates a distraction-free overlay experience while keeping quick access available.

#### How it works:

1. **Enable Minimal Mode**: Press `Ctrl+M` to hide all UI elements
2. **Restore UI**: Either:
   - Click on the transparent persistent toggle on the right side, OR
   - Press `Ctrl+M` again

#### What gets hidden:
- Chat input container
- Floating cards
- Floating cards manager
- Hide/close button
- Attachments container
- Badges container

#### What remains visible:
- Persistent toggle (right side transparent strip)

## Files

### `index.js`
Main entry point that exports all global shortcut functionality.

### `minimal-mode-manager.js`
The main process manager that:
- Registers IPC handlers for minimal mode control
- Manages the minimal mode state
- Sends events to the renderer when mode changes

## Integration

### Main Process (`main.js`)
The `MinimalModeManager` is initialized when the chat input window is created and the `Ctrl+M` shortcut is registered in `registerGlobalShortcuts()`.

### Renderer Process
The `MinimalModeUI` class in `chat-input/modules/ui/minimal-mode.js` handles:
- Listening for minimal mode changes from main process
- Hiding/showing UI elements
- Updating the persistent toggle appearance
- Handling clicks on the persistent toggle

### Preload Script
The following APIs are exposed via `chatInputAPI`:
- `toggleMinimalMode()` - Toggle minimal mode on/off
- `enableMinimalMode()` - Enable minimal mode
- `disableMinimalMode()` - Disable minimal mode
- `getMinimalModeStatus()` - Get current status
- `onMinimalModeChanged(callback)` - Listen for mode changes

## CSS Styles

Minimal mode styles are defined in `chat-input/css/ui/minimal-mode.css`:
- Enhanced appearance for persistent toggle in minimal mode
- Smooth transitions for hiding/showing elements
- Pulse animation to indicate the toggle is clickable
- Hover tooltips showing how to restore UI
- Responsive adjustments for mobile devices
- Reduced motion support for accessibility

## Usage Example

```javascript
// In renderer process
// Toggle minimal mode
window.chatInputAPI.toggleMinimalMode();

// Enable minimal mode
window.chatInputAPI.enableMinimalMode();

// Disable minimal mode
window.chatInputAPI.disableMinimalMode();

// Check status
const isMinimal = await window.chatInputAPI.getMinimalModeStatus();

// Listen for changes
window.chatInputAPI.onMinimalModeChanged((isMinimal) => {
  console.log('Minimal mode:', isMinimal);
});
```
