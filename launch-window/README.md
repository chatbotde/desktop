# Launch Window

The launch window is a persistent launcher for the Buddy application that provides easy access to the main window.

## Features

### Visual Design
- **Tablet Shape**: Small, vertical window (80x300px) with rounded corners
- **Positioning**: Half outside the screen on the right edge for easy access
- **Styling**: Gradient background with hover effects and glow
- **Always on Top**: Stays visible above other applications

### Functionality
- **Click to Launch**: Click anywhere on the launch window to open the main application
- **Persistent**: Remains open even when the main window is closed
- **Hover Effects**: Interactive visual feedback when hovering
- **Global Shortcut**: `Ctrl+Alt+Y` to close the entire application

### Behavior
- **Independent Shortcuts**: Main window shortcuts are managed separately from launch window shortcuts
- **No Taskbar**: Launch window doesn't appear in the taskbar
- **Non-closable**: Cannot be closed through normal window controls
- **Auto-positioning**: Maintains position even if moved

## Usage

1. **Starting**: The launch window appears automatically when the application starts
2. **Opening Main Window**: Click the launch window to open the main application
3. **Closing Main Window**: Close the main window normally - launch window persists
4. **Reopening**: Click the launch window again to reopen the main window
5. **Quitting**: Use `Ctrl+Alt+Y` to close the entire application

## Technical Details

### Components
- `LaunchWindowManager`: Manages both launch and main windows
- `launch-window.html`: UI for the launch window
- `launch-window-manager.js`: Core functionality and window management

### Shortcuts
- **Launch Window**: `Ctrl+Alt+Y` (persistent, managed by LaunchWindowManager)
- **Main Window**: `Ctrl+\` and `Ctrl+Shift+\` (temporary, managed by ShortcutManager)

### Window Properties
- Frame: None (frameless)
- Transparent: Yes
- Always on Top: Yes
- Skip Taskbar: Yes
- Resizable: No
- Closable: No (via normal controls)