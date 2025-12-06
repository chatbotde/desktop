/**
 * Clickthrough State Manager
 * Manages clickthrough enabled/disabled state
 */

class StateManager {
  constructor() {
    this.enabled = true; // Start with clickthrough enabled (transparent to clicks)
    this.listeners = [];
  }

  /**
   * Enable clickthrough mode
   */
  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this._notifyListeners();
  }

  /**
   * Disable clickthrough mode
   */
  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this._notifyListeners();
  }

  /**
   * Check if clickthrough is enabled
   * @returns {boolean} Current enabled state
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Register state change listener
   * @param {Function} callback - Callback function
   */
  onChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners of state change
   * @private
   */
  _notifyListeners() {
    this.listeners.forEach(listener => listener(this.enabled));
  }
}

// Export singleton instance
export const stateManager = new StateManager();
