# MCP Client

Model Context Protocol (MCP) client implementation for connecting to MCP servers and interacting with tools, resources, and prompts.

## Installation

The MCP SDK is already installed as a dependency. If you need to reinstall:

```bash
npm install @modelcontextprotocol/sdk --legacy-peer-deps
```

## Quick Start

### Basic Connection

```typescript
import { mcpService } from '@/lib/mcp';

// Connect to an MCP server using stdio transport
const client = await mcpService.connect({
  name: 'filesystem-server',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/directory'],
});

// Check connection status
const status = client.getStatus();
console.log('Connected:', status.connected);
```

### List and Use Tools

```typescript
// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Call a tool
const result = await client.callTool('read_file', {
  path: '/path/to/file.txt',
});

console.log('Tool result:', result.content);
```

### Work with Resources

```typescript
// List available resources
const resources = await mcpService.listResources('filesystem-server');
console.log('Resources:', resources.resources);

// Read a resource
const resource = await mcpService.readResource('filesystem-server', 'file:///path/to/file.txt');
console.log('Resource content:', resource.contents);
```

### Use Prompts

```typescript
// List available prompts
const prompts = await mcpService.listPrompts('filesystem-server');
console.log('Prompts:', prompts.prompts);

// Get a prompt
const prompt = await mcpService.getPrompt('filesystem-server', 'summarize', {
  file: '/path/to/file.txt',
});
console.log('Prompt messages:', prompt.messages);
```

### Event Handling

```typescript
// Listen to client events
client.on('event', (event) => {
  switch (event.type) {
    case 'connected':
      console.log(`Connected to ${event.serverName}`);
      break;
    case 'disconnected':
      console.log('Disconnected:', event.reason);
      break;
    case 'error':
      console.error('Error:', event.error);
      break;
    case 'tool-call':
      console.log(`Tool ${event.toolName} called:`, event.result);
      break;
  }
});
```

### Disconnect

```typescript
// Disconnect from a specific server
await mcpService.disconnect('filesystem-server');

// Or disconnect all servers
await mcpService.disconnectAll();
```

## Server Configuration

### Stdio Transport

```typescript
const config: MCPServerConfig = {
  name: 'my-server',
  transport: 'stdio',
  command: 'node',
  args: ['server.js'],
  env: {
    NODE_ENV: 'production',
  },
};
```

### HTTP/SSE Transport (Not yet implemented)

HTTP and SSE transports are planned for future implementation.

## Service API

The `mcpService` singleton provides a convenient way to manage multiple MCP server connections:

- `connect(config)` - Connect to a server
- `disconnect(name)` - Disconnect from a server
- `disconnectAll()` - Disconnect from all servers
- `getClient(name)` - Get a client instance
- `getConnectedClients()` - Get all connected clients
- `getStatuses()` - Get status for all servers
- `listAllTools()` - List tools from all servers
- `callTool(serverName, toolName, args)` - Call a tool on a specific server
- `listResources(serverName, uri?)` - List resources
- `readResource(serverName, uri)` - Read a resource
- `listPrompts(serverName)` - List prompts
- `getPrompt(serverName, promptName, args?)` - Get a prompt

## Types

All types are exported from `@/lib/mcp`:

- `MCPServerConfig` - Server configuration
- `MCPConnectionStatus` - Connection status
- `MCPTool` - Tool definition
- `MCPResource` - Resource definition
- `MCPPrompt` - Prompt definition
- `MCPCallToolResult` - Tool call result
- `MCPClientEvent` - Client event types

## Examples

### Example: File System Server

```typescript
import { mcpService } from '@/lib/mcp';

// Connect to filesystem MCP server
const client = await mcpService.connect({
  name: 'fs-server',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
});

// List files in a directory
const tools = await client.listTools();
const readFileTool = tools.find(t => t.name === 'read_file');

if (readFileTool) {
  const result = await client.callTool('read_file', {
    path: './package.json',
  });
  console.log('File content:', result.content[0].text);
}
```

### Example: Multiple Servers

```typescript
import { mcpService } from '@/lib/mcp';

// Connect to multiple servers
await mcpService.connect({
  name: 'server1',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path1'],
});

await mcpService.connect({
  name: 'server2',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path2'],
});

// List all tools from all servers
const allTools = await mcpService.listAllTools();
console.log('All tools:', allTools);

// Call a tool on a specific server
const result = await mcpService.callTool('server1', 'read_file', {
  path: '/path1/file.txt',
});
```

## Error Handling

Always wrap MCP operations in try-catch blocks:

```typescript
try {
  const client = await mcpService.connect(config);
  const result = await client.callTool('tool_name', {});
} catch (error) {
  console.error('MCP error:', error);
  // Handle error appropriately
}
```

## Notes

- The client automatically handles connection initialization when `connect()` is called
- The client supports automatic reconnection (up to 3 attempts by default)
- All operations are asynchronous and return Promises
- The service maintains a singleton instance for managing multiple connections

