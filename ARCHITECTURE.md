# 🏗️ Electron API Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your Buddy App                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       MAIN PROCESS (main.js)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │  File System   │  │  Drag & Drop   │  │     Shell      │  │
│  │   Module       │  │    Handler     │  │  Integration   │  │
│  └────────────────┘  └────────────────┘  └────────────────┘  │
│                                                                 │
│  ┌────────────────┐                                            │
│  │    Network     │     setupElectronAPIHandlers()            │
│  │   Monitoring   │     ↓ Registers IPC Handlers              │
│  └────────────────┘                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    IPC Communication Layer                      │
│         (ipcMain.handle / ipcMain.on / events)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                PRELOAD SCRIPT (chat-input-preload.js)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  contextBridge.exposeInMainWorld()                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   window.    │  │   window.    │  │   window.    │        │
│  │  fileSystem  │  │   dragDrop   │  │    shell     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐                                              │
│  │   window.    │                                              │
│  │   network    │                                              │
│  └──────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│              RENDERER PROCESS (chat-input.html)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your Chat UI + JavaScript                                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │  User Actions:                                   │         │
│  │  • Click "Attach File" button                    │         │
│  │  • Drag & drop files                            │         │
│  │  • Click external links                         │         │
│  │  • View network status                          │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### Example 1: File Selection

```
User clicks "Attach File"
         ↓
Renderer: window.fileSystem.selectFile()
         ↓
Preload: ipcRenderer.invoke('file:select')
         ↓
Main: ipcMain.handle('file:select', ...) → fileSystem.selectFile()
         ↓
Electron: Opens native file dialog
         ↓
User selects file
         ↓
Main: Returns file info → { filePath, fileName, size, ... }
         ↓
Preload: Passes data back
         ↓
Renderer: Receives file info
         ↓
Display file in UI
```

### Example 2: Drag & Drop

```
User drags file over window
         ↓
Browser: Native drag events (dragenter, dragover)
         ↓
Preload: Intercepts drop event
         ↓
Preload: Extracts file info → ipcRenderer.send('drag-drop:files-dropped')
         ↓
Main: dragDrop module receives → processes files
         ↓
Main: Emits 'files-dropped' event
         ↓
Main: Sends to renderer → window.webContents.send('files-received')
         ↓
Renderer: window.dragDrop.onFilesDropped(callback)
         ↓
Your callback processes files
```

### Example 3: Network Status

```
App starts
         ↓
Main: network.startMonitoring(30000)
         ↓
Network module: Checks connection every 30s
         ↓
Connection status changes
         ↓
Network module: Emits 'status-changed' event
         ↓
Main: Listens to event → forwards to all windows
         ↓
Renderer: window.network.onStatusChanged(callback)
         ↓
Your callback updates UI
```

---

## Module Structure

```
buddy/
├── main.js                              ← Add handlers here
├── chat-input/
│   ├── chat-input-window.js            ← Window creation
│   ├── chat-input-preload.js           ← Add API exposure here
│   ├── chat-input.html                 ← Add CSS link here
│   │
│   └── electron-api/                   ← NEW MODULES
│       ├── file-system/
│       │   ├── index.js               ← Main API
│       │   └── README.md              ← Documentation
│       │
│       ├── drag-drop/
│       │   ├── index.js               ← Drop handler
│       │   ├── preload.js             ← Auto-loaded
│       │   ├── styles.css             ← Visual feedback
│       │   └── README.md
│       │
│       ├── shell/
│       │   ├── index.js               ← Shell operations
│       │   └── README.md
│       │
│       ├── network/
│       │   ├── index.js               ← Network monitor
│       │   └── README.md
│       │
│       └── NEW_MODULES.md              ← Overview
│
├── INTEGRATION_GUIDE.md                ← Detailed guide
├── HOW_TO_USE.md                       ← Quick start
└── test-electron-api.html              ← Test page
```

---

## Security Model

```
┌─────────────────────────────────────────────────┐
│           RENDERER (Sandboxed)                  │
│  • No direct access to Node.js/Electron        │
│  • Can only use exposed APIs                   │
│  • All file operations go through IPC          │
└─────────────────────────────────────────────────┘
                    ↕ IPC Only
┌─────────────────────────────────────────────────┐
│        PRELOAD (Bridge with limited access)     │
│  • contextBridge.exposeInMainWorld()           │
│  • Validates and sanitizes requests            │
│  • Acts as security boundary                   │
└─────────────────────────────────────────────────┘
                    ↕ IPC Only
┌─────────────────────────────────────────────────┐
│      MAIN PROCESS (Full Node.js/Electron)      │
│  • Full file system access                     │
│  • Can execute shell commands                  │
│  • Network access                              │
│  • All native capabilities                     │
└─────────────────────────────────────────────────┘
```

---

## API Call Flow

