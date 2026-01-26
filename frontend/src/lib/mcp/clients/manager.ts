/**
 * MCP Client Manager
 * 
 * Manages multiple MCP client connections
 */

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
} from '../core/types';
import { MCPUnifiedClient } from './unified-client';
import { mcpServerConfigStorage } from '../storage/servers';

export class MCPClientManager {
    private static instance: MCPClientManager;
    private clients: Map<string, MCPUnifiedClient> = new Map();
    private eventListeners: Set<MCPClientEventListener> = new Set();

    private constructor() {
        // Auto-connect to saved servers on instantiation
        this.autoConnect();
    }

    static getInstance(): MCPClientManager {
        if (!MCPClientManager.instance) {
            MCPClientManager.instance = new MCPClientManager();
        }
        return MCPClientManager.instance;
    }

    /**
     * Auto-connect to servers marked with autoConnect
     */
    private async autoConnect(): Promise<void> {
        const servers = mcpServerConfigStorage.getAutoConnectServers();

        for (const server of servers) {
            try {
                const fullConfig = mcpServerConfigStorage.getServerWithCredentials(server.id);
                if (fullConfig) {
                    await this.connect(fullConfig);
                }
            } catch (error) {
                console.warn(`Failed to auto-connect to ${server.name}:`, error);
            }
        }
    }

    /**
     * Connect to an MCP server
     */
    async connect(config: MCPServerConfig): Promise<MCPUnifiedClient> {
        // Check if already connected
        const existingClient = this.clients.get(config.id);
        if (existingClient?.isConnected()) {
            console.warn(`Already connected to ${config.name}`);
            return existingClient;
        }

        // Create new client
        const client = new MCPUnifiedClient(config);

        // Forward events
        client.on(event => this.emitEvent(event));

        // Connect
        await client.connect();

        // Store client
        this.clients.set(config.id, client);

        return client;
    }

    /**
     * Disconnect from a server
     */
    async disconnect(serverId: string): Promise<void> {
        const client = this.clients.get(serverId);
        if (client) {
            await client.disconnect();
            this.clients.delete(serverId);
        }
    }

    /**
     * Disconnect from all servers
     */
    async disconnectAll(): Promise<void> {
        const disconnectPromises = Array.from(this.clients.values()).map(client =>
            client.disconnect().catch(err =>
                console.warn(`Error disconnecting from ${client.getConfig().name}:`, err)
            )
        );
        await Promise.all(disconnectPromises);
        this.clients.clear();
    }

    /**
     * Get a client by server ID
     */
    getClient(serverId: string): MCPUnifiedClient | undefined {
        return this.clients.get(serverId);
    }

    /**
     * Get all connected clients
     */
    getConnectedClients(): MCPUnifiedClient[] {
        return Array.from(this.clients.values()).filter(c => c.isConnected());
    }

    /**
     * Get all client statuses
     */
    getStatuses(): Record<string, MCPConnectionStatus> {
        const statuses: Record<string, MCPConnectionStatus> = {};
        this.clients.forEach((client, id) => {
            statuses[id] = client.getStatus();
        });
        return statuses;
    }

    /**
     * Check if a server is connected
     */
    isConnected(serverId: string): boolean {
        return this.clients.get(serverId)?.isConnected() ?? false;
    }

    /**
     * List tools from all connected servers
     */
    async listAllTools(): Promise<MCPTool[]> {
        const clients = this.getConnectedClients();
        const toolsArrays = await Promise.all(
            clients.map(client =>
                client.listTools().catch(() => [])
            )
        );
        return toolsArrays.flat();
    }

    /**
     * List tools from a specific server
     */
    async listTools(serverId: string): Promise<MCPTool[]> {
        const client = this.clients.get(serverId);
        if (!client) {
            throw new Error(`Server ${serverId} not connected`);
        }
        return client.listTools();
    }

    /**
     * Call a tool on a specific server
     */
    async callTool(serverId: string, toolName: string, args?: Record<string, any>): Promise<MCPCallToolResult> {
        const client = this.clients.get(serverId);
        if (!client) {
            throw new Error(`Server ${serverId} not connected`);
        }
        return client.callTool(toolName, args);
    }

    /**
     * Find which server has a tool
     */
    async findToolServer(toolName: string): Promise<string | null> {
        for (const [serverId, client] of this.clients) {
            try {
                const tools = await client.listTools();
                if (tools.some(t => t.name === toolName)) {
                    return serverId;
                }
            } catch { }
        }
        return null;
    }

    /**
     * Call a tool on any server that has it
     */
    async callToolAny(toolName: string, args?: Record<string, any>): Promise<MCPCallToolResult> {
        const serverId = await this.findToolServer(toolName);
        if (!serverId) {
            throw new Error(`No server found with tool: ${toolName}`);
        }
        return this.callTool(serverId, toolName, args);
    }

    /**
     * List resources from a server
     */
    async listResources(serverId: string): Promise<MCPListResourcesResult> {
        const client = this.clients.get(serverId);
        if (!client) {
            throw new Error(`Server ${serverId} not connected`);
        }
        return client.listResources();
    }

    /**
     * List resources from all connected servers
     */
    async listAllResources(): Promise<MCPListResourcesResult> {
        const clients = this.getConnectedClients();
        const results = await Promise.all(
            clients.map(client =>
                client.listResources().catch(() => ({ resources: [] }))
            )
        );
        return {
            resources: results.flatMap(r => r.resources),
        };
    }

    /**
     * Read a resource
     */
    async readResource(serverId: string, uri: string): Promise<MCPReadResourceResult> {
        const client = this.clients.get(serverId);
        if (!client) {
            throw new Error(`Server ${serverId} not connected`);
        }
        return client.readResource(uri);
    }

    /**
     * List prompts from a server
     */
    async listPrompts(serverId: string): Promise<MCPListPromptsResult> {
        const client = this.clients.get(serverId);
        if (!client) {
            throw new Error(`Server ${serverId} not connected`);
        }
        return client.listPrompts();
    }

    /**
     * List prompts from all connected servers
     */
    async listAllPrompts(): Promise<MCPListPromptsResult> {
        const clients = this.getConnectedClients();
        const results = await Promise.all(
            clients.map(client =>
                client.listPrompts().catch(() => ({ prompts: [] }))
            )
        );
        return {
            prompts: results.flatMap(r => r.prompts),
        };
    }

    /**
     * Get a prompt
     */
    async getPrompt(serverId: string, promptName: string, args?: Record<string, string>): Promise<MCPGetPromptResult> {
        const client = this.clients.get(serverId);
        if (!client) {
            throw new Error(`Server ${serverId} not connected`);
        }
        return client.getPrompt(promptName, args);
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
     * Reconnect to a server
     */
    async reconnect(serverId: string): Promise<void> {
        const client = this.clients.get(serverId);
        if (client) {
            await client.reconnect();
        }
    }

    /**
     * Get server count
     */
    getServerCount(): { total: number; connected: number } {
        const total = this.clients.size;
        const connected = this.getConnectedClients().length;
        return { total, connected };
    }
}

// Export singleton instance
export const mcpClientManager = MCPClientManager.getInstance();
