# SonicPlane Menu API

A comprehensive menu system for Electron applications with pre-built templates and easy integration.

## Features

- 🎯 **Easy to Use**: Simple import and setup
- 🎨 **Pre-built Templates**: Ready-to-use menu templates for common scenarios
- 🔧 **Customizable**: Easily modify and extend menu templates
- 🖱️ **Context Menus**: Built-in context menus for different components
- 🌐 **Cross-platform**: Works on Windows, macOS, and Linux
- 📱 **Event-driven**: Clean event handling system

## Installation & Setup

### Import the Menu API

```javascript
// Import the entire menu API
const { 
    menuManager, 
    createApplicationMenu, 
    createContextMenu,
    setEventHandlers,
    MenuTemplates 
} = require('./chat-input/electron-api/menu');

// Or import specific components
const MenuManager = require('./chat-input/electron-api/menu/menu-manager');
const MenuTemplates = require('./chat-input/electron-api/menu/menu-templates');
```

### Basic Usage

```javascript
const { app, BrowserWindow } = require('electron');
const { createApplicationMenu, setEventHandlers } = require('./chat-input/electron-api/menu');

app.whenReady().then(() => {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Setup event handlers
    setEventHandlers({
        'new-chat': () => {
            console.log('Creating new chat...');
            mainWindow.webContents.send('menu-action', 'new-chat');
        },
        'clear-chat': () => {
            console.log('Clearing chat...');
            mainWindow.webContents.send('menu-action', 'clear-chat');
        },
        // Add more handlers...
    });

    // Create application menu
    createApplicationMenu(null, mainWindow);
});
```

## Available Menu Templates

### 1. Default Application Menu

```javascript
const { createApplicationMenu } = require('./path/to/menu');

// Create default application menu
createApplicationMenu();

// Or with custom template
const customTemplate = [
    {
        label: 'File',
        submenu: [
            { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => console.log('New file') }
        ]
    }
];
createApplicationMenu(customTemplate);
```

### 2. Context Menus

```javascript
const { 
    createContextMenu, 
    chatInputContextMenu, 
    chatMessageContextMenu,
    MenuTemplates 
} = require('./path/to/menu');

// Pre-built context menus
createContextMenu('chat-input', chatInputContextMenu());
createContextMenu('chat-message', chatMessageContextMenu());
createContextMenu('code-block', MenuTemplates.getCodeBlockContext());

// Show context menu
ipcMain.on('show-context-menu', (event, menuType) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    showContextMenu(menuType, window);
});
```

### 3. Specialized Menus

#### Floating Chat Menu
```javascript
const { MenuTemplates } = require('./path/to/menu');

const floatingMenu = Menu.buildFromTemplate(MenuTemplates.getFloatingChatMenu());
floatingWindow.setMenu(floatingMenu);
```

#### Screen Capture Menu
```javascript
const screenCaptureMenu = MenuTemplates.getScreenCaptureMenu();
screenCaptureWindow.setMenu(Menu.buildFromTemplate(screenCaptureMenu));
```

#### Tray Menu
```javascript
const { Tray, Menu } = require('electron');

const tray = new Tray('path/to/icon.png');
tray.setContextMenu(Menu.buildFromTemplate(MenuTemplates.getTrayMenu()));
```

## Event Handling

### Setup Event Handlers

```javascript
const { setEventHandlers } = require('./path/to/menu');

setEventHandlers({
    // File menu events
    'new-chat': () => handleNewChat(),
    'open-history': () => handleOpenHistory(),
    'export-chat': () => handleExportChat(),
    
    // Edit menu events
    'clear-chat': () => handleClearChat(),
    
    // View menu events
    'toggle-floating-mode': () => handleToggleFloating(),
    'toggle-chat-input': () => handleToggleChatInput(),
    
    // AI menu events
    'start-screen-capture': () => handleScreenCapture(),
    'voice-input': () => handleVoiceInput(),
    
    // Context menu events
    'copy-message': () => handleCopyMessage(),
    'regenerate-response': () => handleRegenerateResponse(),
    'insert-template': (templateData) => handleInsertTemplate(templateData)
});
```

### Renderer Process Integration

