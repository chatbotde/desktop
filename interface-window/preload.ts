/**
 * Preload Script
 * Exposes secure APIs to the renderer process via contextBridge
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Verify contextBridge is available
if (!contextBridge) {
  console.error('[Preload] contextBridge is not available!');
}

// Verify ipcRenderer is available
if (!ipcRenderer) {
  console.error('[Preload] ipcRenderer is not available!');
}

console.log('[Preload] Starting to expose APIs...');

// Type definitions for exposed APIs
interface IgnoreMouseEventsOptions {
  forward?: boolean;
}

interface InterfaceAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  setIgnoreMouseEvents: (ignore: boolean, options?: IgnoreMouseEventsOptions) => void;
  setContentProtection: (enabled: boolean) => void;
  sendMessage: (channel: string, data: any) => void;
  onMessage: (channel: string, func: (...args: any[]) => void) => void;
  removeMessageListener: (channel: string, func: (...args: any[]) => void) => void;
}

interface ElectronAPI {
  [key: string]: any;
  clipboard: {
    // Read methods
    readText: (...args: any[]) => Promise<any>;
    readHTML: (...args: any[]) => Promise<any>;
    readImage: (...args: any[]) => Promise<any>;
    readRTF: (...args: any[]) => Promise<any>;
    readBookmark: (...args: any[]) => Promise<any>;
    readFindText: (...args: any[]) => Promise<any>;
    readBuffer: (...args: any[]) => Promise<any>;
    read: (...args: any[]) => Promise<any>;
    // Write methods
    writeText: (...args: any[]) => Promise<any>;
    writeHTML: (...args: any[]) => Promise<any>;
    writeImage: (...args: any[]) => Promise<any>;
    writeRTF: (...args: any[]) => Promise<any>;
    writeBookmark: (...args: any[]) => Promise<any>;
    writeFindText: (...args: any[]) => Promise<any>;
    writeBuffer: (...args: any[]) => Promise<any>;
    write: (...args: any[]) => Promise<any>;
    // Utility methods
    availableFormats: (...args: any[]) => Promise<any>;
    has: (...args: any[]) => Promise<any>;
    clear: (...args: any[]) => Promise<any>;
  };
}

interface TsfInsertOptions {
  [key: string]: any;
}

interface TsfAPI {
  initialize: () => Promise<boolean>;
  insertText: (text: string, options?: TsfInsertOptions) => Promise<boolean>;
  insertTextFallback: (text: string) => Promise<boolean>;
  getFocusInfo: () => Promise<any>;
  isTsfAvailable: () => Promise<boolean>;
  isEditableWindow: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => void;
  isEnabled: () => Promise<boolean>;
  onFocusChanged: (callback: (focusInfo: any) => void) => void;
  onTextInserted: (callback: (data: any) => void) => void;
  onInsertFailed: (callback: (data: any) => void) => void;
  onWarning: (callback: (data: any) => void) => void;
  onTextReplaced: (callback: (data: any) => void) => void;
  onReplaceFailed: (callback: (data: any) => void) => void;
  onSelectionDeleted: (callback: (data: any) => void) => void;
  getLastExternalFocus: () => Promise<any>;
  getLastFocusedWindow: () => Promise<any>;
  focusLastWindow: () => Promise<boolean>;
  focusAndInsertText: (text: string) => Promise<boolean>;
  getSelectedText: () => Promise<string>;
  replaceSelectedText: (text: string) => Promise<boolean>;
  focusAndReplaceText: (text: string) => Promise<boolean>;
  deleteSelection: () => Promise<boolean>;
  onExternalFocusChanged: (callback: (focusInfo: any) => void) => void;
}

interface ScreenshotOptions {
  [key: string]: any;
}

interface VideoRecordingOptions {
  sourceId?: string | null;
  fps?: number;
  videoBitsPerSecond?: number;
  width?: number;
  height?: number;
  audioEnabled?: boolean;
  name?: string | null;
}

interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CaptureAPI {
  // Screenshot methods
  takeScreenshot: (options?: ScreenshotOptions) => Promise<any>;
  takeWindowScreenshot: (windowId: string, options?: ScreenshotOptions) => Promise<any>;
  takeAreaScreenshot: (area: SelectionArea, options?: ScreenshotOptions) => Promise<any>;
  getScreenshotSources: (includeWindows?: boolean) => Promise<any>;
  quickScreenshot: () => Promise<any>;
  checkSupport: () => Promise<any>;
  // Video recording methods
  startVideoRecording: (options?: VideoRecordingOptions) => Promise<any>;
  stopVideoRecording: () => Promise<any>;
  pauseVideoRecording: () => Promise<any>;
  resumeVideoRecording: () => Promise<any>;
  getVideoRecordingState: () => Promise<any>;
  getVideoRecordingDuration: () => Promise<any>;
  startAreaVideoRecording: (area: SelectionArea, options?: VideoRecordingOptions) => Promise<any>;
  getVideoSources: (includeWindows?: boolean) => Promise<any>;
}

interface BlockAPI {
  addApp: (processName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  removeApp: (processName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  getApps: () => Promise<{ success: boolean; apps: string[]; error?: string }>;
  getStatus: () => Promise<{ success: boolean; status: { isLocked: boolean; blockedApp?: string }; lockEnabled: boolean; error?: string }>;
  setEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  onLockChanged: (callback: (status: any) => void) => () => void;
}

interface AuthAPI {
  login: (options?: Record<string, any>) => void;
  signup: (options?: Record<string, any>) => void;
  logout: () => void;
  isAuthenticated: () => Promise<boolean>;
  getUser: () => Promise<{ id: string; email?: string; name?: string; image?: string } | null>;
  getToken: () => Promise<string | null>;
  validateSession: () => Promise<boolean>;
  refreshTokens: () => Promise<boolean>;
  submitManualToken: (token: string) => Promise<any>;
  getConfig: () => Promise<any>;
  clearTokens: () => Promise<{ success: boolean; error?: string }>;
  subscribe: () => void;
  unsubscribe: () => void;
  onAuthSuccess: (callback: (user: any) => void) => () => void;
  onAuthError: (callback: (error: any) => void) => () => void;
  onLogout: (callback: () => void) => () => void;
  onSessionExpired: (callback: () => void) => () => void;
  onStateChange: (callback: (state: { isAuthenticated: boolean; user: any }) => void) => () => void;
  onAuthRequired: (callback: () => void) => () => void;
  onSessionRestored: (callback: (user: any) => void) => () => void;
}

// Expose interfaceAPI
try {
  const interfaceAPI: InterfaceAPI = {
    // Basic window controls
    minimize: () => ipcRenderer.send('interface-window:minimize'),
    maximize: () => ipcRenderer.send('interface-window:maximize'),
    close: () => ipcRenderer.send('interface-window:close'),
    setIgnoreMouseEvents: (ignore: boolean, options?: IgnoreMouseEventsOptions) => {
      if (typeof ignore !== 'boolean') {
        return;
      }

      let sanitizedOptions: IgnoreMouseEventsOptions | undefined;
      if (options && typeof options === 'object') {
        sanitizedOptions = {};
        if ('forward' in options) {
          sanitizedOptions.forward = !!options.forward;
        }

        if (Object.keys(sanitizedOptions).length === 0) {
          sanitizedOptions = undefined;
        }
      }

      ipcRenderer.send('interface-window:set-ignore-mouse-events', ignore, sanitizedOptions);
    },
    setContentProtection: (enabled: boolean) => {
      if (typeof enabled !== 'boolean') {
        return;
      }
      ipcRenderer.send('interface-window:set-content-protection', enabled);
    },
    // Example: Send message to main process
    sendMessage: (channel: string, data: any) => {
      const validChannels = ['interface-action'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    // Example: Receive message from main process
    onMessage: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = ['interface-update', 'text-selection-changed'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: any[]) => func(...args));
      }
    },
    // Remove message listener
    removeMessageListener: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = ['interface-update', 'text-selection-changed'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    }
  };

  contextBridge.exposeInMainWorld('interfaceAPI', interfaceAPI);
  console.log('[Preload] interfaceAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing interfaceAPI:', error);
}

/**
 * Expose all Electron APIs dynamically
 */
