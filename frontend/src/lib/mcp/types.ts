/**
 * MCP Client Types
 * 
 * Type definitions for Model Context Protocol client
 */

export interface MCPServerConfig {
  /** Server name/identifier */
  name: string;
  /** Server URL (for HTTP transport) */
  url?: string;
  /** Command to run (for stdio transport) */
  command?: string;
  /** Command arguments (for stdio transport) */
  args?: string[];
  /** Environment variables for stdio transport */
  env?: Record<string, string>;
  /** Transport type */
  transport: 'stdio' | 'http' | 'sse';
  /** Authentication headers (for HTTP/SSE) */
  headers?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPConnectionStatus {
  connected: boolean;
  serverName?: string;
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
  error?: string;
}

export interface MCPCallToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

export interface MCPListResourcesResult {
  resources: MCPResource[];
}

export interface MCPReadResourceResult {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

export interface MCPListPromptsResult {
  prompts: MCPPrompt[];
}

export interface MCPGetPromptResult {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export type MCPClientEvent = 
  | { type: 'connected'; serverName: string }
  | { type: 'disconnected'; reason?: string }
  | { type: 'error'; error: Error }
  | { type: 'tool-call'; toolName: string; result: MCPCallToolResult };

export type MCPClientEventListener = (event: MCPClientEvent) => void;

