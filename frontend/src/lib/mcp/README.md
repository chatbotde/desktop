# MCP Client Library

A comprehensive Model Context Protocol (MCP) client implementation for connecting to various MCP servers like Notion, Slack, GitHub, and more.

## 📁 Folder Structure

```
mcp/
├── core/                    # Core types and constants
│   ├── types.ts            # All TypeScript interfaces
│   ├── constants.ts        # Default values and server templates
│   └── index.ts
│
├── transports/             # Transport implementations
│   ├── base.ts             # Base transport interface
│   ├── stdio.ts            # Stdio transport (local servers)
│   ├── sse.ts              # SSE transport (remote servers)
│   ├── websocket.ts        # WebSocket transport (real-time)
│   └── index.ts
│
├── auth/                   # Authentication providers
│   ├── base.ts             # Base auth interface
│   ├── api-key.ts          # API key authentication
│   ├── oauth2.ts           # OAuth 2.0 flow
│   ├── bearer-token.ts     # Bearer token auth
│   ├── basic.ts            # HTTP Basic auth
│   ├── factory.ts          # Auth provider factory
│   └── index.ts
│
├── storage/                # Credential & config storage
│   ├── credentials.ts      # Secure credential storage
│   ├── servers.ts          # Server config storage
│   └── index.ts
│
├── clients/                # MCP client implementations
│   ├── unified-client.ts   # Single server client
│   ├── manager.ts          # Multi-server manager
│   └── index.ts
│
├── utils/                  # Utility functions
│   ├── server-factory.ts   # Create servers from templates
│   ├── helpers.ts          # General utilities
│   └── index.ts
│
└── index.ts               # Main exports
```

## 🚀 Quick Start

### Connect to a Template Server

```typescript
import { mcpClientManager, createServerFromTemplate } from '@/lib/mcp';

// Create a filesystem server
const config = createServerFromTemplate('filesystem', {
  path: 'C:/Users/Documents',
});

// Connect
const client = await mcpClientManager.connect(config);

// Use tools
const tools = await client.listTools();
const result = await client.callTool('read_file', { path: './readme.txt' });
```

### Connect to Slack

```typescript
import { mcpClientManager, createServerFromTemplate } from '@/lib/mcp';

const config = createServerFromTemplate('slack', {
  env: {
    SLACK_BOT_TOKEN: 'xoxb-your-token',
    SLACK_TEAM_ID: 'T01234567',
  },
});

const client = await mcpClientManager.connect(config);
const tools = await client.listTools();
```

### Connect to Notion

```typescript
import { mcpClientManager, createServerFromTemplate } from '@/lib/mcp';

const config = createServerFromTemplate('notion', {
  env: {
    NOTION_API_KEY: 'secret_xxx',
  },
});

const client = await mcpClientManager.connect(config);
```

### Connect to GitHub

```typescript
import { mcpClientManager, createServerFromTemplate } from '@/lib/mcp';

const config = createServerFromTemplate('github', {
  env: {
    GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_xxx',
  },
});

const client = await mcpClientManager.connect(config);
```

## 🔌 Supported Transports

| Transport | Description | Use Case |
|-----------|-------------|----------|
| `stdio` | Child process communication | Local MCP servers |
| `sse` | Server-Sent Events | Remote servers with streaming |
| `websocket` | WebSocket connection | Real-time bidirectional |
| `http` | HTTP requests | Simple remote servers |

## 🔐 Authentication Types

| Auth Type | Description | Example Services |
|-----------|-------------|------------------|
| `none` | No authentication | Local filesystem |
| `api_key` | API key in header | Notion, Brave Search |
| `oauth2` | OAuth 2.0 flow | Google Drive, Slack |
| `bearer_token` | Bearer token | GitHub |
| `basic` | Username/password | Some databases |

## 📦 Available Server Templates

| Template | Service | Auth Required |
|----------|---------|---------------|
| `filesystem` | Local files | No |
| `slack` | Slack | SLACK_BOT_TOKEN, SLACK_TEAM_ID |
| `github` | GitHub | GITHUB_PERSONAL_ACCESS_TOKEN |
| `gdrive` | Google Drive | OAuth2 |
| `braveSearch` | Brave Search | BRAVE_API_KEY |
| `postgres` | PostgreSQL | POSTGRES_CONNECTION_STRING |
| `memory` | AI Memory | No |
| `puppeteer` | Web Browser | No |
| `notion` | Notion | NOTION_API_KEY |
| `discord` | Discord | DISCORD_BOT_TOKEN |

## 🛠️ Custom Server Configuration

```typescript
import { mcpClientManager, type MCPServerConfig } from '@/lib/mcp';

const customServer: MCPServerConfig = {
  id: 'my-custom-server',
  name: 'My Custom Server',
  description: 'A custom MCP server',
  category: 'custom',
  transport: {
    type: 'stdio',
    command: 'node',
    args: ['./my-server.js'],
  },
  auth: {
    type: 'api_key',
    key: 'my-api-key',
  },
  env: {
    CUSTOM_VAR: 'value',
  },
};

const client = await mcpClientManager.connect(customServer);
```

## 📝 API Reference

### MCPClientManager

- `connect(config)` - Connect to a server
- `disconnect(serverId)` - Disconnect from a server
- `disconnectAll()` - Disconnect all servers
- `getClient(serverId)` - Get a client instance
- `getConnectedClients()` - Get all connected clients
- `listAllTools()` - List tools from all servers
- `callTool(serverId, toolName, args)` - Call a tool
- `listResources(serverId)` - List resources
- `readResource(serverId, uri)` - Read a resource
- `listPrompts(serverId)` - List prompts
- `getPrompt(serverId, name, args)` - Get a prompt

### MCPUnifiedClient

- `connect()` - Connect to the server
- `disconnect()` - Disconnect
- `listTools()` - List available tools
- `callTool(name, args)` - Call a tool
- `listResources()` - List resources
- `readResource(uri)` - Read a resource
- `listPrompts()` - List prompts
- `getPrompt(name, args)` - Get a prompt
- `getStatus()` - Get connection status

### Storage

- `mcpServerConfigStorage.addServer(config)` - Add a server
- `mcpServerConfigStorage.getServers()` - Get all servers
- `mcpServerConfigStorage.deleteServer(id)` - Delete a server
- `mcpCredentialStorage.saveServerCredentials(id, auth)` - Save credentials

## 🎯 Events

```typescript
mcpClientManager.on((event) => {
  switch (event.type) {
    case 'connecting':
      console.log(`Connecting to ${event.serverId}`);
      break;
    case 'connected':
      console.log(`Connected to ${event.serverName}`);
      break;
    case 'disconnected':
      console.log(`Disconnected: ${event.reason}`);
      break;
    case 'error':
      console.error(`Error:`, event.error);
      break;
    case 'tool-call':
      console.log(`Tool ${event.toolName} called`);
      break;
  }
});
```

## 🔧 Adding New Server Types

1. Add template to `core/constants.ts`:
```typescript
export const MCP_SERVER_TEMPLATES = {
  // ... existing templates
  myNewServer: {
    id: 'my-new-server',
    name: 'My New Server',
    description: 'Description here',
    icon: '🆕',
    category: 'custom' as const,
    transport: {
      type: 'stdio' as const,
      command: 'npx',
      args: ['-y', 'my-server-package'],
    },
    auth: { type: 'api_key' as const },
    requiredEnvVars: ['MY_API_KEY'],
  },
};
```

2. Use it:
```typescript
const config = createServerFromTemplate('myNewServer', {
  env: { MY_API_KEY: 'xxx' },
});
```
