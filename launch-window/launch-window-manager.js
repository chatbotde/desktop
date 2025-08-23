const { BrowserWindow, globalShortcut, screen } = require('electron');
const path = require('path');

class LaunchWindowManager {
  constructor() {
    this.launchWindow = null;
    this.mainWindow = null;
    this.windowManager = null;
    this.shortcutManager = null;
    this.isMainWindowOpen = false;
    this.contentProtectionEnabled = true; // Enable content protection by default with highest priority
    
    // Memory optimization states
    this.isInactive = false; // Start in active state for better user visibility
    this.inactiveTimer = null;
    this.hoverTimeout = null;
    this.memoryOptimizationEnabled = true;
    this.inactiveDelay = 3000; // 3 seconds delay before going inactive
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
      title: " ",
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        webSecurity: false, // Disable web security for content protection
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        preload: path.join(__dirname, 'launch-window-preload.js') // Add preload script for security
      }
    });

    // Enable content protection with highest priority immediately
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

    // Handle click to open main window
    this.launchWindow.webContents.on('did-finish-load', () => {
      // Apply content protection after load
      this.applyContentProtection();
      
      this.launchWindow.webContents.executeJavaScript(`
        document.addEventListener('click', () => {
          require('electron').ipcRenderer.send('open-main-window');
        });
        
        // Setup hover events for memory optimization
        document.addEventListener('mouseenter', () => {
          require('electron').ipcRenderer.send('launch-window-hover-enter');
        });
        
        document.addEventListener('mouseleave', () => {
          require('electron').ipcRenderer.send('launch-window-hover-leave');
        });
      `);
    });

    // Keep window always on top and in position with higher priority than chat-input
    this.launchWindow.setAlwaysOnTop(true, 'screen-saver', 5);
    
    // Platform-specific configurations for maximum always-on-top behavior
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
      // Windows: Stay above taskbar and system menus with maximum priority (higher than chat-input)
      this.launchWindow.setAlwaysOnTop(true, "pop-up-menu", 5);
      this.launchWindow.setAlwaysOnTop(true, "floating", 5);
      
      // Force the window to stay above all other windows including taskbar and chat-input
      setTimeout(() => {
        this.launchWindow.setAlwaysOnTop(false);
        this.launchWindow.setAlwaysOnTop(true, "screen-saver", 5);
      }, 100);
    } else if (process.platform === "darwin") {
      // macOS: Stay above dock and mission control with highest priority
      this.launchWindow.setAlwaysOnTop(true, "floating", 5);
      this.launchWindow.setAlwaysOnTop(true, "pop-up-menu", 5);
    } else if (process.platform === "linux") {
      // Linux: Stay above panels and system elements with highest priority
      this.launchWindow.setAlwaysOnTop(true, "pop-up-menu", 5);
      this.launchWindow.setAlwaysOnTop(true, "modal-panel", 5);
      this.launchWindow.setAlwaysOnTop(true, "floating", 5);
    }
  }

  setupEventListeners() {
    if (!this.launchWindow) return;

    // Add event listener to maintain always-on-top behavior with highest priority
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

    // Setup periodic maintenance to ensure it stays above chat-input
    this.setupPeriodicMaintenance();
  }

  setupPeriodicMaintenance() {
    if (!this.launchWindow) return;

    // Periodic check to ensure window stays above all other windows including chat-input
    const maintainAlwaysOnTop = () => {
      if (this.launchWindow && !this.launchWindow.isDestroyed() && this.launchWindow.isVisible()) {
        if (process.platform === "win32") {
          this.launchWindow.setAlwaysOnTop(true, "screen-saver", 5);
        } else {
          this.launchWindow.setAlwaysOnTop(true, "floating", 5);
        }
      }
    };

    // Check every 1.5 seconds to maintain position above all windows (more frequent than chat-input)
    const alwaysOnTopInterval = setInterval(maintainAlwaysOnTop, 1500);
    
    // Clean up interval when window is destroyed
    this.launchWindow.on('closed', () => {
      if (alwaysOnTopInterval) {
        clearInterval(alwaysOnTopInterval);
      }
    });
  }

  openMainWindow() {
    if (this.isMainWindowOpen && this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.focus();
      return this.mainWindow;
    }

    // Import WindowManager and ShortcutManager from the main window module
    const { WindowManager, ShortcutManager } = require('../window-main');
    
    if (!this.windowManager) {
      this.windowManager = new WindowManager();
    }

    this.mainWindow = this.windowManager.createWindow();
    this.isMainWindowOpen = true;

    // Setup shortcuts for the main window only if not already registered
    if (!this.shortcutManager) {
      this.shortcutManager = new ShortcutManager(this.windowManager);
      // Only register shortcuts that don't conflict with launch window
      this.registerMainWindowShortcuts();
    }

    // Handle main window close - don't quit app, just hide main window
    this.mainWindow.on('closed', () => {
      this.isMainWindowOpen = false;
      this.mainWindow = null;
      // Unregister only main window shortcuts when closed, keep launch window shortcuts
      if (this.shortcutManager) {
        this.shortcutManager.unregisterMainWindowShortcuts();
        this.shortcutManager = null;
      }
    });

    return this.mainWindow;
  }

  closeLaunchWindow() {
    // Unregister launch window shortcuts
    if (globalShortcut.isRegistered('CommandOrControl+Alt+Y')) {
      globalShortcut.unregister('CommandOrControl+Alt+Y');
    }
    if (globalShortcut.isRegistered('CommandOrControl+Alt+L')) {
      globalShortcut.unregister('CommandOrControl+Alt+L');
    }
    
    // Unregister main window shortcuts if they exist
    if (this.shortcutManager) {
      this.shortcutManager.unregisterAllShortcuts();
    }
    
    // Close main window if open
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.destroy();
    }
    
    // Force close launch window
    if (this.launchWindow && !this.launchWindow.isDestroyed()) {
      this.launchWindow.destroy();
    }
    
    // Quit the application
    require('electron').app.quit();
  }

  registerMainWindowShortcuts() {
    // Register only the main window specific shortcuts
    this.shortcutManager.registerHideShowShortcut();
    this.shortcutManager.registerMouseIgnoreShortcut();
    this.shortcutManager.registerLinuxAlternativeShortcuts();
    this.shortcutManager.logRegisteredShortcuts();
  }

  getLaunchWindow() {
    return this.launchWindow;
  }

  getMainWindow() {
    return this.mainWindow;
  }

  forceWindowAboveAll() {
    if (this.launchWindow && !this.launchWindow.isDestroyed()) {
      // Force the launch window above all other windows including chat-input
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

  // Content Protection Methods (Highest Priority)
  applyContentProtection() {
    if (!this.launchWindow || this.launchWindow.isDestroyed()) {
      return;
    }

    try {
      // Primary protection: Prevent screen capture of window contents
      this.launchWindow.setContentProtection(this.contentProtectionEnabled);
      
      // Enhanced protection: Make window visible on all workspaces/desktops
      // This helps prevent desktop capture by making the window omnipresent
      this.launchWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      
      // Disable developer tools completely
      this.launchWindow.webContents.closeDevTools();
      this.launchWindow.webContents.on('devtools-opened', () => {
        this.launchWindow.webContents.closeDevTools();
      });

      // Prevent right-click context menu
      this.launchWindow.webContents.on('context-menu', (event) => {
        event.preventDefault();
      });

      // Prevent keyboard shortcuts that could compromise security
      this.launchWindow.webContents.on('before-input-event', (event, input) => {
        // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
        if (
          input.key === 'F12' ||
          (input.control && input.shift && (input.key === 'I' || input.key === 'J' || input.key === 'C')) ||
          (input.control && input.key === 'U')
        ) {
          event.preventDefault();
        }
      });

      // Block new window creation attempts
      this.launchWindow.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
      });

      // Prevent navigation to external URLs
      this.launchWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const allowedProtocols = ['file:', 'data:'];
        const url = new URL(navigationUrl);
        if (!allowedProtocols.includes(url.protocol)) {
          event.preventDefault();
        }
      });

      // Enhanced screen recording protection
      this.applyEnhancedScreenRecordingProtection();

      // Monitor and log content protection status
      console.log(`Launch Window: Screen capture protection ${this.contentProtectionEnabled ? 'ENABLED' : 'DISABLED'} with HIGHEST PRIORITY and enhanced omnipresence`);
      
    } catch (error) {
      console.error('Launch Window: Failed to apply content protection:', error);
    }
  }

  // Enhanced protection against screen recording software and hardware
  applyEnhancedScreenRecordingProtection() {
    if (!this.launchWindow || this.launchWindow.isDestroyed()) return;

    try {
      // Disable hardware acceleration to prevent GPU-based capture
      this.launchWindow.webContents.setBackgroundThrottling(false);
      
      // Set window to be invisible to screen recording software
      this.launchWindow.setOpacity(0.999); // Nearly invisible but still functional
      
      // Apply additional security headers
      this.launchWindow.webContents.session.webRequest.onBeforeSendHeaders(
        { urls: ['<all_urls>'] },
        (details, callback) => {
          // Add headers that may help prevent capture
          details.requestHeaders['X-Frame-Options'] = 'DENY';
          details.requestHeaders['X-Content-Type-Options'] = 'nosniff';
          callback({ requestHeaders: details.requestHeaders });
        }
      );

      // Block clipboard access to prevent content copying
      this.launchWindow.webContents.on('select-client-certificate', (event) => {
        event.preventDefault();
      });

      // Prevent drag and drop operations
      this.launchWindow.webContents.on('will-navigate', (event) => {
        event.preventDefault();
      });

      // Block file access
      this.launchWindow.webContents.on('will-navigate', (event) => {
        event.preventDefault();
      });

      // Additional platform-specific protections
      this.applyPlatformSpecificRecordingProtection();

    } catch (error) {
      console.error('Launch Window: Failed to apply enhanced screen recording protection:', error);
    }
  }

  // Platform-specific screen recording protection
  applyPlatformSpecificRecordingProtection() {
    if (!this.launchWindow || this.launchWindow.isDestroyed()) return;

    try {
      if (process.platform === "win32") {
        // Windows-specific protections
        // Set window to be invisible to screen capture tools
        this.launchWindow.setOpacity(0.999);
        
        // Use layered window technique for additional protection
        this.launchWindow.setAlwaysOnTop(true, "screen-saver", 5);
        
        // Block Windows-specific capture methods
        this.launchWindow.webContents.on('dom-ready', () => {
          this.launchWindow.webContents.executeJavaScript(`
            // Disable selection and copying
            document.addEventListener('selectstart', (e) => e.preventDefault());
            document.addEventListener('copy', (e) => e.preventDefault());
            document.addEventListener('cut', (e) => e.preventDefault());
            document.addEventListener('paste', (e) => e.preventDefault());
            
            // Disable right-click
            document.addEventListener('contextmenu', (e) => e.preventDefault());
            
            // Disable drag and drop
            document.addEventListener('dragstart', (e) => e.preventDefault());
            document.addEventListener('drop', (e) => e.preventDefault());
            
            // Make text unselectable
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.mozUserSelect = 'none';
            document.body.style.msUserSelect = 'none';
          `);
        });

      } else if (process.platform === "darwin") {
        // macOS-specific protections
        this.launchWindow.setOpacity(0.999);
        
        // Block macOS screen recording permissions
        this.launchWindow.webContents.on('dom-ready', () => {
          this.launchWindow.webContents.executeJavaScript(`
            // Disable selection and copying
            document.addEventListener('selectstart', (e) => e.preventDefault());
            document.addEventListener('copy', (e) => e.preventDefault());
            document.addEventListener('cut', (e) => e.preventDefault());
            document.addEventListener('paste', (e) => e.preventDefault());
            
            // Disable right-click
            document.addEventListener('contextmenu', (e) => e.preventDefault());
            
            // Make text unselectable
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
          `);
        });

      } else if (process.platform === "linux") {
        // Linux-specific protections
        this.launchWindow.setOpacity(0.999);
        
        // Block Linux screen recording tools
        this.launchWindow.webContents.on('dom-ready', () => {
          this.launchWindow.webContents.executeJavaScript(`
            // Disable selection and copying
            document.addEventListener('selectstart', (e) => e.preventDefault());
            document.addEventListener('copy', (e) => e.preventDefault());
            document.addEventListener('cut', (e) => e.preventDefault());
            document.addEventListener('paste', (e) => e.preventDefault());
            
            // Disable right-click
            document.addEventListener('contextmenu', (e) => e.preventDefault());
            
            // Make text unselectable
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
          `);
        });
      }

    } catch (error) {
      console.error('Launch Window: Failed to apply platform-specific recording protection:', error);
    }
  }

  enableContentProtection() {
    this.contentProtectionEnabled = true;
    this.applyContentProtection();
    console.log('Launch Window: Screen capture protection ENABLED with highest priority and enhanced omnipresence');
  }

  disableContentProtection() {
    this.contentProtectionEnabled = false;
    if (this.launchWindow && !this.launchWindow.isDestroyed()) {
      this.launchWindow.setContentProtection(false);
      // Note: setVisibleOnAllWorkspaces remains active for consistency
    }
    console.log('Launch Window: Screen capture protection DISABLED (omnipresence remains active)');
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

  // Enhanced screen recording protection toggle
  toggleEnhancedScreenRecordingProtection() {
    if (this.contentProtectionEnabled) {
      this.applyEnhancedScreenRecordingProtection();
      console.log('Launch Window: Enhanced screen recording protection ENABLED');
    } else {
      console.log('Launch Window: Enhanced screen recording protection DISABLED (requires content protection to be enabled)');
    }
  }

  // Force refresh all protection measures
  refreshAllProtection() {
    this.applyContentProtection();
    if (this.contentProtectionEnabled) {
      this.applyEnhancedScreenRecordingProtection();
      console.log('Launch Window: All protection measures refreshed');
    }
  }

  // Memory Optimization Methods
  setupMemoryOptimization() {
    if (!this.memoryOptimizationEnabled || !this.launchWindow) return;

    console.log('Launch Window: Setting up memory optimization');
    
    // Setup hover detection
    this.launchWindow.on('mouse-enter', () => {
      this.onHoverEnter();
    });
    
    this.launchWindow.on('mouse-leave', () => {
      this.onHoverLeave();
    });
    
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

  onHoverEnter() {
    if (!this.memoryOptimizationEnabled) return;
    
    console.log('Launch Window: Hover detected - activating');
    
    // Clear any pending inactive timer
    if (this.inactiveTimer) {
      clearTimeout(this.inactiveTimer);
      this.inactiveTimer = null;
    }
    
    // Clear hover timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    
    // Activate immediately on hover
    this.setActiveState();
  }

  onHoverLeave() {
    if (!this.memoryOptimizationEnabled) return;
    
    try {
      console.log('Launch Window: Hover ended - scheduling deactivation');
      
      // Set timer to go inactive after delay
      this.hoverTimeout = setTimeout(() => {
        try {
          this.scheduleInactiveState();
        } catch (error) {
          console.error('Launch Window: Error in hover timeout callback:', error);
        }
      }, 500); // Short delay to prevent flickering
    } catch (error) {
      console.error('Launch Window: Error handling hover leave:', error);
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

  setActiveState() {
    if (!this.launchWindow || this.launchWindow.isDestroyed()) return;
    
    try {
      console.log('Launch Window: Switching to ACTIVE state');
      this.isInactive = false;
    
    // Set window size for better visibility
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const windowWidth = 80;
    const windowHeight = 200;
    const x = screenWidth - 15; // Show only 15px of the edge
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

  setInactiveState() {
    if (!this.launchWindow || this.launchWindow.isDestroyed() || this.isInactive) return;
    
    try {
      console.log('Launch Window: Switching to INACTIVE state for memory optimization');
      this.isInactive = true;
    
    // Reduce window size slightly but keep edge visible
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const windowWidth = 60;
    const windowHeight = 180;
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

  optimizeForInactiveState() {
    if (!this.launchWindow || this.launchWindow.isDestroyed()) return;
    
    try {
      // Reduce frame rate to save CPU
      this.launchWindow.webContents.setFrameRate(1); // 1 FPS when inactive
      
      // Throttle background processing
      this.launchWindow.webContents.setBackgroundThrottling(true);
      
      // Reduce opacity slightly to indicate inactive state
      this.launchWindow.setOpacity(0.8);
      
      console.log('Launch Window: Optimized for inactive state - minimal resource usage');
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
      this.launchWindow.setOpacity(0.999);
      
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

  getMemoryOptimizationStatus() {
    return {
      enabled: this.memoryOptimizationEnabled,
      isInactive: this.isInactive,
      hasInactiveTimer: !!this.inactiveTimer,
      hasHoverTimeout: !!this.hoverTimeout
    };
  }
}

module.exports = { LaunchWindowManager };