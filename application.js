/**
 * Application
 * Main application coordinator following SOLID principles
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Coordinates initialization only
 * - Open/Closed: Extensible through dependency injection
 * - Liskov Substitution: Components are interchangeable
 * - Interface Segregation: Focused component interfaces
 * - Dependency Inversion: Depends on abstractions
 */

const { AppLifecycleManager } = require('./app-lifecycle-manager');
const { GlobalShortcutRegistry } = require('./global-shortcut-registry');
const { IpcHandlerRegistry } = require('./ipc-handler-registry');
const { execFile } = require('child_process');
const { promisify } = require('util');
// const { ChatInputWindow } = require('./chat-input/chat-input-window'); // ISOLATED
const { initializeAuth, authService, AuthWindow } = require('./auth');
const { InterfaceWindow } = require('./interface-window/dist/interface-window');
const { ProtocolHandler } = require('./interface-window/dist/protocol-handler');
const { AutoStartupManager } = require('./startup');
const { textSelectionMonitor } = require('./interface-window/monitor/text-selection-monitor');
const { environmentConfig } = require('./utils/dist/environment');
// const { initializeTsf } = require('./chat-input/tsf-ipc-handlers'); // ISOLATED
// const { setupSearchIpc } = require('./chat-input/search/search-handler'); // ISOLATED
// const { MinimalModeManager } = require('./global-shortcut'); // ISOLATED

class Application {
  /**
   * @param {AppLifecycleManager} lifecycleManager
   * @param {GlobalShortcutRegistry} shortcutRegistry
   * @param {IpcHandlerRegistry} ipcRegistry
   */
  constructor(
    lifecycleManager = null,
    shortcutRegistry = null,
    ipcRegistry = null
  ) {
    // Dependency injection (DIP)
    this.lifecycleManager = lifecycleManager || new AppLifecycleManager();
    this.shortcutRegistry = shortcutRegistry || new GlobalShortcutRegistry();
    this.ipcRegistry = ipcRegistry || new IpcHandlerRegistry();

    // Window instances
    // this.chatInputWindow = null; // ISOLATED
    this.authWindow = null;
    this.interfaceWindow = null;
    this.autoStartupManager = null;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    // Set app ID
    this.lifecycleManager.setAppId('com.sonicthinking.buddy');

    // Initialize auth system
    await this.initializeAuth();

    // Setup lifecycle handlers
    this.setupLifecycleHandlers();

    // Wait for app ready
    await this.lifecycleManager.onReady(async () => {
      await this.onAppReady();
    });
  }

  /**
   * Initialize authentication
   * @private
   */
  async initializeAuth() {
    try {
      const user = await initializeAuth();
      if (user) {
        console.log('Application: User already authenticated:', user.email || user.id);
      } else {
        console.log('Application: No authenticated user');
      }

      // Setup auth event listeners
      authService.on('auth:success', (user) => this.onAuthSuccess(user));
      authService.on('auth:logout', () => this.onAuthLogout());
      authService.on('auth:expired', () => this.onAuthExpired());
      authService.on('auth:error', (error) => this.onAuthError(error));
    } catch (error) {
      console.error('Application: Auth initialization error:', error);
    }
  }

  /**
   * Setup lifecycle event handlers
   * @private
   */
  setupLifecycleHandlers() {
    this.lifecycleManager.onWindowsAllClosed(() => {
      // Don't quit the app when all windows are closed
      console.log('Application: All windows closed, app persisting');
    });

    this.lifecycleManager.onWillQuit(() => {
      this.cleanup();
    });
  }

  /**
   * Handle app ready event
   * @private
   */
  async onAppReady() {
    this.lifecycleManager.logAppInfo();

    try {
      // Setup Protocol Handler
      const protocolHandler = new ProtocolHandler();
      protocolHandler.setup();

      // Initialize auto-startup
      await this.setupAutoStartup();

      // Check authentication
      const isAuthenticated = authService.isLoggedIn();

      if (!isAuthenticated) {
        this.authWindow = new AuthWindow();
        this.authWindow.create();
        console.log('Application: Showing auth window (user not authenticated)');
      } else {
        console.log('Application: User authenticated, skipping auth window');
      }

      // Create chat input window
      // this.createChatInputWindow(); // ISOLATED

      // Create Interface Window (pass shortcut registry for security)
      this.interfaceWindow = new InterfaceWindow(this.shortcutRegistry);
      this.interfaceWindow.create();

      // Setup Search IPC
      // setupSearchIpc(); // ISOLATED

      // Register global shortcuts
      this.registerGlobalShortcuts();

      // Setup monitoring
      this.setupTextSelectionMonitoring();

      // Register IPC handlers
      this.registerIpcHandlers();

      // Initialize TSF
      // setTimeout(() => this.initializeTsf(), 1000); // ISOLATED
    } catch (error) {
      console.error('Application: Error during initialization:', error);
      // Continue with basic functionality
      // this.createChatInputWindow(); // ISOLATED
      this.registerGlobalShortcuts();
    }
  }

  /**
   * Setup auto-startup functionality
   * @private
   */
  async setupAutoStartup() {
    try {
      this.autoStartupManager = new AutoStartupManager();
      await this.autoStartupManager.setupAutoStartup();
    } catch (error) {
      console.error('Application: Auto-startup setup failed:', error);
    }
  }

