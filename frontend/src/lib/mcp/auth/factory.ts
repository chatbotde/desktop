/**
 * Auth Factory
 * 
 * Create authentication providers based on config type
 */

import type { AuthConfig, AuthType } from '../core/types';
import type { AuthProvider } from './base';
import { ApiKeyAuthProvider } from './api-key';
import { OAuth2AuthProvider } from './oauth2';
import { BearerTokenAuthProvider } from './bearer-token';
import { BasicAuthProvider } from './basic';

/**
 * No-op auth provider for servers that don't need authentication
 */
class NoAuthProvider implements AuthProvider {
    type = 'none';

    isConfigured(): boolean {
        return true;
    }

    async getHeaders(): Promise<Record<string, string>> {
        return {};
    }

    async getEnv(): Promise<Record<string, string>> {
        return {};
    }

    async validate(): Promise<boolean> {
        return true;
    }
}

/**
 * Create an auth provider based on the config type
 */
export function createAuthProvider(config: AuthConfig): AuthProvider {
    switch (config.type) {
        case 'none':
            return new NoAuthProvider();
        case 'api_key':
            return new ApiKeyAuthProvider(config);
        case 'oauth2':
            return new OAuth2AuthProvider(config);
        case 'bearer_token':
            return new BearerTokenAuthProvider(config);
        case 'basic':
            return new BasicAuthProvider(config);
        default:
            throw new Error(`Unknown auth type: ${(config as AuthConfig).type}`);
    }
}

/**
 * Get required fields for an auth type
 */
export function getRequiredAuthFields(authType: AuthType): string[] {
    switch (authType) {
        case 'none':
            return [];
        case 'api_key':
            return ['key'];
        case 'oauth2':
            return ['clientId', 'authorizationUrl', 'tokenUrl', 'scopes', 'redirectUri'];
        case 'bearer_token':
            return ['token'];
        case 'basic':
            return ['username', 'password'];
        default:
            return [];
    }
}
