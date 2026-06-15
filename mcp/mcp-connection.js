const { Client } = require('@modelcontextprotocol/sdk/client');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

const CLIENT_INFO = {
  name: 'sonicthinking-mcp-client',
  version: '1.0.0',
};

function normalizeStdioTransport(transport) {
  if (process.platform !== 'win32') {
    return transport;
  }

  const command = transport.command?.trim().toLowerCase();
  if (command !== 'npx' && command !== 'npx.cmd') {
    return transport;
  }

  return {
    ...transport,
    command: process.env.ComSpec || 'cmd.exe',
    args: ['/c', 'npx', ...(transport.args ?? [])],
  };
}

class McpConnection {
  constructor(serverConfig) {
    this.config = serverConfig;
    this.client = null;
    this.transport = null;
    this.status = 'disconnected';
    this.error = null;
    this.serverInfo = null;
  }

  getStatus() {
    return {
      serverId: this.config.id,
      name: this.config.name,
      status: this.status,
      error: this.error,
      serverInfo: this.serverInfo,
    };
  }

  async connect() {
    if (this.status === 'connected' && this.client) {
      return this.getStatus();
    }

    await this.disconnect();

    this.status = 'connecting';
    this.error = null;

    try {
      this.transport = this.createTransport();
      this.client = new Client(CLIENT_INFO);
      await this.client.connect(this.transport);

      this.serverInfo = this.client.getServerVersion?.() ?? null;
      this.status = 'connected';
      return this.getStatus();
    } catch (err) {
      this.status = 'error';
      this.error = err instanceof Error ? err.message : String(err);
      await this.disconnect();
      throw err;
    }
  }

  createTransport() {
    const transport = this.config.transport;

    if (!transport?.type) {
      throw new Error('MCP server transport type is required.');
    }

    if (transport.type === 'stdio') {
      const stdio = normalizeStdioTransport(transport);

      if (!stdio.command?.trim()) {
        throw new Error('Stdio transport requires a command.');
      }

      return new StdioClientTransport({
        command: stdio.command,
        args: stdio.args ?? [],
        env: stdio.env,
        cwd: stdio.cwd,
        stderr: 'pipe',
      });
    }

    if (transport.type === 'http') {
      if (!transport.url?.trim()) {
        throw new Error('HTTP transport requires a URL.');
      }

      const url = new URL(transport.url);
      const requestInit = transport.headers
        ? { headers: transport.headers }
        : undefined;

      return new StreamableHTTPClientTransport(url, { requestInit });
    }

    throw new Error(`Unsupported MCP transport type: ${transport.type}`);
  }

  ensureConnected() {
    if (!this.client || this.status !== 'connected') {
      throw new Error(`MCP server "${this.config.name}" is not connected.`);
    }
    return this.client;
  }

  async listTools() {
    const client = this.ensureConnected();
    const result = await client.listTools();
    return (result.tools ?? []).map((tool) => ({
      name: tool.name,
      description: tool.description ?? '',
      inputSchema: tool.inputSchema ?? { type: 'object', properties: {} },
    }));
  }

  async callTool(name, args) {
    const client = this.ensureConnected();
    return client.callTool({
      name,
      arguments: args ?? {},
    });
  }

  async disconnect() {
    if (this.client) {
      try {
        if (this.transport?.terminateSession) {
          await this.transport.terminateSession();
        }
        await this.client.close();
      } catch (err) {
        console.warn(`McpConnection: Error closing ${this.config.name}:`, err.message);
      }
    }

    this.client = null;
    this.transport = null;
    this.serverInfo = null;

    if (this.status !== 'error') {
      this.status = 'disconnected';
    }
  }
}

module.exports = { McpConnection };
