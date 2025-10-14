# Application Launcher API

Launch any application on your laptop from your Electron app. Open browsers, editors, communication apps, and more!

## Features

- 🚀 Launch any application by name or path
- 📱 Pre-configured common applications
- ⭐ **Custom app paths** - Add your own applications
- 🔍 Search for installed applications
- 🌐 Open URLs in specific browsers
- 📋 Get list of available apps
- 🎯 Launch with command-line arguments
- � Persistent storage of custom apps
- �🔗 Create application shortcuts
- 🖥️ Cross-platform support (Windows, macOS, Linux)

## Quick Start

### Main Process Setup

```javascript
const { ipcMain } = require('electron');
const appLauncher = require('./electron-api/app-launcher');

// Launch app by name
ipcMain.handle('app:launch', async (event, appName) => {
  return await appLauncher.launchApp(appName);
});

// Search for apps
ipcMain.handle('app:search', async (event, searchTerm) => {
  return await appLauncher.searchApps(searchTerm);
});

// Get available apps
ipcMain.handle('app:get-available', async () => {
  return await appLauncher.getAvailableApps();
});

// Add custom app
ipcMain.handle('app:add-custom', async (event, name, path) => {
  return await appLauncher.addCustomApp(name, path);
});

// Remove custom app
ipcMain.handle('app:remove-custom', async (event, name) => {
  return await appLauncher.removeCustomApp(name);
});
```

### Preload Script

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appLauncher', {
  launch: (appName, options) => ipcRenderer.invoke('app:launch', appName, options),
  search: (searchTerm) => ipcRenderer.invoke('app:search', searchTerm),
  getAvailable: () => ipcRenderer.invoke('app:get-available'),
  launchWithArgs: (appName, args) => ipcRenderer.invoke('app:launch-with-args', appName, args),
  openURL: (url, browser) => ipcRenderer.invoke('app:open-url', url, browser),
  
  // Custom app management
  addCustomApp: (name, path) => ipcRenderer.invoke('app:add-custom', name, path),
  removeCustomApp: (name) => ipcRenderer.invoke('app:remove-custom', name),
  getCustomApps: () => ipcRenderer.invoke('app:get-custom'),
  browseAndAddApp: (name) => ipcRenderer.invoke('app:browse-and-add', name)
});
```

### Renderer Usage

```javascript
// Launch Chrome
await window.appLauncher.launch('chrome');

// Launch VS Code
await window.appLauncher.launch('vscode');

// Launch Notepad
await window.appLauncher.launch('notepad');

// Add your own custom application
await window.appLauncher.addCustomApp('myapp', 'C:\\MyApps\\myapp.exe');

// Launch your custom app
await window.appLauncher.launch('myapp');
```

## API Reference

### Launch Applications

#### `launchApp(appName, options)`
Launch an application by name or path.

```javascript
// Launch by common name
const result = await appLauncher.launchApp('chrome');
console.log(result);
// {
//   success: true,
//   appName: 'chrome',
//   appPath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//   pid: 12345,
//   launched: Date
// }

// Launch by full path
await appLauncher.launchApp('C:\\Program Files\\MyApp\\app.exe');

// Launch with options
await appLauncher.launchApp('vscode', {
  args: ['C:\\Projects\\myproject'],
  detached: true
});
```

**Options:**
```javascript
{
  args: [],           // Command-line arguments
  detached: true      // Run detached from parent process
}
```

#### `launchWithArgs(appName, args)`
Launch application with command-line arguments.

```javascript
// Open VS Code with a folder
await appLauncher.launchWithArgs('vscode', ['C:\\Projects\\myproject']);

// Open Notepad with a file
await appLauncher.launchWithArgs('notepad', ['C:\\file.txt']);

// Open Chrome with a URL
await appLauncher.launchWithArgs('chrome', ['https://github.com']);
```

#### `openURL(url, browser)`
Open URL in default or specific browser.

```javascript
// Open in default browser
await appLauncher.openURL('https://github.com');

