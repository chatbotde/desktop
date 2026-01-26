/**
 * MCP - Model Context Protocol Client Library
 * 
 * A comprehensive MCP client implementation supporting:
 * - Multiple transport types (stdio, SSE, WebSocket, HTTP)
 * - Multiple authentication methods (API key, OAuth2, Bearer token, Basic)
 * - Secure credential storage
 * - Multiple server management
 * - Server templates for easy setup
 * 
 * @example
 * ```typescript
 * import { mcpClientManager, createServerFromTemplate } from '@/lib/mcp';
 * 
 * // Create a server from template
 * const config = createServerFromTemplate('filesystem', {
 *   path: '/path/to/directory',
 * });
 * 
 * // Connect to the server
 * const client = await mcpClientManager.connect(config);
 * 
 * // List tools
 * const tools = await client.listTools();
 * 
 * // Call a tool
 * const result = await client.callTool('read_file', { path: '/file.txt' });
 * ```
 */

// Core types and constants
export * from './core/types';
export * from './core/constants';

// Transports
export * from './transports';

// Authentication
export * from './auth';

// Storage
export * from './storage';

// Clients
export * from './clients';

// Utilities
export * from './utils';

// Convenience re-exports for common usage
export { mcpClientManager } from './clients/manager';
export { mcpCredentialStorage } from './storage/credentials';
export { mcpServerConfigStorage } from './storage/servers';
export { createServerFromTemplate, getAvailableTemplates } from './utils/server-factory';
export { MCP_SERVER_TEMPLATES } from './core/constants';
