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
  EventListener,
  MCPTransport
} from './types';
import { ElectronStdioTransport } from './transport/electron-stdio-transport';
import { SSETransport, StreamableHTTPTransport } from './transport/http-transport';

const DEFAULT_RETRY_DELAY = 2000;
const DEFAULT_MAX_RETRIES = 3;

/**
 * Main MCP Client class
 * Manages connections to multiple MCP servers with automatic retry and error handling
 */
export class MCPClient extends EventEmitter {
  private readonly clients = new Map<string, Client>();
  private readonly transports = new Map<string, MCPTransport>();
  private readonly connectionStates = new Map<string, MCPConnectionState>();
  private readonly serverConfigs = new Map<string, MCPServerConfig>();
  private readonly serverInfo = new Map<string, MCPServerInfo>();
  private readonly retryTimeouts = new Map<string, NodeJS.Timeout>();
  
  // Cached data from servers
  private readonly toolsCache = new Map<string, readonly Tool[]>();
  private readonly resourcesCache = new Map<string, readonly Resource[]>();
  private readonly promptsCache = new Map<string, readonly Prompt[]>();

  constructor() {
    super();
    this.setMaxListeners(50); // Increase max listeners for multiple servers
  }

  /**
   * Add a server configuration
   */
  addServer(config: MCPServerConfig): void {
    this.validateServerConfig(config);
    this.serverConfigs.set(config.id, config);
    
    // Initialize connection state
    this.connectionStates.set(config.id, {
      serverId: config.id,
      status: 'disconnected',
      retryCount: 0
    });

    // Auto-connect if specified
    if (config.autoConnect) {
      void this.connect(config.id);
    }
  }

  /**
   * Validate server configuration
   */
  private validateServerConfig(config: MCPServerConfig): void {
    if (!config.id || typeof config.id !== 'string') {
      throw new Error('Server ID is required and must be a string');
    }
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Server name is required and must be a string');
    }
    if (!['stdio', 'sse', 'streamable-http'].includes(config.type)) {
      throw new Error(`Invalid transport type: ${config.type}`);
    }
    
