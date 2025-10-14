# Shell Integration API

Provides shell operations for opening files, folders, URLs with default applications, and executing system commands.

## Features

- 🗂️ Open files with default applications
- 🌐 Open URLs in browser
- 📁 Show files in file manager
- 🗑️ Move files to trash
- 💻 Open terminal/PowerShell
- ⚙️ Execute shell commands
- 🔍 Check command availability
- 📍 App-specific operations
- 📋 List locally available common applications (heuristic)

## Quick Start

### Main Process Setup

```javascript
const { app, ipcMain } = require('electron');
const shell = require('./electron-api/shell');

// Setup IPC handlers
ipcMain.handle('shell:open-file', async (event, filePath) => {
  return await shell.openFile(filePath);
});

ipcMain.handle('shell:open-url', async (event, url) => {
  return await shell.openExternal(url);
});

ipcMain.handle('shell:show-in-folder', (event, filePath) => {
  shell.showInFolder(filePath);
});
```

### Preload Script

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shell', {
  openFile: (filePath) => ipcRenderer.invoke('shell:open-file', filePath),
  openUrl: (url) => ipcRenderer.invoke('shell:open-url', url),
  showInFolder: (filePath) => ipcRenderer.invoke('shell:show-in-folder', filePath)
});
```

### Renderer Usage

```javascript
// Open a file
await window.shell.openFile('C:\\Users\\Documents\\file.pdf');

// Open URL
await window.shell.openUrl('https://github.com');

// Show in folder
window.shell.showInFolder('C:\\Users\\Documents\\file.pdf');
```

## API Reference

### File Operations

#### `openFile(filePath)`
Open a file with the default application.

```javascript
const error = await shell.openFile('/path/to/document.pdf');
if (error) {
  console.error('Failed to open:', error);
} else {
  console.log('File opened successfully');
}
```

**Supported File Types:**
- Documents: PDF, DOC, DOCX, TXT
- Images: JPG, PNG, GIF, SVG
- Videos: MP4, AVI, MOV
- Audio: MP3, WAV, OGG
- Archives: ZIP, RAR, 7Z
- Any file with a default app association

#### `openFolder(folderPath)`
Open a folder in the file manager.

```javascript
await shell.openFolder('/path/to/folder');
```

#### `showInFolder(filePath)`
Show a file in its containing folder.

```javascript
shell.showInFolder('/path/to/file.txt');
```

**Platform Behavior:**
- **Windows**: Opens Explorer and selects the file
- **macOS**: Opens Finder and selects the file
- **Linux**: Opens file manager and navigates to folder

#### `moveToTrash(filePath)`
Move a file to the trash/recycle bin.

```javascript
await shell.moveToTrash('/path/to/file.txt');
```

**Note**: This doesn't permanently delete the file. It can be recovered from trash.

### External Operations

#### `openExternal(url)`
Open a URL in the default web browser.

```javascript
await shell.openExternal('https://github.com');
await shell.openExternal('mailto:user@example.com');
await shell.openExternal('tel:+1234567890');
```

**Supported Protocols:**
- `http://` and `https://`
- `mailto:`
- `tel:`
- `file://`
- Custom protocol handlers

#### `openWith(filePath, appPath)`
Open a file with a specific application.

```javascript
// Open with specific app
await shell.openWith(
  'C:\\Users\\Documents\\image.jpg',
  'C:\\Program Files\\Paint.NET\\PaintDotNet.exe'
);
```

**Windows Example:**
```javascript
await shell.openWith(
  'C:\\file.txt',
  'C:\\Program Files\\Notepad++\\notepad++.exe'
);
```

**macOS Example:**
```javascript
await shell.openWith(
  '/Users/file.txt',
  '/Applications/Sublime Text.app'
);
```

#### `getDefaultApp(filePath)`
Get the default application for a file type.

```javascript
const defaultApp = await shell.getDefaultApp('document.pdf');
console.log('Default app:', defaultApp);
```

### Terminal Operations

#### `openTerminal(dirPath)`
Open system terminal at a specific directory.

```javascript
await shell.openTerminal('/path/to/project');
```

**Platform Behavior:**
- **Windows**: Opens Command Prompt
- **macOS**: Opens Terminal.app
- **Linux**: Opens gnome-terminal or xterm

#### `openPowerShell(dirPath)` (Windows only)
Open PowerShell at a specific directory.

```javascript
if (process.platform === 'win32') {
  await shell.openPowerShell('C:\\Users\\Projects');
}
```

### App Operations

#### `showAppInFolder()`
Reveal the application executable in file manager.

```javascript
shell.showAppInFolder();
```

#### `openAppDataFolder()`
Open the application's data folder.

```javascript
await shell.openAppDataFolder();
```

**Common Paths:**
- **Windows**: `C:\Users\<user>\AppData\Roaming\<app-name>`
- **macOS**: `~/Library/Application Support/<app-name>`
- **Linux**: `~/.config/<app-name>`

