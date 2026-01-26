/**
 * Legacy MCP Types
 * 
 * Re-exports for backwards compatibility with old code
 * @deprecated Use imports from '@/lib/mcp' instead
 */

export {
  type MCPTool,
  type MCPResource,
  type MCPPrompt,
  type MCPConnectionStatus,
  type MCPCallToolResult,
  type MCPListResourcesResult,
  type MCPReadResourceResult,
  type MCPListPromptsResult,
  type MCPGetPromptResult,
  type MCPClientEvent,
  type MCPClientEventListener,
} from './core/types';

// Map old MCPServerConfig to new format for compatibility
import type {
  MCPServerConfig as NewMCPServerConfig,
  StdioTransportConfig,
  HttpTransportConfig,
  SSETransportConfig,
} from './core/types';

/**
 * @deprecated Use the new MCPServerConfig from './core/types'
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

/**
 * Convert legacy config to new format
 */
export function convertLegacyConfig(legacy: MCPServerConfig): NewMCPServerConfig {
  let transport: StdioTransportConfig | HttpTransportConfig | SSETransportConfig;

  if (legacy.transport === 'stdio') {
    transport = {
      type: 'stdio',
      command: legacy.command || '',
      args: legacy.args,
    };
  } else if (legacy.transport === 'http') {
    transport = {
      type: 'http',
      url: legacy.url || '',
      headers: legacy.headers,
    };
  } else {
    transport = {
      type: 'sse',
      url: legacy.url || '',
      headers: legacy.headers,
    };
  }

  return {
    id: legacy.name,
    name: legacy.name,
    transport,
    auth: { type: 'none' },
    env: legacy.env,
    timeout: legacy.timeout,
  };
}
