# Clipboard API Manager

A comprehensive clipboard management system for Electron applications, organized into separate modules for better maintainability and functionality.

## Features

- **Text Operations**: Read/write plain text
- **HTML Operations**: Handle HTML content with text extraction
- **Image Operations**: Work with NativeImage, buffers, files, and data URLs
- **RTF Operations**: Rich Text Format support with formatting helpers
- **Bookmark Operations**: URL bookmark management (macOS/Windows)
- **Buffer Operations**: Binary data handling with custom formats
- **Utility Operations**: Advanced clipboard management and monitoring

## Installation

These modules are designed to work within an Electron application. Ensure you have Electron installed and these files are in your project structure.

## Usage

### Basic Usage

```javascript
// Import the main clipboard manager
const { clipboardManager } = require('./electron-api/clipboard');

// Copy text
clipboardManager.writeText('Hello, World!');

// Paste text
const text = clipboardManager.readText();
console.log(text); // 'Hello, World!'

// Check clipboard status
const status = clipboardManager.getStatus();
console.log(status); // { formats: [...], hasText: true, ... }
```

### Individual Module Usage

#### Text Clipboard
```javascript
const { textClipboard } = require('./electron-api/clipboard/clipboard-text');

// Copy and paste text
textClipboard.writeText('Sample text');
const text = textClipboard.readText();

// Check if clipboard has text
if (textClipboard.hasText()) {
  console.log('Clipboard contains text');
}
```

#### HTML Clipboard
```javascript
const { htmlClipboard } = require('./electron-api/clipboard/clipboard-html');

// Copy HTML
htmlClipboard.writeHTML('<b>Bold text</b>');

// Paste HTML and get both HTML and plain text
const { html, text } = htmlClipboard.readBoth();
```

#### Image Clipboard
```javascript
const { imageClipboard } = require('./electron-api/clipboard/clipboard-image');

// Copy image from file
imageClipboard.writeImage('/path/to/image.png');

// Paste image
const image = imageClipboard.readImage();

// Convert to data URL
const dataURL = imageClipboard.imageToDataURL(image);

// Save image to file
imageClipboard.saveImage(image, '/path/to/save.png');
```

#### RTF Clipboard
```javascript
const { rtfClipboard } = require('./electron-api/clipboard/clipboard-rtf');

// Create formatted RTF
const rtfText = rtfClipboard.createBoldRTF('Bold text');
rtfClipboard.writeRTF(rtfText);

// Read RTF
const rtf = rtfClipboard.readRTF();
```

#### Bookmark Clipboard
```javascript
const { bookmarkClipboard } = require('./electron-api/clipboard/clipboard-bookmark');

// Copy bookmark
bookmarkClipboard.writeBookmark('Electron Docs', 'https://electronjs.org');

// Paste bookmark
const { title, url } = bookmarkClipboard.readBookmark();
```

#### Buffer Clipboard
```javascript
const { bufferClipboard } = require('./electron-api/clipboard/clipboard-buffer');

// Write JSON as buffer
bufferClipboard.writeJSON({ key: 'value' });

// Read JSON from buffer
const data = bufferClipboard.readJSON();
```

#### Utils Clipboard
```javascript
const { utilsClipboard } = require('./electron-api/clipboard/clipboard-utils');

// Clear clipboard
utilsClipboard.clear();

// Get all available formats
const formats = utilsClipboard.availableFormats();

// Smart copy (auto-detects format)
utilsClipboard.smartCopy('<b>HTML content</b>'); // Detects HTML

// Smart paste (returns best format)
const content = utilsClipboard.smartPaste(); // Returns HTML if available

// Monitor clipboard changes
const stopMonitoring = utilsClipboard.monitorChanges((change) => {
  console.log('Clipboard changed:', change);
});

// Stop monitoring later
stopMonitoring();
```

## API Reference

### ClipboardManager Class

The main class that provides access to all clipboard operations.

#### Methods

- `readText(type)` / `writeText(text, type)` - Text operations
- `readHTML(type)` / `writeHTML(markup, type)` - HTML operations
- `readImage(type)` / `writeImage(image, type)` - Image operations
- `readRTF(type)` / `writeRTF(text, type)` - RTF operations
- `readBookmark()` / `writeBookmark(title, url, type)` - Bookmark operations
- `readBuffer(format)` / `writeBuffer(format, buffer, type)` - Buffer operations
- `clear(type)` - Clear clipboard
- `availableFormats(type)` - Get available formats
- `has(format, type)` - Check for specific format
- `write(data, type)` - Write multiple formats at once
- `readFindText()` / `writeFindText(text)` - Find text operations (macOS)

### Individual Module Classes

Each module exports both a class instance and direct functions for convenience.

#### TextClipboard
- `readText(type)` / `writeText(text, type)`
- `copy(text, type)` / `paste(type)` - Aliases
- `hasText(type)` - Check for text content

#### HTMLClipboard
- `readHTML(type)` / `writeHTML(markup, type)`
- `copy(markup, type)` / `paste(type)` - Aliases
- `hasHTML(type)` - Check for HTML content
- `htmlToText(html)` - Extract text from HTML
- `readBoth(type)` - Get both HTML and text

#### ImageClipboard
- `readImage(type)` / `writeImage(image, type)`
- `copy(image, type)` / `paste(type)` - Aliases
- `hasImage(type)` - Check for image content
- `imageToBuffer(image, format, options)` - Convert to buffer
- `imageToDataURL(image, format, options)` - Convert to data URL
- `saveImage(image, filePath, format, options)` - Save to file
- `getImageSize(image)` - Get dimensions
- `createFromPath(filePath)` - Create from file
- `createFromBuffer(buffer, options)` - Create from buffer
- `createFromDataURL(dataURL)` - Create from data URL

