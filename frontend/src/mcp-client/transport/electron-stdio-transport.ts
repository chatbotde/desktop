/**
 * Electron-based StdIO Transport for MCP
 * Uses Electron IPC to communicate with stdio-based MCP servers
 */

import { EventEmitter } from 'events';

export interface ElectronStdioTransportOptions {
  serverId: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Transport that communicates with MCP servers via Electron IPC
 * The main process will handle the actual stdio communication
 */
export class ElectronStdioTransport extends EventEmitter {
  private serverId: string;
  private command: string;
  private args: string[];
  private env: Record<string, string>;
  private connected: boolean = false;

  constructor(options: ElectronStdioTransportOptions) {
    super();
    this.serverId = options.serverId;
    this.command = options.command;
    this.args = options.args || [];
    this.env = options.env || {};
  }

  async start(): Promise<void> {
    if (!window.api?.mcpConnect) {
      throw new Error('MCP API not available in Electron context');
    }

    try {
      // Request main process to start the MCP server
      await window.api.mcpConnect({
        serverId: this.serverId,
        command: this.command,
        args: this.args,
        env: this.env
      });

      // Listen for messages from the server
      if (window.api.onMcpMessage) {
        window.api.onMcpMessage(this.serverId, (message: any) => {
          this.emit('message', message);
        });
      }

      this.connected = true;
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async send(message: any): Promise<void> {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }

    if (!window.api?.mcpSend) {
      throw new Error('MCP API not available');
    }

    try {
      await window.api.mcpSend(this.serverId, message);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (!this.connected) return;

    if (window.api?.mcpDisconnect) {
      await window.api.mcpDisconnect(this.serverId);
    }

    this.connected = false;
    this.emit('disconnected');
    this.removeAllListeners();
  }

  isConnected(): boolean {
    return this.connected;
  }
}


