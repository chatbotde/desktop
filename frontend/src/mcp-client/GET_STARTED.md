# 🚀 Get Started with MCP Client

## ✅ What's Been Created

A complete, production-ready MCP (Model Context Protocol) client has been built in `buddy/frontend/src/mcp-client/` with the following features:

### Core Features
- ✅ **Multiple Transport Types**: stdio (local), SSE, and Streamable HTTP
- ✅ **React Hooks**: Easy integration with React components
- ✅ **TypeScript**: Fully typed with IntelliSense support
- ✅ **Multi-Server**: Connect to multiple MCP servers simultaneously
- ✅ **Auto-Reconnect**: Configurable retry logic
- ✅ **Caching**: Intelligent caching of tools, resources, and prompts
- ✅ **Event-Driven**: Real-time updates via event emitters
- ✅ **Electron-Ready**: Built for Electron apps with IPC support

### What You Can Do
- 🔧 Connect to any MCP server (local or online)
- 🛠️ List and execute tools
- 📄 Read resources
- 💬 Use prompts
- 🔄 Auto-refresh capabilities
- 📊 Monitor connection status

---

## 🎯 Next Steps to Use It

### Step 1: Set Up Electron IPC (Required for stdio servers)

Add this to your **main.js** or main process file:

```javascript
import { ipcMain } from 'electron';
import { spawn } from 'child_process';

const mcpProcesses = new Map();
const mcpListeners = new Map();

// MCP Connect
ipcMain.handle('mcp:connect', async (event, config) => {
  const { serverId, command, args = [], env = {} } = config;
  
  const childProcess = spawn(command, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env }
  });

  mcpProcesses.set(serverId, childProcess);

  childProcess.stdout.on('data', (data) => {
    const sender = mcpListeners.get(serverId);
    if (sender) {
      sender.send('mcp:message', serverId, data.toString());
    }
  });

  childProcess.stderr.on('data', (data) => {
    console.error(`MCP ${serverId} error:`, data.toString());
  });

  mcpListeners.set(serverId, event.sender);
  return { success: true };
});

// MCP Send
ipcMain.handle('mcp:send', async (event, serverId, message) => {
  const process = mcpProcesses.get(serverId);
  if (process) {
    process.stdin.write(JSON.stringify(message) + '\n');
  }
});

// MCP Disconnect
ipcMain.handle('mcp:disconnect', async (event, serverId) => {
  const process = mcpProcesses.get(serverId);
  if (process) {
    process.kill();
    mcpProcesses.delete(serverId);
    mcpListeners.delete(serverId);
  }
});
```

Add this to your **preload.js**:

```javascript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // ... your existing API ...
  
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

### Step 2: Use in Your React App

**Option A: Simple Usage**

```tsx
import { useMCPClient } from '@/mcp-client';

function App() {
  const mcp = useMCPClient();

  useEffect(() => {
    // Add a filesystem server
    mcp.addServer({
      id: 'fs',
      name: 'Filesystem',
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
      autoConnect: true
    });
  }, []);

  return <div>MCP Ready!</div>;
}
```

**Option B: Use Example Components**

```tsx
import { MCPServerManager } from '@/mcp-client/examples/MCPServerManager';
import { ToolExecutor } from '@/mcp-client/examples/ToolExecutor';

function App() {
  return (
    <div>
      {/* Full server management UI */}
      <MCPServerManager />
      
      {/* Or just tool executor */}
      <ToolExecutor serverId="fs" />
    </div>
  );
}
```

### Step 3: Install MCP Servers

Install the MCP servers you want to use:

```bash
# Popular servers (these run via npx, no installation needed)
npx -y @modelcontextprotocol/server-filesystem .
npx -y @modelcontextprotocol/server-git
npx -y @modelcontextprotocol/server-github

# Or install globally for faster startup
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-git
```

---

## 📖 Quick Examples

### Example 1: Read a File

```tsx
import { useMCPServer } from '@/mcp-client';

function ReadFile() {
  const server = useMCPServer({ serverId: 'fs' });

  const readFile = async () => {
    const result = await server.callTool('read_file', {
      path: 'package.json'
    });
    console.log(result.content[0].text);
  };

  return <button onClick={readFile}>Read package.json</button>;
}
```

### Example 2: Git Status

```tsx
import { useMCPClient } from '@/mcp-client';

function GitStatus() {
  const mcp = useMCPClient();
  const [status, setStatus] = useState('');

  const getStatus = async () => {
    const result = await mcp.callTool({
      serverId: 'git',
      name: 'git_status',
      arguments: {}
    });
    setStatus(result.content[0].text);
  };

  return (
    <div>
      <button onClick={getStatus}>Get Git Status</button>
      <pre>{status}</pre>
    </div>
  );
}
```

### Example 3: List All Available Tools

```tsx
import { useMCPClient } from '@/mcp-client';

