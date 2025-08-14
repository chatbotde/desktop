const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  desktopCapturer,
  screen,
} = require("electron");
const path = require("path");

let currentWindow = null;
let currentTheme = "transparent";

function createWindow(theme = "transparent") {
  // Close existing window if it exists
  if (currentWindow && !currentWindow.isDestroyed()) {
    currentWindow.close();
  }

  const windowOptions = {
    width: 800,
    height: 600,
    frame: false,
    transparent: theme === "transparent",
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hiddenInMissionControl: true, // Hide from mission control/task switcher
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
      preload: path.join(__dirname, "preload.js"),
    },
    backgroundColor: theme === "black" ? "#000000" : "rgba(0, 0, 0, 0)",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : undefined,
    // Cross-platform window properties
    focusable: true,
    fullscreenable: false,
    kiosk: false,
    autoHideMenuBar: true,
    // Additional properties to help stay above taskbar
    modal: false,
    parent: null,
    acceptFirstMouse: true,
    disableAutoHideCursor: false,
    // Windows-specific properties to help with taskbar behavior
    ...(process.platform === "win32" && {
      type: "toolbar", // This helps with staying above taskbar on Windows
      thickFrame: false,
    }),
    // Linux-specific properties
    ...(process.platform === "linux" && {
      icon: path.join(__dirname, "assets/icon.png"), // Add app icon for Linux
      frame: false,
      type: "dock", // This can help with panel/taskbar behavior on Linux
    }),
  };

  const win = new BrowserWindow(windowOptions);
  currentWindow = win;
  currentTheme = theme;

  setupWindow(win);
  return win;
}

