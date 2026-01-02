/**
 * MCP (Model Context Protocol) Client Module
 * 
 * Provides client functionality to connect to MCP servers and interact with
 * tools, resources, and prompts.
 * 
 * @example
 * ```typescript
 * import { mcpService } from '@/lib/mcp';
 * 
 * // Connect to an MCP server
 * const client = await mcpService.connect({
 *   name: 'my-server',
 *   transport: 'stdio',
 *   command: 'npx',
 *   args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/directory'],
 * });
 * 
 * // List available tools
 * const tools = await client.listTools();
 * 
 * // Call a tool
 * const result = await client.callTool('read_file', { path: '/path/to/file.txt' });
 * 
 * // Disconnect
 * await mcpService.disconnect('my-server');
 * ```
 */

// Export types
export type {
  MCPServerConfig,
  MCPConnectionStatus,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPCallToolResult,
  MCPListResourcesResult,
  MCPReadResourceResult,
  MCPListPromptsResult,
  MCPGetPromptResult,
  MCPClientEvent,
  MCPClientEventListener,
} from './types';

// Export client
export { MCPClient } from './client';

// Export service
export { MCPService, mcpService } from './service';

