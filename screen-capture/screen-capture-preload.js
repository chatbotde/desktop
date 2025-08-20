const { contextBridge, ipcRenderer } = require('electron');

// Secure API bridge for screen capture functionality
contextBridge.exposeInMainWorld('screenCaptureAPI', {
  // Screen source methods
  getScreenSources: () => ipcRenderer.invoke('screen-capture-get-sources'),
  getScreenInfo: () => ipcRenderer.invoke('screen-capture-get-screen-info'),
  
  // Recording control methods
  startScreenRecording: (sourceId) => ipcRenderer.invoke('screen-capture-start-recording', 'screen', sourceId),
  startVideoRecording: (sourceId) => ipcRenderer.invoke('screen-capture-start-recording', 'video', sourceId),
  startAudioRecording: () => ipcRenderer.invoke('screen-capture-start-recording', 'audio'),
  stopRecording: () => ipcRenderer.invoke('screen-capture-stop-recording'),
  
  // Window control methods
  closeWindow: () => ipcRenderer.invoke('screen-capture-close-window'),
  minimizeWindow: () => ipcRenderer.invoke('screen-capture-minimize-window'),
  
  // Recording status events
  onRecordingStarted: (callback) => {
    ipcRenderer.on('recording-started', (event, data) => callback(data));
  },
  onRecordingStopped: (callback) => {
    ipcRenderer.on('recording-stopped', (event, data) => callback(data));
  },
  
  // Audio utility methods (if audio utils are provided)
  saveDebugAudio: (buffer, type) => ipcRenderer.invoke('screen-capture-save-debug-audio', buffer, type),
  analyzeAudioBuffer: (buffer, label) => ipcRenderer.invoke('screen-capture-analyze-audio', buffer, label),
  
  // Security logging
  logSecurityEvent: (event, data) => ipcRenderer.invoke('screen-capture-log-security', event, data),
  
  // Content protection status
  getContentProtection: () => ipcRenderer.invoke('screen-capture-get-content-protection'),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// Prevent any script injection or modification attempts
Object.freeze(window.screenCaptureAPI);

// Maximum security measures for content protection
document.addEventListener('DOMContentLoaded', () => {
  // Disable drag and drop completely
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Disable text selection for security
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Block all developer shortcuts and inspection attempts
  document.addEventListener('keydown', (e) => {
    const blockedShortcuts = [
      'F12', // Dev tools
      ...(e.ctrlKey && e.shiftKey ? ['KeyI', 'KeyJ', 'KeyC'] : []), // Dev shortcuts
      ...(e.ctrlKey ? ['KeyU', 'KeyS'] : []), // View source, save
      ...(e.altKey ? ['F4'] : []), // Alt+F4
    ];
    
    if (blockedShortcuts.includes(e.code) || blockedShortcuts.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      window.screenCaptureAPI.logSecurityEvent('BLOCKED_DEV_SHORTCUT', { 
        key: e.key, 
        code: e.code, 
        ctrl: e.ctrlKey, 
        shift: e.shiftKey, 
        alt: e.altKey 
      });
    }
  });
  
  // Disable image saving attempts
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });
  
  // Block printing
  window.addEventListener('beforeprint', (e) => {
    e.preventDefault();
    window.screenCaptureAPI.logSecurityEvent('BLOCKED_PRINT_ATTEMPT', {});
  });
  
  // Monitor for content protection bypass attempts
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Block any script injection attempts
            if (node.tagName === 'SCRIPT' && !node.src.includes('screen-capture')) {
              node.remove();
              window.screenCaptureAPI.logSecurityEvent('BLOCKED_SCRIPT_INJECTION', { 
                src: node.src, 
                content: node.textContent 
              });
            }
            
            // Block iframe injection
            if (node.tagName === 'IFRAME') {
              node.remove();
              window.screenCaptureAPI.logSecurityEvent('BLOCKED_IFRAME_INJECTION', { 
                src: node.src 
              });
            }
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true
  });
  
  // Log successful content protection initialization
  window.screenCaptureAPI.getContentProtection().then(enabled => {
    window.screenCaptureAPI.logSecurityEvent('CONTENT_PROTECTION_INITIALIZED', { 
      enabled, 
      priority: 'MAXIMUM',
      timestamp: Date.now()
    });
  });
  
  // Hide cursor when not moving for additional security
  let cursorTimeout;
  document.addEventListener('mousemove', () => {
    document.body.style.cursor = 'default';
    clearTimeout(cursorTimeout);
    cursorTimeout = setTimeout(() => {
      document.body.style.cursor = 'none';
    }, 3000);
  });
  
  console.log('Screen Capture Window: Maximum security preload initialized');
});

// Additional protection against common bypass techniques
(function() {
  'use strict';
  
  // Override console methods to prevent information leakage
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.log = function(...args) {
    // Only allow our own logging
    if (args[0] && args[0].includes('Screen Capture Window:')) {
      originalLog.apply(console, args);
    }
  };
  
  console.error = function(...args) {
    if (args[0] && args[0].includes('Screen Capture Window:')) {
      originalError.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    if (args[0] && args[0].includes('Screen Capture Window:')) {
      originalWarn.apply(console, args);
    }
  };
  
  // Disable eval and Function constructor
  window.eval = function() {
    throw new Error('eval() is disabled for security');
  };
  
  window.Function = function() {
    throw new Error('Function constructor is disabled for security');
  };
  
  // Freeze important objects
  Object.freeze(window);
  Object.freeze(document);
  Object.freeze(console);
})();

