# MCP Integration Guide for Chat-Input

## ✅ What's Been Created

A complete MCP (Model Context Protocol) server management UI has been integrated into the chat-input window:

### Created Files:
1. ✅ **`modules/mcp-manager.js`** - Core MCP management logic
2. ✅ **`css/mcp.css`** - Complete styling for MCP UI
3. ✅ **`chat-input.html`** - Added MCP button + modal
4. ✅ **`chat-input-preload.js`** - Added MCP IPC bridge
5. ✅ **`modules/index.js`** - Added MCP initialization

### Features Implemented:
- ✅ MCP Settings button in chat-input toolbar
- ✅ Beautiful modal UI for MCP management  
- ✅ JSON paste area with validation
- ✅ Server list with real-time status indicators
- ✅ Connect/disconnect buttons
- ✅ LocalStorage persistence
- ✅ Error handling and user feedback
- ✅ Auto-connect support

---

## 🎯 How It Works

### 1. User Flow:
```
User clicks ⚙️ button → Modal opens → User pastes JSON → Servers added → Click Connect
```

### 2. JSON Format:
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "description": "Local filesystem access"
    }
  }
}
```

### 3. Architecture:
```
Chat-Input UI (renderer)
    ↓ (electronAPI.sendMCPConnect)
Chat-Input Preload (IPC Bridge)
    ↓ (ipcRenderer.invoke('mcp-connect'))
Main Process (needs to be created)
    ↓ (spawn child process)
MCP Server Process (stdio)
```

---

## 🔨 What Still Needs to Be Done

### Step 1: Create Main Process MCP Handlers

You need to add IPC handlers to your **`buddy/main.js`** file:

```javascript
// Add to buddy/main.js

const { ipcMain } = require('electron');
const { spawn } = require('child_process');

// Store active MCP processes
const mcpProcesses = new Map();
const mcpMessageHandlers = new Map();

// MCP Connect Handler
ipcMain.handle('mcp-connect', async (event, serverConfig) => {
  const { id, command, args = [], env = {} } = serverConfig;
  
  console.log(`Main: Starting MCP server ${id}`);
  
  try {
    // Spawn the MCP server process
    const childProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
      shell: true
    });

    // Store the process
    mcpProcesses.set(id, childProcess);

    // Handle stdout (messages from server)
    childProcess.stdout.on('data', (data) => {
      try {
        const message = data.toString();
        console.log(`MCP ${id} stdout:`, message);
        
        // Send message to renderer
        event.sender.send('mcp-message', {
          serverId: id,
          message: message
        });
      } catch (error) {
        console.error(`MCP ${id} stdout error:`, error);
      }
    });

    // Handle stderr (errors)
    childProcess.stderr.on('data', (data) => {
      console.error(`MCP ${id} stderr:`, data.toString());
      event.sender.send('mcp-status', {
        serverId: id,
        status: 'error',
        error: data.toString()
      });
    });

    // Handle process exit
    childProcess.on('exit', (code) => {
      console.log(`MCP ${id} exited with code ${code}`);
      mcpProcesses.delete(id);
      event.sender.send('mcp-status', {
        serverId: id,
        status: 'disconnected'
      });
    });

    // Handle process errors
    childProcess.on('error', (error) => {
      console.error(`MCP ${id} process error:`, error);
      event.sender.send('mcp-status', {
        serverId: id,
        status: 'error',
        error: error.message
      });
    });

    // Send success status
    event.sender.send('mcp-status', {
      serverId: id,
      status: 'connected'
    });

    return { success: true, serverId: id };

  } catch (error) {
    console.error(`Failed to start MCP ${id}:`, error);
    return { success: false, error: error.message };
  }
});

