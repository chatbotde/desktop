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
const { McpProcessManager } = require('./mcp-process-manager');
const { MediaStreamManager } = require('./media-stream-manager');
const { ChatInputWindow } = require('./chat-input/chat-input-window');
const { InterfacesWindow } = require('./interfaces-window/interfaces-window');
const { initializeAuth, authService, AuthWindow } = require('./auth');
const { AutoStartupManager } = require('./startup');
const { clipboardMonitor } = require('./clipboard-monitor');
const { textSelectionMonitor } = require('./chat-input/electron-api/text-selection');
const { environmentConfig } = require('./utils/environment');
const { initializeTsf } = require('./chat-input/tsf-ipc-handlers');
const { setupSearchIpc } = require('./chat-input/search/search-handler');
const { MinimalModeManager } = require('./global-shortcut');

class Application {
  /**
   * @param {AppLifecycleManager} lifecycleManager
   * @param {GlobalShortcutRegistry} shortcutRegistry
   * @param {IpcHandlerRegistry} ipcRegistry
   * @param {McpProcessManager} mcpManager
   * @param {MediaStreamManager} mediaManager
   */
  constructor(
    lifecycleManager = null,
    shortcutRegistry = null,
    ipcRegistry = null,
    mcpManager = null,
    mediaManager = null
  ) {
    // Dependency injection (DIP)
    this.lifecycleManager = lifecycleManager || new AppLifecycleManager();
    this.shortcutRegistry = shortcutRegistry || new GlobalShortcutRegistry();
    this.ipcRegistry = ipcRegistry || new IpcHandlerRegistry();
    this.mcpManager = mcpManager || new McpProcessManager();
    this.mediaManager = mediaManager || new MediaStreamManager();
    
    // Window instances
    this.chatInputWindow = null;
    this.authWindow = null;
    this.interfacesWindow = null;
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
      this.createChatInputWindow();

      // Setup Search IPC
      setupSearchIpc();

      // Register global shortcuts
      this.registerGlobalShortcuts();

      // Setup monitoring
      this.setupClipboardMonitoring();
      this.setupTextSelectionMonitoring();

      // Register IPC handlers
      this.registerIpcHandlers();

      // Initialize TSF
      setTimeout(() => this.initializeTsf(), 1000);
    } catch (error) {
      console.error('Application: Error during initialization:', error);
      // Continue with basic functionality
      this.createChatInputWindow();
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
  createChatInputWindow() {
    if (!this.chatInputWindow) {
      console.log('Application: Creating chat input window');
      this.chatInputWindow = new ChatInputWindow();
      this.chatInputWindow.createChatInputWindow();
      this.chatInputWindow.show();
      MinimalModeManager.initialize(this.chatInputWindow);
    }
  }

  /**
   * Register global shortcuts
   * @private
   */
  registerGlobalShortcuts() {
    // Ctrl+H - Toggle chat input visibility
    this.shortcutRegistry.register(
      'CommandOrControl+H',
      () => this.toggleChatInput(),
      'Toggle chat input visibility'
    );

    // Ctrl+M - Toggle minimal mode
    this.shortcutRegistry.register(
      'CommandOrControl+M',
      () => MinimalModeManager.toggleMinimalMode(),
      'Toggle minimal mode'
    );

    // Ctrl+Shift+L - Show collapsed chat input
    this.shortcutRegistry.register(
      'CommandOrControl+Shift+L',
      () => this.showCollapsedChatInput(),
      'Show collapsed chat input'
    );

    // Ctrl+I - Open interfaces window
    this.shortcutRegistry.register(
      'CommandOrControl+I',
      () => this.showInterfacesWindow(),
      'Open interfaces window'
    );
  }

  /**
   * Toggle chat input window
   * @private
   */
  toggleChatInput() {
    console.log('Application: Toggle chat input requested');
    
    if (!this.chatInputWindow) {
      this.createChatInputWindow();
    } else if (this.chatInputWindow.getChatInputWindow()?.isVisible()) {
      this.chatInputWindow.hide();
    } else {
      this.chatInputWindow.show();
    }
  }

  /**
   * Show interfaces window
   * @private
   */
  showInterfacesWindow() {
    console.log('Application: Show interfaces window requested');
    
    if (!this.interfacesWindow) {
      this.interfacesWindow = new InterfacesWindow();
    }
    this.interfacesWindow.show();
  }

  /**
   * Show chat input in collapsed state
   * @private
   */
  showCollapsedChatInput() {
    console.log('Application: Show collapsed chat input');
    
    // Disable minimal mode if active
    if (MinimalModeManager.getStatus()) {
      MinimalModeManager.disableMinimalMode();
    }

    if (!this.chatInputWindow) {
      this.createChatInputWindow();
    }

    this.chatInputWindow.show();

    // Send message to renderer to ensure collapsed state
    const window = this.chatInputWindow.getChatInputWindow();
    if (window && !window.isDestroyed()) {
      window.webContents.send('set-collapsed-state', true);
    }
  }

  /**
   * Setup clipboard monitoring
   * @private
   */
  setupClipboardMonitoring() {
    console.log('Application: Setting up clipboard monitoring');

    clipboardMonitor.startMonitoring();

    clipboardMonitor.onChange((clipboardContent) => {
      if (this.chatInputWindow?.getChatInputWindow()?.isVisible()) {
        this.chatInputWindow.getChatInputWindow().webContents.send('clipboard-changed', clipboardContent);
      }
    });

    // Register clipboard IPC handlers
    this.ipcRegistry.register('start-clipboard-monitoring', () => {
      clipboardMonitor.startMonitoring();
      return true;
    });

    this.ipcRegistry.register('stop-clipboard-monitoring', () => {
      clipboardMonitor.stopMonitoring();
      return true;
    });

    this.ipcRegistry.register('get-clipboard-monitoring-status', () => {
      return clipboardMonitor.isActive();
    });

    this.ipcRegistry.register('set-clipboard-check-interval', (event, intervalMs) => {
      clipboardMonitor.setCheckInterval(intervalMs);
      return true;
    });
  }

  /**
   * Setup text selection monitoring
   * @private
   */
  setupTextSelectionMonitoring() {
    console.log('Application: Setting up text selection monitoring');

    textSelectionMonitor.startMonitoring();

    textSelectionMonitor.onSelection((selectionData) => {
      if (selectionData?.text && this.chatInputWindow?.getChatInputWindow()) {
        this.chatInputWindow.getChatInputWindow().webContents.send('text-selection-changed', selectionData);
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

    // Handle add to chat
    this.ipcRegistry.register('add-to-chat', (event, text) => {
      if (text && this.chatInputWindow?.getChatInputWindow()) {
        this.chatInputWindow.getChatInputWindow().webContents.send('add-text-to-input', text);
      }
    }, 'on');
  }

  /**
   * Register IPC handlers
   * @private
   */
  registerIpcHandlers() {
    // Chat input window handlers
    this.ipcRegistry.register('toggle-chat-input', () => {
      this.toggleChatInput();
    }, 'on');

    this.ipcRegistry.register('hide-chat-input', () => {
      this.chatInputWindow?.hide();
    }, 'on');

    // MCP handlers
    this.ipcRegistry.register('mcp:connect', async (event, config) => {
      return await this.mcpManager.connect(config, event.sender);
    });

    this.ipcRegistry.register('mcp:send', async (event, serverId, message) => {
      return this.mcpManager.send(serverId, message);
    });

    this.ipcRegistry.register('mcp:disconnect', async (event, serverId) => {
      this.mcpManager.disconnect(serverId);
    });

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

    // Interfaces window handlers
    this.ipcRegistry.register('interfaces:show', () => {
      this.showInterfacesWindow();
    }, 'on');

    this.ipcRegistry.register('interfaces:minimize', () => {
      this.interfacesWindow?.getWindow()?.minimize();
    }, 'on');

    this.ipcRegistry.register('interfaces:maximize', () => {
      const win = this.interfacesWindow?.getWindow();
      if (win) {
        const isMaximized = win.isMaximized();
        isMaximized ? win.unmaximize() : win.maximize();
        win.webContents.send('interfaces:maximize-changed', !isMaximized);
      }
    }, 'on');

    this.ipcRegistry.register('interfaces:is-maximized', () => {
      return this.interfacesWindow?.getWindow()?.isMaximized() ?? false;
    });

    this.ipcRegistry.register('interfaces:close', () => {
      this.interfacesWindow?.close();
    }, 'on');

    this.ipcRegistry.register('interfaces:get-all', async () => {
      // Return your interfaces data here
      return [];
    });

    // Environment config handlers
    this.ipcRegistry.register('get-frontend-url', () => environmentConfig.getFrontendURL());
    this.ipcRegistry.register('get-frontend-base-url', () => environmentConfig.getFrontendBaseURL());
    this.ipcRegistry.register('is-development', () => environmentConfig.isDev());

    // Media stream handlers
    this.ipcRegistry.register('media:open', (event, suggestedPath) => {
      return this.mediaManager.open(suggestedPath);
    });

    this.ipcRegistry.register('media:write', async (event, { filePath, base64 }) => {
      return await this.mediaManager.write(filePath, base64);
    });

    this.ipcRegistry.register('media:close', (event, filePath) => {
      return this.mediaManager.close(filePath);
    });
  }

  /**
   * Initialize TSF
   * @private
   */
  async initializeTsf() {
    try {
      console.log('Application: Initializing TSF...');
      const success = await initializeTsf();
      if (success) {
        console.log('Application: TSF initialized successfully');
      } else {
        console.warn('Application: TSF initialization failed');
      }
    } catch (error) {
      console.error('Application: TSF initialization error:', error);
    }
  }

  /**
   * Handle auth success
   * @private
   */
  onAuthSuccess(user) {
    console.log('Application: Auth success:', user.email || user.id);
    this.authWindow?.close();
    this.chatInputWindow?.show();
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
    this.mcpManager.disconnectAll();
    this.mediaManager.closeAll();
    this.chatInputWindow?.destroy();

    console.log('Application: Cleanup complete');
  }
}

module.exports = { Application };
