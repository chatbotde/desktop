# Integration Guide - New Electron API Modules

This guide shows you how to integrate the 5 new modules into your **Buddy** app.

## 📋 Overview

Your app structure:
- **Main Process**: `main.js` - App entry point
- **Chat Input Window**: `chat-input-window.js` - Main chat window
- **Preload**: `chat-input-preload.js` - Renderer bridge

We'll integrate:
1. 📁 File System - File operations
2. 🎯 Drag & Drop - Drop files into chat
3. 🐚 Shell - Open files/URLs
4. 🌐 Network - Connection monitoring
5. 🚀 App Launcher - Open any application on your laptop

---

## 🚀 Step 1: Setup IPC Handlers in Main Process

Add these handlers to your `main.js` file:

```javascript
// At the top with other requires
const fileSystem = require('./chat-input/electron-api/file-system');
const dragDrop = require('./chat-input/electron-api/drag-drop');
const shell = require('./chat-input/electron-api/shell');
const network = require('./chat-input/electron-api/network');
const appLauncher = require('./chat-input/electron-api/app-launcher');
```

Then add this function after line 100 (after your existing IPC handlers):

```javascript
// ==================== NEW ELECTRON API HANDLERS ====================

function setupElectronAPIHandlers() {
  console.log('Main: Setting up Electron API handlers');

  // ==================== FILE SYSTEM ====================
  
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

  ipcMain.handle('file:common-paths', () => {
    return fileSystem.getCommonPaths();
  });

  // ==================== SHELL INTEGRATION ====================
  
  ipcMain.handle('shell:open-file', async (event, filePath) => {
    return await shell.openFile(filePath);
  });

  ipcMain.handle('shell:open-folder', async (event, folderPath) => {
    return await shell.openFolder(folderPath);
  });

  ipcMain.handle('shell:show-in-folder', (event, filePath) => {
    shell.showInFolder(filePath);
  });

  ipcMain.handle('shell:move-to-trash', async (event, filePath) => {
    return await shell.moveToTrash(filePath);
  });

  ipcMain.handle('shell:open-external', async (event, url) => {
    return await shell.openExternal(url);
  });

  ipcMain.handle('shell:open-terminal', async (event, dirPath) => {
    return await shell.openTerminal(dirPath);
  });

  ipcMain.handle('shell:open-powershell', async (event, dirPath) => {
    return await shell.openPowerShell(dirPath);
  });

  ipcMain.handle('shell:open-app-data', async () => {
    return await shell.openAppDataFolder();
  });

  ipcMain.handle('shell:execute', async (event, command, options) => {
    return await shell.executeCommand(command, options);
  });

  ipcMain.handle('shell:command-exists', async (event, command) => {
    return await shell.commandExists(command);
  });

  // ==================== NETWORK STATUS ====================
  
  ipcMain.handle('network:is-online', () => {
    return network.isOnline();
  });

  ipcMain.handle('network:check', async () => {
    return await network.checkConnection();
  });

  ipcMain.handle('network:detailed-check', async () => {
    return await network.detailedCheck();
  });

  ipcMain.handle('network:ping', async (event, host, timeout) => {
    return await network.ping(host, timeout);
  });

  ipcMain.handle('network:test-speed', async (event, url, duration) => {
    return await network.testSpeed(url, duration);
  });

  ipcMain.handle('network:get-interfaces', () => {
    return network.getNetworkInterfaces();
  });

  // ==================== APP LAUNCHER ====================
  
  // Launch application
  ipcMain.handle('app:launch', async (event, appName, options) => {
    return await appLauncher.launchApp(appName, options);
  });

  // Launch with arguments
  ipcMain.handle('app:launch-with-args', async (event, appName, args) => {
    return await appLauncher.launchWithArgs(appName, args);
  });

  // Open URL in browser
  ipcMain.handle('app:open-url', async (event, url, browser) => {
    return await appLauncher.openURL(url, browser);
  });

  // Search for applications
  ipcMain.handle('app:search', async (event, searchTerm) => {
    return await appLauncher.searchApps(searchTerm);
  });

  // Get available applications
  ipcMain.handle('app:get-available', async () => {
    return await appLauncher.getAvailableApps();
  });

  // Check if app exists
  ipcMain.handle('app:exists', async (event, appPath) => {
    return await appLauncher.appExists(appPath);
  });

  // Launch multiple apps
  ipcMain.handle('app:launch-multiple', async (event, appNames) => {
    return await appLauncher.launchMultiple(appNames);
  });

  // Get common apps list
  ipcMain.handle('app:get-common', () => {
    return appLauncher.getCommonApps();
  });

  // Add custom application
  ipcMain.handle('app:add-custom', async (event, name, path) => {
    return await appLauncher.addCustomApp(name, path);
  });

  // Remove custom application
  ipcMain.handle('app:remove-custom', async (event, name) => {
    return await appLauncher.removeCustomApp(name);
  });

  // Get custom applications
  ipcMain.handle('app:get-custom', () => {
    return appLauncher.getCustomApps();
  });

  // Update custom application path
  ipcMain.handle('app:update-custom', async (event, name, newPath) => {
    return await appLauncher.updateCustomApp(name, newPath);
  });

  // Browse and add application
  ipcMain.handle('app:browse-and-add', async (event, name) => {
    return await appLauncher.browseAndAddApp(name);
  });

  // ==================== DRAG & DROP ====================
  
  // Drag-drop handlers are auto-registered in the module
  // But we can add custom logic here
  dragDrop.onDrop('files-dropped', (data) => {
    console.log(`Main: ${data.files.length} files dropped`);
    
    // Forward to the window that received the drop
    const window = BrowserWindow.fromId(data.windowId);
    if (window) {
      window.webContents.send('files-received', data.files);
    }
  });

  // ==================== NETWORK MONITORING ====================
  
  // Start network monitoring
  network.startMonitoring(30000); // Check every 30 seconds

  // Handle network status changes
  network.on('online', (data) => {
    console.log('Main: Internet connected');
    
    // Notify all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('network:status-changed', {
        online: true,
        timestamp: data.timestamp
      });
    });
  });

  network.on('offline', (data) => {
    console.log('Main: Internet disconnected');
    
    // Notify all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('network:status-changed', {
        online: false,
        timestamp: data.timestamp
      });
    });
  });

  console.log('Main: Electron API handlers setup complete');
}
```

