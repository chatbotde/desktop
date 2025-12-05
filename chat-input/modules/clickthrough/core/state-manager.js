/**
 * Clickthrough State Manager
 * Manages the clickthrough state with event emission
 * Following Single Responsibility Principle (SRP)
 */

class ClickthroughStateManager {
  constructor() {
    this.enabled = false;
    this.sessionStorageKey = 'clickthrough-enabled';
    this.eventName = 'clickthrough-changed';
  }

  /**
   * Get current state
   * @returns {boolean} Current enabled state
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Set state to enabled
   * @emits clickthrough-changed
   */
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    this._persistState();
    this._emitChange();
  }

  /**
   * Set state to disabled
   * @emits clickthrough-changed
   */
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    this._persistState();
    this._emitChange();
  }

  /**
   * Toggle state
   */
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Restore state from session storage
   */
  restoreState() {
    const stored = sessionStorage.getItem(this.sessionStorageKey);
    this.enabled = stored === 'true';
  }

  /**
   * Persist state to session storage
   * @private
   */
  _persistState() {
    sessionStorage.setItem(this.sessionStorageKey, String(this.enabled));
  }

  /**
   * Emit state change event
   * @private
   */
  _emitChange() {
    document.dispatchEvent(new CustomEvent(this.eventName, {
      detail: { enabled: this.enabled }
    }));
  }

  /**
   * Listen for state changes
   * @param {Function} callback - Callback to invoke on state change
   * @returns {Function} Cleanup function
   */
  onChange(callback) {
    const handler = (event) => callback(event.detail);
    document.addEventListener(this.eventName, handler);
    
    // Return cleanup function
    return () => document.removeEventListener(this.eventName, handler);
  }
}

// Export singleton instance
export const stateManager = new ClickthroughStateManager();
