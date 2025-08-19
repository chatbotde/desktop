const { contextBridge, ipcRenderer } = require("electron");

// Expose chat input specific APIs to the renderer process
contextBridge.exposeInMainWorld("chatInputAPI", {
  // Send message to main process
  sendMessage: (messageData) => {
    console.log('Preload: Sending message via IPC:', messageData);
    ipcRenderer.send('send-chat-message', messageData);
  },
  
  // Update window height dynamically
  updateWindowHeight: (height) => {
    ipcRenderer.send('chat-input-resize-height', height);
  },
  
  // Window drag functionality
  setWindowPosition: (deltaX, deltaY) => {
    ipcRenderer.send('chat-input-set-position', { deltaX, deltaY });
  },
  
  // Window visibility controls
  hideWindow: () => {
    console.log('Preload: Hiding chat input window');
    ipcRenderer.send('hide-chat-input');
  },
  
  // Toggle main window visibility
  toggleMainWindow: () => {
    console.log('Preload: Toggling main window visibility');
    ipcRenderer.send('toggle-main-window');
  },
  
  // Future extensibility - placeholder functions for additional features
  openAttachmentPicker: () => {
    console.log('Preload: Opening attachment picker (placeholder)');
    // Future implementation
  },
  
  // Future functions (commented out for now)
  /*
  openSearch: () => {
    console.log('Preload: Opening search (placeholder)');
    // Future implementation
  },
  
  openMoreActions: () => {
    console.log('Preload: Opening more actions (placeholder)');
    // Future implementation
  },
  
  openVoiceRecording: () => {
    console.log('Preload: Opening voice recording (placeholder)');
    // Future implementation
  },
  */
  
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