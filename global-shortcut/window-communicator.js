/**
 * Window Communicator Interface
 * Defines abstraction for window communication
 * Follows: Interface Segregation Principle (ISP) & Dependency Inversion Principle (DIP)
 */

/**
 * Base interface for window communication
 * Following ISP: Small, focused interface for communication
 */
class IWindowCommunicator {
  /**
   * Send message to renderer process
   * @param {string} channel - IPC channel name
   * @param {any} data - Data to send
   * @returns {boolean} True if message sent successfully
   */
  sendToRenderer(channel, data) {
    throw new Error('Method sendToRenderer() must be implemented');
  }

  /**
   * Check if window is available for communication
   * @returns {boolean} True if window is available
   */
  isAvailable() {
    throw new Error('Method isAvailable() must be implemented');
  }
}

module.exports = { IWindowCommunicator };
