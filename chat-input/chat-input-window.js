const { BrowserWindow } = require("electron");
const path = require("path");
const CaptureAPI = require("./capture");

// Import all modular components
const { WindowConfig } = require("./window/utils/window-config");
const { WindowBehavior } = require("./window/utils/window-behavior");
const { SecurityManager } = require("./window/security/security-manager");
const { IpcHandlerRegistry } = require("./window/handlers/ipc-handler-registry");

class ChatInputWindow {
  constructor() {
    this.chatInputWindow = null;
    this.mainWindow = null;
    this.windowBehavior = null;
    this.securityManager = null;
    this.captureAPI = new CaptureAPI();
  }

  createChatInputWindow() {
    if (this.chatInputWindow) {
      return this.chatInputWindow;
    }

    // Register IPC handlers once (before creating window)
    IpcHandlerRegistry.registerAllHandlers();

    // Get window configuration
    const windowOptions = WindowConfig.getBrowserWindowOptions();

    this.chatInputWindow = new BrowserWindow(windowOptions);

    // Store instance reference on the window for IPC access
    this.chatInputWindow._chatInputInstance = this;

    // Load the chat input HTML
    this.chatInputWindow.loadFile(path.join(__dirname, "chat-input.html"));

    // Setup window behavior using the behavior manager
    this.setupChatInputBehavior();

    return this.chatInputWindow;
  }

  setupChatInputBehavior() {
    if (!this.chatInputWindow) return;

    // Initialize behavior manager
    this.windowBehavior = new WindowBehavior(this.chatInputWindow);
    this.windowBehavior.setupBehavior();

    // Initialize security manager
    this.securityManager = new SecurityManager(this.chatInputWindow);
    this.securityManager.applyScreenCaptureProtection();
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  show() {
    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      this.chatInputWindow.show();
      this.chatInputWindow.focus();
    }
  }

  hide() {
    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      this.chatInputWindow.hide();
    }
  }

  toggle() {
    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      if (this.chatInputWindow.isVisible()) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  destroy() {
    // Clean up behavior manager first
    if (this.windowBehavior) {
      this.windowBehavior.cleanup();
      this.windowBehavior = null;
    }

    // Clean up capture API
    if (this.captureAPI) {
      this.captureAPI.cleanup();
    }

    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      // Remove instance reference
      this.chatInputWindow._chatInputInstance = null;
      this.chatInputWindow.destroy();
    }
    this.chatInputWindow = null;
    this.securityManager = null;
  }

  forceWindowAboveTaskbar() {
    if (this.windowBehavior) {
      this.windowBehavior.forceWindowAboveTaskbar();
    }
  }

  getChatInputWindow() {
    return this.chatInputWindow;
  }

  // Security-related methods (delegated to SecurityManager)
  setContentProtectionEnabled(enabled) {
    if (this.securityManager) {
      this.securityManager.setContentProtectionEnabled(enabled);
    }
  }

  isContentProtectionEnabled() {
    if (this.securityManager) {
      return this.securityManager.isContentProtectionEnabled();
    }
    return false;
  }

  toggleEnhancedScreenRecordingProtection() {
    if (this.securityManager) {
      this.securityManager.toggleEnhancedScreenRecordingProtection();
    }
  }

  refreshAllProtection() {
    if (this.securityManager) {
      this.securityManager.refreshAllProtection();
    }
  }

  applyScreenCaptureProtection() {
    if (this.securityManager) {
      this.securityManager.applyScreenCaptureProtection();
    }
  }

  // Backward compatibility - expose contentProtectionEnabled property
  get contentProtectionEnabled() {
    return this.isContentProtectionEnabled();
  }

  set contentProtectionEnabled(value) {
    this.setContentProtectionEnabled(value);
  }

  // Backward compatibility - expose alwaysOnTopInterval from behavior manager
  get alwaysOnTopInterval() {
    return this.windowBehavior ? this.windowBehavior.getInterval() : null;
  }
}

module.exports = { ChatInputWindow };