const serviceNames: string[] = [
  'app',
  'autoUpdater',
  'clipboard',
  'desktopCapturer',
  'globalShortcut',
  'ipcMain',
  'net',
  'ollama',
  'process',
  'safeStorage',
  'screen'
];

const electronAPI: ElectronAPI = {} as ElectronAPI;

serviceNames.forEach(name => {
  electronAPI[name] = new Proxy({}, {
    get: (_target, prop) => {
      return (...args: any[]) => ipcRenderer.invoke(`${name}:${String(prop)}`, ...args);
    }
  });
});

// Explicitly define clipboard methods as Proxies don't survive contextBridge
electronAPI.clipboard = {
  // Read methods
  readText: (...args: any[]) => ipcRenderer.invoke('clipboard:readText', ...args),
  readHTML: (...args: any[]) => ipcRenderer.invoke('clipboard:readHTML', ...args),
  readImage: (...args: any[]) => ipcRenderer.invoke('clipboard:readImage', ...args),
  readRTF: (...args: any[]) => ipcRenderer.invoke('clipboard:readRTF', ...args),
  readBookmark: (...args: any[]) => ipcRenderer.invoke('clipboard:readBookmark', ...args),
  readFindText: (...args: any[]) => ipcRenderer.invoke('clipboard:readFindText', ...args),
  readBuffer: (...args: any[]) => ipcRenderer.invoke('clipboard:readBuffer', ...args),
  read: (...args: any[]) => ipcRenderer.invoke('clipboard:read', ...args),

  // Write methods
  writeText: (...args: any[]) => ipcRenderer.invoke('clipboard:writeText', ...args),
  writeHTML: (...args: any[]) => ipcRenderer.invoke('clipboard:writeHTML', ...args),
  writeImage: (...args: any[]) => ipcRenderer.invoke('clipboard:writeImage', ...args),
  writeRTF: (...args: any[]) => ipcRenderer.invoke('clipboard:writeRTF', ...args),
  writeBookmark: (...args: any[]) => ipcRenderer.invoke('clipboard:writeBookmark', ...args),
  writeFindText: (...args: any[]) => ipcRenderer.invoke('clipboard:writeFindText', ...args),
  writeBuffer: (...args: any[]) => ipcRenderer.invoke('clipboard:writeBuffer', ...args),
  write: (...args: any[]) => ipcRenderer.invoke('clipboard:write', ...args),

  // Utility methods
  availableFormats: (...args: any[]) => ipcRenderer.invoke('clipboard:availableFormats', ...args),
  has: (...args: any[]) => ipcRenderer.invoke('clipboard:has', ...args),
  clear: (...args: any[]) => ipcRenderer.invoke('clipboard:clear', ...args),
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('[Preload] electronAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing electronAPI:', error);
}