#### `openLogsFolder()`
Open the application's logs folder.
#### `getAvailableApplications()`
Return a heuristic list of common applications detected on the current machine. This does a fast check of well-known install paths (no deep scanning) and only includes apps that actually exist.

```javascript
const apps = shell.getAvailableApplications();
apps.forEach(app => {
  console.log(app.name, '→', app.path);
});
```

Example output (Windows):
```json
[
  { "name": "chrome", "path": "C:/Program Files/Google/Chrome/Application/chrome.exe" },
  { "name": "vscode", "path": "C:/Users/Me/AppData/Local/Programs/Microsoft VS Code/Code.exe" },
  { "name": "node", "path": "C:/Program Files/nodejs/node.exe" }
]
```

Use this to power pickers or quick-launch menus. Combine with a custom apps feature to merge built-in detection with user-defined paths.


```javascript
await shell.openLogsFolder();
```

### Command Execution

#### `executeCommand(command, options)`
Execute a shell command.

```javascript
const result = await shell.executeCommand('dir', {
  cwd: 'C:\\Users',
  timeout: 5000
});

if (result.success) {
  console.log('Output:', result.stdout);
} else {
  console.error('Error:', result.stderr);
}
```

**Options:**
```javascript
{
  cwd: '/path/to/working/directory',  // Working directory
  timeout: 30000,                      // Timeout in ms (default: 30000)
  maxBuffer: 1024 * 1024              // Max buffer size (default: 1MB)
}
```

**Examples:**

```javascript
// List files (Windows)
const files = await shell.executeCommand('dir');

// List files (macOS/Linux)
const files = await shell.executeCommand('ls -la');

// Git status
const git = await shell.executeCommand('git status', {
  cwd: '/path/to/repo'
});

// Node version
const node = await shell.executeCommand('node --version');
```

#### `commandExists(command)`
Check if a command is available in PATH.

```javascript
const hasGit = await shell.commandExists('git');
const hasNode = await shell.commandExists('node');
const hasPython = await shell.commandExists('python');

console.log('Git available:', hasGit);
```

### System Information

#### `getEnvironment()`
Get all environment variables.

```javascript
const env = shell.getEnvironment();
console.log('PATH:', env.PATH);
console.log('HOME:', env.HOME);
console.log('USER:', env.USER);
```

#### `getSystemPath()`
Get system PATH as an array.

```javascript
const pathDirs = shell.getSystemPath();
pathDirs.forEach(dir => console.log(dir));
```

### Miscellaneous

#### `beep()`
Play system beep sound.

```javascript
shell.beep();
```

## Complete Example

