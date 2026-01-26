/**
 * Bearer Token Auth Provider
 * 
 * Simple bearer token authentication
 */

import type { BearerTokenConfig } from '../core/types';
import { BaseAuthProvider } from './base';

export class BearerTokenAuthProvider extends BaseAuthProvider {
    private tokenConfig: BearerTokenConfig;

    constructor(config: BearerTokenConfig) {
        super(config);
        this.tokenConfig = config;
    }

    get type(): string {
        return 'bearer_token';
    }

    isConfigured(): boolean {
        return Boolean(this.tokenConfig.token);
    }

    async getHeaders(): Promise<Record<string, string>> {
        if (!this.tokenConfig.token) {
            return {};
        }

        return {
            'Authorization': `Bearer ${this.tokenConfig.token}`,
        };
    }

    async getEnv(): Promise<Record<string, string>> {
        if (!this.tokenConfig.token) {
            return {};
        }

        return {
            BEARER_TOKEN: this.tokenConfig.token,
        };
    }

    async validate(): Promise<boolean> {
        return Boolean(this.tokenConfig.token && this.tokenConfig.token.length > 0);
    }

    setToken(token: string): void {
        this.tokenConfig.token = token;
    }

    getToken(): string {
        return this.tokenConfig.token;
    }
}
