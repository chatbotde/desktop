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

const { AppLifecycleManager } = require('../app-lifecycle-manager');
const { GlobalShortcutRegistry } = require('../global-shortcut-registry');
const { IpcHandlerRegistry } = require('../ipc-handler-registry');
const { ProtocolHandler } = require('../interface-window/dist/protocol-handler');
const { AutoStartupManager } = require('../startup');
const { ApplicationAuthHandler } = require('./application-auth-handler');
const { ApplicationWindowManager } = require('./application-window-manager');
const { ApplicationShortcutManager } = require('./application-shortcut-manager');
const { ApplicationIpcHandlers } = require('./application-ipc-handlers');
const { ApplicationMonitoring } = require('./application-monitoring');
const { ApplicationLifecycle } = require('./application-lifecycle');
const { ApplicationUpdater } = require('./application-updater');
const { ComposioClient } = require('../composio/composio-client');
const { McpClient } = require('../mcp/mcp-client');

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

    // Initialize component managers
    this.lifecycle = new ApplicationLifecycle(this.lifecycleManager, () => this.cleanup());
    this.authHandler = new ApplicationAuthHandler(
      (user) => this.onAuthSuccess(user),
      () => this.onAuthLogout(),
      () => this.onAuthExpired(),
      (error) => this.onAuthError(error),
      () => this.onGuestTrialStart()
    );
    this.windowManager = new ApplicationWindowManager(this.shortcutRegistry);
    this.shortcutManager = new ApplicationShortcutManager(
      this.shortcutRegistry,
      () => {
        this.windowManager.toggleInterfaceWindow();
      },
      () => {
        this.windowManager.showAndConnectAssistant();
      },
      () => {
        this.windowManager.showPromptInput();
      },
      () => {
        this.windowManager.toggleVoiceInsert();
      },
      () => {
        this.windowManager.showRectangleScreenshot();
      }
    );
    this.ipcHandlers = new ApplicationIpcHandlers(this.ipcRegistry);
    this.monitoring = new ApplicationMonitoring(
      this.ipcRegistry,
      (selectionData) => this.onTextSelection(selectionData)
    );

    // Composio Integration
    this.composioClient = new ComposioClient(this.ipcRegistry, this.authHandler);

    // MCP client for external tool servers
    this.mcpClient = new McpClient(this.ipcRegistry);

    // Auto-startup manager
    this.autoStartupManager = null;

    // Auto-updater (initialized after window manager is ready)
    this.updater = new ApplicationUpdater({
      windowManager: this.windowManager,
      ipcRegistry: this.ipcRegistry,
    });
  }

  /**
   * Initialize the application
   */
  async initialize() {
    // Set app ID
    this.lifecycle.setAppId('com.sonicthinking.sonicthinking');

    // Initialize auth system
    await this.authHandler.initialize();

    // Setup lifecycle handlers
    this.lifecycle.setup();

    // Wait for app ready
    await this.lifecycle.onReady(async () => {
      await this.onAppReady();
    });
  }

  /**
   * Handle app ready event
   * @private
   */
  async onAppReady() {
    this.lifecycle.logAppInfo();

    try {
      // Setup Protocol Handler
      const protocolHandler = new ProtocolHandler();
      protocolHandler.setup();

      // Initialize auto-startup
      await this.setupAutoStartup();

      // Create interface window in background; auth window appears on top for new users
      this.windowManager.createInterfaceWindow();

      // Initialize auto-updater after the renderer can receive notifications
      this.updater.initialize();

      if (!this.authHandler.isAuthenticated() && !this.authHandler.shouldSkipAuthWindow()) {
        this.authHandler.showAuthWindowIfNeeded();
      }

      // Register global shortcuts
      this.shortcutManager.register();

      // Setup monitoring
      this.monitoring.setup();

      // Register IPC handlers
      this.ipcHandlers.register();

      // Setup Composio Integration
      this.composioClient.setup();

      // Setup MCP client
      this.mcpClient.setup();

      // Initialize YouTube transcript system
      const { initializeTranscript } = require('../youtube-transcript');
      initializeTranscript();

      // Initialize PocketTTS service
      try {
        const { initializePocketTTS } = require('../../pocket-tts/index.js');
        initializePocketTTS();
      } catch (err) {
        console.error('Application: Failed to initialize PocketTTS:', err);
      }
    } catch (error) {
      console.error('Application: Error during initialization:', error);
      // Continue with basic functionality
      this.shortcutManager.register();
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
   * Handle text selection event
   * @private
   */
  onTextSelection(selectionData) {
    // Send to interface window if it exists and has valid coordinates
    if (selectionData?.text) {
      this.windowManager.sendToInterfaceWindow('text-selection-changed', selectionData);
    }
  }

  /**
   * Handle auth success
   * @private
   */
  onAuthSuccess(user) {
    console.log('Application: Authentication successful, creating interface window');
    // Create interface window when user logs in
    this.windowManager.createInterfaceWindow();
  }

  onGuestTrialStart() {
    console.log('Application: Guest trial active, app ready');
    this.windowManager.createInterfaceWindow();
  }

  /**
   * Handle auth logout
   * @private
   */
  onAuthLogout() {
    console.log('Application: User logged out, continuing in guest mode');
  }

  /**
   * Handle auth expired
   * @private
   */
  onAuthExpired() {
    // Additional logic can be added here if needed
  }

  /**
   * Handle auth error
   * @private
   */
  onAuthError(error) {
    // Additional logic can be added here if needed
  }

  /**
   * Cleanup resources
   * @private
   */
  async cleanup() {
    console.log('Application: Cleaning up...');

    this.shortcutManager.unregisterAll();

    if (this.mcpClient) {
      await this.mcpClient.disconnectAll();
    }

    console.log('Application: Cleanup complete');
  }
}

module.exports = { Application };