Now call this function in your `app.whenReady()` section. Find the line around line 350-400 where you have:

```javascript
app.whenReady().then(() => {
  // existing code...
  setupElectronAPIHandlers(); // ADD THIS LINE
});
```

---

## 🔌 Step 2: Update Preload Script

Add to your `chat-input-preload.js` after line 100:

```javascript
// ==================== NEW ELECTRON API MODULES ====================

// Load drag-drop preload (must be loaded early)
require('./electron-api/drag-drop/preload');

// File System API
contextBridge.exposeInMainWorld("fileSystem", {
  // File selection
  selectFile: (options) => ipcRenderer.invoke('file:select', options),
  selectMultipleFiles: (options) => ipcRenderer.invoke('file:select-multiple', options),
  selectFolder: (options) => ipcRenderer.invoke('file:select-folder', options),
  saveFileDialog: (options) => ipcRenderer.invoke('file:save-dialog', options),
  
  // File operations
  readFile: (filePath, encoding) => ipcRenderer.invoke('file:read', filePath, encoding),
  readFileBuffer: (filePath) => ipcRenderer.invoke('file:read-buffer', filePath),
  writeFile: (filePath, content, encoding) => ipcRenderer.invoke('file:write', filePath, content, encoding),
  fileExists: (filePath) => ipcRenderer.invoke('file:exists', filePath),
  getFileStats: (filePath) => ipcRenderer.invoke('file:stats', filePath),
  listFiles: (dirPath) => ipcRenderer.invoke('file:list', dirPath),
  deleteFile: (filePath) => ipcRenderer.invoke('file:delete', filePath),
  copyFile: (sourcePath, destPath) => ipcRenderer.invoke('file:copy', sourcePath, destPath),
  moveFile: (oldPath, newPath) => ipcRenderer.invoke('file:move', oldPath, newPath),
  getCommonPaths: () => ipcRenderer.invoke('file:common-paths'),
  
  // Events
  onFilesReceived: (callback) => {
    const listener = (event, files) => callback(files);
    ipcRenderer.on('files-received', listener);
    return () => ipcRenderer.removeListener('files-received', listener);
  }
});

// Shell Integration API
contextBridge.exposeInMainWorld("shell", {
  openFile: (filePath) => ipcRenderer.invoke('shell:open-file', filePath),
  openFolder: (folderPath) => ipcRenderer.invoke('shell:open-folder', folderPath),
  showInFolder: (filePath) => ipcRenderer.invoke('shell:show-in-folder', filePath),
  moveToTrash: (filePath) => ipcRenderer.invoke('shell:move-to-trash', filePath),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  openTerminal: (dirPath) => ipcRenderer.invoke('shell:open-terminal', dirPath),
  openPowerShell: (dirPath) => ipcRenderer.invoke('shell:open-powershell', dirPath),
  openAppData: () => ipcRenderer.invoke('shell:open-app-data'),
  execute: (command, options) => ipcRenderer.invoke('shell:execute', command, options),
  commandExists: (command) => ipcRenderer.invoke('shell:command-exists', command)
});

// Network Status API
contextBridge.exposeInMainWorld("network", {
  isOnline: () => ipcRenderer.invoke('network:is-online'),
  check: () => ipcRenderer.invoke('network:check'),
  detailedCheck: () => ipcRenderer.invoke('network:detailed-check'),
  ping: (host, timeout) => ipcRenderer.invoke('network:ping', host, timeout),
  testSpeed: (url, duration) => ipcRenderer.invoke('network:test-speed', url, duration),
  getInterfaces: () => ipcRenderer.invoke('network:get-interfaces'),
  
  // Events
  onStatusChanged: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('network:status-changed', listener);
    return () => ipcRenderer.removeListener('network:status-changed', listener);
  }
});

// App Launcher API
contextBridge.exposeInMainWorld("appLauncher", {
  launch: (appName, options) => ipcRenderer.invoke('app:launch', appName, options),
  launchWithArgs: (appName, args) => ipcRenderer.invoke('app:launch-with-args', appName, args),
  openURL: (url, browser) => ipcRenderer.invoke('app:open-url', url, browser),
  search: (searchTerm) => ipcRenderer.invoke('app:search', searchTerm),
  getAvailable: () => ipcRenderer.invoke('app:get-available'),
  exists: (appPath) => ipcRenderer.invoke('app:exists', appPath),
  launchMultiple: (appNames) => ipcRenderer.invoke('app:launch-multiple', appNames),
  getCommonApps: () => ipcRenderer.invoke('app:get-common'),
  
  // Custom app management
  addCustomApp: (name, path) => ipcRenderer.invoke('app:add-custom', name, path),
  removeCustomApp: (name) => ipcRenderer.invoke('app:remove-custom', name),
  getCustomApps: () => ipcRenderer.invoke('app:get-custom'),
  updateCustomApp: (name, newPath) => ipcRenderer.invoke('app:update-custom', name, newPath),
  browseAndAddApp: (name) => ipcRenderer.invoke('app:browse-and-add', name)
});

// Note: dragDrop API is exposed by the preload script automatically
```

