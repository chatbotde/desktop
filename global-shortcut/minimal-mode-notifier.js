/**
 * Minimal Mode Notifier
 * Handles notifying renderer about minimal mode changes
 * Follows: Single Responsibility Principle (SRP)
 */

class MinimalModeNotifier {
  /**
   * @param {IWindowCommunicator} windowCommunicator - Window communicator instance
   */
  constructor(windowCommunicator) {
    this.windowCommunicator = windowCommunicator;
  }

  /**
   * Notify renderer about minimal mode state change
   * @param {boolean} isMinimal - New minimal mode state
   * @returns {boolean} True if notification sent successfully
   */
  notifyStateChange(isMinimal) {
    const success = this.windowCommunicator.sendToRenderer('minimal-mode-changed', isMinimal);
    
    if (success) {
      console.log(`MinimalModeNotifier: Notified state change to ${isMinimal ? 'minimal' : 'full'} mode`);
    } else {
      console.warn('MinimalModeNotifier: Failed to notify state change');
    }
    
    return success;
  }

  /**
   * Update window communicator
   * @param {IWindowCommunicator} windowCommunicator - New communicator instance
   */
  setWindowCommunicator(windowCommunicator) {
    this.windowCommunicator = windowCommunicator;
  }
}

module.exports = { MinimalModeNotifier };
