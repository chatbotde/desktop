# Electron API Modules - New Additions

Four new powerful modules have been added to extend your Electron app's capabilities:

## 📁 1. File System API (`file-system/`)

Complete file and folder management with dialogs.

**Key Features:**
- File/folder selection dialogs
- Read/write operations
- File management (copy, move, delete)
- Directory listing
- Common system paths
- Shell integration

**Quick Example:**
```javascript
const fileSystem = require('./electron-api/file-system');

// Select and read a file
const file = await fileSystem.selectFile();
const content = await fileSystem.readFile(file.filePath);

// Save file
const savePath = await fileSystem.saveFileDialog();
await fileSystem.writeFile(savePath, content);
```

[📖 Full Documentation](./file-system/README.md)

---

## 🎯 2. Drag & Drop API (`drag-drop/`)

Native drag-and-drop functionality with automatic file processing.

**Key Features:**
- Drag files, text, and URLs
- Automatic file metadata extraction
- Visual feedback and styling
- Multiple drop zones
- File type detection
- MIME type identification

**Quick Example:**
```javascript
const dragDrop = require('./electron-api/drag-drop');

// Listen for dropped files
dragDrop.onDrop('files-dropped', (data) => {
  data.files.forEach(file => {
    console.log(file.name, file.type, file.size);
  });
});

// In renderer
window.dragDrop.onFilesDropped((files) => {
  // Handle dropped files
});
```

[📖 Full Documentation](./drag-drop/README.md)

---

## 🐚 3. Shell Integration API (`shell/`)

Interact with the system shell, open files, folders, and URLs.

**Key Features:**
- Open files with default apps
- Open URLs in browser
- Show files in file manager
- Move to trash
- Open terminal/PowerShell
- Execute shell commands
- Command availability checking

**Quick Example:**
```javascript
const shell = require('./electron-api/shell');

// Open file with default app
await shell.openFile('C:\\document.pdf');

// Open URL
await shell.openExternal('https://github.com');

// Show in folder
shell.showInFolder('C:\\file.txt');

// Open terminal
await shell.openTerminal('C:\\Projects');

// Execute command
const result = await shell.executeCommand('git status');
```

[📖 Full Documentation](./shell/README.md)

---

## 🌐 4. Network Status API (`network/`)

Real-time network connectivity monitoring and testing.

**Key Features:**
- Online/offline detection
- Real-time monitoring
- Network speed testing
- Ping functionality
- Network interface info
- Event-driven updates
- Multiple endpoint testing

**Quick Example:**
```javascript
const network = require('./electron-api/network');

// Start monitoring
network.startMonitoring(30000);

// Listen for changes
network.on('online', () => {
  console.log('Connected to internet');
});

network.on('offline', () => {
  console.log('Lost connection');
});

// Check status
const online = await network.checkConnection();

// Test speed
const speed = await network.testSpeed();
console.log('Speed:', speed.speedMbps, 'Mbps');

// Ping host
const ping = await network.ping('google.com');
console.log('Latency:', ping.latency, 'ms');
```

[📖 Full Documentation](./network/README.md)

---

## 🚀 Getting Started

### Installation

All modules are ready to use - no additional dependencies needed! They use built-in Electron and Node.js APIs.

### Basic Setup

1. **Require the module in main process:**

```javascript
// main.js
const fileSystem = require('./electron-api/file-system');
const dragDrop = require('./electron-api/drag-drop');
const shell = require('./electron-api/shell');
const network = require('./electron-api/network');
```

2. **Setup IPC handlers:**

```javascript
const { ipcMain } = require('electron');

// File System
ipcMain.handle('file:select', () => fileSystem.selectFile());
ipcMain.handle('file:read', (e, path) => fileSystem.readFile(path));

// Shell
ipcMain.handle('shell:open', (e, path) => shell.openFile(path));

// Network
ipcMain.handle('network:check', () => network.checkConnection());
```

3. **Expose to renderer via preload:**

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fileSystem: {
    selectFile: () => ipcRenderer.invoke('file:select'),
    readFile: (path) => ipcRenderer.invoke('file:read', path)
  },
  shell: {
    openFile: (path) => ipcRenderer.invoke('shell:open', path)
  },
  network: {
    check: () => ipcRenderer.invoke('network:check')
  }
});

// For drag-drop, include the preload script
require('./electron-api/drag-drop/preload');
```

4. **Use in renderer:**

```javascript
// renderer.js
const file = await window.api.fileSystem.selectFile();
const content = await window.api.fileSystem.readFile(file.filePath);

await window.api.shell.openFile(file.filePath);