  /**
   * Create chat input window
   * @private
   */
  

  /**
   * Register global shortcuts
   * @private
   */
  registerGlobalShortcuts() {
    // Ctrl+H - Toggle chat input visibility
   

    

    
    

    // Ctrl+I - Toggle interface window
    this.shortcutRegistry.register(
      'CommandOrControl+I',
      () => this.toggleInterfaceWindow(),
      'Toggle interface window'
    );
  }

  /**
   * Toggle interface window
   * @private
   */
  toggleInterfaceWindow() {
    console.log('Application: Toggle interface window requested');
    
    // Check if application is locked
    if (this.interfaceWindow && this.interfaceWindow.isLocked && this.interfaceWindow.isLocked()) {
      console.log('Application: Cannot toggle - application is locked');
      return;
    }
    
    if (this.interfaceWindow) {
      this.interfaceWindow.toggle();
    } else {
      this.interfaceWindow = new InterfaceWindow(this.shortcutRegistry);
      this.interfaceWindow.create();
    }
  }

  /**
   * Toggle chat input window
   * @private
   */
  

  /**
   * Show chat input in collapsed state
   * @private
   */


  /**
   * Setup text selection monitoring
   * @private
   */
  setupTextSelectionMonitoring() {
    console.log('Application: Setting up text selection monitoring');

    textSelectionMonitor.startMonitoring();

    textSelectionMonitor.onSelection((selectionData) => {
      // Send to interface window if it exists and has valid coordinates
      if (selectionData?.text && this.interfaceWindow?.window) {
        this.interfaceWindow.window.webContents.send('text-selection-changed', selectionData);
      }
    });

    // Register text selection IPC handlers
    this.ipcRegistry.register('start-text-selection-monitoring', () => {
      textSelectionMonitor.startMonitoring();
      return true;
    });

    this.ipcRegistry.register('stop-text-selection-monitoring', () => {
      textSelectionMonitor.stopMonitoring();
      return true;
    });

    this.ipcRegistry.register('get-text-selection-monitoring-status', () => {
      return textSelectionMonitor.isActive();
    });
  }

  /**
   * Register IPC handlers
   * @private
   */
  registerIpcHandlers() {
    const execFileAsync = promisify(execFile);

    // Chat input window handlers
    

    // AI Model handlers
    this.ipcRegistry.register('get-all-ai-models', async () => {
      try {
        const modelConfig = require('./frontend/src/lib/ai/model-config-export.cjs');
        return modelConfig.getAllModels();
      } catch (error) {
        console.error('Application: Error getting AI models:', error);
        return [];
      }
    });

    this.ipcRegistry.register('ai-model-changed', (event, { modelId, modelDetails }) => {
      console.log('Application: AI model changed to', modelId);
    }, 'on');

    // Ollama helpers (local LLM)
    this.ipcRegistry.register('ollama:isInstalled', async () => {
      // This checks whether the `ollama` CLI is available on PATH.
      // It does NOT guarantee the Ollama service is running.
      const tryCommands = [
        { cmd: 'ollama', args: ['--version'] },
        { cmd: 'ollama', args: ['version'] },
      ];

      for (const attempt of tryCommands) {
        try {
          const { stdout } = await execFileAsync(attempt.cmd, attempt.args, {
            timeout: 2500,
            windowsHide: true,
          });
          const version = String(stdout || '').trim();
          return { installed: true, version: version || undefined };
        } catch (error) {
          // try next
        }
      }

      return {
        installed: false,
        error: 'Ollama CLI not found. Please install Ollama and ensure it is on PATH.',
      };
    });

    // Environment config handlers
    this.ipcRegistry.register('get-frontend-url', () => environmentConfig.getFrontendURL());
    this.ipcRegistry.register('get-frontend-base-url', () => environmentConfig.getFrontendBaseURL());
    this.ipcRegistry.register('is-development', () => environmentConfig.isDev());
  }

  /**
   * Initialize TSF
   * @private
   */
  

  /**
   * Handle auth success
   * @private
   */
  onAuthSuccess(user) {
    console.log('Application: Auth success:', user.email || user.id);
    this.authWindow?.close();
    // this.chatInputWindow?.show(); // ISOLATED
  }

  /**
   * Handle auth logout
   * @private
   */
  onAuthLogout() {
    console.log('Application: User logged out');
    if (!this.authWindow) {
      this.authWindow = new AuthWindow();
    }
    this.authWindow.create();
  }

  /**
   * Handle auth expired
   * @private
   */
  onAuthExpired() {
    console.log('Application: Session expired');
    if (!this.authWindow) {
      this.authWindow = new AuthWindow();
    }
    this.authWindow.create();
  }

  /**
   * Handle auth error
   * @private
   */
  onAuthError(error) {
    console.error('Application: Auth error:', error.message);
  }

  /**
   * Cleanup resources
   * @private
   */
  cleanup() {
    console.log('Application: Cleaning up...');

    this.shortcutRegistry.unregisterAll();
    // this.chatInputWindow?.destroy(); // ISOLATED

    console.log('Application: Cleanup complete');
  }
}

module.exports = { Application };
