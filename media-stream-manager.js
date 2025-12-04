/**
 * Media Stream Manager
 * Handles media chunk streaming for recordings
 * Follows: Single Responsibility Principle (SRP)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class MediaStreamManager {
  constructor() {
    this.writeStreams = new Map();
  }

  /**
   * Open a write stream for media recording
   * @param {string} suggestedPath - Optional path for the file
   * @returns {Object} Result with success status and file path
   */
  open(suggestedPath) {
    try {
      const filePath = suggestedPath || path.join(os.tmpdir(), `recording-${Date.now()}.webm`);
      const ws = fs.createWriteStream(filePath, { flags: 'w' });
      this.writeStreams.set(filePath, ws);
      
      console.log('MediaStreamManager: Opened write stream for', filePath);
      return { success: true, filePath };
    } catch (error) {
      console.error('MediaStreamManager: Failed to open stream:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Write data to media stream
   * @param {string} filePath - Path to the file
   * @param {string} base64Data - Base64 encoded data
   * @returns {Promise<Object>} Result with success status
   */
  async write(filePath, base64Data) {
    const ws = this.writeStreams.get(filePath);
    
    if (!ws) {
      return { success: false, error: 'Write stream not found' };
    }

    try {
      const buf = Buffer.from(base64Data, 'base64');
      await new Promise((resolve, reject) => {
        ws.write(buf, err => err ? reject(err) : resolve());
      });
      
      return { success: true };
    } catch (error) {
      console.error('MediaStreamManager: Failed to write to stream:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Close a write stream
   * @param {string} filePath - Path to the file
   * @returns {Object} Result with success status
   */
  close(filePath) {
    const ws = this.writeStreams.get(filePath);
    
    if (ws) {
      ws.end();
      this.writeStreams.delete(filePath);
      console.log('MediaStreamManager: Closed write stream for', filePath);
    }
    
    return { success: true };
  }

  /**
   * Close all write streams
   */
  closeAll() {
    this.writeStreams.forEach((ws, filePath) => {
      ws.end();
      console.log('MediaStreamManager: Closed write stream for', filePath);
    });
    this.writeStreams.clear();
  }

  /**
   * Get active streams
   * @returns {Array<string>} List of active file paths
   */
  getActiveStreams() {
    return Array.from(this.writeStreams.keys());
  }
}

module.exports = { MediaStreamManager };
