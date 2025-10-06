/**
 * React Hook for managing a single MCP server connection
 * Provides a focused interface for working with one server
 */

import { useEffect, useState, useCallback, useRef } from 'react';
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
  readonly serverId: string;
  readonly autoRefresh?: boolean;
  readonly refreshInterval?: number;
}

export interface UseMCPServerReturn {
  // Connection
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  readonly connectionState: MCPConnectionState | undefined;
  readonly isConnected: boolean;
  
  // Tools
  readonly tools: readonly Tool[];
  refreshTools: () => Promise<void>;
  callTool: (name: string, args?: Readonly<Record<string, unknown>>) => Promise<CallToolResult>;
  
  // Resources
  readonly resources: readonly Resource[];
  refreshResources: () => Promise<void>;
  readResource: (uri: string) => Promise<ReadResourceResult>;
  
  // Prompts
  readonly prompts: readonly Prompt[];
  refreshPrompts: () => Promise<void>;
  getPrompt: (name: string, args?: Readonly<Record<string, unknown>>) => Promise<GetPromptResult>;
  
  // Loading states
  readonly loading: {
    readonly tools: boolean;
    readonly resources: boolean;
    readonly prompts: boolean;
  };
  
  // Errors
  readonly error: Error | null;
}

/**
 * Hook for managing a single MCP server
 * Automatically syncs with client state and provides convenient methods
 */
export function useMCPServer({
  serverId,
  autoRefresh = false,
  refreshInterval = 30000
}: UseMCPServerOptions): UseMCPServerReturn {
  const [connectionState, setConnectionState] = useState<MCPConnectionState | undefined>(
    () => mcpClient.getConnectionState(serverId)
  );
  const [tools, setTools] = useState<readonly Tool[]>([]);
  const [resources, setResources] = useState<readonly Resource[]>([]);
  const [prompts, setPrompts] = useState<readonly Prompt[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState({
    tools: false,
    resources: false,
    prompts: false
  });

  const isConnected = connectionState?.status === 'connected';
  const refreshIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Store listeners in ref to prevent recreation
  const listenersRef = useRef<{
    onConnectionStatus: (sid: string, state: MCPConnectionState) => void;
    onToolsUpdated: (sid: string, serverTools: readonly Tool[]) => void;
    onResourcesUpdated: (sid: string, serverResources: readonly Resource[]) => void;
    onPromptsUpdated: (sid: string, serverPrompts: readonly Prompt[]) => void;
    onError: (sid: string, err: Error) => void;
  } | undefined>(undefined);

  // Listen for connection state changes
  useEffect(() => {
    const listeners = {
      onConnectionStatus: (sid: string, state: MCPConnectionState) => {
        if (sid === serverId) {
          setConnectionState(state);
          if (state.lastError) {
            setError(state.lastError);
          }
          // Clear error on successful connection
          if (state.status === 'connected') {
            setError(null);
          }
        }
      },
      onToolsUpdated: (sid: string, serverTools: readonly Tool[]) => {
        if (sid === serverId) {
          setTools(serverTools);
        }
      },
      onResourcesUpdated: (sid: string, serverResources: readonly Resource[]) => {
        if (sid === serverId) {
          setResources(serverResources);
        }
      },
      onPromptsUpdated: (sid: string, serverPrompts: readonly Prompt[]) => {
        if (sid === serverId) {
          setPrompts(serverPrompts);
        }
      },
      onError: (sid: string, err: Error) => {
        if (sid === serverId) {
          setError(err);
        }
      }
    };

    listenersRef.current = listeners;

    mcpClient.on('connection:status', listeners.onConnectionStatus);
    mcpClient.on('tools:updated', listeners.onToolsUpdated);
    mcpClient.on('resources:updated', listeners.onResourcesUpdated);
    mcpClient.on('prompts:updated', listeners.onPromptsUpdated);
    mcpClient.on('connection:error', listeners.onError);

    return () => {
      const currentListeners = listenersRef.current;
      if (currentListeners) {
        mcpClient.off('connection:status', currentListeners.onConnectionStatus);
        mcpClient.off('tools:updated', currentListeners.onToolsUpdated);
        mcpClient.off('resources:updated', currentListeners.onResourcesUpdated);
        mcpClient.off('prompts:updated', currentListeners.onPromptsUpdated);
        mcpClient.off('connection:error', currentListeners.onError);
      }
    };
  }, [serverId]);

  // Auto-refresh capabilities
  useEffect(() => {
    if (!autoRefresh || !isConnected) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = undefined;
      }
      return;
    }

    const refresh = () => {
      void Promise.all([
        refreshTools(),
        refreshResources(),
        refreshPrompts()
      ]).catch(console.error);
    };

    refreshIntervalRef.current = setInterval(refresh, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
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
    setError(null);
  }, [serverId]);

  // Tool methods
  const refreshTools = useCallback(async () => {
    if (!mcpClient.isConnected(serverId)) return;
    
    setLoading(prev => ({ ...prev, tools: true }));
    try {
      const serverTools = await mcpClient.getTools(serverId, true);
      setTools(serverTools);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, tools: false }));
    }
  }, [serverId]);

  const callTool = useCallback(async (
    name: string,
    args?: Readonly<Record<string, unknown>>
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
    if (!mcpClient.isConnected(serverId)) return;
    
    setLoading(prev => ({ ...prev, resources: true }));
    try {
      const serverResources = await mcpClient.getResources(serverId, true);
      setResources(serverResources);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
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
    if (!mcpClient.isConnected(serverId)) return;
    
    setLoading(prev => ({ ...prev, prompts: true }));
    try {
      const serverPrompts = await mcpClient.getPrompts(serverId, true);
      setPrompts(serverPrompts);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, prompts: false }));
    }
  }, [serverId]);

  const getPrompt = useCallback(async (
    name: string,
    args?: Readonly<Record<string, unknown>>
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


