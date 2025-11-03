const { BasicIpcHandlers } = require("./basic-ipc-handlers");
const { WindowPositionHandlers } = require("./window-position-handlers");
const { ContentProtectionHandlers } = require("./content-protection-handlers");
const { ClickThroughHandlers } = require("./click-through-handlers");
const { FilePickerHandlers } = require("./file-picker-handlers");
const { CaptureApiHandlers } = require("./capture-api-handlers");
const { TextSelectionHandlers } = require("./text-selection-handlers");
const { setupWebViewHandlers } = require("../../web-view/handlers/web-view-handlers");

/**
 * Central IPC handler registry for chat input window
 */
class IpcHandlerRegistry {
  // Static property to track IPC handler registration
  static ipcHandlersRegistered = false;

  /**
   * Register all IPC handlers (called once)
   */
  static registerAllHandlers() {
    if (IpcHandlerRegistry.ipcHandlersRegistered) return;

    console.log("IPC: Registering chat input handlers...");

    // Register all handler modules
    BasicIpcHandlers.registerHandlers();
    WindowPositionHandlers.registerHandlers();
    ContentProtectionHandlers.registerHandlers();
    ClickThroughHandlers.registerHandlers();
    FilePickerHandlers.registerHandlers();
    CaptureApiHandlers.registerHandlers();
    TextSelectionHandlers.registerHandlers();
    setupWebViewHandlers();

    IpcHandlerRegistry.ipcHandlersRegistered = true;
    console.log("IPC: Chat input handlers registered (including new capture API and WebView)");
  }

  /**
   * Check if handlers are registered
   */
  static areHandlersRegistered() {
    return IpcHandlerRegistry.ipcHandlersRegistered;
  }

  /**
   * Force re-registration of handlers (for development purposes)
   */
  static forceReregister() {
    IpcHandlerRegistry.ipcHandlersRegistered = false;
    IpcHandlerRegistry.registerAllHandlers();
  }
}

module.exports = { IpcHandlerRegistry };