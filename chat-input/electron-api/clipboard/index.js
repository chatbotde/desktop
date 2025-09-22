const { clipboard } = require('electron');

// Import all clipboard modules
const textClipboard = require('./clipboard-text');
const htmlClipboard = require('./clipboard-html');
const imageClipboard = require('./clipboard-image');
const rtfClipboard = require('./clipboard-rtf');
const bookmarkClipboard = require('./clipboard-bookmark');
const bufferClipboard = require('./clipboard-buffer');
const utilsClipboard = require('./clipboard-utils');

/**
 * Clipboard API Manager
 * Provides organized access to all clipboard operations
 */
class ClipboardManager {
  constructor() {
    this.clipboard = clipboard;
  }

  // Text operations
  readText(type = 'clipboard') {
    return textClipboard.readText(type);
  }

  writeText(text, type = 'clipboard') {
    return textClipboard.writeText(text, type);
  }

  // HTML operations
  readHTML(type = 'clipboard') {
    return htmlClipboard.readHTML(type);
  }

  writeHTML(markup, type = 'clipboard') {
    return htmlClipboard.writeHTML(markup, type);
  }

  // Image operations
  readImage(type = 'clipboard') {
    return imageClipboard.readImage(type);
  }

  writeImage(image, type = 'clipboard') {
    return imageClipboard.writeImage(image, type);
  }

  // RTF operations
  readRTF(type = 'clipboard') {
    return rtfClipboard.readRTF(type);
  }

  writeRTF(text, type = 'clipboard') {
    return rtfClipboard.writeRTF(text, type);
  }

  // Bookmark operations
  readBookmark() {
    return bookmarkClipboard.readBookmark();
  }

  writeBookmark(title, url, type = 'clipboard') {
    return bookmarkClipboard.writeBookmark(title, url, type);
  }

  // Buffer operations
  readBuffer(format) {
    return bufferClipboard.readBuffer(format);
  }

  writeBuffer(format, buffer, type = 'clipboard') {
    return bufferClipboard.writeBuffer(format, buffer, type);
  }

  // Utility operations
  clear(type = 'clipboard') {
    return utilsClipboard.clear(type);
  }

  availableFormats(type = 'clipboard') {
    return utilsClipboard.availableFormats(type);
  }

  has(format, type = 'clipboard') {
    return utilsClipboard.has(format, type);
  }

  // Advanced write operations
  write(data, type = 'clipboard') {
    return utilsClipboard.write(data, type);
  }

  // Find text operations (macOS only)
  readFindText() {
    return utilsClipboard.readFindText();
  }

  writeFindText(text) {
    return utilsClipboard.writeFindText(text);
  }
}

// Create singleton instance
const clipboardManager = new ClipboardManager();

// Export both the class and the instance
module.exports = {
  ClipboardManager,
  clipboardManager,

  // Direct exports for convenience
  readText: clipboardManager.readText.bind(clipboardManager),
  writeText: clipboardManager.writeText.bind(clipboardManager),
  readHTML: clipboardManager.readHTML.bind(clipboardManager),
  writeHTML: clipboardManager.writeHTML.bind(clipboardManager),
  readImage: clipboardManager.readImage.bind(clipboardManager),
  writeImage: clipboardManager.writeImage.bind(clipboardManager),
  readRTF: clipboardManager.readRTF.bind(clipboardManager),
  writeRTF: clipboardManager.writeRTF.bind(clipboardManager),
  readBookmark: clipboardManager.readBookmark.bind(clipboardManager),
  writeBookmark: clipboardManager.writeBookmark.bind(clipboardManager),
  readBuffer: clipboardManager.readBuffer.bind(clipboardManager),
  writeBuffer: clipboardManager.writeBuffer.bind(clipboardManager),
  clear: clipboardManager.clear.bind(clipboardManager),
  availableFormats: clipboardManager.availableFormats.bind(clipboardManager),
  has: clipboardManager.has.bind(clipboardManager),
  write: clipboardManager.write.bind(clipboardManager),
  readFindText: clipboardManager.readFindText.bind(clipboardManager),
  writeFindText: clipboardManager.writeFindText.bind(clipboardManager)
};