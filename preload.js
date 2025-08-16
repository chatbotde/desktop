const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", { 
    ping: () => "pong",
    // Window controls
    closeWindow: () => ipcRenderer.invoke('window-close'),
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
    setOpacity: (opacity) => ipcRenderer.invoke('window-set-opacity', opacity),
    toggleMouseIgnore: () => ipcRenderer.invoke('window-toggle-mouse-ignore'),
    forceAboveTaskbar: () => ipcRenderer.invoke('window-force-above-taskbar'),
    // Content protection
    toggleContentProtection: () => ipcRenderer.invoke('window-toggle-content-protection'),
    getContentProtection: () => ipcRenderer.invoke('window-get-content-protection'),
    // Theme
    setTheme: (theme) => ipcRenderer.invoke('window-set-theme', theme),
    getTheme: () => ipcRenderer.invoke('window-get-theme'),
    onThemeChanged: (callback) => ipcRenderer.on('theme-changed', (event, theme) => callback(theme)),

    // Chat input integration
    onChatMessage: (callback) => {
        console.log('Main Preload: Setting up chat message listener');
        ipcRenderer.on('receive-chat-message', (event, messageData) => {
            console.log('Main Preload: Received chat message:', messageData);
            callback(messageData);
        });
    },
    sendChatInputToggle: () => {
        console.log('Main Preload: Sending toggle chat input');
        ipcRenderer.send('toggle-chat-input');
    },

    // Screen capture
    getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
    getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
    // Version info
    getVersions: () => Promise.resolve({
        electron: process.versions.electron,
        node: process.versions.node
    })
});