const online = await window.api.network.check();
```

---

## 📚 Module Comparison

| Feature | File System | Drag & Drop | Shell | Network |
|---------|-------------|-------------|-------|---------|
| **Primary Use** | File operations | File dropping | System integration | Connectivity |
| **User Input** | Dialogs | Drag events | Commands | Automatic |
| **Async** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Events** | ❌ No | ✅ Yes | ❌ No | ✅ Yes |
| **Visual UI** | ✅ Dialogs | ✅ Drag effects | ❌ No | ❌ No |

---

## 🎯 Common Use Cases

### 1. File Upload with Progress

```javascript
// Drag & Drop + File System
dragDrop.onDrop('files-dropped', async (data) => {
  for (const file of data.files) {
    const content = await fileSystem.readFileBuffer(file.path);
    await uploadFile(file.name, content);
  }
});
```

### 2. Open File in Editor

```javascript
// File System + Shell
const file = await fileSystem.selectFile({
  filters: [{ name: 'Text', extensions: ['txt', 'md'] }]
});

if (file) {
  await shell.openFile(file.filePath);
}
```

### 3. Auto-Save on Network Loss

```javascript
// Network + File System
network.on('offline', async () => {
  const savePath = app.getPath('userData') + '/backup.json';
  await fileSystem.writeFile(savePath, JSON.stringify(appData));
});
```

### 4. Process Dropped Files

```javascript
// Drag & Drop + Shell + File System
dragDrop.onDrop('files-dropped', async (data) => {
  for (const file of data.files) {
    if (file.type === 'image') {
      // Process image
      const buffer = await fileSystem.readFileBuffer(file.path);
      await processImage(buffer);
    }
  }
});
```

---

## 🔒 Security Best Practices

1. **Validate all file paths** before operations
2. **Sanitize user input** before executing commands
3. **Check file sizes** before reading large files
4. **Verify URLs** before opening externally
5. **Use timeouts** for network operations
6. **Limit command execution** to trusted commands
7. **Handle errors gracefully** with try-catch

---

## 🛠️ Integration with Existing Modules

These new modules complement your existing `electron-api` modules:

```
electron-api/
├── BrowserWindow/      ← Window management
├── clipboard/          ← Clipboard operations
├── menu/              ← Context menus
├── file-system/       ← NEW: File operations
├── drag-drop/         ← NEW: Drag & drop
├── shell/             ← NEW: Shell integration
└── network/           ← NEW: Network status
```

### Combined Example

```javascript
// Use all modules together
const { app, ipcMain } = require('electron');
const fileSystem = require('./electron-api/file-system');
const dragDrop = require('./electron-api/drag-drop');
const shell = require('./electron-api/shell');
const network = require('./electron-api/network');

// Start network monitoring
network.startMonitoring();

// Handle dropped files
dragDrop.onDrop('files-dropped', async (data) => {
  // Check network before uploading
  if (!network.isOnline()) {
    console.log('Offline - saving locally');
    const savePath = app.getPath('userData') + '/queue/';
    for (const file of data.files) {
      await fileSystem.copyFile(file.path, savePath + file.name);
    }
  } else {
    // Upload files
    for (const file of data.files) {
      const content = await fileSystem.readFileBuffer(file.path);
      await uploadToServer(content);
    }
  }
  
  // Show in folder after processing
  shell.showInFolder(data.files[0].path);
});
```

---

## 📊 Performance Tips

1. **File System**: Use streams for large files
2. **Drag & Drop**: Debounce multiple drops
3. **Shell**: Cache command existence checks
4. **Network**: Adjust monitoring interval based on needs

---

## 🐛 Troubleshooting

### File System Issues
- **Problem**: Dialog doesn't show
- **Solution**: Ensure main window exists and is visible

### Drag & Drop Issues
- **Problem**: Drop events not firing
- **Solution**: Check preload script is loaded and CSS is included

### Shell Issues
- **Problem**: Command not found
- **Solution**: Use `shell.commandExists()` to check availability

### Network Issues
- **Problem**: False offline detection
- **Solution**: Customize check URLs with `network.setCheckUrls()`

---

## 📝 Next Steps

1. **Read individual module documentation**
2. **Check out the examples** in each README
3. **Integrate with your app** step by step
4. **Test on all platforms** (Windows, macOS, Linux)
5. **Add error handling** for production use

---

## 🤝 Module Dependencies

All modules are standalone with minimal dependencies:

- ✅ Electron (built-in)
- ✅ Node.js fs, path, os (built-in)
- ✅ No external npm packages needed

---

## 📞 Support

Each module has comprehensive documentation:
- [File System](./file-system/README.md)
- [Drag & Drop](./drag-drop/README.md)
- [Shell Integration](./shell/README.md)
- [Network Status](./network/README.md)

Happy coding! 🚀
