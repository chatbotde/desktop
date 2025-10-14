# Custom Application Paths Feature

## Overview

The App Launcher now supports **custom application paths**, allowing users to add any application on their system beyond the pre-configured common apps list.

## Key Features

✅ **Add Custom Apps** - Register any application with a friendly name  
✅ **Browse & Add** - File picker to select applications  
✅ **Persistent Storage** - Custom apps saved to JSON config file  
✅ **Environment Variables** - Support for `%USERPROFILE%`, `%APPDATA%`, etc.  
✅ **Priority System** - Custom apps checked before common apps  
✅ **Full Management** - Add, remove, update, list custom apps  
✅ **Cross-Platform** - Works on Windows, macOS, Linux  

## Why Custom Apps?

### Problem Solved
- **Not all apps are in common list** - Users have unique software
- **Installation paths vary** - Apps may be on different drives or custom locations
- **Portable applications** - Apps on USB drives or custom folders
- **Multiple versions** - Users might have different versions installed
- **Override defaults** - Replace common app paths with custom ones

### Benefits
- **Flexibility** - Open ANY application on the system
- **User Control** - Users define their own app shortcuts
- **Persistence** - Apps saved and loaded automatically
- **No Hardcoding** - No need to update code for new apps

## How It Works

### 1. Storage
Custom apps are saved in a JSON file:

**Location:**
- Windows: `%APPDATA%\Buddy\custom-apps.json`
- macOS: `~/Library/Application Support/Buddy/custom-apps.json`
- Linux: `~/.config/Buddy/custom-apps.json`

**Format:**
```json
{
  "photoshop": "C:\\Program Files\\Adobe\\Photoshop 2024\\Photoshop.exe",
  "mygame": "D:\\Games\\MyGame\\game.exe",
  "portableapp": "C:\\Users\\John\\Desktop\\PortableApps\\app.exe"
}
```

### 2. Priority System
When launching an app, the launcher checks:
1. **Custom apps** (user-defined) - **First**
2. Common apps (pre-configured) - **Fallback**

This allows users to override default paths!

### 3. Auto-Loading
Custom apps are automatically loaded when the ApplicationLauncher is initialized:

```javascript
constructor() {
  this.customApps = new Map();
  this.configPath = null;
  this.loadCustomApps(); // Auto-load on startup
}
```

## API Reference

### `addCustomApp(name, path)`
Add a custom application.

```javascript
const result = await appLauncher.addCustomApp(
  'photoshop',
  'C:\\Program Files\\Adobe\\Photoshop 2024\\Photoshop.exe'
);

// Returns:
// {
//   success: true,
//   name: 'photoshop',
//   path: 'C:\\Program Files\\Adobe\\Photoshop 2024\\Photoshop.exe',
//   message: 'Added photoshop → ...'
// }
```

**Features:**
- ✅ Validates app exists before adding
- ✅ Expands environment variables
- ✅ Saves to config file immediately
- ✅ Returns detailed result

### `removeCustomApp(name)`
Remove a custom application.

```javascript
const result = await appLauncher.removeCustomApp('photoshop');

// Returns:
// {
//   success: true,
//   name: 'photoshop',
//   message: 'Removed photoshop'
// }
```

### `getCustomApps()`
Get all custom applications.

```javascript
const apps = appLauncher.getCustomApps();

// Returns:
// {
//   photoshop: 'C:\\Program Files\\Adobe\\...\\Photoshop.exe',
//   mygame: 'D:\\Games\\MyGame\\game.exe'
// }
```

### `updateCustomApp(name, newPath)`
Update a custom application's path.

```javascript
const result = await appLauncher.updateCustomApp(
  'photoshop',
  'D:\\Adobe\\Photoshop 2024\\Photoshop.exe'
);

// Returns:
// {
//   success: true,
//   name: 'photoshop',
//   path: 'D:\\Adobe\\Photoshop 2024\\Photoshop.exe',
//   message: 'Updated photoshop → ...'
// }
```

### `browseAndAddApp(name)`
Open file picker to select and add an application.

