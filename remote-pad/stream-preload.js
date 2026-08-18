const { contextBridge, desktopCapturer, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('streamAPI', {
  getPublisherConfig: () => ipcRenderer.invoke('remote-pad:livekit-publisher-config'),
  getDesktopSourceId: async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 0, height: 0 },
    });
    return sources[0]?.id ?? null;
  },
  handleInput: (message) => ipcRenderer.invoke('remote-pad:livekit-input', message),
  buildAuthResponse: (pin) => ipcRenderer.invoke('remote-pad:livekit-auth', pin),
  notifySessionIdle: () => ipcRenderer.invoke('remote-pad:livekit-session-idle'),
});
