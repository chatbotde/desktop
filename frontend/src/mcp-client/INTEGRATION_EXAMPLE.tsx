/**
 * Integration Example: How to add MCP Client to your existing app
 * 
 * This shows how to integrate the MCP client into sonicplane
 */

import { useEffect, useState } from 'react';
import { useMCPClient } from './index';
import type { Tool } from './types';

/**
 * Example 1: Add to your main App component
 */
export function AppWithMCP() {
  const mcp = useMCPClient();

  useEffect(() => {
    // Initialize MCP servers when app loads
    const servers = [
      {
        id: 'filesystem',
        name: 'Filesystem Access',
        description: 'Read and write files',
        type: 'stdio' as const,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
        autoConnect: true
      },
      {
        id: 'git',
        name: 'Git Operations',
        description: 'Git commands and info',
        type: 'stdio' as const,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-git'],
        autoConnect: true
      }
    ];

    servers.forEach(config => {
      mcp.addServer(config);
    });

    // Optional: Log connection status
    console.log('MCP Client initialized with servers:', servers.map(s => s.id));
  }, []);

  return (
    <div>
      {/* Your existing app content */}
      <YourExistingApp />
      
      {/* Optional: MCP Status Indicator */}
      <MCPStatusIndicator />
    </div>
  );
}

/**
 * Example 2: Status indicator component
 */
function MCPStatusIndicator() {
  const mcp = useMCPClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const connectedCount = Array.from(mcp.connectionStates.values())
    .filter(state => state.status === 'connected').length;

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2 flex items-center gap-2 hover:bg-gray-50 rounded-lg"
      >
        <div className={`w-2 h-2 rounded-full ${
          connectedCount > 0 ? 'bg-green-500' : 'bg-gray-400'
        }`} />
        <span className="text-sm font-medium">
          MCP: {connectedCount}/{mcp.servers.size}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t p-3 space-y-2 max-h-64 overflow-auto">
          {Array.from(mcp.connectionStates).map(([id, state]) => (
            <div key={id} className="text-xs">
              <div className="font-medium">{id}</div>
              <div className={`${
                state.status === 'connected' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {state.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Use MCP tools in chat
 */
export function ChatWithMCPTools() {
  const mcp = useMCPClient();
  const [allTools, setAllTools] = useState<Map<string, Tool[]>>(new Map());

  useEffect(() => {
    // Get all available tools
    mcp.getAllTools().then(setAllTools);
  }, [mcp.tools]);

  const handleToolSuggestion = (userMessage: string) => {
    // Simple keyword matching for tool suggestions
    const keywords: Record<string, string[]> = {
      'read file': ['read_file', 'read_multiple_files'],
      'write file': ['write_file', 'create_directory'],
      'git': ['git_status', 'git_diff', 'git_log'],
      'list': ['list_directory', 'search_files']
    };

    const suggestions: Array<{ serverId: string; tool: Tool }> = [];

    Object.entries(keywords).forEach(([keyword, toolNames]) => {
      if (userMessage.toLowerCase().includes(keyword)) {
        allTools.forEach((tools, serverId) => {
          tools.forEach(tool => {
            if (toolNames.some(name => tool.name.includes(name))) {
              suggestions.push({ serverId, tool });
            }
          });
        });
      }
    });

    return suggestions;
  };

  const executeTool = async (serverId: string, toolName: string, args: any) => {
    try {
      const result = await mcp.callTool({
        serverId,
        name: toolName,
        arguments: args
      });
      return result;
    } catch (error) {
      console.error('Tool execution error:', error);
      return { error };
    }
  };

  return {
    handleToolSuggestion,
    executeTool,
    allTools
  };
}

/**
 * Example 4: Add MCP tools to AI context
 */
export function useAIWithMCPContext() {
  const mcp = useMCPClient();
  const [context, setContext] = useState<string>('');

  useEffect(() => {
    const buildContext = async () => {
      const tools = await mcp.getAllTools();
      
      let contextText = 'Available MCP Tools:\n\n';
      
      tools.forEach((serverTools, serverId) => {
        contextText += `Server: ${serverId}\n`;
        serverTools.forEach(tool => {
          contextText += `- ${tool.name}: ${tool.description || 'No description'}\n`;
        });
        contextText += '\n';
      });

      setContext(contextText);
    };

    buildContext();
  }, [mcp.tools]);

  return context;
}

/**
 * Example 5: Dropdown menu for MCP tools
 */
export function MCPToolsDropdown() {
  const mcp = useMCPClient();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectTool = async (serverId: string, toolName: string) => {
    // You can integrate this with your existing UI
    console.log('Selected tool:', serverId, toolName);
    setIsOpen(false);
    
    // Example: Show a dialog to input parameters and execute
    // This is where you'd integrate with your existing UI framework
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
      >
        MCP Tools ⚡
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 bg-white border rounded shadow-lg z-50 min-w-[200px]">
          {Array.from(mcp.tools).map(([serverId, tools]) => (
            <div key={serverId}>
              <div className="px-3 py-2 bg-gray-100 text-xs font-semibold">
                {serverId}
              </div>
              {tools.map(tool => (
                <button
                  key={tool.name}
                  onClick={() => handleSelectTool(serverId, tool.name)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {tool.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Integration with existing chat system
 */
export function enhanceChatWithMCP() {
  const mcp = useMCPClient();

  return {
    // Add this to your message handler
    async handleMessage(message: string) {
      // Check if message requests a tool
      if (message.startsWith('/tool ')) {
        const [, serverId, toolName, ...args] = message.split(' ');
        
        try {
          const result = await mcp.callTool({
            serverId,
            name: toolName,
            arguments: JSON.parse(args.join(' '))
          });
          
          return {
            type: 'tool-result',
            content: result.content
          };
        } catch (error) {
          return {
            type: 'error',
            content: `Tool error: ${error}`
          };
        }
      }

      // Normal message handling
      return null;
    },

    // Get tool list for autocomplete
    async getToolSuggestions() {
      const tools = await mcp.getAllTools();
      const suggestions: string[] = [];
      
      tools.forEach((serverTools, serverId) => {
        serverTools.forEach(tool => {
          suggestions.push(`/tool ${serverId} ${tool.name}`);
        });
      });
      
      return suggestions;
    }
  };
}

/**
 * Example 7: Simple MCP sidebar panel
 */
export function MCPSidebarPanel() {
  const mcp = useMCPClient();
  const [activeServer, setActiveServer] = useState<string | null>(null);

  return (
    <div className="w-64 h-full border-l bg-gray-50 overflow-auto">
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold">MCP Servers</h3>
      </div>

      <div className="p-2 space-y-1">
        {Array.from(mcp.servers).map(([id, config]) => {
          const state = mcp.connectionStates.get(id);
          const isActive = activeServer === id;
          const isConnected = state?.status === 'connected';

          return (
            <div key={id}>
              <button
                onClick={() => setActiveServer(isActive ? null : id)}
                className={`w-full px-3 py-2 rounded text-left text-sm ${
                  isActive ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{config.name}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                </div>
              </button>

              {isActive && isConnected && (
                <div className="pl-3 py-2 text-xs space-y-1">
                  <div>Tools: {mcp.tools.get(id)?.length || 0}</div>
                  <div>Resources: {mcp.resources.get(id)?.length || 0}</div>
                  <div>Prompts: {mcp.prompts.get(id)?.length || 0}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export everything for easy use
export { useMCPClient, useMCPServer, mcpClient } from './index';