---

## 🎨 Step 3: Add Drag & Drop Styles to HTML

Add to your `chat-input.html` in the `<head>` section:

```html
<!-- Drag & Drop Styles -->
<link rel="stylesheet" href="electron-api/drag-drop/styles.css">
```

---

## 💻 Step 4: Use in Your Renderer Code

Now you can use these APIs in your chat input renderer! Here are practical examples:

### Example 1: File Upload Button

```javascript
// In your chat-input.html or renderer JS
async function handleFileUpload() {
  // Open file dialog
  const file = await window.fileSystem.selectFile({
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (file) {
    console.log('Selected file:', file.fileName);
    console.log('File size:', file.size);
    
    // Read file content
    const content = await window.fileSystem.readFile(file.filePath);
    
    // Or read as buffer for binary files
    const buffer = await window.fileSystem.readFileBuffer(file.filePath);
    
    // Use the file...
    attachFileToChat(file);
  }
}
```

### Example 2: Drag & Drop Files into Chat

```javascript
// In your renderer JS
// Listen for dropped files
window.dragDrop.onFilesDropped((files) => {
  console.log(`${files.length} files dropped!`);
  
  files.forEach(file => {
    console.log('Dropped:', file.name, file.type, file.size);
    
    if (file.type === 'image') {
      // Handle image
      displayImagePreview(file.path);
    } else if (file.type === 'document') {
      // Handle document
      attachDocument(file);
    }
  });
});

// Alternative: Listen for processed files
window.fileSystem.onFilesReceived((files) => {
  files.forEach(file => {
    addFileToChat(file);
  });
});
```

