# Drag & Drop API

Native drag and drop functionality for Electron applications with automatic file processing and visual feedback.

## Features

- 🎯 Drag files, text, and URLs into your app
- 📁 Automatic file metadata extraction
- 🎨 Visual drag-over feedback
- 🎪 Multiple drop zones support
- 🔄 File type detection
- 📊 MIME type identification
- 🎨 Built-in styling

## Quick Start

### 1. Setup in Main Process

```javascript
// main.js
const { app } = require('electron');
const dragDrop = require('./electron-api/drag-drop');

// Register handlers
dragDrop.onDrop('files-dropped', (data) => {
  console.log('Files dropped:', data.files);
  console.log('Drop zone:', data.dropZone);
  console.log('Window ID:', data.windowId);
});

dragDrop.onDrop('text-dropped', (data) => {
  console.log('Text dropped:', data.text);
});

dragDrop.onDrop('url-dropped', (data) => {
  console.log('URL dropped:', data.url);
});
```

### 2. Setup Preload Script

```javascript
// preload.js
require('./electron-api/drag-drop/preload');
```

### 3. Add Styles to HTML

```html
<!-- In your HTML file -->
<link rel="stylesheet" href="./electron-api/drag-drop/styles.css">
```

### 4. Use in Renderer

```javascript
// renderer.js
// Listen for dropped files
const unsubscribe = window.dragDrop.onFilesDropped((files) => {
  files.forEach(file => {
    console.log('File:', file.name);
    console.log('Type:', file.type);
    console.log('Size:', file.size);
    console.log('Path:', file.path);
  });
});

// Clean up listener when done
// unsubscribe();
```

## API Reference

### Main Process

#### `onDrop(eventType, handler)`
Register a handler for drag-drop events.

**Event Types:**
- `'files-dropped'` - Files were dropped
- `'text-dropped'` - Text was dropped
- `'url-dropped'` - URL was dropped

```javascript
const dragDrop = require('./electron-api/drag-drop');

const handlerId = dragDrop.onDrop('files-dropped', (data) => {
  console.log('Files:', data.files);
  console.log('Drop zone:', data.dropZone);
  console.log('Window ID:', data.windowId);
});

// Returns handler ID for cleanup
```

**File Data Structure:**
```javascript
{
  path: '/path/to/file.jpg',
  name: 'file.jpg',
  size: 102400,
  extension: '.jpg',
  type: 'image',          // category: image, video, audio, document, code, archive, other
  mimeType: 'image/jpeg',
  isDirectory: false,
  canPreview: true,       // only for images
  modified: Date,
  created: Date
}
```

#### `offDrop(eventType, handlerId)`
Unregister a handler.

```javascript
dragDrop.offDrop('files-dropped', handlerId);
```

#### `clearHandlers()`
Clear all registered handlers.

```javascript
dragDrop.clearHandlers();
```

### Renderer Process

#### `window.dragDrop.onFilesDropped(callback)`
Listen for dropped files in renderer.

```javascript
const unsubscribe = window.dragDrop.onFilesDropped((files) => {
  files.forEach(file => {
    console.log(file.name, file.type, file.size);
  });
});

// Cleanup
unsubscribe();
```

#### `window.addDropZone(element, zoneName)`
Create a custom drop zone.

```javascript
const dropArea = document.getElementById('my-drop-area');
window.addDropZone(dropArea, 'upload-zone');
```

## Drop Zones

### Default Drop Zone
The entire window is a drop zone by default.

### Custom Drop Zones
Add data attribute to any element:

```html
<div data-drop-zone="gallery">
  Drop images here
</div>

<div data-drop-zone="documents">
  Drop documents here
</div>
```

Or use JavaScript:

```javascript
const galleryZone = document.getElementById('gallery');
window.addDropZone(galleryZone, 'gallery');
```

### Handling Different Zones

```javascript
// Main process
dragDrop.onDrop('files-dropped', (data) => {
  if (data.dropZone === 'gallery') {
    // Handle gallery drops
    console.log('Dropped in gallery:', data.files);
  } else if (data.dropZone === 'documents') {
    // Handle document drops
    console.log('Dropped in documents:', data.files);
  }
});
```

## Visual Feedback

### Built-in Styles

The module includes automatic visual feedback:

- **Body Overlay**: Blue dashed border when dragging over window
- **Drop Zone Highlight**: Zones light up when hovered
- **Drop Indicator**: "Drop files here" message appears

### Custom Styling

Override default styles:

```css
/* Custom drag over effect */
body.drag-over::before {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.5);
}

/* Custom drop zone */
.drop-zone-active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.drop-zone-active::after {
  content: '✨ Drop your files!';
  color: #10b981;
}
```

