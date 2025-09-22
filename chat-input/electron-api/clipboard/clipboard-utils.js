const { clipboard } = require('electron');

/**
 * Clipboard Utility Operations
 * Provides utility functions for clipboard management and advanced operations
 */
class UtilsClipboard {
  /**
   * Clear the clipboard content
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  clear(type = 'clipboard') {
    try {
      clipboard.clear(type);
      return true;
    } catch (error) {
      console.error('Error clearing clipboard:', error);
      return false;
    }
  }

  /**
   * Get all available formats in the clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {string[]} Array of available format strings
   */
  availableFormats(type = 'clipboard') {
    try {
      return clipboard.availableFormats(type);
    } catch (error) {
      console.error('Error getting available formats:', error);
      return [];
    }
  }

  /**
   * Check if clipboard has a specific format
   * @param {string} format - The format to check for
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {boolean} True if the format is available
   */
  has(format, type = 'clipboard') {
    try {
      return clipboard.has(format, type);
    } catch (error) {
      console.error('Error checking clipboard format:', error);
      return false;
    }
  }

  /**
   * Write multiple data types to clipboard at once
   * @param {object} data - Object containing data to write
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  write(data, type = 'clipboard') {
    try {
      clipboard.write(data, type);
      return true;
    } catch (error) {
      console.error('Error writing data to clipboard:', error);
      return false;
    }
  }

  /**
   * Read find text from clipboard (macOS only)
   * @returns {string} The find text content
   */
  readFindText() {
    try {
      return clipboard.readFindText();
    } catch (error) {
      console.error('Error reading find text from clipboard:', error);
      return '';
    }
  }

  /**
   * Write find text to clipboard (macOS only)
   * @param {string} text - The find text to write
   */
  writeFindText(text) {
    try {
      if (typeof text !== 'string') {
        text = String(text);
      }
      clipboard.writeFindText(text);
      return true;
    } catch (error) {
      console.error('Error writing find text to clipboard:', error);
      return false;
    }
  }

  /**
   * Get clipboard status information
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {object} Status information about the clipboard
   */
  getStatus(type = 'clipboard') {
    try {
      const formats = this.availableFormats(type);
      const hasText = formats.includes('text/plain') || formats.includes('public.utf8-plain-text');
      const hasHTML = formats.includes('text/html') || formats.includes('public.html');
      const hasRTF = formats.includes('text/rtf') || formats.includes('public.rtf');
      const hasImage = formats.some(format =>
        format.includes('image') ||
        format.includes('png') ||
        format.includes('jpeg') ||
        format.includes('jpg') ||
        format.includes('gif') ||
        format.includes('bmp') ||
        format.includes('tiff')
      );

      return {
        formats,
        hasText,
        hasHTML,
        hasRTF,
        hasImage,
        isEmpty: formats.length === 0,
        type
      };
    } catch (error) {
      console.error('Error getting clipboard status:', error);
      return {
        formats: [],
        hasText: false,
        hasHTML: false,
        hasRTF: false,
        hasImage: false,
        isEmpty: true,
        type,
        error: error.message
      };
    }
  }

  /**
   * Check if clipboard is empty
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {boolean} True if clipboard is empty
   */
  isEmpty(type = 'clipboard') {
    try {
      const formats = this.availableFormats(type);
      return formats.length === 0;
    } catch (error) {
      console.error('Error checking if clipboard is empty:', error);
      return true;
    }
  }

  /**
   * Get the primary content type of the clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {string} Primary content type ('text', 'html', 'image', 'rtf', 'unknown')
   */
  getPrimaryType(type = 'clipboard') {
    try {
      const status = this.getStatus(type);

      if (status.hasImage) return 'image';
      if (status.hasHTML) return 'html';
      if (status.hasRTF) return 'rtf';
      if (status.hasText) return 'text';

      return 'unknown';
    } catch (error) {
      console.error('Error getting primary clipboard type:', error);
      return 'unknown';
    }
  }

