const { BrowserWindow, globalShortcut, screen, powerMonitor, app } = require('electron');
const path = require('path');

class LaunchWindowManager {
  constructor() {
    this.launchWindow = null;
    this.windowManager = null;
    this.shortcutManager = null;
    this.contentProtectionEnabled = true; // Enable content protection by default
    
    // Memory optimization states
    this.isInactive = false;
    this.inactiveTimer = null;
    this.hoverTimeout = null;
    this.memoryOptimizationEnabled = true;
    this.inactiveDelay = 3000; // 3 seconds delay before going inactive
    
    // Ultra-low memory mode
    this.ultraLowMemoryMode = false;
    
    // Memory monitoring
    this.memoryMonitoringInterval = null;
    this.lastMemoryUsage = { rss: 0, heapUsed: 0 };
  }

  createLaunchWindow() {
    if (this.launchWindow) {
      return this.launchWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // Tablet-like dimensions - start with better visibility (80x200px)
    const windowWidth = 80;
    const windowHeight = 200;
    
    // Position: show only the edge of the rectangle (about 15px visible)
    const x = screenWidth - 15;
    const y = (screenHeight - windowHeight) / 4;

    // Get the appropriate icon path based on platform
    const getIconPath = () => {
      if (process.platform === 'win32') {
        return path.join(__dirname, "..", "icons", "icon.ico");
      } else if (process.platform === 'darwin') {
        return path.join(__dirname, "..", "icons", "icon.icns");
      } else {
        return path.join(__dirname, "..", "icons", "icon.png");
      }
    };

    this.launchWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: x,
      y: y,
      icon: getIconPath(),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      title: "",
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: false,
      // Enable rounded corners
      hasShadow: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        webSecurity: true, // Enable web security for normal operation
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        preload: path.join(__dirname, 'launch-window-preload.js')
      }
    });

    // Apply content protection
    this.applyContentProtection();

    // Load the launch window HTML
    this.launchWindow.loadFile(path.join(__dirname, 'launch-window.html'));

    // Setup window behavior
    this.setupLaunchWindowBehavior();
    
    // Setup memory optimization
    this.setupMemoryOptimization();
    
    // Register global shortcut for closing
    this.registerGlobalShortcuts();

    return this.launchWindow;
  }

  setupLaunchWindowBehavior() {
    if (!this.launchWindow) return;

    // Prevent window from being closed normally
    this.launchWindow.on('close', (event) => {
      event.preventDefault();
    });

    // Handle click to open chat input
    this.launchWindow.webContents.on('did-finish-load', () => {
      // Apply content protection after load
      this.applyContentProtection();
      
      this.launchWindow.webContents.executeJavaScript(`
        document.addEventListener('click', () => {
          require('electron').ipcRenderer.send('toggle-chat-input');
        });
      `);
    });

    // Keep window always on top and in position
    this.launchWindow.setAlwaysOnTop(true, 'screen-saver', 5);
    
    // Platform-specific configurations
    this.configurePlatformSpecificBehavior();
    
    // Setup event listeners for maintaining behavior
    this.setupEventListeners();
    
    // Ensure window stays in position - show only edge
    this.launchWindow.on('moved', () => {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      const windowWidth = 80;
      const windowHeight = 200;
      const x = screenWidth - 15; // Show only 15px of the window edge
      const y = (screenHeight - windowHeight) / 4;
      
      this.launchWindow.setPosition(x, y);
    });
  }

  registerGlobalShortcuts() {
    // Register Ctrl+Alt+Y to close the launch window and quit app
    // Only register if not already registered
    if (!globalShortcut.isRegistered('CommandOrControl+Alt+Y')) {
      globalShortcut.register('CommandOrControl+Alt+Y', () => {
        this.closeLaunchWindow();
      });
    }
    
    // Register Ctrl+Alt+L to ensure window visibility (recovery shortcut)
    if (!globalShortcut.isRegistered('CommandOrControl+Alt+L')) {
      globalShortcut.register('CommandOrControl+Alt+L', () => {
        this.ensureWindowVisible();
      });
    }
  }

  configurePlatformSpecificBehavior() {
    if (!this.launchWindow) return;

    if (process.platform === "win32") {
      // Windows: Stay above taskbar and system menus
      this.launchWindow.setAlwaysOnTop(true, "pop-up-menu", 5);
      this.launchWindow.setAlwaysOnTop(true, "floating", 5);
      
      // Force the window to stay above all other windows
      setTimeout(() => {
        this.launchWindow.setAlwaysOnTop(false);
        this.launchWindow.setAlwaysOnTop(true, "screen-saver", 5);
      }, 100);
    } else if (process.platform === "darwin") {
      // macOS: Stay above dock and mission control
      this.launchWindow.setAlwaysOnTop(true, "floating", 5);
      this.launchWindow.setAlwaysOnTop(true, "pop-up-menu", 5);
    } else if (process.platform === "linux") {
      // Linux: Stay above panels and system elements
      this.launchWindow.setAlwaysOnTop(true, "pop-up-menu", 5);
      this.launchWindow.setAlwaysOnTop(true, "modal-panel", 5);
      this.launchWindow.setAlwaysOnTop(true, "floating", 5);
    }
  }

  setupEventListeners() {
    if (!this.launchWindow) return;

    // Add event listener to maintain always-on-top behavior
    this.launchWindow.on('focus', () => {
      if (process.platform === "win32") {
        this.launchWindow.setAlwaysOnTop(true, "screen-saver", 5);
      }
    });

    // Add event listener for when other windows might affect our position
    this.launchWindow.on('blur', () => {
      setTimeout(() => {
        if (this.launchWindow && !this.launchWindow.isDestroyed()) {
          if (process.platform === "win32") {
            this.launchWindow.setAlwaysOnTop(true, "screen-saver", 5);
          } else {
            this.launchWindow.setAlwaysOnTop(true, "floating", 5);
          }
        }
      }, 50);
    });

    // Setup periodic maintenance to ensure it stays above other windows
    this.setupPeriodicMaintenance();
  }

  setupPeriodicMaintenance() {
    if (!this.launchWindow) return;

    // Periodic check to ensure window stays above all other windows
    const maintainAlwaysOnTop = () => {
      if (this.launchWindow && !this.launchWindow.isDestroyed() && this.launchWindow.isVisible()) {
        if (process.platform === "win32") {
          this.launchWindow.setAlwaysOnTop(true, "screen-saver", 5);
        } else {
          this.launchWindow.setAlwaysOnTop(true, "floating", 5);
        }
      }
    };

    // OPTIMIZED: Check every 5 seconds instead of 1.5 seconds to reduce CPU/memory usage
    const alwaysOnTopInterval = setInterval(maintainAlwaysOnTop, 5000);
    
    // Clean up interval when window is destroyed
    this.launchWindow.on('closed', () => {
      if (alwaysOnTopInterval) {
        clearInterval(alwaysOnTopInterval);
      }
    });
  }

  closeLaunchWindow() {
    // Unregister launch window shortcuts
    if (globalShortcut.isRegistered('CommandOrControl+Alt+Y')) {
      globalShortcut.unregister('CommandOrControl+Alt+Y');
    }
    if (globalShortcut.isRegistered('CommandOrControl+Alt+L')) {
      globalShortcut.unregister('CommandOrControl+Alt+L');
    }
    
    // Force close launch window
    if (this.launchWindow && !this.launchWindow.isDestroyed()) {
      this.launchWindow.destroy();
    }
    
    // Quit the application
    require('electron').app.quit();
  }

  getLaunchWindow() {
    return this.launchWindow;
  }

  forceWindowAboveAll() {
    if (this.launchWindow && !this.launchWindow.isDestroyed()) {
      // Force the launch window above all other windows
      this.launchWindow.setAlwaysOnTop(false);
      setTimeout(() => {
        if (process.platform === "win32") {
          this.launchWindow.setAlwaysOnTop(true, "screen-saver", 5);
          this.launchWindow.setAlwaysOnTop(true, "floating", 5);
        } else {
          this.launchWindow.setAlwaysOnTop(true, "floating", 5);
        }
        // Bring to front
        this.launchWindow.showInactive();
        this.launchWindow.focus();
      }, 50);
    }
  }

  // Minimal content protection methods
  applyContentProtection() {
    if (!this.launchWindow || this.launchWindow.isDestroyed()) {
      return;
    }

    try {
      // Basic protection: Prevent screen capture of window contents
      this.launchWindow.setContentProtection(this.contentProtectionEnabled);
      
      // Remove window from all workspaces to prevent it from appearing in screen sharing
      // This will make it only appear on the current workspace
      this.launchWindow.setVisibleOnAllWorkspaces(false);
      
      console.log(`Launch Window: Content protection ${this.contentProtectionEnabled ? 'ENABLED' : 'DISABLED'}`);
    } catch (error) {
      console.error('Launch Window: Failed to apply content protection:', error);
    }
  }

  enableContentProtection() {
    this.contentProtectionEnabled = true;
    this.applyContentProtection();
    console.log('Launch Window: Content protection ENABLED');
  }

  disableContentProtection() {
    this.contentProtectionEnabled = false;
    if (this.launchWindow && !this.launchWindow.isDestroyed()) {
      this.launchWindow.setContentProtection(false);
    }
    console.log('Launch Window: Content protection DISABLED');
  }

  isContentProtectionEnabled() {
    return this.contentProtectionEnabled;
  }

  toggleContentProtection() {
    if (this.contentProtectionEnabled) {
      this.disableContentProtection();
    } else {
      this.enableContentProtection();
    }
    return this.contentProtectionEnabled;
  }

  // Memory Optimization Methods
  setupMemoryOptimization() {
    if (!this.memoryOptimizationEnabled || !this.launchWindow) return;

    console.log('Launch Window: Setting up memory optimization');
    
    // OPTIMIZED: Check window visibility less frequently (every 30 seconds instead of 10)
    // This reduces unnecessary checks and saves memory
    setInterval(() => {
      if (this.launchWindow && !this.launchWindow.isDestroyed() && !this.launchWindow.isVisible()) {
        console.log('Launch Window: Window was hidden, restoring visibility');
        this.launchWindow.show();
        this.setActiveState();
      }
    }, 30000); // Check every 30 seconds instead of 10
    
    // Monitor system power state changes
    powerMonitor.on('suspend', () => {
      console.log('Launch Window: System suspending - enabling ultra-low memory mode');
      this.enableUltraLowMemoryMode();
    });
    
    powerMonitor.on('resume', () => {
      console.log('Launch Window: System resuming - disabling ultra-low memory mode');
      this.disableUltraLowMemoryMode();
    });
    
    // Monitor system memory pressure (available in newer Electron versions)
    try {
      if (process.platform !== 'linux' && powerMonitor.on) {
        powerMonitor.on('on-ac', () => {
          console.log('Launch Window: System on AC power - disabling ultra-low memory mode');
          this.disableUltraLowMemoryMode();
        });
        
        powerMonitor.on('on-battery', () => {
          console.log('Launch Window: System on battery - considering ultra-low memory mode');
          // Could enable based on battery level if needed
        });
      }
    } catch (error) {
      console.log('Launch Window: Power monitoring not available on this platform');
    }
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Start in active state for better user visibility
    setTimeout(() => {
      try {
        this.setActiveState();
        console.log('Launch Window: Started in active state for better visibility');
      } catch (error) {
        console.error('Launch Window: Error setting initial active state:', error);
      }
    }, 1000);
  }

  startMemoryMonitoring() {
    // Clear any existing interval
    if (this.memoryMonitoringInterval) {
      clearInterval(this.memoryMonitoringInterval);
    }
    
    // OPTIMIZED: Check memory usage every 60 seconds instead of 30 to reduce overhead
    this.memoryMonitoringInterval = setInterval(() => {
      try {
        const memoryUsage = process.memoryUsage();
        const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        
        // Log memory usage
        console.log(`Launch Window Memory Usage: ${rssMB}MB RSS, ${heapUsedMB}MB Heap`);
        
        // Store for comparison
        this.lastMemoryUsage = { rss: rssMB, heapUsed: heapUsedMB };
        
        // If memory usage is too high, enable more aggressive optimization
        if (rssMB > 150 && !this.ultraLowMemoryMode) {
          console.log('Launch Window: High memory usage detected - enabling ultra-low memory mode');
          this.enableUltraLowMemoryMode();
        } else if (rssMB < 100 && this.ultraLowMemoryMode) {
          console.log('Launch Window: Memory usage reduced - disabling ultra-low memory mode');
          this.disableUltraLowMemoryMode();
        }
      } catch (error) {
        console.error('Launch Window: Error monitoring memory:', error);
      }
    }, 60000); // Check every 60 seconds instead of 30
  }

  stopMemoryMonitoring() {
    if (this.memoryMonitoringInterval) {
      clearInterval(this.memoryMonitoringInterval);
      this.memoryMonitoringInterval = null;
    }
  }

  scheduleInactiveState() {
    if (!this.memoryOptimizationEnabled) return;
    
    try {
      // Clear any existing timer
      if (this.inactiveTimer) {
        clearTimeout(this.inactiveTimer);
        this.inactiveTimer = null;
      }
      
      // Set timer to go inactive
      this.inactiveTimer = setTimeout(() => {
        try {
          this.setInactiveState();
        } catch (error) {
          console.error('Launch Window: Error in inactive timer callback:', error);
        }
      }, this.inactiveDelay);
    } catch (error) {
      console.error('Launch Window: Error scheduling inactive state:', error);
    }
  }

  setInactiveState() {
    if (!this.launchWindow || this.launchWindow.isDestroyed() || this.isInactive) return;
    
    try {
      console.log('Launch Window: Switching to INACTIVE state for memory optimization');
      this.isInactive = true;
    
    // Position to show only 12px of the edge when inactive
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const windowWidth = 80;
    const windowHeight = 200;
    const x = screenWidth - 12; // Show only 12px of the edge when inactive
    const y = (screenHeight - windowHeight) / 4;
    
    this.launchWindow.setSize(windowWidth, windowHeight);
    this.launchWindow.setPosition(x, y);
    
    // Apply visual inactive state
    this.launchWindow.webContents.executeJavaScript(`
      document.body.classList.add('inactive');
      document.body.classList.remove('active');
    `);
    
    // Reduce resource usage
    this.optimizeForInactiveState();
    
    } catch (error) {
      console.error('Launch Window: Error setting inactive state:', error);
      this.isInactive = false; // Reset state on error
    }
  }

  setActiveState() {
    if (!this.launchWindow || this.launchWindow.isDestroyed()) return;
    
    try {
      console.log('Launch Window: Switching to ACTIVE state');
      this.isInactive = false;
    
    // Position to show only 15px of the edge when active
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const windowWidth = 80;
    const windowHeight = 200;
    const x = screenWidth - 15; // Show only 15px of the edge when active
    const y = (screenHeight - windowHeight) / 4;
    
    this.launchWindow.setSize(windowWidth, windowHeight);
    this.launchWindow.setPosition(x, y);
    
    // Optimize for active state
    this.optimizeForActiveState();
    
    // Resume periodic maintenance
    this.setupPeriodicMaintenance();
    
    // Apply visual active state
    this.launchWindow.webContents.executeJavaScript(`
      document.body.classList.add('active');
      document.body.classList.remove('inactive');
    `);
    
    // Ensure always on top
    this.forceWindowAboveAll();
    
    } catch (error) {
      console.error('Launch Window: Error setting active state:', error);
    }
  }

  optimizeForInactiveState() {
    if (!this.launchWindow || this.launchWindow.isDestroyed()) return;
    
    try {
      // OPTIMIZED: Set frame rate to 15 FPS instead of 10 for better responsiveness while still saving resources
      this.launchWindow.webContents.setFrameRate(15); // 15 FPS when inactive
      
      // Throttle background processing
      this.launchWindow.webContents.setBackgroundThrottling(true);
      
      // Reduce opacity slightly to indicate inactive state
      this.launchWindow.setOpacity(0.9);
      
      console.log('Launch Window: Optimized for inactive state - reduced resource usage');
    } catch (error) {
      console.error('Launch Window: Failed to optimize for inactive state:', error);
    }
  }

  optimizeForActiveState() {
    if (!this.launchWindow || this.launchWindow.isDestroyed()) return;
    
    try {
      // Restore normal frame rate
      this.launchWindow.webContents.setFrameRate(60);
      
      // Disable background throttling for responsiveness
      this.launchWindow.webContents.setBackgroundThrottling(false);
      
      // Restore full opacity
      this.launchWindow.setOpacity(1.0);
      
      console.log('Launch Window: Optimized for active state - full responsiveness');
    } catch (error) {
      console.error('Launch Window: Failed to optimize for active state:', error);
    }
  }

  // Memory optimization control methods
  enableMemoryOptimization() {
    this.memoryOptimizationEnabled = true;
    this.setupMemoryOptimization();
    console.log('Launch Window: Memory optimization ENABLED');
  }

  disableMemoryOptimization() {
    this.memoryOptimizationEnabled = false;
    
    // Clear timers
    if (this.inactiveTimer) {
      clearTimeout(this.inactiveTimer);
      this.inactiveTimer = null;
    }
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    
    // Force active state
    this.setActiveState();
    console.log('Launch Window: Memory optimization DISABLED');
  }

  isMemoryOptimizationEnabled() {
    return this.memoryOptimizationEnabled;
  }

  toggleMemoryOptimization() {
    if (this.memoryOptimizationEnabled) {
      this.disableMemoryOptimization();
    } else {
      this.enableMemoryOptimization();
    }
    return this.memoryOptimizationEnabled;
  }

  // Ensure window is always visible - recovery method
  ensureWindowVisible() {
    if (!this.launchWindow || this.launchWindow.isDestroyed()) {
      console.log('Launch Window: Window not found, recreating...');
      this.createLaunchWindow();
      return;
    }

    try {
      console.log('Launch Window: Ensuring visibility...');
      
      // Show the window if hidden
      if (!this.launchWindow.isVisible()) {
        this.launchWindow.show();
      }
      
      // Restore proper size and position
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      const windowWidth = 80;
      const windowHeight = 200;
      // Position to show only the edge (about 15px visible)
      const x = screenWidth - 15;
      const y = (screenHeight - windowHeight) / 4;
      
      this.launchWindow.setSize(windowWidth, windowHeight);
      this.launchWindow.setPosition(x, y);
      
      // Ensure always on top
      this.forceWindowAboveAll();
      
      // Set to active state for better visibility
      this.setActiveState();
      
      console.log('Launch Window: Visibility ensured - window should now be visible');
      
    } catch (error) {
      console.error('Launch Window: Error ensuring visibility:', error);
    }
  }

  enableUltraLowMemoryMode() {
    if (this.ultraLowMemoryMode) return;
    
    this.ultraLowMemoryMode = true;
    console.log('Launch Window: Enabling ultra-low memory mode');
    
    if (this.launchWindow && !this.launchWindow.isDestroyed()) {
      try {
        // Keep window visible but optimize aggressively
        
        // Reduce process priority
        this.launchWindow.webContents.setAudioMuted(true);
        
        // Clear session caches
        this.launchWindow.webContents.session.clearCache().then(() => {
          console.log('Launch Window: Cache cleared in ultra-low memory mode');
        });
        
        // OPTIMIZED: Set frame rate to 5 FPS instead of 0 to keep window responsive
        // Frame rate 0 can cause rendering issues
        this.launchWindow.webContents.setFrameRate(5);
        
        // Force garbage collection if available
        if (global.gc) {
          console.log('Launch Window: Forcing garbage collection');
          global.gc();
        }
      } catch (error) {
        console.error('Launch Window: Error enabling ultra-low memory mode:', error);
      }
    }
  }

  disableUltraLowMemoryMode() {
    if (!this.ultraLowMemoryMode) return;
    
    this.ultraLowMemoryMode = false;
    console.log('Launch Window: Disabling ultra-low memory mode');
    
    if (this.launchWindow && !this.launchWindow.isDestroyed()) {
      try {
        // Ensure the window is shown (in case it was hidden)
        if (!this.launchWindow.isVisible()) {
          this.launchWindow.show();
        }
        
        // Reload the content
        this.launchWindow.loadFile(path.join(__dirname, 'launch-window.html'));
        
        // Restore normal operation
        this.setActiveState();
      } catch (error) {
        console.error('Launch Window: Error disabling ultra-low memory mode:', error);
        
        // Fallback: recreate the window
        try {
          this.launchWindow.destroy();
          this.launchWindow = null;
          this.createLaunchWindow();
        } catch (recreateError) {
          console.error('Launch Window: Error recreating window:', recreateError);
        }
      }
    }
  }

  // Enhanced method to get detailed memory status
  getMemoryOptimizationStatus() {
    const memoryUsage = process.memoryUsage();
    const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    return {
      enabled: this.memoryOptimizationEnabled,
      isInactive: this.isInactive,
      hasInactiveTimer: !!this.inactiveTimer,
      hasHoverTimeout: !!this.hoverTimeout,
      ultraLowMemoryMode: this.ultraLowMemoryMode,
      currentMemoryUsage: {
        rss: rssMB,
        heapUsed: heapUsedMB,
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      lastMemoryUsage: this.lastMemoryUsage
    };
  }

  // NEW: Manual memory cleanup method
  async performMemoryCleanup() {
    try {
      console.log('Launch Window: Performing manual memory cleanup');
      
      // Clear session caches
      if (this.launchWindow && !this.launchWindow.isDestroyed()) {
        await this.launchWindow.webContents.session.clearCache();
        await this.launchWindow.webContents.session.clearStorageData();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        console.log('Launch Window: Forcing garbage collection');
        global.gc();
      }
      
      // Get memory status after cleanup
      const status = this.getMemoryOptimizationStatus();
      console.log('Launch Window: Memory after cleanup:', status.currentMemoryUsage);
      
      return status.currentMemoryUsage;
    } catch (error) {
      console.error('Launch Window: Error during memory cleanup:', error);
      throw error;
    }
  }

  // NEW: Adjust optimization based on current memory usage
  adjustOptimizationLevel() {
    try {
      const status = this.getMemoryOptimizationStatus();
      const currentRSS = status.currentMemoryUsage.rss;
      
      console.log(`Launch Window: Adjusting optimization based on ${currentRSS}MB usage`);
      
      if (currentRSS > 150 && !this.ultraLowMemoryMode) {
        console.log('Launch Window: Enabling ultra-low memory mode due to high usage');
        this.enableUltraLowMemoryMode();
      } else if (currentRSS > 100 && currentRSS <= 150 && !this.isInactive) {
        console.log('Launch Window: Enabling inactive mode due to moderate usage');
        this.setInactiveState();
      } else if (currentRSS <= 100 && this.ultraLowMemoryMode) {
        console.log('Launch Window: Disabling ultra-low memory mode due to low usage');
        this.disableUltraLowMemoryMode();
      }
    } catch (error) {
      console.error('Launch Window: Error adjusting optimization level:', error);
    }
  }
}

module.exports = { LaunchWindowManager };