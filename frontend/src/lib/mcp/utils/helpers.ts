/**
 * MCP Utility Functions
 * 
 * General utility functions for MCP operations
 */

import type { MCPTool, MCPServerConfig, MCPCallToolResult } from '../core/types';

/**
 * Format a tool for display
 */
export function formatTool(tool: MCPTool): string {
    let output = `**${tool.name}**`;
    if (tool.description) {
        output += `\n${tool.description}`;
    }
    if (tool.inputSchema?.properties) {
        output += '\n\nParameters:';
        for (const [key, value] of Object.entries(tool.inputSchema.properties)) {
            const required = tool.inputSchema.required?.includes(key) ? ' (required)' : '';
            output += `\n- ${key}: ${(value as any).type || 'any'}${required}`;
        }
    }
    return output;
}

/**
 * Format tool result for display
 */
export function formatToolResult(result: MCPCallToolResult): string {
    if (result.isError) {
        return `Error: ${result.content.map(c => c.text || '').join('\n')}`;
    }

    return result.content.map(item => {
        switch (item.type) {
            case 'text':
                return item.text || '';
            case 'image':
                return `[Image: ${item.mimeType || 'unknown'}]`;
            case 'resource':
                return `[Resource: ${item.uri}]`;
            default:
                return String(item);
        }
    }).join('\n');
}

/**
 * Validate server configuration
 */
export function validateServerConfig(config: Partial<MCPServerConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.id) {
        errors.push('Server ID is required');
    }

    if (!config.name) {
        errors.push('Server name is required');
    }

    if (!config.transport) {
        errors.push('Transport configuration is required');
    } else {
        switch (config.transport.type) {
            case 'stdio':
                if (!config.transport.command) {
                    errors.push('Command is required for stdio transport');
                }
                break;
            case 'sse':
            case 'http':
            case 'websocket':
                if (!config.transport.url) {
                    errors.push('URL is required for network transport');
                }
                break;
        }
    }

    if (!config.auth) {
        errors.push('Auth configuration is required');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Generate tool call signature
 */
export function generateToolSignature(tool: MCPTool): string {
    const params = tool.inputSchema?.properties
        ? Object.entries(tool.inputSchema.properties).map(([key, value]) => {
            const required = tool.inputSchema.required?.includes(key);
            return `${key}${required ? '' : '?'}: ${(value as any).type || 'any'}`;
        })
        : [];

    return `${tool.name}(${params.join(', ')})`;
}

/**
 * Parse environment variables from string (KEY=VALUE format)
 */
export function parseEnvString(envString: string): Record<string, string> {
    const env: Record<string, string> = {};
    const lines = envString.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex).trim();
            let value = trimmed.substring(eqIndex + 1).trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            env[key] = value;
        }
    }

    return env;
}

/**
 * Format environment variables to string
 */
export function formatEnvString(env: Record<string, string>): string {
    return Object.entries(env)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key of Object.keys(source)) {
        const sourceValue = source[key as keyof T];
        const targetValue = target[key as keyof T];

        if (sourceValue !== undefined) {
            if (
                typeof sourceValue === 'object' &&
                sourceValue !== null &&
                !Array.isArray(sourceValue) &&
                typeof targetValue === 'object' &&
                targetValue !== null &&
                !Array.isArray(targetValue)
            ) {
                (result as any)[key] = deepMerge(targetValue, sourceValue);
            } else {
                (result as any)[key] = sourceValue;
            }
        }
    }

    return result;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
