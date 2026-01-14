/**
 * MCP Service
 * 
 * Service layer for managing MCP client connections
 */

import { MCPClient } from './client';
import type {
  MCPServerConfig,
  MCPConnectionStatus,
  MCPTool,
  MCPCallToolResult,
  MCPListResourcesResult,
  MCPReadResourceResult,
  MCPListPromptsResult,
  MCPGetPromptResult,
  MCPClientEventListener,
} from './types';

export class MCPService {
  private clients: Map<string, MCPClient> = new Map();

  /**
   * Create and connect to an MCP server
   */
  async connect(config: MCPServerConfig): Promise<MCPClient> {
    if (this.clients.has(config.name)) {
      const existing = this.clients.get(config.name)!;
      if (existing.isConnected()) {
        return existing;
      }
      // Disconnect and remove disconnected client
      try {
        await existing.disconnect();
      } catch (error) {
        console.warn(`Error disconnecting existing client ${config.name}:`, error);
      }
      this.clients.delete(config.name);
    }

    const client = new MCPClient(config);
    await client.connect();
    this.clients.set(config.name, client);
    return client;
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      await client.disconnect();
      this.clients.delete(serverName);
    }
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.keys()).map((name) =>
      this.disconnect(name).catch((error) => {
        console.warn(`Error disconnecting ${name}:`, error);
      })
    );
    await Promise.all(disconnectPromises);
  }

  /**
   * Get a client by server name
   */
  getClient(serverName: string): MCPClient | undefined {
    return this.clients.get(serverName);
  }

  /**
   * Get all connected clients
   */
  getConnectedClients(): MCPClient[] {
    return Array.from(this.clients.values()).filter((client) => client.isConnected());
  }

  /**
   * Get connection status for all servers
   */
  getStatuses(): Record<string, MCPConnectionStatus> {
    const statuses: Record<string, MCPConnectionStatus> = {};
    this.clients.forEach((client, name) => {
      statuses[name] = client.getStatus();
    });
    return statuses;
  }

  /**
   * List all tools from all connected servers
   */
  async listAllTools(): Promise<Record<string, MCPTool[]>> {
    const allTools: Record<string, MCPTool[]> = {};
    const connectedClients = this.getConnectedClients();

    await Promise.all(
      connectedClients.map(async (client) => {
        try {
          const status = client.getStatus();
          if (status.serverName) {
            const tools = await client.listTools();
            allTools[status.serverName] = tools;
          }
        } catch (error) {
          console.warn(`Error listing tools from ${client.getStatus().serverName}:`, error);
        }
      })
    );

    return allTools;
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(
    serverName: string,
    toolName: string,
    arguments_?: Record<string, any>
  ): Promise<MCPCallToolResult> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not found`);
    }
    if (!client.isConnected()) {
      throw new Error(`Server ${serverName} is not connected`);
    }
    return client.callTool(toolName, arguments_);
  }

  /**
   * List resources from a specific server
   */
  async listResources(serverName: string, uri?: string): Promise<MCPListResourcesResult> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not found`);
    }
    if (!client.isConnected()) {
      throw new Error(`Server ${serverName} is not connected`);
    }
    return client.listResources(uri);
  }

  /**
   * Read a resource from a specific server
   */
  async readResource(serverName: string, uri: string): Promise<MCPReadResourceResult> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not found`);
    }
    if (!client.isConnected()) {
      throw new Error(`Server ${serverName} is not connected`);
    }
    return client.readResource(uri);
  }

  /**
   * List prompts from a specific server
   */
  async listPrompts(serverName: string): Promise<MCPListPromptsResult> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not found`);
    }
    if (!client.isConnected()) {
      throw new Error(`Server ${serverName} is not connected`);
    }
    return client.listPrompts();
  }

  /**
   * Get a prompt from a specific server
   */
  async getPrompt(
    serverName: string,
    promptName: string,
    arguments_?: Record<string, string>
  ): Promise<MCPGetPromptResult> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not found`);
    }
    if (!client.isConnected()) {
      throw new Error(`Server ${serverName} is not connected`);
    }
    return client.getPrompt(promptName, arguments_);
  }

  /**
   * Add event listener to a specific server
   */
  on(serverName: string, event: 'event', listener: MCPClientEventListener): void {
    const client = this.clients.get(serverName);
    if (client) {
      client.on(event, listener);
    }
  }

  /**
   * Remove event listener from a specific server
   */
  off(serverName: string, event: 'event', listener: MCPClientEventListener): void {
    const client = this.clients.get(serverName);
    if (client) {
      client.off(event, listener);
    }
  }
}

// Singleton instance
export const mcpService = new MCPService();

