const { ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');

/**
 * Drag & Drop API Module
 * Handles file dropping into Electron windows
 */

class DragDropManager {
  constructor() {
    this.handlers = new Map();
    this.setupIpcHandlers();
  }

  /**
   * Setup IPC handlers for drag-drop events
   */
  setupIpcHandlers() {
    ipcMain.on('drag-drop:files-dropped', async (event, data) => {
      const { files, dropZone } = data;
      
      // Process dropped files
      const processedFiles = await this.processDroppedFiles(files);
      
      // Notify all registered handlers
      this.notifyHandlers('files-dropped', {
        files: processedFiles,
        dropZone,
        windowId: event.sender.id
      });
      
      // Send back to renderer
      event.sender.send('drag-drop:files-processed', processedFiles);
    });

    ipcMain.on('drag-drop:text-dropped', (event, data) => {
      this.notifyHandlers('text-dropped', {
        text: data.text,
        dropZone: data.dropZone,
        windowId: event.sender.id
      });
    });

    ipcMain.on('drag-drop:url-dropped', (event, data) => {
      this.notifyHandlers('url-dropped', {
        url: data.url,
        dropZone: data.dropZone,
        windowId: event.sender.id
      });
    });
  }

  /**
   * Process dropped files and extract metadata
   * @param {Array} files - Array of file paths
   * @returns {Promise<Array>} Processed file info
   */
  async processDroppedFiles(files) {
    const processed = [];

    for (const file of files) {
      try {
        const filePath = file.path || file;
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath).toLowerCase();

        const fileInfo = {
          path: filePath,
          name: path.basename(filePath),
          size: stats.size,
          extension: ext,
          type: this.getFileType(ext),
          isDirectory: stats.isDirectory(),
          modified: stats.mtime,
          created: stats.birthtime
        };

        // Add preview for images
        if (fileInfo.type === 'image') {
          fileInfo.canPreview = true;
        }

        // Add mime type for common files
        fileInfo.mimeType = this.getMimeType(ext);

        processed.push(fileInfo);
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    return processed;
  }

  /**
   * Get file type category
   * @param {string} extension - File extension
   * @returns {string} File type category
   */
  getFileType(extension) {
    const ext = extension.toLowerCase();
    
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const videoExts = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'];
    const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
    const documentExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];
    const codeExts = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml'];
    const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'];

    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (documentExts.includes(ext)) return 'document';
    if (codeExts.includes(ext)) return 'code';
    if (archiveExts.includes(ext)) return 'archive';

    return 'other';
  }

  /**
   * Get MIME type for file extension
   * @param {string} extension - File extension
   * @returns {string} MIME type
   */
  getMimeType(extension) {
    const mimeTypes = {
      // Images
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
      
      // Videos
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      
      // Audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      
      // Documents
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      
      // Archives
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Register a handler for drag-drop events
   * @param {string} eventType - Event type (files-dropped, text-dropped, url-dropped)
   * @param {Function} handler - Handler function
   * @returns {string} Handler ID for unregistering
   */
  onDrop(eventType, handler) {
    const handlerId = `${eventType}_${Date.now()}_${Math.random()}`;
    
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Map());
    }
    
    this.handlers.get(eventType).set(handlerId, handler);
    
    return handlerId;
  }

  /**
   * Unregister a handler
   * @param {string} eventType - Event type
   * @param {string} handlerId - Handler ID
   */
  offDrop(eventType, handlerId) {
    if (this.handlers.has(eventType)) {
      this.handlers.get(eventType).delete(handlerId);
    }
  }

  /**
   * Notify all registered handlers
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  notifyHandlers(eventType, data) {
    if (this.handlers.has(eventType)) {
      this.handlers.get(eventType).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in drag-drop handler:', error);
        }
      });
    }
  }

  /**
   * Clear all handlers
   */
  clearHandlers() {
    this.handlers.clear();
  }
}

// Create singleton instance
const dragDropManager = new DragDropManager();

module.exports = {
  dragDropManager,
  onDrop: (eventType, handler) => dragDropManager.onDrop(eventType, handler),
  offDrop: (eventType, handlerId) => dragDropManager.offDrop(eventType, handlerId),
  clearHandlers: () => dragDropManager.clearHandlers()
};