// Open in Chrome
await appLauncher.openURL('https://github.com', 'chrome');

// Open in Firefox
await appLauncher.openURL('https://github.com', 'firefox');
```

### Discover Applications

#### `getAvailableApps()`
Get list of all available common applications.

```javascript
const apps = await appLauncher.getAvailableApps();
console.log(apps);
// [
//   {
//     name: 'chrome',
//     path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//     category: 'browser'
//   },
//   {
//     name: 'vscode',
//     path: 'C:\\Users\\...\\Code.exe',
//     category: 'development'
//   },
//   ...
// ]
```

**Categories:**
- `browser` - Web browsers
- `development` - Code editors, IDEs
- `communication` - Chat, video apps
- `utility` - System utilities
- `office` - Office applications
- `media` - Media players
- `other` - Other applications

#### `searchApps(searchTerm)`
Search for installed applications.

```javascript
// Search for Chrome
const results = await appLauncher.searchApps('chrome');

// Search for VS Code
const results = await appLauncher.searchApps('code');

// Results:
// [
//   {
//     name: 'chrome.exe',
//     path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
//   },
//   ...
// ]
```

#### `appExists(appPath)`
Check if an application exists.

```javascript
const exists = await appLauncher.appExists('chrome');
console.log('Chrome installed:', exists);

const exists2 = await appLauncher.appExists('C:\\MyApp\\app.exe');
console.log('Custom app exists:', exists2);
```

### Common Applications

Pre-configured application names you can use:

#### **Browsers**
- `chrome` - Google Chrome
- `firefox` - Mozilla Firefox
- `edge` - Microsoft Edge
- `brave` - Brave Browser

#### **Development**
- `vscode` - Visual Studio Code
- `notepad` - Notepad
- `notepadplusplus` - Notepad++
- `sublimetext` - Sublime Text

#### **Communication**
- `discord` - Discord
- `slack` - Slack
- `zoom` - Zoom
- `teams` - Microsoft Teams

#### **Utilities**
- `calculator` - Calculator
- `paint` - Paint
- `explorer` - File Explorer
- `cmd` - Command Prompt
- `powershell` - PowerShell
- `terminal` - Windows Terminal

#### **Office**
- `word` - Microsoft Word
- `excel` - Microsoft Excel
- `powerpoint` - Microsoft PowerPoint

#### **Media**
- `spotify` - Spotify
- `vlc` - VLC Media Player

#### **Other**
- `steam` - Steam
- `postman` - Postman

### Advanced Features

#### `launchMultiple(appNames)`
Launch multiple applications at once.

```javascript
const results = await appLauncher.launchMultiple([
  'chrome',
  'vscode',
  'spotify'
]);

results.forEach(result => {
  console.log(`${result.appName}: ${result.success ? 'launched' : 'failed'}`);
});
```

#### `getCommonApps()`
Get the full list of pre-configured apps.

```javascript
const commonApps = appLauncher.getCommonApps();
console.log(Object.keys(commonApps));
// ['chrome', 'firefox', 'vscode', 'discord', ...]
```

---

## 🌟 Custom Application Paths

Add your own applications that aren't in the common list!

### `addCustomApp(name, path)`
Add a custom application path.

```javascript
// Add Photoshop
const result = await appLauncher.addCustomApp(
  'photoshop',
  'C:\\Program Files\\Adobe\\Photoshop 2024\\Photoshop.exe'
);

if (result.success) {
  console.log(`✅ Added ${result.name} → ${result.path}`);
  // Now you can launch it
  await appLauncher.launchApp('photoshop');
}

// Add custom game
await appLauncher.addCustomApp(
  'mygame',
  'D:\\Games\\MyGame\\game.exe'
);

// Add portable app with environment variable
await appLauncher.addCustomApp(
  'portableapp',
  '%USERPROFILE%\\Desktop\\PortableApps\\app.exe'
);
```

**Environment Variables Supported:**
- Windows: `%USERPROFILE%`, `%APPDATA%`, `%LOCALAPPDATA%`, `%PROGRAMFILES%`
- macOS/Linux: `$HOME`, `~`

### `browseAndAddApp(name)`
Open file picker to add a custom application.

```javascript
const result = await appLauncher.browseAndAddApp('MyCustomApp');

