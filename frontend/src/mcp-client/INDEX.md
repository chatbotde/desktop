# MCP Client - Complete Implementation

## 📁 File Structure

```
mcp-client/
├── index.ts                          # Main export file
├── types.ts                          # TypeScript type definitions
├── mcp-client.ts                     # Core MCP client class
├── transport/
│   ├── electron-stdio-transport.ts   # Electron IPC stdio transport
│   └── http-transport.ts             # SSE & Streamable HTTP transports
├── hooks/
│   ├── useMCPClient.ts              # React hook for full client
│   └── useMCPServer.ts              # React hook for single server
├── examples/
│   ├── MCPServerManager.tsx         # Server management UI component
│   └── ToolExecutor.tsx             # Tool execution UI component
├── README.md                         # Full documentation
├── USAGE_GUIDE.md                   # Complete usage guide
├── QUICK_REFERENCE.md               # Quick reference cheat sheet
└── INDEX.md                         # This file
```

## 🚀 Quick Start

### 1. Import anywhere in your app:

```tsx
import { useMCPClient } from '@/mcp-client';
```

### 2. Use in a component:

```tsx
function MyComponent() {
  const mcp = useMCPClient();

  useEffect(() => {
    // Connect to a filesystem server
    mcp.addServer({
      id: 'fs',
      name: 'Filesystem',
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
      autoConnect: true
    });
  }, []);

  return <div>Ready!</div>;
}
```

## 📚 Documentation Files

| File | Description |
|------|-------------|
| **README.md** | Complete API documentation with examples |
| **USAGE_GUIDE.md** | Step-by-step guide for all features |
| **QUICK_REFERENCE.md** | Quick cheat sheet for common operations |
| **INDEX.md** | This file - overview and navigation |

## 🎯 Key Features

✅ **Multiple Transport Types**
- Local servers via stdio (Electron IPC)
- Remote servers via SSE
- Remote servers via Streamable HTTP

✅ **React Integration**
- `useMCPClient()` - Full client hook
- `useMCPServer()` - Single server hook
- Real-time state updates

✅ **TypeScript**
- Fully typed API
- IntelliSense support
- Type-safe events

✅ **Connection Management**
- Auto-connect
- Auto-reconnect
- Error handling
- Connection state tracking

✅ **Capabilities**
- Tools (list, call)
- Resources (list, read)
- Prompts (list, get)
- Caching & refresh

## 🔧 Setup Required

### Before using MCP Client, you need to:

1. ✅ **Install MCP SDK** (Already done - `@modelcontextprotocol/sdk@^1.18.1`)

2. 🔨 **Add Electron IPC handlers** to your main process (see USAGE_GUIDE.md)

3. 🔨 **Update preload script** to expose MCP API (see USAGE_GUIDE.md)

The Electron API types are already defined in `types/electron.d.ts`.

## 📖 Usage Examples

### Example 1: Basic Connection

```tsx
import { useMCPClient } from '@/mcp-client';

function App() {
  const mcp = useMCPClient();
  
  useEffect(() => {
    mcp.addServer({
      id: 'fs',
      name: 'Filesystem',
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
      autoConnect: true
    });
  }, []);

  return (
    <div>
      {Array.from(mcp.connectionStates).map(([id, state]) => (
        <div key={id}>{id}: {state.status}</div>
      ))}
    </div>
  );
}
```

### Example 2: Using Tools

```tsx
import { useMCPServer } from '@/mcp-client';

function Tools() {
  const server = useMCPServer({ serverId: 'fs' });

  const readFile = async () => {
    const result = await server.callTool('read_file', {
      path: 'package.json'
    });
    console.log(result);
  };

  return (
    <div>
      <button onClick={readFile}>Read File</button>
      <div>Tools: {server.tools.length}</div>
    </div>
  );
}
```

### Example 3: Multiple Servers

```tsx
function MultiServer() {
  const mcp = useMCPClient();

  useEffect(() => {
    ['filesystem', 'git', 'github'].forEach(name => {
      mcp.addServer({
        id: name,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        type: 'stdio',
        command: 'npx',
        args: [`-y`, `@modelcontextprotocol/server-${name}`],
        autoConnect: true
      });
    });
  }, []);

  const getAllTools = async () => {
    const tools = await mcp.getAllTools();
    console.log('All tools:', tools);
  };

  return <button onClick={getAllTools}>Get All Tools</button>;
}
```

