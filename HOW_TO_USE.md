# 🚀 How to Use the New Electron APIs in Your System

## Quick Summary

You now have 5 powerful new APIs integrated into your Buddy app:

1. **📁 File System** - Select, read, write, and manage files
2. **🎯 Drag & Drop** - Drop files into your app
3. **🐚 Shell Integration** - Open files, folders, URLs, and run commands
4. **🌐 Network Status** - Monitor internet connectivity
5. **🚀 App Launcher** - Open any application on your laptop

---

## 🎯 Quick Start (3 Steps)

### Step 1: Add IPC Handlers to `main.js`

Add these lines at the top of your `main.js` (around line 7):

```javascript
const fileSystem = require('./chat-input/electron-api/file-system');
const dragDrop = require('./chat-input/electron-api/drag-drop');
const shell = require('./chat-input/electron-api/shell');
const network = require('./chat-input/electron-api/network');
const appLauncher = require('./chat-input/electron-api/app-launcher');
```

Then copy the `setupElectronAPIHandlers()` function from `INTEGRATION_GUIDE.md` and add it after your existing IPC handlers.

Call it in `app.whenReady()`:

```javascript
app.whenReady().then(() => {
  createLaunchWindow();
  setupElectronAPIHandlers(); // ADD THIS
});
```

### Step 2: Update `chat-input-preload.js`

Copy the entire "NEW ELECTRON API MODULES" section from `INTEGRATION_GUIDE.md` and paste it at the end of your `chat-input-preload.js` file.

### Step 3: Add CSS to `chat-input.html`

Add this line in the `<head>` section:

```html
<link rel="stylesheet" href="electron-api/drag-drop/styles.css">
```

---

## ✅ Testing

### Option 1: Use Test Page

1. Open the test page by loading `test-electron-api.html` in your chat window
2. Click buttons to test each API
3. Try dragging files into the drop zone

### Option 2: Quick Console Test

Open DevTools console in your chat window and run:

```javascript
// Test File System
const paths = await window.fileSystem.getCommonPaths();
console.log('Paths:', paths);

// Test Network
const online = await window.network.isOnline();
console.log('Online:', online);

// Test Shell
const hasGit = await window.shell.commandExists('git');
console.log('Git installed:', hasGit);
```

---

## 💡 Common Use Cases

### 1. Add File Attachment Button

```javascript
// In your chat interface
async function attachFile() {
  const file = await window.fileSystem.selectFile();
  if (file) {
    const content = await window.fileSystem.readFileBuffer(file.filePath);
    // Send to chat...
  }
}
```

### 2. Enable Drag & Drop

```javascript
// Automatically works! Just listen for dropped files
window.dragDrop.onFilesDropped((files) => {
  files.forEach(file => {
    console.log('Dropped:', file.name);
    // Process file...
  });
});
```

### 3. Open Links in Browser

```javascript
// When user clicks a link
function handleLinkClick(url) {
  window.shell.openExternal(url);
}
```

### 4. Show Network Status

```javascript
// Add network indicator
window.network.onStatusChanged((data) => {
  if (data.online) {
    showOnlineIndicator();
  } else {
    showOfflineWarning();
  }
});
```

### 5. Open Any Application

```javascript
// Open Chrome
await window.appLauncher.launch('chrome');

// Open VS Code
await window.appLauncher.launch('vscode');

// Open any app by name
await window.appLauncher.launch('notepad');

// Parse text commands
async function handleCommand(text) {
  if (text.startsWith('open ')) {
    const app = text.replace('open ', '');
    await window.appLauncher.launch(app);
  }
}

// User types: "open chrome" → Opens Chrome
```

### 6. Add Custom Applications

```javascript
// Add any app not in the common list
await window.appLauncher.addCustomApp(
  'photoshop',
  'C:\\Program Files\\Adobe\\Photoshop 2024\\Photoshop.exe'
);

// Launch your custom app
await window.appLauncher.launch('photoshop');

// Or use file picker to add
const result = await window.appLauncher.browseAndAddApp('MyApp');
if (result.success) {
  await window.appLauncher.launch('myapp');
}

// Get all your custom apps
const apps = await window.appLauncher.getCustomApps();
console.log('My apps:', apps);
```

**📖 Custom Apps Guide**: `chat-input/electron-api/app-launcher/QUICK_START_CUSTOM_APPS.md`

---

## 📚 Full Documentation

- **Complete Integration Guide**: `INTEGRATION_GUIDE.md`
- **All New Modules Overview**: `chat-input/electron-api/NEW_MODULES.md`
- **Individual Module Docs**:
  - `chat-input/electron-api/file-system/README.md`
  - `chat-input/electron-api/drag-drop/README.md`
  - `chat-input/electron-api/shell/README.md`
  - `chat-input/electron-api/network/README.md`
  - `chat-input/electron-api/app-launcher/README.md`
  - `chat-input/electron-api/app-launcher/QUICK_START_CUSTOM_APPS.md` ⭐ **NEW!**
  - `chat-input/electron-api/app-launcher/CUSTOM_APPS.md` (detailed docs)

---

## 🎨 Available APIs in Renderer

Once integrated, you can use these in your chat window:

```javascript
// File System
window.fileSystem.selectFile()
window.fileSystem.readFile(path)
window.fileSystem.writeFile(path, content)
window.fileSystem.getCommonPaths()

// Drag & Drop
window.dragDrop.onFilesDropped(callback)
window.addDropZone(element, name)

// Shell
window.shell.openFile(path)
window.shell.openExternal(url)
window.shell.showInFolder(path)
window.shell.openTerminal(path)

// Network
window.network.isOnline()
window.network.check()
window.network.ping(host)
window.network.onStatusChanged(callback)

// App Launcher
window.appLauncher.launch(appName)
window.appLauncher.launchWithArgs(appName, args)
window.appLauncher.openURL(url, browser)
window.appLauncher.search(searchTerm)
window.appLauncher.getAvailable()

// Custom App Management
window.appLauncher.addCustomApp(name, path)
window.appLauncher.removeCustomApp(name)
window.appLauncher.getCustomApps()
window.appLauncher.updateCustomApp(name, newPath)
window.appLauncher.browseAndAddApp(name)
```

---

## 🐛 Troubleshooting

**Q: APIs are undefined**
A: Make sure you added the preload script code and restarted your app

**Q: Drag & Drop not working**
A: Check that you added the CSS link and the preload require statement

**Q: File dialogs don't show**
A: Ensure the main window is visible and you added the IPC handlers

**Q: Network monitoring not working**
A: Make sure you called `setupElectronAPIHandlers()` in `app.whenReady()`

---

## 🚀 Next Steps

1. ✅ Follow the 3 quick start steps above
2. ✅ Test using the test page or console
3. ✅ Integrate into your chat UI
4. ✅ Read full docs for advanced features

**Need Help?** Check `INTEGRATION_GUIDE.md` for detailed examples!
