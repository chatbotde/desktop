/**
 * Minimal Mode State Manager
 * Handles minimal mode state only
 * Follows: Single Responsibility Principle (SRP)
 */

class MinimalModeState {
  constructor() {
    this.isMinimal = false;
  }

  /**
   * Enable minimal mode
   * @returns {boolean} True if state changed
   */
  enable() {
    if (this.isMinimal) {
      return false;
    }
    this.isMinimal = true;
    return true;
  }

  /**
   * Disable minimal mode
   * @returns {boolean} True if state changed
   */
  disable() {
    if (!this.isMinimal) {
      return false;
    }
    this.isMinimal = false;
    return true;
  }

  /**
   * Toggle minimal mode
   * @returns {boolean} New state
   */
  toggle() {
    this.isMinimal = !this.isMinimal;
    return this.isMinimal;
  }

  /**
   * Get current state
   * @returns {boolean} True if in minimal mode
   */
  getState() {
    return this.isMinimal;
  }

  /**
   * Reset state to default
   */
  reset() {
    this.isMinimal = false;
  }
}

module.exports = { MinimalModeState };
