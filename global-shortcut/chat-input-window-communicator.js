/**
 * Chat Input Window Communicator
 * Concrete implementation for chat input window communication
 * Follows: Single Responsibility Principle (SRP) & Dependency Inversion Principle (DIP)
 */

const { IWindowCommunicator } = require('./window-communicator');

class ChatInputWindowCommunicator extends IWindowCommunicator {
  /**
   * @param {Object} chatInputWindow - Chat input window instance
   */
  constructor(chatInputWindow = null) {
    super();
    this.chatInputWindow = chatInputWindow;
  }

  /**
   * Send message to renderer process
   * @param {string} channel - IPC channel name
   * @param {any} data - Data to send
   * @returns {boolean} True if message sent successfully
   */
  sendToRenderer(channel, data) {
    if (!this.isAvailable()) {
      console.warn('ChatInputWindowCommunicator: Window not available for communication');
      return false;
    }

    try {
      const window = this.chatInputWindow.getChatInputWindow();
      if (!window.isDestroyed()) {
        window.webContents.send(channel, data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('ChatInputWindowCommunicator: Failed to send message:', error);
      return false;
    }
  }

  /**
   * Check if window is available for communication
   * @returns {boolean} True if window is available
   */
  isAvailable() {
    return this.chatInputWindow !== null && 
           this.chatInputWindow.getChatInputWindow !== undefined;
  }

  /**
   * Update window reference
   * @param {Object} chatInputWindow - New chat input window instance
   */
  setWindow(chatInputWindow) {
    this.chatInputWindow = chatInputWindow;
  }

  /**
   * Clear window reference
   */
  clearWindow() {
    this.chatInputWindow = null;
  }
}

module.exports = { ChatInputWindowCommunicator };
