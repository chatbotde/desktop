/**
 * Base Auth Provider
 * 
 * Interface for all authentication providers
 */

import type { AuthConfig } from '../core/types';

export interface AuthResult {
    success: boolean;
    headers?: Record<string, string>;
    env?: Record<string, string>;
    error?: string;
}

export interface AuthProvider {
    /** Authentication type */
    type: string;

    /** Check if authentication is configured */
    isConfigured(): boolean;

    /** Get headers for HTTP requests */
    getHeaders(): Promise<Record<string, string>>;

    /** Get environment variables for stdio transport */
    getEnv(): Promise<Record<string, string>>;

    /** Validate credentials */
    validate(): Promise<boolean>;

    /** Refresh token if needed */
    refresh?(): Promise<void>;

    /** Initiate OAuth flow if applicable */
    initiateOAuth?(): Promise<string>;

    /** Handle OAuth callback if applicable */
    handleOAuthCallback?(code: string, state?: string): Promise<void>;
}

export abstract class BaseAuthProvider implements AuthProvider {
    protected config: AuthConfig;

    constructor(config: AuthConfig) {
        this.config = config;
    }

    abstract get type(): string;
    abstract isConfigured(): boolean;
    abstract getHeaders(): Promise<Record<string, string>>;
    abstract getEnv(): Promise<Record<string, string>>;
    abstract validate(): Promise<boolean>;
}
