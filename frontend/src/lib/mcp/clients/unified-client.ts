/**
 * Unified MCP Client
 * 
 * A unified client that handles all transport types and authentication
 */

import { Client } from '@modelcontextprotocol/sdk/client';
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
    MCPServerCapabilities,
} from '../core/types';
import { DEFAULT_RECONNECT_ATTEMPTS, DEFAULT_RECONNECT_DELAY } from '../core/constants';
import { StdioTransport } from '../transports/stdio';
import { SSETransport } from '../transports/sse';
import { WebSocketTransport } from '../transports/websocket';
import { createAuthProvider } from '../auth/factory';
import type { AuthProvider } from '../auth/base';

export class MCPUnifiedClient {
    private config: MCPServerConfig;
    private client: Client | null = null;
    private transport: StdioTransport | SSETransport | WebSocketTransport | null = null;
    private authProvider: AuthProvider;
    private status: MCPConnectionStatus;
    private eventListeners: Set<MCPClientEventListener> = new Set();
    private reconnectAttempts = 0;
    private maxReconnectAttempts: number;
    private reconnectDelay: number;

    constructor(config: MCPServerConfig) {
        this.config = config;
        this.authProvider = createAuthProvider(config.auth);
        this.maxReconnectAttempts = DEFAULT_RECONNECT_ATTEMPTS;
        this.reconnectDelay = DEFAULT_RECONNECT_DELAY;

        this.status = {
            connected: false,
            connecting: false,
            serverId: config.id,
            serverName: config.name,
        };
    }

    /**
     * Connect to the MCP server
     */
    async connect(): Promise<void> {
        if (this.status.connected) {
            console.warn(`MCP client already connected to ${this.config.name}`);
            return;
        }

        if (this.status.connecting) {
            console.warn(`MCP client already connecting to ${this.config.name}`);
            return;
        }

        this.status.connecting = true;
        this.emitEvent({ type: 'connecting', serverId: this.config.id });

        try {
            // Get auth headers/env
            const authHeaders = await this.authProvider.getHeaders();
            const authEnv = await this.authProvider.getEnv();

            // Create transport based on type
            switch (this.config.transport.type) {
                case 'stdio':
                    await this.connectStdio(authEnv);
                    break;
                case 'sse':
                    await this.connectSSE(authHeaders);
                    break;
                case 'websocket':
                    await this.connectWebSocket(authHeaders);
                    break;
                case 'http':
                    throw new Error('HTTP transport not yet supported');
                default:
                    throw new Error(`Unknown transport type: ${(this.config.transport as any).type}`);
            }

            this.status.connected = true;
            this.status.connecting = false;
            this.status.error = undefined;
            this.status.lastConnected = new Date().toISOString();
            this.reconnectAttempts = 0;

            // Get server capabilities
            await this.updateCapabilities();

            this.emitEvent({
                type: 'connected',
                serverId: this.config.id,
                serverName: this.config.name
            });

        } catch (error) {
            this.status.connecting = false;
            this.status.connected = false;
            const err = error instanceof Error ? error : new Error(String(error));
            this.status.error = err.message;
            this.emitEvent({ type: 'error', serverId: this.config.id, error: err });
            throw err;
        }
    }

    /**
     * Connect using Stdio transport
     */
    private async connectStdio(authEnv: Record<string, string>): Promise<void> {
        if (this.config.transport.type !== 'stdio') {
            throw new Error('Invalid transport type for stdio connection');
        }

        const transport = new StdioTransport({
            config: this.config.transport,
            env: {
                ...this.config.env,
                ...authEnv,
            },
        });

        this.client = await transport.connect();
        this.transport = transport;
    }

    /**
     * Connect using SSE transport
     */
    private async connectSSE(authHeaders: Record<string, string>): Promise<void> {
        if (this.config.transport.type !== 'sse') {
            throw new Error('Invalid transport type for SSE connection');
        }

        const transport = new SSETransport({
            config: this.config.transport,
            headers: authHeaders,
        });

        this.client = await transport.connect();
        this.transport = transport;
    }

    /**
     * Connect using WebSocket transport
     */
    private async connectWebSocket(authHeaders: Record<string, string>): Promise<void> {
        if (this.config.transport.type !== 'websocket') {
            throw new Error('Invalid transport type for WebSocket connection');
        }

        const transport = new WebSocketTransport({
            config: this.config.transport,
            headers: authHeaders,
        });

        this.client = await transport.connect();
        this.transport = transport;
    }

    /**
     * Update server capabilities
     */
    private async updateCapabilities(): Promise<void> {
        const capabilities: MCPServerCapabilities = {
            tools: false,
            resources: false,
            prompts: false,
        };

        // Try to list tools
        try {
            await this.client?.listTools();
            capabilities.tools = true;
        } catch { }

        // Try to list resources
        try {
            await this.client?.listResources();
            capabilities.resources = true;
        } catch { }

        // Try to list prompts
        try {
            await this.client?.listPrompts();
            capabilities.prompts = true;
        } catch { }

        this.status.capabilities = capabilities;
    }

    /**
     * Disconnect from the MCP server
     */
    async disconnect(): Promise<void> {
        try {
            if (this.transport) {
                await this.transport.close();
                this.transport = null;
            }
            this.client = null;
            this.status.connected = false;
            this.status.connecting = false;
            this.emitEvent({ type: 'disconnected', serverId: this.config.id });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitEvent({ type: 'error', serverId: this.config.id, error: err });
            throw err;
        }
    }