// Text Services Framework API for inserting text into any application
try {
  const tsfAPI: TsfAPI = {
    /**
     * Initialize TSF system
     */
    initialize: () => ipcRenderer.invoke('tsf:initialize'),

    /**
     * Insert text into focused application
     * @param text - Text to insert
     * @param options - Insertion options
     * @returns Success status
     */
    insertText: (text: string, options?: TsfInsertOptions) => ipcRenderer.invoke('tsf:insert-text', text, options),

    /**
     * Insert text using clipboard fallback method
     * @param text - Text to insert
     * @returns Success status
     */
    insertTextFallback: (text: string) => ipcRenderer.invoke('tsf:insert-text-fallback', text),

    /**
     * Get information about focused window
     * @returns Focus info
     */
    getFocusInfo: () => ipcRenderer.invoke('tsf:get-focus-info'),

    /**
     * Check if TSF is available for current window
     * @returns Availability status
     */
    isTsfAvailable: () => ipcRenderer.invoke('tsf:is-tsf-available'),

    /**
     * Check if focused window is editable
     * @returns Editable status
     */
    isEditableWindow: () => ipcRenderer.invoke('tsf:is-editable-window'),

    /**
     * Enable or disable text insertion
     * @param enabled - Enable status
     */
    setEnabled: (enabled: boolean) => ipcRenderer.send('tsf:set-enabled', enabled),

    /**
     * Check if TSF is enabled
     * @returns Enabled status
     */
    isEnabled: () => ipcRenderer.invoke('tsf:is-enabled'),

    // Event listeners
    onFocusChanged: (callback: (focusInfo: any) => void) => {
      ipcRenderer.on('tsf:focus-changed', (_event: IpcRendererEvent, focusInfo: any) => callback(focusInfo));
    },

    onTextInserted: (callback: (data: any) => void) => {
      ipcRenderer.on('tsf:text-inserted', (_event: IpcRendererEvent, data: any) => callback(data));
    },

    onInsertFailed: (callback: (data: any) => void) => {
      ipcRenderer.on('tsf:insert-failed', (_event: IpcRendererEvent, data: any) => callback(data));
    },

    onWarning: (callback: (data: any) => void) => {
      ipcRenderer.on('tsf:warning', (_event: IpcRendererEvent, data: any) => callback(data));
    },

    onTextReplaced: (callback: (data: any) => void) => {
      ipcRenderer.on('tsf:text-replaced', (_event: IpcRendererEvent, data: any) => callback(data));
    },

    onReplaceFailed: (callback: (data: any) => void) => {
      ipcRenderer.on('tsf:replace-failed', (_event: IpcRendererEvent, data: any) => callback(data));
    },

    onSelectionDeleted: (callback: (data: any) => void) => {
      ipcRenderer.on('tsf:selection-deleted', (_event: IpcRendererEvent, data: any) => callback(data));
    },

    /**
     * Get last external (non-Electron) focused application
     * @returns Last external focus info
     */
    getLastExternalFocus: () => ipcRenderer.invoke('tsf:get-last-external-focus'),

    /**
     * Get last focused window from native tracker
     * @returns Last focused window info
     */
    getLastFocusedWindow: () => ipcRenderer.invoke('tsf:get-last-focused-window'),

    /**
     * Focus the last tracked external application
     * @returns Success status
     */
    focusLastWindow: () => ipcRenderer.invoke('tsf:focus-last-window'),

    /**
     * Focus last window and insert text at caret position
     * Perfect for button that sends AI response back to where user was typing
     * @param text - Text to insert
     * @returns Success status
     */
    focusAndInsertText: (text: string) => ipcRenderer.invoke('tsf:focus-and-insert-text', text),

    /**
     * Get selected text from focused application using TSF
     * @returns Selected text (empty string if none)
     */
    getSelectedText: () => ipcRenderer.invoke('tsf:get-selected-text'),

    /**
     * Replace selected text in focused application
     * @param text - The replacement text
     * @returns Success status
     */
    replaceSelectedText: (text: string) => ipcRenderer.invoke('tsf:replace-selected-text', text),

    /**
     * Focus last window and replace selected text
     * Perfect for "Change" button that replaces user's selected text with AI response
     * @param text - The replacement text
     * @returns Success status
     */
    focusAndReplaceText: (text: string) => ipcRenderer.invoke('tsf:focus-and-replace-text', text),

    /**
     * Delete selected text in focused application
     * @returns Success status
     */
    deleteSelection: () => ipcRenderer.invoke('tsf:delete-selection'),

    // Event for external app focus changes
    onExternalFocusChanged: (callback: (focusInfo: any) => void) => {
      ipcRenderer.on('tsf:external-focus-changed', (_event: IpcRendererEvent, focusInfo: any) => callback(focusInfo));
    }
  };

  contextBridge.exposeInMainWorld("tsfAPI", tsfAPI);
  console.log('[Preload] tsfAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing tsfAPI:', error);
}