## File Type Detection

The module automatically categorizes files:

| Category | Extensions |
|----------|-----------|
| **Image** | jpg, jpeg, png, gif, webp, svg, bmp, ico |
| **Video** | mp4, avi, mov, mkv, webm, flv, wmv |
| **Audio** | mp3, wav, ogg, m4a, flac, aac |
| **Document** | pdf, doc, docx, txt, rtf, odt |
| **Code** | js, ts, py, java, cpp, c, html, css, json, xml |
| **Archive** | zip, rar, 7z, tar, gz, bz2 |
| **Other** | Everything else |

## Complete Example

```javascript
// main.js
const { app, BrowserWindow } = require('electron');
const dragDrop = require('./electron-api/drag-drop');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

// Setup drag-drop handlers
dragDrop.onDrop('files-dropped', (data) => {
  console.log(`${data.files.length} files dropped in zone: ${data.dropZone}`);
  
  data.files.forEach(file => {
    console.log(`- ${file.name} (${file.type})`);
    
    if (file.type === 'image') {
      // Handle image
      console.log('  Image file, can preview');
    }
  });
  
  // Send to specific window
  const window = BrowserWindow.fromId(data.windowId);
  if (window) {
    window.webContents.send('files-received', data.files);
  }
});

dragDrop.onDrop('text-dropped', (data) => {
  console.log('Text dropped:', data.text);
});

dragDrop.onDrop('url-dropped', (data) => {
  console.log('URL dropped:', data.url);
});

app.whenReady().then(createWindow);

app.on('before-quit', () => {
  dragDrop.clearHandlers();
});
```

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Load drag-drop preload
require('./electron-api/drag-drop/preload');

// Additional context bridge
contextBridge.exposeInMainWorld('app', {
  onFilesReceived: (callback) => {
    ipcRenderer.on('files-received', (event, files) => callback(files));
  }
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Drag & Drop Example</title>
  <link rel="stylesheet" href="./electron-api/drag-drop/styles.css">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      margin: 0;
    }
    
    .drop-area {
      margin: 20px 0;
      padding: 40px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
    }
    
    .file-list {
      margin-top: 20px;
    }
    
    .file-item {
      padding: 10px;
      margin: 5px 0;
      background: #f3f4f6;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <h1>Drag & Drop Files</h1>
  
  <div class="drop-area" data-drop-zone="main">
    <h2>📁 Drop Files Here</h2>
    <p>Drag and drop files anywhere on this window</p>
  </div>
  
  <div class="file-list" id="fileList"></div>

  <script>
    // Listen for dropped files
    window.dragDrop.onFilesDropped((files) => {
      const fileList = document.getElementById('fileList');
      fileList.innerHTML = '<h3>Dropped Files:</h3>';
      
      files.forEach(file => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
          <span><strong>${file.name}</strong> (${file.type})</span>
          <span>${(file.size / 1024).toFixed(2)} KB</span>
        `;
        fileList.appendChild(item);
      });
    });

    // Listen for files received from main process
    window.app.onFilesReceived((files) => {
      console.log('Main process sent files:', files);
    });
  </script>
</body>
</html>
```

## Advanced Usage

### Filter File Types

```javascript
dragDrop.onDrop('files-dropped', (data) => {
  // Only accept images
  const images = data.files.filter(f => f.type === 'image');
  
  if (images.length === 0) {
    console.log('Please drop image files only');
    return;
  }
  
  console.log('Valid images:', images);
});
```

### Size Limits

```javascript
dragDrop.onDrop('files-dropped', (data) => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  
  const validFiles = data.files.filter(f => f.size <= MAX_SIZE);
  const rejectedFiles = data.files.filter(f => f.size > MAX_SIZE);
  
  if (rejectedFiles.length > 0) {
    console.log('Some files are too large:', rejectedFiles);
  }
  
  // Process valid files
  processFiles(validFiles);
});
```

### Multiple File Processing

```javascript
dragDrop.onDrop('files-dropped', async (data) => {
  console.log(`Processing ${data.files.length} files...`);
  
  for (const file of data.files) {
    try {
      await processFile(file.path);
      console.log(`✓ Processed: ${file.name}`);
    } catch (error) {
      console.error(`✗ Failed: ${file.name}`, error);
    }
  }
});
```

## Security Notes

- Always validate file types and sizes
- Sanitize file paths before operations
- Don't trust client-side validation alone
- Implement server-side checks for uploads
- Be careful with executable files

## Browser Compatibility

This module works in Electron only. For web browsers, use the standard HTML5 Drag and Drop API.
