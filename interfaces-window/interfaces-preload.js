/**
 * Interfaces Window Preload Script
 * 
 * Exposes safe APIs to the renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer
contextBridge.exposeInMainWorld('interfacesAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('interfaces:minimize'),
  maximize: () => ipcRenderer.send('interfaces:maximize'),
  close: () => ipcRenderer.send('interfaces:close'),
  isMaximized: () => ipcRenderer.invoke('interfaces:is-maximized'),

  // Data operations
  getInterfaces: () => ipcRenderer.invoke('interfaces:get-all'),
  getInterface: (id) => ipcRenderer.invoke('interfaces:get', id),
  createInterface: (data) => ipcRenderer.invoke('interfaces:create', data),
  updateInterface: (id, data) => ipcRenderer.invoke('interfaces:update', id, data),
  deleteInterface: (id) => ipcRenderer.invoke('interfaces:delete', id),

  // Event listeners
  onDataUpdate: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('interfaces:data-updated', subscription);
    return () => ipcRenderer.removeListener('interfaces:data-updated', subscription);
  },

  onError: (callback) => {
    const subscription = (event, error) => callback(error);
    ipcRenderer.on('interfaces:error', subscription);
    return () => ipcRenderer.removeListener('interfaces:error', subscription);
  },

  onMaximizeChange: (callback) => {
    const subscription = (event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('interfaces:maximize-changed', subscription);
    return () => ipcRenderer.removeListener('interfaces:maximize-changed', subscription);
  },
});

// Expose electron API (compatible with your frontend)
contextBridge.exposeInMainWorld('electron', {
  // IPC
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  once: (channel, callback) => {
    ipcRenderer.once(channel, (event, ...args) => callback(...args));
  },
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// Expose platform info
contextBridge.exposeInMainWorld('platform', {
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  isElectron: true,
});

// Expose clickthrough API
contextBridge.exposeInMainWorld('clickthroughAPI', {
  enable: () => ipcRenderer.send('interfaces:clickthrough:enable'),
  disable: () => ipcRenderer.send('interfaces:clickthrough:disable'),
  toggle: () => ipcRenderer.send('interfaces:clickthrough:toggle'),
  getState: () => ipcRenderer.invoke('interfaces:clickthrough:get-state'),
  
  // Listen for state changes
  onStateChange: (callback) => {
    const subscription = (event, enabled) => callback(enabled);
    ipcRenderer.on('interfaces:clickthrough:state-changed', subscription);
    return () => ipcRenderer.removeListener('interfaces:clickthrough:state-changed', subscription);
  },
});
