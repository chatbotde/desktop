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
  }
}

export {};
