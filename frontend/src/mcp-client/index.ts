/**
 * MCP Client - Main export file
 * 
 * A comprehensive MCP (Model Context Protocol) client for connecting to
 * both local (stdio) and online (SSE/StreamableHTTP) MCP servers.
 * 
 * @example Basic Usage
 * ```tsx
 * import { useMCPClient } from '@/mcp-client';
 * 
 * function MyComponent() {
 *   const mcp = useMCPClient();
 *   
 *   // Add a server
 *   mcp.addServer({
 *     id: 'my-server',
 *     name: 'My MCP Server',
 *     type: 'stdio',
 *     command: 'node',
 *     args: ['server.js'],
 *     autoConnect: true
 *   });
 *   
 *   // Get tools
 *   const tools = await mcp.getAllTools();
 *   
 *   // Call a tool
 *   const result = await mcp.callTool({
 *     serverId: 'my-server',
 *     name: 'my-tool',
 *     arguments: { arg1: 'value' }
 *   });
 * }
 * ```
 * 
 * @example Single Server Hook
 * ```tsx
 * import { useMCPServer } from '@/mcp-client';
 * 
 * function ServerComponent() {
 *   const server = useMCPServer({
 *     serverId: 'my-server',
 *     autoRefresh: true
 *   });
 *   
 *   if (!server.isConnected) {
 *     await server.connect();
 *   }
 *   
 *   // Use tools
 *   const result = await server.callTool('my-tool', { arg: 'value' });
 * }
 * ```
 */

// Main client
export { MCPClient, mcpClient } from './mcp-client';

// Hooks
export { useMCPClient } from './hooks/useMCPClient';
export { useMCPServer } from './hooks/useMCPServer';

// Types
export type {
  MCPServerConfig,
  MCPConnectionState,
  MCPServerInfo,
  MCPServerCapabilities,
  ToolCallParams,
  ResourceReadParams,
  PromptGetParams,
  TransportType,
  Tool,
  Resource,
  Prompt,
  CallToolResult,
  ReadResourceResult,
  GetPromptResult,
  MCPClientEvents,
  EventListener
} from './types';

// Transports (for advanced usage)
export { ElectronStdioTransport } from './transport/electron-stdio-transport';
export { SSETransport, StreamableHTTPTransport } from './transport/http-transport';