function AllTools() {
  const mcp = useMCPClient();
  const [tools, setTools] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    mcp.getAllTools().then(setTools);
  }, [mcp.tools]);

  return (
    <div>
      {Array.from(tools).map(([serverId, serverTools]) => (
        <div key={serverId}>
          <h3>{serverId}</h3>
          {serverTools.map(tool => (
            <div key={tool.name}>
              {tool.name}: {tool.description}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

## 📚 Documentation Guide

| Document | When to Read |
|----------|--------------|
| **GET_STARTED.md** (this file) | Start here! |
| **INDEX.md** | Overview and file structure |
| **README.md** | Complete API documentation |
| **USAGE_GUIDE.md** | Step-by-step tutorials |
| **QUICK_REFERENCE.md** | Quick lookup while coding |
| **INTEGRATION_EXAMPLE.tsx** | Real-world integration patterns |

---

## 🎨 Try the Examples

### 1. Server Manager UI

```tsx
import { MCPServerManager } from '@/mcp-client/examples/MCPServerManager';

function App() {
  return <MCPServerManager />;
}
```

**Features:**
- Add/remove servers with a form
- Connect/disconnect buttons
- View connection status
- Browse tools, resources, and prompts
- See error messages

### 2. Tool Executor UI

```tsx
import { ToolExecutor } from '@/mcp-client/examples/ToolExecutor';

function App() {
  return <ToolExecutor serverId="fs" />;
}
```

**Features:**
- Select tools from dropdown
- Auto-generate input forms
- Execute tools with parameters
- View formatted results
- Error handling

---

## 🔧 Common Use Cases

### Use Case 1: Add to Chat System

```tsx
import { useMCPClient } from '@/mcp-client';

function ChatWithMCP() {
  const mcp = useMCPClient();

  const handleMessage = async (message: string) => {
    // If message asks to read a file
    if (message.includes('read file')) {
      const result = await mcp.callTool({
        serverId: 'fs',
        name: 'read_file',
        arguments: { path: extractPath(message) }
      });
      return result.content[0].text;
    }
  };

  return <ChatComponent onMessage={handleMessage} />;
}
```

### Use Case 2: Sidebar Panel

```tsx
import { MCPSidebarPanel } from '@/mcp-client/INTEGRATION_EXAMPLE';

function App() {
  return (
    <div className="flex">
      <MainContent />
      <MCPSidebarPanel />
    </div>
  );
}
```

### Use Case 3: Status Indicator

```tsx
import { useMCPClient } from '@/mcp-client';

function StatusIndicator() {
  const mcp = useMCPClient();
  
  const connected = Array.from(mcp.connectionStates.values())
    .filter(s => s.status === 'connected').length;

  return (
    <div className="status-bar">
      MCP: {connected}/{mcp.servers.size} connected
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Problem: "MCP API not available"

**Solution:** Make sure you've added the Electron IPC handlers (Step 1 above)

### Problem: Server won't connect

**Check:**
1. Is the command correct? (`npx` vs `node`)
2. Are the args correct? (check with `--help`)
3. Is the server installed? (try running the command directly)
4. Check the error: `connectionState.error`

### Problem: No tools showing up

**Solution:**
```tsx
// Force refresh
await server.refreshTools();

// Or get fresh data
const tools = await mcp.getTools('server-id', true);
```

---

## 🎓 Learn More

### Official Resources
- **MCP Spec**: https://modelcontextprotocol.io
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **MCP Registry**: https://github.com/modelcontextprotocol/registry

### Popular MCP Servers
- **Filesystem**: File operations
- **Git**: Git commands
- **GitHub**: GitHub API
- **PostgreSQL**: Database queries
- **SQLite**: SQLite databases
- **Google Drive**: Cloud storage
- **Slack**: Slack integration

---

## ✨ What's Next?

1. ✅ **Set up Electron IPC** (5 minutes)
2. ✅ **Try the example components** (2 minutes)
3. ✅ **Connect to your first server** (1 minute)
4. ✅ **Explore the API** with Quick Reference
5. ✅ **Integrate into your app** using Integration Examples

---

## 💬 Quick Start Commands

```bash
# Test a filesystem server directly
npx -y @modelcontextprotocol/server-filesystem .

# Test Git server
npx -y @modelcontextprotocol/server-git

# See all available servers
npm search @modelcontextprotocol/server-
```

---

## 🎯 Ready to Go!

Your MCP client is **ready to use**. Just:

1. Add Electron IPC handlers (see Step 1)
2. Import `useMCPClient` in your component
3. Add a server and start using tools!

**Need help?** Check the documentation files or example components.

**Happy coding!** 🚀


