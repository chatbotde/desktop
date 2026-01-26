/**
 * Notion OAuth Provider
 * 
 * OAuth 2.0 authentication specifically for Notion's public integrations.
 * Supports multi-user authentication where each user connects their own workspace.
 * 
 * Notion OAuth Flow:
 * 1. User clicks "Connect to Notion"
 * 2. Redirect to Notion authorization URL
 * 3. User grants access in Notion
 * 4. Notion redirects back with authorization code
 * 5. Exchange code for access token
 * 6. Store token securely
 */

import { OAuth2AuthProvider, type OAuth2TokenResponse } from './oauth2';
import type { OAuth2Config } from '../core/types';

// Notion OAuth endpoints
export const NOTION_OAUTH_CONFIG = {
    authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    // Notion requires 'owner=user' for user-based OAuth
    ownerType: 'user' as const,
};

export interface NotionOAuthConfig extends Omit<OAuth2Config, 'authorizationUrl' | 'tokenUrl'> {
    type: 'oauth2';
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes?: string[]; // Notion doesn't use scopes in the same way
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    // Notion-specific
    workspaceId?: string;
    workspaceName?: string;
    workspaceIcon?: string;
    botId?: string;
}

export interface NotionTokenResponse extends OAuth2TokenResponse {
    workspace_id: string;
    workspace_name?: string;
    workspace_icon?: string;
    bot_id: string;
    owner: {
        type: 'user' | 'workspace';
        user?: {
            id: string;
            name?: string;
            avatar_url?: string;
            type: string;
            person?: { email: string };
        };
    };
    duplicated_template_id?: string | null;
    request_id?: string;
}

export class NotionOAuthProvider extends OAuth2AuthProvider {
    private notionConfig: NotionOAuthConfig;

    constructor(config: Omit<NotionOAuthConfig, 'authorizationUrl' | 'tokenUrl' | 'scopes'>) {
        // Build the full OAuth2Config for the parent class
        const fullConfig: OAuth2Config = {
            ...config,
            authorizationUrl: NOTION_OAUTH_CONFIG.authorizationUrl,
            tokenUrl: NOTION_OAUTH_CONFIG.tokenUrl,
            scopes: [], // Notion doesn't use scopes
        };
        super(fullConfig);
        this.notionConfig = {
            ...config,
            authorizationUrl: NOTION_OAUTH_CONFIG.authorizationUrl,
            tokenUrl: NOTION_OAUTH_CONFIG.tokenUrl,
            scopes: [],
        };
    }

    /**
     * Generate Notion-specific authorization URL
     * Notion requires owner=user parameter
     */
    override generateAuthorizationUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.notionConfig.clientId,
            redirect_uri: this.notionConfig.redirectUri,
            response_type: 'code',
            owner: NOTION_OAUTH_CONFIG.ownerType,
        });

        if (state) {
            params.set('state', state);
        }

        return `${NOTION_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for Notion tokens
     * Notion uses Basic Auth with client_id:client_secret
     */
    override async handleOAuthCallback(code: string, _state?: string): Promise<void> {
        // Notion requires Basic Auth for token exchange
        const basicAuth = btoa(`${this.notionConfig.clientId}:${this.notionConfig.clientSecret}`);

        const response = await fetch(NOTION_OAUTH_CONFIG.tokenUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: this.notionConfig.redirectUri,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Notion OAuth error:', errorText);
            throw new Error(`Notion OAuth token exchange failed: ${response.statusText}`);
        }

        const tokens: NotionTokenResponse = await response.json();
        this.setNotionTokens(tokens);
    }

    /**
     * Set tokens from Notion response
     */
    private setNotionTokens(tokens: NotionTokenResponse): void {
        this.notionConfig.accessToken = tokens.access_token;
        this.notionConfig.workspaceId = tokens.workspace_id;
        this.notionConfig.workspaceName = tokens.workspace_name;
        this.notionConfig.workspaceIcon = tokens.workspace_icon;
        this.notionConfig.botId = tokens.bot_id;

        // Notion tokens don't expire by default, but we can set a long expiry
        // or handle refresh if Notion adds support in the future
        if (tokens.expires_in) {
            this.notionConfig.expiresAt = Date.now() + (tokens.expires_in * 1000);
        }

        // Call parent to set the access token
        this.setAccessToken(tokens.access_token, this.notionConfig.expiresAt);
    }

    /**
     * Get Notion-specific workspace info
     */
    getWorkspaceInfo(): {
        workspaceId?: string;
        workspaceName?: string;
        workspaceIcon?: string;
        botId?: string;
    } {
        return {
            workspaceId: this.notionConfig.workspaceId,
            workspaceName: this.notionConfig.workspaceName,
            workspaceIcon: this.notionConfig.workspaceIcon,
            botId: this.notionConfig.botId,
        };
    }

    /**
     * Get the full config (for storage)
     */
    getNotionConfig(): NotionOAuthConfig {
        return { ...this.notionConfig };
    }

    /**
     * Check if connected to a workspace
     */
    isConnected(): boolean {
        return Boolean(this.notionConfig.accessToken && this.notionConfig.workspaceId);
    }

    /**
     * Override getEnv to provide Notion-specific env vars
     */
    override async getEnv(): Promise<Record<string, string>> {
        if (!this.notionConfig.accessToken) {
            return {};
        }

        return {
            NOTION_API_KEY: this.notionConfig.accessToken,
            NOTION_ACCESS_TOKEN: this.notionConfig.accessToken,
            NOTION_WORKSPACE_ID: this.notionConfig.workspaceId || '',
        };
    }
}

/**
 * Create a Notion OAuth provider from stored config
 */
export function createNotionOAuthProvider(config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    accessToken?: string;
    workspaceId?: string;
    workspaceName?: string;
}): NotionOAuthProvider {
    return new NotionOAuthProvider({
        type: 'oauth2',
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: config.redirectUri,
        accessToken: config.accessToken,
        workspaceId: config.workspaceId,
        workspaceName: config.workspaceName,
    });
}
