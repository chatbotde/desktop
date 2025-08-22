# Auto-Startup and Memory Optimization Guide

This guide explains the new auto-startup and memory optimization features for the Buddy launch window.

## Auto-Startup Features

### Overview
The launch window now automatically starts when your computer boots up or when you log in, ensuring Buddy is always available when you need it.

### How It Works

#### Installation
- **First Run**: When you first install and run Buddy, it automatically sets itself to start with your system
- **Cross-Platform**: Works on Windows, macOS, and Linux with platform-specific optimizations
- **Registry Integration**: On Windows, adds both Electron login items and registry entries for maximum reliability

#### Startup Behavior
- **Silent Start**: Launches minimally in the background
- **Launch Window Available**: The launch window appears immediately and is ready to use
- **Memory Optimized**: Starts in inactive state to minimize resource usage
- **Always Available**: Persists across system restarts and user sessions

### Platform-Specific Implementation

#### Windows
- Uses Electron's `setLoginItemSettings()` API
- Adds registry entry in `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- Includes `--startup` flag to identify system-launched instances
- Supports both regular user startup and system service startup

#### macOS
- Uses Electron's built-in login items functionality
- Integrates with macOS System Preferences > Users & Groups > Login Items
- Respects macOS privacy and security settings
- Supports both visible and hidden startup modes

#### Linux
- Creates `.desktop` file in `~/.config/autostart/`
- Uses XDG autostart specification
- Compatible with GNOME, KDE, XFCE, and other desktop environments
- Fallback to Electron's login items for additional reliability

### Management

#### Checking Status
```javascript
// Check if auto-startup is enabled
const autoStartupManager = new AutoStartupManager();
const isEnabled = autoStartupManager.isAutoStartupEnabled();
```

#### Enabling/Disabling
```javascript
// Enable auto-startup
await autoStartupManager.enableAutoStartup();

// Disable auto-startup
await autoStartupManager.disableAutoStartup();