### Example 3: Open Links in Browser

```javascript
// In your chat renderer
function handleLinkClick(url) {
  // Open external URL in browser
  window.shell.openExternal(url);
}

// Open local file
async function openLocalFile(filePath) {
  await window.shell.openFile(filePath);
}

// Show file in Explorer
function revealFile(filePath) {
  window.shell.showInFolder(filePath);
}
```

### Example 4: Network Status Indicator

```javascript
// In your chat renderer
let networkIndicator = document.getElementById('network-status');

// Check initial status
(async () => {
  const online = await window.network.isOnline();
  updateNetworkUI(online);
})();

// Listen for changes
window.network.onStatusChanged((data) => {
  updateNetworkUI(data.online);
  
  if (!data.online) {
    showOfflineWarning();
  } else {
    hideOfflineWarning();
  }
});

function updateNetworkUI(online) {
  networkIndicator.className = online ? 'online' : 'offline';
  networkIndicator.textContent = online ? '🟢 Online' : '🔴 Offline';
}
```

### Example 5: Open Any Application

```javascript
// In your chat renderer
async function openApplication(appName) {
  const result = await window.appLauncher.launch(appName);
  
  if (result.success) {
    console.log(`✅ Opened ${appName}`);
  } else {
    console.error(`❌ Failed to open ${appName}: ${result.error}`);
  }
}

// Open Chrome
await openApplication('chrome');

// Open VS Code
await openApplication('vscode');

// Open Spotify
await openApplication('spotify');

// Open Notepad
await openApplication('notepad');
```

### Example 5b: Add Custom Application Paths

```javascript
// Add a custom application
async function addCustomApp(name, path) {
  const result = await window.appLauncher.addCustomApp(name, path);
  
  if (result.success) {
    console.log(`✅ Added ${name} → ${result.path}`);
  } else {
    console.error(`❌ Failed: ${result.error}`);
  }
}

// Add custom apps with absolute paths
await addCustomApp('myapp', 'C:\\Program Files\\MyApp\\myapp.exe');
await addCustomApp('photoshop', 'C:\\Program Files\\Adobe\\Photoshop\\Photoshop.exe');
await addCustomApp('myeditor', '%LOCALAPPDATA%\\Programs\\MyEditor\\MyEditor.exe');

// Browse for application with file picker
async function browseAndAddApp() {
  const result = await window.appLauncher.browseAndAddApp('CustomApp');
  
  if (result.success) {
    console.log(`✅ Added app: ${result.path}`);
  } else if (result.canceled) {
    console.log('User canceled');
  }
}

// Get all custom apps
const customApps = await window.appLauncher.getCustomApps();
console.log('Custom apps:', customApps);
// { myapp: 'C:\\...\\myapp.exe', photoshop: 'C:\\...\\Photoshop.exe' }

// Remove a custom app
await window.appLauncher.removeCustomApp('myapp');

// Update a custom app path
await window.appLauncher.updateCustomApp('photoshop', 'D:\\Adobe\\Photoshop.exe');
```

