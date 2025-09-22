const { clipboard } = require('electron');

/**
 * Clipboard Bookmark Operations
 * Handles reading and writing bookmark (URL) content to/from the system clipboard
 * Note: Bookmarks are supported on macOS and Windows only
 */
class BookmarkClipboard {
  /**
   * Read bookmark from the clipboard
   * @returns {object} Object with title and url properties, or empty strings if unavailable
   */
  readBookmark() {
    try {
      return clipboard.readBookmark();
    } catch (error) {
      console.error('Error reading bookmark from clipboard:', error);
      return { title: '', url: '' };
    }
  }

  /**
   * Write bookmark to the clipboard
   * @param {string} title - The title of the bookmark (unused on Windows)
   * @param {string} url - The URL of the bookmark
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  writeBookmark(title, url, type = 'clipboard') {
    try {
      if (typeof title !== 'string') {
        title = String(title);
      }
      if (typeof url !== 'string') {
        url = String(url);
      }

      clipboard.writeBookmark(title, url, type);
      return true;
    } catch (error) {
      console.error('Error writing bookmark to clipboard:', error);
      return false;
    }
  }

  /**
   * Copy bookmark to clipboard (alias for writeBookmark)
   * @param {string} title - The title of the bookmark
   * @param {string} url - The URL of the bookmark
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  copy(title, url, type = 'clipboard') {
    return this.writeBookmark(title, url, type);
  }

  /**
   * Paste bookmark from clipboard (alias for readBookmark)
   * @returns {object} Object with title and url properties
   */
  paste() {
    return this.readBookmark();
  }

  /**
   * Check if clipboard contains a bookmark
   * @returns {boolean} True if clipboard contains a bookmark
   */
  hasBookmark() {
    try {
      const bookmark = this.readBookmark();
      return bookmark.url && bookmark.url.trim() !== '';
    } catch (error) {
      console.error('Error checking for bookmark in clipboard:', error);
      return false;
    }
  }

  /**
   * Create bookmark from URL string
   * @param {string} url - The URL to create bookmark from
   * @param {string} title - Optional title, will be extracted from URL if not provided
   * @returns {object} Bookmark object with title and url
   */
  createBookmark(url, title = null) {
    try {
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error('Valid URL is required');
      }

      // Ensure URL has protocol
      if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
      }

      // Generate title if not provided
      if (!title) {
        try {
          const urlObj = new URL(url);
          title = urlObj.hostname.replace(/^www\./, '');
        } catch (error) {
          title = url;
        }
      }

      return { title, url };
    } catch (error) {
      console.error('Error creating bookmark:', error);
      return { title: '', url: '' };
    }
  }

  /**
   * Write bookmark from URL string
   * @param {string} url - The URL to write as bookmark
   * @param {string} title - Optional title
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {boolean} True if successful
   */
  writeBookmarkFromURL(url, title = null, type = 'clipboard') {
    try {
      const bookmark = this.createBookmark(url, title);
      if (bookmark.url) {
        return this.writeBookmark(bookmark.title, bookmark.url, type);
      }
      return false;
    } catch (error) {
      console.error('Error writing bookmark from URL:', error);
      return false;
    }
  }

  /**
   * Validate if string is a valid URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is valid
   */
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL to extract domain from
   * @returns {string} Domain name or empty string on error
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if platform supports bookmarks
   * @returns {boolean} True if current platform supports bookmarks
   */
  isSupported() {
    return process.platform === 'darwin' || process.platform === 'win32';
  }

  /**
   * Get bookmark info including validation
   * @returns {object} Bookmark info with validation status
   */
  getBookmarkInfo() {
    try {
      const bookmark = this.readBookmark();
      const isValid = this.isValidURL(bookmark.url);
      const domain = isValid ? this.extractDomain(bookmark.url) : '';

      return {
        title: bookmark.title,
        url: bookmark.url,
        isValid,
        domain,
        isSupported: this.isSupported()
      };
    } catch (error) {
      console.error('Error getting bookmark info:', error);
      return {
        title: '',
        url: '',
        isValid: false,
        domain: '',
        isSupported: this.isSupported()
      };
    }
  }

  /**
   * Write multiple bookmarks to clipboard as text
   * @param {Array} bookmarks - Array of bookmark objects with title and url
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {boolean} True if successful
   */
  writeMultipleBookmarks(bookmarks, type = 'clipboard') {
    try {
      if (!Array.isArray(bookmarks)) {
        throw new Error('Bookmarks must be an array');
      }

      // Create formatted text with multiple bookmarks
      const text = bookmarks
        .filter(bookmark => bookmark.url)
        .map(bookmark => `${bookmark.title || 'Untitled'}: ${bookmark.url}`)
        .join('\n');

      if (text) {
        // Use the text clipboard to write multiple bookmarks
        const { clipboard: textClipboard } = require('./clipboard-text');
        return textClipboard.writeText(text, type);
      }

      return false;
    } catch (error) {
      console.error('Error writing multiple bookmarks:', error);
      return false;
    }
  }
}

const bookmarkClipboard = new BookmarkClipboard();

module.exports = {
  BookmarkClipboard,
  bookmarkClipboard,

  // Direct exports
  readBookmark: bookmarkClipboard.readBookmark.bind(bookmarkClipboard),
  writeBookmark: bookmarkClipboard.writeBookmark.bind(bookmarkClipboard),
  copy: bookmarkClipboard.copy.bind(bookmarkClipboard),
  paste: bookmarkClipboard.paste.bind(bookmarkClipboard),
  hasBookmark: bookmarkClipboard.hasBookmark.bind(bookmarkClipboard),
  createBookmark: bookmarkClipboard.createBookmark.bind(bookmarkClipboard),
  writeBookmarkFromURL: bookmarkClipboard.writeBookmarkFromURL.bind(bookmarkClipboard),
  isValidURL: bookmarkClipboard.isValidURL.bind(bookmarkClipboard),
  extractDomain: bookmarkClipboard.extractDomain.bind(bookmarkClipboard),
  isSupported: bookmarkClipboard.isSupported.bind(bookmarkClipboard),
  getBookmarkInfo: bookmarkClipboard.getBookmarkInfo.bind(bookmarkClipboard),
  writeMultipleBookmarks: bookmarkClipboard.writeMultipleBookmarks.bind(bookmarkClipboard)
};