```javascript
// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const shell = require('./electron-api/shell');
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

// Setup all shell IPC handlers
function setupShellHandlers() {
  // File operations
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

  // External operations
  ipcMain.handle('shell:open-external', async (event, url) => {
    return await shell.openExternal(url);
  });

  ipcMain.handle('shell:open-with', async (event, filePath, appPath) => {
    return await shell.openWith(filePath, appPath);
  });

  // Terminal operations
  ipcMain.handle('shell:open-terminal', async (event, dirPath) => {
    return await shell.openTerminal(dirPath);
  });

  ipcMain.handle('shell:open-powershell', async (event, dirPath) => {
    return await shell.openPowerShell(dirPath);
  });

  // App operations
  ipcMain.handle('shell:show-app-in-folder', () => {
    shell.showAppInFolder();
  });

  ipcMain.handle('shell:open-app-data', async () => {
    return await shell.openAppDataFolder();
  });

  ipcMain.handle('shell:open-logs', async () => {
    return await shell.openLogsFolder();
  });

  // Command execution
  ipcMain.handle('shell:execute', async (event, command, options) => {
    return await shell.executeCommand(command, options);
  });

  ipcMain.handle('shell:command-exists', async (event, command) => {
    return await shell.commandExists(command);
  });

  // System info
  ipcMain.handle('shell:get-environment', () => {
    return shell.getEnvironment();
  });

  ipcMain.handle('shell:get-path', () => {
    return shell.getSystemPath();
  });

  // Applications
  ipcMain.handle('shell:get-available-apps', () => {
    return shell.getAvailableApplications();
  });

  // Misc
  ipcMain.handle('shell:beep', () => {
    shell.beep();
  });
}

app.whenReady().then(() => {
  createWindow();
  setupShellHandlers();
});
```

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shell', {
  // File operations
  openFile: (filePath) => ipcRenderer.invoke('shell:open-file', filePath),
  openFolder: (folderPath) => ipcRenderer.invoke('shell:open-folder', folderPath),
  showInFolder: (filePath) => ipcRenderer.invoke('shell:show-in-folder', filePath),
  moveToTrash: (filePath) => ipcRenderer.invoke('shell:move-to-trash', filePath),
  
  // External operations
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  openWith: (filePath, appPath) => ipcRenderer.invoke('shell:open-with', filePath, appPath),
  
  // Terminal operations
  openTerminal: (dirPath) => ipcRenderer.invoke('shell:open-terminal', dirPath),
  openPowerShell: (dirPath) => ipcRenderer.invoke('shell:open-powershell', dirPath),
  
  // App operations
  showAppInFolder: () => ipcRenderer.invoke('shell:show-app-in-folder'),
  openAppData: () => ipcRenderer.invoke('shell:open-app-data'),
  openLogs: () => ipcRenderer.invoke('shell:open-logs'),
  
  // Command execution
  execute: (command, options) => ipcRenderer.invoke('shell:execute', command, options),
  commandExists: (command) => ipcRenderer.invoke('shell:command-exists', command),
  
  // System info
  getEnvironment: () => ipcRenderer.invoke('shell:get-environment'),
  getSystemPath: () => ipcRenderer.invoke('shell:get-path'),
  getAvailableApplications: () => ipcRenderer.invoke('shell:get-available-apps'),
  
  // Misc
  beep: () => ipcRenderer.invoke('shell:beep')
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Shell Integration Example</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    button { margin: 5px; padding: 10px 20px; }
    .section { margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Shell Integration Demo</h1>

  <div class="section">
    <h2>File Operations</h2>
    <button id="openFile">Open File</button>
    <button id="showInFolder">Show in Folder</button>
    <button id="openAppData">Open App Data</button>
  <button id="listApps">List Apps</button>
  </div>

  <div class="section">
    <h2>External Links</h2>
    <button id="openGitHub">Open GitHub</button>
    <button id="openEmail">Send Email</button>
  </div>

  <div class="section">
    <h2>Terminal</h2>
    <button id="openTerminal">Open Terminal</button>
    <button id="openPowerShell">Open PowerShell</button>
  </div>

  <div class="section">
    <h2>Commands</h2>
    <button id="checkGit">Check Git</button>
    <button id="nodeVersion">Node Version</button>
  </div>

  <div id="output"></div>

  <script>
    const output = document.getElementById('output');

    function log(message) {
      output.innerHTML += `<p>${message}</p>`;
    }

    document.getElementById('openFile').addEventListener('click', async () => {
      // In real app, you'd get this from file dialog
      const error = await window.shell.openFile('C:\\Windows\\System32\\notepad.exe');
      log(error ? `Error: ${error}` : 'File opened');
    });

    document.getElementById('showInFolder').addEventListener('click', () => {
      window.shell.showAppInFolder();
      log('Showing app in folder');
    });

    document.getElementById('openAppData').addEventListener('click', async () => {
      await window.shell.openAppData();
      log('App data folder opened');
    });

    document.getElementById('openGitHub').addEventListener('click', async () => {
      await window.shell.openExternal('https://github.com');
      log('Opening GitHub');
    });

    document.getElementById('openEmail').addEventListener('click', async () => {
      await window.shell.openExternal('mailto:example@example.com');
      log('Opening email client');
    });

    document.getElementById('openTerminal').addEventListener('click', async () => {
      const env = await window.shell.getEnvironment();
      await window.shell.openTerminal(env.USERPROFILE || env.HOME);
      log('Terminal opened');
    });

    document.getElementById('openPowerShell').addEventListener('click', async () => {
      const env = await window.shell.getEnvironment();
      await window.shell.openPowerShell(env.USERPROFILE);
      log('PowerShell opened');
    });

    document.getElementById('checkGit').addEventListener('click', async () => {
      const hasGit = await window.shell.commandExists('git');
      log(`Git available: ${hasGit}`);
    });

    document.getElementById('nodeVersion').addEventListener('click', async () => {
      const result = await window.shell.execute('node --version');
      log(`Node version: ${result.stdout.trim()}`);
    });

    document.getElementById('listApps').addEventListener('click', async () => {
      const apps = await window.shell.getAvailableApplications();
      log('Available apps: ' + apps.map(a => a.name).join(', '));
    });
  </script>
</body>
</html>
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Command Injection**: Always sanitize user input before executing commands
2. **Path Validation**: Validate file paths to prevent directory traversal
3. **URL Validation**: Verify URLs before opening externally
4. **User Confirmation**: Ask for confirmation before executing destructive operations
5. **Sandbox**: Consider sandboxing command execution

```javascript
// Bad - vulnerable to injection
const result = await shell.executeCommand(`del ${userInput}`);

// Good - validate and sanitize
if (/^[a-zA-Z0-9_\-\.]+$/.test(userInput)) {
  const result = await shell.executeCommand(`del ${userInput}`);
}
```

## Platform Differences

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| File Explorer | Explorer | Finder | Varies |
| Terminal | CMD/PowerShell | Terminal.app | gnome-terminal/xterm |
| Trash | Recycle Bin | Trash | Trash |
| Path Separator | `\` | `/` | `/` |
| Line Endings | CRLF | LF | LF |
