/**
 * Interface Window Manager
 * Manages the main interface window for the application
 */

import { BrowserWindow, ipcMain, app, screen, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ClickThroughManager } from './click-through';

// Declare __dirname for TypeScript (available in CommonJS)
declare const __dirname: string;

// Type definitions for dynamically loaded modules
type RegisterElectronApisFunction = () => void;
type SetupTsfIpcFunction = (window: BrowserWindow | null) => void;
type InitializeTsfFunction = () => Promise<boolean>;
type InitializeBlockManagerFunction = (interfaceWindow: InterfaceWindow, globalShortcutRegistry?: any) => boolean;
type StopBlockManagerFunction = () => void;

// Load register-apis with error handling
let registerElectronApis: RegisterElectronApisFunction;
try {
  const registerApisModule = require('./register-apis');
  registerElectronApis = registerApisModule.registerElectronApis;
  console.log('InterfaceWindow: Successfully loaded register-apis');
} catch (error) {
  console.error('InterfaceWindow: Failed to load register-apis:', error);
  console.error('InterfaceWindow: __dirname =', __dirname);
  console.error('InterfaceWindow: Attempted path =', path.join(__dirname, 'register-apis'));
  // Provide a fallback function
  registerElectronApis = () => {
    console.warn('InterfaceWindow: registerElectronApis not available (using fallback)');
  };
}

// Load TSF module with error handling
let setupTsfIpc: SetupTsfIpcFunction;
let initializeTsf: InitializeTsfFunction;
try {
  const tsfModule = require('./tsf');
  setupTsfIpc = tsfModule.setupTsfIpc;
  initializeTsf = tsfModule.initializeTsf;
  console.log('InterfaceWindow: Successfully loaded TSF module');
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
let initializeBlockManager: InitializeBlockManagerFunction;
let stopBlockManager: StopBlockManagerFunction;
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

export class InterfaceWindow {
  private window: BrowserWindow | null = null;
  private clickThroughManager: ClickThroughManager | null = null;
  private blockManagerInitialized: boolean = false;
  private globalShortcutRegistry: any;

  constructor(globalShortcutRegistry: any = null) {
    this.globalShortcutRegistry = globalShortcutRegistry;
  }

  create(): BrowserWindow {
    if (this.window) {
      this.window.focus();
      return this.window;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const preloadPath = path.join(__dirname, 'preload', 'index.js');
    console.log(`InterfaceWindow: Preload path: ${preloadPath}`);
    console.log(`InterfaceWindow: Preload exists: ${fs.existsSync(preloadPath)}`);

    // Get the icon path from the app root
    const iconPath = path.join(app.getAppPath(), 'icons', 'icon.ico');

    this.window = new BrowserWindow({
      width: width,
      height: height - 1,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      focusable: true,
      resizable: false,
      skipTaskbar: true,
      minimizable: true,
      maximizable: false,
      closable: false,
      title: "",
      icon: iconPath,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false  // Disable sandbox to ensure preload script works correctly
      },
      show: false // Don't show until ready-to-show
    });

    // Listen for preload errors
    this.window.webContents.on('preload-error', (_event, preloadPath, error) => {
      console.error(`InterfaceWindow: Preload error in ${preloadPath}:`, error);
    });

    // Listen for console messages from preload
    this.window.webContents.on('console-message', (_event, level, message, _line, sourceId) => {
      if (sourceId && sourceId.includes('preload')) {
        console.log(`[Preload Console ${level}]:`, message);
      }
    });

    // Intercept external links (target="_blank" or window.open) and open in system browser
    this.window.webContents.setWindowOpenHandler(({ url }) => {
      // Only allow http, https, and mailto protocols
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
        console.log(`InterfaceWindow: Opening external URL in system browser: ${url}`);
        shell.openExternal(url);
      } else {
        console.warn(`InterfaceWindow: Blocked opening URL with unsupported protocol: ${url}`);
      }
      // Deny opening new Electron windows - always return deny
      return { action: 'deny' };
    });

    // Load the frontend
    // In development, load from Vite dev server
    // In production, use the custom protocol
    const isDev = !app.isPackaged;
    const url = isDev ? 'http://localhost:5173' : 'buddy-app://app/index.html';

    console.log(`InterfaceWindow: Loading URL ${url}`);
    this.window.loadURL(url);

    this.clickThroughManager = new ClickThroughManager(this.window);
    this.clickThroughManager.setup();

    this.window.once('ready-to-show', () => {
      // Check if locked before showing (block manager might be initialized by now)
      if (!this.isLocked()) {
        if (this.window) {
          this.window.show();
          this.window.setAlwaysOnTop(true, 'screen-saver');
        }
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

  setupHandlers(): void {
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
      const { CaptureApiHandlers } = require('./capture/handlers/capture-api-handlers');
      CaptureApiHandlers.registerHandlers(this.clickThroughManager);
      console.log('InterfaceWindow: Capture API handlers registered successfully');
    } catch (error) {
      console.error('InterfaceWindow: Failed to register capture API handlers:', error);
    }

    // Register file system handlers
    try {
      const { registerFileSystemHandlers } = require('./file-system');
      registerFileSystemHandlers();
      console.log('InterfaceWindow: File system handlers registered successfully');
    } catch (error) {
      console.error('InterfaceWindow: Failed to register file system handlers:', error);
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

  show(): void {
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

  hide(): void {
    if (this.window) {
      this.window.hide();
    }
  }

  toggle(): void {
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

  isVisible(): boolean {
    return this.window ? this.window.isVisible() : false;
  }

  /**
   * Check if application is locked
   */
  isLocked(): boolean {
    if (!this.blockManagerInitialized) {
      return false;
    }
    try {
      const { getLockManager, getBlockManager } = require('./block-manager/init-block-manager');
      const lockManager = getLockManager();
      if (lockManager) {
        return lockManager.getLockState();
      }
      // Fallback to BlockManager
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

// Export for CommonJS compatibility
module.exports = { InterfaceWindow };