if (result.success) {
  console.log(`Added: ${result.path}`);
} else if (result.canceled) {
  console.log('User canceled');
}
```

### `removeCustomApp(name)`
Remove a custom application.

```javascript
const result = await appLauncher.removeCustomApp('photoshop');

if (result.success) {
  console.log(`✅ Removed ${result.name}`);
}
```

### `getCustomApps()`
Get all custom applications.

```javascript
const customApps = await appLauncher.getCustomApps();
console.log(customApps);
// {
//   photoshop: 'C:\\Program Files\\Adobe\\...\\Photoshop.exe',
//   mygame: 'D:\\Games\\MyGame\\game.exe',
//   portableapp: 'C:\\Users\\...\\Desktop\\PortableApps\\app.exe'
// }
```

### `updateCustomApp(name, newPath)`
Update a custom application's path.

```javascript
const result = await appLauncher.updateCustomApp(
  'photoshop',
  'D:\\Adobe\\Photoshop 2024\\Photoshop.exe'
);

if (result.success) {
  console.log(`✅ Updated ${result.name} → ${result.path}`);
}
```

### Custom Apps Storage

Custom applications are automatically saved to:
- Windows: `%APPDATA%\<AppName>\custom-apps.json`
- macOS: `~/Library/Application Support/<AppName>/custom-apps.json`
- Linux: `~/.config/<AppName>/custom-apps.json`

**Example `custom-apps.json`:**
```json
{
  "photoshop": "C:\\Program Files\\Adobe\\Photoshop 2024\\Photoshop.exe",
  "mygame": "D:\\Games\\MyGame\\game.exe",
  "portableapp": "C:\\Users\\John\\Desktop\\PortableApps\\app.exe"
}
```

### Priority: Custom Apps First

When launching apps, the launcher checks:
1. **Custom apps** (your added apps) - **Higher priority**
2. Common apps (pre-configured apps)

This means you can override common app paths by adding a custom app with the same name!

```javascript
// Override default Chrome path
await appLauncher.addCustomApp(
  'chrome',
  'D:\\Browsers\\Chrome\\chrome.exe'
);

// Now this uses your custom path
await appLauncher.launchApp('chrome');
```

---

#### `createShortcut(appName, commandName)`
Create a shortcut command for an app.

```javascript
const chromeShortcut = appLauncher.createShortcut('chrome', 'browser');
console.log(chromeShortcut);
// {
//   command: 'browser',
//   appName: 'chrome',
//   appPath: '...',
//   launch: [Function]
// }

// Launch using shortcut
await chromeShortcut.launch();
```

## Complete Example

```javascript
// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const appLauncher = require('./electron-api/app-launcher');
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

// Setup App Launcher IPC handlers
function setupAppLauncherHandlers() {
  // Launch application
  ipcMain.handle('app:launch', async (event, appName, options) => {
    return await appLauncher.launchApp(appName, options);
  });

  // Launch with arguments
  ipcMain.handle('app:launch-with-args', async (event, appName, args) => {
    return await appLauncher.launchWithArgs(appName, args);
  });

  // Open URL
  ipcMain.handle('app:open-url', async (event, url, browser) => {
    return await appLauncher.openURL(url, browser);
  });

  // Search apps
  ipcMain.handle('app:search', async (event, searchTerm) => {
    return await appLauncher.searchApps(searchTerm);
  });

  // Get available apps
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
}

