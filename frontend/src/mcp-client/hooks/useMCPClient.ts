/**
 * React Hook for using MCP Client
 */

import { useEffect, useState, useCallback } from 'react';
import { mcpClient } from '../mcp-client';
import type {
  MCPConnectionState,
  MCPServerConfig,
  Tool,
  Resource,
  Prompt,
  ToolCallParams,
  ResourceReadParams,
  PromptGetParams,
  CallToolResult,
  ReadResourceResult,
  GetPromptResult
} from '../types';

export interface UseMCPClientReturn {
  // Server management
  addServer: (config: MCPServerConfig) => void;
  removeServer: (serverId: string) => Promise<void>;
  connect: (serverId: string) => Promise<void>;
  disconnect: (serverId: string) => Promise<void>;
  
  // Connection state
  connectionStates: Map<string, MCPConnectionState>;
  isConnected: (serverId: string) => boolean;
  getConnectionState: (serverId: string) => MCPConnectionState | undefined;
  
  // Tools
  getTools: (serverId: string, refresh?: boolean) => Promise<Tool[]>;
  getAllTools: (refresh?: boolean) => Promise<Map<string, Tool[]>>;
  callTool: (params: ToolCallParams) => Promise<CallToolResult>;
  tools: Map<string, Tool[]>;
  
  // Resources
  getResources: (serverId: string, refresh?: boolean) => Promise<Resource[]>;
  getAllResources: (refresh?: boolean) => Promise<Map<string, Resource[]>>;
  readResource: (params: ResourceReadParams) => Promise<ReadResourceResult>;
  resources: Map<string, Resource[]>;
  
  // Prompts
  getPrompts: (serverId: string, refresh?: boolean) => Promise<Prompt[]>;
  getAllPrompts: (refresh?: boolean) => Promise<Map<string, Prompt[]>>;
  getPrompt: (params: PromptGetParams) => Promise<GetPromptResult>;
  prompts: Map<string, Prompt[]>;
  
  // Server info
  servers: Map<string, MCPServerConfig>;
}

/**
 * Main hook for using MCP Client in React components
 */
export function useMCPClient(): UseMCPClientReturn {
  const [connectionStates, setConnectionStates] = useState<Map<string, MCPConnectionState>>(
    new Map()
  );
  const [tools, setTools] = useState<Map<string, Tool[]>>(new Map());
  const [resources, setResources] = useState<Map<string, Resource[]>>(new Map());
  const [prompts, setPrompts] = useState<Map<string, Prompt[]>>(new Map());
  const [servers, setServers] = useState<Map<string, MCPServerConfig>>(
    mcpClient.getServerConfigs()
  );

  // Listen for connection state changes
  useEffect(() => {
    const handleConnectionStatus = (serverId: string, state: MCPConnectionState) => {
      setConnectionStates(prev => new Map(prev).set(serverId, state));
    };

    const handleToolsUpdated = (serverId: string, serverTools: Tool[]) => {
      setTools(prev => new Map(prev).set(serverId, serverTools));
    };

    const handleResourcesUpdated = (serverId: string, serverResources: Resource[]) => {
      setResources(prev => new Map(prev).set(serverId, serverResources));
    };

    const handlePromptsUpdated = (serverId: string, serverPrompts: Prompt[]) => {
      setPrompts(prev => new Map(prev).set(serverId, serverPrompts));
    };

    mcpClient.on('connection:status', handleConnectionStatus);
    mcpClient.on('tools:updated', handleToolsUpdated);
    mcpClient.on('resources:updated', handleResourcesUpdated);
    mcpClient.on('prompts:updated', handlePromptsUpdated);

    // Initialize state from current client state
    setConnectionStates(mcpClient.getAllConnectionStates());

    return () => {
      mcpClient.off('connection:status', handleConnectionStatus);
      mcpClient.off('tools:updated', handleToolsUpdated);
      mcpClient.off('resources:updated', handleResourcesUpdated);
      mcpClient.off('prompts:updated', handlePromptsUpdated);
    };
  }, []);

  // Server management callbacks
  const addServer = useCallback((config: MCPServerConfig) => {
    mcpClient.addServer(config);
    setServers(mcpClient.getServerConfigs());
  }, []);

  const removeServer = useCallback(async (serverId: string) => {
    await mcpClient.removeServer(serverId);
    setServers(mcpClient.getServerConfigs());
  }, []);

  const connect = useCallback(async (serverId: string) => {
    await mcpClient.connect(serverId);
  }, []);

  const disconnect = useCallback(async (serverId: string) => {
    await mcpClient.disconnect(serverId);
  }, []);

  // Connection state callbacks
  const isConnected = useCallback((serverId: string) => {
    return mcpClient.isConnected(serverId);
  }, []);

  const getConnectionState = useCallback((serverId: string) => {
    return mcpClient.getConnectionState(serverId);
  }, []);

  // Tool callbacks
  const getTools = useCallback(async (serverId: string, refresh = false) => {
    return await mcpClient.getTools(serverId, refresh);
  }, []);

  const getAllTools = useCallback(async (refresh = false) => {
    return await mcpClient.getAllTools(refresh);
  }, []);

  const callTool = useCallback(async (params: ToolCallParams) => {
    return await mcpClient.callTool(params);
  }, []);

  // Resource callbacks
  const getResources = useCallback(async (serverId: string, refresh = false) => {
    return await mcpClient.getResources(serverId, refresh);
  }, []);

  const getAllResources = useCallback(async (refresh = false) => {
    return await mcpClient.getAllResources(refresh);
  }, []);

  const readResource = useCallback(async (params: ResourceReadParams) => {
    return await mcpClient.readResource(params);
  }, []);

  // Prompt callbacks
  const getPrompts = useCallback(async (serverId: string, refresh = false) => {
    return await mcpClient.getPrompts(serverId, refresh);
  }, []);

  const getAllPrompts = useCallback(async (refresh = false) => {
    return await mcpClient.getAllPrompts(refresh);
  }, []);

  const getPrompt = useCallback(async (params: PromptGetParams) => {
    return await mcpClient.getPrompt(params);
  }, []);

  return {
    // Server management
    addServer,
    removeServer,
    connect,
    disconnect,
    
    // Connection state
    connectionStates,
    isConnected,
    getConnectionState,
    
    // Tools
    getTools,
    getAllTools,
    callTool,
    tools,
    
    // Resources
    getResources,
    getAllResources,
    readResource,
    resources,
    
    // Prompts
    getPrompts,
    getAllPrompts,
    getPrompt,
    prompts,
    
    // Server info
    servers
  };
}


