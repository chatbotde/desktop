/**
 * MCP Core Types
 * 
 * Core type definitions for Model Context Protocol client
 * Supports multiple transports, authentication methods, and server configurations
 */

// ============================================================================
// Transport Types
// ============================================================================

export type TransportType = 'stdio' | 'http' | 'sse' | 'websocket';

export interface StdioTransportConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  cwd?: string;
}

export interface HttpTransportConfig {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

export interface SSETransportConfig {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
}

export interface WebSocketTransportConfig {
  type: 'websocket';
  url: string;
  protocols?: string[];
  headers?: Record<string, string>;
}

export type TransportConfig = 
  | StdioTransportConfig 
  | HttpTransportConfig 
  | SSETransportConfig 
  | WebSocketTransportConfig;

// ============================================================================
// Authentication Types
// ============================================================================

export type AuthType = 'none' | 'api_key' | 'oauth2' | 'bearer_token' | 'basic';

export interface NoAuthConfig {
  type: 'none';
}

export interface ApiKeyAuthConfig {
  type: 'api_key';
  key: string;
  headerName?: string; // Default: 'Authorization'
  prefix?: string; // Default: 'Bearer'
}

export interface OAuth2Config {
  type: 'oauth2';
  clientId: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface BearerTokenConfig {
  type: 'bearer_token';
  token: string;
}

export interface BasicAuthConfig {
  type: 'basic';
  username: string;
  password: string;
}

export type AuthConfig = 
  | NoAuthConfig 
  | ApiKeyAuthConfig 
  | OAuth2Config 
  | BearerTokenConfig 
  | BasicAuthConfig;

// ============================================================================
// Server Configuration
// ============================================================================

export interface MCPServerConfig {
  /** Unique identifier for the server */
  id: string;
  /** Display name */
  name: string;
  /** Description of what this server does */
  description?: string;
  /** Icon URL or emoji */
  icon?: string;
  /** Server category for grouping */
  category?: MCPServerCategory;
  /** Transport configuration */
  transport: TransportConfig;
  /** Authentication configuration */
  auth: AuthConfig;
  /** Environment variables to pass to stdio transport */
  env?: Record<string, string>;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Auto-connect on app start */
  autoConnect?: boolean;
  /** Whether this server is enabled */
  enabled?: boolean;
  /** Server-specific metadata */
  metadata?: Record<string, any>;
  /** Created timestamp */
  createdAt?: string;
  /** Last updated timestamp */
  updatedAt?: string;
}

export type MCPServerCategory = 
  | 'productivity'    // Notion, Google Docs, etc.
  | 'communication'   // Slack, Discord, Email
  | 'development'     // GitHub, GitLab, etc.
  | 'storage'         // Google Drive, Dropbox, etc.
  | 'database'        // PostgreSQL, MongoDB, etc.
  | 'search'          // Brave Search, Google, etc.
  | 'ai'              // AI services
  | 'filesystem'      // Local file access
  | 'custom';         // User-defined

// ============================================================================
// Connection Status
// ============================================================================

export interface MCPConnectionStatus {
  connected: boolean;
  connecting?: boolean;
  serverId: string;
  serverName?: string;
  capabilities?: MCPServerCapabilities;
  error?: string;
  lastConnected?: string;
  reconnectAttempts?: number;
}

export interface MCPServerCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  sampling?: boolean;
  roots?: boolean;
}

// ============================================================================
// Tools, Resources, Prompts
// ============================================================================

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  serverId?: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  serverId?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
  serverId?: string;
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

// ============================================================================
// Operation Results
// ============================================================================

export interface MCPCallToolResult {
  content: MCPContentItem[];
  isError?: boolean;
}

export interface MCPContentItem {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
  uri?: string;
}

export interface MCPListResourcesResult {
  resources: MCPResource[];
  nextCursor?: string;
}

export interface MCPReadResourceResult {
  contents: MCPResourceContent[];
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export interface MCPListPromptsResult {
  prompts: MCPPrompt[];
}

export interface MCPGetPromptResult {
  messages: MCPPromptMessage[];
}

export interface MCPPromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ============================================================================
// Events
// ============================================================================

export type MCPClientEvent = 
  | { type: 'connecting'; serverId: string }
  | { type: 'connected'; serverId: string; serverName: string }
  | { type: 'disconnected'; serverId: string; reason?: string }
  | { type: 'error'; serverId: string; error: Error }
  | { type: 'reconnecting'; serverId: string; attempt: number }
  | { type: 'tool-call'; serverId: string; toolName: string; result: MCPCallToolResult }
  | { type: 'auth-required'; serverId: string; authType: AuthType }
  | { type: 'auth-success'; serverId: string }
  | { type: 'auth-failed'; serverId: string; error: string };

export type MCPClientEventListener = (event: MCPClientEvent) => void;

// ============================================================================
// Storage Types
// ============================================================================

export interface MCPStoredCredentials {
  serverId: string;
  auth: AuthConfig;
  encryptedAt?: string;
}

export interface MCPServerStorageData {
  servers: MCPServerConfig[];
  credentials: MCPStoredCredentials[];
  lastSync?: string;
}
