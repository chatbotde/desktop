const { clipboard } = require('electron');

/**
 * Clipboard Buffer Operations
 * Handles reading and writing binary data (buffers) to/from the system clipboard
 * Note: These are experimental APIs and may not be available on all platforms
 */
class BufferClipboard {
  /**
   * Read buffer data from the clipboard
   * @param {string} format - The format identifier (e.g., 'public.utf8-plain-text')
   * @returns {Buffer|null} The buffer data, or null if not available
   */
  readBuffer(format) {
    try {
      if (typeof format !== 'string' || !format.includes('/')) {
        throw new Error('Format must be a valid string with "/" separator (e.g., "public/utf8-plain-text")');
      }

      return clipboard.readBuffer(format);
    } catch (error) {
      console.error('Error reading buffer from clipboard:', error);
      return null;
    }
  }

  /**
   * Write buffer data to the clipboard
   * @param {string} format - The format identifier (e.g., 'public.utf8-plain-text')
   * @param {Buffer} buffer - The buffer data to write
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  writeBuffer(format, buffer, type = 'clipboard') {
    try {
      if (typeof format !== 'string' || !format.includes('/')) {
        throw new Error('Format must be a valid string with "/" separator (e.g., "public/utf8-plain-text")');
      }

      if (!Buffer.isBuffer(buffer)) {
        throw new Error('Data must be a Buffer');
      }

      clipboard.writeBuffer(format, buffer, type);
      return true;
    } catch (error) {
      console.error('Error writing buffer to clipboard:', error);
      return false;
    }
  }

  /**
   * Check if clipboard has a specific buffer format
   * @param {string} format - The format identifier to check
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {boolean} True if the format is available
   */
  hasBuffer(format, type = 'clipboard') {
    try {
      if (typeof format !== 'string' || !format.includes('/')) {
        return false;
      }

      const formats = clipboard.availableFormats(type);
      return formats.includes(format);
    } catch (error) {
      console.error('Error checking buffer format in clipboard:', error);
      return false;
    }
  }

  /**
   * Write text as buffer to clipboard
   * @param {string} text - Text to write as buffer
   * @param {string} encoding - Text encoding (default: 'utf8')
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  writeTextAsBuffer(text, encoding = 'utf8', type = 'clipboard') {
    try {
      if (typeof text !== 'string') {
        text = String(text);
      }

      const buffer = Buffer.from(text, encoding);
      return this.writeBuffer('public.utf8-plain-text', buffer, type);
    } catch (error) {
      console.error('Error writing text as buffer to clipboard:', error);
      return false;
    }
  }

  /**
   * Read text from buffer in clipboard
   * @param {string} encoding - Text encoding (default: 'utf8')
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {string|null} The decoded text, or null if not available
   */
  readTextFromBuffer(encoding = 'utf8', type = 'clipboard') {
    try {
      const buffer = this.readBuffer('public.utf8-plain-text');
      if (buffer) {
        return buffer.toString(encoding);
      }
      return null;
    } catch (error) {
      console.error('Error reading text from buffer in clipboard:', error);
      return null;
    }
  }

  /**
   * Write binary data to clipboard
   * @param {Buffer|ArrayBuffer|Uint8Array} data - Binary data to write
   * @param {string} format - Custom format identifier
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  writeBinaryData(data, format = 'public.binary-data', type = 'clipboard') {
    try {
      let buffer;

      if (Buffer.isBuffer(data)) {
        buffer = data;
      } else if (data instanceof ArrayBuffer) {
        buffer = Buffer.from(data);
      } else if (data instanceof Uint8Array) {
        buffer = Buffer.from(data);
      } else {
        throw new Error('Data must be a Buffer, ArrayBuffer, or Uint8Array');
      }

      return this.writeBuffer(format, buffer, type);
    } catch (error) {
      console.error('Error writing binary data to clipboard:', error);
      return false;
    }
  }

  /**
   * Read binary data from clipboard
   * @param {string} format - Format identifier
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {Buffer|null} The binary data, or null if not available
   */
  readBinaryData(format = 'public.binary-data', type = 'clipboard') {
    try {
      return this.readBuffer(format);
    } catch (error) {
      console.error('Error reading binary data from clipboard:', error);
      return null;
    }
  }

  /**
   * Write JSON data as buffer to clipboard
   * @param {object} data - Object to serialize as JSON
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  writeJSON(data, type = 'clipboard') {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      return this.writeTextAsBuffer(jsonString, 'utf8', type);
    } catch (error) {
      console.error('Error writing JSON to clipboard:', error);
      return false;
    }
  }

  /**
   * Read JSON data from buffer in clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {object|null} The parsed JSON object, or null if not available or invalid
   */
  readJSON(type = 'clipboard') {
    try {
      const text = this.readTextFromBuffer('utf8', type);
      if (text) {
        return JSON.parse(text);
      }
      return null;
    } catch (error) {
      console.error('Error reading JSON from clipboard:', error);
      return null;
    }
  }

