/**
 * MCP Client Implementation
 * 
 * Model Context Protocol client for connecting to MCP servers
 */

import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  MCPServerConfig,
  MCPConnectionStatus,
  MCPTool,
  MCPCallToolResult,
  MCPListResourcesResult,
  MCPReadResourceResult,
  MCPListPromptsResult,
  MCPGetPromptResult,
  MCPClientEvent,
  MCPClientEventListener,
} from './types';

export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private config: MCPServerConfig;
  private status: MCPConnectionStatus = {
    connected: false,
  };
  private eventListeners: Set<MCPClientEventListener> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    try {
      if (this.status.connected) {
        console.warn('MCP client already connected');
        return;
      }

      if (this.config.transport === 'stdio') {
        await this.connectStdio();
      } else if (this.config.transport === 'http' || this.config.transport === 'sse') {
        throw new Error('HTTP/SSE transport not yet implemented');
      } else {
        throw new Error(`Unsupported transport type: ${this.config.transport}`);
      }

      // Client initialization happens automatically when connect() is called
      // The connect() method in connectStdio() handles the initialization flow

      this.status.connected = true;
      this.status.serverName = this.config.name;
      this.reconnectAttempts = 0;

      // Get server capabilities
      await this.updateCapabilities();

      this.emitEvent({ type: 'connected', serverName: this.config.name });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.status.error = err.message;
      this.status.connected = false;
      this.emitEvent({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * Connect using stdio transport
   */
  private async connectStdio(): Promise<void> {
    if (!this.config.command) {
      throw new Error('Command is required for stdio transport');
    }

    this.transport = new StdioClientTransport({
      command: this.config.command,
      args: this.config.args || [],
      env: this.config.env,
    });

    this.client = new Client(
      {
        name: 'buddy-mcp-client',
        version: '1.0.0',
      },
      {
        capabilities: {
          roots: {
            listChanged: true,
          },
          sampling: {},
        },
      }
    );

    await this.client.connect(this.transport);
  }

  /**
   * Update server capabilities
   */
  private async updateCapabilities(): Promise<void> {
    if (!this.client) return;

    try {
      // Check if server supports tools, resources, and prompts
      // by attempting to list them (they may not be available)
      this.status.capabilities = {
        tools: true, // Assume tools are supported
        resources: true, // Assume resources are supported
        prompts: true, // Assume prompts are supported
      };
    } catch (error) {
      console.warn('Failed to determine server capabilities:', error);
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }
      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }
      this.status.connected = false;
      this.emitEvent({ type: 'disconnected' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitEvent({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): MCPConnectionStatus {
    return { ...this.status };
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.status.connected;
  }

  /**
   * List available tools
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    try {
      const response = await this.client.listTools();
      return response.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as MCPTool['inputSchema'],
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitEvent({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * Call a tool
   */
  async callTool(name: string, arguments_: Record<string, any> = {}): Promise<MCPCallToolResult> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    try {
      const response = await this.client.callTool({
        name,
        arguments: arguments_,
      });

      const content = Array.isArray(response.content) ? response.content : [];
      const isError = Boolean(response.isError);

      const mappedContent = content.map((item: any) => {
        if (item.type === 'text') {
          return {
            type: 'text' as const,
            text: item.text || '',
          };
        } else if (item.type === 'image') {
          return {
            type: 'image' as const,
            data: item.data || '',
            mimeType: item.mimeType,
          };
        } else if (item.type === 'resource') {
          return {
            type: 'resource' as const,
            uri: item.uri || '',
            mimeType: item.mimeType,
          };
        }
        return { type: 'text' as const, text: String(item) };
      });

      const result: MCPCallToolResult = {
        content: mappedContent,
        isError,
      };

      this.emitEvent({
        type: 'tool-call',
        toolName: name,
        result,
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitEvent({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * List available resources
   * @param uri - Optional URI to filter resources (filtering done client-side)
   */
  async listResources(uri?: string): Promise<MCPListResourcesResult> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    try {
      // Note: The MCP SDK's listResources doesn't support uri filtering in params
      // Filtering by URI is done client-side after getting all resources
      const response = await this.client.listResources();
      let resources = response.resources.map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      }));

      // Filter by URI if provided
      if (uri) {
        resources = resources.filter((resource) => resource.uri === uri);
      }

      return {
        resources,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitEvent({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<MCPReadResourceResult> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    try {
      const response = await this.client.readResource({ uri });
      return {
        contents: response.contents.map((content) => {
          const result: {
            uri: string;
            mimeType?: string;
            text?: string;
            blob?: string;
          } = {
            uri: content.uri,
            mimeType: content.mimeType,
          };
          if ('text' in content) {
            result.text = content.text;
          }
          if ('blob' in content) {
            result.blob = content.blob;
          }
          return result;
        }),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitEvent({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * List available prompts
   */
  async listPrompts(): Promise<MCPListPromptsResult> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    try {
      const response = await this.client.listPrompts();
      return {
        prompts: response.prompts.map((prompt) => ({
          name: prompt.name,
          description: prompt.description,
          arguments: prompt.arguments?.map((arg) => ({
            name: arg.name,
            description: arg.description,
            required: arg.required,
          })),
        })),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitEvent({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * Get a prompt
   */
  async getPrompt(name: string, arguments_?: Record<string, string>): Promise<MCPGetPromptResult> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    try {
      const response = await this.client.getPrompt({
        name,
        arguments: arguments_,
      });
      return {
        messages: response.messages.map((msg) => {
          let contentText = '';
          if (typeof msg.content === 'string') {
            contentText = msg.content;
          } else if (Array.isArray(msg.content)) {
            contentText = msg.content.map((c: any) => {
              if (typeof c === 'string') return c;
              if (c && typeof c === 'object' && c.type === 'text') return c.text || '';
              return String(c);
            }).join('\n');
          } else if (msg.content && typeof msg.content === 'object' && 'text' in msg.content) {
            contentText = (msg.content as any).text || '';
          } else {
            contentText = String(msg.content);
          }
          return {
            role: msg.role as 'user' | 'assistant' | 'system',
            content: contentText,
          };
        }),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitEvent({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * Add event listener
   */
  on(_event: 'event', listener: MCPClientEventListener): void {
    this.eventListeners.add(listener);
  }

  /**
   * Remove event listener
   */
  off(_event: 'event', listener: MCPClientEventListener): void {
    this.eventListeners.delete(listener);
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: MCPClientEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    await new Promise((resolve) => setTimeout(resolve, delay));
    await this.connect();
  }
}