// Toggle auto-startup
await autoStartupManager.toggleAutoStartup();
```

#### Getting Information
```javascript
// Get detailed startup information
const info = autoStartupManager.getStartupInfo();
console.log({
  isSetup: info.isSetup,           // Setup completed successfully
  isEnabled: info.isEnabled,       // Currently enabled for startup
  isStartupLaunch: info.isStartupLaunch, // Current session was launched by system
  platform: info.platform         // Current operating system
});
```

## Memory Optimization Features

### Overview
The launch window now uses intelligent memory optimization to minimize resource usage when not actively being used, while providing instant responsiveness when needed.

### How It Works

#### States
- **Inactive State**: Minimal resource usage, smaller visual footprint, reduced CPU usage
- **Active State**: Full responsiveness, normal size, full functionality
- **Transition**: Smooth animations between states based on user interaction

#### Behavior
- **Default**: Starts in inactive state to save memory
- **Hover Activation**: Automatically activates when user hovers over the window
- **Delayed Deactivation**: Returns to inactive state 3 seconds after user stops interacting
- **Smart Timing**: Prevents flickering with intelligent delay management

### Technical Implementation

#### Resource Management
```javascript
// Inactive State Optimizations
- Frame rate: 1 FPS (vs 60 FPS active)
- Background throttling: Enabled
- Window opacity: 0.8 (vs 0.999 active)
- Window size: 15x150px (vs 20x200px active)
```

#### Visual States
```css
/* Inactive: Minimal presence */
.inactive {
  width: 40%;
  opacity: 0.7;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

/* Active: Full presence */
.active {
  width: 50%;
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}
```

### API Usage

#### Memory Optimization Control
```javascript
// Enable memory optimization
launchWindowManager.enableMemoryOptimization();

// Disable memory optimization
launchWindowManager.disableMemoryOptimization();

// Toggle memory optimization
const enabled = launchWindowManager.toggleMemoryOptimization();

// Check status
const status = launchWindowManager.getMemoryOptimizationStatus();
console.log({
  enabled: status.enabled,           // Feature is enabled
  isInactive: status.isInactive,     // Currently in inactive state
  hasInactiveTimer: status.hasInactiveTimer, // Timer set to go inactive
  hasHoverTimeout: status.hasHoverTimeout    // Hover delay timer active
});
```

#### Event Handling
```javascript
// Manual state control (usually automatic)
launchWindowManager.onHoverEnter();  // Activate immediately
launchWindowManager.onHoverLeave();  // Schedule deactivation
```

### Benefits

#### Memory Usage
- **Reduced RAM**: Inactive state uses significantly less memory
- **Lower CPU**: 1 FPS vs 60 FPS reduces CPU usage by ~98%
- **Background Throttling**: Minimizes background processing when not needed
- **Smart Activation**: Instant response when user needs the window

#### User Experience
- **Always Available**: Window remains visible and accessible
- **Instant Response**: Activates immediately on hover
- **Smooth Transitions**: Elegant animations between states
- **Visual Feedback**: Clear indication of active/inactive states

#### System Performance
- **Minimal Impact**: Negligible resource usage when inactive
- **Battery Friendly**: Reduced power consumption on laptops
- **System Stability**: Lower overall system resource pressure
- **Scalable**: Works well with multiple applications

### Configuration

#### Timing Settings
```javascript
// Customize deactivation delay (default: 3000ms)
launchWindowManager.inactiveDelay = 5000; // 5 seconds

// Hover delay to prevent flickering (default: 500ms)
// This is handled automatically in onHoverLeave()
```

#### Visual Customization
Modify `launch-window.html` CSS classes:
- `.inactive`: Customize inactive state appearance
- `.active`: Customize active state appearance
- Transitions: Adjust animation timing and effects

### Troubleshooting

#### Common Issues
1. **Window doesn't activate on hover**
   - Check if memory optimization is enabled
   - Verify hover event handlers are registered
   - Check console for JavaScript errors

2. **Window stays inactive**
   - Ensure `memoryOptimizationEnabled` is true
   - Check if hover events are being triggered
   - Verify IPC handlers are registered

3. **Performance issues**
   - Memory optimization should improve performance
   - If issues persist, disable optimization temporarily
   - Check system resource usage in Task Manager

#### Debug Information
```javascript
// Get detailed status for debugging
const status = launchWindowManager.getMemoryOptimizationStatus();
console.log('Memory Optimization Debug:', status);

// Check auto-startup status
const autoStartup = new AutoStartupManager();
console.log('Auto-Startup Debug:', autoStartup.getStartupInfo());
```

## Best Practices

### For Users
- **Let it run**: Keep the launch window running for best experience
- **Hover to activate**: Simply hover over the window when you need it
- **System startup**: Allow the application to start with your system
- **Resource monitoring**: Check system resources if you notice any issues

### For Developers
- **Test across platforms**: Verify auto-startup works on target platforms
- **Monitor resource usage**: Check memory and CPU usage in both states
- **Handle edge cases**: Account for system sleep, hibernate, and user switching
- **Graceful degradation**: Ensure functionality works even if optimization fails

### Performance Monitoring
```javascript
// Monitor memory usage
const memUsage = process.memoryUsage();
console.log('Memory Usage:', {
  rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
  heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
  external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
});

// Monitor CPU usage (requires additional monitoring)
// Implement process.cpuUsage() tracking for detailed analysis
```

## Security Considerations

### Auto-Startup Security
- **User Control**: Users can disable auto-startup through system settings
- **No Elevation**: Does not require administrator privileges
- **Transparent**: Uses standard OS mechanisms for startup registration
- **Reversible**: Can be completely removed/disabled

### Memory Optimization Security
- **No Data Exposure**: Inactive state doesn't expose sensitive information
- **Content Protection**: Maintains content protection in both states
- **Event Validation**: Hover events are validated and sanitized
- **Resource Limits**: Prevents resource exhaustion attacks

This implementation provides a robust, user-friendly experience while maintaining system performance and security standards.
