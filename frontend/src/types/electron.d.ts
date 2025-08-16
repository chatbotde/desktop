declare global {
  interface Window {
    api: {
      ping: () => string;
      // Window controls
      closeWindow: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      setOpacity: (opacity: number) => Promise<void>;
      toggleMouseIgnore: () => Promise<boolean>;
      forceAboveTaskbar: () => Promise<void>;
      // Content protection
      toggleContentProtection: () => Promise<boolean>;
      getContentProtection: () => Promise<boolean>;
      // Theme
      setTheme: (theme: string) => Promise<string>;
      getTheme: () => Promise<string>;
      onThemeChanged: (callback: (theme: string) => void) => void;
      // Dynamic window resizing
      notifyContentSizeChanged: (width: number, height: number) => Promise<void>;
      getContentSize: () => { width: number; height: number };
      // Chat input integration
      onChatMessage: (callback: (messageData: any) => void) => void;
      sendChatInputToggle: () => void;
      removeAllListeners: (channel: string) => void;
      // Screen capture
      getDesktopSources: () => Promise<any[]>;
      getScreenInfo: () => Promise<any>;
      // Version info
      getVersions: () => Promise<{
        electron: string;
        node: string;
      }>;
    };
  }
}

export {};