function setupWindow(win) {
  // Set the window to always stay on top with highest priority
  // This ensures it stays above taskbar/dock and all other windows across all platforms
  win.setAlwaysOnTop(true, "screen-saver", 2);

  // Platform-specific configurations for maximum always-on-top behavior
  if (process.platform === "win32") {
    // Windows: Stay above taskbar and system menus with maximum priority
    win.setAlwaysOnTop(true, "pop-up-menu", 2);
    // Additional Windows-specific setting to ensure it stays above taskbar
    win.setAlwaysOnTop(true, "floating", 2);
    
    // Force the window to stay above all other windows including taskbar
    setTimeout(() => {
      win.setAlwaysOnTop(false);
      win.setAlwaysOnTop(true, "screen-saver", 2);
    }, 100);
  } else if (process.platform === "darwin") {
    // macOS: Stay above dock and mission control
    win.setAlwaysOnTop(true, "floating", 2);
    win.setAlwaysOnTop(true, "pop-up-menu", 2);
  } else if (process.platform === "linux") {
    // Linux: Stay above panels and system elements
    win.setAlwaysOnTop(true, "pop-up-menu", 2);
    // Additional Linux-specific settings
    win.setAlwaysOnTop(true, "modal-panel", 2);
    win.setAlwaysOnTop(true, "floating", 2);
  }

  // Add event listener to maintain always-on-top behavior
  win.on('focus', () => {
    // Ensure the window stays on top when it gains focus
    if (process.platform === "win32") {
      win.setAlwaysOnTop(true, "screen-saver", 2);
    }
  });

  // Add event listener for when other windows might affect our position
  win.on('blur', () => {
    // Maintain always-on-top even when window loses focus
    setTimeout(() => {
      if (win && !win.isDestroyed()) {
        if (process.platform === "win32") {
          win.setAlwaysOnTop(true, "screen-saver", 2);
        } else {
          win.setAlwaysOnTop(true, "floating", 2);
        }
      }
    }, 50);
  });

  // Enable content protection to prevent this app from being captured/recorded
  // while still allowing it to capture other applications
  win.setContentProtection(true);

  // Periodic check to ensure window stays above taskbar (especially important on Windows)
  const maintainAlwaysOnTop = () => {
    if (win && !win.isDestroyed() && win.isVisible()) {
      if (process.platform === "win32") {
        // Re-apply always on top with highest priority
        win.setAlwaysOnTop(true, "screen-saver", 2);
      } else {
        win.setAlwaysOnTop(true, "floating", 2);
      }
    }
  };

  // Check every 2 seconds to maintain position above taskbar
  const alwaysOnTopInterval = setInterval(maintainAlwaysOnTop, 2000);
  
  // Clean up interval when window is destroyed
  win.on('closed', () => {
    if (alwaysOnTopInterval) {
      clearInterval(alwaysOnTopInterval);
    }
  });

  // Opacity tracking variable
  let currentOpacity = 1.0; // Default opacity

  // Function to apply basic styling based on theme
  function applyStyling(opacity = currentOpacity, theme = currentTheme) {
    const isBlackTheme = theme === "black";

    win.webContents.insertCSS(`
            * {
                box-sizing: border-box;
            }
            
            html {
                background: ${isBlackTheme ? "#000000" : "rgba(0, 0, 0, 0.1)"};
                border-radius: 15px;
                overflow: hidden;
            }
            
            body {
                border: 2px solid ${isBlackTheme ? "#333333" : "#00a8ff"};
                border-radius: 15px;
                box-shadow: 
                    0 0 20px ${isBlackTheme ? "rgba(51, 51, 51, 0.4)" : "rgba(0, 168, 255, 0.4)"},
                    0 0 40px ${isBlackTheme ? "rgba(51, 51, 51, 0.2)" : "rgba(0, 168, 255, 0.2)"};
                overflow: hidden;
                margin: 0;
                padding: 0;
                background: ${isBlackTheme ? "#000000" : "rgba(255, 255, 255, 0.05)"};
                ${!isBlackTheme ? "backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);" : ""}
                width: 100vw;
                height: 100vh;
                position: relative;
                opacity: ${opacity};
            }
            
            /* Mask to create rounded window effect */
            body::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 15px;
                background: transparent;
                pointer-events: none;
                z-index: 9999;
                box-shadow: inset 0 0 0 2000px rgba(0, 0, 0, 0);
                -webkit-mask: radial-gradient(circle at 15px 15px, transparent 14px, black 15px),
                              radial-gradient(circle at calc(100% - 15px) 15px, transparent 14px, black 15px),
                              radial-gradient(circle at 15px calc(100% - 15px), transparent 14px, black 15px),
                              radial-gradient(circle at calc(100% - 15px) calc(100% - 15px), transparent 14px, black 15px),
                              linear-gradient(to bottom, black, black);
                -webkit-mask-composite: intersect;
                mask: radial-gradient(circle at 15px 15px, transparent 14px, black 15px),
                      radial-gradient(circle at calc(100% - 15px) 15px, transparent 14px, black 15px),
                      radial-gradient(circle at 15px calc(100% - 15px), transparent 14px, black 15px),
                      radial-gradient(circle at calc(100% - 15px) calc(100% - 15px), transparent 14px, black 15px),
                      linear-gradient(to bottom, black, black);
                mask-composite: intersect;
            }
        `);
  }

  // Add styling on window load
  win.webContents.on("did-finish-load", () => {
    applyStyling(currentOpacity, currentTheme);
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    // Load the frontend files in production
    const appFrontendPath = path.join(__dirname, "app-frontend/index.html");
    const frontendDistPath = path.join(__dirname, "frontend/dist/index.html");
    const fallbackPath = path.join(__dirname, "index.html");

    // Check for frontend files in order of preference
    const fs = require("fs");
    
    // Debug: Log the current directory and check what files exist
    console.log("Current directory:", __dirname);
    console.log("Checking paths:");
    console.log("- app-frontend:", appFrontendPath, "exists:", fs.existsSync(appFrontendPath));
    console.log("- frontend/dist:", frontendDistPath, "exists:", fs.existsSync(frontendDistPath));
    console.log("- fallback:", fallbackPath, "exists:", fs.existsSync(fallbackPath));
    
    // List contents of current directory for debugging
    try {
      const contents = fs.readdirSync(__dirname);
      console.log("Directory contents:", contents);
    } catch (e) {
      console.log("Could not read directory:", e.message);
    }
    
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

  // IPC handlers for window controls
  ipcMain.handle("window-close", () => {
    currentWindow.close();
  });

  ipcMain.handle("window-minimize", () => {
    currentWindow.minimize();
  });

  ipcMain.handle("window-maximize", () => {
    if (currentWindow.isMaximized()) {
      currentWindow.unmaximize();
    } else {
      currentWindow.maximize();
    }
  });

  // Force window to stay above taskbar
  ipcMain.handle("window-force-above-taskbar", () => {
    if (currentWindow && !currentWindow.isDestroyed()) {
      // Force the window above taskbar with multiple attempts
      currentWindow.setAlwaysOnTop(false);
      setTimeout(() => {
        if (process.platform === "win32") {
          currentWindow.setAlwaysOnTop(true, "screen-saver", 2);
          currentWindow.setAlwaysOnTop(true, "floating", 2);
        } else {
          currentWindow.setAlwaysOnTop(true, "floating", 2);
        }
        // Bring to front
        currentWindow.showInactive();
        currentWindow.focus();
      }, 50);
    }
  });

  ipcMain.handle("window-set-opacity", (event, opacity) => {
    currentOpacity = opacity;
    currentWindow.setOpacity(opacity);
    applyStyling(opacity, currentTheme);
  });

  // Track mouse ignore state
  let mouseIgnoreEnabled = false;
  // Track content protection state
  let contentProtectionEnabled = true; // Default to enabled as set above

  ipcMain.handle("window-toggle-mouse-ignore", () => {
    mouseIgnoreEnabled = !mouseIgnoreEnabled;
    currentWindow.setIgnoreMouseEvents(mouseIgnoreEnabled);
    return mouseIgnoreEnabled;
  });

  // Content protection toggle handler
  ipcMain.handle("window-toggle-content-protection", () => {
    contentProtectionEnabled = !contentProtectionEnabled;
    currentWindow.setContentProtection(contentProtectionEnabled);
    console.log(
      `Content protection ${contentProtectionEnabled ? "enabled" : "disabled"}`
    );
    return contentProtectionEnabled;
    
  });

  // Get current content protection state
  ipcMain.handle("window-get-content-protection", () => {
    return contentProtectionEnabled;
    
  });

  // Get current theme
  ipcMain.handle("window-get-theme", () => {
    return currentTheme;
  });

  // Theme handler - recreate window with proper transparency settings
  ipcMain.handle("window-set-theme", (event, theme) => {
    console.log(`Theme changed to: ${theme}`);

    if (theme !== currentTheme) {
      // Store current window position and size
      const bounds = currentWindow.getBounds();
      const isMaximized = currentWindow.isMaximized();

      // Create new window with the correct theme
      createWindow(theme);

      // Restore window position and size
      currentWindow.setBounds(bounds);
      if (isMaximized) {
        currentWindow.maximize();
      }

      // Load the content
      if (process.env.NODE_ENV === "development") {
        currentWindow.loadURL("http://localhost:5173");
      } else {
        const appFrontendPath = path.join(__dirname, "app-frontend/index.html");
        const frontendDistPath = path.join(__dirname, "frontend/dist/index.html");
        const fallbackPath = path.join(__dirname, "index.html");

        const fs = require("fs");
        if (fs.existsSync(appFrontendPath)) {
          console.log("Theme change: Loading from app-frontend:", appFrontendPath);
          currentWindow.loadFile(appFrontendPath);
        } else if (fs.existsSync(frontendDistPath)) {
          console.log("Theme change: Loading from frontend/dist:", frontendDistPath);
          currentWindow.loadFile(frontendDistPath);
        } else {
          console.log("Theme change: Loading fallback:", fallbackPath);
          currentWindow.loadFile(fallbackPath);
        }
      }

      // Reapply all the window settings
      setupWindow(currentWindow);

      // Send theme update to frontend after window is ready
      currentWindow.webContents.once("did-finish-load", () => {
        currentWindow.webContents.send("theme-changed", theme);
      });
    }

    return currentTheme;
  });

  // Screen capture handlers
  ipcMain.handle("get-desktop-sources", async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["window", "screen"],
        thumbnailSize: { width: 150, height: 150 },
      });

      // Filter out this application's own window to avoid showing it in capture list
      const filteredSources = sources.filter((source) => {
        // Cross-platform filtering for own window
        const isOwnWindow =
          source.name.toLowerCase().includes("buddy") ||
          source.name.toLowerCase().includes("electron") ||
          source.id.includes(currentWindow.webContents.id.toString()) ||
          // Additional filters for different platforms
          (process.platform === "win32" && source.name.includes("Buddy")) ||
          (process.platform === "darwin" && source.name.includes("Buddy")) ||
          (process.platform === "linux" &&
            (source.name.includes("Buddy") || source.name.includes("buddy")));
        return !isOwnWindow;
      });

      return filteredSources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
      }));
    } catch (error) {
      console.error("Error getting desktop sources:", error);
      return [];
    }
  });

  ipcMain.handle("get-screen-info", () => {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    return {
      displays: displays.map((display) => ({
        id: display.id,
        bounds: display.bounds,
        workArea: display.workArea,
        scaleFactor: display.scaleFactor,
        rotation: display.rotation,
        primary: display.id === primaryDisplay.id,
      })),
      primaryDisplay: {
        id: primaryDisplay.id,
        bounds: primaryDisplay.bounds,
        workArea: primaryDisplay.workArea,
        scaleFactor: primaryDisplay.scaleFactor,
      },
    };
  });

  // Register global shortcuts with cross-platform compatibility
  // Hide/show window shortcut
  const hideShowShortcut = process.platform === "darwin" ? "Cmd+\\" : "Ctrl+\\";

  globalShortcut.register(hideShowShortcut, () => {
    if (currentWindow.isVisible()) {
      currentWindow.hide();
    } else {
      currentWindow.showInactive();
    }
  });

  // Mouse ignore toggle shortcut
  const mouseIgnoreShortcut =
    process.platform === "darwin" ? "Cmd+Shift+\\" : "Ctrl+Shift+\\";

  globalShortcut.register(mouseIgnoreShortcut, () => {
    mouseIgnoreEnabled = !mouseIgnoreEnabled;
    currentWindow.setIgnoreMouseEvents(mouseIgnoreEnabled);
    console.log(`Mouse ignore ${mouseIgnoreEnabled ? "enabled" : "disabled"}`);
  });

  // Additional Linux-specific shortcuts (if needed)
  if (process.platform === "linux") {
    // Alternative shortcut for Linux window managers that might intercept Ctrl+\
    const linuxHideShowShortcut = "Ctrl+Alt+\\";
    globalShortcut.register(linuxHideShowShortcut, () => {
      if (currentWindow.isVisible()) {
        currentWindow.hide();
      } else {
        currentWindow.showInactive();
      }
    });
  }

  // Log shortcut registration with platform info
  console.log(`Global shortcuts registered for ${process.platform}:`);
  console.log(`- ${hideShowShortcut}: Toggle window visibility`);
  console.log(`- ${mouseIgnoreShortcut}: Toggle mouse ignore`);
  if (process.platform === "linux") {
    console.log(`- Ctrl+Alt+\\: Alternative toggle window visibility (Linux)`);
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();

  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  // Unregister all global shortcuts before quitting
  globalShortcut.unregisterAll();
});