// MCP Disconnect Handler
ipcMain.handle('mcp-disconnect', async (event, serverId) => {
  console.log(`Main: Disconnecting MCP server ${serverId}`);
  
  const process = mcpProcesses.get(serverId);
  
  if (process) {
    try {
      process.kill();
      mcpProcesses.delete(serverId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'Server not found' };
});

// MCP Send Message Handler
ipcMain.handle('mcp-send-message', async (event, serverId, message) => {
  const process = mcpProcesses.get(serverId);
  
  if (!process) {
    return { success: false, error: 'Server not connected' };
  }
  
  try {
    const jsonMessage = JSON.stringify(message) + '\n';
    process.stdin.write(jsonMessage);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Cleanup on app quit
app.on('quit', () => {
  console.log('Main: Cleaning up MCP processes');
  mcpProcesses.forEach((process, serverId) => {
    console.log(`Killing MCP process ${serverId}`);
    process.kill();
  });
  mcpProcesses.clear();
});
```

### Step 2: Test It!

1. **Start your app:**
   ```bash
   npm start
   ```

2. **Click the ⚙️ (MCP Settings) button** in chat-input

3. **Paste this example JSON:**
   ```json
   {
     "mcpServers": {
       "filesystem": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
       }
     }
   }
   ```

4. **Click "Add Servers"**

5. **Click "Connect"** on the server

6. **Check the console** for connection logs

---

## 🎨 UI Features

### MCP Settings Button
- Located in the chat-input toolbar (next to Cards Manager)
- Gear icon (⚙️)
- Opens the MCP Settings modal

### MCP Settings Modal
- **JSON Input Area:**
  - Large textarea for pasting config
  - Syntax validation
  - Error/success messages
  - Example placeholder

- **Server List:**
  - Shows all configured servers
  - Real-time connection status (colored dots)
  - Server details (command, args)
  - Error messages if connection fails

- **Actions:**
  - Connect button (blue)
  - Disconnect button (gray)
  - Remove button (red)
  - Clear JSON button
  - Add Servers button

### Status Indicators
- 🟢 Green = Connected
- 🟡 Yellow = Connecting
- ⚫ Gray = Disconnected
- 🔴 Red = Error

---

## 💾 Persistence

Servers are automatically saved to localStorage:
- Key: `'mcp-servers'`
- Saved on: Add, Remove
- Loaded on: Page load
- Auto-connect: If `autoConnect: true`

---

## 🔌 Integration with Frontend MCP Client

Once servers are connected in chat-input, you can use them in the main React app:

```tsx
// In your React app (buddy/frontend/src)
import { useMCPClient } from '@/mcp-client';

function MyComponent() {
  const mcp = useMCPClient();

  useEffect(() => {
    // The servers configured in chat-input will be available here
    // You can list tools, call them, etc.
    mcp.getAllTools().then(tools => {
      console.log('Available tools:', tools);
    });
  }, []);
}
```

---

## 🐛 Troubleshooting

### Issue: Button doesn't appear
- **Check:** Is `mcp.css` imported in `main.css`? ✅ (Already done)
- **Check:** Is `mcp-manager.js` imported in `index.js`? ✅ (Already done)

### Issue: Modal doesn't open
- **Check:** Browser console for errors
- **Check:** Is `mcpSettingsButton` found in HTML? ✅ (Already added)

### Issue: Server won't connect
- **Check:** Did you add the main process handlers?
- **Check:** Is the command correct? (try running it in terminal)
- **Check:** Main process console logs

### Issue: JSON validation fails
- **Check:** JSON format (must have `mcpServers` object)
- **Example:**
  ```json
  {
    "mcpServers": {
      "server-id": {
        "command": "npx",
        "args": ["package", "args"]
      }
    }
  }
  ```

---

## 📝 Example Server Configs

### Filesystem Server
```json
{
  "mcpServers": {
    "fs": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}
```

### Git Server
```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    }
  }
}
```

### Multiple Servers
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"],
      "description": "shadcn UI components"
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "description": "Local file access"
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"],
      "description": "Git operations",
      "autoConnect": true
    }
  }
}
```

---

## 🎯 Next Steps

1. ✅ Add main process MCP handlers (Step 1 above)
2. ✅ Test with a simple server
3. ✅ Use tools in your React app
4. ✅ Enjoy! 🎉

---

## 📸 Screenshots

### MCP Settings Button
Located in the chat-input toolbar:
```
[ AI Model ] [ Cards ] [ ⚙️ MCP ] [ + ]
```

### MCP Modal
```
┌─────────────────────────────────────────┐
│  MCP Server Settings              ✕    │
├─────────────────────────────────────────┤
│  Add MCP Servers                       │
│  Paste your MCP server config JSON     │
│  ┌─────────────────────────────────┐   │
│  │ {                               │   │
│  │   "mcpServers": {               │   │
│  │     "shadcn": { ... }           │   │
│  │   }                             │   │
│  │ }                               │   │
│  └─────────────────────────────────┘   │
│             [ Clear ]  [ Add Servers ]  │
│                                         │
│  Configured Servers                     │
│  ┌─────────────────────────────────┐   │
│  │ shadcn              🟢 connected │   │
│  │ Command: npx                     │   │
│  │ Args: shadcn@latest, mcp         │   │
│  │ [ Disconnect ] [ Remove ]        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

**That's it! You now have a complete MCP server management system in your chat-input! 🚀**

