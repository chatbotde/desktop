const { randomUUID } = require('crypto');

let Store;
try {
  Store = require('electron-store');
  if (Store?.default) {
    Store = Store.default;
  }
} catch {
  Store = null;
}

class McpStore {
  constructor() {
    this.memory = { servers: [] };

    if (!Store) {
      console.warn('McpStore: electron-store unavailable, using in-memory storage');
      return;
    }

    try {
      this.store = new Store({ name: 'mcp-servers' });
    } catch (err) {
      console.warn(
        'McpStore: electron-store init failed, using in-memory storage:',
        err instanceof Error ? err.message : err
      );
    }
  }

  getServers() {
    if (this.store) {
      return this.store.get('servers', []);
    }
    return this.memory.servers;
  }

  saveServers(servers) {
    if (this.store) {
      this.store.set('servers', servers);
    } else {
      this.memory.servers = servers;
    }
  }

  getServer(serverId) {
    return this.getServers().find((server) => server.id === serverId) ?? null;
  }

  addServer(config) {
    const servers = this.getServers();
    const server = {
      id: randomUUID(),
      name: config.name?.trim() || 'MCP Server',
      enabled: config.enabled !== false,
      transport: config.transport,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    servers.push(server);
    this.saveServers(servers);
    return server;
  }

  removeServer(serverId) {
    const servers = this.getServers();
    const next = servers.filter((server) => server.id !== serverId);
    if (next.length === servers.length) {
      return false;
    }
    this.saveServers(next);
    return true;
  }
}

module.exports = { McpStore };
