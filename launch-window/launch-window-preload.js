/**
 * Launch Window Preload Script
 * Exposes content protection API with highest priority security
 */

const { contextBridge, ipcRenderer } = require("electron");

// Expose secure API for launch window
contextBridge.exposeInMainWorld("launchWindowAPI", {
  // Content Protection API (Highest Priority)
  toggleContentProtection: () => ipcRenderer.invoke('launch-window-toggle-content-protection'),
  getContentProtection: () => ipcRenderer.invoke('launch-window-get-content-protection'),
  enableContentProtection: () => ipcRenderer.invoke('launch-window-enable-content-protection'),
  disableContentProtection: () => ipcRenderer.invoke('launch-window-disable-content-protection'),
  
  // Window Control
  openMainWindow: () => ipcRenderer.send('open-main-window'),
  
  // Security logging
  logSecurityEvent: (event, details) => {
    console.log(`Launch Window Security Event: ${event}`, details);
  }
});

// Prevent any script injection or modification attempts
Object.freeze(window.launchWindowAPI);

// Additional security measures for highest priority content protection
document.addEventListener('DOMContentLoaded', () => {
  // Disable drag and drop to prevent file access
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());
  
  // Disable text selection for added security
  document.addEventListener('selectstart', (e) => e.preventDefault());
  
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Disable F12 and developer shortcuts
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault();
      window.launchWindowAPI.logSecurityEvent('BLOCKED_DEV_SHORTCUT', { key: e.key, ctrl: e.ctrlKey, shift: e.shiftKey });
    }
  });
  
  // Log content protection status
  window.launchWindowAPI.getContentProtection().then(enabled => {
    window.launchWindowAPI.logSecurityEvent('CONTENT_PROTECTION_STATUS', { enabled, priority: 'HIGHEST' });
  });
});
