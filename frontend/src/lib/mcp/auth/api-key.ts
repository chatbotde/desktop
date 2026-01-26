/**
 * API Key Auth Provider
 * 
 * Simple API key authentication for MCP servers
 */

import type { ApiKeyAuthConfig } from '../core/types';
import { BaseAuthProvider } from './base';

export class ApiKeyAuthProvider extends BaseAuthProvider {
    private apiKeyConfig: ApiKeyAuthConfig;

    constructor(config: ApiKeyAuthConfig) {
        super(config);
        this.apiKeyConfig = config;
    }

    get type(): string {
        return 'api_key';
    }

    isConfigured(): boolean {
        return Boolean(this.apiKeyConfig.key);
    }

    async getHeaders(): Promise<Record<string, string>> {
        if (!this.apiKeyConfig.key) {
            return {};
        }

        const headerName = this.apiKeyConfig.headerName || 'Authorization';
        const prefix = this.apiKeyConfig.prefix || 'Bearer';

        return {
            [headerName]: `${prefix} ${this.apiKeyConfig.key}`,
        };
    }

    async getEnv(): Promise<Record<string, string>> {
        // For stdio transport, the API key is passed via environment variables
        // This will be populated based on the server requirements
        return {};
    }

    async validate(): Promise<boolean> {
        return Boolean(this.apiKeyConfig.key && this.apiKeyConfig.key.length > 0);
    }

    setApiKey(key: string): void {
        this.apiKeyConfig.key = key;
    }

    getApiKey(): string {
        return this.apiKeyConfig.key;
    }
}
