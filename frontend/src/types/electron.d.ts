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
  }
}

export {};
