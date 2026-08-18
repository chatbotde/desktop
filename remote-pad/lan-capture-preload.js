const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lanCaptureAPI', {
  sendFrame: (buffer) => ipcRenderer.send('remote-pad:lan-frame', buffer),
});