// Expose the CaptureAPI to the renderer
console.log('[Preload] Exposing CaptureAPI to renderer...');
try {
  const captureAPI: CaptureAPI = {
    // ==================== SCREENSHOT METHODS ====================

    /**
     * Take a screenshot
     * @param options - Screenshot options
     * @returns Screenshot result
     */
    takeScreenshot: (options: ScreenshotOptions = {}) => {
      return ipcRenderer.invoke('interface-capture-screenshot', options);
    },

    /**
     * Take a screenshot of a specific window
     * @param windowId - Window ID
     * @param options - Screenshot options
     * @returns Screenshot result
     */
    takeWindowScreenshot: (windowId: string, options: ScreenshotOptions = {}) => {
      return ipcRenderer.invoke('interface-capture-window-screenshot', windowId, options);
    },

    /**
     * Take a screenshot of a specific area
     * @param area - Area coordinates {x, y, width, height}
     * @param options - Screenshot options
     * @returns Screenshot result
     */
    takeAreaScreenshot: (area: SelectionArea, options: ScreenshotOptions = {}) => {
      return ipcRenderer.invoke('interface-capture-area-screenshot', area, options);
    },

    /**
     * Get available screenshot sources
     * @param includeWindows - Include window sources
     * @returns Available sources
     */
    getScreenshotSources: (includeWindows: boolean = true) => {
      return ipcRenderer.invoke('interface-get-screenshot-sources', includeWindows);
    },

    /**
     * Quick screenshot capture (convenience method)
     * @returns Screenshot result
     */
    quickScreenshot: () => {
      console.log('[Preload] quickScreenshot called, invoking interface-quick-screenshot');
      return ipcRenderer.invoke('interface-quick-screenshot');
    },

    /**
     * Check capture support
     * @returns Support status
     */
    checkSupport: () => {
      return ipcRenderer.invoke('interface-check-capture-support');
    },

    // ==================== VIDEO RECORDING METHODS ====================

    /**
     * Start video recording
     * @param options - Recording options (fps, videoBitsPerSecond, width, height, audioEnabled)
     * @returns Recording result
     */
    startVideoRecording: (options: VideoRecordingOptions = {}) => {
      console.log('[Preload] startVideoRecording called with options:', options);
      return ipcRenderer.invoke('interface-start-video-recording', options);
    },

    /**
     * Stop video recording
     * @returns Recording result with video data
     */
    stopVideoRecording: () => {
      console.log('[Preload] stopVideoRecording called');
      return ipcRenderer.invoke('interface-stop-video-recording');
    },

    /**
     * Pause video recording
     * @returns Pause result
     */
    pauseVideoRecording: () => {
      return ipcRenderer.invoke('interface-pause-video-recording');
    },

    /**
     * Resume video recording
     * @returns Resume result
     */
    resumeVideoRecording: () => {
      return ipcRenderer.invoke('interface-resume-video-recording');
    },

    /**
     * Get current recording state
     * @returns Recording state ('idle' | 'recording' | 'paused')
     */
    getVideoRecordingState: () => {
      return ipcRenderer.invoke('interface-get-video-recording-state');
    },

    /**
     * Get current recording duration in milliseconds
     * @returns Recording duration
     */
    getVideoRecordingDuration: () => {
      return ipcRenderer.invoke('interface-get-video-recording-duration');
    },

    /**
     * Start area video recording
     * @param area - Area coordinates {x, y, width, height}
     * @param options - Recording options
     * @returns Recording result
     */
    startAreaVideoRecording: (area: SelectionArea, options: VideoRecordingOptions = {}) => {
      return ipcRenderer.invoke('interface-start-area-video-recording', area, options);
    },

    /**
     * Get available video sources
     * @param includeWindows - Include window sources
     * @returns Available sources
     */
    getVideoSources: (includeWindows: boolean = true) => {
      return ipcRenderer.invoke('interface-get-video-sources', includeWindows);
    }
  };

  contextBridge.exposeInMainWorld("CaptureAPI", captureAPI);
  console.log('[Preload] CaptureAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing CaptureAPI:', error);
  // Try to expose a minimal API for debugging
  try {
    const fallbackCaptureAPI: Partial<CaptureAPI> = {
      quickScreenshot: () => {
        console.error('[Preload] CaptureAPI not fully loaded, but quickScreenshot stub available');
        return Promise.resolve({ success: false, error: 'CaptureAPI not properly initialized' });
      }
    };
    contextBridge.exposeInMainWorld("CaptureAPI", fallbackCaptureAPI);
    console.log('[Preload] Fallback CaptureAPI exposed');
  } catch (fallbackError) {
    console.error('[Preload] Even fallback API failed:', fallbackError);
  }
}

