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
const { RemotePadService } = require('../remote-pad');
const { ManimVideoService } = require('../manim-video/manim-video-service');
const { VideoGifService } = require('../media/video-gif-service');
const { SkillsService } = require('../skills/skills-service');
const { AgentSessionService } = require('../agent-sessions');

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
      },
      () => {
        this.windowManager.showAssignPin();
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

    // Remote Pad — LAN mouse control from phone/tablet
    this.remotePadService = new RemotePadService(this.ipcRegistry);

    // Manim video rendering — local Python/FFmpeg/TTS pipeline
    this.manimVideoService = new ManimVideoService(this.ipcRegistry);

    // Short recording → GIF export (ffmpeg)
    this.videoGifService = new VideoGifService(this.ipcRegistry);

    // Local skills library — skill.md files + SQLite index
    this.skillsService = new SkillsService(this.ipcRegistry);

    // Universal agent session hub (buddy run + phone Agents tab)
    this.agentSessionService = new AgentSessionService(this.ipcRegistry);

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

      // Register IPC handlers first so core features always work
      this.ipcHandlers.register();

      // Setup Composio Integration
      this.composioClient.setup();

      // Setup MCP client
      this.mcpClient.setup();

      // Setup Remote Pad server (phone mouse control over LAN)
      this.remotePadService.setup();
      this.remotePadService.setAgentSessionService(this.agentSessionService);
      this.agentSessionService.setup(this.remotePadService);
      const status = this.remotePadService.getStatus();
      console.log(
        `[RemotePad] Ready — ${status.buddyId} ws://${status.ip}:${status.port} PIN: ${status.pin}`
      );
      console.log('[RemotePad] Phone pairing: Settings → Remote Pad, or run remote-pad:open-pairing-window');

      // Setup local Manim renderer IPC
      this.manimVideoService.setup();

      // Setup short-video → GIF export IPC
      this.videoGifService.setup();

      // Setup local skills storage (skill.md + SQLite)
      this.skillsService.setup();

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
      const normalized = this.normalizeSelectionCoordinates(selectionData);
      this.windowManager.sendToInterfaceWindow('text-selection-changed', normalized);
    }
  }

  /**
   * Convert selection-hook coordinates into window-local logical (DIP) points
   * the renderer can use directly for CSS positioning.
   *
   * selection-hook returns raw screen coordinates: physical pixels on
   * Windows/Linux and already-logical pixels on macOS. Without this conversion
   * the popup lands at the wrong spot on any display that uses scaling (HiDPI).
   * See https://github.com/0xfullex/selection-hook/blob/main/docs/API.md
   * @private
   */
  normalizeSelectionCoordinates(selectionData) {
    const INVALID = -99999; // SelectionHook.INVALID_COORDINATE
    const POINT_KEYS = ['mousePosStart', 'mousePosEnd', 'startTop', 'startBottom', 'endTop', 'endBottom'];

    let screenModule;
    try {
      ({ screen: screenModule } = require('electron'));
    } catch {
      return selectionData;
    }

    // Origin of the overlay window in DIP space, so we can produce coordinates
    // relative to the renderer viewport rather than the whole desktop.
    let origin = { x: 0, y: 0 };
    try {
      const browserWindow = this.windowManager.getInterfaceWindow?.()?.window;
      if (browserWindow && !browserWindow.isDestroyed()) {
        const bounds = browserWindow.getBounds();
        origin = { x: bounds.x, y: bounds.y };
      }
    } catch {
      origin = { x: 0, y: 0 };
    }

    const isMac = process.platform === 'darwin';
    const canConvert = !isMac && typeof screenModule.screenToDipPoint === 'function';

    const convertPoint = (point) => {
      if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return point;
      // Preserve the sentinel so the renderer can detect unavailable coordinates.
      if (point.x === INVALID || point.y === INVALID) return point;

      let dip = point;
      if (canConvert) {
        try {
          dip = screenModule.screenToDipPoint({ x: point.x, y: point.y });
        } catch {
          dip = point;
        }
      }
      return { x: dip.x - origin.x, y: dip.y - origin.y };
    };

    const normalized = { ...selectionData };
    for (const key of POINT_KEYS) {
      if (normalized[key]) normalized[key] = convertPoint(normalized[key]);
    }
    return normalized;
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

    if (this.remotePadService) {
      await this.remotePadService.shutdown();
    }

    if (this.agentSessionService) {
      await this.agentSessionService.shutdown();
    }

    console.log('Application: Cleanup complete');
  }
}

module.exports = { Application };
