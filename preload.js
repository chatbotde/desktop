const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", { 
    ping: () => "pong",
    // Window controls
    closeWindow: () => ipcRenderer.invoke('window-close'),
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
    setOpacity: (opacity) => ipcRenderer.invoke('window-set-opacity', opacity),
    toggleMouseIgnore: () => ipcRenderer.invoke('window-toggle-mouse-ignore'),
    // Content protection
    toggleContentProtection: () => ipcRenderer.invoke('window-toggle-content-protection'),
    getContentProtection: () => ipcRenderer.invoke('window-get-content-protection'),
    // Screen capture
    getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
    getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
    // Version info
    getVersions: () => Promise.resolve({
        electron: process.versions.electron,
        node: process.versions.node
    })
});