In your renderer process (preload or renderer script):

```javascript
// In preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    showContextMenu: (menuType, options) => {
        ipcRenderer.send('show-context-menu', menuType, options);
    },
    
    onMenuAction: (callback) => {
        ipcRenderer.on('menu-action', callback);
    },
    
    onContextMenuAction: (callback) => {
        ipcRenderer.on('context-menu-action', callback);
    }
});
```

```javascript
// In renderer.js
// Show context menu on right-click
document.getElementById('chat-input').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    window.electronAPI.showContextMenu('chat-input', {
        x: e.clientX,
        y: e.clientY
    });
});

// Listen for menu actions
window.electronAPI.onMenuAction((event, action, data) => {
    switch (action) {
        case 'new-chat':
            startNewChat();
            break;
        case 'clear-chat':
            clearChatHistory();
            break;
        // Handle other actions...
    }
});
```

## Menu Customization

### Adding Custom Menu Items

```javascript
const { addMenuItem } = require('./path/to/menu');

// Add item to existing menu
addMenuItem('File', {
    label: 'Custom Action',
    accelerator: 'CmdOrCtrl+Shift+C',
    click: () => console.log('Custom action triggered')
});
```

### Updating Menu Items

```javascript
const { updateMenuItem } = require('./path/to/menu');

// Update menu item properties
updateMenuItem('View.Toggle Floating Mode', {
    enabled: false,
    checked: true
});
```

### Creating Custom Templates

```javascript
const customTemplate = [
    {
        label: 'My Custom Menu',
        submenu: [
            {
                label: 'Action 1',
                accelerator: 'CmdOrCtrl+1',
                click: () => handleAction1()
            },
            { type: 'separator' },
            {
                label: 'Settings',
                submenu: [
                    {
                        label: 'Option A',
                        type: 'checkbox',
                        checked: false,
                        click: (menuItem) => handleOptionA(menuItem.checked)
                    }
                ]
            }
        ]
    }
];

createApplicationMenu(customTemplate);
```

## Available Templates

| Template | Description |
|----------|-------------|
| `getDefaultApplicationMenu()` | Complete application menu with File, Edit, View, AI, Window, Help |
| `getFloatingChatMenu()` | Minimal menu for floating chat windows |
| `getScreenCaptureMenu()` | Menu for screen capture functionality |
| `getChatInputContext()` | Context menu for chat input fields |
| `getChatMessageContext()` | Context menu for chat messages |
| `getCodeBlockContext()` | Context menu for code blocks |
| `getTrayMenu()` | System tray menu |
| `getDeveloperMenu()` | Developer tools menu |

## Platform-Specific Menus

```javascript
const { getPlatformMenu } = require('./path/to/menu');

// Get platform-specific menu
const macMenu = getPlatformMenu('darwin');
const windowsMenu = getPlatformMenu('win32');
const linuxMenu = getPlatformMenu('linux');

// Or use current platform
const currentPlatformMenu = getPlatformMenu();
```

## Best Practices

1. **Event Handlers**: Always set up event handlers before creating menus
2. **Context Menus**: Use specific context menus for different UI components
3. **Keyboard Shortcuts**: Provide consistent keyboard shortcuts across platforms
4. **Platform Differences**: Account for macOS vs Windows/Linux menu differences
5. **Menu Updates**: Update menu states based on application state changes

## Complete Example

See `menu-usage-example.js` for a complete implementation example showing:
- Menu initialization
- Event handling
- Context menu setup
- IPC communication
- Floating window integration

## API Reference

### Functions

- `createApplicationMenu(template?, window?)` - Create and set application menu
- `createContextMenu(menuId, template)` - Create a context menu
- `showContextMenu(menuId, window, options?)` - Show a context menu
- `setEventHandlers(handlers)` - Set event handlers for menu actions
- `updateMenuItem(path, properties)` - Update menu item properties
- `addMenuItem(parentPath, itemTemplate, position?)` - Add menu item

### Classes

- `MenuManager` - Main menu management class
- `MenuTemplates` - Static class with pre-built menu templates

---

This menu API provides a complete solution for managing menus in your Electron application. Import it anywhere in your application and start using the pre-built templates or create your own custom menus.