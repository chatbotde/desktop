/**
 * OAuth2 Auth Provider
 * 
 * OAuth 2.0 authentication for MCP servers like Google, Slack, etc.
 */

import type { OAuth2Config } from '../core/types';
import { BaseAuthProvider } from './base';

export interface OAuth2TokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
}

export class OAuth2AuthProvider extends BaseAuthProvider {
    private oauthConfig: OAuth2Config;

    constructor(config: OAuth2Config) {
        super(config);
        this.oauthConfig = config;
    }

    get type(): string {
        return 'oauth2';
    }

    isConfigured(): boolean {
        return Boolean(this.oauthConfig.accessToken);
    }

    async getHeaders(): Promise<Record<string, string>> {
        if (!this.oauthConfig.accessToken) {
            return {};
        }

        // Check if token is expired
        if (this.isExpired() && this.oauthConfig.refreshToken) {
            await this.refresh();
        }

        return {
            'Authorization': `Bearer ${this.oauthConfig.accessToken}`,
        };
    }

    async getEnv(): Promise<Record<string, string>> {
        if (!this.oauthConfig.accessToken) {
            return {};
        }

        return {
            OAUTH_ACCESS_TOKEN: this.oauthConfig.accessToken,
            OAUTH_REFRESH_TOKEN: this.oauthConfig.refreshToken || '',
        };
    }

    async validate(): Promise<boolean> {
        return Boolean(this.oauthConfig.accessToken) && !this.isExpired();
    }

    /**
     * Check if the access token is expired
     */
    isExpired(): boolean {
        if (!this.oauthConfig.expiresAt) {
            return false;
        }
        // Add 5 minute buffer
        return Date.now() >= (this.oauthConfig.expiresAt - 5 * 60 * 1000);
    }

    /**
     * Generate the authorization URL for the OAuth flow
     */
    generateAuthorizationUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.oauthConfig.clientId,
            redirect_uri: this.oauthConfig.redirectUri,
            response_type: 'code',
            scope: this.oauthConfig.scopes.join(' '),
        });

        if (state) {
            params.set('state', state);
        }

        return `${this.oauthConfig.authorizationUrl}?${params.toString()}`;
    }

    /**
     * Initiate the OAuth flow - returns the authorization URL
     */
    async initiateOAuth(): Promise<string> {
        const state = this.generateState();
        return this.generateAuthorizationUrl(state);
    }

    /**
     * Exchange authorization code for tokens
     */
    async handleOAuthCallback(code: string, _state?: string): Promise<void> {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.oauthConfig.redirectUri,
            client_id: this.oauthConfig.clientId,
        });

        if (this.oauthConfig.clientSecret) {
            params.set('client_secret', this.oauthConfig.clientSecret);
        }

        const response = await fetch(this.oauthConfig.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            throw new Error(`OAuth token exchange failed: ${response.statusText}`);
        }

        const tokens: OAuth2TokenResponse = await response.json();
        this.setTokens(tokens);
    }

    /**
     * Refresh the access token
     */
    async refresh(): Promise<void> {
        if (!this.oauthConfig.refreshToken) {
            throw new Error('No refresh token available');
        }

        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.oauthConfig.refreshToken,
            client_id: this.oauthConfig.clientId,
        });

        if (this.oauthConfig.clientSecret) {
            params.set('client_secret', this.oauthConfig.clientSecret);
        }

        const response = await fetch(this.oauthConfig.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            throw new Error(`OAuth token refresh failed: ${response.statusText}`);
        }

        const tokens: OAuth2TokenResponse = await response.json();
        this.setTokens(tokens);
    }

    /**
     * Set tokens from response
     */
    private setTokens(tokens: OAuth2TokenResponse): void {
        this.oauthConfig.accessToken = tokens.access_token;

        if (tokens.refresh_token) {
            this.oauthConfig.refreshToken = tokens.refresh_token;
        }

        if (tokens.expires_in) {
            this.oauthConfig.expiresAt = Date.now() + (tokens.expires_in * 1000);
        }
    }

    /**
     * Generate a random state for CSRF protection
     */
    private generateState(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get current tokens
     */
    getTokens(): { accessToken?: string; refreshToken?: string; expiresAt?: number } {
        return {
            accessToken: this.oauthConfig.accessToken,
            refreshToken: this.oauthConfig.refreshToken,
            expiresAt: this.oauthConfig.expiresAt,
        };
    }

    /**
     * Manually set tokens
     */
    setAccessToken(accessToken: string, expiresAt?: number): void {
        this.oauthConfig.accessToken = accessToken;
        if (expiresAt) {
            this.oauthConfig.expiresAt = expiresAt;
        }
    }

    setRefreshToken(refreshToken: string): void {
        this.oauthConfig.refreshToken = refreshToken;
    }
}
