# Buddy Window Management Architecture

This document describes the modular architecture of the Buddy application's window management system.

## Overview

The window management functionality has been refactored from a single monolithic `main.js` file into a modular system organized in the `window-main/` directory. This architecture provides better separation of concerns, easier maintenance, and improved extensibility.

## Directory Structure

```
window-main/
├── index.js                 # Main entry point, exports all modules
├── window-manager.js        # Core window creation and management
├── window-behavior.js       # Window behavior (always on top, focus handling)
├── window-styling.js        # CSS injection and theme styling
├── ipc-handlers.js         # IPC communication handlers
└── shortcut-manager.js     # Global keyboard shortcuts management
```

## Module Descriptions

### WindowManager (`window-manager.js`)
The core class responsible for window lifecycle management.

**Key Responsibilities:**
- Window creation and destruction
- Theme switching with window recreation
- Content loading (development vs production)
- State management (opacity, theme, mouse ignore, content protection)

**Main Methods:**
- `createWindow(theme)` - Creates a new window with specified theme
- `recreateWindowWithTheme(theme)` - Recreates window when theme changes
- `loadContent(win)` - Loads appropriate content based on environment

### Window Behavior (`window-behavior.js`)
Handles platform-specific window behavior and always-on-top functionality.

**Key Responsibilities:**
- Cross-platform always-on-top configuration
- Focus and blur event handling
- Periodic maintenance of window position
- Platform-specific window level management

**Main Functions:**
- `setupWindowBehavior(win)` - Sets up all behavior for a window
- `forceWindowAboveTaskbar(win)` - Forces window above taskbar/dock

### Window Styling (`window-styling.js`)
Manages CSS injection and theme-based styling.

**Key Responsibilities:**
- Dynamic CSS injection
- Theme-based styling (transparent vs black)
- Opacity management
- Rounded corner and border effects

**Main Functions:**
- `applyWindowStyling(win, opacity, theme)` - Sets up styling for window
- `updateWindowOpacity(win, windowManager, opacity)` - Updates window opacity

### IPC Handlers (`ipc-handlers.js`)
Manages all Inter-Process Communication between main and renderer processes.

**Key Responsibilities:**
- Window control handlers (close, minimize, maximize)
- Window property handlers (opacity, mouse ignore, content protection)
- Theme change handlers
- Screen capture and display information handlers

**Handler Categories:**
- Window Controls: `window-close`, `window-minimize`, `window-maximize`
- Window Properties: `window-set-opacity`, `window-toggle-mouse-ignore`
- Theme Management: `window-set-theme`, `window-get-theme`
- Screen Capture: `get-desktop-sources`, `get-screen-info`

### Shortcut Manager (`shortcut-manager.js`)
Manages global keyboard shortcuts with cross-platform compatibility.

**Key Responsibilities:**
- Registration of global shortcuts
- Platform-specific shortcut handling
- Shortcut cleanup and unregistration
- Alternative shortcuts for different platforms

**Default Shortcuts:**
- `Ctrl+\` (or `Cmd+\` on macOS): Toggle window visibility
- `Ctrl+Shift+\` (or `Cmd+Shift+\` on macOS): Toggle mouse ignore
- `Ctrl+Alt+\` (Linux only): Alternative window toggle

## Usage Example

```javascript
const { WindowManager, ShortcutManager } = require("./window-main");

// Create window manager instance
const windowManager = new WindowManager();

// Create a window
const window = windowManager.createWindow("transparent");

// Setup shortcuts
const shortcutManager = new ShortcutManager(windowManager);
shortcutManager.registerAllShortcuts();
```

## Benefits of Modular Architecture

1. **Separation of Concerns**: Each module has a specific responsibility
2. **Easier Testing**: Individual modules can be tested in isolation
3. **Better Maintainability**: Changes to one aspect don't affect others
4. **Improved Extensibility**: New features can be added as separate modules
5. **Code Reusability**: Modules can be reused in other parts of the application
6. **Cleaner Main Process**: `main.js` is now focused on app lifecycle only

## Future Extensions

The modular architecture makes it easy to add new functionality:

- **Window Animations**: Add `window-animations.js` for transition effects
- **Multiple Windows**: Extend `WindowManager` to handle multiple window instances
- **Custom Themes**: Add `theme-manager.js` for advanced theme management
- **Window Presets**: Add `window-presets.js` for saved window configurations
- **Performance Monitoring**: Add `window-performance.js` for monitoring window performance

## Migration Notes

When migrating from the original monolithic structure:

1. Update imports to use the new modular system
2. Replace direct window creation with `WindowManager` instances
3. Use `ShortcutManager` for global shortcuts instead of inline registration
4. Update any direct IPC handler registration to use the modular handlers

This architecture provides a solid foundation for future development while maintaining all existing functionality.
