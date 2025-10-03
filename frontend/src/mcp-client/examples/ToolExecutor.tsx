/**
 * Example Component: Tool Executor
 * Demonstrates how to list and execute MCP tools
 */

import { useState, useEffect } from 'react';
import { useMCPServer } from '../index';
import type { Tool } from '../types';

interface ToolExecutorProps {
  serverId: string;
}

export function ToolExecutor({ serverId }: ToolExecutorProps) {
  const server = useMCPServer({ serverId, autoRefresh: true });
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!server.isConnected) {
      server.connect().catch(console.error);
    }
  }, []);

  const handleExecuteTool = async () => {
    if (!selectedTool) return;

    setExecuting(true);
    setResult(null);

    try {
      const toolResult = await server.callTool(selectedTool.name, toolArgs);
      setResult(toolResult);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setExecuting(false);
    }
  };

  if (!server.isConnected) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-600">
          {server.connectionState?.status === 'connecting' 
            ? 'Connecting to server...' 
            : 'Not connected to server'}
        </div>
        {server.error && (
          <div className="mt-2 text-red-600 text-sm">
            Error: {server.error.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Tool Executor</h2>
      
      {/* Tool Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Tool</label>
        <select
          value={selectedTool?.name || ''}
          onChange={(e) => {
            const tool = server.tools.find(t => t.name === e.target.value);
            setSelectedTool(tool || null);
            setToolArgs({});
            setResult(null);
          }}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">-- Select a tool --</option>
          {server.tools.map((tool) => (
            <option key={tool.name} value={tool.name}>
              {tool.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tool Info */}
      {selectedTool && (
        <div className="border p-4 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">{selectedTool.name}</h3>
          {selectedTool.description && (
            <p className="text-sm text-gray-600 mb-3">{selectedTool.description}</p>
          )}

          {/* Tool Input Schema */}
          {selectedTool.inputSchema && (
            <div className="mt-3">
              <h4 className="font-medium text-sm mb-2">Parameters:</h4>
              <div className="space-y-2">
                {Object.entries((selectedTool.inputSchema as any).properties || {}).map(
                  ([key, schema]: [string, any]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-1">
                        {key}
                        {(selectedTool.inputSchema as any).required?.includes(key) && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <input
                        type={schema.type === 'number' ? 'number' : 'text'}
                        placeholder={schema.description || key}
                        value={toolArgs[key] || ''}
                        onChange={(e) => {
                          const value = schema.type === 'number' 
                            ? parseFloat(e.target.value) 
                            : e.target.value;
                          setToolArgs({ ...toolArgs, [key]: value });
                        }}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                      {schema.description && (
                        <p className="text-xs text-gray-500 mt-1">{schema.description}</p>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleExecuteTool}
            disabled={executing}
            className={`mt-4 w-full px-4 py-2 rounded font-medium ${
              executing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {executing ? 'Executing...' : 'Execute Tool'}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2">Result:</h3>
          {result.error ? (
            <div className="p-3 bg-red-50 text-red-700 rounded">
              <strong>Error:</strong> {result.error}
            </div>
          ) : (
            <div className="space-y-2">
              {result.content?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 rounded">
                  {item.type === 'text' && (
                    <pre className="whitespace-pre-wrap text-sm">{item.text}</pre>
                  )}
                  {item.type === 'image' && (
                    <img src={item.data} alt="Result" className="max-w-full" />
                  )}
                  {item.type === 'resource' && (
                    <div>
                      <div className="font-medium">Resource: {item.resource?.uri}</div>
                      <pre className="mt-2 text-sm">{JSON.stringify(item, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Show raw JSON for debugging */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  View Raw JSON
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Available Tools List */}
      {!selectedTool && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Available Tools ({server.tools.length})</h3>
          <div className="grid gap-2">
            {server.tools.map((tool) => (
              <div
                key={tool.name}
                onClick={() => {
                  setSelectedTool(tool);
                  setToolArgs({});
                  setResult(null);
                }}
                className="border p-3 rounded cursor-pointer hover:bg-gray-50 transition"
              >
                <div className="font-mono text-sm font-medium">{tool.name}</div>
                {tool.description && (
                  <div className="text-sm text-gray-600 mt-1">{tool.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


