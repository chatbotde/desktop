const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('inputMethod', {
    insertText: (text) => ipcRenderer.invoke('input-method:insert-text', text),
    insertTextWithTyping: (text, delay) => ipcRenderer.invoke('input-method:insert-typing', { text, delay }),
    getSelectedText: () => ipcRenderer.invoke('input-method:get-selected'),
    replaceSelectedText: (text) => ipcRenderer.invoke('input-method:replace-selected', text),
    getActiveApplication: () => ipcRenderer.invoke('input-method:get-active-app'),
    isTextInputActive: () => ipcRenderer.invoke('input-method:check-text-input'),
    getCursorPosition: () => ipcRenderer.invoke('input-method:get-cursor-position'),
    sendKeyboardShortcut: (key, modifiers) => ipcRenderer.invoke('input-method:send-shortcut', { key, modifiers }),
    startMonitoring: () => ipcRenderer.send('input-method:start-monitoring'),
    stopMonitoring: () => ipcRenderer.send('input-method:stop-monitoring'),
    onEvent: (callback) => {
        ipcRenderer.on('input-method:event', (event, data) => callback(data));
    }
});
