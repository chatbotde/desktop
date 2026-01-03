/**
 * Electron API type definitions
 */

export interface ElectronAPI {
  // Existing APIs
  sendChatMessage?: (message: any) => void;
  onChatMessage?: (callback: (message: any) => void) => void;
  removeAllListeners?: (channel: string) => void;
  getScreenInfo?: () => Promise<any>;
  getContentProtection?: () => Promise<boolean>;
  getTheme?: () => Promise<string>;
  onThemeChanged?: (callback: (theme: string) => void) => void;
}

declare global {
  interface Window {
    api?: ElectronAPI;

    // Electron API
    electron?: {
      send: (channel: string, ...args: any[]) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
      once: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };

    // Platform info
    platform?: {
      isWindows: boolean;
      isMac: boolean;
      isLinux: boolean;
      isElectron: boolean;
    };


    /**
     * Complete Electron API suite
     */
    electronAPI?: {
      app: any;
      autoUpdater: any;
      clipboard: any;
      desktopCapturer: any;
      globalShortcut: {
        register: (accelerator: string, callback: () => void) => boolean;
        registerAll: (accelerators: string[], callback: () => void) => void;
        isRegistered: (accelerator: string) => boolean;
        unregister: (accelerator: string) => void;
        unregisterAll: () => void;
        simulatePaste: () => Promise<void>;
      };
      ipcMain: any;
      net: any;
      ollama?: {
        isInstalled: () => Promise<{ installed: boolean; version?: string; error?: string }>;
      };
      process: any;
      safeStorage: any;
      screen: any;
      getAuthToken?: () => Promise<string | null>;
      [key: string]: unknown;
    };

    /**
     * Capture API for screenshots and screen recording
     */
    CaptureAPI?: {
      // Screenshot methods
      takeScreenshot: (options?: any) => Promise<any>;
      takeWindowScreenshot: (windowId: string, options?: any) => Promise<any>;
      takeAreaScreenshot: (area: { x: number; y: number; width: number; height: number }, options?: any) => Promise<any>;
      getScreenshotSources: (includeWindows?: boolean) => Promise<any>;
      quickScreenshot: () => Promise<any>;
      checkSupport: () => Promise<any>;
      // Video recording methods
      startVideoRecording: (options?: {
        sourceId?: string | null;
        fps?: number;
        videoBitsPerSecond?: number;
        width?: number;
        height?: number;
        audioEnabled?: boolean;
        name?: string | null;
      }) => Promise<any>;
      stopVideoRecording: () => Promise<any>;
      pauseVideoRecording: () => Promise<any>;
      resumeVideoRecording: () => Promise<any>;
      getVideoRecordingState: () => Promise<any>;
      getVideoRecordingDuration: () => Promise<any>;
      startAreaVideoRecording: (area: { x: number; y: number; width: number; height: number }, options?: any) => Promise<any>;
      getVideoSources: (includeWindows?: boolean) => Promise<any>;
    };

    /**
     * Interface Window API
     */
    interfaceAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      setIgnoreMouseEvents: (ignore: boolean, options?: any) => void;
      setContentProtection: (enabled: boolean) => void;
      sendMessage: (channel: string, data: any) => void;
      onMessage: (channel: string, func: (...args: any[]) => void) => void;
      removeMessageListener: (channel: string, func: (...args: any[]) => void) => void;
    };

    /**
     * Rich content data for insertion (HTML, images, RTF, etc.)
     */
    interface RichContentData {
      text?: string;           // Plain text fallback
      html?: string;          // HTML content (for rich text editors)
      image?: string;         // Image as data URL (e.g., "data:image/png;base64,...")
      rtf?: string;           // RTF format (for Word, etc.)
    }

    /**
     * Text Services Framework API for inserting text into any application
     */
    tsfAPI?: {
      initialize: () => Promise<void>;
      insertText: (text: string, options?: { useFallback?: boolean; force?: boolean }) => Promise<boolean>;
      insertTextFallback: (text: string) => Promise<boolean>;
      getFocusInfo: () => Promise<{ windowTitle: string; processName: string; processId: number; isEditable: boolean }>;
      isTsfAvailable: () => Promise<boolean>;
      isEditableWindow: () => Promise<boolean>;
      setEnabled: (enabled: boolean) => void;
      isEnabled: () => Promise<boolean>;
      getLastExternalFocus: () => Promise<{ windowTitle: string; processName: string; processId: number; isEditable: boolean } | null>;
      getLastFocusedWindow: () => Promise<{ windowTitle: string; processName: string; processId: number; isEditable: boolean } | null>;
      focusLastWindow: () => Promise<boolean>;
      focusAndInsertText: (text: string) => Promise<boolean>;
      focusAndInsertRichContent: (content: RichContentData) => Promise<boolean>;
      getSelectedText: () => Promise<string>;
      replaceSelectedText: (text: string) => Promise<boolean>;
      focusAndReplaceText: (text: string) => Promise<boolean>;
      deleteSelection: () => Promise<boolean>;
      onFocusChanged: (callback: (focusInfo: any) => void) => void;
      onTextInserted: (callback: (data: any) => void) => void;
      onInsertFailed: (callback: (data: any) => void) => void;
      onWarning: (callback: (data: any) => void) => void;
      onExternalFocusChanged: (callback: (focusInfo: any) => void) => void;
    };

    /**
     * Block API for managing blocked applications and websites
     */
    blockAPI?: {
      addApp: (processName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      removeApp: (processName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      addWebsite: (url: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      removeWebsite: (url: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      getApps: () => Promise<{ success: boolean; apps: string[]; error?: string }>;
      getWebsites: () => Promise<{ success: boolean; websites: string[]; error?: string }>;
      getStatus: () => Promise<{
        success: boolean;
        status: { isLocked: boolean; blockedApp?: string; blockedWebsite?: string } | null;
        lockEnabled: boolean;
        error?: string
      }>;
      setEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
      onLockChanged: (callback: (status: { isLocked: boolean; blockedApp?: string; blockedWebsite?: string }) => void) => () => void;
    };

    /**
     * Authentication API for user login, logout, and session management
     */
    authAPI?: {
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
    };

    /**
     * File System API for reading files and getting file info
     */
    fileAPI?: {
      readFile: (filePath: string) => Promise<{
        success: boolean;
        content?: string;
        error?: string;
        fileInfo?: {
          path: string;
          name: string;
          extension: string;
          size: number;
          category: string;
          language?: string;
          mimeType?: string;
          description?: string;
          isCodeFile: boolean;
          isImageFile: boolean;
          isDocumentFile: boolean;
        };
      }>;
      readFileBinary: (filePath: string) => Promise<{
        success: boolean;
        data?: string;
        mimeType?: string;
        error?: string;
      }>;
      getFileInfo: (filePath: string) => Promise<{
        success: boolean;
        fileInfo?: {
          path: string;
          name: string;
          extension: string;
          size: number;
          category: string;
          language?: string;
          mimeType?: string;
          description?: string;
          isCodeFile: boolean;
          isImageFile: boolean;
          isDocumentFile: boolean;
        };
        error?: string;
      }>;
      exists: (filePath: string) => Promise<boolean>;
      isFile: (filePath: string) => Promise<boolean>;
      isDirectory: (dirPath: string) => Promise<boolean>;
      readDir: (dirPath: string) => Promise<{
        success: boolean;
        files?: string[];
        error?: string;
      }>;
      getFileCategory: (filePath: string) => Promise<string>;
      getFileLanguage: (filePath: string) => Promise<string | null>;
      getMimeType: (filePath: string) => Promise<string | null>;
    };

  }
}

export { };
