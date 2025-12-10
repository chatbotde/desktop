# Text Services Framework (TSF) Native Module

A native Node.js addon for Windows that enables text insertion into any application using the Windows Text Services Framework (TSF), similar to how Grammarly works.

## Features

- ✅ Insert text into any Windows application that accepts text input
- ✅ Uses Windows TSF API for native text insertion
- ✅ Automatic fallback to clipboard+paste method when TSF is unavailable
- ✅ Get focused window information
- ✅ Detect if current window is editable
- ✅ Check TSF availability for current application
- ✅ Preserves original clipboard content

## Installation

```bash
cd tsf-framework
npm install
```

The native module will automatically build during installation.

## Prerequisites

- Windows 10 or later
- Node.js 16.0.0 or later
- Visual Studio Build Tools (for node-gyp)
- Python 3.x (for node-gyp)

### Installing Build Tools

If you don't have the Visual Studio Build Tools:

```bash
npm install --global windows-build-tools
```

Or install Visual Studio 2019/2022 with "Desktop development with C++" workload.

## Usage

### Basic Example

```javascript
const tsf = require('./tsf-framework');

async function main() {
    // Initialize TSF
    const initialized = await tsf.initialize();
    if (!initialized) {
        console.error('Failed to initialize TSF');
        return;
    }

    // Insert text into focused application
    const success = await tsf.insertText('Hello from TSF!');
    console.log('Text inserted:', success);

    // Cleanup when done
    await tsf.cleanup();
}

main();
```

### Advanced Example

```javascript
const tsf = require('./tsf-framework');

async function smartInsert(text) {
    // Initialize
    await tsf.initialize();

    // Get information about focused window
    const focusInfo = await tsf.getFocusInfo();
    console.log('Focused window:', focusInfo.windowTitle);
    console.log('Process:', focusInfo.processName);
    console.log('Is editable:', focusInfo.isEditable);

    // Check if it's an editable window
    if (!focusInfo.isEditable) {
        console.log('Warning: Window may not accept text input');
    }

    // Check TSF availability
    const tsfAvailable = await tsf.isTsfAvailable();
    console.log('TSF available:', tsfAvailable);

    // Insert text (automatically uses TSF or fallback)
    const success = await tsf.insertText(text);
    return success;
}

smartInsert('Your text here').then(success => {
    console.log('Success:', success);
});
```

### Electron Integration

```javascript
// In main process
const tsf = require('./tsf-framework');

// Initialize when app is ready
app.whenReady().then(async () => {
    await tsf.initialize();
});

// Expose to renderer via IPC
ipcMain.handle('insert-text', async (event, text) => {
    return await tsf.insertText(text);
});

ipcMain.handle('get-focus-info', async () => {
    return await tsf.getFocusInfo();
});

// Cleanup on quit
app.on('will-quit', async () => {
    await tsf.cleanup();
});
```

```javascript
// In renderer process (preload)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tsf', {
    insertText: (text) => ipcRenderer.invoke('insert-text', text),
    getFocusInfo: () => ipcRenderer.invoke('get-focus-info')
});
```

## API Reference

### `initialize()`

Initialize the TSF system. Must be called before using other functions.

**Returns:** `Promise<boolean>` - Success status

### `insertText(text)`

Insert text at the current cursor position in the focused application. Automatically uses TSF if available, otherwise falls back to clipboard+paste method.

**Parameters:**
- `text` (string) - The text to insert

**Returns:** `Promise<boolean>` - Success status

### `insertTextFallback(text)`

Insert text using clipboard+paste method. This always uses clipboard regardless of TSF availability.

**Parameters:**
- `text` (string) - The text to insert

**Returns:** `Promise<boolean>` - Success status

### `getFocusInfo()`

Get information about the currently focused window.

**Returns:** `Promise<Object>`
```javascript
{
    windowTitle: string,   // Title of the focused window
    processName: string,   // Name of the process (e.g., "chrome.exe")
    processId: number,     // Process ID
    isEditable: boolean    // Whether the window is likely a text input
}
```

### `isTsfAvailable()`

Check if TSF is available for the currently focused application.

**Returns:** `Promise<boolean>` - TSF availability status

### `isEditableWindow()`

Check if the currently focused window is editable (accepts text input).

**Returns:** `Promise<boolean>` - Editable status

### `cleanup()`

Cleanup and release TSF resources. Should be called when shutting down.

**Returns:** `Promise<void>`

### `isAvailable()`

Check if the native module is loaded and available.

**Returns:** `boolean` - Module availability status

## How It Works

1. **TSF Method (Primary):** Uses Windows Text Services Framework to directly insert text into the application's text input buffer. This is the most reliable method and works with most modern applications.

2. **Clipboard+Paste Fallback:** If TSF is unavailable or fails, the module:
   - Saves the current clipboard content
   - Writes the text to clipboard
   - Simulates Ctrl+V keypress
   - Restores the original clipboard content

## Supported Applications

The module works with most Windows applications that accept text input:

- ✅ Web browsers (Chrome, Edge, Firefox)
- ✅ Text editors (Notepad, VS Code, Sublime Text)
- ✅ Office applications (Word, Excel, Outlook)
- ✅ Chat applications (Discord, Slack, Teams)
- ✅ Terminal/Console applications
- ✅ Many more...

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clean and rebuild
npm run clean
npm run build

# Or try debug build
npm run build:debug
```

### Module Not Found

Make sure the native module is built:

```bash
cd tsf-framework
npm install
```

### Permission Issues

Some applications may require elevated permissions. Run your application as administrator if needed.

## Development

### Building

```bash
# Release build
npm run build

# Debug build
npm run build:debug

# Clean build artifacts
npm run clean
```

### Project Structure

```
tsf-framework/
├── src/
│   ├── tsf_module.cpp      # N-API bindings
│   ├── text_inserter.h     # Text insertion interface
│   ├── text_inserter.cpp   # TSF implementation
│   ├── focus_tracker.h     # Focus tracking interface
│   └── focus_tracker.cpp   # Focus tracking implementation
├── binding.gyp             # Build configuration
├── index.js                # JavaScript wrapper
├── package.json
└── README.md
```

## License

MIT

## Author

SonicPlane Team