  /**
   * Read clipboard content based on available formats
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {object} Object containing all readable content
   */
  readAll(type = 'clipboard') {
    try {
      const status = this.getStatus(type);
      const result = {
        type,
        formats: status.formats,
        primaryType: status.primaryType,
        content: {}
      };

      // Try to read different content types
      if (status.hasText) {
        try {
          result.content.text = clipboard.readText(type);
        } catch (e) {
          result.content.text = '';
        }
      }

      if (status.hasHTML) {
        try {
          result.content.html = clipboard.readHTML(type);
        } catch (e) {
          result.content.html = '';
        }
      }

      if (status.hasRTF) {
        try {
          result.content.rtf = clipboard.readRTF(type);
        } catch (e) {
          result.content.rtf = '';
        }
      }

      if (status.hasImage) {
        try {
          result.content.image = clipboard.readImage(type);
        } catch (e) {
          result.content.image = null;
        }
      }

      // Try to read bookmark (macOS/Windows)
      try {
        const bookmark = clipboard.readBookmark();
        if (bookmark.url) {
          result.content.bookmark = bookmark;
        }
      } catch (e) {
        // Bookmark not supported or not available
      }

      return result;
    } catch (error) {
      console.error('Error reading all clipboard content:', error);
      return {
        type,
        formats: [],
        primaryType: 'unknown',
        content: {},
        error: error.message
      };
    }
  }

  /**
   * Copy content with automatic format detection
   * @param {*} content - Content to copy (string, object, etc.)
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {boolean} True if successful
   */
  smartCopy(content, type = 'clipboard') {
    try {
      if (typeof content === 'string') {
        // Check if it's HTML
        if (content.includes('<') && content.includes('>')) {
          return clipboard.writeHTML(content, type);
        }
        // Check if it's RTF
        else if (content.startsWith('{\\rtf')) {
          return clipboard.writeRTF(content, type);
        }
        // Default to text
        else {
          return clipboard.writeText(content, type);
        }
      } else if (typeof content === 'object' && content !== null) {
        // Handle object with multiple formats
        if (content.text || content.html || content.image || content.rtf || content.bookmark) {
          return this.write(content, type);
        }
        // Try to convert object to string
        else {
          return clipboard.writeText(JSON.stringify(content, null, 2), type);
        }
      } else {
        // Convert to string
        return clipboard.writeText(String(content), type);
      }
    } catch (error) {
      console.error('Error in smart copy:', error);
      return false;
    }
  }

  /**
   * Paste content with automatic format detection
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {*} The pasted content in the most appropriate format
   */
  smartPaste(type = 'clipboard') {
    try {
      const status = this.getStatus(type);

      // Return content in order of preference
      if (status.hasImage) {
        return clipboard.readImage(type);
      } else if (status.hasHTML) {
        return clipboard.readHTML(type);
      } else if (status.hasRTF) {
        return clipboard.readRTF(type);
      } else if (status.hasText) {
        return clipboard.readText(type);
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error in smart paste:', error);
      return null;
    }
  }

  /**
   * Monitor clipboard changes (basic implementation)
   * @param {function} callback - Function to call when clipboard changes
   * @param {number} interval - Check interval in milliseconds
   * @returns {function} Function to stop monitoring
   */
  monitorChanges(callback, interval = 1000) {
    let lastFormats = this.availableFormats();
    let isMonitoring = true;

    const checkChanges = () => {
      if (!isMonitoring) return;

      try {
        const currentFormats = this.availableFormats();
        const formatsChanged = JSON.stringify(lastFormats.sort()) !== JSON.stringify(currentFormats.sort());

        if (formatsChanged) {
          const oldFormats = lastFormats;
          lastFormats = currentFormats;

          callback({
            oldFormats,
            newFormats: currentFormats,
            changed: formatsChanged
          });
        }
      } catch (error) {
        console.error('Error monitoring clipboard changes:', error);
      }

      if (isMonitoring) {
        setTimeout(checkChanges, interval);
      }
    };

    // Start monitoring
    setTimeout(checkChanges, interval);

    // Return stop function
    return () => {
      isMonitoring = false;
    };
  }
}

const utilsClipboard = new UtilsClipboard();

module.exports = {
  UtilsClipboard,
  utilsClipboard,

  // Direct exports
  clear: utilsClipboard.clear.bind(utilsClipboard),
  availableFormats: utilsClipboard.availableFormats.bind(utilsClipboard),
  has: utilsClipboard.has.bind(utilsClipboard),
  write: utilsClipboard.write.bind(utilsClipboard),
  readFindText: utilsClipboard.readFindText.bind(utilsClipboard),
  writeFindText: utilsClipboard.writeFindText.bind(utilsClipboard),
  getStatus: utilsClipboard.getStatus.bind(utilsClipboard),
  isEmpty: utilsClipboard.isEmpty.bind(utilsClipboard),
  getPrimaryType: utilsClipboard.getPrimaryType.bind(utilsClipboard),
  readAll: utilsClipboard.readAll.bind(utilsClipboard),
  smartCopy: utilsClipboard.smartCopy.bind(utilsClipboard),
  smartPaste: utilsClipboard.smartPaste.bind(utilsClipboard),
  monitorChanges: utilsClipboard.monitorChanges.bind(utilsClipboard)
};