#### RTFClipboard
- `readRTF(type)` / `writeRTF(text, type)`
- `copy(text, type)` / `paste(type)` - Aliases
- `hasRTF(type)` - Check for RTF content
- `createBoldRTF(text, options)` - Create bold RTF
- `createItalicRTF(text, options)` - Create italic RTF
- `createUnderlineRTF(text, options)` - Create underline RTF
- `createFormattedRTF(text, options)` - Create formatted RTF
- `rtfToText(rtf)` - Extract text from RTF
- `isRTF(text)` - Validate RTF format
- `readBoth(type)` - Get both RTF and text

#### BookmarkClipboard
- `readBookmark()` / `writeBookmark(title, url, type)`
- `copy(title, url, type)` / `paste()` - Aliases
- `hasBookmark()` - Check for bookmark content
- `createBookmark(url, title)` - Create bookmark object
- `writeBookmarkFromURL(url, title, type)` - Write from URL
- `isValidURL(url)` - Validate URL
- `extractDomain(url)` - Extract domain from URL
- `isSupported()` - Check platform support
- `getBookmarkInfo()` - Get detailed bookmark info
- `writeMultipleBookmarks(bookmarks, type)` - Write multiple bookmarks

#### BufferClipboard
- `readBuffer(format)` / `writeBuffer(format, buffer, type)`
- `hasBuffer(format, type)` - Check for buffer format
- `writeTextAsBuffer(text, encoding, type)` - Write text as buffer
- `readTextFromBuffer(encoding, type)` - Read text from buffer
- `writeBinaryData(data, format, type)` - Write binary data
- `readBinaryData(format, type)` - Read binary data
- `writeJSON(data, type)` - Write JSON as buffer
- `readJSON(type)` - Read JSON from buffer
- `writeFile(filePath, mimeType, type)` - Write file data
- `mimeTypeToFormat(mimeType)` - Convert MIME to format
- `formatToMimeType(format)` - Convert format to MIME
- `getBufferInfo(format, type)` - Get buffer information
- `getAvailableBufferFormats(type)` - List buffer formats
- `isSupported()` - Check platform support

#### UtilsClipboard
- `clear(type)` - Clear clipboard
- `availableFormats(type)` - Get available formats
- `has(format, type)` - Check for specific format
- `write(data, type)` - Write multiple formats
- `readFindText()` / `writeFindText(text)` - Find text operations
- `getStatus(type)` - Get clipboard status
- `isEmpty(type)` - Check if empty
- `getPrimaryType(type)` - Get primary content type
- `readAll(type)` - Read all available content
- `smartCopy(content, type)` - Auto-detect format for copying
- `smartPaste(type)` - Auto-detect format for pasting
- `monitorChanges(callback, interval)` - Monitor clipboard changes

## Platform Support

- **Text/HTML/RTF**: All platforms
- **Images**: All platforms
- **Bookmarks**: macOS and Windows only
- **Buffers**: All platforms (experimental)
- **Find Text**: macOS only
- **Selection Clipboard**: Linux only

## Error Handling

All methods include try-catch blocks and return appropriate fallback values on error:
- Text operations return empty string `''`
- Image operations return `null`
- Boolean operations return `false`
- Array operations return empty array `[]`
- Object operations return empty object `{}`

## Examples

### Copying different content types
```javascript
const { clipboardManager } = require('./electron-api/clipboard');

// Copy text
clipboardManager.writeText('Hello World');

// Copy HTML
clipboardManager.writeHTML('<h1>Hello World</h1>');

// Copy image from file
const { imageClipboard } = require('./electron-api/clipboard/clipboard-image');
imageClipboard.writeImage('/path/to/image.png');

// Copy bookmark
clipboardManager.writeBookmark('My Site', 'https://example.com');
```

### Reading clipboard content
```javascript
const { utilsClipboard } = require('./electron-api/clipboard/clipboard-utils');

// Get clipboard status
const status = utilsClipboard.getStatus();
console.log('Clipboard contains:', status);

// Smart paste (gets best available format)
const content = utilsClipboard.smartPaste();
console.log('Pasted content:', content);
```

### Monitoring clipboard changes
```javascript
const { utilsClipboard } = require('./electron-api/clipboard/clipboard-utils');

// Monitor clipboard for changes
const stopMonitoring = utilsClipboard.monitorChanges((change) => {
  console.log('Clipboard changed from', change.oldFormats, 'to', change.newFormats);
});

// Stop monitoring after 30 seconds
setTimeout(() => {
  stopMonitoring();
  console.log('Stopped monitoring clipboard');
}, 30000);
```

## Integration with Electron App

To use these modules in your Electron renderer process, you can expose them through the preload script:

```javascript
// In preload.js
const { contextBridge } = require('electron');
const { clipboardManager } = require('./electron-api/clipboard');

contextBridge.exposeInMainWorld('clipboardAPI', {
  readText: clipboardManager.readText.bind(clipboardManager),
  writeText: clipboardManager.writeText.bind(clipboardManager),
  // ... expose other methods as needed
});
```

Then in your renderer JavaScript:
```javascript
// Access clipboard API
window.clipboardAPI.writeText('Hello from renderer!');
const text = window.clipboardAPI.readText();
```</content>
<parameter name="filePath">c:\Users\yadav\OneDrive\Desktop\sonicplane\buddy\chat-input\electron-api\clipboard\README.md