### Example 6: Voice Command Integration

```javascript
// Parse voice/text commands
async function handleTextCommand(text) {
  const words = text.toLowerCase().split(' ');
  
  // "open chrome"
  if (words[0] === 'open' && words[1]) {
    const appName = words[1];
    const result = await window.appLauncher.launch(appName);
    
    return result.success 
      ? `✅ Opened ${appName}` 
      : `❌ Couldn't find ${appName}`;
  }
}

// User types: "open chrome" → launches Chrome
// User types: "open vscode" → launches VS Code
// User types: "open notepad" → launches Notepad
```

---

## 🎯 Practical Use Cases for Your Chat App

### 1. **File Attachments with Drag & Drop**

```javascript
// Create a drop zone in your chat input
const chatInput = document.getElementById('chat-input-area');
window.addDropZone(chatInput, 'chat-attachments');

// Handle dropped files
window.dragDrop.onFilesDropped(async (files) => {
  for (const file of files) {
    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large: ' + file.name);
      continue;
    }
    
    // Read and upload
    const buffer = await window.fileSystem.readFileBuffer(file.path);
    await uploadToChat(file.name, buffer);
  }
});
```

### 2. **Save Chat History**

```javascript
async function saveChatHistory() {
  const savePath = await window.fileSystem.saveFileDialog({
    defaultPath: 'chat-history.txt',
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'JSON', extensions: ['json'] }
    ]
  });
  
  if (savePath) {
    const chatContent = getChatContent();
    await window.fileSystem.writeFile(savePath, chatContent);
    
    // Show in folder
    window.shell.showInFolder(savePath);
  }
}
```

### 3. **Auto-Save on Network Loss**

```javascript
window.network.onStatusChanged(async (data) => {
  if (!data.online) {
    // Save draft automatically
    const paths = await window.fileSystem.getCommonPaths();
    const draftPath = `${paths.userData}/draft-${Date.now()}.json`;
    
    const draftData = {
      timestamp: new Date(),
      content: getCurrentChatContent()
    };
    
    await window.fileSystem.writeFile(
      draftPath,
      JSON.stringify(draftData, null, 2)
    );
    
    console.log('Draft saved:', draftPath);
  }
});
```

### 4. **Open App Data Folder**

```javascript
// Add a button to open app data folder
async function openAppDataFolder() {
  await window.shell.openAppData();
}

// Or open in terminal
async function openAppDataInTerminal() {
  const paths = await window.fileSystem.getCommonPaths();
  await window.shell.openPowerShell(paths.userData);
}
```

### 5. **Voice/Text Command to Open Apps**

```javascript
// Add to your chat input handler
async function processChatCommand(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check for "open" commands
  if (lowerMessage.startsWith('open ')) {
    const appName = lowerMessage.replace('open ', '').trim();
    
    // Try to launch the app
    const result = await window.appLauncher.launch(appName);
    
    if (result.success) {
      return `✅ Opened ${appName}`;
    } else {
      // Try searching for the app
      const found = await window.appLauncher.search(appName);
      
      if (found.length > 0) {
        return `Found: ${found.map(a => a.name).join(', ')}. Which one?`;
      }
      
      return `❌ Couldn't find ${appName}`;
    }
  }
}

// User types in chat:
// "open chrome" → Opens Chrome
// "open vscode" → Opens VS Code
// "open notepad" → Opens Notepad
// "open calculator" → Opens Calculator
```

### 6. **Quick Launch Menu**

```javascript
// Create a quick launch menu in your chat UI
const quickApps = [
  { name: 'Chrome', app: 'chrome', icon: '🌐' },
  { name: 'VS Code', app: 'vscode', icon: '💻' },
  { name: 'Discord', app: 'discord', icon: '💬' },
  { name: 'Spotify', app: 'spotify', icon: '🎵' },
  { name: 'Calculator', app: 'calculator', icon: '🔢' },
  { name: 'Terminal', app: 'terminal', icon: '⌨️' }
];

