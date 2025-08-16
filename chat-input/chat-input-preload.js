const { contextBridge, ipcRenderer } = require("electron");

// Expose chat input specific APIs to the renderer process
contextBridge.exposeInMainWorld("chatInputAPI", {
  // Send message to main process
  sendMessage: (messageData) => {
    console.log('Preload: Sending message via IPC:', messageData);
    ipcRenderer.send('send-chat-message', messageData);
  },
  
  // Listen for commands from main process
  onClearInput: (callback) => ipcRenderer.on('clear-input', callback),
  onFocusInput: (callback) => ipcRenderer.on('focus-input', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Also expose a minimal window API for basic functionality
contextBridge.exposeInMainWorld("windowAPI", {
  close: () => ipcRenderer.invoke('chat-input-close'),
  hide: () => ipcRenderer.invoke('chat-input-hide')
});