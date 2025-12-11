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

  // MCP APIs
  mcpConnect?: (config: {
    serverId: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }) => Promise<{ success: boolean }>;

  mcpSend?: (serverId: string, message: any) => Promise<void>;

  mcpDisconnect?: (serverId: string) => Promise<void>;

  onMcpMessage?: (serverId: string, callback: (message: any) => void) => () => void;


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

    // Text Services Framework API
    tsfAPI?: {
      // Core methods
      initialize: () => Promise<boolean>;
      insertText: (text: string, options?: any) => Promise<boolean>;
      insertTextFallback: (text: string) => Promise<boolean>;
      getFocusInfo: () => Promise<any>;
      isTsfAvailable: () => Promise<boolean>;
      isEditableWindow: () => Promise<boolean>;
      setEnabled: (enabled: boolean) => void;
      isEnabled: () => Promise<boolean>;

      // Window tracking
      getLastExternalFocus: () => Promise<any>;
      getLastFocusedWindow: () => Promise<any>;
      focusLastWindow: () => Promise<boolean>;

      // Smart actions
      focusAndInsertText: (text: string) => Promise<boolean>;
      getSelectedText: () => Promise<string>;
      replaceSelectedText: (text: string) => Promise<boolean>;
      focusAndReplaceText: (text: string) => Promise<boolean>;
      deleteSelection: () => Promise<boolean>;

      // Events
      onFocusChanged: (callback: (focusInfo: any) => void) => void;
      onTextInserted: (callback: (data: any) => void) => void;
      onInsertFailed: (callback: (data: any) => void) => void;
      onWarning: (callback: (data: any) => void) => void;
      onTextReplaced: (callback: (data: any) => void) => void;
      onReplaceFailed: (callback: (data: any) => void) => void;
      onSelectionDeleted: (callback: (data: any) => void) => void;
      onExternalFocusChanged: (callback: (focusInfo: any) => void) => void;

      [key: string]: any;
    };

    /**
     * Complete Electron API suite
     */
    electronAPI?: {
      app: any;
      autoUpdater: any;
      clipboard: any;
      desktopCapturer: any;
      globalShortcut: any;
      ipcMain: any;
      net: any;
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
      takeScreenshot: (options?: any) => Promise<any>;
      takeWindowScreenshot: (windowId: string, options?: any) => Promise<any>;
      takeAreaScreenshot: (area: { x: number; y: number; width: number; height: number }, options?: any) => Promise<any>;
      getScreenshotSources: (includeWindows?: boolean) => Promise<any>;
      quickScreenshot: () => Promise<any>;
      checkSupport: () => Promise<any>;
    };

    /**
     * Interface Window API
     */
    interfaceAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      setIgnoreMouseEvents: (ignore: boolean, options?: any) => void;
      sendMessage: (channel: string, data: any) => void;
      onMessage: (channel: string, func: (...args: any[]) => void) => void;
      removeMessageListener: (channel: string, func: (...args: any[]) => void) => void;
    };

  }
}

export { };
