# Quick Start: Custom Application Paths

Add your own applications in 3 easy steps!

## 🚀 Quick Setup (3 Steps)

### Step 1: Import the Module

Already done if you followed the main integration guide!

```javascript
// In main.js
const appLauncher = require('./chat-input/electron-api/app-launcher');
```

### Step 2: Add IPC Handlers

Add these 5 handlers to your main process:

```javascript
// In your setupElectronAPIHandlers() function:

// Add custom app
ipcMain.handle('app:add-custom', async (event, name, path) => {
  return await appLauncher.addCustomApp(name, path);
});

// Remove custom app
ipcMain.handle('app:remove-custom', async (event, name) => {
  return await appLauncher.removeCustomApp(name);
});

// Get all custom apps
ipcMain.handle('app:get-custom', () => {
  return appLauncher.getCustomApps();
});

// Update custom app path
ipcMain.handle('app:update-custom', async (event, name, newPath) => {
  return await appLauncher.updateCustomApp(name, newPath);
});

// Browse and add app
ipcMain.handle('app:browse-and-add', async (event, name) => {
  return await appLauncher.browseAndAddApp(name);
});
```

### Step 3: Expose in Preload

Add these to your preload script's `appLauncher` context bridge:

```javascript
// In chat-input-preload.js
contextBridge.exposeInMainWorld('appLauncher', {
  // ... existing methods ...
  
  // Custom app methods
  addCustomApp: (name, path) => ipcRenderer.invoke('app:add-custom', name, path),
  removeCustomApp: (name) => ipcRenderer.invoke('app:remove-custom', name),
  getCustomApps: () => ipcRenderer.invoke('app:get-custom'),
  updateCustomApp: (name, newPath) => ipcRenderer.invoke('app:update-custom', name, newPath),
  browseAndAddApp: (name) => ipcRenderer.invoke('app:browse-and-add', name)
});
```

---

## 💡 Usage Examples

### Example 1: Add Custom App (Manual Path)

```javascript
// Add Photoshop
const result = await window.appLauncher.addCustomApp(
  'photoshop',
  'C:\\Program Files\\Adobe\\Photoshop 2024\\Photoshop.exe'
);

if (result.success) {
  console.log('✅ Added Photoshop!');
  
  // Launch it
  await window.appLauncher.launch('photoshop');
}
```

### Example 2: Browse and Add (File Picker)

```javascript
// Let user select the app
const result = await window.appLauncher.browseAndAddApp('Photoshop');

if (result.success) {
  alert(`✅ Added ${result.name}!\nPath: ${result.path}`);
  
  // Launch it
  await window.appLauncher.launch('photoshop');
} else if (result.canceled) {
  console.log('User canceled');
}
```

### Example 3: Get All Custom Apps

```javascript
const apps = await window.appLauncher.getCustomApps();

console.log('Custom apps:', apps);
// {
//   photoshop: 'C:\\Program Files\\Adobe\\...\\Photoshop.exe',
//   mygame: 'D:\\Games\\MyGame\\game.exe'
// }

// Launch a custom app
await window.appLauncher.launch('photoshop');
```

### Example 4: Remove Custom App

```javascript
const result = await window.appLauncher.removeCustomApp('photoshop');

if (result.success) {
  console.log('✅ Removed Photoshop');
}
```

### Example 5: Update Custom App Path

```javascript
const result = await window.appLauncher.updateCustomApp(
  'photoshop',
  'D:\\Adobe\\Photoshop 2024\\Photoshop.exe'
);

if (result.success) {
  console.log('✅ Updated Photoshop path');
}
```

---

## 🎨 Create a Simple UI

### HTML

```html
<div id="custom-apps">
  <h3>My Applications</h3>
  
  <button onclick="addCustomApp()">➕ Add Application</button>
  
  <div id="apps-list"></div>
</div>
```

### JavaScript

```javascript
// Load and display custom apps
async function loadCustomApps() {
  const apps = await window.appLauncher.getCustomApps();
  
  const list = document.getElementById('apps-list');
  list.innerHTML = '';
  
  Object.entries(apps).forEach(([name, path]) => {
    const item = document.createElement('div');
    item.className = 'app-item';
    item.innerHTML = `
      <div>
        <strong>${name}</strong>
        <br>
        <small>${path}</small>
      </div>
      <div>
        <button onclick="launchApp('${name}')">▶️ Launch</button>
        <button onclick="removeApp('${name}')">🗑️ Remove</button>
      </div>
    `;
    list.appendChild(item);
  });
}

// Add new app
async function addCustomApp() {
  const name = prompt('Enter app name (e.g., "photoshop"):');
  if (!name) return;
  
  const result = await window.appLauncher.browseAndAddApp(name);
  
  if (result.success) {
    alert(`✅ Added ${name}!`);
    await loadCustomApps();
  } else if (!result.canceled) {
    alert(`❌ Error: ${result.error}`);
  }
}

// Launch app
async function launchApp(name) {
  const result = await window.appLauncher.launch(name);
  
  if (result.success) {
    console.log(`✅ Launched ${name}`);
  } else {
    alert(`❌ Failed to launch ${name}`);
  }
}

// Remove app
async function removeApp(name) {
  if (confirm(`Remove ${name}?`)) {
    await window.appLauncher.removeCustomApp(name);
    await loadCustomApps();
  }
}

// Load on page load
window.addEventListener('DOMContentLoaded', loadCustomApps);
```

