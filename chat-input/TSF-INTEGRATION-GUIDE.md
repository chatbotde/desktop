# TSF Integration Guide for SonicPlane Buddy

This guide explains how to integrate the Text Services Framework (TSF) into your SonicPlane Buddy application.

## What is TSF?

The Text Services Framework allows your application to insert text into **any** Windows application that accepts text input - just like Grammarly does. This enables your AI assistant to automatically paste responses into:

- Web browsers (Chrome, Edge, Firefox)
- Text editors (VS Code, Notepad++, Sublime)
- Office apps (Word, Excel, Outlook)
- Chat apps (Discord, Slack, Teams)
- And many more!

## Setup Steps

### 1. Build the Native Module

First, build the TSF native C++ module:

```powershell
cd buddy\chat-input\tsf-framwork
npm install
```

This will compile the C++ code and create the native addon.

### 2. Update Your Main Process

In your main process file (e.g., `chat-input-window.js` or `main.js`), add the TSF integration:

```javascript
const { app } = require('electron');
const { setupTsfIpc, initializeTsf, cleanupTsf } = require('./chat-input/tsf-ipc-handlers');

// When creating your chat input window
function createChatInputWindow() {
    const chatInputWindow = new BrowserWindow({
        // ... your window config
    });
    
    // Setup TSF IPC handlers
    setupTsfIpc(chatInputWindow);
    
    return chatInputWindow;
}

// Initialize TSF when app is ready
app.whenReady().then(async () => {
    await initializeTsf();
    createChatInputWindow();
});

// Cleanup on quit
app.on('will-quit', async () => {
    await cleanupTsf();
});
```

### 3. The Preload Script is Already Updated

The preload script (`chat-input-preload.js`) has been updated with the `tsfAPI` exposure. It's ready to use!

### 4. Use in Your Renderer

In your renderer JavaScript (e.g., in your HTML or a separate JS file):

```javascript
// Initialize TSF when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await window.tsfAPI.initialize();
    console.log('TSF ready!');
});

// Insert text into focused application
async function insertResponse(text) {
    const success = await window.tsfAPI.insertText(text);
    if (success) {
        console.log('✅ Text inserted!');
    }
}

// Example: Insert AI response
async function handleAIResponse(response) {
    // Get info about focused window
    const focusInfo = await window.tsfAPI.getFocusInfo();
    console.log(`Inserting into: ${focusInfo.processName}`);
    
    // Insert the text
    await window.tsfAPI.insertText(response);
}
```

## API Reference

### Available Methods

#### `window.tsfAPI.initialize()`
Initialize the TSF system. Call this once when your app starts.

#### `window.tsfAPI.insertText(text, options)`
Insert text into the focused application.
- `text` (string): The text to insert
- `options` (object, optional):
  - `useFallback` (boolean): Force clipboard method
  - `force` (boolean): Insert even if window may not be editable

#### `window.tsfAPI.insertTextFallback(text)`
Insert text using clipboard+paste method.

#### `window.tsfAPI.getFocusInfo()`
Get information about the currently focused window.

Returns:
```javascript
{
    windowTitle: "Document1 - Word",
    processName: "WINWORD.EXE",
    processId: 12345,
    isEditable: true
}
```

#### `window.tsfAPI.isTsfAvailable()`
Check if TSF is available for the current window.

#### `window.tsfAPI.isEditableWindow()`
Check if the focused window accepts text input.

#### `window.tsfAPI.setEnabled(enabled)`
Enable or disable text insertion.

#### `window.tsfAPI.isEnabled()`
Check if text insertion is enabled.

### Event Listeners

#### Focus Changed
```javascript
window.tsfAPI.onFocusChanged((focusInfo) => {
    console.log('User focused:', focusInfo.processName);
});
```

#### Text Inserted
```javascript
window.tsfAPI.onTextInserted((data) => {
    console.log('✅ Inserted into', data.focusInfo.processName);
});
```

#### Insert Failed
```javascript
window.tsfAPI.onInsertFailed((data) => {
    console.error('❌ Failed to insert text');
});
```

#### Warning
```javascript
window.tsfAPI.onWarning((data) => {
    console.warn('⚠️', data.message);
});
```

## Usage Examples

### Example 1: Basic Integration

```javascript
// When user gets AI response
async function onAIResponse(response) {
    await window.tsfAPI.insertText(response);
}
```

### Example 2: With User Confirmation