```javascript
const result = await appLauncher.browseAndAddApp('MyApp');

// User selects file...

// Returns:
// {
//   success: true,
//   name: 'myapp',
//   path: 'C:\\Selected\\Path\\app.exe',
//   message: 'Added myapp → ...'
// }

// Or if canceled:
// {
//   success: false,
//   canceled: true
// }
```

### `getAppPath(appName)`
Get application path (checks custom apps first).

```javascript
const path = appLauncher.getAppPath('photoshop');
// Returns: 'C:\\Program Files\\Adobe\\...\\Photoshop.exe' or null
```

### `getAvailableApplications()`
Get all available apps (custom + common).

```javascript
const apps = await appLauncher.getAvailableApplications();

// Returns:
// [
//   {
//     name: 'photoshop',
//     path: 'C:\\...',
//     category: 'Custom',
//     isCustom: true
//   },
//   {
//     name: 'chrome',
//     path: 'C:\\...',
//     category: 'browser',
//     isCustom: false
//   },
//   ...
// ]
```

## Implementation Details

### Constructor Changes
```javascript
constructor() {
  // ... existing code ...
  this.customApps = new Map();      // NEW: Store custom apps
  this.configPath = null;           // NEW: Config file path
  this.loadCustomApps();            // NEW: Auto-load custom apps
}
```

### Launch Logic Changes
```javascript
async launchApplication(appName, options = {}) {
  // ...
  
  // OLD: Only checked common apps
  const appPath = this.commonApps[appName.toLowerCase()] || expandedPath;
  
  // NEW: Check custom apps first, then common apps
  const appPath = this.getAppPath(appName) || expandedPath;
  
  // ...
}
```

### Storage Methods
```javascript
// Save to file
async saveCustomApps() {
  const customAppsObj = {};
  this.customApps.forEach((appPath, name) => {
    customAppsObj[name] = appPath;
  });
  
  await fs.writeFile(
    this.configPath,
    JSON.stringify(customAppsObj, null, 2)
  );
}

// Load from file
async loadCustomApps() {
  const data = await fs.readFile(this.configPath, 'utf-8');
  const customApps = JSON.parse(data);
  
  Object.entries(customApps).forEach(([name, appPath]) => {
    this.customApps.set(name.toLowerCase(), appPath);
  });
}
```

## IPC Handlers

Add these handlers in your main process:

```javascript
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
```

## Preload Exposure

Add these to your preload script:

```javascript
contextBridge.exposeInMainWorld('appLauncher', {
  // ... existing methods ...
  
  // Custom app management
  addCustomApp: (name, path) => ipcRenderer.invoke('app:add-custom', name, path),
  removeCustomApp: (name) => ipcRenderer.invoke('app:remove-custom', name),
  getCustomApps: () => ipcRenderer.invoke('app:get-custom'),
  updateCustomApp: (name, newPath) => ipcRenderer.invoke('app:update-custom', name, newPath),
  browseAndAddApp: (name) => ipcRenderer.invoke('app:browse-and-add', name)
});
```

## Usage Examples

### Example 1: Add Custom App
```javascript
// Add Photoshop
const result = await window.appLauncher.addCustomApp(
  'photoshop',
  'C:\\Program Files\\Adobe\\Photoshop 2024\\Photoshop.exe'
);

if (result.success) {
  console.log('✅ Added Photoshop!');
  
  // Now launch it
  await window.appLauncher.launch('photoshop');
}
```

### Example 2: Browse and Add
```javascript
// Open file picker
const result = await window.appLauncher.browseAndAddApp('Photoshop');

if (result.success) {
  alert(`✅ Added ${result.name}!\nPath: ${result.path}`);
} else if (result.canceled) {
  console.log('User canceled');
}
```

### Example 3: Custom App Manager UI
```javascript
async function loadCustomApps() {
  const apps = await window.appLauncher.getCustomApps();
  
  const list = document.getElementById('custom-apps');
  list.innerHTML = '';
  
  Object.entries(apps).forEach(([name, path]) => {
    const item = document.createElement('div');
    item.innerHTML = `
      <strong>${name}</strong>
      <small>${path}</small>
      <button onclick="launchApp('${name}')">Launch</button>
      <button onclick="removeApp('${name}')">Remove</button>
    `;
    list.appendChild(item);
  });
}

async function launchApp(name) {
  await window.appLauncher.launch(name);
}

async function removeApp(name) {
  await window.appLauncher.removeCustomApp(name);
  await loadCustomApps(); // Refresh
}
```

