const { clipboard } = require('electron');

/**
 * Clipboard Text Operations
 * Handles reading and writing plain text to/from the system clipboard
 */
class TextClipboard {
  /**
   * Read plain text from the clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {string} The text content from the clipboard
   */
  readText(type = 'clipboard') {
    try {
      return clipboard.readText(type);
    } catch (error) {
      console.error('Error reading text from clipboard:', error);
      return '';
    }
  }

  /**
   * Write plain text to the clipboard
   * @param {string} text - The text to write to the clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  writeText(text, type = 'clipboard') {
    try {
      if (typeof text !== 'string') {
        text = String(text);
      }
      clipboard.writeText(text, type);
      return true;
    } catch (error) {
      console.error('Error writing text to clipboard:', error);
      return false;
    }
  }

  /**
   * Copy text to clipboard (alias for writeText)
   * @param {string} text - The text to copy
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  copy(text, type = 'clipboard') {
    return this.writeText(text, type);
  }

  /**
   * Paste text from clipboard (alias for readText)
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {string} The text content from the clipboard
   */
  paste(type = 'clipboard') {
    return this.readText(type);
  }

  /**
   * Check if clipboard contains text
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {boolean} True if clipboard contains text
   */
  hasText(type = 'clipboard') {
    try {
      const formats = clipboard.availableFormats(type);
      return formats.includes('text/plain') || formats.includes('public.utf8-plain-text');
    } catch (error) {
      console.error('Error checking for text in clipboard:', error);
      return false;
    }
  }
}

const textClipboard = new TextClipboard();

module.exports = {
  TextClipboard,
  textClipboard,

  // Direct exports
  readText: textClipboard.readText.bind(textClipboard),
  writeText: textClipboard.writeText.bind(textClipboard),
  copy: textClipboard.copy.bind(textClipboard),
  paste: textClipboard.paste.bind(textClipboard),
  hasText: textClipboard.hasText.bind(textClipboard)
};