/**
 * MCP Server Factory
 * 
 * Helper functions to create server configurations from templates
 */

import type { MCPServerConfig, AuthConfig } from '../core/types';
import { MCP_SERVER_TEMPLATES, type MCPServerTemplateId } from '../core/constants';
import { mcpServerConfigStorage } from '../storage/servers';

// Type helper to access template with oauthConfig
type TemplateWithOAuth = typeof MCP_SERVER_TEMPLATES.gdrive;

/**
 * Create a server config from a template
 */
export function createServerFromTemplate(
    templateId: MCPServerTemplateId,
    options: {
        env?: Record<string, string>;
        path?: string;
        apiKey?: string;
        customId?: string;
        customName?: string;
    } = {}
): MCPServerConfig {
    const template = MCP_SERVER_TEMPLATES[templateId];
    if (!template) {
        throw new Error(`Unknown template: ${templateId}`);
    }

    // Generate unique ID
    const id = options.customId || mcpServerConfigStorage.generateServerId(template.id);

    // Build auth config
    let auth: AuthConfig;
    if (template.auth.type === 'api_key' && options.apiKey) {
        auth = {
            type: 'api_key',
            key: options.apiKey,
        };
    } else if (template.auth.type === 'oauth2' && 'oauthConfig' in template) {
        const oauthTemplate = template as TemplateWithOAuth;
        auth = {
            type: 'oauth2',
            clientId: '',
            authorizationUrl: oauthTemplate.oauthConfig.authorizationUrl,
            tokenUrl: oauthTemplate.oauthConfig.tokenUrl,
            scopes: [...oauthTemplate.oauthConfig.scopes],
            redirectUri: 'http://localhost:3000/oauth/callback',
        };
    } else {
        auth = { type: 'none' };
    }

    // Build transport args - spread to convert readonly to mutable
    const transportArgs: string[] = [...template.transport.args];

    // Add path if required (e.g., filesystem server)
    if ('requiresPath' in template && template.requiresPath && options.path) {
        transportArgs.push(options.path);
    }

    return {
        id,
        name: options.customName || template.name,
        description: template.description,
        icon: template.icon,
        category: template.category,
        transport: {
            type: 'stdio',
            command: template.transport.command,
            args: transportArgs,
        },
        auth,
        env: options.env || {},
        enabled: true,
        autoConnect: false,
    };
}

/**
 * Get required environment variables for a template
 */
export function getRequiredEnvVars(templateId: MCPServerTemplateId): string[] {
    const template = MCP_SERVER_TEMPLATES[templateId];
    if (!template) return [];
    if ('requiredEnvVars' in template) {
        return [...(template as { requiredEnvVars: readonly string[] }).requiredEnvVars];
    }
    return [];
}

/**
 * Check if a template requires OAuth
 */
export function requiresOAuth(templateId: MCPServerTemplateId): boolean {
    const template = MCP_SERVER_TEMPLATES[templateId];
    return template?.auth.type === 'oauth2';
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): typeof MCP_SERVER_TEMPLATES {
    return MCP_SERVER_TEMPLATES;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): Array<{ id: MCPServerTemplateId; template: typeof MCP_SERVER_TEMPLATES[MCPServerTemplateId] }> {
    return Object.entries(MCP_SERVER_TEMPLATES)
        .filter(([_, template]) => template.category === category)
        .map(([id, template]) => ({ id: id as MCPServerTemplateId, template }));
}

/**
 * Quick connect to a server using template
 */
export async function quickConnect(
    templateId: MCPServerTemplateId,
    env: Record<string, string> = {},
    options: { path?: string } = {}
): Promise<MCPServerConfig> {
    const config = createServerFromTemplate(templateId, {
        env,
        path: options.path,
    });

    // Save to storage
    mcpServerConfigStorage.addServer(config);

    return config;
}
