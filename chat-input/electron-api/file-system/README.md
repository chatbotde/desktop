# File System API

Provides comprehensive file system operations for Electron applications including file dialogs, read/write operations, and file management.

## Features

- 📂 File & folder selection dialogs
- 📝 Read & write files (text and binary)
- 📋 File operations (copy, move, delete)
- 🔍 File stats and existence checks
- 📁 Directory listing
- 🚀 Open files with default applications
- 📍 Common system paths

## Usage

### Basic Setup

```javascript
const fileSystem = require('./electron-api/file-system');

// In main process
const { ipcMain } = require('electron');

// Select file
ipcMain.handle('file:select', async () => {
  return await fileSystem.selectFile({
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
});

// Read file
ipcMain.handle('file:read', async (event, filePath) => {
  return await fileSystem.readFile(filePath);
});

// Write file
ipcMain.handle('file:write', async (event, filePath, content) => {
  return await fileSystem.writeFile(filePath, content);
});
```

## API Reference

### File Dialogs

#### `selectFile(options)`
Open a file selection dialog.

```javascript
const fileInfo = await fileSystem.selectFile({
  filters: [
    { name: 'Text Files', extensions: ['txt', 'md'] },
    { name: 'All Files', extensions: ['*'] }
  ],
  defaultPath: '/path/to/default'
});

// Returns:
// {
//   filePath: '/path/to/file.txt',
//   fileName: 'file.txt',
//   size: 1024,
//   extension: '.txt',
//   directory: '/path/to'
// }
```

#### `selectMultipleFiles(options)`
Select multiple files at once.

```javascript
const files = await fileSystem.selectMultipleFiles({
  filters: [
    { name: 'Images', extensions: ['jpg', 'png'] }
  ]
});

// Returns array of file info objects
```

#### `selectFolder(options)`
Open a folder selection dialog.

```javascript
const folderInfo = await fileSystem.selectFolder({
  defaultPath: '/path/to/default'
});

// Returns:
// {
//   folderPath: '/path/to/folder',
//   folderName: 'folder',
//   size: 4096,
//   parent: '/path/to'
// }
```

#### `saveFileDialog(options)`
Open a save file dialog.

```javascript
const savePath = await fileSystem.saveFileDialog({
  defaultPath: '/path/to/save/file.txt',
  filters: [
    { name: 'Text Files', extensions: ['txt'] }
  ]
});

// Returns: '/path/to/save/file.txt' or null if canceled
```

### File Operations

#### `readFile(filePath, encoding)`
Read text file content.

```javascript
const content = await fileSystem.readFile('/path/to/file.txt', 'utf-8');
```

#### `readFileBuffer(filePath)`
Read file as buffer (for binary files).

```javascript
const buffer = await fileSystem.readFileBuffer('/path/to/image.png');
```

#### `writeFile(filePath, content, encoding)`
Write content to file.

```javascript
await fileSystem.writeFile('/path/to/file.txt', 'Hello World', 'utf-8');
```

#### `fileExists(filePath)`
Check if file exists.

```javascript
const exists = await fileSystem.fileExists('/path/to/file.txt');
// Returns: true or false
```

#### `getFileStats(filePath)`
Get detailed file statistics.

```javascript
const stats = await fileSystem.getFileStats('/path/to/file.txt');

// Returns:
// {
//   size: 1024,
//   created: Date,
//   modified: Date,
//   accessed: Date,
//   isFile: true,
//   isDirectory: false
// }
```

### Directory Operations

#### `listFiles(dirPath)`
List all files and folders in a directory.

```javascript
const items = await fileSystem.listFiles('/path/to/directory');

// Returns:
// [
//   {
//     name: 'file.txt',
//     isFile: true,
//     isDirectory: false,
//     path: '/path/to/directory/file.txt'
//   },
//   ...
// ]
```

### File Management

#### `deleteFile(filePath)`
Delete a file.

```javascript
const success = await fileSystem.deleteFile('/path/to/file.txt');
```

#### `copyFile(sourcePath, destPath)`
Copy a file.

```javascript
await fileSystem.copyFile(
  '/path/to/source.txt',
  '/path/to/destination.txt'
);
```

#### `moveFile(oldPath, newPath)`
Move or rename a file.

```javascript
await fileSystem.moveFile(
  '/path/to/old.txt',
  '/path/to/new.txt'
);
```

### Shell Integration

#### `openWithDefaultApp(filePath)`
Open file with system's default application.

```javascript
const error = await fileSystem.openWithDefaultApp('/path/to/file.pdf');
// Returns empty string on success, error message on failure
```

#### `showInFolder(filePath)`
Show file in system file explorer.

```javascript
fileSystem.showInFolder('/path/to/file.txt');
```

### System Paths

#### `getCommonPaths()`
Get common system paths.

```javascript
const paths = fileSystem.getCommonPaths();

// Returns:
// {
//   home: '/Users/username',
//   desktop: '/Users/username/Desktop',
//   documents: '/Users/username/Documents',
//   downloads: '/Users/username/Downloads',
//   pictures: '/Users/username/Pictures',
//   videos: '/Users/username/Videos',
//   music: '/Users/username/Music',
//   temp: '/tmp',
//   appData: '/Users/username/AppData',
//   userData: '/Users/username/AppData/YourApp'
// }
```

