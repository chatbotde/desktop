# Launch Window

The launch window is a persistent launcher for the Buddy application that provides easy access to the main window.

## Features

### Visual Design
- **Tablet Shape**: Small, vertical window with rounded corners
- **Adaptive Sizing**: 12x200px (inactive) to 15x200px (active) for memory optimization
- **Positioning**: Half outside the screen on the right edge for easy access
- **Styling**: Gradient background with minimal effects
- **Always on Top**: Stays visible above other applications
- **State-Based Appearance**: Visual feedback for inactive/active states

### Functionality
- **Click to Launch**: Click anywhere on the launch window to open the main application
- **Persistent**: Remains open even when the main window is closed
- **Global Shortcut**: `Ctrl+Alt+Y` to close the entire application
- **Auto-Startup**: Automatically starts with your system on boot/login
- **Memory Optimization**: Intelligent resource management with inactive/active states
- **Ultra-Low Memory Mode**: Automatic switching to minimal resource usage under memory pressure
- **Memory Monitoring**: Continuous monitoring and automatic optimization based on system resources

### New Features (v2.0)

#### Auto-Startup
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **System Integration**: Uses native OS mechanisms for reliable startup
- **Registry Support**: Windows includes registry entries for maximum reliability
- **User Control**: Can be enabled/disabled through system settings

#### Memory Optimization
- **Inactive State**: Minimal resource usage when not being used (12px visible)
- **Active State**: Full responsiveness when user interacts (15px visible)
- **Resource Savings**: Reduced CPU and memory usage in inactive state
- **Battery Friendly**: Reduced power consumption on mobile devices
- **Ultra-Low Memory Mode**: Automatic switching to minimal resource usage when system memory is low
- **Memory Monitoring**: Continuous monitoring with automatic optimization adjustments
- **Manual Cleanup**: API for manual memory cleanup when needed
- **No Animations**: Simplified implementation without hover effects or animations
- **Rounded Corners**: Left corners are rounded for a polished appearance

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
- Rounded Corners: Yes (left corners rounded)

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

// NEW: Ultra-low memory mode
launchWindowManager.enableUltraLowMemoryMode();
launchWindowManager.disableUltraLowMemoryMode();

// NEW: Manual memory cleanup
await launchWindowManager.performMemoryCleanup();

// NEW: Adjust optimization based on current usage
launchWindowManager.adjustOptimizationLevel();
```

### IPC API (from renderer process)
```javascript
// Content protection (existing)
window.launchWindowAPI.toggleContentProtection();
window.launchWindowAPI.getContentProtection();

// Memory optimization (new)
window.launchWindowAPI.toggleMemoryOptimization();
window.launchWindowAPI.getMemoryStatus();

// NEW: Enhanced memory management
window.launchWindowAPI.performMemoryCleanup();
window.launchWindowAPI.adjustOptimizationLevel();

// Window control
window.launchWindowAPI.openMainWindow();
```

### Memory Status Object
```javascript
{
  enabled: boolean,              // Memory optimization enabled
  isInactive: boolean,           // Currently in inactive state
  hasInactiveTimer: boolean,     // Timer set to go inactive
  hasHoverTimeout: boolean,      // Hover delay timer active (always false now)
  ultraLowMemoryMode: boolean,   // Ultra-low memory mode active
  currentMemoryUsage: {          // Current memory usage in MB
    rss: number,                 // Resident Set Size
    heapUsed: number,            // Heap memory used
    external: number             // External memory
  },
  lastMemoryUsage: {             // Previous memory usage measurement
    rss: number,
    heapUsed: number
  }
}
```

## Configuration

### Memory Optimization Settings
- **Inactive Position**: 12px visible on right edge
- **Active Position**: 15px visible on right edge
- **Window Size**: 80x200px
- **Memory Monitoring**: Every 30 seconds
- **Ultra-Low Memory Threshold**: 150MB RSS

### Auto-Startup Behavior
- **Startup Flag**: `--startup` added to command line when launched by system
- **Platform Detection**: Automatic platform-specific implementation
- **Fallback Support**: Multiple registration methods for reliability
- **User Override**: Respects system-level startup management settings