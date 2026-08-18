const { contextBridge, desktopCapturer, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lanP2pAPI', {
  getDesktopSourceId: async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 0, height: 0 },
    });
    const primary =
      sources.find((source) => /primary|screen 1|display 1/i.test(source.name)) ?? sources[0];
    return primary?.id ?? null;
  },
  sendSignal: (message) => ipcRenderer.send('remote-pad:lan-p2p-signal', message),
  onSignal: (handler) => {
    const listener = (_event, message) => handler(message);
    ipcRenderer.on('remote-pad:lan-p2p-from-phone', listener);
    return () => ipcRenderer.removeListener('remote-pad:lan-p2p-from-phone', listener);
  },
});