## Complete Example

```javascript
// main.js
const { app, ipcMain } = require('electron');
const fileSystem = require('./electron-api/file-system');

// Setup IPC handlers
function setupFileSystemHandlers() {
  // File selection
  ipcMain.handle('file:select', async (event, options) => {
    return await fileSystem.selectFile(options);
  });

  ipcMain.handle('file:select-multiple', async (event, options) => {
    return await fileSystem.selectMultipleFiles(options);
  });

  ipcMain.handle('file:select-folder', async (event, options) => {
    return await fileSystem.selectFolder(options);
  });

  ipcMain.handle('file:save-dialog', async (event, options) => {
    return await fileSystem.saveFileDialog(options);
  });

  // File operations
  ipcMain.handle('file:read', async (event, filePath, encoding) => {
    return await fileSystem.readFile(filePath, encoding);
  });

  ipcMain.handle('file:read-buffer', async (event, filePath) => {
    return await fileSystem.readFileBuffer(filePath);
  });

  ipcMain.handle('file:write', async (event, filePath, content, encoding) => {
    return await fileSystem.writeFile(filePath, content, encoding);
  });

  ipcMain.handle('file:exists', async (event, filePath) => {
    return await fileSystem.fileExists(filePath);
  });

  ipcMain.handle('file:stats', async (event, filePath) => {
    return await fileSystem.getFileStats(filePath);
  });

  ipcMain.handle('file:list', async (event, dirPath) => {
    return await fileSystem.listFiles(dirPath);
  });

  ipcMain.handle('file:delete', async (event, filePath) => {
    return await fileSystem.deleteFile(filePath);
  });

  ipcMain.handle('file:copy', async (event, sourcePath, destPath) => {
    return await fileSystem.copyFile(sourcePath, destPath);
  });

  ipcMain.handle('file:move', async (event, oldPath, newPath) => {
    return await fileSystem.moveFile(oldPath, newPath);
  });

  ipcMain.handle('file:open', async (event, filePath) => {
    return await fileSystem.openWithDefaultApp(filePath);
  });

  ipcMain.handle('file:show-in-folder', (event, filePath) => {
    fileSystem.showInFolder(filePath);
  });

  ipcMain.handle('file:common-paths', () => {
    return fileSystem.getCommonPaths();
  });
}

app.whenReady().then(() => {
  setupFileSystemHandlers();
});
```

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fileSystem', {
  selectFile: (options) => ipcRenderer.invoke('file:select', options),
  selectMultipleFiles: (options) => ipcRenderer.invoke('file:select-multiple', options),
  selectFolder: (options) => ipcRenderer.invoke('file:select-folder', options),
  saveFileDialog: (options) => ipcRenderer.invoke('file:save-dialog', options),
  readFile: (filePath, encoding) => ipcRenderer.invoke('file:read', filePath, encoding),
  readFileBuffer: (filePath) => ipcRenderer.invoke('file:read-buffer', filePath),
  writeFile: (filePath, content, encoding) => ipcRenderer.invoke('file:write', filePath, content, encoding),
  fileExists: (filePath) => ipcRenderer.invoke('file:exists', filePath),
  getFileStats: (filePath) => ipcRenderer.invoke('file:stats', filePath),
  listFiles: (dirPath) => ipcRenderer.invoke('file:list', dirPath),
  deleteFile: (filePath) => ipcRenderer.invoke('file:delete', filePath),
  copyFile: (sourcePath, destPath) => ipcRenderer.invoke('file:copy', sourcePath, destPath),
  moveFile: (oldPath, newPath) => ipcRenderer.invoke('file:move', oldPath, newPath),
  openWithDefaultApp: (filePath) => ipcRenderer.invoke('file:open', filePath),
  showInFolder: (filePath) => ipcRenderer.invoke('file:show-in-folder', filePath),
  getCommonPaths: () => ipcRenderer.invoke('file:common-paths')
});
```

```javascript
// renderer.js
async function example() {
  // Select and read a file
  const fileInfo = await window.fileSystem.selectFile({
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md'] }
    ]
  });

  if (fileInfo) {
    const content = await window.fileSystem.readFile(fileInfo.filePath);
    console.log('File content:', content);

    // Open file with default app
    await window.fileSystem.openWithDefaultApp(fileInfo.filePath);

    // Show in folder
    window.fileSystem.showInFolder(fileInfo.filePath);
  }

  // Get common paths
  const paths = await window.fileSystem.getCommonPaths();
  console.log('Documents folder:', paths.documents);
}
```

## Error Handling

All async functions throw errors on failure. Always use try-catch:

```javascript
try {
  const content = await fileSystem.readFile('/path/to/file.txt');
} catch (error) {
  console.error('Failed to read file:', error);
}
```

## Security Notes

- Always validate file paths before operations
- Be careful with file deletion - no confirmation dialog
- Consider implementing file size limits for read operations
- Sanitize file names before writing
- Check file permissions before operations

## Platform Differences

- **Windows**: Uses backslash `\` in paths
- **macOS/Linux**: Uses forward slash `/` in paths
- Use Node's `path` module for cross-platform compatibility
