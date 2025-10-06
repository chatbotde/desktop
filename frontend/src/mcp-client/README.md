# MCP Client

A comprehensive, type-safe Model Context Protocol (MCP) client for React + Electron applications. Supports connecting to both local (stdio) and online (SSE/StreamableHTTP) MCP servers.

## Features

- ✅ **Multiple Transport Types**: stdio, SSE, and Streamable HTTP
- ✅ **React Hooks**: Easy integration with React components
- ✅ **TypeScript**: Fully typed with immutable data structures
- ✅ **Multiple Servers**: Connect to multiple MCP servers simultaneously
- ✅ **Auto-retry**: Configurable retry with `maxRetries` and `retryDelay`
- ✅ **Intelligent Caching**: Automatic caching of tools, resources, and prompts
- ✅ **Event-driven**: Real-time updates via type-safe event emitters
- ✅ **Electron-ready**: Built for Electron apps with IPC support

## Installation

The MCP SDK is already installed in your project:

```json
"@modelcontextprotocol/sdk": "^1.18.1"
```

## Quick Start

### 1. Basic Usage with Hook

```tsx
import { useMCPClient } from '@/mcp-client';

function MyComponent() {
  const mcp = useMCPClient();

  useEffect(() => {
    // Add a local stdio server
    mcp.addServer({
      id: 'filesystem-server',
      name: 'Filesystem MCP Server',
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir'],
      autoConnect: true
    });
  }, []);

  return (
    <div>
      {Array.from(mcp.connectionStates.entries()).map(([id, state]) => (
        <div key={id}>
          Server: {id} - Status: {state.status}
        </div>
      ))}
    </div>
  );
}
```

### 2. Using a Single Server

```tsx
import { useMCPServer } from '@/mcp-client';

function ServerTools() {
  const server = useMCPServer({
    serverId: 'my-server',
    autoRefresh: true,
    refreshInterval: 30000
  });

  useEffect(() => {
    if (!server.isConnected) {
      server.connect();
    }
  }, []);

  if (!server.isConnected) {
    return <div>Connecting...</div>;
  }

  return (
    <div>
      <h2>Available Tools</h2>
      {server.tools.map(tool => (
        <div key={tool.name}>
          <h3>{tool.name}</h3>
          <p>{tool.description}</p>
          <button onClick={async () => {
            const result = await server.callTool(tool.name, {});
            console.log(result);
          }}>
            Call Tool
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Server Configurations

### Local stdio Server

```tsx
mcp.addServer({
  id: 'local-server',
  name: 'Local MCP Server',
  type: 'stdio',
  command: 'node',
  args: ['path/to/server.js'],
  env: { 
    NODE_ENV: 'production' 
  },
  autoConnect: true,
  retryOnFailure: true,
  maxRetries: 3,
  retryDelay: 2000
});
```

### Online SSE Server

```tsx
mcp.addServer({
  id: 'online-server',
  name: 'Online MCP Server',
  type: 'sse',
  url: 'https://example.com/mcp',
  headers: {
    'Authorization': 'Bearer token'
  },
  autoConnect: true
});
```

### Streamable HTTP Server

```tsx
mcp.addServer({
  id: 'http-server',
  name: 'HTTP MCP Server',
  type: 'streamable-http',
  url: 'https://example.com/mcp',
  headers: {
    'Authorization': 'Bearer token'
  },
  autoConnect: true
});
```

## Working with Tools

### List All Tools

```tsx
const allTools = await mcp.getAllTools();
// Returns: Map<serverId, Tool[]>

allTools.forEach((tools, serverId) => {
  console.log(`Server ${serverId}:`, tools);
});
```

### Call a Tool

```tsx
const result = await mcp.callTool({
  serverId: 'my-server',
  name: 'read_file',
  arguments: {
    path: '/path/to/file.txt'
  }
});

console.log(result.content);
```

## Working with Resources

### List Resources

```tsx
const resources = await mcp.getResources('my-server');

resources.forEach(resource => {
  console.log(resource.uri, resource.name);
});
```

### Read a Resource

```tsx
const result = await mcp.readResource({
  serverId: 'my-server',
  uri: 'file:///path/to/resource'
});

console.log(result.contents);
```

## Working with Prompts

### List Prompts

```tsx
const prompts = await mcp.getPrompts('my-server');

prompts.forEach(prompt => {
  console.log(prompt.name, prompt.description);
});
```

### Get a Prompt

```tsx
const result = await mcp.getPrompt({
  serverId: 'my-server',
  name: 'code-review',
  arguments: {
    language: 'typescript',
    file: 'app.ts'
  }
});

console.log(result.messages);
```

## Event Handling

```tsx
import { mcpClient } from '@/mcp-client';

// Listen for connection changes
mcpClient.on('connection:status', (serverId, state) => {
  console.log(`Server ${serverId}:`, state.status);
  if (state.status === 'reconnecting') {
    console.log(`Retry attempt ${state.retryCount}`);
  }
});

