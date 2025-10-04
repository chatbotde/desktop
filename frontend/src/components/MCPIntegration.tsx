/**
 * MCP Integration Example Component
 * 
 * This component demonstrates how to integrate the MCP client into your app.
 * You can use this as a starting point or reference for your own implementation.
 */

import { useEffect, useState } from 'react';
import { useMCPClient } from '@/mcp-client';
import type { Tool } from '@/mcp-client';

export function MCPIntegration() {
  const mcp = useMCPClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [allTools, setAllTools] = useState<Map<string, Tool[]>>(new Map());

  useEffect(() => {
    // Initialize MCP servers
    const servers = [
      {
        id: 'filesystem',
        name: 'Filesystem',
        description: 'File system operations',
        type: 'stdio' as const,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
        autoConnect: true
      }
      // Add more servers here as needed
      // {
      //   id: 'git',
      //   name: 'Git',
      //   type: 'stdio' as const,
      //   command: 'npx',
      //   args: ['-y', '@modelcontextprotocol/server-git'],
      //   autoConnect: true
      // }
    ];

    servers.forEach(config => {
      mcp.addServer(config);
    });

    console.log('MCP servers initialized:', servers.map(s => s.id));
  }, []);

  useEffect(() => {
    // Update tools when they change
    mcp.getAllTools().then(setAllTools);
  }, [mcp.tools]);

  const connectedCount = Array.from(mcp.connectionStates.values())
    .filter(state => state.status === 'connected').length;

  const totalTools = Array.from(allTools.values())
    .reduce((sum, tools) => sum + tools.length, 0);

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className={`w-2 h-2 rounded-full ${
          connectedCount > 0 ? 'bg-green-500' : 'bg-gray-400'
        }`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          MCP: {connectedCount}/{mcp.servers.size}
        </span>
        {totalTools > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({totalTools} tools)
          </span>
        )}
        <span className="text-gray-400">
          {isExpanded ? '▼' : '▲'}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2 max-h-96 overflow-auto">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            MCP Servers
          </h3>
          
          {mcp.servers.size === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No servers configured
            </p>
          ) : (
            Array.from(mcp.connectionStates).map(([id, state]) => {
              const config = mcp.servers.get(id);
              const tools = mcp.tools.get(id) || [];
              const resources = mcp.resources.get(id) || [];
              
              return (
                <div key={id} className="text-xs border border-gray-200 dark:border-gray-600 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {config?.name || id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      state.status === 'connected' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      state.status === 'connecting' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      state.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {state.status}
                    </span>
                  </div>
                  
                  {config?.description && (
                    <p className="text-gray-500 dark:text-gray-400 mb-1">
                      {config.description}
                    </p>
                  )}
                  
                  {state.status === 'connected' && (
                    <div className="flex gap-2 text-gray-600 dark:text-gray-300">
                      <span>🔧 {tools.length} tools</span>
                      <span>📄 {resources.length} resources</span>
                    </div>
                  )}
                  
                  {state.error && (
                    <p className="text-red-600 dark:text-red-400 mt-1">
                      Error: {state.error}
                    </p>
                  )}
                  
                  <div className="flex gap-2 mt-2">
                    {state.status !== 'connected' ? (
                      <button
                        onClick={() => mcp.connect(id)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Connect
                      </button>
                    ) : (
                      <button
                        onClick={() => mcp.disconnect(id)}
                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Disconnect
                      </button>
                    )}
                    <button
                      onClick={() => mcp.removeServer(id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
          
          {totalTools > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white">
                Available Tools ({totalTools})
              </summary>
              <div className="mt-2 space-y-2">
                {Array.from(allTools).map(([serverId, tools]) => (
                  <div key={serverId}>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      {mcp.servers.get(serverId)?.name || serverId}
                    </div>
                    <div className="space-y-1 pl-2">
                      {tools.map(tool => (
                        <div
                          key={tool.name}
                          className="text-xs text-gray-500 dark:text-gray-400"
                        >
                          • {tool.name}
                          {tool.description && (
                            <span className="text-gray-400 dark:text-gray-500">
                              {' '}- {tool.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Minimal version - just a status indicator
 */
export function MCPStatusIndicator() {
  const mcp = useMCPClient();

  const connectedCount = Array.from(mcp.connectionStates.values())
    .filter(state => state.status === 'connected').length;

  if (mcp.servers.size === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <div className={`w-2 h-2 rounded-full ${
        connectedCount > 0 ? 'bg-green-500' : 'bg-gray-400'
      }`} />
      <span>MCP: {connectedCount}/{mcp.servers.size}</span>
    </div>
  );
}

