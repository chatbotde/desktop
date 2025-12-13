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



class InterfaceWindow {
  constructor() {
    this.window = null;
    this.clickThroughManager = null;
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
      this.window.show();
      this.window.setAlwaysOnTop(true, 'screen-saver');
    });

    this.window.on('closed', () => {
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
      CaptureApiHandlers.registerHandlers();
      console.log('InterfaceWindow: Capture API handlers registered successfully');
    } catch (error) {
      console.error('InterfaceWindow: Failed to register capture API handlers:', error);
    }

    ipcMain.on('interface-window:minimize', () => {
      if (this.window) this.window.minimize();
    });

    ipcMain.on('interface-window:maximize', () => {
      if (this.window) {
        if (this.window.isMaximized()) {
          this.window.unmaximize();
        } else {
          this.window.maximize();
        }
      }
    });

    ipcMain.on('interface-window:close', () => {
      if (this.window) this.window.close();
    });
  }

  show() {
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
}

module.exports = { InterfaceWindow };
