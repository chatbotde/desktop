const { BrowserWindow, ipcMain, app } = require('electron');
const path = require('path');
const { ClickThroughManager } = require('./click-through');
const { screen } = require('electron');

// Load register-apis with error handling
let registerElectronApis;
try {
  const registerApisModule = require('./dist/register-apis');
  registerElectronApis = registerApisModule.registerElectronApis;
  console.log('InterfaceWindow: Successfully loaded register-apis from dist');
} catch (error) {
  console.error('InterfaceWindow: Failed to load register-apis:', error);
  console.error('InterfaceWindow: __dirname =', __dirname);
  console.error('InterfaceWindow: Attempted path =', path.join(__dirname, 'dist', 'register-apis'));
  // Provide a fallback function
  registerElectronApis = () => {
    console.warn('InterfaceWindow: registerElectronApis not available (using fallback)');
  };
}

// Load TSF module with error handling
let setupTsfIpc, initializeTsf;
try {
  const tsfModule = require('./dist/tsf');
  setupTsfIpc = tsfModule.setupTsfIpc;
  initializeTsf = tsfModule.initializeTsf;
  console.log('InterfaceWindow: Successfully loaded TSF module from dist');
} catch (error) {
  console.error('InterfaceWindow: Failed to load TSF module:', error);
  // Provide fallback functions
  setupTsfIpc = () => {
    console.warn('InterfaceWindow: setupTsfIpc not available (using fallback)');
  };
  initializeTsf = async () => {
    console.warn('InterfaceWindow: initializeTsf not available (using fallback)');
    return false;
  };
}

// Load Block Manager with error handling
let initializeBlockManager, stopBlockManager;
try {
  const blockManagerModule = require('./block-manager/init-block-manager');
  initializeBlockManager = blockManagerModule.initializeBlockManager;
  stopBlockManager = blockManagerModule.stopBlockManager;
  console.log('InterfaceWindow: Successfully loaded Block Manager module');
} catch (error) {
  console.error('InterfaceWindow: Failed to load Block Manager module:', error);
  // Provide fallback functions
  initializeBlockManager = () => {
    console.warn('InterfaceWindow: Block Manager not available (using fallback)');
    return false;
  };
  stopBlockManager = () => {
    console.warn('InterfaceWindow: Block Manager stop not available');
  };
}



class InterfaceWindow {
  constructor(globalShortcutRegistry = null) {
    this.window = null;
    this.clickThroughManager = null;
    this.blockManagerInitialized = false;
    this.globalShortcutRegistry = globalShortcutRegistry;
  }

  create() {
    if (this.window) {
      this.window.focus();
      return this.window;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const preloadPath = path.join(__dirname, 'preload.js');
    console.log(`InterfaceWindow: Preload path: ${preloadPath}`);
    console.log(`InterfaceWindow: Preload exists: ${require('fs').existsSync(preloadPath)}`);

    this.window = new BrowserWindow({
      width: width,
      height: height - 1,
      frame: false,
      transparent: true,
      alwaysOnTop: false,
      focusable: true,
      resizable: false,
      skipTaskbar:true,
      minimizable: true,
      maximizable: false,
      closable: false,
      title: "",
      skipTaskbar: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      sandbox: false  // Disable sandbox to ensure preload script works correctly
        
      },
      show: false // Don't show until ready-to-show
    });

    // Listen for preload errors
    this.window.webContents.on('preload-error', (event, preloadPath, error) => {
      console.error(`InterfaceWindow: Preload error in ${preloadPath}:`, error);
    });

    // Listen for console messages from preload
    this.window.webContents.on('console-message', (event, level, message, line, sourceId) => {
      if (sourceId && sourceId.includes('preload')) {
        console.log(`[Preload Console ${level}]:`, message);
      }
    });

    // Load the frontend
    // In development, load from Vite dev server
    // In production, use the custom protocol
    const isDev = !app.isPackaged;
    const url = isDev ? 'http://localhost:5173' : 'buddy-app://frontend/index.html';

    console.log(`InterfaceWindow: Loading URL ${url}`);
    this.window.loadURL(url);

    this.clickThroughManager = new ClickThroughManager(this.window);
    this.clickThroughManager.setup();

    this.window.once('ready-to-show', () => {
      // Check if locked before showing (block manager might be initialized by now)
      if (!this.isLocked()) {
        this.window.show();
        this.window.setAlwaysOnTop(true, 'screen-saver');
      }
      
      // Initialize block manager after window is ready
      // Pass globalShortcutRegistry if available
      if (initializeBlockManager) {
        this.blockManagerInitialized = initializeBlockManager(this, this.globalShortcutRegistry);
      }
    });

    this.window.on('closed', () => {
      // Stop block manager when window closes
      if (stopBlockManager && this.blockManagerInitialized) {
        stopBlockManager();
        this.blockManagerInitialized = false;
      }
      
      this.window = null;
      this.clickThroughManager = null;
    });

    this.setupHandlers();

    return this.window;
  }