## 🎨 Example Components

Two ready-to-use example components are provided in `examples/`:

### MCPServerManager
A complete UI for managing MCP servers:
- Add/remove servers
- Connect/disconnect
- View connection status
- Browse tools, resources, prompts

```tsx
import { MCPServerManager } from '@/mcp-client/examples/MCPServerManager';

function App() {
  return <MCPServerManager />;
}
```

### ToolExecutor
A UI for executing MCP tools:
- Select and execute tools
- Dynamic form generation
- Result display
- Error handling

```tsx
import { ToolExecutor } from '@/mcp-client/examples/ToolExecutor';

function App() {
  return <ToolExecutor serverId="fs" />;
}
```

## 🔌 Transport Types

### stdio (Local Servers)
```tsx
{
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
  env: { NODE_ENV: 'production' }
}
```

### SSE (Server-Sent Events)
```tsx
{
  type: 'sse',
  url: 'https://api.example.com/mcp',
  headers: { 'Authorization': 'Bearer token' }
}
```

### Streamable HTTP (Modern)
```tsx
{
  type: 'streamable-http',
  url: 'https://api.example.com/mcp',
  headers: { 'Authorization': 'Bearer token' }
}
```

## 🎯 Common Use Cases

| Use Case | Hook | Method |
|----------|------|--------|
| Connect to server | `useMCPClient()` | `addServer()` |
| List all tools | `useMCPClient()` | `getAllTools()` |
| Call a tool | `useMCPServer()` | `callTool()` |
| Read a resource | `useMCPServer()` | `readResource()` |
| Get a prompt | `useMCPServer()` | `getPrompt()` |
| Monitor status | `useMCPClient()` | `connectionStates` |

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "MCP API not available" | Set up Electron IPC handlers |
| Server won't connect | Check command, args, and PATH |
| Tools not showing | Call `refreshTools()` |
| Connection drops | Implement auto-reconnect |

See USAGE_GUIDE.md for detailed troubleshooting.

## 📦 Popular MCP Servers

```bash
# Filesystem access
npx -y @modelcontextprotocol/server-filesystem /path/to/dir

# Git operations
npx -y @modelcontextprotocol/server-git

# GitHub integration
npx -y @modelcontextprotocol/server-github

# Database access
npx -y @modelcontextprotocol/server-postgres postgresql://...
npx -y @modelcontextprotocol/server-sqlite /path/to/db.sqlite

# Cloud services
npx -y @modelcontextprotocol/server-gdrive
npx -y @modelcontextprotocol/server-slack
```

## 🔗 API Reference

### Hooks
- `useMCPClient()` - Main client hook
- `useMCPServer(options)` - Single server hook

### Classes
- `MCPClient` - Core client class
- `ElectronStdioTransport` - Stdio transport
- `SSETransport` - SSE transport
- `StreamableHTTPTransport` - HTTP transport

### Types
- `MCPServerConfig` - Server configuration
- `MCPConnectionState` - Connection state
- `Tool`, `Resource`, `Prompt` - MCP primitives
- `CallToolResult`, `ReadResourceResult`, `GetPromptResult` - Results

See README.md for complete API documentation.

## 🌐 Resources

- **MCP Specification**: https://modelcontextprotocol.io
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **MCP Registry**: https://github.com/modelcontextprotocol/registry
- **Electron Docs**: https://www.electronjs.org/docs/latest/api

## 📝 Next Steps

1. ✅ Set up Electron IPC handlers (see USAGE_GUIDE.md)
2. ✅ Try the example components
3. ✅ Connect to your first MCP server
4. ✅ Explore the API with the Quick Reference

## 💡 Tips

- Start with `useMCPClient()` for simple use cases
- Use `useMCPServer()` for focused server interaction
- Enable auto-refresh for real-time updates
- Use event listeners for monitoring
- Check `connectionState.error` for debugging
- Cache tools/resources to reduce API calls

---

**Built with ❤️ for sonicplane**


