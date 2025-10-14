# 🚀 Custom Apps Quick Reference Card

## One-Liner: What Is This?
**Add ANY application on your system to the App Launcher with a friendly name, then launch it with a simple command or voice input.**

---

## 📦 What You Get

```javascript
// Add any app with a custom name
await window.appLauncher.addCustomApp('myapp', 'C:\\Path\\To\\App.exe');

// Launch it
await window.appLauncher.launch('myapp');
```

That's it! Your app is saved and can be launched anytime.

---

## 🔥 Quick Commands

```javascript
// Add custom app (manual path)
await window.appLauncher.addCustomApp('photoshop', 'C:\\Program Files\\Adobe\\Photoshop.exe');

// Add custom app (file picker)
await window.appLauncher.browseAndAddApp('photoshop');

// Launch custom app
await window.appLauncher.launch('photoshop');

// Get all custom apps
const apps = await window.appLauncher.getCustomApps();

// Remove custom app
await window.appLauncher.removeCustomApp('photoshop');

// Update custom app path
await window.appLauncher.updateCustomApp('photoshop', 'D:\\Adobe\\Photoshop.exe');
```

---

## 💬 Voice Commands

```javascript
// User says: "open photoshop"
await window.appLauncher.launch('photoshop');

// User says: "add app photoshop"
await window.appLauncher.browseAndAddApp('photoshop');
```

---

## 🎯 Use Cases

| Use Case | Example |
|----------|---------|
| **Creative Suite** | Add Photoshop, Premiere, After Effects |
| **Gaming** | Add custom games, game launchers |
| **Portable Apps** | Apps on USB drives, custom folders |
| **Work Tools** | Custom business software |
| **Override Defaults** | Replace Chrome's path with custom location |
| **Multiple Versions** | Python 3.9, Python 3.10, Python 3.11 |

---

## 📁 Where Are Apps Saved?

- **Windows**: `%APPDATA%\Buddy\custom-apps.json`
- **macOS**: `~/Library/Application Support/Buddy/custom-apps.json`
- **Linux**: `~/.config/Buddy/custom-apps.json`

Auto-loaded on startup!

---

## 🌟 Environment Variables

```javascript
// Windows
await window.appLauncher.addCustomApp('myapp', '%USERPROFILE%\\Desktop\\app.exe');

// macOS/Linux
await window.appLauncher.addCustomApp('myapp', '~/Desktop/app');
```

Automatically expanded!

---

## ✅ Priority System

When you launch an app:
1. **Custom apps** checked first (your apps)
2. Common apps checked second (pre-configured)
3. Direct path tried last

**Result**: Your custom apps always win!

---

## 🎨 Simple UI Example

```html
<button onclick="addApp()">Add App</button>
<div id="apps"></div>

<script>
async function addApp() {
  const name = prompt('App name?');
  const result = await window.appLauncher.browseAndAddApp(name);
  
  if (result.success) {
    alert(`✅ Added ${name}!`);
    loadApps();
  }
}

async function loadApps() {
  const apps = await window.appLauncher.getCustomApps();
  const div = document.getElementById('apps');
  
  div.innerHTML = Object.entries(apps).map(([name, path]) => `
    <div>
      <strong>${name}</strong>
      <button onclick="window.appLauncher.launch('${name}')">Launch</button>
      <button onclick="removeApp('${name}')">Remove</button>
    </div>
  `).join('');
}

async function removeApp(name) {
  await window.appLauncher.removeCustomApp(name);
  loadApps();
}

loadApps();
</script>
```

---

## 🔧 Integration (3 Steps)

### 1. Main Process
```javascript
ipcMain.handle('app:add-custom', async (event, name, path) => {
  return await appLauncher.addCustomApp(name, path);
});

ipcMain.handle('app:remove-custom', async (event, name) => {
  return await appLauncher.removeCustomApp(name);
});

ipcMain.handle('app:get-custom', () => {
  return appLauncher.getCustomApps();
});

ipcMain.handle('app:update-custom', async (event, name, newPath) => {
  return await appLauncher.updateCustomApp(name, newPath);
});

ipcMain.handle('app:browse-and-add', async (event, name) => {
  return await appLauncher.browseAndAddApp(name);
});
```

### 2. Preload Script
```javascript
contextBridge.exposeInMainWorld('appLauncher', {
  addCustomApp: (name, path) => ipcRenderer.invoke('app:add-custom', name, path),
  removeCustomApp: (name) => ipcRenderer.invoke('app:remove-custom', name),
  getCustomApps: () => ipcRenderer.invoke('app:get-custom'),
  updateCustomApp: (name, newPath) => ipcRenderer.invoke('app:update-custom', name, newPath),
  browseAndAddApp: (name) => ipcRenderer.invoke('app:browse-and-add', name)
});
```

### 3. Use It!
```javascript
await window.appLauncher.addCustomApp('myapp', 'C:\\Path\\App.exe');
await window.appLauncher.launch('myapp');
```

---

## 🎉 Benefits

✅ **Flexible** - Open ANY app, not just hardcoded ones  
✅ **Persistent** - Apps saved automatically  
✅ **Portable** - Environment variables support  
✅ **Voice Ready** - Perfect for voice commands  
✅ **Override** - Replace default app paths  
✅ **Cross-Platform** - Windows, macOS, Linux  

---

## 📚 Full Docs

- **Quick Start**: `chat-input/electron-api/app-launcher/QUICK_START_CUSTOM_APPS.md`
- **Complete Guide**: `chat-input/electron-api/app-launcher/CUSTOM_APPS.md`
- **Integration**: `INTEGRATION_GUIDE.md`
- **Summary**: `CUSTOM_APPS_SUMMARY.md`

---

## 🚀 Ready to Use!

All code is implemented and ready. Just follow the 3 integration steps above!

**Happy launching!** 🎉
