/**
 * Application Monitoring
 * Sets up text selection monitoring and related IPC handlers
 * 
 * Single Responsibility: Text selection monitoring setup
 */

const { textSelectionMonitor } = require('../interface-window/monitor/text-selection-monitor');

class ApplicationMonitoring {
  /**
   * @param {IpcHandlerRegistry} ipcRegistry
   * @param {Function} onSelection - Callback when text is selected
   */
  constructor(ipcRegistry, onSelection) {
    this.ipcRegistry = ipcRegistry;
    this.onSelection = onSelection;
  }

  /**
   * Setup text selection monitoring
   */
  setup() {
    console.log('Application: Setting up text selection monitoring');

    textSelectionMonitor.startMonitoring();

    textSelectionMonitor.onSelection((selectionData) => {
      if (this.onSelection) {
        this.onSelection(selectionData);
      }
    });

    this.registerIpcHandlers();
  }

  /**
   * Register IPC handlers for text selection monitoring
   * @private
   */
  registerIpcHandlers() {
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
}

module.exports = { ApplicationMonitoring };

