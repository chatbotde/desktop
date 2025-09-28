# BrowserWindow API Module

A comprehensive Electron BrowserWindow management system that provides organized access to window creation, management, and control operations.

## Features

- **Window Creation**: Multiple window types with preset configurations
- **Window Management**: Complete lifecycle management of browser windows
- **Event Handling**: Robust event management system
- **Preset Configurations**: Pre-configured windows for popular websites and use cases
- **Utility Functions**: Window manipulation and information gathering

## Usage

```javascript
// Import the BrowserWindow manager
const { browserWindowManager, createWebAppWindow } = require('./electron-api/BrowerWindow');

// Create a web application window
const result = createWebAppWindow('https://chat.openai.com');
console.log('Created window:', result.id);

// Create a development window
const devWindow = browserWindowManager.createDevelopmentWindow('http://localhost:3000');

// Manage the window
browserWindowManager.focusWindow(result.id);
browserWindowManager.setWindowAlwaysOnTop(result.id, true);
```

## API Reference

### Window Creation

#### `createWindow(options = {})`
Creates a basic browser window with default settings.

#### `createWebAppWindow(url, options = {})`
Creates a window optimized for web applications.

#### `createMinimalWindow(url, options = {})`
Creates a frameless window with minimal UI.

#### `createOverlayWindow(url, options = {})`
Creates an always-on-top overlay window.

### Preset Window Types

#### `createChatWindow(url, options = {})`
Pre-configured for AI chat applications (ChatGPT, Claude, etc.).

#### `createDevelopmentWindow(url, options = {})`
Optimized for development servers (localhost apps).

#### `createProductivityWindow(url, options = {})`
Configured for productivity apps (Notion, Google Workspace).

#### `createSocialWindow(url, options = {})`
Optimized for social media platforms.

#### `createMediaWindow(url, options = {})`
Configured for media streaming services.

### Window Management

#### `getWindow(windowId)`
Retrieve a window instance by its ID.

#### `getAllWindows()`
Get information about all managed windows.

#### `closeWindow(windowId)`
Close a specific window.

#### `closeAllWindows()`
Close all managed windows.

#### `showWindow(windowId)` / `hideWindow(windowId)`
Show or hide a specific window.

#### `focusWindow(windowId)`
Bring a window to the front and focus it.

#### `minimizeWindow(windowId)` / `maximizeWindow(windowId)` / `restoreWindow(windowId)`
Control window state.

### Window Utilities

#### `setWindowBounds(windowId, bounds)`
Set window position and size.

#### `getWindowBounds(windowId)`
Get current window bounds.

#### `setWindowAlwaysOnTop(windowId, flag)`
Set always-on-top behavior.

#### `setWindowOpacity(windowId, opacity)`
Set window transparency.

#### `setWindowIgnoreMouseEvents(windowId, ignore)`
Enable/disable mouse event passthrough.

#### `getWindowInfo(windowId)`
Get detailed window information.

### Navigation

#### `loadURL(windowId, url)`
Navigate to a specific URL.

#### `reload(windowId)`
Reload the window content.

#### `goBack(windowId)` / `goForward(windowId)`
Navigate browser history.

### Developer Tools

#### `openDevTools(windowId)` / `closeDevTools(windowId)` / `toggleDevTools(windowId)`
Control developer tools.

### Event Management

#### `addWindowEventListener(windowId, event, handler)`
Add event listener to a window.

#### `removeWindowEventListener(windowId, event, handler)`
Remove specific event listener.

## Popular Site Presets

The module includes preset configurations for popular websites:

- **AI/Chat**: ChatGPT, Claude, Gemini
- **Development**: localhost, GitHub
- **Productivity**: Notion, Google Docs/Sheets
- **Social Media**: Twitter/X, LinkedIn
- **Media**: YouTube, Netflix, Spotify

## Example Implementation

### Basic Window Creation

```javascript
// Create a ChatGPT window
const chatWindow = createChatWindow('https://chat.openai.com');

// Create a development server window
const devWindow = createDevelopmentWindow('http://localhost:5173');

// Create a YouTube window
const mediaWindow = createMediaWindow('https://youtube.com');
```

### Window Management

```javascript
// Get all windows
const windows = browserWindowManager.getAllWindows();

// Focus a specific window
browserWindowManager.focusWindow(chatWindow.id);

// Set window properties
browserWindowManager.setWindowAlwaysOnTop(devWindow.id, true);
browserWindowManager.setWindowOpacity(mediaWindow.id, 0.9);
```

### Event Handling

```javascript
// Add event listeners
browserWindowManager.addWindowEventListener(chatWindow.id, 'focus', () => {
  console.log('Chat window focused');
});

browserWindowManager.addWindowEventListener(devWindow.id, 'closed', () => {
  console.log('Dev window closed');
});
```

## Integration with Floating Cards

For use with floating cards, you can integrate the API like this:

```javascript
// In your floating card handler
function openWebAppInNewWindow(url) {
  const windowResult = browserWindowManager.createWebAppWindow(url, {
    width: 1200,
    height: 800,
    alwaysOnTop: false
  });
  
  return windowResult;
}

// Example usage
const twitterWindow = openWebAppInNewWindow('https://twitter.com');
const notionWindow = openWebAppInNewWindow('https://notion.so');
```

## File Structure

```
BrowerWindow/
├── index.js              # Main API entry point
├── window-manager.js     # Window lifecycle management
├── window-creator.js     # Window creation utilities
├── window-utils.js       # Window manipulation utilities
├── window-presets.js     # Preset configurations
├── window-events.js      # Event management
└── README.md            # This file
```

## Error Handling

All functions return appropriate success/failure indicators:

- Window creation functions return `{ id, window, config }` objects
- Management functions return `true/false` for success/failure
- Information functions return `null` for invalid windows
- Event functions return `true/false` for success/failure

## Security Considerations

- All windows are created with secure defaults
- Node integration is disabled by default
- Context isolation is enabled
- Web security is enforced (except for development windows)
- Remote module access is disabled