// Expose Block API
try {
  const blockAPI: BlockAPI = {
    /**
     * Add an application to the block list
     * @param processName - Process name (e.g., "Cursor.exe")
     * @returns Promise with success status
     */
    addApp: (processName: string) => ipcRenderer.invoke('block:add-app', processName),

    /**
     * Remove an application from the block list
     * @param processName - Process name
     * @returns Promise with success status
     */
    removeApp: (processName: string) => ipcRenderer.invoke('block:remove-app', processName),

    /**
     * Get all blocked applications
     * @returns Promise with apps list
     */
    getApps: () => ipcRenderer.invoke('block:get-apps'),

    /**
     * Get current lock status
     * @returns Promise with lock status
     */
    getStatus: () => ipcRenderer.invoke('block:get-status'),

    /**
     * Set lock enabled/disabled
     * @param enabled - Enable or disable lock feature
     * @returns Promise with success status
     */
    setEnabled: (enabled: boolean) => ipcRenderer.invoke('block:set-enabled', enabled),

    /**
     * Listen to lock status changes
     * @param callback - Callback function receiving lock status
     * @returns Unsubscribe function
     */
    onLockChanged: (callback: (status: any) => void) => {
      const handler = (_event: IpcRendererEvent, status: any) => callback(status);
      ipcRenderer.on('block:lock-changed', handler);
      return () => ipcRenderer.removeListener('block:lock-changed', handler);
    }
  };

  contextBridge.exposeInMainWorld('blockAPI', blockAPI);
  console.log('[Preload] blockAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing blockAPI:', error);
}

