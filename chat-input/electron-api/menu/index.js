const MenuManager = require('./menu-manager');
const MenuTemplates = require('./menu-templates');

// Create a singleton instance
const menuManager = new MenuManager();

// Export the manager and commonly used menu templates
module.exports = {
    MenuManager,
    MenuTemplates,
    menuManager,
    
    // Quick access functions
    createApplicationMenu: (template, window) => menuManager.createApplicationMenu(template, window),
    createContextMenu: (menuId, template) => menuManager.createContextMenu(menuId, template),
    showContextMenu: (menuId, window, options) => menuManager.showContextMenu(menuId, window, options),
    
    // Pre-built context menus
    chatInputContextMenu: () => menuManager.getChatInputContextMenu(),
    chatMessageContextMenu: () => menuManager.getChatMessageContextMenu(),
    
    // Specialized menu templates
    floatingChatMenu: () => MenuTemplates.getFloatingChatMenu(),
    screenCaptureMenu: () => MenuTemplates.getScreenCaptureMenu(),
    trayMenu: () => MenuTemplates.getTrayMenu(),
    codeBlockContextMenu: () => MenuTemplates.getCodeBlockContext(),
    developerMenu: () => MenuTemplates.getDeveloperMenu(),
    
    // Menu templates
    getDefaultAppMenu: () => menuManager.getDefaultApplicationMenu(),
    getPlatformMenu: (platform) => menuManager.getPlatformMenu(platform),
    
    // Event handling
    setEventHandlers: (handlers) => {
        menuManager.setEventHandlers(handlers);
        MenuTemplates.setEventHandlers(handlers);
    },
    
    // Menu item management
    updateMenuItem: (path, properties) => menuManager.updateMenuItem(path, properties),
    addMenuItem: (parentPath, itemTemplate, position) => menuManager.addMenuItem(parentPath, itemTemplate, position)
};