app.whenReady().then(() => {
  createWindow();
  setupAppLauncherHandlers();
});
```

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appLauncher', {
  launch: (appName, options) => ipcRenderer.invoke('app:launch', appName, options),
  launchWithArgs: (appName, args) => ipcRenderer.invoke('app:launch-with-args', appName, args),
  openURL: (url, browser) => ipcRenderer.invoke('app:open-url', url, browser),
  search: (searchTerm) => ipcRenderer.invoke('app:search', searchTerm),
  getAvailable: () => ipcRenderer.invoke('app:get-available'),
  exists: (appPath) => ipcRenderer.invoke('app:exists', appPath),
  launchMultiple: (appNames) => ipcRenderer.invoke('app:launch-multiple', appNames),
  getCommonApps: () => ipcRenderer.invoke('app:get-common')
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>App Launcher</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    
    .app-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    
    .app-card {
      padding: 20px;
      border: 2px solid #ddd;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .app-card:hover {
      border-color: #3b82f6;
      background: #eff6ff;
      transform: translateY(-2px);
    }
    
    .app-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    
    .app-name {
      font-weight: bold;
      text-transform: capitalize;
    }
    
    .search-box {
      width: 100%;
      padding: 10px;
      font-size: 16px;
      border: 2px solid #ddd;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <h1>🚀 Application Launcher</h1>
  
  <input 
    type="text" 
    class="search-box" 
    placeholder="Search applications..." 
    id="searchBox"
  />
  
  <div class="app-grid" id="appGrid"></div>

  <script>
    const appIcons = {
      chrome: '🌐',
      firefox: '🦊',
      edge: '🔷',
      vscode: '💻',
      notepad: '📝',
      discord: '💬',
      slack: '💼',
      calculator: '🔢',
      explorer: '📁',
      spotify: '🎵',
      zoom: '📹',
      terminal: '⌨️',
      powershell: '🔵'
    };

    // Load available applications
    async function loadApps() {
      const apps = await window.appLauncher.getAvailable();
      const grid = document.getElementById('appGrid');
      
      grid.innerHTML = '';
      
      apps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
          <div class="app-icon">${appIcons[app.name] || '📦'}</div>
          <div class="app-name">${app.name}</div>
          <div class="app-category">${app.category}</div>
        `;
        
        card.addEventListener('click', async () => {
          const result = await window.appLauncher.launch(app.name);
          if (result.success) {
            console.log(`✅ Launched ${app.name}`);
          } else {
            console.error(`❌ Failed to launch ${app.name}: ${result.error}`);
            alert(`Failed to launch ${app.name}`);
          }
        });
        
        grid.appendChild(card);
      });
    }

    // Search applications
    const searchBox = document.getElementById('searchBox');
    let searchTimeout;
    
    searchBox.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        const searchTerm = e.target.value;
        
        if (searchTerm.length < 2) {
          loadApps();
          return;
        }
        
        const results = await window.appLauncher.search(searchTerm);
        const grid = document.getElementById('appGrid');
        
        grid.innerHTML = '';
        
        results.forEach(app => {
          const card = document.createElement('div');
          card.className = 'app-card';
          card.innerHTML = `
            <div class="app-icon">🔍</div>
            <div class="app-name">${app.name}</div>
            <div style="font-size: 10px; color: #666; margin-top: 5px;">
              ${app.path}
            </div>
          `;
          
          card.addEventListener('click', async () => {
            const result = await window.appLauncher.launch(app.path);
            if (result.success) {
              console.log(`✅ Launched ${app.name}`);
            } else {
              console.error(`❌ Failed: ${result.error}`);
              alert(`Failed to launch ${app.name}`);
            }
          });
          
          grid.appendChild(card);
        });
      }, 300);
    });

    // Load apps on page load
    loadApps();
  </script>
</body>
</html>
```

## Use Cases

### 1. Quick Launcher UI

```javascript
// Create app launcher buttons
const apps = ['chrome', 'vscode', 'discord', 'spotify'];

apps.forEach(appName => {
  const button = document.createElement('button');
  button.textContent = appName;
  button.onclick = () => window.appLauncher.launch(appName);
  document.body.appendChild(button);
});
```

### 2. Voice/Text Command Integration

```javascript
// Parse text commands
async function handleCommand(text) {
  const words = text.toLowerCase().split(' ');
  
  if (words[0] === 'open' && words[1]) {
    const appName = words[1];
    const result = await window.appLauncher.launch(appName);
    
    if (result.success) {
      return `✅ Opened ${appName}`;
    } else {
      return `❌ Couldn't find ${appName}`;
    }
  }
}

