/**
 * Basic Auth Provider
 * 
 * HTTP Basic Authentication for MCP servers
 */

import type { BasicAuthConfig } from '../core/types';
import { BaseAuthProvider } from './base';

export class BasicAuthProvider extends BaseAuthProvider {
    private basicConfig: BasicAuthConfig;

    constructor(config: BasicAuthConfig) {
        super(config);
        this.basicConfig = config;
    }

    get type(): string {
        return 'basic';
    }

    isConfigured(): boolean {
        return Boolean(this.basicConfig.username && this.basicConfig.password);
    }

    async getHeaders(): Promise<Record<string, string>> {
        if (!this.basicConfig.username || !this.basicConfig.password) {
            return {};
        }

        const credentials = btoa(`${this.basicConfig.username}:${this.basicConfig.password}`);
        return {
            'Authorization': `Basic ${credentials}`,
        };
    }

    async getEnv(): Promise<Record<string, string>> {
        return {
            BASIC_AUTH_USERNAME: this.basicConfig.username || '',
            BASIC_AUTH_PASSWORD: this.basicConfig.password || '',
        };
    }

    async validate(): Promise<boolean> {
        return Boolean(this.basicConfig.username && this.basicConfig.password);
    }

    setCredentials(username: string, password: string): void {
        this.basicConfig.username = username;
        this.basicConfig.password = password;
    }
}