    /**
     * Attempt to reconnect
     */
    async reconnect(): Promise<void> {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            throw new Error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
        }

        this.reconnectAttempts++;
        this.status.reconnectAttempts = this.reconnectAttempts;

        this.emitEvent({
            type: 'reconnecting',
            serverId: this.config.id,
            attempt: this.reconnectAttempts
        });

        // Exponential backoff
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Disconnect first if needed
        if (this.status.connected || this.transport) {
            await this.disconnect();
        }

        await this.connect();
    }

    /**
     * Get connection status
     */
    getStatus(): MCPConnectionStatus {
        return { ...this.status };
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.status.connected;
    }

    /**
     * Get server config
     */
    getConfig(): MCPServerConfig {
        return { ...this.config };
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
            return response.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema as MCPTool['inputSchema'],
                serverId: this.config.id,
            }));
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitEvent({ type: 'error', serverId: this.config.id, error: err });
            throw err;
        }
    }

    /**
     * Call a tool
     */
    async callTool(name: string, args: Record<string, any> = {}): Promise<MCPCallToolResult> {
        if (!this.client) {
            throw new Error('Client not connected');
        }

        try {
            const response = await this.client.callTool({
                name,
                arguments: args,
            });

            const content = Array.isArray(response.content) ? response.content : [];
            const isError = Boolean(response.isError);

            const mappedContent = content.map((item: any) => {
                if (item.type === 'text') {
                    return { type: 'text' as const, text: item.text || '' };
                } else if (item.type === 'image') {
                    return { type: 'image' as const, data: item.data || '', mimeType: item.mimeType };
                } else if (item.type === 'resource') {
                    return { type: 'resource' as const, uri: item.uri || '', mimeType: item.mimeType };
                }
                return { type: 'text' as const, text: String(item) };
            });

            const result: MCPCallToolResult = { content: mappedContent, isError };

            this.emitEvent({
                type: 'tool-call',
                serverId: this.config.id,
                toolName: name,
                result,
            });

            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitEvent({ type: 'error', serverId: this.config.id, error: err });
            throw err;
        }
    }

    /**
     * List resources
     */
    async listResources(): Promise<MCPListResourcesResult> {
        if (!this.client) {
            throw new Error('Client not connected');
        }

        try {
            const response = await this.client.listResources();
            return {
                resources: response.resources.map(resource => ({
                    uri: resource.uri,
                    name: resource.name,
                    description: resource.description,
                    mimeType: resource.mimeType,
                    serverId: this.config.id,
                })),
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitEvent({ type: 'error', serverId: this.config.id, error: err });
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
                contents: response.contents.map(content => {
                    const result: any = { uri: content.uri, mimeType: content.mimeType };
                    if ('text' in content) result.text = content.text;
                    if ('blob' in content) result.blob = content.blob;
                    return result;
                }),
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitEvent({ type: 'error', serverId: this.config.id, error: err });
            throw err;
        }
    }

    /**
     * List prompts
     */
    async listPrompts(): Promise<MCPListPromptsResult> {
        if (!this.client) {
            throw new Error('Client not connected');
        }

        try {
            const response = await this.client.listPrompts();
            return {
                prompts: response.prompts.map(prompt => ({
                    name: prompt.name,
                    description: prompt.description,
                    arguments: prompt.arguments?.map(arg => ({
                        name: arg.name,
                        description: arg.description,
                        required: arg.required,
                    })),
                    serverId: this.config.id,
                })),
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitEvent({ type: 'error', serverId: this.config.id, error: err });
            throw err;
        }
    }

    /**
     * Get a prompt
     */
    async getPrompt(name: string, args?: Record<string, string>): Promise<MCPGetPromptResult> {
        if (!this.client) {
            throw new Error('Client not connected');
        }

        try {
            const response = await this.client.getPrompt({ name, arguments: args });
            return {
                messages: response.messages.map(msg => {
                    let contentText = '';
                    if (typeof msg.content === 'string') {
                        contentText = msg.content;
                    } else if (Array.isArray(msg.content)) {
                        contentText = msg.content.map((c: any) => {
                            if (typeof c === 'string') return c;
                            if (c?.type === 'text') return c.text || '';
                            return String(c);
                        }).join('\n');
                    } else if (msg.content && typeof msg.content === 'object' && 'text' in msg.content) {
                        contentText = (msg.content as any).text || '';
                    } else {
                        contentText = String(msg.content);
                    }
                    return { role: msg.role as any, content: contentText };
                }),
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitEvent({ type: 'error', serverId: this.config.id, error: err });
            throw err;
        }
    }

    /**
     * Add event listener
     */
    on(listener: MCPClientEventListener): void {
        this.eventListeners.add(listener);
    }

    /**
     * Remove event listener
     */
    off(listener: MCPClientEventListener): void {
        this.eventListeners.delete(listener);
    }

    /**
     * Emit event
     */
    private emitEvent(event: MCPClientEvent): void {
        this.eventListeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in event listener:', error);
            }
        });
    }

    /**
     * Get auth provider
     */
    getAuthProvider(): AuthProvider {
        return this.authProvider;
    }

    /**
     * Update auth config
     */
    updateAuth(auth: MCPServerConfig['auth']): void {
        this.config.auth = auth;
        this.authProvider = createAuthProvider(auth);
    }
}