// Listen for errors
mcpClient.on('connection:error', (serverId, error) => {
  console.error(`Server ${serverId} error:`, error);
});

// Listen for updates
mcpClient.on('tools:updated', (serverId, tools) => {
  console.log(`Tools updated for ${serverId}`);
});

mcpClient.on('resources:updated', (serverId, resources) => {
  console.log(`Resources updated for ${serverId}`);
});

mcpClient.on('prompts:updated', (serverId, prompts) => {
  console.log(`Prompts updated for ${serverId}`);
});
```

## Advanced Usage

### Direct Client Access

```tsx
import { mcpClient } from '@/mcp-client';

// Add multiple servers
const servers = [
  {
    id: 'fs-server',
    name: 'Filesystem',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '.']
  },
  {
    id: 'git-server',
    name: 'Git',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git']
  }
];

servers.forEach(config => mcpClient.addServer(config));

// Connect to all
await Promise.all(
  servers.map(s => mcpClient.connect(s.id))
);

// Get all tools from all servers
const allTools = await mcpClient.getAllTools();
```

### Custom Error Handling

```tsx
const server = useMCPServer({ serverId: 'my-server' });

try {
  await server.connect();
} catch (error) {
  console.error('Connection failed:', error);
}

// Check for errors
if (server.error) {
  console.error('Server error:', server.error);
}
```

## Electron IPC Setup

For stdio transport to work, you need to set up Electron IPC handlers in your main process:

```typescript
// main.js
import { ipcMain } from 'electron';
import { spawn } from 'child_process';

const mcpProcesses = new Map();

ipcMain.handle('mcp:connect', async (event, config) => {
  const process = spawn(config.command, config.args, {
    env: { ...process.env, ...config.env }
  });
  
  mcpProcesses.set(config.serverId, process);
  
  // Forward stdout to renderer
  process.stdout.on('data', (data) => {
    event.sender.send('mcp:message', config.serverId, data.toString());
  });
  
  return { success: true };
});

ipcMain.handle('mcp:send', async (event, serverId, message) => {
  const process = mcpProcesses.get(serverId);
  if (process) {
    process.stdin.write(JSON.stringify(message) + '\n');
  }
});

ipcMain.handle('mcp:disconnect', async (event, serverId) => {
  const process = mcpProcesses.get(serverId);
  if (process) {
    process.kill();
    mcpProcesses.delete(serverId);
  }
});
```

And in your preload script:

```typescript
// preload.js
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
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

## TypeScript Types

All types are exported for your convenience:

```typescript
import type {
  MCPServerConfig,
  MCPConnectionState,
  MCPServerInfo,
  Tool,
  Resource,
  Prompt,
  CallToolResult,
  ReadResourceResult,
  GetPromptResult
} from '@/mcp-client';
```

## API Reference

### `useMCPClient()`

Main hook for MCP client functionality.

**Returns:**
- `addServer(config)` - Add a server configuration
- `removeServer(serverId)` - Remove and disconnect a server
- `connect(serverId)` - Connect to a server
- `disconnect(serverId)` - Disconnect from a server
- `connectionStates` - Map of all connection states
- `isConnected(serverId)` - Check if connected
- `getTools(serverId, refresh?)` - Get tools from a server
- `getAllTools(refresh?)` - Get tools from all servers
- `callTool(params)` - Call a tool
- `getResources(serverId, refresh?)` - Get resources
- `getAllResources(refresh?)` - Get all resources
- `readResource(params)` - Read a resource
- `getPrompts(serverId, refresh?)` - Get prompts
- `getAllPrompts(refresh?)` - Get all prompts
- `getPrompt(params)` - Get a specific prompt
- `tools` - Cached tools map
- `resources` - Cached resources map
- `prompts` - Cached prompts map
- `servers` - Server configurations map

### `useMCPServer(options)`

Hook for managing a single server.

**Options:**
- `serverId` - Server ID
- `autoRefresh?` - Auto-refresh capabilities
- `refreshInterval?` - Refresh interval in ms

**Returns:**
- `connect()` - Connect to server
- `disconnect()` - Disconnect from server
- `connectionState` - Current connection state
- `isConnected` - Connection status
- `tools` - Available tools
- `refreshTools()` - Refresh tools list
- `callTool(name, args)` - Call a tool
- `resources` - Available resources
- `refreshResources()` - Refresh resources
- `readResource(uri)` - Read a resource
- `prompts` - Available prompts
- `refreshPrompts()` - Refresh prompts
- `getPrompt(name, args)` - Get a prompt
- `loading` - Loading states
- `error` - Last error

## Common MCP Servers

Here are some popular MCP servers you can use:

```bash
# Filesystem
npx -y @modelcontextprotocol/server-filesystem /path/to/dir

# Git
npx -y @modelcontextprotocol/server-git

# GitHub
npx -y @modelcontextprotocol/server-github

# Google Drive
npx -y @modelcontextprotocol/server-gdrive

# Slack
npx -y @modelcontextprotocol/server-slack

# PostgreSQL
npx -y @modelcontextprotocol/server-postgres
```

## License

MIT


