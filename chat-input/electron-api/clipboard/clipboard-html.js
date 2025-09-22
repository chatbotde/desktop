const { clipboard } = require('electron');

/**
 * Clipboard HTML Operations
 * Handles reading and writing HTML content to/from the system clipboard
 */
class HTMLClipboard {
  /**
   * Read HTML content from the clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {string} The HTML content from the clipboard
   */
  readHTML(type = 'clipboard') {
    try {
      return clipboard.readHTML(type);
    } catch (error) {
      console.error('Error reading HTML from clipboard:', error);
      return '';
    }
  }

  /**
   * Write HTML markup to the clipboard
   * @param {string} markup - The HTML markup to write to the clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  writeHTML(markup, type = 'clipboard') {
    try {
      if (typeof markup !== 'string') {
        markup = String(markup);
      }
      clipboard.writeHTML(markup, type);
      return true;
    } catch (error) {
      console.error('Error writing HTML to clipboard:', error);
      return false;
    }
  }

  /**
   * Copy HTML to clipboard (alias for writeHTML)
   * @param {string} markup - The HTML markup to copy
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  copy(markup, type = 'clipboard') {
    return this.writeHTML(markup, type);
  }

  /**
   * Paste HTML from clipboard (alias for readHTML)
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {string} The HTML content from the clipboard
   */
  paste(type = 'clipboard') {
    return this.readHTML(type);
  }

  /**
   * Check if clipboard contains HTML
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {boolean} True if clipboard contains HTML
   */
  hasHTML(type = 'clipboard') {
    try {
      const formats = clipboard.availableFormats(type);
      return formats.includes('text/html') || formats.includes('public.html');
    } catch (error) {
      console.error('Error checking for HTML in clipboard:', error);
      return false;
    }
  }

  /**
   * Extract plain text from HTML content
   * @param {string} html - HTML content
   * @returns {string} Plain text extracted from HTML
   */
  htmlToText(html) {
    try {
      // Simple HTML to text conversion (basic implementation)
      if (!html) return '';

      // Remove HTML tags
      const text = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Decode HTML entities
      return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
    } catch (error) {
      console.error('Error converting HTML to text:', error);
      return html;
    }
  }

  /**
   * Get both HTML and plain text from clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {object} Object with html and text properties
   */
  readBoth(type = 'clipboard') {
    try {
      const html = this.readHTML(type);
      const text = this.htmlToText(html);
      return { html, text };
    } catch (error) {
      console.error('Error reading both HTML and text from clipboard:', error);
      return { html: '', text: '' };
    }
  }
}

const htmlClipboard = new HTMLClipboard();

module.exports = {
  HTMLClipboard,
  htmlClipboard,

  // Direct exports
  readHTML: htmlClipboard.readHTML.bind(htmlClipboard),
  writeHTML: htmlClipboard.writeHTML.bind(htmlClipboard),
  copy: htmlClipboard.copy.bind(htmlClipboard),
  paste: htmlClipboard.paste.bind(htmlClipboard),
  hasHTML: htmlClipboard.hasHTML.bind(htmlClipboard),
  htmlToText: htmlClipboard.htmlToText.bind(htmlClipboard),
  readBoth: htmlClipboard.readBoth.bind(htmlClipboard)
};