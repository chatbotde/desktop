const { clipboard } = require('electron');

/**
 * Clipboard RTF Operations
 * Handles reading and writing RTF (Rich Text Format) content to/from the system clipboard
 */
class RTFClipboard {
  /**
   * Read RTF content from the clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {string} The RTF content from the clipboard
   */
  readRTF(type = 'clipboard') {
    try {
      return clipboard.readRTF(type);
    } catch (error) {
      console.error('Error reading RTF from clipboard:', error);
      return '';
    }
  }

  /**
   * Write RTF text to the clipboard
   * @param {string} text - The RTF text to write to the clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  writeRTF(text, type = 'clipboard') {
    try {
      if (typeof text !== 'string') {
        text = String(text);
      }
      clipboard.writeRTF(text, type);
      return true;
    } catch (error) {
      console.error('Error writing RTF to clipboard:', error);
      return false;
    }
  }

  /**
   * Copy RTF to clipboard (alias for writeRTF)
   * @param {string} text - The RTF text to copy
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  copy(text, type = 'clipboard') {
    return this.writeRTF(text, type);
  }

  /**
   * Paste RTF from clipboard (alias for readRTF)
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {string} The RTF content from the clipboard
   */
  paste(type = 'clipboard') {
    return this.readRTF(type);
  }

  /**
   * Check if clipboard contains RTF
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {boolean} True if clipboard contains RTF
   */
  hasRTF(type = 'clipboard') {
    try {
      const formats = clipboard.availableFormats(type);
      return formats.includes('text/rtf') || formats.includes('public.rtf') || formats.includes('com.apple.flat-rtfd');
    } catch (error) {
      console.error('Error checking for RTF in clipboard:', error);
      return false;
    }
  }

  /**
   * Create basic RTF text with bold formatting
   * @param {string} text - Plain text to format
   * @param {object} options - Formatting options
   * @returns {string} RTF formatted text
   */
  createBoldRTF(text, options = {}) {
    const fontSize = options.fontSize || 12;
    const fontName = options.fontName || 'Arial';

    return `{\\rtf1\\ansi\\ansicpg1252\\cocoartf2639\\cocoasubrtf540
{\\fonttbl\\f0\\${fontName};}
{\\colortbl;\\red255\\green255\\blue255;}
{\\*\\expandedcolortbl;;}
\\margl1440\\margr1440\\vieww10800\\viewh8400\\viewkind0
\\pard\\tx720\\tx1440\\tx2160\\tx2880\\tx3600\\tx4320\\tx5040\\tx5760\\tx6480\\tx7200\\tx7920\\tx8640\\pardirnatural\\partightenfactor0

\\f0\\fs${fontSize * 2} \\cf0 ${text}}`;
  }

  /**
   * Create RTF text with italic formatting
   * @param {string} text - Plain text to format
   * @param {object} options - Formatting options
   * @returns {string} RTF formatted text
   */
  createItalicRTF(text, options = {}) {
    const fontSize = options.fontSize || 12;
    const fontName = options.fontName || 'Arial';

    return `{\\rtf1\\ansi\\ansicpg1252\\cocoartf2639\\cocoasubrtf540
{\\fonttbl\\f0\\${fontName};}
{\\colortbl;\\red255\\green255\\blue255;}
{\\*\\expandedcolortbl;;}
\\margl1440\\margr1440\\vieww10800\\viewh8400\\viewkind0
\\pard\\tx720\\tx1440\\tx2160\\tx2880\\tx3600\\tx4320\\tx5040\\tx5760\\tx6480\\tx7200\\tx7920\\tx8640\\pardirnatural\\partightenfactor0

\\f0\\i\\fs${fontSize * 2} \\cf0 ${text}}`;
  }

  /**
   * Create RTF text with underline formatting
   * @param {string} text - Plain text to format
   * @param {object} options - Formatting options
   * @returns {string} RTF formatted text
   */
  createUnderlineRTF(text, options = {}) {
    const fontSize = options.fontSize || 12;
    const fontName = options.fontName || 'Arial';

    return `{\\rtf1\\ansi\\ansicpg1252\\cocoartf2639\\cocoasubrtf540
{\\fonttbl\\f0\\${fontName};}
{\\colortbl;\\red255\\green255\\blue255;}
{\\*\\expandedcolortbl;;}
\\margl1440\\margr1440\\vieww10800\\viewh8400\\viewkind0
\\pard\\tx720\\tx1440\\tx2160\\tx2880\\tx3600\\tx4320\\tx5040\\tx5760\\tx6480\\tx7200\\tx7920\\tx8640\\pardirnatural\\partightenfactor0

\\f0\\ul\\fs${fontSize * 2} \\cf0 ${text}}`;
  }