// Examples:
// "open chrome" → launches Chrome
// "open vscode" → launches VS Code
// "open notepad" → launches Notepad
```

### 3. Quick Actions Menu

```javascript
const quickActions = [
  {
    name: 'Browse Web',
    action: () => window.appLauncher.launch('chrome')
  },
  {
    name: 'Code Editor',
    action: () => window.appLauncher.launch('vscode')
  },
  {
    name: 'Chat',
    action: () => window.appLauncher.launch('discord')
  },
  {
    name: 'Music',
    action: () => window.appLauncher.launch('spotify')
  }
];
```

### 4. Open Files in Specific Apps

```javascript
// Open file in VS Code
await window.appLauncher.launchWithArgs('vscode', [
  'C:\\Projects\\myproject\\index.js'
]);

// Open text file in Notepad++
await window.appLauncher.launchWithArgs('notepadplusplus', [
  'C:\\documents\\notes.txt'
]);

// Open URL in specific browser
await window.appLauncher.launchWithArgs('firefox', [
  'https://github.com'
]);
```

### 5. Workflow Automation

```javascript
// Launch development environment
async function launchDevEnvironment() {
  await window.appLauncher.launchMultiple([
    'vscode',
    'chrome',
    'terminal',
    'postman'
  ]);
}

// Launch communication apps
async function launchCommunication() {
  await window.appLauncher.launchMultiple([
    'discord',
    'slack',
    'teams'
  ]);
}
```

## Platform Differences

### Windows
- Uses `.exe` executables
- Supports `start` command
- Path separator: `\`
- Environment variables: `%VARIABLE%`

### macOS
- Uses `.app` bundles
- Uses `open -a` command
- Path separator: `/`
- Environment variables: `$VARIABLE`

### Linux
- Direct executable paths
- Command-based launching
- Path separator: `/`
- Environment variables: `$VARIABLE`

## Security Considerations

⚠️ **Important:**

1. **Path Validation**: Always validate paths before launching
2. **User Permission**: Ask before launching applications
3. **Argument Sanitization**: Sanitize command-line arguments
4. **Known Apps Only**: Prefer common app names over arbitrary paths
5. **Error Handling**: Handle launch failures gracefully

```javascript
// Good - using known app name
await window.appLauncher.launch('chrome');

// Be careful - using user input
const userApp = getUserInput();
const exists = await window.appLauncher.exists(userApp);
if (exists) {
  await window.appLauncher.launch(userApp);
}
```

## Troubleshooting

**Q: App not launching**
A: Check if the app is installed using `appExists()`

**Q: Custom app path not working**
A: Use full path with `.exe` extension on Windows

**Q: App launches but immediately closes**
A: Set `detached: true` in options

**Q: Can't find app by name**
A: Use `getAvailableApps()` to see what's detected

**Q: Search returns no results**
A: Try searching in specific directories or use full path

## Advanced Examples

### Custom App Manager UI

```javascript
// HTML UI for managing custom apps
async function loadCustomApps() {
  const apps = await window.appLauncher.getCustomApps();
  
  const list = document.getElementById('custom-apps-list');
  list.innerHTML = '';
  
  Object.entries(apps).forEach(([name, path]) => {
    const item = document.createElement('div');
    item.className = 'custom-app-item';
    item.innerHTML = `
      <div class="app-info">
        <strong>${name}</strong>
        <small>${path}</small>
      </div>
      <div class="app-actions">
        <button onclick="launchCustomApp('${name}')">Launch</button>
        <button onclick="removeCustomApp('${name}')">Remove</button>
      </div>
    `;
    list.appendChild(item);
  });
}

async function launchCustomApp(name) {
  const result = await window.appLauncher.launch(name);
  if (result.success) {
    showNotification(`✅ Launched ${name}`);
  } else {
    showNotification(`❌ Failed: ${result.error}`);
  }
}

