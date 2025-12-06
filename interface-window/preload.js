const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('interfaceAPI', {
  // Basic window controls
  minimize: () => ipcRenderer.send('interface-window:minimize'),
  maximize: () => ipcRenderer.send('interface-window:maximize'),
  close: () => ipcRenderer.send('interface-window:close'),
  
  // Example: Send message to main process
  sendMessage: (channel, data) => {
    const validChannels = ['interface-action'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Example: Receive message from main process
  onMessage: (channel, func) => {
    const validChannels = ['interface-update'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },

  // Click-through control
  setIgnoreMouseEvents: (ignore) => {
    ipcRenderer.send('interface-window:set-ignore-mouse-events', ignore);
  }
});
