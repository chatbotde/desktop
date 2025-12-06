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

  // Click-through APIs (for direct access if available)
  clickThrough?: {
    enable?: () => void;
    disable?: () => void;
    toggle?: () => void;
    getState?: () => Promise<boolean>;
  };
}

declare global {
  interface Window {
    api?: ElectronAPI;
    
    // Clickthrough API (interfaces-window)
    clickthroughAPI?: {
      enable: () => void;
      disable: () => void;
      toggle: () => void;
      getState: () => Promise<boolean>;
      onStateChange: (callback: (enabled: boolean) => void) => () => void;
    };

    // Interfaces API (interfaces-window)
    interfacesAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      getInterfaces: () => Promise<any[]>;
      getInterface: (id: string) => Promise<any>;
      createInterface: (data: any) => Promise<any>;
      updateInterface: (id: string, data: any) => Promise<any>;
      deleteInterface: (id: string) => Promise<void>;
      onDataUpdate: (callback: (data: any) => void) => () => void;
      onError: (callback: (error: Error) => void) => () => void;
      onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void;
    };

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
  }
}

export {};
