/**
 * Application Lifecycle
 * Handles application lifecycle event setup
 * 
 * Single Responsibility: Lifecycle event management
 */

class ApplicationLifecycle {
  /**
   * @param {AppLifecycleManager} lifecycleManager
   * @param {Function} onWillQuit - Callback when app is about to quit
   */
  constructor(lifecycleManager, onWillQuit) {
    this.lifecycleManager = lifecycleManager;
    this.onWillQuit = onWillQuit;
  }

  /**
   * Setup lifecycle event handlers
   */
  setup() {
    this.lifecycleManager.onWindowsAllClosed(() => {
      // Don't quit the app when all windows are closed
      console.log('Application: All windows closed, app persisting');
    });

    this.lifecycleManager.onWillQuit(() => {
      if (this.onWillQuit) {
        this.onWillQuit();
      }
    });
  }

  /**
   * Set application ID
   * @param {string} appId
   */
  setAppId(appId) {
    this.lifecycleManager.setAppId(appId);
  }

  /**
   * Wait for app ready and execute callback
   * @param {Function} callback
   */
  async onReady(callback) {
    await this.lifecycleManager.onReady(callback);
  }

  /**
   * Log application info
   */
  logAppInfo() {
    this.lifecycleManager.logAppInfo();
  }
}

module.exports = { ApplicationLifecycle };

