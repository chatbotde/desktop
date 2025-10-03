# MCP Client - Quick Reference

## Import

```tsx
import { useMCPClient, useMCPServer, mcpClient } from '@/mcp-client';
import type { MCPServerConfig, Tool, Resource, Prompt } from '@/mcp-client';
```

---

## useMCPClient Hook

### Setup
```tsx
const mcp = useMCPClient();
```

### Add Server
```tsx
mcp.addServer({
  id: 'my-server',
  name: 'My Server',
  type: 'stdio', // 'stdio' | 'sse' | 'streamable-http'
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
  autoConnect: true
});
```

### Connection
```tsx
await mcp.connect('server-id');
await mcp.disconnect('server-id');
await mcp.removeServer('server-id');
```

### Status
```tsx
mcp.isConnected('server-id')             // boolean
mcp.getConnectionState('server-id')      // MCPConnectionState
mcp.connectionStates                     // Map<string, MCPConnectionState>
mcp.servers                              // Map<string, MCPServerConfig>
```

### Tools
```tsx
await mcp.getTools('server-id')          // Tool[]
await mcp.getAllTools()                  // Map<string, Tool[]>
await mcp.callTool({
  serverId: 'server-id',
  name: 'tool-name',
  arguments: { arg: 'value' }
})                                        // CallToolResult
mcp.tools                                // Map<string, Tool[]>
```

### Resources
```tsx
await mcp.getResources('server-id')      // Resource[]
await mcp.getAllResources()              // Map<string, Resource[]>
await mcp.readResource({
  serverId: 'server-id',
  uri: 'file:///path'
})                                        // ReadResourceResult
mcp.resources                            // Map<string, Resource[]>
```

### Prompts
```tsx
await mcp.getPrompts('server-id')        // Prompt[]
await mcp.getAllPrompts()                // Map<string, Prompt[]>
await mcp.getPrompt({
  serverId: 'server-id',
  name: 'prompt-name',
  arguments: { arg: 'value' }
})                                        // GetPromptResult
mcp.prompts                              // Map<string, Prompt[]>
```

---

## useMCPServer Hook

### Setup
```tsx
const server = useMCPServer({
  serverId: 'my-server',
  autoRefresh: true,
  refreshInterval: 30000
});
```

### Connection
```tsx
await server.connect();
await server.disconnect();
server.isConnected                       // boolean
server.connectionState                   // MCPConnectionState
```

### Tools
```tsx
server.tools                             // Tool[]
await server.refreshTools();
await server.callTool('tool-name', {
  arg: 'value'
})                                        // CallToolResult
```

### Resources
```tsx
server.resources                         // Resource[]
await server.refreshResources();
await server.readResource('file:///path') // ReadResourceResult
```

### Prompts
```tsx
server.prompts                           // Prompt[]
await server.refreshPrompts();
await server.getPrompt('prompt-name', {
  arg: 'value'
})                                        // GetPromptResult
```

### State
```tsx
server.loading                           // { tools, resources, prompts }
server.error                             // Error | null
```

---

## Direct Client Access

```tsx
import { mcpClient } from '@/mcp-client';

// Add server
mcpClient.addServer(config);

// Events
mcpClient.on('connection:status', (serverId, state) => {});
mcpClient.on('connection:error', (serverId, error) => {});
mcpClient.on('tools:updated', (serverId, tools) => {});
mcpClient.on('resources:updated', (serverId, resources) => {});
mcpClient.on('prompts:updated', (serverId, prompts) => {});

// Methods
await mcpClient.connect('server-id');
await mcpClient.disconnect('server-id');
await mcpClient.getTools('server-id');
await mcpClient.callTool({ serverId, name, arguments });
// ... same as useMCPClient hook
```

---

## Server Config Types

### Local stdio Server
```tsx
{
  id: 'fs',
  name: 'Filesystem',
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
  env: { VAR: 'value' },
  autoConnect: true
}
```

### SSE Server
```tsx
{
  id: 'api',
  name: 'API Server',
  type: 'sse',
  url: 'https://example.com/mcp',
  headers: { 'Authorization': 'Bearer token' },
  autoConnect: true
}
```

### Streamable HTTP Server
```tsx
{
  id: 'http',
  name: 'HTTP Server',
  type: 'streamable-http',
  url: 'https://example.com/mcp',
  headers: { 'Authorization': 'Bearer token' },
  autoConnect: true
}
```

---

## Common Patterns

### Add Multiple Servers
```tsx
useEffect(() => {
  [
    { id: 'fs', type: 'stdio', command: 'npx', args: [...] },
    { id: 'git', type: 'stdio', command: 'npx', args: [...] }
  ].forEach(config => mcp.addServer({ ...config, autoConnect: true }));
}, []);
```

### Auto-Reconnect
```tsx
useEffect(() => {
  const handleStatus = (sid: string, state: any) => {
    if (state.status === 'error') {
      setTimeout(() => mcp.connect(sid), 5000);
    }
  };
  mcpClient.on('connection:status', handleStatus);
  return () => mcpClient.off('connection:status', handleStatus);
}, []);
```

### Search Tools
```tsx
const searchTools = async (query: string) => {
  const allTools = await mcp.getAllTools();
  const results: any[] = [];
  allTools.forEach((tools, serverId) => {
    tools.forEach(tool => {
      if (tool.name.includes(query)) {
        results.push({ ...tool, serverId });
      }
    });
  });
  return results;
};
```

### Batch Execute
```tsx
const results = await Promise.allSettled([
  mcp.callTool({ serverId: 'fs', name: 'read', arguments: {...} }),
  mcp.callTool({ serverId: 'git', name: 'status', arguments: {...} })
]);
```

---

## TypeScript Types

```tsx
type TransportType = 'stdio' | 'sse' | 'streamable-http';

interface MCPServerConfig {
  id: string;
  name: string;
  description?: string;
  type: TransportType;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  autoConnect?: boolean;
}

interface MCPConnectionState {
  serverId: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
  connectedAt?: Date;
  lastError?: Error;
}

interface Tool {
  name: string;
  description?: string;
  inputSchema: object;
}

interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

interface Prompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}
```

---

## Popular MCP Servers

```bash
# Filesystem
npx -y @modelcontextprotocol/server-filesystem /path

# Git
npx -y @modelcontextprotocol/server-git

# GitHub
npx -y @modelcontextprotocol/server-github

# PostgreSQL
npx -y @modelcontextprotocol/server-postgres postgresql://...

# SQLite
npx -y @modelcontextprotocol/server-sqlite /path/to/db

# Google Drive
npx -y @modelcontextprotocol/server-gdrive

# Slack
npx -y @modelcontextprotocol/server-slack
```

---

## Debugging

```tsx
// Enable all logging
mcpClient.on('connection:status', console.log);
mcpClient.on('connection:error', console.error);
mcpClient.on('tools:updated', console.log);
mcpClient.on('resources:updated', console.log);
mcpClient.on('prompts:updated', console.log);

// Check connection state
console.log(mcp.connectionStates);

// Check server error
console.log(server.error);

// Force refresh
await server.refreshTools();
await server.refreshResources();
await server.refreshPrompts();
```


