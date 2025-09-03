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

    // Add content-based resizing functionality
    this.setupContentBasedResizing(win);
  }

  setupContentBasedResizing(win) {
    // Listen for content size changes from renderer
    win.webContents.on('ipc-message', (event, channel, ...args) => {
      if (channel === 'content-size-changed') {
        const [width, height] = args;
        this.resizeWindowToContent(win, width, height);
      }
    });

    // Alternative: Listen for DOM content loaded and check content size
    win.webContents.on('did-finish-load', () => {
      // Wait a bit for content to render, then check size
      setTimeout(() => {
        this.checkContentSizeAndResize(win);
      }, 500);
    });
  }

  resizeWindowToContent(win, contentWidth, contentHeight) {
    if (!win || win.isDestroyed()) return;

    const currentBounds = win.getBounds();
    
    // FIXED WIDTH - Keep the current width, don't change it
    const newWidth = currentBounds.width;
    
    // DYNAMIC HEIGHT - Only adjust height based on content
    let newHeight = Math.max(contentHeight, this.minWindowSize.height);
    
    // Ensure height doesn't exceed screen bounds
    const screen = require('electron').screen;
    const primaryDisplay = screen.getPrimaryDisplay();
    const { height: screenHeight } = primaryDisplay.workAreaSize;
    
    // Dynamic max height based on screen size (85% of screen height)
    const dynamicMaxHeight = Math.floor(screenHeight * 0.85);
    newHeight = Math.min(newHeight, dynamicMaxHeight);
    
    // Only resize if height difference is meaningful
    const heightDiff = Math.abs(newHeight - currentBounds.height);
    
    if (heightDiff > 10) {
      console.log(`Vertical resize: ${currentBounds.height} -> ${newHeight} (width fixed at ${newWidth})`);
      
      // Smooth vertical resize animation
      const steps = 6;
      const heightStep = (newHeight - currentBounds.height) / steps;
      
      let currentStep = 0;
      const animateResize = () => {
        if (currentStep >= steps || win.isDestroyed()) return;
        
        currentStep++;
        const intermediateHeight = Math.round(currentBounds.height + (heightStep * currentStep));
        
        // Only change height, keep width fixed
        win.setSize(newWidth, intermediateHeight, false);
        
        if (currentStep < steps) {
          setTimeout(animateResize, 20); // Slightly slower for smoother vertical animation
        }
      };
      
      // Start smooth vertical animation
      animateResize();
      
      // Adjust vertical position if window goes off screen
      setTimeout(() => {
        const newBounds = win.getBounds();
        let y = newBounds.y;
        
        // Only adjust Y position if window goes off screen
        if (y + newHeight > screenHeight) {
          y = screenHeight - newHeight - 20;
        }
        if (y < 0) y = 20;
        
        // Only move vertically if necessary
        if (y !== newBounds.y) {
          win.setPosition(newBounds.x, y);
        }
      }, steps * 20 + 50);
    }
  }

  checkContentSizeAndResize(win) {
    if (!win || win.isDestroyed()) return;

    // Execute script to get content dimensions
    win.webContents.executeJavaScript(`
      (() => {
        const body = document.body;
        const html = document.documentElement;
        
        // Get the actual content size
        const contentWidth = Math.max(
          body.scrollWidth,
          body.offsetWidth,
          html.clientWidth,
          html.scrollWidth,
          html.offsetWidth
        );
        
        const contentHeight = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );
        
        return [contentWidth, contentHeight];
      })();
    `).then(([width, height]) => {
      if (width && height) {
        this.resizeWindowToContent(win, width, height);
      }
    }).catch(err => {
      console.log('Error checking content size:', err);
    });
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
