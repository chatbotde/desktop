/**
 * Legacy MCP Client
 * 
 * Wrapper for backwards compatibility with old client interface
 * @deprecated Use MCPUnifiedClient from '@/lib/mcp' instead
 */

import { MCPUnifiedClient } from './clients/unified-client';
import { convertLegacyConfig, type MCPServerConfig } from './types';
import type {
  MCPConnectionStatus,
  MCPTool,
  MCPCallToolResult,
  MCPListResourcesResult,
  MCPReadResourceResult,
  MCPListPromptsResult,
  MCPGetPromptResult,
  MCPClientEventListener,
} from './core/types';

/**
 * @deprecated Use MCPUnifiedClient instead
 */
export class MCPClient {
  private client: MCPUnifiedClient;

  constructor(config: MCPServerConfig) {
    const newConfig = convertLegacyConfig(config);
    this.client = new MCPUnifiedClient(newConfig);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  getStatus(): MCPConnectionStatus {
    const status = this.client.getStatus();
    // Map to old format
    return {
      connected: status.connected,
      serverId: status.serverId,
      serverName: status.serverName,
      capabilities: status.capabilities,
      error: status.error,
    };
  }

  isConnected(): boolean {
    return this.client.isConnected();
  }

  async listTools(): Promise<MCPTool[]> {
    return this.client.listTools();
  }

  async callTool(name: string, arguments_?: Record<string, any>): Promise<MCPCallToolResult> {
    return this.client.callTool(name, arguments_);
  }

  async listResources(_uri?: string): Promise<MCPListResourcesResult> {
    return this.client.listResources();
  }

  async readResource(uri: string): Promise<MCPReadResourceResult> {
    return this.client.readResource(uri);
  }

  async listPrompts(): Promise<MCPListPromptsResult> {
    return this.client.listPrompts();
  }

  async getPrompt(name: string, arguments_?: Record<string, string>): Promise<MCPGetPromptResult> {
    return this.client.getPrompt(name, arguments_);
  }

  on(_event: 'event', listener: MCPClientEventListener): void {
    // Map old events to new format
    this.client.on((event) => {
      // Convert new event format to old format
      let legacyEvent: any;
      switch (event.type) {
        case 'connected':
          legacyEvent = { type: 'connected', serverName: event.serverName };
          break;
        case 'disconnected':
          legacyEvent = { type: 'disconnected', reason: event.reason };
          break;
        case 'error':
          legacyEvent = { type: 'error', error: event.error };
          break;
        case 'tool-call':
          legacyEvent = { type: 'tool-call', toolName: event.toolName, result: event.result };
          break;
        default:
          return;
      }
      listener(legacyEvent);
    });
  }

  off(_event: 'event', listener: MCPClientEventListener): void {
    this.client.off(listener);
  }

  async reconnect(): Promise<void> {
    await this.client.reconnect();
  }
}
