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
- **Ultra-Low Memory Mode**: Minimal resource usage when system memory is under pressure
- **Transition**: Immediate state changes based on user interaction (no hover effects)

#### Behavior
- **Default**: Starts in inactive state to save memory
- **Click Activation**: Automatically activates when user clicks the window
- **Delayed Deactivation**: Returns to inactive state 3 seconds after user stops interacting
- **Automatic Adjustment**: Adjusts optimization level based on current memory usage
- **System Integration**: Responds to system power state changes (suspend/resume)
- **No Animations**: Simplified implementation without hover effects or animations

### Technical Implementation

#### Resource Management
```javascript
// Inactive State Optimizations
- Frame rate: 1 FPS (vs 60 FPS active)
- Background throttling: Enabled
- Window opacity: 0.8 (vs 0.999 active)
- Window size: 15x150px (vs 20x200px active)
- JavaScript execution: Paused
- Cache size: 0MB (vs 100MB active)
- GPU acceleration: Disabled when inactive

// Ultra-Low Memory Mode Optimizations
- Window visibility: Hidden
- Web contents: Minimal
- Process priority: Reduced
- Cache: Cleared
- Frame rate: 0 FPS
- GPU acceleration: Disabled
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

/* Ultra-Low Memory Mode */
.hidden {
  display: none;
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
  hasHoverTimeout: status.hasHoverTimeout,   // Hover delay timer active (always false now)
  ultraLowMemoryMode: status.ultraLowMemoryMode // Ultra-low memory mode active
});

// NEW: Manual memory cleanup
await launchWindowManager.performMemoryCleanup();

// NEW: Adjust optimization based on current usage
launchWindowManager.adjustOptimizationLevel();

// NEW: Ultra-low memory mode control
launchWindowManager.enableUltraLowMemoryMode();
launchWindowManager.disableUltraLowMemoryMode();
```

#### Event Handling
```javascript
// Manual state control (usually automatic)
launchWindowManager.setActiveState();  // Activate immediately
launchWindowManager.setInactiveState();  // Schedule deactivation
```

### Benefits

#### Memory Usage
- **Reduced RAM**: Inactive state uses significantly less memory
- **Lower CPU**: 1 FPS vs 60 FPS reduces CPU usage by ~98%
- **Background Throttling**: Minimizes background processing when not needed
- **Smart Activation**: Instant response when user needs the window
- **Automatic Scaling**: Adjusts resource usage based on system conditions

#### User Experience
- **Always Available**: Window remains visible and accessible
- **Instant Response**: Activates immediately on click
- **Visual Feedback**: Clear indication of active/inactive states
- **System Integration**: Responds appropriately to system events
- **Simplified Interface**: No distracting animations or hover effects

#### System Performance
- **Minimal Impact**: Negligible resource usage when inactive
- **Battery Friendly**: Reduced power consumption on laptops
- **System Stability**: Lower overall system resource pressure
- **Scalable**: Works well with multiple applications
- **Adaptive**: Automatically adjusts to system conditions

### Configuration

#### Timing Settings
```javascript
// Customize deactivation delay (default: 3000ms)
launchWindowManager.inactiveDelay = 5000; // 5 seconds

// Memory monitoring interval (default: 30000ms)
// This is handled automatically in startMemoryMonitoring()
```

#### Memory Thresholds
```javascript
// Ultra-low memory mode threshold (default: 150MB)
// Automatic ultra-low memory mode when RSS > 150MB

// Normal mode threshold (default: 100MB)
// Return to normal mode when RSS < 100MB
```

#### Visual Customization
Modify `launch-window.html` CSS classes:
- `.inactive`: Customize inactive state appearance
- `.active`: Customize active state appearance
- `.hidden`: Customize ultra-low memory mode appearance
- No hover or transition effects

### Troubleshooting

#### Common Issues
1. **Window doesn't activate on click**
   - Check if memory optimization is enabled
   - Verify click event handlers are registered
   - Check console for JavaScript errors

2. **Window stays inactive**
   - Ensure `memoryOptimizationEnabled` is true
   - Check if click events are being triggered
   - Verify IPC handlers are registered

3. **Performance issues**
   - Memory optimization should improve performance
   - If issues persist, disable optimization temporarily
   - Check system resource usage in Task Manager

4. **High memory usage persists**
   - Check if ultra-low memory mode is activating properly
   - Verify memory monitoring is working
   - Check for memory leaks in other parts of the application

#### Debug Information
```javascript
// Get detailed status for debugging
const status = launchWindowManager.getMemoryOptimizationStatus();
console.log('Memory Optimization Debug:', status);

// Check auto-startup status
const autoStartup = new AutoStartupManager();
console.log('Auto-Startup Debug:', autoStartup.getStartupInfo());

// Manual memory cleanup
await launchWindowManager.performMemoryCleanup();

// Force optimization level adjustment
launchWindowManager.adjustOptimizationLevel();
```

## Best Practices

### For Users
- **Let it run**: Keep the launch window running for best experience
- **Click to activate**: Click the window when you need it (no hover needed)
- **System startup**: Allow the application to start with your system
- **Resource monitoring**: Check system resources if you notice any issues
- **Manual cleanup**: Use memory cleanup feature if memory usage seems high

### For Developers
- **Test across platforms**: Verify auto-startup works on target platforms
- **Monitor resource usage**: Check memory and CPU usage in both states
- **Handle edge cases**: Account for system sleep, hibernate, and user switching
- **Graceful degradation**: Ensure functionality works even if optimization fails
- **Memory leak prevention**: Regularly test for memory leaks
- **Performance profiling**: Profile performance in all optimization states

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

// Continuous monitoring
launchWindowManager.startMemoryMonitoring(); // Every 30 seconds
```

## Security Considerations

### Auto-Startup Security
- **User Control**: Users can disable auto-startup through system settings
- **No Elevation**: Does not require administrator privileges
- **Transparent**: Uses standard OS mechanisms for startup registration
- **Reversible**: Can be completely removed/disabled

### Memory Optimization Security
- **No Data Exposure**: Inactive state doesn't expose sensitive information
- **Content Protection**: Maintains content protection in all states
- **Event Validation**: Click events are validated and sanitized
- **Resource Limits**: Prevents resource exhaustion attacks
- **Process Isolation**: Maintains Electron's process isolation model

This implementation provides a robust, user-friendly experience while maintaining system performance and security standards.