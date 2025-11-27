const { contextBridge, ipcRenderer } = require("electron");

// Expose chat input specific APIs to the renderer process
contextBridge.exposeInMainWorld("chatInputAPI", {
  // Send message to main process
  sendMessage: (messageData) => {
    console.log('Preload: Sending message via IPC:', messageData);
    ipcRenderer.send('send-chat-message', messageData);
  },
  
  // ==================== ADVANCED GEOMETRY CONTROL ====================
  
  // Update window height dynamically
  updateWindowHeight: (height) => {
    ipcRenderer.send('chat-input-resize-height', height);
  },
  
  // Window drag functionality
  setWindowPosition: (deltaX, deltaY) => {
    ipcRenderer.send('chat-input-set-position', { deltaX, deltaY });
  },
  
  // Advanced window geometry control
  setWindowBounds: (bounds) => {
    ipcRenderer.send('chat-input-set-bounds', bounds);
  },
  
  // Get current window geometry
  getWindowGeometry: () => {
    return ipcRenderer.invoke('chat-input-get-geometry');
  },
  
  // Set window size with optional position
  setWindowSize: (width, height, center = false) => {
    ipcRenderer.send('chat-input-set-size', { width, height, center });
  },
  
  // Animate window geometry changes
  animateWindowGeometry: (targetBounds, duration = 300) => {
    ipcRenderer.send('chat-input-animate-geometry', { targetBounds, duration });
  },
  
  // Smart window adjustment for UI elements
  adjustWindowForElement: (elementId, options = {}) => {
    ipcRenderer.send('chat-input-adjust-for-element', { elementId, options });
  },
  
  // Get screen information for positioning
  getScreenInfo: () => {
    return ipcRenderer.invoke('chat-input-get-screen-info');
  },
  
  // Position window relative to screen coordinates
  setWindowScreenPosition: (x, y, width, height) => {
    ipcRenderer.send('chat-input-set-screen-position', { x, y, width, height });
  },
  
  // ==================== CLICK-THROUGH CONTROL ====================
  
  // Enable click-through mode (mouse events pass through window)
  enableClickThrough: () => {
    ipcRenderer.send('chat-input-enable-click-through');
  },
  
  // Disable click-through mode (normal mouse interaction)
  disableClickThrough: () => {
    ipcRenderer.send('chat-input-disable-click-through');
  },
  
  // Toggle click-through mode
  toggleClickThrough: () => {
    ipcRenderer.send('chat-input-toggle-click-through');
  },

  // ==================== CONTENT PROTECTION CONTROL ====================
  
  // Toggle content protection (prevent screen capture)
  toggleContentProtection: () => {
    console.log('Preload: Toggling content protection');
    return ipcRenderer.invoke('chat-input-toggle-content-protection');
  },
  
  // Get content protection status
  getContentProtection: () => {
    console.log('Preload: Getting content protection status');
    return ipcRenderer.invoke('chat-input-get-content-protection');
  },
  
  // Set content protection state
  setContentProtection: (enabled) => {
    console.log('Preload: Setting content protection to', enabled);
    return ipcRenderer.invoke('chat-input-set-content-protection', enabled);
  },
  
  // Window visibility controls
  hideWindow: () => {
    console.log('Preload: Hiding chat input window');
    ipcRenderer.send('hide-chat-input');
  },
  
  // Sign out from the app
  signOut: () => {
    console.log('Preload: Signing out');
    ipcRenderer.send('auth:logout');
  },
  
  // Listen for show chat input UI event (from launch window click)
  onShowChatInputUI: (callback) => {
    ipcRenderer.on('show-chat-input-ui', callback);
  },
  
  // ==================== FILE PICKER METHODS ====================
  
  // Image and attachment handling
  openImagePicker: () => {
    console.log('Preload: Opening image picker');
    return ipcRenderer.invoke('open-image-picker');
  },

  openFilePicker: (extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']) => {
    console.log('Preload: Opening file picker for images');
    return ipcRenderer.invoke('open-file-picker', { extensions });
  },

  openVideoFilePicker: () => {
    console.log('Preload: Opening video file picker');
    return ipcRenderer.invoke('open-file-picker', { 
      extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'] 
    });
  },

  openAudioFilePicker: () => {
    console.log('Preload: Opening audio file picker');
    return ipcRenderer.invoke('open-file-picker', { 
      extensions: ['mp3', 'wav', 'ogg', 'webm', 'm4a'] 
    });
  },

  // ==================== LEGACY CAPTURE METHODS (for compatibility) ====================
  
  captureDesktop: () => {
    console.log('Preload: Starting desktop capture (legacy)');
    return ipcRenderer.invoke('capture-desktop');
  },

  // ==================== NEW CAPTURE API METHODS ====================
  
  // Screenshot methods
  takeScreenshot: (options = {}) => {
    console.log('Preload: Taking screenshot');
    return ipcRenderer.invoke('capture-screenshot', options);
  },

  takeDesktopScreenshot: (options = {}) => {
    console.log('Preload: Taking desktop screenshot');
    return ipcRenderer.invoke('capture-screenshot', options);
  },

  takeWindowScreenshot: (windowId, options = {}) => {
    console.log('Preload: Taking window screenshot');
    return ipcRenderer.invoke('capture-window-screenshot', windowId, options);
  },

  getScreenshotSources: (includeWindows = true) => {
    console.log('Preload: Getting screenshot sources');
    return ipcRenderer.invoke('get-screenshot-sources', includeWindows);
  },

  // Video recording methods
  startVideoRecording: (options = {}) => {
    console.log('Preload: Starting video recording');
    return ipcRenderer.invoke('start-video-recording', options);
  },

  stopVideoRecording: (recordingId) => {
    console.log('Preload: Stopping video recording');
    return ipcRenderer.invoke('stop-video-recording', recordingId);
  },

  pauseVideoRecording: (recordingId) => {
    console.log('Preload: Pausing video recording');
    return ipcRenderer.invoke('pause-video-recording', recordingId);
  },

  resumeVideoRecording: (recordingId) => {
    console.log('Preload: Resuming video recording');
    return ipcRenderer.invoke('resume-video-recording', recordingId);
  },

  // Audio recording methods
  startAudioRecording: (options = {}) => {
    console.log('Preload: Starting audio recording');
    return ipcRenderer.invoke('start-audio-recording', options);
  },

  stopAudioRecording: (recordingId) => {
    console.log('Preload: Stopping audio recording');
    return ipcRenderer.invoke('stop-audio-recording', recordingId);
  },

  pauseAudioRecording: (recordingId) => {
    console.log('Preload: Pausing audio recording');
    return ipcRenderer.invoke('pause-audio-recording', recordingId);
  },

  resumeAudioRecording: (recordingId) => {
    console.log('Preload: Resuming audio recording');
    return ipcRenderer.invoke('resume-audio-recording', recordingId);
  },

  // General recording methods
  getRecordingStatus: (recordingId) => {
    return ipcRenderer.invoke('get-recording-status', recordingId);
  },

  getActiveRecordings: () => {
    return ipcRenderer.invoke('get-active-recordings');
  },

  stopAllRecordings: () => {
    console.log('Preload: Stopping all recordings');
    return ipcRenderer.invoke('stop-all-recordings');
  },

  // Convenience methods
  quickScreenshot: () => {
    console.log('Preload: Taking quick screenshot');
    return ipcRenderer.invoke('quick-screenshot');
  },

  recordScreen: (durationSeconds = null) => {
    console.log('Preload: Recording screen');
    return ipcRenderer.invoke('record-screen', durationSeconds);
  },

  recordAudio: (durationSeconds = null) => {
    console.log('Preload: Recording audio');
    return ipcRenderer.invoke('record-audio', durationSeconds);
  },

  // Capture support and formats
  checkCaptureSupport: () => {
    return ipcRenderer.invoke('check-capture-support');
  },

  getSupportedFormats: () => {
    return ipcRenderer.invoke('get-supported-formats');
  },

  // ==================== AI MODEL METHODS ====================
  
  // Get all available AI models from all providers
  getAllAIModels: () => {
    console.log('Preload: Getting all AI models');
    return ipcRenderer.invoke('get-all-ai-models');
  },

  // Notify model change to main process
  notifyModelChange: (modelId, modelDetails) => {
    console.log('Preload: Notifying model change', modelId);
    ipcRenderer.send('ai-model-changed', { modelId, modelDetails });
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
  
  // ==================== EVENT LISTENERS ====================
  
  // Listen for commands from main process
  onClearInput: (callback) => ipcRenderer.on('clear-input', callback),
  onFocusInput: (callback) => ipcRenderer.on('focus-input', callback),
  
  // ==================== MINIMAL MODE METHODS ====================
  
  // Toggle minimal mode (hide all UI except persistent toggle)
  toggleMinimalMode: () => {
    console.log('Preload: Toggling minimal mode');
    ipcRenderer.send('minimal-mode-toggle');
  },
  
  // Enable minimal mode
  enableMinimalMode: () => {
    console.log('Preload: Enabling minimal mode');
    ipcRenderer.send('minimal-mode-enable');
  },
  
  // Disable minimal mode
  disableMinimalMode: () => {
    console.log('Preload: Disabling minimal mode');
    ipcRenderer.send('minimal-mode-disable');
  },
  
  // Get minimal mode status
  getMinimalModeStatus: () => {
    return ipcRenderer.invoke('minimal-mode-get-status');
  },
  
  // Listen for minimal mode changes
  onMinimalModeChanged: (callback) => {
    ipcRenderer.on('minimal-mode-changed', (event, isMinimal) => {
      console.log('Preload: Minimal mode changed to', isMinimal);
      callback(isMinimal);
    });
  },
  
  // Listen for set collapsed state command (Ctrl+Shift+L shortcut)
  onSetCollapsedState: (callback) => {
    ipcRenderer.on('set-collapsed-state', (event, shouldCollapse) => {
      console.log('Preload: Set collapsed state to', shouldCollapse);
      callback(shouldCollapse);
    });
  },
  
  // Listen for recording events
  onRecordingProgress: (callback) => ipcRenderer.on('recording-progress', callback),
  onVolumeChange: (callback) => ipcRenderer.on('recording-volume', callback),
  onRecordingError: (callback) => ipcRenderer.on('recording-error', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Clipboard change subscription (from main -> renderer)
  onClipboardChanged: (callback) => {
    try {
      ipcRenderer.on('clipboard-changed', (event, data) => {
        if (typeof callback === 'function') callback(data);
      });
    } catch (e) {
      console.error('Preload: Failed to register clipboard-changed listener', e);
    }
  }
});

// Expose MCP API separately for MCP server management
contextBridge.exposeInMainWorld("electronAPI", {
  // ==================== AUTH METHODS ====================
  
  /**
   * Get the current auth token for API requests
   * @returns {Promise<string|null>} Auth token
   */
  getAuthToken: () => {
    return ipcRenderer.invoke('auth:get-token');
  },

  /**
   * Get the current user info
   * @returns {Promise<Object|null>} User info
   */
  getUserInfo: () => {
    return ipcRenderer.invoke('auth:get-user-info');
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Is authenticated
   */
  isAuthenticated: () => {
    return ipcRenderer.invoke('auth:is-authenticated');
  },

  // ==================== MCP METHODS ====================
  
  /**
   * Send MCP connect request to main process
   * @param {Object} serverConfig - MCP server configuration
   * @returns {Promise<Object>} Connection result
   */
  sendMCPConnect: (serverConfig) => {
    console.log('Preload: Sending MCP connect request', serverConfig);
    return ipcRenderer.invoke('mcp-connect', serverConfig);
  },

  /**
   * Send MCP disconnect request to main process
   * @param {string} serverId - Server ID to disconnect
   * @returns {Promise<Object>} Disconnection result
   */
  sendMCPDisconnect: (serverId) => {
    console.log('Preload: Sending MCP disconnect request', serverId);
    return ipcRenderer.invoke('mcp-disconnect', serverId);
  },

  /**
   * Send message to MCP server
   * @param {string} serverId - Server ID
   * @param {Object} message - Message to send
   * @returns {Promise<Object>} Message result
   */
  sendMCPMessage: (serverId, message) => {
    return ipcRenderer.invoke('mcp-send-message', serverId, message);
  },

  /**
   * Listen for MCP messages
   * @param {Function} callback - Message callback
   */
  onMCPMessage: (callback) => {
    ipcRenderer.on('mcp-message', (event, data) => {
      callback(data);
    });
  },

  /**
   * Listen for MCP connection status changes
   * @param {Function} callback - Status callback
   */
  onMCPStatus: (callback) => {
    ipcRenderer.on('mcp-status', (event, data) => {
      callback(data);
    });
  },

  /**
   * Remove MCP listeners
   * @param {string} channel - Channel to remove
   */
  removeMCPListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // ==================== ENVIRONMENT CONFIG ====================
  
  /**
   * Get the frontend URL (development or production)
   * @returns {Promise<string>} Frontend URL
   */
  getFrontendURL: () => {
    return ipcRenderer.invoke('get-frontend-url');
  },

  /**
   * Get the frontend base URL
   * @returns {Promise<string>} Frontend base URL
   */
  getFrontendBaseURL: () => {
    return ipcRenderer.invoke('get-frontend-base-url');
  },

  /**
   * Check if running in development mode
   * @returns {Promise<boolean>} True if development
   */
  isDevelopment: () => {
    return ipcRenderer.invoke('is-development');
  },
  
  // ==================== TEXT SELECTION METHODS ====================
  
  // Listen for text selection changes
  onTextSelectionChanged: (callback) => {
    console.log('Preload: Setting up text selection changed listener');
    ipcRenderer.on('text-selection-changed', (event, selectionData) => {
      console.log('Preload: Received text-selection-changed event', selectionData);
      callback(event, selectionData);
    });
  },
  
  // Listen for add text to input requests
  onAddTextToInput: (callback) => {
    ipcRenderer.on('add-text-to-input', (event, text) => {
      callback(event, text);
    });
  }
});

// Expose the comprehensive CaptureAPI to the renderer
contextBridge.exposeInMainWorld("CaptureAPI", {
  // ==================== SCREENSHOT METHODS ====================
  
  /**
   * Take a screenshot
   * @param {Object} options - Screenshot options
   * @returns {Promise<Object>} Screenshot result
   */
  takeScreenshot: (options = {}) => {
    return ipcRenderer.invoke('capture-screenshot', options);
  },

  /**
   * Take a screenshot of a specific window
   * @param {string} windowId - Window ID
   * @param {Object} options - Screenshot options
   * @returns {Promise<Object>} Screenshot result
   */
  takeWindowScreenshot: (windowId, options = {}) => {
    return ipcRenderer.invoke('capture-window-screenshot', windowId, options);
  },

  /**
   * Take a screenshot of a specific area
   * @param {Object} area - Area coordinates {x, y, width, height}
   * @param {Object} options - Screenshot options
   * @returns {Promise<Object>} Screenshot result
   */
  takeAreaScreenshot: (area, options = {}) => {
    return ipcRenderer.invoke('capture-area-screenshot', area, options);
  },

  /**
   * Get available screenshot sources
   * @param {boolean} includeWindows - Include window sources
   * @returns {Promise<Object>} Available sources
   */
  getScreenshotSources: (includeWindows = true) => {
    return ipcRenderer.invoke('get-screenshot-sources', includeWindows);
  },

  // ==================== VIDEO RECORDING METHODS ====================
  
  /**
   * Start video recording
   * @param {Object} options - Recording options
   * @returns {Promise<Object>} Recording start result
   */
  startVideoRecording: (options = {}) => {
    return ipcRenderer.invoke('start-video-recording', options);
  },

  /**
   * Stop video recording
   * @param {string} recordingId - Recording ID
   * @returns {Promise<Object>} Recording stop result
   */
  stopVideoRecording: (recordingId) => {
    return ipcRenderer.invoke('stop-video-recording', recordingId);
  },

  /**
   * Pause video recording
   * @param {string} recordingId - Recording ID
   * @returns {Promise<Object>} Pause result
   */
  pauseVideoRecording: (recordingId) => {
    return ipcRenderer.invoke('pause-video-recording', recordingId);
  },

  /**
   * Resume video recording
   * @param {string} recordingId - Recording ID
   * @returns {Promise<Object>} Resume result
   */
  resumeVideoRecording: (recordingId) => {
    return ipcRenderer.invoke('resume-video-recording', recordingId);
  },

  // ==================== AUDIO RECORDING METHODS ====================
  
  /**
   * Start audio recording
   * @param {Object} options - Recording options
   * @returns {Promise<Object>} Recording start result
   */
  startAudioRecording: (options = {}) => {
    return ipcRenderer.invoke('start-audio-recording', options);
  },

  /**
   * Stop audio recording
   * @param {string} recordingId - Recording ID
   * @returns {Promise<Object>} Recording stop result
   */
  stopAudioRecording: (recordingId) => {
    return ipcRenderer.invoke('stop-audio-recording', recordingId);
  },

  /**
   * Pause audio recording
   * @param {string} recordingId - Recording ID
   * @returns {Promise<Object>} Pause result
   */
  pauseAudioRecording: (recordingId) => {
    return ipcRenderer.invoke('pause-audio-recording', recordingId);
  },

  /**
   * Resume audio recording
   * @param {string} recordingId - Recording ID
   * @returns {Promise<Object>} Resume result
   */
  resumeAudioRecording: (recordingId) => {
    return ipcRenderer.invoke('resume-audio-recording', recordingId);
  },

  // ==================== GENERAL METHODS ====================
  
  /**
   * Get recording status
   * @param {string} recordingId - Recording ID
   * @returns {Promise<Object>} Recording status
   */
  getRecordingStatus: (recordingId) => {
    return ipcRenderer.invoke('get-recording-status', recordingId);
  },

  /**
   * Get all active recordings
   * @returns {Promise<Array>} Active recordings
   */
  getActiveRecordings: () => {
    return ipcRenderer.invoke('get-active-recordings');
  },

  /**
   * Stop all recordings
   * @returns {Promise<Array>} Stop results
   */
  stopAllRecordings: () => {
    return ipcRenderer.invoke('stop-all-recordings');
  },

  /**
   * Check capture support
   * @returns {Promise<Object>} Support status
   */
  checkSupport: () => {
    return ipcRenderer.invoke('check-capture-support');
  },

  /**
   * Get supported formats
   * @returns {Promise<Object>} Supported formats
   */
  getSupportedFormats: () => {
    return ipcRenderer.invoke('get-supported-formats');
  },

  // ==================== CONVENIENCE METHODS ====================
  
  /**
   * Quick screenshot
   * @returns {Promise<Object>} Screenshot result
   */
  quickScreenshot: () => {
    return ipcRenderer.invoke('quick-screenshot');
  },

  /**
   * Record screen for specified duration
   * @param {number} durationSeconds - Duration in seconds
   * @returns {Promise<Object>} Recording result
   */
  recordScreen: (durationSeconds = null) => {
    return ipcRenderer.invoke('record-screen', durationSeconds);
  },

  /**
   * Record audio for specified duration
   * @param {number} durationSeconds - Duration in seconds
   * @returns {Promise<Object>} Recording result
   */
  recordAudio: (durationSeconds = null) => {
    return ipcRenderer.invoke('record-audio', durationSeconds);
  },

  // ==================== EVENT LISTENERS ====================
  
  /**
   * Listen for recording progress updates
   * @param {Function} callback - Progress callback
   */
  onRecordingProgress: (callback) => {
    ipcRenderer.on('recording-progress', (event, data) => {
      callback(data);
    });
  },

  /**
   * Listen for recording volume changes
   * @param {Function} callback - Volume callback
   */
  onVolumeChange: (callback) => {
    ipcRenderer.on('recording-volume', (event, data) => {
      callback(data);
    });
  },

  /**
   * Listen for recording errors
   * @param {Function} callback - Error callback
   */
  onRecordingError: (callback) => {
    ipcRenderer.on('recording-error', (event, data) => {
      callback(data);
    });
  },

  /**
   * Remove all listeners for a specific channel
   * @param {string} channel - Channel name
   */
  removeListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Expose MediaUtils for frontend use
contextBridge.exposeInMainWorld('MediaUtils', {
  MediaType: {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio'
  },

  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Validate file for capture
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile: (file) => {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `File too large. Maximum size is ${window.MediaUtils.formatFileSize(maxSize)}` 
      };
    }

    // Determine media type
    const mediaType = file.type.startsWith('image/') ? 'image' :
                     file.type.startsWith('video/') ? 'video' :
                     file.type.startsWith('audio/') ? 'audio' : null;
                     
    if (!mediaType) {
      return { 
        isValid: false, 
        error: 'Unsupported file type' 
      };
    }

    return { 
      isValid: true, 
      mediaType,
      size: file.size,
      type: file.type
    };
  },

  /**
   * Create media file from File/Blob
   * @param {File|Blob} file - Source file
   * @param {string} source - Source identifier
   * @returns {Promise<Object>} Media file object
   */
  createMediaFile: async (file, source = 'upload') => {
    // This would typically use the main process MediaUtils
    // For now, return a basic structure
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    return {
      name: file.name || `capture-${Date.now()}`,
      type: file.type,
      size: file.size,
      data: dataUrl,
      mediaType: file.type.split('/')[0],
      source,
      timestamp: Date.now()
    };
  },

  // ==================== DISPLAY CARD FUNCTIONALITY ====================
  
  // Send content to display card
  sendDisplayContent: (cardNumber, content) => {
    ipcRenderer.send('chat-input-display-content', { cardNumber, content });
  },

  // Listen for display content requests
  onDisplayContent: (callback) => {
    ipcRenderer.on('chat-input-display-content', (event, { cardNumber, content }) => {
      callback(cardNumber, content);
    });
  },

  // Request display content refresh
  requestDisplayContent: (cardNumber) => {
    ipcRenderer.send('chat-input-request-display-content', cardNumber);
  },

  // Toggle display card visibility
  toggleDisplayCard: (cardNumber) => {
    ipcRenderer.send('chat-input-toggle-display-card', cardNumber);
  }
});

// Expose WebView API for external website viewing
contextBridge.exposeInMainWorld('webView', {
  /**
   * Create a new web view
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>}
   */
  create: (options) => ipcRenderer.invoke('webview:create', options),

  /**
   * Update web view bounds
   * @param {string} viewId - The view identifier
   * @param {Object} bounds - New bounds { x, y, width, height }
   * @returns {Promise<Object>}
   */
  updateBounds: (viewId, bounds) => 
    ipcRenderer.invoke('webview:update-bounds', { viewId, bounds }),

  /**
   * Navigate to a different URL
   * @param {string} viewId - The view identifier
   * @param {string} url - The URL to navigate to
   * @returns {Promise<Object>}
   */
  navigate: (viewId, url) => 
    ipcRenderer.invoke('webview:navigate', { viewId, url }),

  /**
   * Show/hide the web view
   * @param {string} viewId - The view identifier
   * @param {boolean} visible - Visibility state
   * @returns {Promise<Object>}
   */
  setVisible: (viewId, visible) => 
    ipcRenderer.invoke('webview:set-visible', { viewId, visible }),

  /**
   * Set click-through mode
   * @param {string} viewId - The view identifier
   * @param {boolean} enabled - Click-through enabled state
   * @returns {Promise<Object>}
   */
  setClickThrough: (viewId, enabled) => 
    ipcRenderer.invoke('webview:set-clickthrough', { viewId, enabled }),

  /**
   * Destroy a web view
   * @param {string} viewId - The view identifier
   * @returns {Promise<Object>}
   */
  destroy: (viewId) => 
    ipcRenderer.invoke('webview:destroy', { viewId }),

  /**
   * Get all active web views
   * @returns {Promise<Object>}
   */
  getActive: () => ipcRenderer.invoke('webview:get-active'),

  /**
   * Listen for WebView mouse state changes
   * @param {Function} callback - Callback with {viewId, isOver}
   */
  onMouseState: (callback) => {
    ipcRenderer.on('webview-mouse-state', (event, data) => {
      callback(data);
    });
  }
});

// Also expose a minimal window API for basic functionality
contextBridge.exposeInMainWorld("windowAPI", {
  close: () => ipcRenderer.invoke('chat-input-close'),
  hide: () => ipcRenderer.invoke('chat-input-hide')
});

// Text Services Framework API for inserting text into any application
contextBridge.exposeInMainWorld("tsfAPI", {
  /**
   * Initialize TSF system
   */
  initialize: () => ipcRenderer.invoke('tsf:initialize'),

  /**
   * Insert text into focused application
   * @param {string} text - Text to insert
   * @param {Object} options - Insertion options
   * @returns {Promise<boolean>} Success status
   */
  insertText: (text, options) => ipcRenderer.invoke('tsf:insert-text', text, options),

  /**
   * Insert text using clipboard fallback method
   * @param {string} text - Text to insert
   * @returns {Promise<boolean>} Success status
   */
  insertTextFallback: (text) => ipcRenderer.invoke('tsf:insert-text-fallback', text),

  /**
   * Get information about focused window
   * @returns {Promise<Object>} Focus info
   */
  getFocusInfo: () => ipcRenderer.invoke('tsf:get-focus-info'),

  /**
   * Check if TSF is available for current window
   * @returns {Promise<boolean>} Availability status
   */
  isTsfAvailable: () => ipcRenderer.invoke('tsf:is-tsf-available'),

  /**
   * Check if focused window is editable
   * @returns {Promise<boolean>} Editable status
   */
  isEditableWindow: () => ipcRenderer.invoke('tsf:is-editable-window'),

  /**
   * Enable or disable text insertion
   * @param {boolean} enabled - Enable status
   */
  setEnabled: (enabled) => ipcRenderer.send('tsf:set-enabled', enabled),

  /**
   * Check if TSF is enabled
   * @returns {Promise<boolean>} Enabled status
   */
  isEnabled: () => ipcRenderer.invoke('tsf:is-enabled'),

  // Event listeners
  onFocusChanged: (callback) => {
    ipcRenderer.on('tsf:focus-changed', (event, focusInfo) => callback(focusInfo));
  },

  onTextInserted: (callback) => {
    ipcRenderer.on('tsf:text-inserted', (event, data) => callback(data));
  },

  onInsertFailed: (callback) => {
    ipcRenderer.on('tsf:insert-failed', (event, data) => callback(data));
  },

  onWarning: (callback) => {
    ipcRenderer.on('tsf:warning', (event, data) => callback(data));
  },

  /**
   * Get last external (non-Electron) focused application
   * @returns {Promise<Object>} Last external focus info
   */
  getLastExternalFocus: () => ipcRenderer.invoke('tsf:get-last-external-focus'),

  /**
   * Get last focused window from native tracker
   * @returns {Promise<Object>} Last focused window info
   */
  getLastFocusedWindow: () => ipcRenderer.invoke('tsf:get-last-focused-window'),

  /**
   * Focus the last tracked external application
   * @returns {Promise<boolean>} Success status
   */
  focusLastWindow: () => ipcRenderer.invoke('tsf:focus-last-window'),

  /**
   * Focus last window and insert text at caret position
   * Perfect for button that sends AI response back to where user was typing
   * @param {string} text - Text to insert
   * @returns {Promise<boolean>} Success status
   */
  focusAndInsertText: (text) => ipcRenderer.invoke('tsf:focus-and-insert-text', text),

  // Event for external app focus changes
  onExternalFocusChanged: (callback) => {
    ipcRenderer.on('tsf:external-focus-changed', (event, focusInfo) => callback(focusInfo));
  }
});