  setupHandlers() {
    registerElectronApis();

    // Setup TSF IPC handlers and initialize TSF
    setupTsfIpc(this.window);
    initializeTsf().then(success => {
      if (success) {
        console.log('InterfaceWindow: TSF initialized successfully');
      } else {
        console.warn('InterfaceWindow: TSF initialization failed');
      }
    });

    // Register capture API handlers
    try {
      const { CaptureApiHandlers } = require('./dist/capture/handlers/capture-api-handlers');
      CaptureApiHandlers.registerHandlers(this.clickThroughManager);
      console.log('InterfaceWindow: Capture API handlers registered successfully');
    } catch (error) {
      console.error('InterfaceWindow: Failed to register capture API handlers:', error);
    }

    ipcMain.on('interface-window:minimize', () => {
      // Check if locked before allowing minimize
      if (this.isLocked()) return;
      if (this.window) this.window.minimize();
    });

    ipcMain.on('interface-window:maximize', () => {
      // Check if locked before allowing maximize
      if (this.isLocked()) return;
      if (this.window) {
        if (this.window.isMaximized()) {
          this.window.unmaximize();
        } else {
          this.window.maximize();
        }
      }
    });

    ipcMain.on('interface-window:close', () => {
      // Check if locked before allowing close
      if (this.isLocked()) return;
      if (this.window) this.window.close();
    });
  }

  show() {
    // SECURITY: Never show window when locked
    if (this.isLocked()) {
      console.log('InterfaceWindow: Cannot show - application is locked');
      return;
    }
    
    if (this.window) {
      this.window.show();
      this.window.focus();
    } else {
      this.create();
    }
  }

  hide() {
    if (this.window) {
      this.window.hide();
    }
  }

  toggle() {
    // Don't allow toggle when locked
    if (this.isLocked()) {
      console.log('InterfaceWindow: Cannot toggle - application is locked');
      return;
    }
    
    if (this.window) {
      if (this.window.isVisible()) {
        this.hide();
      } else {
        this.show();
      }
    } else {
      this.create();
    }
  }

  isVisible() {
    return this.window ? this.window.isVisible() : false;
  }

  /**
   * Check if application is locked
   */
  isLocked() {
    if (!this.blockManagerInitialized) {
      return false;
    }
    try {
      const { getLockManager } = require('./block-manager/init-block-manager');
      const lockManager = getLockManager();
      if (lockManager) {
        return lockManager.getLockState();
      }
      // Fallback to BlockManager
      const { getBlockManager } = require('./block-manager/init-block-manager');
      const blockManager = getBlockManager();
      if (blockManager) {
        const status = blockManager.getLockStatus();
        return status && status.isLocked;
      }
    } catch (error) {
      // Ignore errors
    }
    return false;
  }
}

module.exports = { InterfaceWindow };
