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
  }

  createWindow(theme = "transparent") {
    // Close existing window if it exists
    if (this.currentWindow && !this.currentWindow.isDestroyed()) {
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
    return {
      width: 800,
      height: 600,
      frame: false,
      transparent: theme === "transparent",
      hasShadow: true,
      alwaysOnTop: true,
      title:'',
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
        icon: path.join(__dirname, "..", "assets/icon.png"),
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
    
    // Register IPC handlers only once globally
    if (!globalIpcHandlersRegistered) {
      registerIpcHandlers(this);
      globalIpcHandlersRegistered = true;
      this.ipcHandlersRegistered = true;
    }
    
    // Load content
    this.loadContent(win);
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
  }
}

module.exports = { WindowManager };
