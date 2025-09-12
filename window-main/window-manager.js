const { BrowserWindow } = require("electron");
const path = require("path");
const { setupWindowBehavior } = require("./window-behavior");
const { applyWindowStyling } = require("./window-styling");
const { registerIpcHandlers } = require("./ipc-handlers");
const { title } = require("process");

// Global flag to ensure IPC handlers are registered only once
let globalIpcHandlersRegistered = false;

class WindowManager {
  constructor() {
    this.currentWindow = null;
    this.currentTheme = "transparent";
    this.currentOpacity = 1.0;
    this.mouseIgnoreEnabled = false;
    this.contentProtectionEnabled = true;
    this.ipcHandlersRegistered = false;
    this.windowBounds = null; // Store window bounds to maintain size
    this.minWindowSize = { width: 400, height: 100 }; // Minimum window size
    this.maxWindowSize = { width: 1370, height: 750 }; // Base maximum window size (can expand based on screen)
  }

  createWindow(theme = "transparent") {
    // Close existing window if it exists
    if (this.currentWindow && !this.currentWindow.isDestroyed()) {
      // Store current bounds before closing
      this.windowBounds = this.currentWindow.getBounds();
      this.currentWindow.close();
    }

    const windowOptions = this.getWindowOptions(theme);
    const win = new BrowserWindow(windowOptions);
    
    this.currentWindow = win;
    this.currentTheme = theme;
    
    this.setupWindow(win);
    return win;
  }

