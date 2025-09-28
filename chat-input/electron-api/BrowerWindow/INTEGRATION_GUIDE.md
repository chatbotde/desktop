# BrowserWindow API Integration Guide

This guide will help you integrate the BrowserWindow API with your floating cards to open web applications in new Electron windows.

## Files Created

1. **`index.js`** - Main API entry point and manager
2. **`window-manager.js`** - Window lifecycle management
3. **`window-creator.js`** - Window creation utilities
4. **`window-utils.js`** - Window manipulation utilities
5. **`window-presets.js`** - Preset configurations for popular sites
6. **`window-events.js`** - Event management system
7. **`floating-card-integration.js`** - Frontend integration helper
8. **`ipc-handlers.js`** - Main process IPC handlers
9. **`preload-additions.js`** - Preload script additions
10. **`README.md`** - Comprehensive documentation

## Integration Steps

### Step 1: Add IPC Handlers to Main Process

Add this to your `main.js` file:

```javascript
// Import the IPC handlers
const { setupBrowserWindowIpcHandlers } = require('./chat-input/electron-api/BrowerWindow/ipc-handlers');

// After your app is ready and other IPC handlers are set up
function setupAllIpcHandlers() {
  // ... your existing IPC handlers ...
  
  // Add BrowserWindow handlers
  setupBrowserWindowIpcHandlers();
}

// Call this after app.whenReady()
app.whenReady().then(() => {
  // ... your existing setup ...
  setupAllIpcHandlers();
});
```

### Step 2: Update Preload Script

Add to your existing `chat-input-preload.js`:

```javascript
// Import the preload additions
require('./electron-api/BrowerWindow/preload-additions');

// Or manually add the API functions to your existing contextBridge.exposeInMainWorld call
```

### Step 3: Add Frontend Integration

Include the integration script in your renderer process:

```html
<!-- Add to your chat-input.html before other scripts -->
<script src="electron-api/BrowerWindow/floating-card-integration.js"></script>
```

Or import it in your existing JavaScript:

```javascript
// In your renderer.js or main module file
const { floatingCardBrowser } = require('./electron-api/BrowerWindow/floating-card-integration');
```

### Step 4: Add CSS for New Button (Optional)

Add CSS for the new browser button in your `css/main.css`:

```css
.floating-card-browser-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.floating-card-browser-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
  transform: scale(1.05);
}

.floating-card-browser-btn:active {
  transform: scale(0.95);
}
```

## Usage Examples

### Basic Usage

```javascript
// Open current iframe URL in new window
document.getElementById('openBrowserWindowCard2').addEventListener('click', async () => {
  const result = await window.electronAPI.createWebAppWindow('https://chat.openai.com');
  if (result.success) {
    console.log('Window created:', result.windowId);
  }
});
```

### Using Presets

```javascript
// Open specific sites with optimized presets
await window.electronAPI.createChatWindow('https://chat.openai.com');
await window.electronAPI.createDevelopmentWindow('http://localhost:5173');
await window.electronAPI.createProductivityWindow('https://notion.so');
await window.electronAPI.createSocialWindow('https://twitter.com');
await window.electronAPI.createMediaWindow('https://youtube.com');
```

### Using the Integration Helper

```javascript
// The floating card integration is automatically set up
// You can also use shortcuts:
await window.floatingCardBrowser.openChatWindow();
await window.floatingCardBrowser.openDevelopmentWindow();

// Or use popular site shortcuts:
await window.openPopularSite.chatgpt();
await window.openPopularSite.notion();
await window.openPopularSite.youtube();
```

### Advanced Window Management

```javascript
// Get all open windows
const windows = await window.electronAPI.getAllWindowsInfo();

// Manage specific windows
await window.electronAPI.focusWindow(windowId);
await window.electronAPI.setWindowAlwaysOnTop(windowId, true);
await window.electronAPI.setWindowOpacity(windowId, 0.9);
await window.electronAPI.closeWindow(windowId);
```

## Features Available

### Window Types
- **Basic Window** - Standard browser window
- **Web App Window** - Optimized for web applications
- **Minimal Window** - Frameless, minimal UI
- **Overlay Window** - Always on top, transparent options

### Preset Types
- **Chat** - AI chat services (ChatGPT, Claude, Gemini)
- **Development** - Localhost and dev tools
- **Productivity** - Work apps (Notion, Google Workspace)
- **Social** - Social media platforms
- **Media** - Streaming and media services

### Window Management
- Create, close, show, hide windows
- Focus, minimize, maximize, restore
- Set bounds, opacity, always-on-top
- Navigate (back, forward, reload)
- Developer tools control

## Testing

Test the integration:

1. Start your application
2. Open floating card 2
3. Click the new browser button (external link icon)
4. A new window should open with the current iframe URL
5. Test different URLs and presets

## Popular Site Examples

```javascript
// Quick shortcuts for popular sites
window.openPopularSite.chatgpt();    // Opens ChatGPT
window.openPopularSite.claude();     // Opens Claude AI
window.openPopularSite.notion();     // Opens Notion
window.openPopularSite.github();     // Opens GitHub
window.openPopularSite.youtube();    // Opens YouTube
window.openPopularSite.netflix();    // Opens Netflix
```

## Error Handling

All functions return success/failure indicators:

```javascript
const result = await window.electronAPI.createWebAppWindow(url);
if (result.success) {
  console.log('Window created:', result.windowId);
} else {
  console.error('Failed to create window:', result.error);
}
```

## Security Notes

- All windows use secure defaults (no node integration, context isolation enabled)
- Web security is enforced except for development windows
- Remote module access is disabled
- Content security policies are respected

## Customization

You can customize window options:

```javascript
const customOptions = {
  width: 1400,
  height: 900,
  alwaysOnTop: true,
  opacity: 0.95,
  titleBarStyle: 'hidden'
};

await window.electronAPI.createWebAppWindow(url, customOptions);
```

## Next Steps

1. Test the basic integration
2. Customize CSS styling for the browser buttons
3. Add browser buttons to other floating cards
4. Implement keyboard shortcuts
5. Add context menus for quick site access
6. Integrate with your existing theming system

## Troubleshooting

- Ensure all files are in the correct paths
- Check that IPC handlers are registered in main process
- Verify preload script is loaded correctly
- Check browser console for any errors
- Ensure Electron APIs are available in renderer