```javascript
// RENDERER (Your HTML/JS)
async function attachFile() {
  const file = await window.fileSystem.selectFile();
  //                    ↑
  //                    Calls exposed API
}

// PRELOAD (chat-input-preload.js)
contextBridge.exposeInMainWorld('fileSystem', {
  selectFile: (options) => ipcRenderer.invoke('file:select', options)
  //                                    ↑
  //                                    Sends IPC message
});

// MAIN (main.js)
ipcMain.handle('file:select', async (event, options) => {
  return await fileSystem.selectFile(options);
  //                      ↑
  //                      Calls actual module
});

// MODULE (file-system/index.js)
async function selectFile(options) {
  const result = await dialog.showOpenDialog({ ... });
  //                          ↑
  //                          Uses Electron API
  return result;
}
```

---

## Event-Driven Architecture

### Network Status Example

```
┌──────────────┐
│   Network    │  Starts monitoring
│   Module     │  ────────────────────────┐
└──────────────┘                          │
       ↓                                  │
  Checks every                            │
   30 seconds                             │
       ↓                                  │
  Status changes                          │
       ↓                                  │
  Emits event                             │
       ↓                                  │
┌──────────────┐                          │
│  Main.js     │  Listens for event      │
│   Handler    │  ←───────────────────────┘
└──────────────┘
       ↓
  Forwards to
  all windows
       ↓
┌──────────────┐
│  Renderer    │  window.network.onStatusChanged()
│   Callback   │  Updates UI
└──────────────┘
```

### Drag & Drop Example

```
User drags file
       ↓
┌──────────────┐
│   Browser    │  Native drag events
│   Events     │  (dragenter, dragover, drop)
└──────────────┘
       ↓
┌──────────────┐
│   Preload    │  Intercepts drop event
│   Script     │  Extracts file data
└──────────────┘
       ↓
┌──────────────┐
│  Drag-Drop   │  Processes files
│   Module     │  Adds metadata
└──────────────┘
       ↓
┌──────────────┐
│  Main.js     │  Forwards processed data
│   Handler    │  to renderer
└──────────────┘
       ↓
┌──────────────┐
│  Renderer    │  window.dragDrop.onFilesDropped()
│   Callback   │  Displays files
└──────────────┘
```

---

## Integration Checklist

### ✅ Main Process (main.js)
- [ ] Import all 4 modules at top
- [ ] Copy `setupElectronAPIHandlers()` function
- [ ] Call it in `app.whenReady()`
- [ ] Add cleanup in `app.on('before-quit')`

### ✅ Preload (chat-input-preload.js)
- [ ] Add drag-drop preload require
- [ ] Add fileSystem API exposure
- [ ] Add shell API exposure
- [ ] Add network API exposure

### ✅ Renderer (chat-input.html)
- [ ] Add drag-drop CSS link
- [ ] Add event listeners for dropped files
- [ ] Add network status indicator
- [ ] Test all APIs

### ✅ Testing
- [ ] Load test page (test-electron-api.html)
- [ ] Test each module individually
- [ ] Test drag & drop functionality
- [ ] Verify network monitoring works

---

## Performance Considerations

```
┌────────────────────────────────────────────┐
│  Network Monitoring                        │
│  • Runs in background                      │
│  • Checks every 30s (configurable)         │
│  • Minimal CPU usage                       │
│  • Auto-cleanup on app quit                │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  File Operations                           │
│  • Async by default                        │
│  • No blocking UI                          │
│  • Handles large files efficiently         │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Drag & Drop                               │
│  • Native browser events                   │
│  • Processed asynchronously                │
│  • Visual feedback included                │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Shell Operations                          │
│  • Async command execution                 │
│  • Configurable timeouts                   │
│  • Error handling built-in                 │
└────────────────────────────────────────────┘
```

---

## Quick Reference

| What You Want | API to Use | Example |
|---------------|------------|---------|
| Select a file | `window.fileSystem.selectFile()` | File picker dialog |
| Read file | `window.fileSystem.readFile(path)` | Get file contents |
| Save file | `window.fileSystem.saveFileDialog()` | Save dialog |
| Handle dropped files | `window.dragDrop.onFilesDropped()` | Auto-processes files |
| Open URL | `window.shell.openExternal(url)` | Opens in browser |
| Open file | `window.shell.openFile(path)` | Opens with default app |
| Show in folder | `window.shell.showInFolder(path)` | Opens file explorer |
| Check network | `window.network.isOnline()` | Returns boolean |
| Monitor network | `window.network.onStatusChanged()` | Real-time updates |
| Run command | `window.shell.execute(cmd)` | Execute shell command |

---

## Support

- 📖 **Full Guide**: `INTEGRATION_GUIDE.md`
- 🚀 **Quick Start**: `HOW_TO_USE.md`
- 📚 **Module Docs**: `chat-input/electron-api/*/README.md`
- 🧪 **Test Page**: `test-electron-api.html`

Happy coding! 🎉
