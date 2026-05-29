/**
 * Interface Window Manager
 * Manages the main interface window for the application
 */

import { BrowserWindow, ipcMain, app, screen, shell } from 'electron';
import * as path from 'path';
import { ClickThroughManager } from './click-through';
import { registerElectronApis } from './register-apis';
import { setupTsfIpc, initializeTsf } from './tsf';
import { initializeBlockManager, stopBlockManager, getLockManager, getBlockManager } from './block-manager/init-block-manager';
import { CaptureApiHandlers } from './capture/handlers/capture-api-handlers';
import { registerFileSystemHandlers } from './file-system';
import { MouseService } from './mouse-service';

export class InterfaceWindow {
  private window: BrowserWindow | null = null;
  private clickThroughManager: ClickThroughManager | null = null;
  private blockManagerInitialized: boolean = false;
  private globalShortcutRegistry: any;
  private mouseService: MouseService = new MouseService();

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

    // Get the icon path from the app root
    const iconPath = path.join(app.getAppPath(), 'icons', 'icon.ico');

    const isDev = !app.isPackaged;

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
        sandbox: false,  // Disable sandbox to ensure preload script works correctly
        webSecurity: true,
        webviewTag: false
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

    // Global shortcuts do not fire when this window has focus — handle them here instead.
    this.window.webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return;
      if (this.isLocked()) return;

      const isVoiceInsertShortcut =
        (input.control || input.meta) &&
        !input.shift &&
        !input.alt &&
        input.key?.toLowerCase() === 'm';

      if (isVoiceInsertShortcut) {
        event.preventDefault();
        this.window?.webContents.send('toggle-voice-insert', {});
        return;
      }

      const isRectangleScreenshotShortcut =
        (input.control || input.meta) &&
        input.shift &&
        !input.alt &&
        input.key?.toLowerCase() === 's';

      if (isRectangleScreenshotShortcut) {
        event.preventDefault();
        this.window?.webContents.send('show-rectangle-screenshot', {});
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

    // Prevent navigation to external sites or file drops
    this.window.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      const isLocalHost = parsedUrl.origin === 'http://localhost:5173';
      const isBuddyApp = parsedUrl.protocol === 'buddy-app:';

      if (!(isDev && isLocalHost) && !isBuddyApp) {
        event.preventDefault();
        console.warn(`InterfaceWindow: Blocked navigation to ${navigationUrl}`);
      }
    });

    // Load the frontend
    const url = isDev ? 'http://localhost:5173' : 'buddy-app://app/index.html';

    console.log(`InterfaceWindow: Loading URL ${url}`);
    this.window.loadURL(url);

    this.clickThroughManager = new ClickThroughManager(this.window);
    this.clickThroughManager.setup();

    this.window.once('ready-to-show', () => {
      // Check if locked before showing
      if (!this.isLocked()) {
        if (this.window) {
          this.window.show();
          this.window.setAlwaysOnTop(true, 'screen-saver');
        }
      }

      // Initialize block manager after window is ready
      this.blockManagerInitialized = initializeBlockManager(this as any, this.globalShortcutRegistry);
    });

    this.window.on('closed', () => {
      // Stop block manager when window closes
      if (this.blockManagerInitialized) {
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
    setupTsfIpc(this.window || undefined);
    initializeTsf().then(success => {
      if (!success) {
        console.warn('InterfaceWindow: TSF initialization failed');
      }
    });

    // Register capture API handlers
    try {
      CaptureApiHandlers.registerHandlers(this.clickThroughManager);
    } catch (error) {
      console.error('InterfaceWindow: Failed to register capture API handlers:', error);
    }

    // Register file system handlers
    try {
      registerFileSystemHandlers();
    } catch (error) {
      console.error('InterfaceWindow: Failed to register file system handlers:', error);
    }

    ipcMain.on('interface-window:minimize', () => {
      if (this.isLocked()) return;
      if (this.window) this.window.minimize();
    });

    ipcMain.on('interface-window:maximize', () => {
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
      if (this.isLocked()) return;
      if (this.window) this.window.close();
    });

    ipcMain.handle('interface-window:click-at', async (_event, x: number, y: number) => {
      console.log(`[InterfaceWindow] click-at IPC received: (${x}, ${y})`);
      if (this.isLocked()) return { success: false, error: 'Application is locked' };
      return this.mouseService.clickAt(x, y);
    });

    ipcMain.handle('interface-window:double-click-at', async (_event, x: number, y: number) => {
      console.log(`[InterfaceWindow] double-click-at IPC received: (${x}, ${y})`);
      if (this.isLocked()) return { success: false, error: 'Application is locked' };
      return this.mouseService.doubleClickAt(x, y);
    });

    ipcMain.handle('interface-window:right-click-at', async (_event, x: number, y: number) => {
      console.log(`[InterfaceWindow] right-click-at IPC received: (${x}, ${y})`);
      if (this.isLocked()) return { success: false, error: 'Application is locked' };
      return this.mouseService.rightClickAt(x, y);
    });

    ipcMain.handle('interface-window:scroll-at', async (_event, x: number, y: number, amount: number) => {
      console.log(`[InterfaceWindow] scroll-at IPC received: (${x}, ${y}), amount: ${amount}`);
      if (this.isLocked()) return { success: false, error: 'Application is locked' };
      return this.mouseService.scrollAt(x, y, amount);
    });

    ipcMain.handle('interface-window:key-tap', async (_event, key: string, modifiers?: string[]) => {
      console.log(`[InterfaceWindow] key-tap IPC received: ${key}, modifiers: ${modifiers}`);
      if (this.isLocked()) return { success: false, error: 'Application is locked' };
      return this.mouseService.keyTap(key, modifiers);
    });

    ipcMain.handle('interface-window:type-string', async (_event, text: string) => {
      console.log(`[InterfaceWindow] type-string IPC received: "${text.slice(0, 30)}..."`);
      if (this.isLocked()) return { success: false, error: 'Application is locked' };
      return this.mouseService.typeString(text);
    });
  }

  show(): void {
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
      const lockManager = getLockManager();
      if (lockManager) {
        return lockManager.getLockState();
      }

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