```javascript
async function insertWithConfirmation(text) {
    const focusInfo = await window.tsfAPI.getFocusInfo();
    
    const confirmed = confirm(
        `Insert text into ${focusInfo.processName}?`
    );
    
    if (confirmed) {
        await window.tsfAPI.insertText(text);
    }
}
```

### Example 3: Auto-Paste Toggle

```javascript
let autoPasteEnabled = true;

document.getElementById('autoPasteToggle').addEventListener('click', () => {
    autoPasteEnabled = !autoPasteEnabled;
    window.tsfAPI.setEnabled(autoPasteEnabled);
});

// When AI responds
async function onAIResponse(response) {
    if (autoPasteEnabled) {
        await window.tsfAPI.insertText(response);
    }
}
```

### Example 4: Smart Insertion

```javascript
async function smartInsert(text) {
    // Check if window is editable
    const isEditable = await window.tsfAPI.isEditableWindow();
    
    if (!isEditable) {
        // Show warning to user
        showWarning('Current window may not accept text input');
        return;
    }
    
    // Get focus info
    const focusInfo = await window.tsfAPI.getFocusInfo();
    
    // Check TSF availability
    const tsfAvailable = await window.tsfAPI.isTsfAvailable();
    console.log(`Using ${tsfAvailable ? 'TSF' : 'clipboard'} method`);
    
    // Insert text
    const success = await window.tsfAPI.insertText(text);
    
    if (success) {
        showNotification(`Inserted into ${focusInfo.processName}`);
    }
}
```

## How It Works

1. **TSF Method (Preferred)**: Uses Windows Text Services Framework to directly insert text into the application's text buffer. This is native and reliable.

2. **Fallback Method**: If TSF isn't available, it uses clipboard+paste:
   - Saves current clipboard
   - Copies text to clipboard
   - Simulates Ctrl+V
   - Restores original clipboard

The system automatically chooses the best method for each application.

## Troubleshooting

### "Module not loaded" Error

Make sure you've built the native module:
```powershell
cd buddy\chat-input\tsf-framwork
npm install
```

### Text Not Inserting

1. Check if the target window is focused
2. Verify the window accepts text input
3. Try the fallback method: `insertTextFallback(text)`
4. Check console for error messages

### Permission Issues

Some applications require elevated permissions. Run your app as administrator if needed.

### Build Errors

If the native module fails to build:
1. Install Visual Studio Build Tools
2. Install Python 3.x
3. Run: `npm install --global windows-build-tools`

## Testing

Test the integration:

```powershell
cd buddy\chat-input\tsf-framwork
npm test
```

This will run a test that:
1. Initializes TSF
2. Gets focus information
3. Tests text insertion (you'll need to focus a text editor)

## Best Practices

1. **Initialize Early**: Call `initialize()` when your app starts
2. **Check Focus**: Get focus info before inserting to show feedback
3. **Handle Errors**: Listen for insert-failed events
4. **User Control**: Give users a toggle to enable/disable auto-insert
5. **Cleanup**: The system automatically cleans up, but you can call cleanup manually if needed

## Security Considerations

- TSF only inserts text where the user has focus
- It cannot insert into elevated applications unless your app is also elevated
- The clipboard is restored after fallback insertion
- No text is stored or transmitted

## Performance

- TSF initialization: ~50ms
- Text insertion: ~10-50ms (TSF) or ~100-200ms (fallback)
- Focus monitoring: Runs every 1 second by default

## Next Steps

1. Build the native module: `npm install` in tsf-framwork folder
2. Integrate into your main process using `tsf-ipc-handlers.js`
3. Use the API in your renderer (see `tsf-usage-example.js`)
4. Test with different applications
5. Customize the UI to show focus info and insertion status

## Support

If you encounter issues:
1. Check the console for error messages
2. Review the examples in `tsf-usage-example.js`
3. Test with the standalone test: `npm test`
4. Check that your Windows version is 10 or later

## Files Overview

- `tsf-framwork/` - Native C++ module
  - `src/text_inserter.cpp` - Core TSF implementation
  - `src/tsf_module.cpp` - Node.js bindings
  - `binding.gyp` - Build configuration
  - `index.js` - JavaScript API wrapper

- `tsf-manager.js` - High-level TSF manager with events
- `tsf-ipc-handlers.js` - IPC handlers for Electron
- `chat-input-preload.js` - Updated with tsfAPI exposure
- `tsf-usage-example.js` - Usage examples

Enjoy seamless text insertion into any Windows application! 🚀