// Expose Auth API
try {
  const authAPI: AuthAPI = {
    // LOGIN / SIGNUP / LOGOUT
    login: (options = {}) => {
      ipcRenderer.send('auth:login', options);
    },
    signup: (options = {}) => {
      ipcRenderer.send('auth:signup', options);
    },
    logout: () => {
      ipcRenderer.send('auth:logout');
    },

    // SESSION & USER INFO
    isAuthenticated: () => {
      return ipcRenderer.invoke('auth:is-authenticated');
    },
    getUser: () => {
      return ipcRenderer.invoke('auth:get-user');
    },
    getToken: () => {
      return ipcRenderer.invoke('auth:get-token');
    },
    validateSession: () => {
      return ipcRenderer.invoke('auth:validate-session');
    },
    refreshTokens: () => {
      return ipcRenderer.invoke('auth:refresh-tokens');
    },
    submitManualToken: (token: string) => {
      return ipcRenderer.invoke('auth:submit-manual-token', token);
    },
    getConfig: () => {
      return ipcRenderer.invoke('auth:get-config');
    },
    clearTokens: () => {
      return ipcRenderer.invoke('auth:clear-tokens');
    },

    // EVENT LISTENERS
    subscribe: () => {
      ipcRenderer.send('auth:subscribe');
    },
    unsubscribe: () => {
      ipcRenderer.send('auth:unsubscribe');
    },
    onAuthSuccess: (callback: (user: any) => void) => {
      const handler = (_event: IpcRendererEvent, user: any) => callback(user);
      ipcRenderer.on('auth:success', handler);
      return () => ipcRenderer.removeListener('auth:success', handler);
    },
    onAuthError: (callback: (error: any) => void) => {
      const handler = (_event: IpcRendererEvent, error: any) => callback(error);
      ipcRenderer.on('auth:error', handler);
      return () => ipcRenderer.removeListener('auth:error', handler);
    },
    onLogout: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('auth:logout-complete', handler);
      return () => ipcRenderer.removeListener('auth:logout-complete', handler);
    },
    onSessionExpired: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('auth:session-expired', handler);
      return () => ipcRenderer.removeListener('auth:session-expired', handler);
    },
    onStateChange: (callback: (state: { isAuthenticated: boolean; user: any }) => void) => {
      const handler = (_event: IpcRendererEvent, state: { isAuthenticated: boolean; user: any }) => callback(state);
      ipcRenderer.on('auth:state-changed', handler);
      return () => ipcRenderer.removeListener('auth:state-changed', handler);
    },
    onAuthRequired: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('auth:required', handler);
      return () => ipcRenderer.removeListener('auth:required', handler);
    },
    onSessionRestored: (callback: (user: any) => void) => {
      const handler = (_event: IpcRendererEvent, user: any) => callback(user);
      ipcRenderer.on('auth:restored', handler);
      return () => ipcRenderer.removeListener('auth:restored', handler);
    }
  };

  contextBridge.exposeInMainWorld('authAPI', authAPI);
  console.log('[Preload] authAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing authAPI:', error);
}

console.log('[Preload] All APIs exposed, preload script complete');
