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
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export interface MCPServerConfig {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly type: TransportType;
  
  // For stdio (local) servers
  readonly command?: string;
  readonly args?: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
  
  // For SSE/HTTP servers
  readonly url?: string;
  readonly headers?: Readonly<Record<string, string>>;
  
  // Connection settings
  readonly autoConnect?: boolean;
  readonly retryOnFailure?: boolean;
  readonly maxRetries?: number;
  readonly retryDelay?: number; // ms between retries
}

export interface MCPConnectionState {
  readonly serverId: string;
  readonly status: ConnectionStatus;
  readonly error?: string;
  readonly connectedAt?: Date;
  readonly lastError?: Error;
  readonly retryCount?: number;
}

export interface MCPServerCapabilities {
  readonly tools?: boolean;
  readonly resources?: boolean;
  readonly prompts?: boolean;
  readonly sampling?: boolean;
  readonly logging?: boolean;
  readonly elicitation?: boolean;
}

export interface MCPServerInfo {
  readonly name: string;
  readonly version: string;
  readonly capabilities: MCPServerCapabilities;
  readonly protocolVersion: string;
}

export interface ToolCallParams {
  readonly serverId: string;
  readonly name: string;
  readonly arguments?: Readonly<Record<string, unknown>>;
}

export interface ResourceReadParams {
  readonly serverId: string;
  readonly uri: string;
}

export interface PromptGetParams {
  readonly serverId: string;
  readonly name: string;
  readonly arguments?: Readonly<Record<string, unknown>>;
}

export interface MCPClientEvents {
  'connection:status': (serverId: string, state: MCPConnectionState) => void;
  'connection:error': (serverId: string, error: Error) => void;
  'tools:updated': (serverId: string, tools: readonly Tool[]) => void;
  'resources:updated': (serverId: string, resources: readonly Resource[]) => void;
  'prompts:updated': (serverId: string, prompts: readonly Prompt[]) => void;
}

export type EventListener<T extends keyof MCPClientEvents> = MCPClientEvents[T];

// Transport interface for better abstraction
export interface MCPTransport {
  start(): Promise<void>;
  send(message: unknown): Promise<void>;
  close(): Promise<void>;
  isConnected(): boolean;
  on(event: string, listener: (...args: unknown[]) => void): void;
  off(event: string, listener: (...args: unknown[]) => void): void;
  removeAllListeners(): void;
}


