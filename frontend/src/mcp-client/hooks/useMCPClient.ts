/**
 * React Hook for using MCP Client
 * Provides a clean interface for managing multiple MCP server connections
 */

import { useEffect, useState, useCallback, useRef } from 'react';
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
  readonly connectionStates: ReadonlyMap<string, MCPConnectionState>;
  isConnected: (serverId: string) => boolean;
  getConnectionState: (serverId: string) => MCPConnectionState | undefined;
  
  // Tools
  getTools: (serverId: string, refresh?: boolean) => Promise<readonly Tool[]>;
  getAllTools: (refresh?: boolean) => Promise<ReadonlyMap<string, readonly Tool[]>>;
  callTool: (params: ToolCallParams) => Promise<CallToolResult>;
  readonly tools: ReadonlyMap<string, readonly Tool[]>;
  
  // Resources
  getResources: (serverId: string, refresh?: boolean) => Promise<readonly Resource[]>;
  getAllResources: (refresh?: boolean) => Promise<ReadonlyMap<string, readonly Resource[]>>;
  readResource: (params: ResourceReadParams) => Promise<ReadResourceResult>;
  readonly resources: ReadonlyMap<string, readonly Resource[]>;
  
  // Prompts
  getPrompts: (serverId: string, refresh?: boolean) => Promise<readonly Prompt[]>;
  getAllPrompts: (refresh?: boolean) => Promise<ReadonlyMap<string, readonly Prompt[]>>;
  getPrompt: (params: PromptGetParams) => Promise<GetPromptResult>;
  readonly prompts: ReadonlyMap<string, readonly Prompt[]>;
  
  // Server info
  readonly servers: ReadonlyMap<string, MCPServerConfig>;
}

/**
 * Main hook for using MCP Client in React components
 * Manages state synchronization with the MCP client instance
 */
export function useMCPClient(): UseMCPClientReturn {
  const [connectionStates, setConnectionStates] = useState<ReadonlyMap<string, MCPConnectionState>>(
    () => mcpClient.getAllConnectionStates()
  );
  const [tools, setTools] = useState<ReadonlyMap<string, readonly Tool[]>>(new Map());
  const [resources, setResources] = useState<ReadonlyMap<string, readonly Resource[]>>(new Map());
  const [prompts, setPrompts] = useState<ReadonlyMap<string, readonly Prompt[]>>(new Map());
  const [servers, setServers] = useState<ReadonlyMap<string, MCPServerConfig>>(
    () => mcpClient.getServerConfigs()
  );

  // Use refs to store listeners to avoid recreating them
  const listenersRef = useRef<{
    onConnectionStatus: (serverId: string, state: MCPConnectionState) => void;
    onToolsUpdated: (serverId: string, serverTools: readonly Tool[]) => void;
    onResourcesUpdated: (serverId: string, serverResources: readonly Resource[]) => void;
    onPromptsUpdated: (serverId: string, serverPrompts: readonly Prompt[]) => void;
  } | undefined>(undefined);

  // Listen for connection state changes
  useEffect(() => {
    const listeners = {
      onConnectionStatus: (serverId: string, state: MCPConnectionState) => {
        setConnectionStates(prev => new Map(prev).set(serverId, state));
      },
      onToolsUpdated: (serverId: string, serverTools: readonly Tool[]) => {
        setTools(prev => new Map(prev).set(serverId, serverTools));
      },
      onResourcesUpdated: (serverId: string, serverResources: readonly Resource[]) => {
        setResources(prev => new Map(prev).set(serverId, serverResources));
      },
      onPromptsUpdated: (serverId: string, serverPrompts: readonly Prompt[]) => {
        setPrompts(prev => new Map(prev).set(serverId, serverPrompts));
      }
    };

    listenersRef.current = listeners;

    mcpClient.on('connection:status', listeners.onConnectionStatus);
    mcpClient.on('tools:updated', listeners.onToolsUpdated);
    mcpClient.on('resources:updated', listeners.onResourcesUpdated);
    mcpClient.on('prompts:updated', listeners.onPromptsUpdated);

    return () => {
      const currentListeners = listenersRef.current;
      if (currentListeners) {
        mcpClient.off('connection:status', currentListeners.onConnectionStatus);
        mcpClient.off('tools:updated', currentListeners.onToolsUpdated);
        mcpClient.off('resources:updated', currentListeners.onResourcesUpdated);
        mcpClient.off('prompts:updated', currentListeners.onPromptsUpdated);
      }
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
    
    // Clean up state for removed server
    setConnectionStates(prev => {
      const next = new Map(prev);
      next.delete(serverId);
      return next;
    });
    setTools(prev => {
      const next = new Map(prev);
      next.delete(serverId);
      return next;
    });
    setResources(prev => {
      const next = new Map(prev);
      next.delete(serverId);
      return next;
    });
    setPrompts(prev => {
      const next = new Map(prev);
      next.delete(serverId);
      return next;
    });
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


