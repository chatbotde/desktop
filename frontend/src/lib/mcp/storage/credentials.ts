/**
 * MCP Credential Storage
 * 
 * Secure storage for MCP server credentials
 * Uses localStorage with optional encryption for Electron apps
 */

import type {
    MCPServerConfig,
    MCPStoredCredentials,
    MCPServerStorageData,
    AuthConfig
} from '../core/types';
import { STORAGE_KEY_SERVERS, STORAGE_KEY_CREDENTIALS } from '../core/constants';

/**
 * Simple encryption/decryption for credentials
 * In production, you'd want to use a more secure method or Electron's safeStorage
 */
class SimpleEncryption {
    private key: string;

    constructor() {
        // Use a device-specific key if available
        this.key = this.getDeviceKey();
    }

    private getDeviceKey(): string {
        // In Electron, you could use a more secure key derivation
        // For now, use a simple key from localStorage
        let key = localStorage.getItem('_mcp_device_key');
        if (!key) {
            key = crypto.randomUUID() + crypto.randomUUID();
            localStorage.setItem('_mcp_device_key', key);
        }
        return key;
    }

    encrypt(data: string): string {
        // Simple XOR encryption (for demo - use proper encryption in production)
        const encoded = new TextEncoder().encode(data);
        const keyBytes = new TextEncoder().encode(this.key);
        const result = new Uint8Array(encoded.length);

        for (let i = 0; i < encoded.length; i++) {
            result[i] = encoded[i] ^ keyBytes[i % keyBytes.length];
        }

        return btoa(String.fromCharCode(...result));
    }

    decrypt(data: string): string {
        try {
            const decoded = Uint8Array.from(atob(data), c => c.charCodeAt(0));
            const keyBytes = new TextEncoder().encode(this.key);
            const result = new Uint8Array(decoded.length);

            for (let i = 0; i < decoded.length; i++) {
                result[i] = decoded[i] ^ keyBytes[i % keyBytes.length];
            }

            return new TextDecoder().decode(result);
        } catch {
            return data;
        }
    }
}

const encryption = new SimpleEncryption();

/**
 * MCP Credential Storage
 */
export class MCPCredentialStorage {
    private static instance: MCPCredentialStorage;

    private constructor() { }

    static getInstance(): MCPCredentialStorage {
        if (!MCPCredentialStorage.instance) {
            MCPCredentialStorage.instance = new MCPCredentialStorage();
        }
        return MCPCredentialStorage.instance;
    }

    /**
     * Save server configurations (without sensitive credentials)
     */
    saveServers(servers: MCPServerConfig[]): void {
        // Remove sensitive data before saving
        const sanitizedServers = servers.map(server => ({
            ...server,
            auth: this.sanitizeAuth(server.auth),
        }));

        localStorage.setItem(STORAGE_KEY_SERVERS, JSON.stringify(sanitizedServers));
    }

    /**
     * Load server configurations
     */
    loadServers(): MCPServerConfig[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY_SERVERS);
            if (!data) return [];
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    /**
     * Save credentials separately (encrypted)
     */
    saveCredentials(credentials: MCPStoredCredentials[]): void {
        const encrypted = encryption.encrypt(JSON.stringify(credentials));
        localStorage.setItem(STORAGE_KEY_CREDENTIALS, encrypted);
    }

    /**
     * Load credentials (decrypted)
     */
    loadCredentials(): MCPStoredCredentials[] {
        try {
            const encrypted = localStorage.getItem(STORAGE_KEY_CREDENTIALS);
            if (!encrypted) return [];
            const decrypted = encryption.decrypt(encrypted);
            return JSON.parse(decrypted);
        } catch {
            return [];
        }
    }

    /**
     * Get credentials for a specific server
     */
    getServerCredentials(serverId: string): AuthConfig | null {
        const credentials = this.loadCredentials();
        const found = credentials.find(c => c.serverId === serverId);
        return found?.auth || null;
    }

    /**
     * Save credentials for a specific server
     */
    saveServerCredentials(serverId: string, auth: AuthConfig): void {
        const credentials = this.loadCredentials();
        const existingIndex = credentials.findIndex(c => c.serverId === serverId);

        const newCred: MCPStoredCredentials = {
            serverId,
            auth,
            encryptedAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            credentials[existingIndex] = newCred;
        } else {
            credentials.push(newCred);
        }

        this.saveCredentials(credentials);
    }

    /**
     * Delete credentials for a specific server
     */
    deleteServerCredentials(serverId: string): void {
        const credentials = this.loadCredentials();
        const filtered = credentials.filter(c => c.serverId !== serverId);
        this.saveCredentials(filtered);
    }

    /**
     * Load all data (servers + credentials merged)
     */
    loadAll(): MCPServerStorageData {
        return {
            servers: this.loadServers(),
            credentials: this.loadCredentials(),
            lastSync: new Date().toISOString(),
        };
    }

    /**
     * Get server with credentials merged
     */
    getServerWithCredentials(serverId: string): MCPServerConfig | null {
        const servers = this.loadServers();
        const server = servers.find(s => s.id === serverId);
        if (!server) return null;

        const credentials = this.getServerCredentials(serverId);
        if (credentials) {
            return { ...server, auth: credentials };
        }

        return server;
    }

    /**
     * Clear all stored data
     */
    clearAll(): void {
        localStorage.removeItem(STORAGE_KEY_SERVERS);
        localStorage.removeItem(STORAGE_KEY_CREDENTIALS);
    }

    /**
     * Remove sensitive data from auth config for storage
     */
    private sanitizeAuth(auth: AuthConfig): AuthConfig {
        switch (auth.type) {
            case 'api_key':
                return { type: 'api_key', key: '', headerName: auth.headerName, prefix: auth.prefix };
            case 'oauth2':
                return {
                    ...auth,
                    accessToken: undefined,
                    refreshToken: undefined,
                    clientSecret: undefined,
                };
            case 'bearer_token':
                return { type: 'bearer_token', token: '' };
            case 'basic':
                return { type: 'basic', username: '', password: '' };
            default:
                return auth;
        }
    }
}

// Export singleton instance
export const mcpCredentialStorage = MCPCredentialStorage.getInstance();