async function removeCustomApp(name) {
  if (confirm(`Remove ${name}?`)) {
    await window.appLauncher.removeCustomApp(name);
    await loadCustomApps(); // Refresh list
  }
}

async function addCustomApp() {
  const name = prompt('Enter app name (e.g., "myapp"):');
  if (!name) return;
  
  const result = await window.appLauncher.browseAndAddApp(name);
  
  if (result.success) {
    showNotification(`✅ Added ${name}!`);
    await loadCustomApps(); // Refresh list
  }
}

// Load on page load
window.addEventListener('DOMContentLoaded', loadCustomApps);
```

### Import/Export Custom Apps

```javascript
// Export custom apps to JSON file
async function exportCustomApps() {
  const apps = await window.appLauncher.getCustomApps();
  const json = JSON.stringify(apps, null, 2);
  
  // Create download link
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'custom-apps-backup.json';
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ Exported custom apps');
}

// Import custom apps from JSON file
async function importCustomApps() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const text = await file.text();
    const apps = JSON.parse(text);
    
    let imported = 0;
    for (const [name, path] of Object.entries(apps)) {
      const result = await window.appLauncher.addCustomApp(name, path);
      if (result.success) imported++;
    }
    
    console.log(`✅ Imported ${imported} apps`);
    await loadCustomApps(); // Refresh UI
  };
  
  input.click();
}
```

### Voice Command Integration

```javascript
// Parse text commands to launch apps
async function handleTextCommand(text) {
  const words = text.toLowerCase().split(' ');
  
  // "open chrome"
  if (words[0] === 'open' && words[1]) {
    const appName = words[1];
    const result = await window.appLauncher.launch(appName);
    
    if (result.success) {
      return `✅ Opened ${appName}`;
    } else {
      // Try searching
      const matches = await window.appLauncher.search(appName);
      if (matches.length > 0) {
        return `Did you mean: ${matches.map(m => m.name).join(', ')}?`;
      }
      return `❌ Couldn't find ${appName}. Try adding it with "add app ${appName}"`;
    }
  }
  
  // "add app photoshop"
  if (words[0] === 'add' && words[1] === 'app' && words[2]) {
    const appName = words[2];
    const result = await window.appLauncher.browseAndAddApp(appName);
    
    if (result.success) {
      return `✅ Added ${appName} → ${result.path}`;
    } else if (result.canceled) {
      return 'Canceled';
    }
    return `❌ Failed to add ${appName}`;
  }
  
  return 'Unknown command';
}

// Usage
const response = await handleTextCommand('open chrome');
console.log(response); // "✅ Opened chrome"

const response2 = await handleTextCommand('add app photoshop');
console.log(response2); // Opens file picker
```

### Context Menu Integration

```javascript
// Add "Open with..." context menu
const apps = await window.appLauncher.getAvailable();
const editors = apps.filter(app => app.category === 'development');

// Show context menu with editors
contextMenu.show([
  ...editors.map(app => ({
    label: `Open with ${app.name}`,
    click: () => window.appLauncher.launchWithArgs(app.name, [filePath])
  }))
]);
```

### Smart App Suggestions

```javascript
async function suggestApps(fileExtension) {
  const suggestions = {
    '.txt': ['notepad', 'notepadplusplus', 'vscode'],
    '.js': ['vscode', 'sublimetext'],
    '.html': ['chrome', 'firefox', 'vscode'],
    '.pdf': ['chrome', 'edge']
  };

  const appNames = suggestions[fileExtension] || [];
  const available = [];

  for (const name of appNames) {
    const exists = await window.appLauncher.exists(name);
    if (exists) available.push(name);
  }

  return available;
}
```

## Performance Tips

- Cache available apps list
- Use `appExists()` before launching
- Launch with `detached: true` for better performance
- Search in specific directories for faster results
- Limit search depth to avoid slow scans

---

**Ready to integrate?** Check the integration guide in the main documentation!