  /**
   * Create RTF text with multiple formatting options
   * @param {string} text - Plain text to format
   * @param {object} options - Formatting options (bold, italic, underline, fontSize, fontName, color)
   * @returns {string} RTF formatted text
   */
  createFormattedRTF(text, options = {}) {
    const {
      bold = false,
      italic = false,
      underline = false,
      fontSize = 12,
      fontName = 'Arial',
      color = { r: 0, g: 0, b: 0 }
    } = options;

    let formatCodes = '';

    if (bold) formatCodes += '\\b';
    if (italic) formatCodes += '\\i';
    if (underline) formatCodes += '\\ul';

    const colorTable = `{\\colortbl;\\red${color.r}\\green${color.g}\\blue${color.b};}`;

    return `{\\rtf1\\ansi\\ansicpg1252\\cocoartf2639\\cocoasubrtf540
{\\fonttbl\\f0\\${fontName};}
${colorTable}
{\\*\\expandedcolortbl;;\\cssrgb\\c0\\c0\\c0;}
\\margl1440\\margr1440\\vieww10800\\viewh8400\\viewkind0
\\pard\\tx720\\tx1440\\tx2160\\tx2880\\tx3600\\tx4320\\tx5040\\tx5760\\tx6480\\tx7200\\tx7920\\tx8640\\pardirnatural\\partightenfactor0

\\f0${formatCodes}\\fs${fontSize * 2} \\cf1 ${text}}`;
  }

  /**
   * Extract plain text from RTF content
   * @param {string} rtf - RTF content
   * @returns {string} Plain text extracted from RTF
   */
  rtfToText(rtf) {
    try {
      if (!rtf || typeof rtf !== 'string') return '';

      // Basic RTF to text conversion (removes RTF control codes)
      let text = rtf;

      // Remove RTF header
      text = text.replace(/\{\\rtf[^}]*\}/g, '');

      // Remove control words (basic implementation)
      text = text.replace(/\\[a-z]+\d*/g, '');

      // Remove braces and other RTF artifacts
      text = text.replace(/[{}]/g, '');

      // Clean up whitespace
      text = text.replace(/\s+/g, ' ').trim();

      return text;
    } catch (error) {
      console.error('Error converting RTF to text:', error);
      return rtf;
    }
  }

  /**
   * Validate if string is RTF format
   * @param {string} text - Text to validate
   * @returns {boolean} True if text appears to be RTF
   */
  isRTF(text) {
    return typeof text === 'string' && text.startsWith('{\\rtf');
  }

  /**
   * Get both RTF and plain text from clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {object} Object with rtf and text properties
   */
  readBoth(type = 'clipboard') {
    try {
      const rtf = this.readRTF(type);
      const text = this.rtfToText(rtf);
      return { rtf, text };
    } catch (error) {
      console.error('Error reading both RTF and text from clipboard:', error);
      return { rtf: '', text: '' };
    }
  }
}

const rtfClipboard = new RTFClipboard();

module.exports = {
  RTFClipboard,
  rtfClipboard,

  // Direct exports
  readRTF: rtfClipboard.readRTF.bind(rtfClipboard),
  writeRTF: rtfClipboard.writeRTF.bind(rtfClipboard),
  copy: rtfClipboard.copy.bind(rtfClipboard),
  paste: rtfClipboard.paste.bind(rtfClipboard),
  hasRTF: rtfClipboard.hasRTF.bind(rtfClipboard),
  createBoldRTF: rtfClipboard.createBoldRTF.bind(rtfClipboard),
  createItalicRTF: rtfClipboard.createItalicRTF.bind(rtfClipboard),
  createUnderlineRTF: rtfClipboard.createUnderlineRTF.bind(rtfClipboard),
  createFormattedRTF: rtfClipboard.createFormattedRTF.bind(rtfClipboard),
  rtfToText: rtfClipboard.rtfToText.bind(rtfClipboard),
  isRTF: rtfClipboard.isRTF.bind(rtfClipboard),
  readBoth: rtfClipboard.readBoth.bind(rtfClipboard)
};