### CSS

```css
.app-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.app-item strong {
  color: #3b82f6;
  font-size: 16px;
}

.app-item small {
  color: #666;
  font-size: 12px;
}

.app-item button {
  margin-left: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.app-item button:first-of-type {
  background: #3b82f6;
  color: white;
}

.app-item button:last-of-type {
  background: #ef4444;
  color: white;
}
```

---

## 🎯 Use Cases

### 1. **Voice Commands**

```javascript
async function handleVoiceCommand(text) {
  const words = text.toLowerCase().split(' ');
  
  // "open photoshop"
  if (words[0] === 'open') {
    const appName = words[1];
    await window.appLauncher.launch(appName);
  }
  
  // "add app photoshop"
  if (words[0] === 'add' && words[1] === 'app') {
    const appName = words[2];
    await window.appLauncher.browseAndAddApp(appName);
  }
}
```

### 2. **Custom Shortcuts**

```javascript
// Add frequently used apps
const myApps = [
  { name: 'photoshop', path: 'C:\\...\\Photoshop.exe' },
  { name: 'premiere', path: 'C:\\...\\Premiere.exe' },
  { name: 'aftereffects', path: 'C:\\...\\AfterEffects.exe' }
];

// Add all
for (const app of myApps) {
  await window.appLauncher.addCustomApp(app.name, app.path);
}
```

### 3. **Launch Workflow**

```javascript
// Launch multiple apps for a workflow
async function startVideoEditingWorkflow() {
  await window.appLauncher.launch('photoshop');
  await window.appLauncher.launch('premiere');
  await window.appLauncher.launch('aftereffects');
  await window.appLauncher.launch('spotify'); // Music while working!
}
```

### 4. **Portable Apps**

```javascript
// Add portable apps from USB drive
await window.appLauncher.addCustomApp(
  'portablechrome',
  'E:\\PortableApps\\Chrome\\chrome.exe'
);

await window.appLauncher.addCustomApp(
  'portablevscode',
  'E:\\PortableApps\\VSCode\\Code.exe'
);
```

---

## 📝 Environment Variables

Use environment variables for portable paths:

### Windows
```javascript
await window.appLauncher.addCustomApp(
  'myapp',
  '%USERPROFILE%\\Desktop\\MyApp\\app.exe'
);

// Expands to: C:\Users\YourName\Desktop\MyApp\app.exe
```

### macOS/Linux
```javascript
await window.appLauncher.addCustomApp(
  'myapp',
  '~/Desktop/MyApp/app'
);

// Expands to: /Users/YourName/Desktop/MyApp/app
```

---

## 💾 Where Are Custom Apps Saved?

Custom apps are automatically saved to:

- **Windows**: `%APPDATA%\Buddy\custom-apps.json`
- **macOS**: `~/Library/Application Support/Buddy/custom-apps.json`
- **Linux**: `~/.config/Buddy/custom-apps.json`

The file is automatically created and loaded on startup!

---

## ✅ Testing

```javascript
// Test adding a custom app
const result = await window.appLauncher.addCustomApp(
  'test',
  'C:\\Windows\\System32\\notepad.exe'
);
console.log('Add result:', result);

// Test getting custom apps
const apps = await window.appLauncher.getCustomApps();
console.log('Custom apps:', apps);

// Test launching
const launch = await window.appLauncher.launch('test');
console.log('Launch result:', launch);

// Test removing
const remove = await window.appLauncher.removeCustomApp('test');
console.log('Remove result:', remove);
```

---

## 🔥 Pro Tips

1. **Override Common Apps**: Add a custom app with the same name as a common app to override its path
2. **Use Environment Variables**: Makes paths portable across different machines
3. **Import/Export**: Backup your custom apps to a JSON file
4. **Voice Integration**: Perfect for "open [app]" commands
5. **Quick Launch**: Create keyboard shortcuts to launch custom apps

---

## 🎉 That's It!

You can now:
- ✅ Add any application on your system
- ✅ Launch apps by friendly names
- ✅ Override default app paths
- ✅ Create voice commands
- ✅ Build custom UI for app management

**Happy launching!** 🚀