  getWindowOptions(theme) {
    // Fixed width, compact default height
    const fixedWidth = 480; // Fixed horizontal width
    const defaultHeight = 220; // Small initial height
    
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
    
    return {
      width: fixedWidth, // Always use fixed width
      height: this.windowBounds ? this.windowBounds.height : defaultHeight, // Allow height to be restored
      minWidth: this.minWindowSize.width,
      minHeight: this.minWindowSize.height,
      maxWidth: this.maxWindowSize.width,
      maxHeight: this.maxWindowSize.height,
      icon: getIconPath(),
      frame: false,
      transparent: theme === "transparent",
      hasShadow: false,
      alwaysOnTop: true,
      title: '',
      skipTaskbar: true,
      hiddenInMissionControl: true,
      roundedCorners: true,
      vibrancy: theme === "transparent" ? "ultra-dark" : undefined,
      resizable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        spellcheck: true,
        preload: path.join(__dirname, "..", "preload.js"),
      },
      backgroundColor: theme === "black" ? "#000000" : "rgba(0, 0, 0, 0)",
      titleBarStyle: process.platform === "darwin" ? "hiddenInset" : undefined,
      focusable: true,
      fullscreenable: false,
      kiosk: false,
      autoHideMenuBar: true,
      modal: false,
      parent: null,
      acceptFirstMouse: true,
      disableAutoHideCursor: false,
      ...(process.platform === "win32" && {
        type: "toolbar",
        thickFrame: false,
      }),
      ...(process.platform === "linux" && {
        frame: false,
        type: "dock",
      }),
    };
  }

  setupWindow(win) {
    // Setup window behavior (always on top, etc.)
    setupWindowBehavior(win);
    
    // Setup styling
    applyWindowStyling(win, this.currentOpacity, this.currentTheme);
    
    // Apply comprehensive screen capture protection
    this.applyScreenCaptureProtection(win);
    
    // Register IPC handlers only once globally
    if (!globalIpcHandlersRegistered) {
      registerIpcHandlers(this);
      globalIpcHandlersRegistered = true;
      this.ipcHandlersRegistered = true;
    }
    
    // Load content
    this.loadContent(win);
    
    // Store bounds when window is resized
    win.on('resize', () => {
      if (!win.isMaximized()) {
        this.windowBounds = win.getBounds();
      }
    });
    
    win.on('move', () => {
      if (!win.isMaximized()) {
        this.windowBounds = win.getBounds();
      }
    });

    // Content-based resizing disabled - manual control only
  }

  setupContentBasedResizing(win) {
    // Auto resize functionality disabled - manual control only
    console.log('Content-based resizing disabled - manual control only');
  }

  resizeWindowToContent(win, contentWidth, contentHeight) {
    // Auto resize functionality disabled - manual control only
    console.log('Manual resize called - auto resize disabled');
  }

  checkContentSizeAndResize(win) {
    // Auto resize functionality disabled - manual control only
    console.log('Content size check disabled - auto resize disabled');
  }

  loadContent(win) {
    if (process.env.NODE_ENV === "development") {
      win.loadURL("http://localhost:5173");
    } else {
      this.loadProductionContent(win);
    }
  }

  loadProductionContent(win) {
    const fs = require("fs");
    const appFrontendPath = path.join(__dirname, "..", "app-frontend/index.html");
    const frontendDistPath = path.join(__dirname, "..", "frontend/dist/index.html");
    const fallbackPath = path.join(__dirname, "..", "index.html");

    console.log("Current directory:", __dirname);
    console.log("Checking paths:");
    console.log("- app-frontend:", appFrontendPath, "exists:", fs.existsSync(appFrontendPath));
    console.log("- frontend/dist:", frontendDistPath, "exists:", fs.existsSync(frontendDistPath));
    console.log("- fallback:", fallbackPath, "exists:", fs.existsSync(fallbackPath));

    if (fs.existsSync(appFrontendPath)) {
      console.log("Loading from app-frontend:", appFrontendPath);
      win.loadFile(appFrontendPath);
    } else if (fs.existsSync(frontendDistPath)) {
      console.log("Loading from frontend/dist:", frontendDistPath);
      win.loadFile(frontendDistPath);
    } else {
      console.log("Loading fallback:", fallbackPath);
      win.loadFile(fallbackPath);
    }
  }

  recreateWindowWithTheme(theme) {
    if (theme !== this.currentTheme) {
      // Store current window state
      const bounds = this.currentWindow.getBounds();
      const isMaximized = this.currentWindow.isMaximized();

      // Create new window with the correct theme
      this.createWindow(theme);

      // Restore window state
      this.currentWindow.setBounds(bounds);
      if (isMaximized) {
        this.currentWindow.maximize();
      }

      // Load content and setup
      this.loadContent(this.currentWindow);
      this.setupWindow(this.currentWindow);

      // Send theme update to frontend after window is ready
      this.currentWindow.webContents.once("did-finish-load", () => {
        this.currentWindow.webContents.send("theme-changed", theme);
      });
    }

    return this.currentTheme;
  }

  // Method to receive chat messages without changing window state
  receiveChatMessage(messageData) {
    if (this.currentWindow && !this.currentWindow.isDestroyed()) {
      // Send message to frontend without changing window focus or size
      this.currentWindow.webContents.send('receive-chat-message', messageData);
      
      // Only ensure window is visible, don't change focus or size
      if (!this.currentWindow.isVisible()) {
        this.currentWindow.show();
      }
    }
  }

  // Getters
  getCurrentWindow() {
    return this.currentWindow;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getCurrentOpacity() {
    return this.currentOpacity;
  }

  isMouseIgnoreEnabled() {
    return this.mouseIgnoreEnabled;
  }

  isContentProtectionEnabled() {
    return this.contentProtectionEnabled;
  }

  // Setters
  setCurrentOpacity(opacity) {
    this.currentOpacity = opacity;
  }

  setMouseIgnoreEnabled(enabled) {
    this.mouseIgnoreEnabled = enabled;
  }

  setContentProtectionEnabled(enabled) {
    this.contentProtectionEnabled = enabled;
    // Apply protection to current window if it exists
    if (this.currentWindow && !this.currentWindow.isDestroyed()) {
      this.applyScreenCaptureProtection(this.currentWindow);
    }
  }

  // Comprehensive screen capture protection method
  applyScreenCaptureProtection(win) {
    if (!win || win.isDestroyed()) {
      return;
    }

    try {
      // Primary protection: Prevent screen capture of window contents
      win.setContentProtection(this.contentProtectionEnabled);
      
      // Enhanced protection: Make window visible on all workspaces/desktops
      // This helps prevent desktop capture by making the window omnipresent
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      
      // Additional security measures
      this.applyAdditionalSecurityMeasures(win);
      
      console.log(`Main Window: Screen capture protection ${this.contentProtectionEnabled ? 'ENABLED' : 'DISABLED'} with enhanced omnipresence`);
      
    } catch (error) {
      console.error('Main Window: Failed to apply screen capture protection:', error);
    }
  }

  // Additional security measures to prevent content exposure
  applyAdditionalSecurityMeasures(win) {
    if (!win || win.isDestroyed()) return;

    try {
      // Disable developer tools
      win.webContents.closeDevTools();
      win.webContents.on('devtools-opened', () => {
        win.webContents.closeDevTools();
      });

      // Prevent right-click context menu
      win.webContents.on('context-menu', (event) => {
        if (this.contentProtectionEnabled) {
          event.preventDefault();
        }
      });

      // Block security-compromising keyboard shortcuts
      win.webContents.on('before-input-event', (event, input) => {
        if (this.contentProtectionEnabled) {
          // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
          if (
            input.key === 'F12' ||
            (input.control && input.shift && (input.key === 'I' || input.key === 'J' || input.key === 'C')) ||
            (input.control && input.key === 'U')
          ) {
            event.preventDefault();
          }
        }
      });

      // Block new window creation attempts
      win.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
      });

      // Prevent navigation to external URLs
      win.webContents.on('will-navigate', (event, navigationUrl) => {
        const allowedProtocols = ['file:', 'data:', 'http:', 'https:'];
        try {
          const url = new URL(navigationUrl);
          if (!allowedProtocols.includes(url.protocol)) {
            event.preventDefault();
          }
        } catch (error) {
          // Invalid URL, prevent navigation
          event.preventDefault();
        }
      });

    } catch (error) {
      console.error('Main Window: Failed to apply additional security measures:', error);
    }
  }
}

module.exports = { WindowManager };
