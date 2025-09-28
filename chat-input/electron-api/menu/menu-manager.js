const { Menu, MenuItem, dialog, shell } = require('electron');

class MenuManager {
    constructor() {
        this.currentMenu = null;
        this.menuTemplate = [];
        this.contextMenus = new Map();
    }

    /**
     * Create and set the application menu
     * @param {Object} template - Menu template object
     * @param {BrowserWindow} window - Target window (optional)
     */
    createApplicationMenu(template = null, window = null) {
        const menuTemplate = template || this.getDefaultApplicationMenu();
        this.currentMenu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(this.currentMenu);
        
        if (window) {
            window.setMenu(this.currentMenu);
        }
        
        return this.currentMenu;
    }

    /**
     * Get default application menu template
     * @returns {Array} Default menu template
     */
    getDefaultApplicationMenu() {
        const isMac = process.platform === 'darwin';
        
        return [
            // App Menu (macOS)
            ...(isMac ? [{
                label: 'SonicPlane',
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { 
                        label: 'Preferences',
                        accelerator: 'CmdOrCtrl+,',
                        click: () => this.emit('preferences-open')
                    },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideothers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            }] : []),
            
            // File Menu
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Chat',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => this.emit('new-chat')
                    },
                    {
                        label: 'Open Chat History',
                        accelerator: 'CmdOrCtrl+O',
                        click: () => this.emit('open-history')
                    },
                    { type: 'separator' },
                    {
                        label: 'Export Chat',
                        accelerator: 'CmdOrCtrl+E',
                        click: () => this.emit('export-chat')
                    },
                    { type: 'separator' },
                    ...(isMac ? [] : [
                        {
                            label: 'Settings',
                            accelerator: 'CmdOrCtrl+,',
                            click: () => this.emit('preferences-open')
                        },
                        { type: 'separator' }
                    ]),
                    isMac ? { role: 'close' } : { role: 'quit' }
                ]
            },

            // Edit Menu
            {
                label: 'Edit',
                submenu: [
                    { role: 'undo' },
                    { role: 'redo' },
                    { type: 'separator' },
                    { role: 'cut' },
                    { role: 'copy' },
                    { role: 'paste' },
                    { role: 'selectall' },
                    { type: 'separator' },
                    {
                        label: 'Clear Chat',
                        accelerator: 'CmdOrCtrl+K',
                        click: () => this.emit('clear-chat')
                    }
                ]
            },

            // View Menu
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Toggle Chat Input',
                        accelerator: 'CmdOrCtrl+I',
                        click: () => this.emit('toggle-chat-input')
                    },
                    {
                        label: 'Toggle Floating Mode',
                        accelerator: 'CmdOrCtrl+F',
                        click: () => this.emit('toggle-floating-mode')
                    },
                    { type: 'separator' },
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },

            // AI Menu
            {
                label: 'AI',
                submenu: [
                    {
                        label: 'Start Screen Capture',
                        accelerator: 'CmdOrCtrl+Shift+S',
                        click: () => this.emit('start-screen-capture')
                    },
                    {
                        label: 'Voice Input',
                        accelerator: 'CmdOrCtrl+Shift+V',
                        click: () => this.emit('voice-input')
                    },
                    { type: 'separator' },
                    {
                        label: 'AI Model Settings',
                        click: () => this.emit('ai-model-settings')
                    }
                ]
            },

            // Window Menu
            {
                label: 'Window',
                submenu: [
                    { role: 'minimize' },
                    { role: 'close' },
                    ...(isMac ? [
                        { type: 'separator' },
                        { role: 'front' },
                        { type: 'separator' },
                        { role: 'window' }
                    ] : [])
                ]
            },

            // Help Menu
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About SonicPlane',
                        click: () => this.emit('about')
                    },
                    {
                        label: 'Documentation',
                        click: async () => {
                            await shell.openExternal('https://github.com/your-repo/sonicplane/docs');
                        }
                    },
                    {
                        label: 'Report Issue',
                        click: async () => {
                            await shell.openExternal('https://github.com/your-repo/sonicplane/issues');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Keyboard Shortcuts',
                        accelerator: 'CmdOrCtrl+?',
                        click: () => this.emit('show-shortcuts')
                    }
                ]
            }
        ];
    }

    /**
     * Create a context menu
     * @param {String} menuId - Unique identifier for the menu
     * @param {Array} template - Menu template
     * @returns {Menu} Context menu instance
     */
    createContextMenu(menuId, template) {
        const menu = Menu.buildFromTemplate(template);
        this.contextMenus.set(menuId, menu);
        return menu;
    }

    /**
     * Show context menu
     * @param {String} menuId - Menu identifier
     * @param {BrowserWindow} window - Target window
     * @param {Object} options - Position and other options
     */
    showContextMenu(menuId, window, options = {}) {
        const menu = this.contextMenus.get(menuId);
        if (menu && window) {
            menu.popup({
                window,
                ...options
            });
        }
    }

    /**
     * Get chat input context menu template
     * @returns {Array} Context menu template
     */
    getChatInputContextMenu() {
        return [
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { type: 'separator' },
            { role: 'selectall' },
            { type: 'separator' },
            {
                label: 'Clear Input',
                click: () => this.emit('clear-input')
            },
            {
                label: 'Insert Template',
                submenu: [
                    {
                        label: 'Code Review',
                        click: () => this.emit('insert-template', 'code-review')
                    },
                    {
                        label: 'Bug Report',
                        click: () => this.emit('insert-template', 'bug-report')
                    },
                    {
                        label: 'Feature Request',
                        click: () => this.emit('insert-template', 'feature-request')
                    }
                ]
            }
        ];
    }

    /**
     * Get chat message context menu template
     * @returns {Array} Context menu template
     */
    getChatMessageContextMenu() {
        return [
            {
                label: 'Copy Message',
                click: () => this.emit('copy-message')
            },
            {
                label: 'Copy as Code',
                click: () => this.emit('copy-as-code')
            },
            { type: 'separator' },
            {
                label: 'Regenerate Response',
                click: () => this.emit('regenerate-response')
            },
            {
                label: 'Edit Message',
                click: () => this.emit('edit-message')
            },
            { type: 'separator' },
            {
                label: 'Export Message',
                click: () => this.emit('export-message')
            },
            {
                label: 'Delete Message',
                click: () => this.emit('delete-message')
            }
        ];
    }

    /**
     * Update menu item state
     * @param {String} menuPath - Path to menu item (e.g., 'File.New Chat')
     * @param {Object} properties - Properties to update
     */
    updateMenuItem(menuPath, properties) {
        if (!this.currentMenu) return;
        
        const pathArray = menuPath.split('.');
        let currentItem = this.currentMenu;
        
        for (let i = 0; i < pathArray.length; i++) {
            const label = pathArray[i];
            const items = currentItem.items || currentItem.submenu?.items;
            
            if (!items) break;
            
            currentItem = items.find(item => item.label === label);
            if (!currentItem) break;
            
            if (i === pathArray.length - 1) {
                // Update the final item
                Object.assign(currentItem, properties);
            }
        }
    }

    /**
     * Add custom menu item
     * @param {String} parentPath - Path to parent menu
     * @param {Object} itemTemplate - Menu item template
     * @param {Number} position - Position to insert (optional)
     */
    addMenuItem(parentPath, itemTemplate, position = -1) {
        if (!this.currentMenu) return;
        
        const pathArray = parentPath.split('.');
        let currentItem = this.currentMenu;
        
        for (const label of pathArray) {
            const items = currentItem.items || currentItem.submenu?.items;
            if (!items) return;
            
            currentItem = items.find(item => item.label === label);
            if (!currentItem) return;
        }
        
        const submenu = currentItem.submenu;
        if (submenu) {
            const newItem = new MenuItem(itemTemplate);
            if (position === -1) {
                submenu.append(newItem);
            } else {
                submenu.insert(position, newItem);
            }
        }
    }

    /**
     * Remove menu item
     * @param {String} menuPath - Path to menu item
     */
    removeMenuItem(menuPath) {
        // Note: Electron doesn't support removing menu items after creation
        // You would need to rebuild the entire menu
        console.warn('Menu item removal requires rebuilding the entire menu');
    }

    /**
     * Event emitter for menu actions
     * @param {String} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data = null) {
        if (this.eventHandlers && this.eventHandlers[event]) {
            this.eventHandlers[event](data);
        }
    }

    /**
     * Set event handlers for menu actions
     * @param {Object} handlers - Event handlers object
     */
    setEventHandlers(handlers) {
        this.eventHandlers = handlers;
    }

    /**
     * Get system menu template for different platforms
     * @param {String} platform - Platform identifier
     * @returns {Array} Platform-specific menu template
     */
    getPlatformMenu(platform = process.platform) {
        switch (platform) {
            case 'darwin':
                return this.getMacOSMenu();
            case 'win32':
                return this.getWindowsMenu();
            case 'linux':
                return this.getLinuxMenu();
            default:
                return this.getDefaultApplicationMenu();
        }
    }

    /**
     * macOS specific menu
     */
    getMacOSMenu() {
        return this.getDefaultApplicationMenu();
    }

    /**
     * Windows specific menu
     */
    getWindowsMenu() {
        const template = this.getDefaultApplicationMenu();
        // Add Windows-specific modifications
        return template;
    }

    /**
     * Linux specific menu
     */
    getLinuxMenu() {
        const template = this.getDefaultApplicationMenu();
        // Add Linux-specific modifications
        return template;
    }
}

module.exports = MenuManager;