### Example 4: Import/Export
```javascript
// Export
async function exportCustomApps() {
  const apps = await window.appLauncher.getCustomApps();
  const json = JSON.stringify(apps, null, 2);
  
  // Download as file
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'custom-apps.json';
  a.click();
}

// Import
async function importCustomApps(file) {
  const text = await file.text();
  const apps = JSON.parse(text);
  
  for (const [name, path] of Object.entries(apps)) {
    await window.appLauncher.addCustomApp(name, path);
  }
  
  console.log('✅ Imported custom apps');
}
```

### Example 5: Voice Commands
```javascript
async function handleCommand(text) {
  const words = text.toLowerCase().split(' ');
  
  // "open photoshop"
  if (words[0] === 'open') {
    const appName = words[1];
    const result = await window.appLauncher.launch(appName);
    
    if (result.success) {
      return `✅ Opened ${appName}`;
    } else {
      return `❌ App not found. Try: "add app ${appName}"`;
    }
  }
  
  // "add app photoshop"
  if (words[0] === 'add' && words[1] === 'app') {
    const appName = words[2];
    const result = await window.appLauncher.browseAndAddApp(appName);
    
    if (result.success) {
      return `✅ Added ${appName}`;
    }
  }
}
```

## Environment Variables

Supported environment variables are automatically expanded:

### Windows
- `%USERPROFILE%` → `C:\Users\YourName`
- `%APPDATA%` → `C:\Users\YourName\AppData\Roaming`
- `%LOCALAPPDATA%` → `C:\Users\YourName\AppData\Local`
- `%PROGRAMFILES%` → `C:\Program Files`
- `%PROGRAMFILES(X86)%` → `C:\Program Files (x86)`
- `%TEMP%` → Temp directory

### macOS/Linux
- `$HOME` or `~` → `/Users/YourName` or `/home/yourname`
- `$USER` → Current username

Example:
```javascript
await appLauncher.addCustomApp(
  'myapp',
  '%USERPROFILE%\\Desktop\\MyApp\\app.exe'
);

// Expands to:
// C:\Users\YourName\Desktop\MyApp\app.exe
```

## Security Considerations

⚠️ **Important:**

1. **Path Validation** - Always validates app exists before adding
2. **User Control** - User must explicitly add apps (no auto-detection of all apps)
3. **No Arbitrary Execution** - Validates paths before launching
4. **Error Handling** - Graceful failures with clear error messages

## Troubleshooting

**Q: Custom app not launching?**  
A: Check the path with `appExists()` and verify the `.exe` extension on Windows.

**Q: Custom apps not persisting?**  
A: Check write permissions for the config file location.

**Q: Environment variables not expanding?**  
A: Make sure to use the correct format (`%VAR%` on Windows, `$VAR` on Unix).

**Q: Can I override common apps?**  
A: Yes! Add a custom app with the same name to override the default path.

## Benefits Summary

✅ **Flexibility** - Open ANY application, not just pre-configured ones  
✅ **User-Friendly** - Simple API, file picker support  
✅ **Persistent** - Apps saved automatically  
✅ **Portable** - Supports environment variables  
✅ **Override System** - Custom apps take priority  
✅ **Import/Export** - Easy backup and sharing  
✅ **Voice Control** - Integrates with voice commands  
✅ **Cross-Platform** - Windows, macOS, Linux support  

## Next Steps

1. ✅ Implement custom app methods (**DONE**)
2. ✅ Add IPC handlers (**DONE**)
3. ✅ Update preload script (**DONE**)
4. ✅ Document API (**DONE**)
5. 🔄 Add UI for custom app management (optional)
6. 🔄 Add to test page (optional)

---

**Created:** 2024  
**Feature Status:** ✅ Complete and Ready to Use