  /**
   * Write file data to clipboard
   * @param {string} filePath - Path to the file to read
   * @param {string} mimeType - MIME type of the file
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  writeFile(filePath, mimeType = 'application/octet-stream', type = 'clipboard') {
    try {
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist: ' + filePath);
      }

      const buffer = fs.readFileSync(filePath);
      const format = this.mimeTypeToFormat(mimeType);

      return this.writeBuffer(format, buffer, type);
    } catch (error) {
      console.error('Error writing file to clipboard:', error);
      return false;
    }
  }

  /**
   * Convert MIME type to clipboard format
   * @param {string} mimeType - MIME type
   * @returns {string} Clipboard format identifier
   */
  mimeTypeToFormat(mimeType) {
    const mimeToFormat = {
      'text/plain': 'public.utf8-plain-text',
      'text/html': 'public.html',
      'text/rtf': 'public.rtf',
      'image/png': 'public.png',
      'image/jpeg': 'public.jpeg',
      'image/gif': 'com.compuserve.gif',
      'image/bmp': 'com.microsoft.bmp',
      'application/json': 'public.json',
      'application/xml': 'public.xml'
    };

    return mimeToFormat[mimeType] || 'public.data';
  }

  /**
   * Convert clipboard format to MIME type
   * @param {string} format - Clipboard format identifier
   * @returns {string} MIME type
   */
  formatToMimeType(format) {
    const formatToMime = {
      'public.utf8-plain-text': 'text/plain',
      'public.html': 'text/html',
      'public.rtf': 'text/rtf',
      'public.png': 'image/png',
      'public.jpeg': 'image/jpeg',
      'com.compuserve.gif': 'image/gif',
      'com.microsoft.bmp': 'image/bmp',
      'public.json': 'application/json',
      'public.xml': 'application/xml'
    };

    return formatToMime[format] || 'application/octet-stream';
  }

  /**
   * Get buffer information
   * @param {string} format - Format identifier
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {object} Buffer information
   */
  getBufferInfo(format, type = 'clipboard') {
    try {
      const hasBuffer = this.hasBuffer(format, type);
      const buffer = hasBuffer ? this.readBuffer(format) : null;

      return {
        format,
        type,
        available: hasBuffer,
        size: buffer ? buffer.length : 0,
        mimeType: this.formatToMimeType(format)
      };
    } catch (error) {
      console.error('Error getting buffer info:', error);
      return {
        format,
        type,
        available: false,
        size: 0,
        mimeType: 'application/octet-stream',
        error: error.message
      };
    }
  }

  /**
   * List all available buffer formats
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {string[]} Array of buffer format identifiers
   */
  getAvailableBufferFormats(type = 'clipboard') {
    try {
      const allFormats = clipboard.availableFormats(type);
      // Filter for formats that typically contain buffer data
      return allFormats.filter(format =>
        format.includes('/') &&
        !format.includes('text/') &&
        !format.includes('image/') &&
        !format.includes('video/') &&
        !format.includes('audio/')
      );
    } catch (error) {
      console.error('Error getting available buffer formats:', error);
      return [];
    }
  }

  /**
   * Check if buffer operations are supported on current platform
   * @returns {boolean} True if buffer operations are supported
   */
  isSupported() {
    try {
      // Try a simple buffer operation to test support
      const testBuffer = Buffer.from('test', 'utf8');
      this.writeBuffer('public.test', testBuffer);
      const readBuffer = this.readBuffer('public.test');
      return readBuffer && readBuffer.equals(testBuffer);
    } catch (error) {
      return false;
    }
  }
}

const bufferClipboard = new BufferClipboard();

module.exports = {
  BufferClipboard,
  bufferClipboard,

  // Direct exports
  readBuffer: bufferClipboard.readBuffer.bind(bufferClipboard),
  writeBuffer: bufferClipboard.writeBuffer.bind(bufferClipboard),
  hasBuffer: bufferClipboard.hasBuffer.bind(bufferClipboard),
  writeTextAsBuffer: bufferClipboard.writeTextAsBuffer.bind(bufferClipboard),
  readTextFromBuffer: bufferClipboard.readTextFromBuffer.bind(bufferClipboard),
  writeBinaryData: bufferClipboard.writeBinaryData.bind(bufferClipboard),
  readBinaryData: bufferClipboard.readBinaryData.bind(bufferClipboard),
  writeJSON: bufferClipboard.writeJSON.bind(bufferClipboard),
  readJSON: bufferClipboard.readJSON.bind(bufferClipboard),
  writeFile: bufferClipboard.writeFile.bind(bufferClipboard),
  mimeTypeToFormat: bufferClipboard.mimeTypeToFormat.bind(bufferClipboard),
  formatToMimeType: bufferClipboard.formatToMimeType.bind(bufferClipboard),
  getBufferInfo: bufferClipboard.getBufferInfo.bind(bufferClipboard),
  getAvailableBufferFormats: bufferClipboard.getAvailableBufferFormats.bind(bufferClipboard),
  isSupported: bufferClipboard.isSupported.bind(bufferClipboard)
};