quickApps.forEach(({ name, app, icon }) => {
  const button = document.createElement('button');
  button.innerHTML = `${icon} ${name}`;
  button.onclick = () => window.appLauncher.launch(app);
  quickLaunchMenu.appendChild(button);
});
```

### 7. **Smart App Suggestions**

```javascript
// Suggest apps based on chat context
async function suggestApps(message) {
  const suggestions = [];
  
  if (message.includes('code') || message.includes('program')) {
    suggestions.push('vscode', 'notepad');
  }
  
  if (message.includes('browse') || message.includes('search')) {
    suggestions.push('chrome', 'firefox');
  }
  
  if (message.includes('music') || message.includes('listen')) {
    suggestions.push('spotify');
  }
  
  if (message.includes('chat') || message.includes('call')) {
    suggestions.push('discord', 'zoom', 'teams');
  }
  
  // Show suggestions
  const available = [];
  for (const app of suggestions) {
    const exists = await window.appLauncher.exists(app);
    if (exists) available.push(app);
  }
  
  return available;
}
```

---

## 🧪 Testing Your Integration

Add this test button to your `chat-input.html`:

```html
<button onclick="testNewAPIs()">Test New APIs</button>

<script>
async function testNewAPIs() {
  console.log('=== Testing New Electron APIs ===');
  
  // Test File System
  const paths = await window.fileSystem.getCommonPaths();
  console.log('✓ Common paths:', paths);
  
  // Test Shell
  const hasGit = await window.shell.commandExists('git');
  console.log('✓ Git installed:', hasGit);
  
  // Test Network
  const online = await window.network.isOnline();
  console.log('✓ Network online:', online);
  
  // Test detailed network
  const netInfo = await window.network.detailedCheck();
  console.log('✓ Network details:', netInfo);
  
  alert('Check console for results!');
}
</script>
```

---

## 🎨 UI Components You Can Add

### Network Status Badge

```html
<div id="network-status" class="network-badge">
  <span class="indicator"></span>
  <span class="text">Checking...</span>
</div>

<style>
.network-badge {
  position: fixed;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: rgba(0,0,0,0.8);
  border-radius: 5px;
  font-size: 12px;
  color: white;
}

.network-badge .indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.network-badge.offline .indicator {
  background: #ef4444;
}
</style>

<script>
window.network.onStatusChanged((data) => {
  const badge = document.getElementById('network-status');
  badge.className = 'network-badge ' + (data.online ? 'online' : 'offline');
  badge.querySelector('.text').textContent = data.online ? 'Online' : 'Offline';
});
</script>
```

### Drag & Drop Overlay

Already included in `drag-drop/styles.css`! Just make sure you linked it.

---

## 🔧 Cleanup on App Exit

Add to your `main.js` before `app.quit()`:

```javascript
app.on('before-quit', () => {
  // Stop network monitoring
  network.stopMonitoring();
  
  // Clear drag-drop handlers
  dragDrop.clearHandlers();
  
  console.log('Main: Cleaned up Electron API modules');
});
```

---

## 📝 Quick Reference

| API | Access | Example |
|-----|--------|---------|
| File System | `window.fileSystem` | `await window.fileSystem.selectFile()` |
| Drag & Drop | `window.dragDrop` | `window.dragDrop.onFilesDropped(callback)` |
| Shell | `window.shell` | `await window.shell.openFile(path)` |
| Network | `window.network` | `await window.network.check()` |

---

## 🚀 Next Steps

1. ✅ Add the code snippets above to `main.js`
2. ✅ Update `chat-input-preload.js`
3. ✅ Add CSS link to `chat-input.html`
4. ✅ Test with the test button
5. ✅ Integrate into your chat UI

Need help with any specific integration? Let me know!
