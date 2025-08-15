const { BrowserWindow, globalShortcut, screen } = require('electron');
const path = require('path');

class LaunchWindowManager {
  constructor() {
    this.launchWindow = null;
    this.mainWindow = null;
    this.windowManager = null;
    this.shortcutManager = null;
    this.isMainWindowOpen = false;
  }

  createLaunchWindow() {
    if (this.launchWindow) {
      return this.launchWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // Tablet-like dimensions
    const windowWidth = 20;
    const windowHeight = 200;
    
    // Position: half outside screen on right side
    const x = screenWidth - (windowWidth / 2);
    const y = (screenHeight - windowHeight) / 4;

    this.launchWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: x,
      y: y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      }
    });

    // Load the launch window HTML
    this.launchWindow.loadFile(path.join(__dirname, 'launch-window.html'));

    // Setup window behavior
    this.setupLaunchWindowBehavior();
    
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
      this.launchWindow.webContents.executeJavaScript(`
        document.addEventListener('click', () => {
          require('electron').ipcRenderer.send('open-main-window');
        });
      `);
    });

    // Keep window always on top and in position
    this.launchWindow.setAlwaysOnTop(true, 'screen-saver');
    
    // Ensure window stays in position
    this.launchWindow.on('moved', () => {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      const windowWidth = 80;
      const windowHeight = 300;
      const x = screenWidth - (windowWidth / 2);
      const y = (screenHeight - windowHeight) / 2;
      
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
    // Unregister only the launch window shortcut
    if (globalShortcut.isRegistered('CommandOrControl+Alt+Y')) {
      globalShortcut.unregister('CommandOrControl+Alt+Y');
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
}

module.exports = { LaunchWindowManager };