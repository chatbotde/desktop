/**
 * Example usage of the Menu API
 * This file demonstrates how to use the menu system in your Electron application
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Import the menu API
const { 
    menuManager, 
    createApplicationMenu, 
    createContextMenu,
    chatInputContextMenu,
    chatMessageContextMenu,
    setEventHandlers 
} = require('./menu');

const MenuTemplates = require('./menu-templates');

class AppMenuHandler {
    constructor() {
        this.mainWindow = null;
        this.chatWindow = null;
        this.setupEventHandlers();
    }

    /**
     * Initialize the application menu
     */
    initializeMenu(mainWindow) {
        this.mainWindow = mainWindow;
        
        // Create the main application menu
        createApplicationMenu(null, mainWindow);
        
        // Create context menus
        this.setupContextMenus();
    }

    /**
     * Setup context menus for different components
     */
    setupContextMenus() {
        // Chat input context menu
        createContextMenu('chat-input', chatInputContextMenu());
        
        // Chat message context menu  
        createContextMenu('chat-message', chatMessageContextMenu());
        
        // Code block context menu
        createContextMenu('code-block', MenuTemplates.getCodeBlockContext());
        
        // Floating chat menu
        createContextMenu('floating-chat', MenuTemplates.getFloatingChatMenu());
    }

    /**
     * Setup event handlers for menu actions
     */
    setupEventHandlers() {
        setEventHandlers({
            // File menu actions
            'new-chat': () => {
                console.log('Creating new chat...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('menu-action', 'new-chat');
                }
            },
            
            'open-history': () => {
                console.log('Opening chat history...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('menu-action', 'open-history');
                }
            },
            
            'export-chat': () => {
                console.log('Exporting chat...');
                this.exportChat();
            },
            
            'clear-chat': () => {
                console.log('Clearing chat...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('menu-action', 'clear-chat');
                }
            },
            
            // View menu actions
            'toggle-chat-input': () => {
                console.log('Toggling chat input...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('menu-action', 'toggle-chat-input');
                }
            },
            
            'toggle-floating-mode': () => {
                console.log('Toggling floating mode...');
                this.toggleFloatingMode();
            },
            
            // AI menu actions
            'start-screen-capture': () => {
                console.log('Starting screen capture...');
                this.startScreenCapture();
            },
            
            'voice-input': () => {
                console.log('Starting voice input...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('menu-action', 'voice-input');
                }
            },
            
            'ai-model-settings': () => {
                console.log('Opening AI model settings...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('menu-action', 'ai-model-settings');
                }
            },
            
            // Context menu actions
            'copy-message': () => {
                console.log('Copying message...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('context-menu-action', 'copy-message');
                }
            },
            
            'copy-as-code': () => {
                console.log('Copying as code...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('context-menu-action', 'copy-as-code');
                }
            },
            
            'regenerate-response': () => {
                console.log('Regenerating response...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('context-menu-action', 'regenerate-response');
                }
            },
            
            'clear-input': () => {
                console.log('Clearing input...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('context-menu-action', 'clear-input');
                }
            },
            
            'insert-template': (templateData) => {
                console.log('Inserting template:', templateData.type);
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('context-menu-action', 'insert-template', templateData);
                }
            },
            
            // Help menu actions
            'about': () => {
                console.log('Showing about dialog...');
                this.showAboutDialog();
            },
            
            'show-shortcuts': () => {
                console.log('Showing keyboard shortcuts...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('menu-action', 'show-shortcuts');
                }
            },
            
            // Settings
            'preferences-open': () => {
                console.log('Opening preferences...');
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('menu-action', 'open-preferences');
                }
            }
        });
    }

    /**
     * Export chat functionality
     */
    async exportChat() {
        const { dialog } = require('electron');
        
        try {
            const result = await dialog.showSaveDialog(this.mainWindow, {
                title: 'Export Chat',
                defaultPath: `chat-export-${new Date().toISOString().split('T')[0]}.json`,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'Text Files', extensions: ['txt'] },
                    { name: 'Markdown Files', extensions: ['md'] }
                ]
            });
            
            if (!result.canceled && result.filePath) {
                this.mainWindow.webContents.send('export-chat', result.filePath);
            }
        } catch (error) {
            console.error('Export chat error:', error);
        }
    }

    /**
     * Toggle floating mode
     */
    toggleFloatingMode() {
        if (this.chatWindow && !this.chatWindow.isDestroyed()) {
            this.chatWindow.close();
            this.chatWindow = null;
        } else {
            this.createFloatingChatWindow();
        }
    }

    /**
     * Create floating chat window
     */
    createFloatingChatWindow() {
        this.chatWindow = new BrowserWindow({
            width: 400,
            height: 600,
            alwaysOnTop: true,
            frame: false,
            transparent: true,
            resizable: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../../chat-input-preload.js')
            }
        });

        // Set floating chat menu
        this.chatWindow.setMenu(null);
        
        // Load floating chat HTML
        this.chatWindow.loadFile(path.join(__dirname, '../../chat-input.html'));
        
        // Handle window closed
        this.chatWindow.on('closed', () => {
            this.chatWindow = null;
        });
    }

    /**
     * Start screen capture
     */
    startScreenCapture() {
        // Implement screen capture logic
        if (this.mainWindow) {
            this.mainWindow.webContents.send('start-screen-capture');
        }
    }

    /**
     * Show about dialog
     */
    async showAboutDialog() {
        const { dialog } = require('electron');
        
        await dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About SonicPlane',
            message: 'SonicPlane',
            detail: 'An AI-powered chat application with screen capture capabilities.\n\nVersion: 1.0.0\nBuilt with Electron',
            buttons: ['OK']
        });
    }

    /**
     * Setup IPC handlers for renderer process
     */
    setupIPC() {
        // Handle context menu requests from renderer
        ipcMain.on('show-context-menu', (event, menuType, options = {}) => {
            const window = BrowserWindow.fromWebContents(event.sender);
            
            switch (menuType) {
                case 'chat-input':
                    menuManager.showContextMenu('chat-input', window, options);
                    break;
                case 'chat-message':
                    menuManager.showContextMenu('chat-message', window, options);
                    break;
                case 'code-block':
                    menuManager.showContextMenu('code-block', window, options);
                    break;
                default:
                    console.warn('Unknown context menu type:', menuType);
            }
        });
        
        // Handle menu updates from renderer
        ipcMain.on('update-menu-item', (event, menuPath, properties) => {
            menuManager.updateMenuItem(menuPath, properties);
        });
    }
}

// Usage in your main process:
// const menuHandler = new AppMenuHandler();
// 
// app.whenReady().then(() => {
//     const mainWindow = createMainWindow();
//     menuHandler.initializeMenu(mainWindow);
//     menuHandler.setupIPC();
// });

module.exports = AppMenuHandler;