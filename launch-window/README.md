# Launch Window

The launch window is a persistent launcher for the Buddy application that provides easy access to the main window.

## Features

### Visual Design
- **Tablet Shape**: Small, vertical window with rounded corners
- **Adaptive Sizing**: 15x150px (inactive) to 20x200px (active) for memory optimization
- **Positioning**: Half outside the screen on the right edge for easy access
- **Styling**: Gradient background with hover effects and glow
- **Always on Top**: Stays visible above other applications
- **State-Based Appearance**: Visual feedback for inactive/active states

### Functionality
- **Click to Launch**: Click anywhere on the launch window to open the main application
- **Persistent**: Remains open even when the main window is closed
- **Hover Effects**: Interactive visual feedback when hovering
- **Global Shortcut**: `Ctrl+Alt+Y` to close the entire application
- **Auto-Startup**: Automatically starts with your system on boot/login
- **Memory Optimization**: Intelligent resource management with inactive/active states

### New Features (v2.0)

#### Auto-Startup
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **System Integration**: Uses native OS mechanisms for reliable startup
- **Registry Support**: Windows includes registry entries for maximum reliability
- **User Control**: Can be enabled/disabled through system settings

#### Memory Optimization
- **Inactive State**: Minimal resource usage when not being used
- **Active State**: Full responsiveness when user interacts
- **Smart Transitions**: Automatic state changes based on hover detection
- **Resource Savings**: Up to 98% CPU reduction in inactive state
- **Battery Friendly**: Reduced power consumption on mobile devices

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
- Memory Optimized: Yes (inactive/active states)
- Auto-Startup: Yes (system integration)

## API Reference

### Auto-Startup Management
```javascript
const { AutoStartupManager } = require('./startup/auto-startup-manager');
const autoStartup = new AutoStartupManager();

// Setup auto-startup (called automatically on first run)
await autoStartup.setupAutoStartup();

// Check if enabled
const isEnabled = autoStartup.isAutoStartupEnabled();

// Enable/disable
await autoStartup.enableAutoStartup();
await autoStartup.disableAutoStartup();

// Get detailed info
const info = autoStartup.getStartupInfo();
```

### Memory Optimization Control
```javascript
// Enable/disable memory optimization
launchWindowManager.enableMemoryOptimization();
launchWindowManager.disableMemoryOptimization();

// Toggle optimization
const enabled = launchWindowManager.toggleMemoryOptimization();

// Get current status
const status = launchWindowManager.getMemoryOptimizationStatus();

// Manual state control (usually automatic)
launchWindowManager.setActiveState();
launchWindowManager.setInactiveState();
```

### IPC API (from renderer process)
```javascript
// Content protection (existing)
window.launchWindowAPI.toggleContentProtection();
window.launchWindowAPI.getContentProtection();

// Memory optimization (new)
window.launchWindowAPI.toggleMemoryOptimization();
window.launchWindowAPI.getMemoryStatus();

// Window control
window.launchWindowAPI.openMainWindow();
```

## Configuration

### Memory Optimization Settings
- **Inactive Delay**: 3000ms (time before going inactive after hover ends)
- **Hover Delay**: 500ms (prevents flickering on quick mouse movements)
- **Frame Rate**: 1 FPS (inactive) vs 60 FPS (active)
- **Window Size**: 15x150px (inactive) vs 20x200px (active)

### Auto-Startup Behavior
- **Startup Flag**: `--startup` added to command line when launched by system
- **Platform Detection**: Automatic platform-specific implementation
- **Fallback Support**: Multiple registration methods for reliability
- **User Override**: Respects system-level startup management settings