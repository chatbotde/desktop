/**
 * Example Component: MCP Server Manager
 * Demonstrates how to use the MCP client in a React component
 */

import { useState } from 'react';
import { useMCPClient } from '../index';
import type { MCPServerConfig, TransportType } from '../types';

export function MCPServerManager() {
  const mcp = useMCPClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<MCPServerConfig>>({
    type: 'stdio'
  });

  const handleAddServer = () => {
    if (!formData.id || !formData.name) {
      alert('Please fill in required fields');
      return;
    }

    const config: MCPServerConfig = {
      id: formData.id,
      name: formData.name,
      description: formData.description,
      type: formData.type || 'stdio',
      command: formData.command,
      args: formData.args,
      env: formData.env,
      url: formData.url,
      headers: formData.headers,
      autoConnect: formData.autoConnect ?? true
    };

    mcp.addServer(config);
    setShowAddForm(false);
    setFormData({ type: 'stdio' });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">MCP Servers</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showAddForm ? 'Cancel' : 'Add Server'}
        </button>
      </div>

      {/* Add Server Form */}
      {showAddForm && (
        <div className="border p-4 rounded space-y-3">
          <h3 className="font-semibold">Add New Server</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Server ID *</label>
            <input
              type="text"
              value={formData.id || ''}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="my-server"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="My MCP Server"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Transport Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as TransportType })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="stdio">stdio (Local)</option>
              <option value="sse">SSE (HTTP)</option>
              <option value="streamable-http">Streamable HTTP</option>
            </select>
          </div>

          {formData.type === 'stdio' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Command *</label>
                <input
                  type="text"
                  value={formData.command || ''}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="npx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Arguments (comma-separated)</label>
                <input
                  type="text"
                  value={formData.args?.join(',') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    args: e.target.value.split(',').filter(Boolean) 
                  })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="-y,@modelcontextprotocol/server-filesystem"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">URL *</label>
              <input
                type="text"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="https://example.com/mcp"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.autoConnect ?? true}
              onChange={(e) => setFormData({ ...formData, autoConnect: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm">Auto-connect on add</label>
          </div>

          <button
            onClick={handleAddServer}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Server
          </button>
        </div>
      )}

      {/* Server List */}
      <div className="space-y-2">
        {Array.from(mcp.servers.entries()).map(([id, config]) => {
          const state = mcp.getConnectionState(id);
          const isConnected = mcp.isConnected(id);
          const tools = mcp.tools.get(id) || [];
          const resources = mcp.resources.get(id) || [];
          const prompts = mcp.prompts.get(id) || [];

          return (
            <div key={id} className="border p-4 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{config.name}</h3>
                  <p className="text-sm text-gray-600">{config.description || id}</p>
                  <p className="text-xs text-gray-500">Type: {config.type}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    state?.status === 'connected' ? 'bg-green-100 text-green-800' :
                    state?.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                    state?.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {state?.status || 'unknown'}
                  </span>
                  
                  {!isConnected ? (
                    <button
                      onClick={() => mcp.connect(id)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Connect
                    </button>
                  ) : (
                    <button
                      onClick={() => mcp.disconnect(id)}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      Disconnect
                    </button>
                  )}
                  
                  <button
                    onClick={() => mcp.removeServer(id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {state?.error && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                  Error: {state.error}
                </div>
              )}

              {isConnected && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="font-medium">Tools</div>
                      <div className="text-lg">{tools.length}</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-medium">Resources</div>
                      <div className="text-lg">{resources.length}</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <div className="font-medium">Prompts</div>
                      <div className="text-lg">{prompts.length}</div>
                    </div>
                  </div>

                  {tools.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium text-sm">
                        View Tools ({tools.length})
                      </summary>
                      <div className="mt-2 space-y-1 pl-4">
                        {tools.map((tool) => (
                          <div key={tool.name} className="text-sm">
                            <span className="font-mono">{tool.name}</span>
                            {tool.description && (
                              <span className="text-gray-600 ml-2">- {tool.description}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {mcp.servers.size === 0 && (
          <div className="text-center py-8 text-gray-500">
            No servers configured. Click "Add Server" to get started.
          </div>
        )}
      </div>
    </div>
  );
}


