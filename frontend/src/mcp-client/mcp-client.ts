/**
 * MCP Client - Main client class for managing MCP server connections
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { EventEmitter } from 'events';
import type {
  MCPServerConfig,
  MCPConnectionState,
  MCPServerInfo,
  ToolCallParams,
  ResourceReadParams,
  PromptGetParams,
  Tool,
  Resource,
  Prompt,
  CallToolResult,
  ReadResourceResult,
  GetPromptResult,
  MCPClientEvents,
  EventListener
} from './types';
import { ElectronStdioTransport } from './transport/electron-stdio-transport';
import { SSETransport, StreamableHTTPTransport } from './transport/http-transport';

/**
 * Main MCP Client class
 * Manages connections to multiple MCP servers
 */
export class MCPClient extends EventEmitter {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, any> = new Map();
  private connectionStates: Map<string, MCPConnectionState> = new Map();
  private serverConfigs: Map<string, MCPServerConfig> = new Map();
  private serverInfo: Map<string, MCPServerInfo> = new Map();
  
  // Cached data from servers
  private toolsCache: Map<string, Tool[]> = new Map();
  private resourcesCache: Map<string, Resource[]> = new Map();
  private promptsCache: Map<string, Prompt[]> = new Map();

  constructor() {
    super();
  }

  /**
   * Add a server configuration
   */
  addServer(config: MCPServerConfig): void {
    this.serverConfigs.set(config.id, config);
    
    // Initialize connection state
    this.connectionStates.set(config.id, {
      serverId: config.id,
      status: 'disconnected'
    });

    // Auto-connect if specified
    if (config.autoConnect) {
      this.connect(config.id).catch(error => {
        console.error(`Failed to auto-connect to ${config.id}:`, error);
      });
    }
  }

  /**
   * Remove a server configuration
   */
  async removeServer(serverId: string): Promise<void> {
    await this.disconnect(serverId);
    this.serverConfigs.delete(serverId);
    this.connectionStates.delete(serverId);
    this.serverInfo.delete(serverId);
    this.toolsCache.delete(serverId);
    this.resourcesCache.delete(serverId);
    this.promptsCache.delete(serverId);
  }

