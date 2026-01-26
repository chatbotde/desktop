/**
 * MCP Server Config Storage
 * 
 * Storage for MCP server configurations
 */

import type { MCPServerConfig, MCPServerCategory } from '../core/types';
import { mcpCredentialStorage } from './credentials';

/**
 * MCP Server Config Storage
 */
export class MCPServerConfigStorage {
    private static instance: MCPServerConfigStorage;

    private constructor() { }

    static getInstance(): MCPServerConfigStorage {
        if (!MCPServerConfigStorage.instance) {
            MCPServerConfigStorage.instance = new MCPServerConfigStorage();
        }
        return MCPServerConfigStorage.instance;
    }

    /**
     * Get all servers
     */
    getServers(): MCPServerConfig[] {
        return mcpCredentialStorage.loadServers();
    }

    /**
     * Get a specific server by ID
     */
    getServer(id: string): MCPServerConfig | null {
        const servers = this.getServers();
        return servers.find(s => s.id === id) || null;
    }

    /**
     * Get a server with credentials
     */
    getServerWithCredentials(id: string): MCPServerConfig | null {
        return mcpCredentialStorage.getServerWithCredentials(id);
    }

    /**
     * Add a new server
     */
    addServer(server: MCPServerConfig): void {
        const servers = this.getServers();

        // Check for duplicate ID
        if (servers.some(s => s.id === server.id)) {
            throw new Error(`Server with ID "${server.id}" already exists`);
        }

        // Add timestamps
        const newServer: MCPServerConfig = {
            ...server,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Save server config
        servers.push(newServer);
        mcpCredentialStorage.saveServers(servers);

        // Save credentials separately
        if (server.auth && server.auth.type !== 'none') {
            mcpCredentialStorage.saveServerCredentials(server.id, server.auth);
        }
    }

    /**
     * Update an existing server
     */
    updateServer(id: string, updates: Partial<MCPServerConfig>): void {
        const servers = this.getServers();
        const index = servers.findIndex(s => s.id === id);

        if (index === -1) {
            throw new Error(`Server with ID "${id}" not found`);
        }

        // Update server
        servers[index] = {
            ...servers[index],
            ...updates,
            id, // Ensure ID can't be changed
            updatedAt: new Date().toISOString(),
        };

        mcpCredentialStorage.saveServers(servers);

        // Update credentials if auth changed
        if (updates.auth) {
            mcpCredentialStorage.saveServerCredentials(id, updates.auth);
        }
    }

    /**
     * Delete a server
     */
    deleteServer(id: string): void {
        const servers = this.getServers();
        const filtered = servers.filter(s => s.id !== id);
        mcpCredentialStorage.saveServers(filtered);
        mcpCredentialStorage.deleteServerCredentials(id);
    }

    /**
     * Enable/disable a server
     */
    toggleServer(id: string, enabled: boolean): void {
        this.updateServer(id, { enabled });
    }

    /**
     * Set auto-connect for a server
     */
    setAutoConnect(id: string, autoConnect: boolean): void {
        this.updateServer(id, { autoConnect });
    }

    /**
     * Get servers by category
     */
    getServersByCategory(category: MCPServerCategory): MCPServerConfig[] {
        return this.getServers().filter(s => s.category === category);
    }

    /**
     * Get enabled servers
     */
    getEnabledServers(): MCPServerConfig[] {
        return this.getServers().filter(s => s.enabled !== false);
    }

    /**
     * Get auto-connect servers
     */
    getAutoConnectServers(): MCPServerConfig[] {
        return this.getServers().filter(s => s.autoConnect === true && s.enabled !== false);
    }

    /**
     * Check if a server exists
     */
    hasServer(id: string): boolean {
        return this.getServers().some(s => s.id === id);
    }

    /**
     * Generate a unique server ID
     */
    generateServerId(baseName: string): string {
        const baseId = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        let id = baseId;
        let counter = 1;

        while (this.hasServer(id)) {
            id = `${baseId}-${counter}`;
            counter++;
        }

        return id;
    }

    /**
     * Import servers from JSON
     */
    importServers(data: MCPServerConfig[]): { imported: number; skipped: number } {
        let imported = 0;
        let skipped = 0;

        for (const server of data) {
            try {
                // Generate new ID if exists
                if (this.hasServer(server.id)) {
                    server.id = this.generateServerId(server.name);
                }
                this.addServer(server);
                imported++;
            } catch {
                skipped++;
            }
        }

        return { imported, skipped };
    }

    /**
     * Export servers (without credentials)
     */
    exportServers(): MCPServerConfig[] {
        return this.getServers();
    }
}

// Export singleton instance
export const mcpServerConfigStorage = MCPServerConfigStorage.getInstance();
