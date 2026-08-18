const { McpStore } = require('./mcp-store');
const { McpConnection } = require('./mcp-connection');
const {
  ensureCuaDriverMcpServer,
  getCuaDriverStatus,
  runCuaDriverSmokeTest,
} = require('./cua-driver');

class McpClient {
  constructor(ipcRegistry) {
    this.ipcRegistry = ipcRegistry;
    this.store = new McpStore();
    /** @type {Map<string, McpConnection>} */
    this.connections = new Map();
  }

  setup() {
    this.registerIpcHandlers();
    this.ensureCuaDriverServer();
  }

  ensureCuaDriverServer() {
    try {
      const ensured = ensureCuaDriverMcpServer(this.store);
      if (ensured?.created) {
        console.log('[CuaDriver] Registered MCP server:', ensured.server.id);
      } else if (ensured) {
        console.log('[CuaDriver] MCP server already registered:', ensured.server.id);
      } else {
        console.log('[CuaDriver] Not installed — agent will fall back to robotjs until cua-driver is available.');
      }
    } catch (err) {
      console.warn('[CuaDriver] Failed to auto-register MCP server:', err instanceof Error ? err.message : err);
    }
  }

  getConnection(serverId) {
    const config = this.store.getServer(serverId);
    if (!config) {
      throw new Error('MCP server not found.');
    }

    let connection = this.connections.get(serverId);
    if (!connection || connection.config.updatedAt !== config.updatedAt) {
      connection = new McpConnection(config);
      this.connections.set(serverId, connection);
    }

    return connection;
  }

  async connectServer(serverId) {
    const connection = this.getConnection(serverId);
    return connection.connect();
  }

  async disconnectServer(serverId) {
    const connection = this.connections.get(serverId);
    if (!connection) {
      return { serverId, status: 'disconnected' };
    }

    await connection.disconnect();
    this.connections.delete(serverId);
    return connection.getStatus();
  }

  registerIpcHandlers() {
    this.ipcRegistry.register('mcp:list-servers', async () => {
      const servers = this.store.getServers();
      return servers.map((server) => {
        const connection = this.connections.get(server.id);
        return {
          ...server,
          connection: connection?.getStatus() ?? {
            serverId: server.id,
            name: server.name,
            status: 'disconnected',
            error: null,
            serverInfo: null,
          },
        };
      });
    });

    this.ipcRegistry.register('mcp:add-server', async (_event, config) => {
      if (!config?.transport?.type) {
        throw new Error('Transport configuration is required.');
      }
      return this.store.addServer(config);
    });

    this.ipcRegistry.register('mcp:remove-server', async (_event, serverId) => {
      await this.disconnectServer(serverId);
      const removed = this.store.removeServer(serverId);
      if (!removed) {
        throw new Error('MCP server not found.');
      }
      return { success: true };
    });

    this.ipcRegistry.register('mcp:connect', async (_event, serverId) => {
      return this.connectServer(serverId);
    });

    this.ipcRegistry.register('mcp:disconnect', async (_event, serverId) => {
      return this.disconnectServer(serverId);
    });

    this.ipcRegistry.register('mcp:list-tools', async (_event, serverId) => {
      const connection = this.getConnection(serverId);
      await connection.connect();
      return connection.listTools();
    });

    this.ipcRegistry.register('mcp:call-tool', async (_event, { serverId, name, args }) => {
      const connection = this.getConnection(serverId);
      await connection.connect();
      return connection.callTool(name, args);
    });

    this.ipcRegistry.register('cua:get-status', async () => {
      return getCuaDriverStatus(this.store);
    });

    this.ipcRegistry.register('cua:ensure-server', async () => {
      const ensured = ensureCuaDriverMcpServer(this.store);
      if (!ensured) {
        return { ok: false, error: 'cua-driver not found on this machine.' };
      }
      return { ok: true, serverId: ensured.server.id, created: ensured.created };
    });

    this.ipcRegistry.register('cua:smoke-test', async () => {
      return runCuaDriverSmokeTest(this);
    });
  }

  async disconnectAll() {
    const ids = [...this.connections.keys()];
    for (const serverId of ids) {
      await this.disconnectServer(serverId);
    }
  }
}

module.exports = { McpClient };