  /**
   * Connect to a server
   */
  async connect(serverId: string): Promise<void> {
    const config = this.serverConfigs.get(serverId);
    if (!config) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Update state
    this.updateConnectionState(serverId, { status: 'connecting' });

    try {
      // Create client
      const client = new Client({
        name: 'sonicplane-mcp-client',
        version: '1.0.0'
      }, {
        capabilities: {
          sampling: {},
          elicitation: {}
        }
      });

      // Create transport based on type
      let transport;
      switch (config.type) {
        case 'stdio':
          if (!config.command) {
            throw new Error('Command required for stdio transport');
          }
          transport = new ElectronStdioTransport({
            serverId,
            command: config.command,
            args: config.args,
            env: config.env
          });
          break;

        case 'sse':
          if (!config.url) {
            throw new Error('URL required for SSE transport');
          }
          transport = new SSETransport({
            url: config.url,
            headers: config.headers
          });
          break;

        case 'streamable-http':
          if (!config.url) {
            throw new Error('URL required for streamable-http transport');
          }
          transport = new StreamableHTTPTransport({
            url: config.url,
            headers: config.headers
          });
          break;

        default:
          throw new Error(`Unknown transport type: ${config.type}`);
      }

      // Set up transport event listeners
      transport.on('error', (error: Error) => {
        this.updateConnectionState(serverId, {
          status: 'error',
          error: error.message,
          lastError: error
        });
        this.emit('connection:error', serverId, error);
      });

      transport.on('disconnected', () => {
        this.updateConnectionState(serverId, { status: 'disconnected' });
      });

      // Connect
      await client.connect(transport);

      // Store client and transport
      this.clients.set(serverId, client);
      this.transports.set(serverId, transport);

      // Get server info
      const info = await this.getServerInfo(serverId);
      this.serverInfo.set(serverId, info);

      // Cache capabilities
      await this.refreshServerCapabilities(serverId);

      // Update state
      this.updateConnectionState(serverId, {
        status: 'connected',
        connectedAt: new Date(),
        error: undefined
      });

    } catch (error) {
      this.updateConnectionState(serverId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastError: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  }

  /**
   * Disconnect from a server
   */
  async disconnect(serverId: string): Promise<void> {
    const transport = this.transports.get(serverId);
    if (transport) {
      await transport.close();
      this.transports.delete(serverId);
    }

    this.clients.delete(serverId);
    this.updateConnectionState(serverId, { status: 'disconnected' });
  }

  /**
   * Get connection state for a server
   */
  getConnectionState(serverId: string): MCPConnectionState | undefined {
    return this.connectionStates.get(serverId);
  }

  /**
   * Get all connection states
   */
  getAllConnectionStates(): Map<string, MCPConnectionState> {
    return new Map(this.connectionStates);
  }

  /**
   * Check if connected to a server
   */
  isConnected(serverId: string): boolean {
    const state = this.connectionStates.get(serverId);
    return state?.status === 'connected';
  }

  /**
   * Get server info
   */
  private async getServerInfo(serverId: string): Promise<MCPServerInfo> {
    const client = this.getClient(serverId);
    const serverInfo = client.getServerVersion();
    
    return {
      name: serverInfo?.name || 'Unknown',
      version: serverInfo?.version || 'Unknown',
      protocolVersion: serverInfo?.protocolVersion || '2024-11-05',
      capabilities: {
        tools: !!client.getServerCapabilities()?.tools,
        resources: !!client.getServerCapabilities()?.resources,
        prompts: !!client.getServerCapabilities()?.prompts,
        sampling: !!client.getServerCapabilities()?.sampling,
        logging: !!client.getServerCapabilities()?.logging,
        elicitation: !!client.getServerCapabilities()?.elicitation
      }
    };
  }

  /**
   * Refresh server capabilities (tools, resources, prompts)
   */
  private async refreshServerCapabilities(serverId: string): Promise<void> {
    const client = this.getClient(serverId);
    const capabilities = client.getServerCapabilities();

    try {
      // Fetch tools if supported
      if (capabilities?.tools) {
        const toolsResult = await client.listTools();
        this.toolsCache.set(serverId, toolsResult.tools);
        this.emit('tools:updated', serverId, toolsResult.tools);
      }

      // Fetch resources if supported
      if (capabilities?.resources) {
        const resourcesResult = await client.listResources();
        this.resourcesCache.set(serverId, resourcesResult.resources);
        this.emit('resources:updated', serverId, resourcesResult.resources);
      }

      // Fetch prompts if supported
      if (capabilities?.prompts) {
        const promptsResult = await client.listPrompts();
        this.promptsCache.set(serverId, promptsResult.prompts);
        this.emit('prompts:updated', serverId, promptsResult.prompts);
      }
    } catch (error) {
      console.error(`Failed to refresh capabilities for ${serverId}:`, error);
    }
  }

  /**
   * Get available tools from a server
   */
  async getTools(serverId: string, refresh = false): Promise<Tool[]> {
    if (refresh || !this.toolsCache.has(serverId)) {
      const client = this.getClient(serverId);
      const result = await client.listTools();
      this.toolsCache.set(serverId, result.tools);
      this.emit('tools:updated', serverId, result.tools);
    }
    return this.toolsCache.get(serverId) || [];
  }

  /**
   * Get all tools from all connected servers
   */
  async getAllTools(refresh = false): Promise<Map<string, Tool[]>> {
    const allTools = new Map<string, Tool[]>();
    
    for (const [serverId, state] of this.connectionStates) {
      if (state.status === 'connected') {
        try {
          const tools = await this.getTools(serverId, refresh);
          allTools.set(serverId, tools);
        } catch (error) {
          console.error(`Failed to get tools from ${serverId}:`, error);
        }
      }
    }
    
    return allTools;
  }

  /**
   * Call a tool on a server
   */
  async callTool(params: ToolCallParams): Promise<CallToolResult> {
    const client = this.getClient(params.serverId);
    
    return await client.callTool({
      name: params.name,
      arguments: params.arguments
    });
  }

  /**
   * Get available resources from a server
   */
  async getResources(serverId: string, refresh = false): Promise<Resource[]> {
    if (refresh || !this.resourcesCache.has(serverId)) {
      const client = this.getClient(serverId);
      const result = await client.listResources();
      this.resourcesCache.set(serverId, result.resources);
      this.emit('resources:updated', serverId, result.resources);
    }
    return this.resourcesCache.get(serverId) || [];
  }

  /**
   * Get all resources from all connected servers
   */
  async getAllResources(refresh = false): Promise<Map<string, Resource[]>> {
    const allResources = new Map<string, Resource[]>();
    
    for (const [serverId, state] of this.connectionStates) {
      if (state.status === 'connected') {
        try {
          const resources = await this.getResources(serverId, refresh);
          allResources.set(serverId, resources);
        } catch (error) {
          console.error(`Failed to get resources from ${serverId}:`, error);
        }
      }
    }
    
    return allResources;
  }

  /**
   * Read a resource from a server
   */
  async readResource(params: ResourceReadParams): Promise<ReadResourceResult> {
    const client = this.getClient(params.serverId);
    
    return await client.readResource({
      uri: params.uri
    });
  }

  /**
   * Get available prompts from a server
   */
  async getPrompts(serverId: string, refresh = false): Promise<Prompt[]> {
    if (refresh || !this.promptsCache.has(serverId)) {
      const client = this.getClient(serverId);
      const result = await client.listPrompts();
      this.promptsCache.set(serverId, result.prompts);
      this.emit('prompts:updated', serverId, result.prompts);
    }
    return this.promptsCache.get(serverId) || [];
  }

  /**
   * Get all prompts from all connected servers
   */
  async getAllPrompts(refresh = false): Promise<Map<string, Prompt[]>> {
    const allPrompts = new Map<string, Prompt[]>();
    
    for (const [serverId, state] of this.connectionStates) {
      if (state.status === 'connected') {
        try {
          const prompts = await this.getPrompts(serverId, refresh);
          allPrompts.set(serverId, prompts);
        } catch (error) {
          console.error(`Failed to get prompts from ${serverId}:`, error);
        }
      }
    }
    
    return allPrompts;
  }

  /**
   * Get a prompt from a server
   */
  async getPrompt(params: PromptGetParams): Promise<GetPromptResult> {
    const client = this.getClient(params.serverId);
    
    return await client.getPrompt({
      name: params.name,
      arguments: params.arguments
    });
  }

  /**
   * Get all server configurations
   */
  getServerConfigs(): Map<string, MCPServerConfig> {
    return new Map(this.serverConfigs);
  }

  /**
   * Get a specific server configuration
   */
  getServerConfig(serverId: string): MCPServerConfig | undefined {
    return this.serverConfigs.get(serverId);
  }

  /**
   * Get server information
   */
  getServerInformation(serverId: string): MCPServerInfo | undefined {
    return this.serverInfo.get(serverId);
  }

  /**
   * Helper to get client instance
   */
  private getClient(serverId: string): Client {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Not connected to server: ${serverId}`);
    }
    return client;
  }

  /**
   * Update connection state and emit event
   */
  private updateConnectionState(
    serverId: string,
    updates: Partial<MCPConnectionState>
  ): void {
    const current = this.connectionStates.get(serverId) || {
      serverId,
      status: 'disconnected'
    };
    
    const newState = { ...current, ...updates };
    this.connectionStates.set(serverId, newState);
    this.emit('connection:status', serverId, newState);
  }

  /**
   * Type-safe event listener
   */
  on<K extends keyof MCPClientEvents>(
    event: K,
    listener: EventListener<K>
  ): this {
    return super.on(event, listener as any);
  }

  /**
   * Type-safe event emitter
   */
  emit<K extends keyof MCPClientEvents>(
    event: K,
    ...args: Parameters<MCPClientEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Cleanup all connections
   */
  async destroy(): Promise<void> {
    const disconnectPromises = Array.from(this.serverConfigs.keys()).map(
      serverId => this.disconnect(serverId)
    );
    
    await Promise.all(disconnectPromises);
    this.removeAllListeners();
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();


