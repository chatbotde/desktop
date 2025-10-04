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

    // Dynamic window resizing
    notifyContentSizeChanged: (width, height) => ipcRenderer.invoke('content-size-changed', width, height),
    getContentSize: () => {
        return {
            width: Math.max(
                document.body.scrollWidth,
                document.body.offsetWidth,
                document.documentElement.clientWidth,
                document.documentElement.scrollWidth,
                document.documentElement.offsetWidth
            ),
            height: Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            )
        };
    },

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
    removeAllListeners: (channel) => {
        console.log('Main Preload: Removing all listeners for channel:', channel);
        ipcRenderer.removeAllListeners(channel);
    },

    // Screen capture
    getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
    getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
    // Version info
    getVersions: () => Promise.resolve({
        electron: process.versions.electron,
        node: process.versions.node
    }),

    // MCP APIs
    mcpConnect: (config) => ipcRenderer.invoke('mcp:connect', config),
    mcpSend: (serverId, message) => ipcRenderer.invoke('mcp:send', serverId, message),
    mcpDisconnect: (serverId) => ipcRenderer.invoke('mcp:disconnect', serverId),
    onMcpMessage: (serverId, callback) => {
        const handler = (event, sid, message) => {
            if (sid === serverId) callback(message);
        };
        ipcRenderer.on('mcp:message', handler);
        return () => ipcRenderer.removeListener('mcp:message', handler);
    }
});
