# MCP Client - Complete Usage Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Setup](#setup)
3. [Basic Usage](#basic-usage)
4. [Advanced Usage](#advanced-usage)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Import the hook

```tsx
import { useMCPClient } from '@/mcp-client';
```

### 2. Use in your component

```tsx
function MyComponent() {
  const mcp = useMCPClient();

  useEffect(() => {
    // Add a filesystem server
    mcp.addServer({
      id: 'fs-server',
      name: 'Filesystem Server',
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
      autoConnect: true
    });
  }, []);

  return <div>Connected servers: {mcp.connectionStates.size}</div>;
}
```

---

## Setup

### Prerequisites

1. **MCP SDK** is already installed (check `package.json`)
2. **Electron IPC** handlers need to be set up in main process

### Electron Main Process Setup

You need to add MCP IPC handlers to your Electron main process. Create or update your main process file:

```typescript
// buddy/main.js or similar
import { ipcMain } from 'electron';
import { spawn } from 'child_process';

// Store active MCP processes
const mcpProcesses = new Map();
const mcpListeners = new Map();

// MCP Connect Handler
ipcMain.handle('mcp:connect', async (event, config) => {
  const { serverId, command, args = [], env = {} } = config;
  
  try {
    // Spawn the MCP server process
    const childProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env }
    });

    // Store the process
    mcpProcesses.set(serverId, childProcess);

    // Set up output listeners
    childProcess.stdout.on('data', (data) => {
      const sender = mcpListeners.get(serverId);
      if (sender) {
        sender.send('mcp:message', serverId, data.toString());
      }
    });

    childProcess.stderr.on('data', (data) => {
      console.error(`MCP ${serverId} error:`, data.toString());
    });

    childProcess.on('close', (code) => {
      console.log(`MCP ${serverId} exited with code ${code}`);
      mcpProcesses.delete(serverId);
      mcpListeners.delete(serverId);
    });

    // Store the sender for this server
    mcpListeners.set(serverId, event.sender);

    return { success: true };
  } catch (error) {
    console.error(`Failed to start MCP ${serverId}:`, error);
    throw error;
  }
});

// MCP Send Handler
ipcMain.handle('mcp:send', async (event, serverId, message) => {
  const process = mcpProcesses.get(serverId);
  
  if (!process) {
    throw new Error(`MCP server ${serverId} not found`);
  }

  try {
    const jsonMessage = JSON.stringify(message) + '\n';
    process.stdin.write(jsonMessage);
  } catch (error) {
    console.error(`Failed to send to MCP ${serverId}:`, error);
    throw error;
  }
});

// MCP Disconnect Handler
ipcMain.handle('mcp:disconnect', async (event, serverId) => {
  const process = mcpProcesses.get(serverId);
  
  if (process) {
    process.kill();
    mcpProcesses.delete(serverId);
    mcpListeners.delete(serverId);
  }
});

// Cleanup on app quit
app.on('quit', () => {
  mcpProcesses.forEach((process, serverId) => {
    console.log(`Killing MCP process ${serverId}`);
    process.kill();
  });
  mcpProcesses.clear();
  mcpListeners.clear();
});
```

### Preload Script Setup

The Electron API types are already defined in `buddy/frontend/src/types/electron.d.ts`. Make sure your preload script exposes these methods:

```typescript
// buddy/preload.js
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // ... existing methods ...

  // MCP methods
  mcpConnect: (config) => ipcRenderer.invoke('mcp:connect', config),
  mcpSend: (serverId, message) => ipcRenderer.invoke('mcp:send', serverId, message),
  mcpDisconnect: (serverId) => ipcRenderer.invoke('mcp:disconnect', serverId),
  onMcpMessage: (serverId, callback) => {
    const handler = (event, sid, message) => {
      if (sid === serverId) callback(message);
    };
    ipcRenderer.on('mcp:message', handler);
    return () => ipcRenderer.removeListener('mcp:message', handler);
  }
});
```

---

## Basic Usage

### Connecting to a Local Server (stdio)

```tsx
import { useMCPClient } from '@/mcp-client';

function FileSystemTools() {
  const mcp = useMCPClient();

  useEffect(() => {
    mcp.addServer({
      id: 'fs',
      name: 'Filesystem',
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
      autoConnect: true
    });
  }, []);

  return <div>Filesystem tools ready!</div>;
}
```

### Connecting to an Online Server (HTTP)

```tsx
import { useMCPClient } from '@/mcp-client';

function OnlineServer() {
  const mcp = useMCPClient();

  useEffect(() => {
    mcp.addServer({
      id: 'api-server',
      name: 'API Server',
      type: 'streamable-http',
      url: 'https://api.example.com/mcp',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      },
      autoConnect: true
    });
  }, []);

  return <div>API server ready!</div>;
}
```

### Listing and Calling Tools

```tsx
import { useMCPServer } from '@/mcp-client';

function ToolsList() {
  const server = useMCPServer({ serverId: 'fs' });

  useEffect(() => {
    if (!server.isConnected) {
      server.connect();
    }
  }, []);

  const handleCallTool = async (toolName: string) => {
    try {
      const result = await server.callTool(toolName, {
        path: '/path/to/file.txt'
      });
      console.log('Tool result:', result);
    } catch (error) {
      console.error('Tool error:', error);
    }
  };

  return (
    <div>
      <h2>Available Tools</h2>
      {server.tools.map(tool => (
        <div key={tool.name}>
          <h3>{tool.name}</h3>
          <p>{tool.description}</p>
          <button onClick={() => handleCallTool(tool.name)}>
            Call Tool
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Advanced Usage

### Managing Multiple Servers

```tsx
function MultiServerManager() {
  const mcp = useMCPClient();

  useEffect(() => {
    // Add multiple servers
    const servers = [
      {
        id: 'fs',
        name: 'Filesystem',
        type: 'stdio' as const,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '.']
      },
      {
        id: 'git',
        name: 'Git',
        type: 'stdio' as const,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-git']
      },
      {
        id: 'github',
        name: 'GitHub',
        type: 'stdio' as const,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN }
      }
    ];

    servers.forEach(config => mcp.addServer({ ...config, autoConnect: true }));
  }, []);

  // Get all tools from all servers
  const handleGetAllTools = async () => {
    const allTools = await mcp.getAllTools();
    allTools.forEach((tools, serverId) => {
      console.log(`${serverId}:`, tools);
    });
  };

  return <button onClick={handleGetAllTools}>Get All Tools</button>;
}
```

### Working with Resources

```tsx
function ResourceReader() {
  const server = useMCPServer({ serverId: 'fs' });
  const [content, setContent] = useState('');

  const readFile = async (uri: string) => {
    try {
      const result = await server.readResource(uri);
      setContent(result.contents[0]?.text || '');
    } catch (error) {
      console.error('Read error:', error);
    }
  };

  return (
    <div>
      <h2>Resources</h2>
      {server.resources.map(resource => (
        <div key={resource.uri}>
          <button onClick={() => readFile(resource.uri)}>
            {resource.name}
          </button>
        </div>
      ))}
      <pre>{content}</pre>
    </div>
  );
}
```

### Using Prompts

```tsx
function PromptManager() {
  const server = useMCPServer({ serverId: 'fs' });
  const [promptResult, setPromptResult] = useState(null);

  const usePrompt = async (promptName: string) => {
    try {
      const result = await server.getPrompt(promptName, {
        context: 'some-context'
      });
      setPromptResult(result);
    } catch (error) {
      console.error('Prompt error:', error);
    }
  };

  return (
    <div>
      <h2>Available Prompts</h2>
      {server.prompts.map(prompt => (
        <div key={prompt.name}>
          <button onClick={() => usePrompt(prompt.name)}>
            {prompt.name}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Event Handling

```tsx
import { mcpClient } from '@/mcp-client';

function EventMonitor() {
  useEffect(() => {
    // Listen for connection changes
    const handleStatus = (serverId: string, state: any) => {
      console.log(`${serverId} status:`, state.status);
    };

    // Listen for errors
    const handleError = (serverId: string, error: Error) => {
      console.error(`${serverId} error:`, error);
    };

    // Listen for tool updates
    const handleToolsUpdate = (serverId: string, tools: any[]) => {
      console.log(`${serverId} tools updated:`, tools.length);
    };

    mcpClient.on('connection:status', handleStatus);
    mcpClient.on('connection:error', handleError);
    mcpClient.on('tools:updated', handleToolsUpdate);

    return () => {
      mcpClient.off('connection:status', handleStatus);
      mcpClient.off('connection:error', handleError);
      mcpClient.off('tools:updated', handleToolsUpdate);
    };
  }, []);

  return <div>Monitoring events...</div>;
}
```

---

## Common Patterns

### Pattern 1: Server Health Check

```tsx
function ServerHealthCheck() {
  const mcp = useMCPClient();
  const [health, setHealth] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const healthStatus: Record<string, boolean> = {};
      mcp.connectionStates.forEach((state, serverId) => {
        healthStatus[serverId] = state.status === 'connected';
      });
      setHealth(healthStatus);
    }, 5000);

    return () => clearInterval(interval);
  }, [mcp]);

  return (
    <div>
      {Object.entries(health).map(([id, isHealthy]) => (
        <div key={id}>
          {id}: {isHealthy ? '✅' : '❌'}
        </div>
      ))}
    </div>
  );
}
```

### Pattern 2: Tool Search

```tsx
function ToolSearch() {
  const mcp = useMCPClient();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const searchTools = async () => {
      const allTools = await mcp.getAllTools();
      const matched: any[] = [];
      
      allTools.forEach((tools, serverId) => {
        tools.forEach(tool => {
          if (tool.name.toLowerCase().includes(search.toLowerCase()) ||
              tool.description?.toLowerCase().includes(search.toLowerCase())) {
            matched.push({ ...tool, serverId });
          }
        });
      });
      
      setResults(matched);
    };

    if (search) {
      searchTools();
    } else {
      setResults([]);
    }
  }, [search]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search tools..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {results.map(tool => (
        <div key={`${tool.serverId}-${tool.name}`}>
          {tool.name} ({tool.serverId})
        </div>
      ))}
    </div>
  );
}
```

### Pattern 3: Batch Tool Execution

```tsx
function BatchToolExecutor() {
  const mcp = useMCPClient();

  const executeBatch = async (tasks: Array<{serverId: string, tool: string, args: any}>) => {
    const results = await Promise.allSettled(
      tasks.map(task => 
        mcp.callTool({
          serverId: task.serverId,
          name: task.tool,
          arguments: task.args
        })
      )
    );

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        console.log(`Task ${i} succeeded:`, result.value);
      } else {
        console.error(`Task ${i} failed:`, result.reason);
      }
    });
  };

  return (
    <button onClick={() => executeBatch([
      { serverId: 'fs', tool: 'read_file', args: { path: 'file1.txt' } },
      { serverId: 'fs', tool: 'read_file', args: { path: 'file2.txt' } }
    ])}>
      Execute Batch
    </button>
  );
}
```

---

## Troubleshooting

### Issue: "MCP API not available in Electron context"

**Solution:** Make sure you've set up the Electron IPC handlers in both the main process and preload script.

### Issue: Server won't connect

**Checklist:**
1. Verify the command and args are correct
2. Check if the MCP server package is installed
3. Look at the error in `connectionState.error`
4. Check the Electron console for main process logs
5. Ensure the server binary is in PATH

### Issue: Tools not appearing

**Solution:**
```tsx
// Force refresh tools
await server.refreshTools();

// Or get fresh data
const tools = await mcp.getTools('server-id', true);
```

### Issue: Connection drops

**Solution:** Implement auto-reconnect:
```tsx
useEffect(() => {
  const handleStatus = (serverId: string, state: any) => {
    if (state.status === 'error' || state.status === 'disconnected') {
      // Retry after 5 seconds
      setTimeout(() => {
        mcp.connect(serverId).catch(console.error);
      }, 5000);
    }
  };

  mcpClient.on('connection:status', handleStatus);
  return () => mcpClient.off('connection:status', handleStatus);
}, []);
```

### Debug Mode

Enable detailed logging:
```tsx
// In your component
useEffect(() => {
  mcpClient.on('connection:status', console.log);
  mcpClient.on('connection:error', console.error);
  mcpClient.on('tools:updated', (...args) => console.log('Tools:', ...args));
  mcpClient.on('resources:updated', (...args) => console.log('Resources:', ...args));
  mcpClient.on('prompts:updated', (...args) => console.log('Prompts:', ...args));
}, []);
```

---

## Popular MCP Servers

Here are some commonly used MCP servers you can connect to:

```bash
# Filesystem
npx -y @modelcontextprotocol/server-filesystem /path/to/dir

# Git
npx -y @modelcontextprotocol/server-git

# GitHub (requires GITHUB_TOKEN)
npx -y @modelcontextprotocol/server-github

# PostgreSQL
npx -y @modelcontextprotocol/server-postgres postgresql://...

# Google Drive
npx -y @modelcontextprotocol/server-gdrive

# Slack
npx -y @modelcontextprotocol/server-slack

# SQLite
npx -y @modelcontextprotocol/server-sqlite /path/to/db.sqlite
```

---

## Next Steps

1. Check out the example components in `examples/`
2. Read the README.md for API reference
3. Explore the MCP SDK documentation: https://modelcontextprotocol.io
4. Join the MCP community for support

Happy building! 🚀


