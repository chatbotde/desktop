/**
 * React Hook for managing a single MCP server connection
 */

import { useEffect, useState, useCallback } from 'react';
import { mcpClient } from '../mcp-client';
import type {
  MCPConnectionState,
  Tool,
  Resource,
  Prompt,
  CallToolResult,
  ReadResourceResult,
  GetPromptResult
} from '../types';

export interface UseMCPServerOptions {
  serverId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseMCPServerReturn {
  // Connection
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connectionState: MCPConnectionState | undefined;
  isConnected: boolean;
  
  // Tools
  tools: Tool[];
  refreshTools: () => Promise<void>;
  callTool: (name: string, args?: Record<string, unknown>) => Promise<CallToolResult>;
  
  // Resources
  resources: Resource[];
  refreshResources: () => Promise<void>;
  readResource: (uri: string) => Promise<ReadResourceResult>;
  
  // Prompts
  prompts: Prompt[];
  refreshPrompts: () => Promise<void>;
  getPrompt: (name: string, args?: Record<string, unknown>) => Promise<GetPromptResult>;
  
  // Loading states
  loading: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
  
  // Errors
  error: Error | null;
}

/**
 * Hook for managing a single MCP server
 */
export function useMCPServer({
  serverId,
  autoRefresh = false,
  refreshInterval = 30000
}: UseMCPServerOptions): UseMCPServerReturn {
  const [connectionState, setConnectionState] = useState<MCPConnectionState | undefined>();
  const [tools, setTools] = useState<Tool[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState({
    tools: false,
    resources: false,
    prompts: false
  });

  const isConnected = connectionState?.status === 'connected';

  // Listen for connection state changes
  useEffect(() => {
    const handleConnectionStatus = (sid: string, state: MCPConnectionState) => {
      if (sid === serverId) {
        setConnectionState(state);
        if (state.lastError) {
          setError(state.lastError);
        }
      }
    };

    const handleToolsUpdated = (sid: string, serverTools: Tool[]) => {
      if (sid === serverId) {
        setTools(serverTools);
      }
    };

    const handleResourcesUpdated = (sid: string, serverResources: Resource[]) => {
      if (sid === serverId) {
        setResources(serverResources);
      }
    };

    const handlePromptsUpdated = (sid: string, serverPrompts: Prompt[]) => {
      if (sid === serverId) {
        setPrompts(serverPrompts);
      }
    };

    const handleError = (sid: string, err: Error) => {
      if (sid === serverId) {
        setError(err);
      }
    };

    mcpClient.on('connection:status', handleConnectionStatus);
    mcpClient.on('tools:updated', handleToolsUpdated);
    mcpClient.on('resources:updated', handleResourcesUpdated);
    mcpClient.on('prompts:updated', handlePromptsUpdated);
    mcpClient.on('connection:error', handleError);

    // Initialize state
    setConnectionState(mcpClient.getConnectionState(serverId));

    return () => {
      mcpClient.off('connection:status', handleConnectionStatus);
      mcpClient.off('tools:updated', handleToolsUpdated);
      mcpClient.off('resources:updated', handleResourcesUpdated);
      mcpClient.off('prompts:updated', handlePromptsUpdated);
      mcpClient.off('connection:error', handleError);
    };
  }, [serverId]);

  // Auto-refresh capabilities
  useEffect(() => {
    if (!autoRefresh || !isConnected) return;

    const interval = setInterval(() => {
      refreshTools();
      refreshResources();
      refreshPrompts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isConnected, refreshInterval]);

  // Connection methods
  const connect = useCallback(async () => {
    setError(null);
    try {
      await mcpClient.connect(serverId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [serverId]);

  const disconnect = useCallback(async () => {
    await mcpClient.disconnect(serverId);
  }, [serverId]);

  // Tool methods
  const refreshTools = useCallback(async () => {
    setLoading(prev => ({ ...prev, tools: true }));
    try {
      const serverTools = await mcpClient.getTools(serverId, true);
      setTools(serverTools);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(prev => ({ ...prev, tools: false }));
    }
  }, [serverId]);

  const callTool = useCallback(async (
    name: string,
    args?: Record<string, unknown>
  ): Promise<CallToolResult> => {
    try {
      const result = await mcpClient.callTool({
        serverId,
        name,
        arguments: args
      });
      setError(null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [serverId]);

  // Resource methods
  const refreshResources = useCallback(async () => {
    setLoading(prev => ({ ...prev, resources: true }));
    try {
      const serverResources = await mcpClient.getResources(serverId, true);
      setResources(serverResources);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(prev => ({ ...prev, resources: false }));
    }
  }, [serverId]);

  const readResource = useCallback(async (uri: string): Promise<ReadResourceResult> => {
    try {
      const result = await mcpClient.readResource({ serverId, uri });
      setError(null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [serverId]);

  // Prompt methods
  const refreshPrompts = useCallback(async () => {
    setLoading(prev => ({ ...prev, prompts: true }));
    try {
      const serverPrompts = await mcpClient.getPrompts(serverId, true);
      setPrompts(serverPrompts);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(prev => ({ ...prev, prompts: false }));
    }
  }, [serverId]);

  const getPrompt = useCallback(async (
    name: string,
    args?: Record<string, unknown>
  ): Promise<GetPromptResult> => {
    try {
      const result = await mcpClient.getPrompt({
        serverId,
        name,
        arguments: args
      });
      setError(null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [serverId]);

  return {
    // Connection
    connect,
    disconnect,
    connectionState,
    isConnected,
    
    // Tools
    tools,
    refreshTools,
    callTool,
    
    // Resources
    resources,
    refreshResources,
    readResource,
    
    // Prompts
    prompts,
    refreshPrompts,
    getPrompt,
    
    // Loading states
    loading,
    
    // Errors
    error
  };
}


