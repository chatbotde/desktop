# Quick MCP Setup - TL;DR

## ✅ What's Done
- 🎨 MCP UI in chat-input (button + modal)
- 🔧 JSON config parser
- 💾 LocalStorage persistence  
- 🎯 Complete React MCP client

## 🔨 What You Need to Do

### Step 1: Add to `buddy/main.js`

Copy this code to your main.js:

```javascript
const { ipcMain } = require('electron');
const { spawn } = require('child_process');

const mcpProcesses = new Map();

ipcMain.handle('mcp-connect', async (event, serverConfig) => {
  const { id, command, args = [], env = {} } = serverConfig;
  
  try {
    const childProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
      shell: true
    });

    mcpProcesses.set(id, childProcess);

    childProcess.stdout.on('data', (data) => {
      event.sender.send('mcp-message', { serverId: id, message: data.toString() });
    });

    childProcess.stderr.on('data', (data) => {
      event.sender.send('mcp-status', { serverId: id, status: 'error', error: data.toString() });
    });

    childProcess.on('exit', () => {
      mcpProcesses.delete(id);
      event.sender.send('mcp-status', { serverId: id, status: 'disconnected' });
    });

    event.sender.send('mcp-status', { serverId: id, status: 'connected' });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp-disconnect', async (event, serverId) => {
  const process = mcpProcesses.get(serverId);
  if (process) {
    process.kill();
    mcpProcesses.delete(serverId);
  }
  return { success: true };
});

app.on('quit', () => {
  mcpProcesses.forEach((process) => process.kill());
});
```

### Step 2: Test It!

```bash
npm start
```

### Step 3: Use It!

1. Click ⚙️ button in chat-input
2. Paste this:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

3. Click "Add Servers"
4. Click "Connect"
5. Done! 🎉

---

## 📚 Full Documentation

- **Setup Guide:** `buddy/chat-input/MCP_INTEGRATION_GUIDE.md`
- **Implementation:** `buddy/chat-input/MCP_IMPLEMENTATION_SUMMARY.md`
- **React Client:** `buddy/frontend/src/mcp-client/GET_STARTED.md`

---

## 🎯 Files Created

### Chat-Input (Paste & Connect UI)
- `chat-input/modules/mcp-manager.js` - Core logic
- `chat-input/css/mcp.css` - Styling
- `chat-input/chat-input.html` - UI (updated)
- `chat-input/chat-input-preload.js` - IPC (updated)

### Frontend (React MCP Client)
- `frontend/src/mcp-client/` - Complete MCP client
  - `index.ts` - Main export
  - `mcp-client.ts` - Client class
  - `hooks/useMCPClient.ts` - React hook
  - `hooks/useMCPServer.ts` - Server hook
  - Plus types, transports, examples, docs

---

**That's it! Add the code to main.js and you're ready to go! 🚀**

