/**
 * MCP Process Manager
 * Manages MCP (Model Context Protocol) server processes
 * Follows: Single Responsibility Principle (SRP)
 */

const { spawn } = require('child_process');

class McpProcessManager {
  constructor() {
    this.processes = new Map();
    this.listeners = new Map();
  }

  /**
   * Connect to an MCP server
   * @param {Object} config - MCP server configuration
   * @param {string} config.serverId - Server identifier
   * @param {string} config.command - Command to execute
   * @param {Array} config.args - Command arguments
   * @param {Object} config.env - Environment variables
   * @param {Object} sender - Event sender for communication
   * @returns {Promise<Object>} Connection result
   */
  async connect(config, sender) {
    const { serverId, command, args = [], env = {} } = config;

    try {
      console.log(`McpProcessManager: Connecting to server ${serverId} with command: ${command} ${args.join(' ')}`);

      // Spawn the MCP server process
      const childProcess = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...env }
      });

      // Store the process
      this.processes.set(serverId, childProcess);

      // Set up output listeners
      childProcess.stdout.on('data', (data) => {
        const listener = this.listeners.get(serverId);
        if (listener && !listener.isDestroyed()) {
          listener.send('mcp:message', serverId, data.toString());
        }
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`MCP ${serverId} stderr:`, data.toString());
      });

      childProcess.on('close', (code) => {
        console.log(`MCP ${serverId} exited with code ${code}`);
        this.processes.delete(serverId);
        this.listeners.delete(serverId);
      });

      childProcess.on('error', (error) => {
        console.error(`MCP ${serverId} error:`, error);
      });

      // Store the sender for this server
      this.listeners.set(serverId, sender);

      return { success: true };
    } catch (error) {
      console.error(`McpProcessManager: Failed to start MCP ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Send message to MCP server
   * @param {string} serverId - Server identifier
   * @param {Object} message - Message to send
   */
  send(serverId, message) {
    const process = this.processes.get(serverId);

    if (!process) {
      throw new Error(`MCP server ${serverId} not found`);
    }

    try {
      const jsonMessage = JSON.stringify(message) + '\n';
      process.stdin.write(jsonMessage);
    } catch (error) {
      console.error(`McpProcessManager: Failed to send to MCP ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from MCP server
   * @param {string} serverId - Server identifier
   */
  disconnect(serverId) {
    const process = this.processes.get(serverId);

    if (process) {
      console.log(`McpProcessManager: Disconnecting MCP server ${serverId}`);
      process.kill();
      this.processes.delete(serverId);
      this.listeners.delete(serverId);
    }
  }

  /**
   * Disconnect all MCP servers
   */
  disconnectAll() {
    this.processes.forEach((process, serverId) => {
      console.log(`McpProcessManager: Killing MCP process ${serverId}`);
      process.kill();
    });
    this.processes.clear();
    this.listeners.clear();
  }

  /**
   * Get active servers
   * @returns {Array<string>} List of active server IDs
   */
  getActiveServers() {
    return Array.from(this.processes.keys());
  }

  /**
   * Check if server is connected
   * @param {string} serverId - Server identifier
   * @returns {boolean} True if connected
   */
  isConnected(serverId) {
    return this.processes.has(serverId);
  }
}

module.exports = { McpProcessManager };