    // Validate transport-specific requirements
    if (config.type === 'stdio' && !config.command) {
      throw new Error('Command is required for stdio transport');
    }
    if ((config.type === 'sse' || config.type === 'streamable-http') && !config.url) {
      throw new Error(`URL is required for ${config.type} transport`);
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
   * Connect to a server with automatic retry logic
   */
  async connect(serverId: string): Promise<void> {
    const config = this.serverConfigs.get(serverId);
    if (!config) {
      throw new Error(`Server ${serverId} not found`);
    }

    const currentState = this.connectionStates.get(serverId);
    if (currentState?.status === 'connecting' || currentState?.status === 'connected') {
      return; // Already connecting or connected
    }

    await this.connectWithRetry(serverId, config);
  }

  /**
   * Internal connection method with retry logic
   */
  private async connectWithRetry(
    serverId: string,
    config: MCPServerConfig,
    retryCount = 0
  ): Promise<void> {
    this.updateConnectionState(serverId, { 
      status: retryCount > 0 ? 'reconnecting' : 'connecting',
      retryCount 
    });

    try {
      await this.performConnection(serverId, config);
      
      // Reset retry count on successful connection
      this.updateConnectionState(serverId, {
        status: 'connected',
        connectedAt: new Date(),
        error: undefined,
        retryCount: 0
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorObject = error instanceof Error ? error : new Error(String(error));
      
      // Check if should retry
      const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
      const shouldRetry = config.retryOnFailure && retryCount < maxRetries;
      
      if (shouldRetry) {
        const delay = config.retryDelay ?? DEFAULT_RETRY_DELAY;
        this.updateConnectionState(serverId, {
          status: 'reconnecting',
          error: `${errorMessage} (retrying ${retryCount + 1}/${maxRetries})`,
          lastError: errorObject,
          retryCount: retryCount + 1
        });
        
        // Schedule retry
        const timeoutId = setTimeout(() => {
          this.retryTimeouts.delete(serverId);
          void this.connectWithRetry(serverId, config, retryCount + 1);
        }, delay);
        
        this.retryTimeouts.set(serverId, timeoutId);
      } else {
        this.updateConnectionState(serverId, {
          status: 'error',
          error: errorMessage,
          lastError: errorObject,
          retryCount
        });
        throw errorObject;
      }
    }
  }

  /**
   * Perform the actual connection
   */
  private async performConnection(serverId: string, config: MCPServerConfig): Promise<void> {
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

    // Create transport
    const transport = this.createTransport(serverId, config);

    // Set up transport event listeners
    this.setupTransportListeners(serverId, transport);

    // Connect
    await client.connect(transport as any);

    // Store client and transport
    this.clients.set(serverId, client);
    this.transports.set(serverId, transport);

    // Get server info
    const info = await this.getServerInfo(serverId);
    this.serverInfo.set(serverId, info);

    // Cache capabilities
    await this.refreshServerCapabilities(serverId);
  }

  /**
   * Create transport based on configuration
   */
  private createTransport(serverId: string, config: MCPServerConfig): MCPTransport {
    switch (config.type) {
      case 'stdio':
        if (!config.command) {
          throw new Error('Command required for stdio transport');
        }
        return new ElectronStdioTransport({
          serverId,
          command: config.command,
          args: config.args ? [...config.args] : undefined,
          env: config.env ? { ...config.env } : undefined
        });

      case 'sse':
        if (!config.url) {
          throw new Error('URL required for SSE transport');
        }
        return new SSETransport({
          url: config.url,
          headers: config.headers ? { ...config.headers } : undefined
        });

      case 'streamable-http':
        if (!config.url) {
          throw new Error('URL required for streamable-http transport');
        }
        return new StreamableHTTPTransport({
          url: config.url,
          headers: config.headers ? { ...config.headers } : undefined
        });

      default:
        throw new Error(`Unknown transport type: ${config.type}`);
    }
  }

  /**
   * Set up transport event listeners
   */
  private setupTransportListeners(serverId: string, transport: MCPTransport): void {
    const handleError = (...args: unknown[]) => {
      const error = args[0] instanceof Error ? args[0] : new Error('Unknown transport error');
      this.updateConnectionState(serverId, {
        status: 'error',
        error: error.message,
        lastError: error
      });
      this.emit('connection:error', serverId, error);
    };

    const handleDisconnected = () => {
      const config = this.serverConfigs.get(serverId);
      if (config?.retryOnFailure) {
        // Attempt to reconnect
        void this.connect(serverId);
      } else {
        this.updateConnectionState(serverId, { status: 'disconnected' });
      }
    };

    transport.on('error', handleError);
    transport.on('disconnected', handleDisconnected);
  }

  /**
   * Disconnect from a server
   */
  async disconnect(serverId: string): Promise<void> {
    // Cancel any pending retry
    const retryTimeout = this.retryTimeouts.get(serverId);
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      this.retryTimeouts.delete(serverId);
    }

    const transport = this.transports.get(serverId);
    if (transport) {
      try {
        await transport.close();
      } catch (error) {
        console.error(`Error closing transport for ${serverId}:`, error);
      }
      this.transports.delete(serverId);
    }

    this.clients.delete(serverId);
    this.updateConnectionState(serverId, { status: 'disconnected', retryCount: 0 });
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
      protocolVersion: (serverInfo?.protocolVersion as string) || '2024-11-05',
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
    return [...(this.toolsCache.get(serverId) || [])];
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
      arguments: params.arguments as any
    }) as CallToolResult;
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
    return [...(this.resourcesCache.get(serverId) || [])];
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
    return [...(this.promptsCache.get(serverId) || [])];
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
      arguments: params.arguments as any
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
    // Clear all retry timeouts
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();

    // Disconnect all servers
    const disconnectPromises = Array.from(this.serverConfigs.keys()).map(
      serverId => this.disconnect(serverId).catch(error => {
        console.error(`Error disconnecting from ${serverId}:`, error);
      })
    );
    
    await Promise.all(disconnectPromises);
    
    // Clear all caches
    this.clients.clear();
    this.transports.clear();
    this.connectionStates.clear();
    this.serverInfo.clear();
    this.toolsCache.clear();
    this.resourcesCache.clear();
    this.promptsCache.clear();
    
    this.removeAllListeners();
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();


