/**
 * MCP Client Types and Interfaces
 */

import type { 
  Tool,
  Resource,
  Prompt,
  CallToolResult,
  ReadResourceResult,
  GetPromptResult
} from '@modelcontextprotocol/sdk/types.js';

export type { Tool, Resource, Prompt, CallToolResult, ReadResourceResult, GetPromptResult };

export type TransportType = 'stdio' | 'sse' | 'streamable-http';

export interface MCPServerConfig {
  id: string;
  name: string;
  description?: string;
  type: TransportType;
  
  // For stdio (local) servers
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  
  // For SSE/HTTP servers
  url?: string;
  headers?: Record<string, string>;
  
  // Connection settings
  autoConnect?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

export interface MCPConnectionState {
  serverId: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
  connectedAt?: Date;
  lastError?: Error;
}

export interface MCPServerCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  sampling?: boolean;
  logging?: boolean;
  elicitation?: boolean;
}

export interface MCPServerInfo {
  name: string;
  version: string;
  capabilities: MCPServerCapabilities;
  protocolVersion: string;
}

export interface ToolCallParams {
  serverId: string;
  name: string;
  arguments?: Record<string, unknown>;
}

export interface ResourceReadParams {
  serverId: string;
  uri: string;
}

export interface PromptGetParams {
  serverId: string;
  name: string;
  arguments?: Record<string, unknown>;
}

export interface MCPClientEvents {
  'connection:status': (serverId: string, state: MCPConnectionState) => void;
  'connection:error': (serverId: string, error: Error) => void;
  'tools:updated': (serverId: string, tools: Tool[]) => void;
  'resources:updated': (serverId: string, resources: Resource[]) => void;
  'prompts:updated': (serverId: string, prompts: Prompt[]) => void;
  'server:notification': (serverId: string, notification: any) => void;
}

export type EventListener<T extends keyof MCPClientEvents> = MCPClientEvents[T];


